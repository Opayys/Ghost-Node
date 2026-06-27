// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAgentRegistry.sol";
import "../interfaces/IReputationContract.sol";
import "../libraries/GhostNodeLib.sol";

contract DisputeResolver is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum DisputeStatus { OPEN, VOTING, RESOLVED, CANCELLED }
    enum Vote { NONE, FAVOR_CONSUMER, FAVOR_OPERATOR }

    struct Dispute {
        uint256 disputeId;
        uint256 taskId;
        address consumer;
        address operator;
        string  reasonIPFS;
        DisputeStatus status;
        uint256 openedAt;
        uint256 votingDeadline;
        address[] jurors;
        uint256 votesForConsumer;
        uint256 votesForOperator;
        bool    resolved;
    }

    IERC20 public immutable usdc;
    IAgentRegistry public immutable registry;
    IReputationContract public immutable reputation;

    address public taskEscrow;
    uint256 private _nextDisputeId;

    mapping(uint256 => Dispute) private _disputes;
    mapping(uint256 => uint256) public taskToDispute;
    mapping(uint256 => mapping(address => Vote)) private _votes;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    event DisputeOpened(uint256 indexed disputeId, uint256 indexed taskId, address indexed consumer, address operator);
    event JurorAssigned(uint256 indexed disputeId, address indexed juror);
    event VoteCast(uint256 indexed disputeId, address indexed juror, Vote vote);
    event DisputeResolved(uint256 indexed disputeId, uint256 indexed taskId, bool favorConsumer, uint256 votesForConsumer, uint256 votesForOperator);

    error NotTaskEscrow();
    error DisputeNotOpen();
    error AlreadyVoted();
    error NotJuror();
    error VotingWindowExpired();
    error VotingWindowActive();
    error InsufficientJurors();
    error AlreadyDisputed();

    constructor(
        address _usdc,
        address _registry,
        address _reputation,
        address _owner
    ) Ownable(_owner) {
        usdc       = IERC20(_usdc);
        registry   = IAgentRegistry(_registry);
        reputation = IReputationContract(_reputation);
    }

    modifier onlyTaskEscrow() {
        if (msg.sender != taskEscrow) revert NotTaskEscrow();
        _;
    }

    function openDispute(
        uint256 taskId,
        address consumer,
        address operator,
        string calldata reasonIPFS,
        address[] calldata jurorCandidates
    ) external onlyTaskEscrow nonReentrant returns (uint256 disputeId) {
        if (taskToDispute[taskId] != 0) revert AlreadyDisputed();
        if (jurorCandidates.length < GhostNodeLib.MIN_JURORS) revert InsufficientJurors();

        disputeId = _nextDisputeId++;

        Dispute storage dispute = _disputes[disputeId];
        dispute.disputeId      = disputeId;
        dispute.taskId         = taskId;
        dispute.consumer       = consumer;
        dispute.operator       = operator;
        dispute.reasonIPFS     = reasonIPFS;
        dispute.status         = DisputeStatus.VOTING;
        dispute.openedAt       = block.timestamp;
        dispute.votingDeadline = block.timestamp + GhostNodeLib.VOTING_WINDOW;

        taskToDispute[taskId] = disputeId;

        for (uint256 i = 0; i < jurorCandidates.length; i++) {
            address candidate = jurorCandidates[i];
            uint256 score = reputation.getScore(_getAgentIdByOperator(candidate));
            if (score >= GhostNodeLib.MIN_JUROR_SCORE && candidate != consumer && candidate != operator) {
                dispute.jurors.push(candidate);
                emit JurorAssigned(disputeId, candidate);
            }
        }

        if (dispute.jurors.length < GhostNodeLib.MIN_JURORS) revert InsufficientJurors();

        emit DisputeOpened(disputeId, taskId, consumer, operator);
    }

    function castVote(uint256 disputeId, bool favorConsumer) external nonReentrant {
        Dispute storage dispute = _disputes[disputeId];

        if (dispute.status != DisputeStatus.VOTING) revert DisputeNotOpen();
        if (block.timestamp > dispute.votingDeadline) revert VotingWindowExpired();
        if (_hasVoted[disputeId][msg.sender]) revert AlreadyVoted();
        if (!_isJuror(disputeId, msg.sender)) revert NotJuror();

        Vote vote = favorConsumer ? Vote.FAVOR_CONSUMER : Vote.FAVOR_OPERATOR;
        _votes[disputeId][msg.sender]  = vote;
        _hasVoted[disputeId][msg.sender] = true;

        if (favorConsumer) {
            dispute.votesForConsumer += 1;
        } else {
            dispute.votesForOperator += 1;
        }

        emit VoteCast(disputeId, msg.sender, vote);

        if (dispute.votesForConsumer + dispute.votesForOperator == dispute.jurors.length) {
            _resolveDispute(disputeId);
        }
    }

    function finalizeDispute(uint256 disputeId) external nonReentrant {
        Dispute storage dispute = _disputes[disputeId];
        if (dispute.status != DisputeStatus.VOTING) revert DisputeNotOpen();
        if (block.timestamp <= dispute.votingDeadline) revert VotingWindowActive();
        _resolveDispute(disputeId);
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return _disputes[disputeId];
    }

    function getVote(uint256 disputeId, address juror) external view returns (Vote) {
        return _votes[disputeId][juror];
    }

    function hasVoted(uint256 disputeId, address juror) external view returns (bool) {
        return _hasVoted[disputeId][juror];
    }

    function nextDisputeId() external view returns (uint256) {
        return _nextDisputeId;
    }

    function _resolveDispute(uint256 disputeId) internal {
        Dispute storage dispute = _disputes[disputeId];
        bool favorConsumer = dispute.votesForConsumer > dispute.votesForOperator;

        dispute.status   = DisputeStatus.RESOLVED;
        dispute.resolved = true;

        (bool success, ) = taskEscrow.call(
            abi.encodeWithSignature("resolveDispute(uint256,bool)", dispute.taskId, favorConsumer)
        );
        require(success, "TaskEscrow resolve failed");

        emit DisputeResolved(disputeId, dispute.taskId, favorConsumer, dispute.votesForConsumer, dispute.votesForOperator);
    }

    function _isJuror(uint256 disputeId, address candidate) internal view returns (bool) {
        address[] memory jurors = _disputes[disputeId].jurors;
        for (uint256 i = 0; i < jurors.length; i++) {
            if (jurors[i] == candidate) return true;
        }
        return false;
    }

    function _getAgentIdByOperator(address operator) internal view returns (uint256) {
        uint256[] memory agentIds = registry.getOperatorAgents(operator);
        if (agentIds.length == 0) return type(uint256).max;
        return agentIds[0];
    }

    function setTaskEscrow(address _taskEscrow) external onlyOwner {
        taskEscrow = _taskEscrow;
    }
}