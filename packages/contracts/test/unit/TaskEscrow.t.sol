// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/AgentRegistry.sol";
import "../../src/core/TaskEscrow.sol";
import "../../src/core/ReputationContract.sol";
import "../../src/libraries/CapabilityLib.sol";
import "../../src/libraries/GhostNodeLib.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract TaskEscrowTest is Test {

    AgentRegistry      public registry;
    TaskEscrow         public escrow;
    ReputationContract public reputation;
    MockUSDC           public usdc;

    address public owner    = address(0x1);
    address public operator = address(0x2);
    address public consumer = address(0x3);
    address public feeRecipient = address(0x4);

    uint256 public agentId;
    uint256 public constant PRICE = 1 * 1e6; // $1 USDC

    bytes32[] public capabilities;

    function setUp() public {
        // Deploy contracts
        usdc       = new MockUSDC();
        registry   = new AgentRegistry(address(usdc), owner);
        reputation = new ReputationContract(address(registry), owner);
        escrow     = new TaskEscrow(address(usdc), address(registry), feeRecipient, owner);

        // Wire contracts
        vm.startPrank(owner);
        escrow.setReputation(address(reputation));
        reputation.setAuthorizedCaller(address(escrow), true);
        registry.setAuthorizedSlasher(address(escrow), true);
        vm.stopPrank();

        // Fund wallets
        usdc.mint(operator, 1000 * 1e6);
        usdc.mint(consumer, 1000 * 1e6);

        // Register agent
        capabilities.push(CapabilityLib.ONCHAIN_DATA_FETCHING);

        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        agentId = registry.registerAgent(
            "ipfs://metadata",
            capabilities,
            PRICE,
            9500,
            address(0x99)
        );
        vm.stopPrank();
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    function _submitTask() internal returns (uint256 taskId) {
        vm.startPrank(consumer);
        usdc.approve(address(escrow), PRICE);
        taskId = escrow.submitTask(agentId, keccak256("task params"));
        vm.stopPrank();
    }

    function _commitResult(uint256 taskId, bytes memory result, bytes32 salt) internal {
        bytes32 commitHash = keccak256(abi.encodePacked(result, salt));
        vm.prank(operator);
        escrow.commitResult(taskId, commitHash);
    }

    function _revealResult(uint256 taskId, bytes memory result, bytes32 salt) internal {
        vm.prank(operator);
        escrow.revealResult(taskId, result, salt);
    }

    // ─── submitTask ───────────────────────────────────────────────────────────

    function test_SubmitTask_Success() public {
        uint256 consumerBalBefore = usdc.balanceOf(consumer);

        uint256 taskId = _submitTask();

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(task.consumer, consumer);
        assertEq(task.operator, operator);
        assertEq(task.payment, PRICE);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.CREATED));
        assertEq(usdc.balanceOf(consumer), consumerBalBefore - PRICE);
        assertEq(usdc.balanceOf(address(escrow)), PRICE);
    }

    function test_SubmitTask_RevertIfAgentInactive() public {
        vm.prank(operator);
        registry.deactivateAgent(agentId);

        vm.startPrank(consumer);
        usdc.approve(address(escrow), PRICE);
        vm.expectRevert(ITaskEscrow.AgentNotActive.selector);
        escrow.submitTask(agentId, keccak256("task params"));
        vm.stopPrank();
    }

    // ─── commitResult ─────────────────────────────────────────────────────────

    function test_CommitResult_Success() public {
        uint256 taskId = _submitTask();

        bytes memory result = bytes('{"data": "test"}');
        bytes32 salt = keccak256("random salt");
        bytes32 commitHash = keccak256(abi.encodePacked(result, salt));

        vm.prank(operator);
        escrow.commitResult(taskId, commitHash);

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.COMMITTED));
        assertEq(task.resultCommit, commitHash);
    }

    function test_CommitResult_RevertIfNotOperator() public {
        uint256 taskId = _submitTask();

        vm.prank(consumer);
        vm.expectRevert(ITaskEscrow.NotOperator.selector);
        escrow.commitResult(taskId, keccak256("hash"));
    }

    function test_CommitResult_RevertIfWindowExpired() public {
        uint256 taskId = _submitTask();

        // Warp past commit window
        vm.warp(block.timestamp + GhostNodeLib.COMMIT_WINDOW + 1);

        vm.prank(operator);
        vm.expectRevert(ITaskEscrow.CommitWindowExpired.selector);
        escrow.commitResult(taskId, keccak256("hash"));
    }

    // ─── revealResult ─────────────────────────────────────────────────────────

    function test_RevealResult_Success() public {
        uint256 taskId = _submitTask();

        bytes memory result = bytes('{"data": "test"}');
        bytes32 salt = keccak256("random salt");

        _commitResult(taskId, result, salt);

        vm.prank(operator);
        escrow.revealResult(taskId, result, salt);

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.REVEALED));
        assertEq(task.resultData, result);
    }

    function test_RevealResult_RevertIfHashMismatch() public {
        uint256 taskId = _submitTask();

        bytes memory result = bytes('{"data": "test"}');
        bytes32 salt = keccak256("random salt");

        _commitResult(taskId, result, salt);

        // Coba reveal dengan result berbeda
        vm.prank(operator);
        vm.expectRevert(ITaskEscrow.HashMismatch.selector);
        escrow.revealResult(taskId, bytes('{"data": "wrong"}'), salt);
    }

    // ─── finalizeTask ─────────────────────────────────────────────────────────

    function test_FinalizeTask_Success() public {
        uint256 taskId = _submitTask();

        bytes memory result = bytes('{"data": "test"}');
        bytes32 salt = keccak256("random salt");

        _commitResult(taskId, result, salt);
        _revealResult(taskId, result, salt);

        // Warp past dispute window
        vm.warp(block.timestamp + GhostNodeLib.DISPUTE_WINDOW + 1);

        uint256 operatorBalBefore    = usdc.balanceOf(operator);
        uint256 feeRecipientBalBefore = usdc.balanceOf(feeRecipient);

        escrow.finalizeTask(taskId);

        uint256 expectedFee        = GhostNodeLib.calculateFee(PRICE);
        uint256 expectedOperatorPay = GhostNodeLib.calculateOperatorPay(PRICE);

        assertEq(usdc.balanceOf(operator), operatorBalBefore + expectedOperatorPay);
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBalBefore + expectedFee);

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.COMPLETED));
    }

    function test_FinalizeTask_RevertIfDisputeWindowActive() public {
        uint256 taskId = _submitTask();

        bytes memory result = bytes('{"data": "test"}');
        bytes32 salt = keccak256("random salt");

        _commitResult(taskId, result, salt);
        _revealResult(taskId, result, salt);

        // Jangan warp — dispute window masih aktif
        vm.expectRevert(ITaskEscrow.DisputeWindowActive.selector);
        escrow.finalizeTask(taskId);
    }

    // ─── cancelTask ───────────────────────────────────────────────────────────

    function test_CancelTask_Success() public {
        uint256 taskId = _submitTask();
        uint256 consumerBalBefore = usdc.balanceOf(consumer);

        vm.prank(consumer);
        escrow.cancelTask(taskId);

        assertEq(usdc.balanceOf(consumer), consumerBalBefore + PRICE);

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.CANCELLED));
    }

    function test_CancelTask_RevertIfNotConsumer() public {
        uint256 taskId = _submitTask();

        vm.prank(operator);
        vm.expectRevert(ITaskEscrow.NotConsumer.selector);
        escrow.cancelTask(taskId);
    }

    // ─── claimTimeout ─────────────────────────────────────────────────────────

    function test_ClaimTimeout_Success() public {
        uint256 taskId = _submitTask();
        uint256 consumerBalBefore = usdc.balanceOf(consumer);

        // Warp past commit window
        vm.warp(block.timestamp + GhostNodeLib.COMMIT_WINDOW + 1);

        escrow.claimTimeout(taskId);

        assertEq(usdc.balanceOf(consumer), consumerBalBefore + PRICE);

        ITaskEscrow.Task memory task = escrow.getTask(taskId);
        assertEq(uint8(task.status), uint8(ITaskEscrow.TaskStatus.TIMED_OUT));
    }

    // ─── Fee calculation ──────────────────────────────────────────────────────

    function test_FeeCalculation() public {
        uint256 amount = 100 * 1e6; // $100 USDC
        uint256 fee    = GhostNodeLib.calculateFee(amount);
        uint256 pay    = GhostNodeLib.calculateOperatorPay(amount);

        assertEq(fee, 2_500_000);  // 2.5 USDC
        assertEq(pay, 97_500_000); // 97.5 USDC
        assertEq(fee + pay, amount);
    }
}