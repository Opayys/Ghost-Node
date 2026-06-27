// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IReputationContract.sol";
import "../interfaces/IAgentRegistry.sol";
import "../libraries/GhostNodeLib.sol";

contract ReputationContract is IReputationContract, Ownable {

    IAgentRegistry public immutable registry;

    mapping(address => bool) public authorizedCallers;
    mapping(uint256 => ReputationData) private _reputations;

    constructor(address _registry, address _owner) Ownable(_owner) {
        registry = IAgentRegistry(_registry);
    }

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender]) revert Unauthorized();
        _;
    }

    function recordSuccess(uint256 agentId, uint256 paymentAmount)
        external onlyAuthorized
    {
        ReputationData storage rep = _reputations[agentId];
        rep.tasksTotal   += 1;
        rep.tasksSuccess += 1;
        rep.totalEarned  += paymentAmount;
        rep.lastUpdated   = block.timestamp;
        rep.score         = calculateScore(agentId);
        emit ReputationUpdated(agentId, rep.score, rep.tasksTotal, rep.tasksSuccess);
    }

    function recordDispute(uint256 agentId) external onlyAuthorized {
        ReputationData storage rep = _reputations[agentId];
        rep.tasksDisputed += 1;
        rep.lastUpdated    = block.timestamp;
        rep.score          = calculateScore(agentId);
        emit ReputationUpdated(agentId, rep.score, rep.tasksTotal, rep.tasksSuccess);
    }

    function recordDisputeLost(uint256 agentId) external onlyAuthorized {
        ReputationData storage rep = _reputations[agentId];
        rep.tasksTotal    += 1;
        rep.tasksDisputed += 1;
        rep.disputesLost  += 1;
        rep.lastUpdated    = block.timestamp;
        rep.score          = calculateScore(agentId);
        emit ReputationUpdated(agentId, rep.score, rep.tasksTotal, rep.tasksSuccess);
    }

    function getReputation(uint256 agentId)
        external view returns (ReputationData memory)
    {
        return _reputations[agentId];
    }

    function getScore(uint256 agentId) external view returns (uint256) {
        return _reputations[agentId].score;
    }

    function calculateScore(uint256 agentId) public view returns (uint256) {
        ReputationData memory rep = _reputations[agentId];
        if (rep.tasksTotal == 0) return GhostNodeLib.DEFAULT_SCORE;

        // Faktor 1: Success Rate (0-400)
        uint256 successScore = (rep.tasksSuccess * 400) / rep.tasksTotal;

        // Faktor 2: Dispute Penalty (0-300)
        uint256 disputePenalty = 0;
        if (rep.disputesLost > 0) {
            disputePenalty = (rep.disputesLost * 300) / rep.tasksTotal;
            if (disputePenalty > 300) disputePenalty = 300;
        }

        // Faktor 3: Volume Score (0-200, logarithmic)
        uint256 volumeScore = GhostNodeLib.logScore(rep.totalEarned, 200);

        // Faktor 4: Longevity (0-100)
        uint256 longevityScore = 0;
        try registry.getAgent(agentId) returns (IAgentRegistry.AgentProfile memory agent) {
            uint256 daysActive = (block.timestamp - agent.registeredAt) / 1 days;
            longevityScore = daysActive >= 365 ? 100 : (daysActive * 100) / 365;
        } catch {
            longevityScore = 0;
        }

        // Final score
        uint256 rawScore = successScore + volumeScore + longevityScore;
        if (disputePenalty >= rawScore) return 0;
        uint256 finalScore = rawScore - disputePenalty;
        return finalScore > GhostNodeLib.MAX_SCORE ? GhostNodeLib.MAX_SCORE : finalScore;
    }

    function setAuthorizedCaller(address caller, bool authorized)
        external onlyOwner
    {
        authorizedCallers[caller] = authorized;
    }
}