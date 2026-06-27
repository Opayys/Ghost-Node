// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {

    struct AgentProfile {
        uint256 agentId;
        address operator;
        address agentSmartAccount;
        string  metadataURI;
        bytes32[] capabilities;
        uint256 pricePerTask;
        uint256 stakeAmount;
        uint256 registeredAt;
        bool    isActive;
        uint16  slaUptime;
    }

    event AgentRegistered(uint256 indexed agentId, address indexed operator, uint256 pricePerTask, bytes32[] capabilities);
    event AgentUpdated(uint256 indexed agentId, uint256 newPrice, string newMetadataURI);
    event AgentDeactivated(uint256 indexed agentId, address indexed operator);
    event AgentReactivated(uint256 indexed agentId, address indexed operator);
    event StakeSlashed(uint256 indexed agentId, uint256 slashAmount, address recipient);
    event StakeToppedUp(uint256 indexed agentId, uint256 amount);

    error NotOperator();
    error AgentNotActive();
    error AgentNotFound();
    error InsufficientStake();
    error InvalidPrice();
    error InvalidSLA();
    error InvalidCapabilities();
    error UnauthorizedSlasher();

    function registerAgent(string calldata metadataURI, bytes32[] calldata capabilities, uint256 pricePerTask, uint16 slaUptime, address agentSmartAccount) external returns (uint256 agentId);
    function updateAgent(uint256 agentId, uint256 newPrice, string calldata newMetadataURI, uint16 newSlaUptime) external;
    function deactivateAgent(uint256 agentId) external;
    function reactivateAgent(uint256 agentId) external;
    function topUpStake(uint256 agentId, uint256 amount) external;
    function slashStake(uint256 agentId, uint256 amount, address recipient) external;
    function getAgent(uint256 agentId) external view returns (AgentProfile memory);
    function searchByCapability(bytes32 capability) external view returns (uint256[] memory agentIds);
    function getOperatorAgents(address operator) external view returns (uint256[] memory agentIds);
    function isActive(uint256 agentId) external view returns (bool);
    function nextAgentId() external view returns (uint256);
}