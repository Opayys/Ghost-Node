// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library GhostNodeLib {

    uint256 internal constant MIN_STAKE        = 50 * 1e6;
    uint256 internal constant PLATFORM_FEE_BPS = 250;
    uint256 internal constant BPS_DENOMINATOR  = 10_000;
    uint256 internal constant COMMIT_WINDOW    = 1 hours;
    uint256 internal constant REVEAL_WINDOW    = 30 minutes;
    uint256 internal constant DISPUTE_WINDOW   = 24 hours;
    uint256 internal constant VOTING_WINDOW    = 48 hours;
    uint256 internal constant MIN_JURORS       = 3;
    uint256 internal constant SLASH_AMOUNT     = 10 * 1e6;
    uint256 internal constant DISPUTE_FEE      = 5 * 1e6;
    uint256 internal constant MIN_JUROR_SCORE  = 700;
    uint256 internal constant MAX_SCORE        = 1000;
    uint256 internal constant DEFAULT_SCORE    = 500;

    function calculateFee(uint256 amount) internal pure returns (uint256) {
        return (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
    }

    function calculateOperatorPay(uint256 amount) internal pure returns (uint256) {
        return amount - calculateFee(amount);
    }

    function generateCommitHash(bytes memory result, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(result, salt));
    }

    function verifyCommit(bytes memory result, bytes32 salt, bytes32 commitHash) internal pure returns (bool) {
        return keccak256(abi.encodePacked(result, salt)) == commitHash;
    }

    function logScore(uint256 totalEarned, uint256 maxPoints) internal pure returns (uint256) {
        if (totalEarned == 0) return 0;
        uint256 usdcAmount = totalEarned / 1e6;
        if (usdcAmount == 0) return 0;
        uint256 log2 = 0;
        uint256 n = usdcAmount;
        while (n > 1) { n >>= 1; log2++; }
        if (log2 > 20) log2 = 20;
        return (log2 * maxPoints) / 20;
    }
}