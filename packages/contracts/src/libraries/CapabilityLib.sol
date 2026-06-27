// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CapabilityLib {

    bytes32 internal constant ONCHAIN_DATA_FETCHING      = keccak256("ONCHAIN_DATA_FETCHING");
    bytes32 internal constant PRICE_ORACLE               = keccak256("PRICE_ORACLE");
    bytes32 internal constant WALLET_ANALYSIS            = keccak256("WALLET_ANALYSIS");
    bytes32 internal constant TRANSACTION_MONITORING     = keccak256("TRANSACTION_MONITORING");
    bytes32 internal constant SENTIMENT_ANALYSIS         = keccak256("SENTIMENT_ANALYSIS");
    bytes32 internal constant MARKET_ANALYSIS            = keccak256("MARKET_ANALYSIS");
    bytes32 internal constant RISK_ASSESSMENT            = keccak256("RISK_ASSESSMENT");
    bytes32 internal constant PORTFOLIO_ANALYSIS         = keccak256("PORTFOLIO_ANALYSIS");
    bytes32 internal constant REPORT_GENERATION          = keccak256("REPORT_GENERATION");
    bytes32 internal constant CODE_GENERATION            = keccak256("CODE_GENERATION");
    bytes32 internal constant CONTENT_GENERATION         = keccak256("CONTENT_GENERATION");
    bytes32 internal constant TRADE_EXECUTION            = keccak256("TRADE_EXECUTION");
    bytes32 internal constant SMART_CONTRACT_INTERACTION = keccak256("SMART_CONTRACT_INTERACTION");
    bytes32 internal constant CROSS_CHAIN_BRIDGING       = keccak256("CROSS_CHAIN_BRIDGING");

    function encode(string memory capability) internal pure returns (bytes32) {
        return keccak256(bytes(capability));
    }

    function contains(bytes32[] memory capabilities, bytes32 target) internal pure returns (bool) {
        for (uint256 i = 0; i < capabilities.length; i++) {
            if (capabilities[i] == target) return true;
        }
        return false;
    }
}