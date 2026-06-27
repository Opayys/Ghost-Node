// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/core/AgentRegistry.sol";
import "../src/core/TaskEscrow.sol";
import "../src/core/ReputationContract.sol";
import "../src/core/DisputeResolver.sol";

/// @notice Mock USDC untuk local testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint bebas untuk testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DeployGhostNode is Script {

    function run() external {
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY_OPERATOR",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerKey);

        console.log("===========================================");
        console.log("  GHOSTNODE DEPLOYMENT - Anvil Local");
        console.log("===========================================");
        console.log("Deployer :", deployer);
        console.log("Chain ID :", block.chainid);
        console.log("");

        vm.startBroadcast(deployerKey);

        // 1. Deploy Mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC           :", address(usdc));

        // Mint 1,000,000 USDC ke deployer untuk testing
        usdc.mint(deployer, 1_000_000 * 1e6);
        console.log("Minted 1,000,000 USDC to deployer");

        // 2. AgentRegistry
        AgentRegistry registry = new AgentRegistry(
            address(usdc),
            deployer
        );
        console.log("AgentRegistry      :", address(registry));

        // 3. ReputationContract
        ReputationContract reputation = new ReputationContract(
            address(registry),
            deployer
        );
        console.log("ReputationContract :", address(reputation));

        // 4. DisputeResolver
        DisputeResolver disputeResolver = new DisputeResolver(
            address(usdc),
            address(registry),
            address(reputation),
            deployer
        );
        console.log("DisputeResolver    :", address(disputeResolver));

        // 5. TaskEscrow
        TaskEscrow taskEscrow = new TaskEscrow(
            address(usdc),
            address(registry),
            deployer,
            deployer
        );
        console.log("TaskEscrow         :", address(taskEscrow));

        // 6. Wire semua contract
        console.log("");
        console.log("Wiring contracts...");

        taskEscrow.setReputation(address(reputation));
        taskEscrow.setDisputeResolver(address(disputeResolver));
        disputeResolver.setTaskEscrow(address(taskEscrow));
        reputation.setAuthorizedCaller(address(taskEscrow), true);
        reputation.setAuthorizedCaller(address(disputeResolver), true);
        registry.setAuthorizedSlasher(address(disputeResolver), true);
        registry.setAuthorizedSlasher(address(taskEscrow), true);

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("  DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("MockUSDC           :", address(usdc));
        console.log("AgentRegistry      :", address(registry));
        console.log("ReputationContract :", address(reputation));
        console.log("DisputeResolver    :", address(disputeResolver));
        console.log("TaskEscrow         :", address(taskEscrow));
    }
}