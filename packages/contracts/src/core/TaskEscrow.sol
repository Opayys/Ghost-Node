// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/ITaskEscrow.sol";
import "../interfaces/IAgentRegistry.sol";
import "../interfaces/IReputationContract.sol";
import "../libraries/GhostNodeLib.sol";

contract TaskEscrow is ITaskEscrow, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IAgentRegistry public immutable registry;
    IReputationContract public reputation;

    address public feeRecipient;
    address public disputeResolver;

    uint256 private _nextTaskId;
    mapping(uint256 => Task) private _tasks;

    constructor(
        address _usdc,
        address _registry,
        address _feeRecipient,
        address _owner
    ) Ownable(_owner) {
        usdc         = IERC20(_usdc);
        registry     = IAgentRegistry(_registry);
        feeRecipient = _feeRecipient;
    }

    modifier onlyConsumer(uint256 taskId) {
        if (_tasks[taskId].consumer != msg.sender) revert NotConsumer();
        _;
    }

    modifier onlyOperator(uint256 taskId) {
        if (_tasks[taskId].operator != msg.sender) revert NotOperator();
        _;
    }

    modifier onlyDisputeResolver() {
        require(msg.sender == disputeResolver, "Not dispute resolver");
        _;
    }

    modifier inStatus(uint256 taskId, TaskStatus expected) {
        if (_tasks[taskId].status != expected) revert InvalidStatus();
        _;
    }

    function submitTask(
        uint256 agentId,
        bytes32 taskParamsHash
    ) external nonReentrant returns (uint256 taskId) {
        IAgentRegistry.AgentProfile memory agent = registry.getAgent(agentId);
        if (!agent.isActive) revert AgentNotActive();
        if (agent.pricePerTask == 0) revert ZeroPayment();

        uint256 payment = agent.pricePerTask;
        usdc.safeTransferFrom(msg.sender, address(this), payment);

        taskId = _nextTaskId++;
        _tasks[taskId] = Task({
            taskId:          taskId,
            agentId:         agentId,
            consumer:        msg.sender,
            operator:        agent.operator,
            payment:         payment,
            taskParamsHash:  taskParamsHash,
            resultCommit:    bytes32(0),
            resultData:      "",
            status:          TaskStatus.CREATED,
            createdAt:       block.timestamp,
            commitDeadline:  block.timestamp + GhostNodeLib.COMMIT_WINDOW,
            revealDeadline:  0,
            disputeDeadline: 0
        });

        emit TaskCreated(taskId, agentId, msg.sender, payment, taskParamsHash);
    }

    function commitResult(uint256 taskId, bytes32 commitHash)
        external
        onlyOperator(taskId)
        inStatus(taskId, TaskStatus.CREATED)
    {
        Task storage task = _tasks[taskId];
        if (block.timestamp > task.commitDeadline) revert CommitWindowExpired();

        task.resultCommit   = commitHash;
        task.status         = TaskStatus.COMMITTED;
        task.revealDeadline = block.timestamp + GhostNodeLib.REVEAL_WINDOW;

        emit ResultCommitted(taskId, commitHash);
    }

    function revealResult(uint256 taskId, bytes calldata result, bytes32 salt)
        external
        onlyOperator(taskId)
        inStatus(taskId, TaskStatus.COMMITTED)
    {
        Task storage task = _tasks[taskId];
        if (block.timestamp > task.revealDeadline) revert RevealWindowExpired();
        if (!GhostNodeLib.verifyCommit(result, salt, task.resultCommit)) revert HashMismatch();

        task.resultData      = result;
        task.status          = TaskStatus.REVEALED;
        task.disputeDeadline = block.timestamp + GhostNodeLib.DISPUTE_WINDOW;

        emit ResultRevealed(taskId, result);
    }

    function finalizeTask(uint256 taskId)
        external
        nonReentrant
        inStatus(taskId, TaskStatus.REVEALED)
    {
        Task storage task = _tasks[taskId];
        if (block.timestamp <= task.disputeDeadline) revert DisputeWindowActive();

        uint256 fee         = GhostNodeLib.calculateFee(task.payment);
        uint256 operatorPay = GhostNodeLib.calculateOperatorPay(task.payment);

        task.status = TaskStatus.COMPLETED;

        usdc.safeTransfer(task.operator, operatorPay);
        usdc.safeTransfer(feeRecipient, fee);

        if (address(reputation) != address(0)) {
            reputation.recordSuccess(task.agentId, task.payment);
        }

        emit TaskCompleted(taskId, operatorPay, fee);
    }

    function cancelTask(uint256 taskId)
        external
        nonReentrant
        onlyConsumer(taskId)
        inStatus(taskId, TaskStatus.CREATED)
    {
        Task storage task = _tasks[taskId];
        task.status = TaskStatus.CANCELLED;
        usdc.safeTransfer(task.consumer, task.payment);
        emit TaskCancelled(taskId);
    }

    function claimTimeout(uint256 taskId)
        external
        nonReentrant
        inStatus(taskId, TaskStatus.CREATED)
    {
        Task storage task = _tasks[taskId];
        if (block.timestamp <= task.commitDeadline) revert CommitWindowExpired();

        task.status = TaskStatus.TIMED_OUT;
        usdc.safeTransfer(task.consumer, task.payment);

        if (address(reputation) != address(0)) {
            reputation.recordDispute(task.agentId);
        }

        emit TaskTimedOut(taskId);
    }

    function raiseDispute(uint256 taskId, string calldata reason)
        external
        nonReentrant
        onlyConsumer(taskId)
        inStatus(taskId, TaskStatus.REVEALED)
    {
        Task storage task = _tasks[taskId];
        if (block.timestamp > task.disputeDeadline) revert DisputeWindowExpired();

        usdc.safeTransferFrom(msg.sender, address(this), GhostNodeLib.DISPUTE_FEE);
        task.status = TaskStatus.IN_DISPUTE;

        if (address(reputation) != address(0)) {
            reputation.recordDispute(task.agentId);
        }

        emit TaskDisputed(taskId, msg.sender, reason);
    }

    function resolveDispute(uint256 taskId, bool favorConsumer)
        external
        nonReentrant
        onlyDisputeResolver
        inStatus(taskId, TaskStatus.IN_DISPUTE)
    {
        Task storage task = _tasks[taskId];
        task.status = TaskStatus.RESOLVED;

        if (favorConsumer) {
            usdc.safeTransfer(task.consumer, task.payment + GhostNodeLib.DISPUTE_FEE);
            if (address(reputation) != address(0)) {
                reputation.recordDisputeLost(task.agentId);
            }
        } else {
            uint256 fee         = GhostNodeLib.calculateFee(task.payment);
            uint256 operatorPay = GhostNodeLib.calculateOperatorPay(task.payment);
            usdc.safeTransfer(task.operator, operatorPay);
            usdc.safeTransfer(feeRecipient, fee + GhostNodeLib.DISPUTE_FEE);
        }

        emit TaskCompleted(taskId, task.payment, 0);
    }

    function getTask(uint256 taskId) external view returns (Task memory) {
        return _tasks[taskId];
    }

    function nextTaskId() external view returns (uint256) {
        return _nextTaskId;
    }

    function setReputation(address _reputation) external onlyOwner {
        reputation = IReputationContract(_reputation);
    }

    function setDisputeResolver(address _disputeResolver) external onlyOwner {
        disputeResolver = _disputeResolver;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
}