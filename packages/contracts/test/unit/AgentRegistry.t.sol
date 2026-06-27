// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/core/AgentRegistry.sol";
import "../../src/libraries/CapabilityLib.sol";
import "../../src/libraries/GhostNodeLib.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract AgentRegistryTest is Test {

    AgentRegistry public registry;
    MockUSDC public usdc;

    address public owner    = address(0x1);
    address public operator = address(0x2);
    address public operator2 = address(0x3);
    address public slasher  = address(0x4);

    bytes32[] public capabilities;

    function setUp() public {
        usdc     = new MockUSDC();
        registry = new AgentRegistry(address(usdc), owner);

        // Fund operator dengan USDC
        usdc.mint(operator, 1000 * 1e6);
        usdc.mint(operator2, 1000 * 1e6);

        // Setup capabilities
        capabilities.push(CapabilityLib.ONCHAIN_DATA_FETCHING);
        capabilities.push(CapabilityLib.SENTIMENT_ANALYSIS);
    }

    // ─── registerAgent ───────────────────────────────────────────────────────

    function test_RegisterAgent_Success() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);

        uint256 agentId = registry.registerAgent(
            "ipfs://metadata",
            capabilities,
            1 * 1e6,  // $1 USDC per task
            9500,     // 95% SLA
            address(0x99)
        );
        vm.stopPrank();

        assertEq(agentId, 0);
        assertEq(registry.nextAgentId(), 1);

        IAgentRegistry.AgentProfile memory profile = registry.getAgent(0);
        assertEq(profile.operator, operator);
        assertEq(profile.pricePerTask, 1 * 1e6);
        assertEq(profile.stakeAmount, GhostNodeLib.MIN_STAKE);
        assertTrue(profile.isActive);
        assertEq(profile.slaUptime, 9500);
    }

    function test_RegisterAgent_MintsNFT() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        assertEq(registry.ownerOf(agentId), operator);
    }

    function test_RegisterAgent_RevertIfZeroPrice() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        vm.expectRevert(IAgentRegistry.InvalidPrice.selector);
        registry.registerAgent("ipfs://metadata", capabilities, 0, 9500, address(0x99));
        vm.stopPrank();
    }

    function test_RegisterAgent_RevertIfInvalidSLA() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        vm.expectRevert(IAgentRegistry.InvalidSLA.selector);
        registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 10_001, address(0x99));
        vm.stopPrank();
    }

    function test_RegisterAgent_RevertIfNoCapabilities() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        bytes32[] memory emptyCaps;
        vm.expectRevert(IAgentRegistry.InvalidCapabilities.selector);
        registry.registerAgent("ipfs://metadata", emptyCaps, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();
    }

    function test_RegisterAgent_TakesStake() public {
        uint256 balanceBefore = usdc.balanceOf(operator);

        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        assertEq(usdc.balanceOf(operator), balanceBefore - GhostNodeLib.MIN_STAKE);
        assertEq(usdc.balanceOf(address(registry)), GhostNodeLib.MIN_STAKE);
    }

    // ─── searchByCapability ───────────────────────────────────────────────────

    function test_SearchByCapability() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        uint256[] memory results = registry.searchByCapability(CapabilityLib.ONCHAIN_DATA_FETCHING);
        assertEq(results.length, 1);
        assertEq(results[0], 0);
    }

    // ─── deactivate / reactivate ──────────────────────────────────────────────

    function test_DeactivateAgent() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        registry.deactivateAgent(agentId);
        vm.stopPrank();

        assertFalse(registry.isActive(agentId));
    }

    function test_ReactivateAgent() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        registry.deactivateAgent(agentId);
        registry.reactivateAgent(agentId);
        vm.stopPrank();

        assertTrue(registry.isActive(agentId));
    }

    function test_DeactivateAgent_RevertIfNotOperator() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        vm.prank(operator2);
        vm.expectRevert(IAgentRegistry.NotOperator.selector);
        registry.deactivateAgent(agentId);
    }

    // ─── slashStake ───────────────────────────────────────────────────────────

    function test_SlashStake_Success() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        // Set slasher
        vm.prank(owner);
        registry.setAuthorizedSlasher(slasher, true);

        uint256 slashAmount = 10 * 1e6;
        vm.prank(slasher);
        registry.slashStake(agentId, slashAmount, slasher);

        IAgentRegistry.AgentProfile memory profile = registry.getAgent(agentId);
        assertEq(profile.stakeAmount, GhostNodeLib.MIN_STAKE - slashAmount);
        assertEq(usdc.balanceOf(slasher), slashAmount);
    }

    function test_SlashStake_RevertIfUnauthorized() public {
        vm.startPrank(operator);
        usdc.approve(address(registry), GhostNodeLib.MIN_STAKE);
        uint256 agentId = registry.registerAgent("ipfs://metadata", capabilities, 1 * 1e6, 9500, address(0x99));
        vm.stopPrank();

        vm.prank(operator2);
        vm.expectRevert(IAgentRegistry.UnauthorizedSlasher.selector);
        registry.slashStake(agentId, 10 * 1e6, operator2);
    }
}