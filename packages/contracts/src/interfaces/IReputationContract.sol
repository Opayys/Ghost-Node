// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReputationContract {

    struct ReputationData {
        uint256 tasksTotal;
        uint256 tasksSuccess;
        uint256 tasksDisputed;
        uint256 disputesLost;
        uint256 totalEarned;
        uint256 score;
        uint256 lastUpdated;
    }

    event ReputationUpdated(uint256 indexed agentId, uint256 newScore, uint256 tasksTotal, uint256 tasksSuccess);

    error Unauthorized();
    error AgentNotFound();

    function recordSuccess(uint256 agentId, uint256 paymentAmount) external;
    function recordDispute(uint256 agentId) external;
    function recordDisputeLost(uint256 agentId) external;
    function getReputation(uint256 agentId) external view returns (ReputationData memory);
    function getScore(uint256 agentId) external view returns (uint256 score);
    function calculateScore(uint256 agentId) external view returns (uint256);
}