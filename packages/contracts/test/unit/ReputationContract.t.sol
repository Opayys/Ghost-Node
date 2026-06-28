// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/AgentRegistry.sol";
import "../../src/core/ReputationContract.sol";
import "../../src/libraries/CapabilityLib.sol";
import "../../src/libraries/GhostNodeLib.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract ReputationContractTest is Test {

    AgentRegistry      public registry;
    ReputationContract public reputation;
    MockUSDC           public usdc;

    address public owner    = address(0x1);
    address public operator = address(0x2);
    address public caller   = address(0x3); // authorized caller (simulates TaskEscrow)

    uint256 public agentId;
    bytes32[] public capabilities;

    function setUp() public {
        usdc       = new MockUSDC();
        registry   = new AgentRegistry(address(usdc), owner);
        reputation = new ReputationContract(address(registry), owner);

        // Authorize caller
        vm.prank(owner);
        reputation.setAuthorizedCaller(caller, true);

        // Fund operator
        usdc.mint(operator, 1000 * 1e6);

        // Register agent
        capabilities.push(CapabilityLib.ONCHAIN_DATA_FETCHING);

        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        agentId = registry.registerAgent(
            "ipfs://metadata",
            capabilities,
            1 * 1e6,
            9500,
            address(0x99)
        );
        vm.stopPrank();
    }

    // ─── Default score ────────────────────────────────────────────────────────

    function test_DefaultScore() public view {
        uint256 score = reputation.calculateScore(agentId);
        assertEq(score, GhostNodeLib.DEFAULT_SCORE);
    }

    // ─── recordSuccess ────────────────────────────────────────────────────────

    function test_RecordSuccess_UpdatesData() public {
        vm.prank(caller);
        reputation.recordSuccess(agentId, 1 * 1e6);

        IReputationContract.ReputationData memory rep = reputation.getReputation(agentId);
        assertEq(rep.tasksTotal, 1);
        assertEq(rep.tasksSuccess, 1);
        assertEq(rep.totalEarned, 1 * 1e6);
    }

    function test_RecordSuccess_MultipleUpdates() public {
        vm.startPrank(caller);
        reputation.recordSuccess(agentId, 1 * 1e6);
        reputation.recordSuccess(agentId, 1 * 1e6);
        reputation.recordSuccess(agentId, 1 * 1e6);
        vm.stopPrank();

        IReputationContract.ReputationData memory rep = reputation.getReputation(agentId);
        assertEq(rep.tasksTotal, 3);
        assertEq(rep.tasksSuccess, 3);
        assertEq(rep.totalEarned, 3 * 1e6);
    }

    function test_RecordSuccess_ScoreIncreasesOverTime() public {
        uint256 scoreBefore = reputation.getScore(agentId);

        vm.prank(caller);
        reputation.recordSuccess(agentId, 100 * 1e6);

        uint256 scoreAfter = reputation.getScore(agentId);
        assertGt(scoreAfter, scoreBefore);
    }

    function test_RecordSuccess_RevertIfUnauthorized() public {
        vm.prank(operator);
        vm.expectRevert(IReputationContract.Unauthorized.selector);
        reputation.recordSuccess(agentId, 1 * 1e6);
    }

    // ─── recordDispute ────────────────────────────────────────────────────────

    function test_RecordDispute_UpdatesData() public {
        vm.prank(caller);
        reputation.recordDispute(agentId);

        IReputationContract.ReputationData memory rep = reputation.getReputation(agentId);
        assertEq(rep.tasksDisputed, 1);
    }

    function test_RecordDispute_RevertIfUnauthorized() public {
        vm.prank(operator);
        vm.expectRevert(IReputationContract.Unauthorized.selector);
        reputation.recordDispute(agentId);
    }

    // ─── recordDisputeLost ────────────────────────────────────────────────────

    function test_RecordDisputeLost_UpdatesData() public {
        vm.prank(caller);
        reputation.recordDisputeLost(agentId);

        IReputationContract.ReputationData memory rep = reputation.getReputation(agentId);
        assertEq(rep.tasksTotal, 1);
        assertEq(rep.tasksDisputed, 1);
        assertEq(rep.disputesLost, 1);
    }

    function test_RecordDisputeLost_ReducesScore() public {
        // Dulu sukses beberapa kali
        vm.startPrank(caller);
        reputation.recordSuccess(agentId, 10 * 1e6);
        reputation.recordSuccess(agentId, 10 * 1e6);
        reputation.recordSuccess(agentId, 10 * 1e6);
        vm.stopPrank();

        uint256 scoreBefore = reputation.getScore(agentId);

        // Lalu kalah dispute
        vm.prank(caller);
        reputation.recordDisputeLost(agentId);

        uint256 scoreAfter = reputation.getScore(agentId);
        assertLt(scoreAfter, scoreBefore);
    }

    // ─── calculateScore ───────────────────────────────────────────────────────

    function test_CalculateScore_PerfectRecord() public {
        // 10 task sukses semua, volume besar
        vm.startPrank(caller);
        for (uint256 i = 0; i < 10; i++) {
            reputation.recordSuccess(agentId, 100 * 1e6);
        }
        vm.stopPrank();

        uint256 score = reputation.calculateScore(agentId);
        // Success rate 100% = 400 pts
        // Volume 1000 USDC = log2(1000) ≈ 10 bits → (10/20)*200 = 100 pts
        // Longevity = 0 (baru register)
        // Total ≈ 500
        assertGt(score, 400);
        assertLe(score, GhostNodeLib.MAX_SCORE);
    }

    function test_CalculateScore_NeverExceedsMax() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 100; i++) {
            reputation.recordSuccess(agentId, 10_000 * 1e6);
        }
        vm.stopPrank();

        uint256 score = reputation.calculateScore(agentId);
        assertLe(score, GhostNodeLib.MAX_SCORE);
    }

    function test_CalculateScore_ZeroIfAllDisputed() public {
        vm.startPrank(caller);
        for (uint256 i = 0; i < 5; i++) {
            reputation.recordDisputeLost(agentId);
        }
        vm.stopPrank();

        uint256 score = reputation.calculateScore(agentId);
        assertEq(score, 0);
    }

    // ─── authorizedCaller management ──────────────────────────────────────────

    function test_SetAuthorizedCaller_OnlyOwner() public {
        address newCaller = address(0x5);

        vm.prank(owner);
        reputation.setAuthorizedCaller(newCaller, true);

        vm.prank(newCaller);
        reputation.recordSuccess(agentId, 1 * 1e6); // should not revert
    }

    function test_SetAuthorizedCaller_RevertIfNotOwner() public {
        vm.prank(operator);
        vm.expectRevert();
        reputation.setAuthorizedCaller(operator, true);
    }

    function test_RevokeCaller() public {
        // Revoke caller
        vm.prank(owner);
        reputation.setAuthorizedCaller(caller, false);

        vm.prank(caller);
        vm.expectRevert(IReputationContract.Unauthorized.selector);
        reputation.recordSuccess(agentId, 1 * 1e6);
    }
}