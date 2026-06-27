// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITaskEscrow {

    enum TaskStatus { CREATED, COMMITTED, REVEALED, COMPLETED, CANCELLED, TIMED_OUT, IN_DISPUTE, RESOLVED }

    struct Task {
        uint256 taskId;
        uint256 agentId;
        address consumer;
        address operator;
        uint256 payment;
        bytes32 taskParamsHash;
        bytes32 resultCommit;
        bytes   resultData;
        TaskStatus status;
        uint256 createdAt;
        uint256 commitDeadline;
        uint256 revealDeadline;
        uint256 disputeDeadline;
    }

    event TaskCreated(uint256 indexed taskId, uint256 indexed agentId, address indexed consumer, uint256 payment, bytes32 taskParamsHash);
    event ResultCommitted(uint256 indexed taskId, bytes32 commitHash);
    event ResultRevealed(uint256 indexed taskId, bytes result);
    event TaskCompleted(uint256 indexed taskId, uint256 operatorPay, uint256 platformFee);
    event TaskCancelled(uint256 indexed taskId);
    event TaskTimedOut(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId, address indexed consumer, string reason);

    error InvalidStatus();
    error NotConsumer();
    error NotOperator();
    error CommitWindowExpired();
    error RevealWindowExpired();
    error DisputeWindowActive();
    error DisputeWindowExpired();
    error HashMismatch();
    error AgentNotActive();
    error ZeroPayment();

    function submitTask(uint256 agentId, bytes32 taskParamsHash) external returns (uint256 taskId);
    function commitResult(uint256 taskId, bytes32 commitHash) external;
    function revealResult(uint256 taskId, bytes calldata result, bytes32 salt) external;
    function finalizeTask(uint256 taskId) external;
    function cancelTask(uint256 taskId) external;
    function claimTimeout(uint256 taskId) external;
    function raiseDispute(uint256 taskId, string calldata reason) external;
    function getTask(uint256 taskId) external view returns (Task memory);
    function nextTaskId() external view returns (uint256);
}