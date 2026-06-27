// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IAgentRegistry.sol";
import "../libraries/GhostNodeLib.sol";

contract AgentRegistry is IAgentRegistry, ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 private _nextAgentId;

    mapping(address => bool) public authorizedSlashers;
    mapping(uint256 => AgentProfile) private _agents;
    mapping(address => uint256[]) private _operatorAgents;
    mapping(bytes32 => uint256[]) private _capabilityIndex;

    constructor(address _usdc, address _owner)
        ERC721("GhostNode Agent", "GHOST")
        Ownable(_owner)
    {
        usdc = IERC20(_usdc);
    }

    modifier onlyAgentOperator(uint256 agentId) {
        if (_agents[agentId].operator != msg.sender) revert NotOperator();
        _;
    }

    modifier agentExists(uint256 agentId) {
        if (agentId >= _nextAgentId) revert AgentNotFound();
        _;
    }

    modifier agentIsActive(uint256 agentId) {
        if (!_agents[agentId].isActive) revert AgentNotActive();
        _;
    }

    function registerAgent(
        string calldata metadataURI,
        bytes32[] calldata capabilities,
        uint256 pricePerTask,
        uint16  slaUptime,
        address agentSmartAccount
    ) external nonReentrant returns (uint256 agentId) {
        if (pricePerTask == 0) revert InvalidPrice();
        if (slaUptime > 10_000) revert InvalidSLA();
        if (capabilities.length == 0) revert InvalidCapabilities();

        usdc.safeTransferFrom(msg.sender, address(this), GhostNodeLib.MIN_STAKE);

        agentId = _nextAgentId++;

        _agents[agentId] = AgentProfile({
            agentId:           agentId,
            operator:          msg.sender,
            agentSmartAccount: agentSmartAccount,
            metadataURI:       metadataURI,
            capabilities:      capabilities,
            pricePerTask:      pricePerTask,
            stakeAmount:       GhostNodeLib.MIN_STAKE,
            registeredAt:      block.timestamp,
            isActive:          true,
            slaUptime:         slaUptime
        });

        _operatorAgents[msg.sender].push(agentId);
        for (uint256 i = 0; i < capabilities.length; i++) {
            _capabilityIndex[capabilities[i]].push(agentId);
        }

        _mint(msg.sender, agentId);

        emit AgentRegistered(agentId, msg.sender, pricePerTask, capabilities);
    }

    function updateAgent(
        uint256 agentId,
        uint256 newPrice,
        string calldata newMetadataURI,
        uint16 newSlaUptime
    ) external agentExists(agentId) onlyAgentOperator(agentId) {
        if (newPrice == 0) revert InvalidPrice();
        if (newSlaUptime > 10_000) revert InvalidSLA();

        _agents[agentId].pricePerTask = newPrice;
        _agents[agentId].metadataURI  = newMetadataURI;
        _agents[agentId].slaUptime    = newSlaUptime;

        emit AgentUpdated(agentId, newPrice, newMetadataURI);
    }

    function deactivateAgent(uint256 agentId)
        external agentExists(agentId) onlyAgentOperator(agentId)
    {
        _agents[agentId].isActive = false;
        emit AgentDeactivated(agentId, msg.sender);
    }

    function reactivateAgent(uint256 agentId)
        external agentExists(agentId) onlyAgentOperator(agentId)
    {
        _agents[agentId].isActive = true;
        emit AgentReactivated(agentId, msg.sender);
    }

    function topUpStake(uint256 agentId, uint256 amount)
        external nonReentrant agentExists(agentId) onlyAgentOperator(agentId)
    {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _agents[agentId].stakeAmount += amount;
        emit StakeToppedUp(agentId, amount);
    }

    function slashStake(uint256 agentId, uint256 amount, address recipient)
        external nonReentrant agentExists(agentId)
    {
        if (!authorizedSlashers[msg.sender]) revert UnauthorizedSlasher();

        AgentProfile storage agent = _agents[agentId];
        uint256 slashAmount = amount > agent.stakeAmount ? agent.stakeAmount : amount;

        agent.stakeAmount -= slashAmount;
        usdc.safeTransfer(recipient, slashAmount);

        if (agent.stakeAmount == 0) {
            agent.isActive = false;
            emit AgentDeactivated(agentId, agent.operator);
        }

        emit StakeSlashed(agentId, slashAmount, recipient);
    }

    function getAgent(uint256 agentId)
        external view agentExists(agentId) returns (AgentProfile memory)
    {
        return _agents[agentId];
    }

    function searchByCapability(bytes32 capability)
        external view returns (uint256[] memory)
    {
        return _capabilityIndex[capability];
    }

    function getOperatorAgents(address operator)
        external view returns (uint256[] memory)
    {
        return _operatorAgents[operator];
    }

    function isActive(uint256 agentId)
        external view agentExists(agentId) returns (bool)
    {
        return _agents[agentId].isActive;
    }

    function nextAgentId() external view returns (uint256) {
        return _nextAgentId;
    }

    function tokenURI(uint256 agentId)
        public view override agentExists(agentId) returns (string memory)
    {
        return _agents[agentId].metadataURI;
    }

    function setAuthorizedSlasher(address slasher, bool authorized)
        external onlyOwner
    {
        authorizedSlashers[slasher] = authorized;
    }
}