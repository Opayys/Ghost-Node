// ─── Chain IDs ───────────────────────────────────────────────────────────────
export const CHAIN_IDS = {
  ANVIL:        31337,
  BASE_SEPOLIA: 84532,
  BASE_MAINNET: 8453,
} as const;

// ─── RPC URLs ────────────────────────────────────────────────────────────────
export const RPC_URLS = {
  ANVIL:        "http://127.0.0.1:8545",
  BASE_SEPOLIA: "https://sepolia.base.org",
  BASE_MAINNET: "https://mainnet.base.org",
} as const;

// ─── Contract ABIs (minimal — hanya fungsi yang dipakai SDK) ─────────────────
export const AGENT_REGISTRY_ABI = [
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "metadataURI",      type: "string" },
      { name: "capabilities",     type: "bytes32[]" },
      { name: "pricePerTask",     type: "uint256" },
      { name: "slaUptime",        type: "uint16" },
      { name: "agentSmartAccount",type: "address" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{
      name: "",
      type: "tuple",
      components: [
        { name: "agentId",           type: "uint256" },
        { name: "operator",          type: "address" },
        { name: "agentSmartAccount", type: "address" },
        { name: "metadataURI",       type: "string" },
        { name: "capabilities",      type: "bytes32[]" },
        { name: "pricePerTask",      type: "uint256" },
        { name: "stakeAmount",       type: "uint256" },
        { name: "registeredAt",      type: "uint256" },
        { name: "isActive",          type: "bool" },
        { name: "slaUptime",         type: "uint16" },
      ],
    }],
  },
  {
    name: "searchByCapability",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "capability", type: "bytes32" }],
    outputs: [{ name: "agentIds", type: "uint256[]" }],
  },
  {
    name: "deactivateAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "nextAgentId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { name: "agentId",      type: "uint256", indexed: true },
      { name: "operator",     type: "address", indexed: true },
      { name: "pricePerTask", type: "uint256", indexed: false },
      { name: "capabilities", type: "bytes32[]", indexed: false },
    ],
  },
] as const;

export const TASK_ESCROW_ABI = [
  {
    name: "submitTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId",       type: "uint256" },
      { name: "taskParamsHash",type: "bytes32" },
    ],
    outputs: [{ name: "taskId", type: "uint256" }],
  },
  {
    name: "commitResult",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId",     type: "uint256" },
      { name: "commitHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "revealResult",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "result", type: "bytes" },
      { name: "salt",   type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "finalizeTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelTask",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getTask",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [{
      name: "",
      type: "tuple",
      components: [
        { name: "taskId",          type: "uint256" },
        { name: "agentId",         type: "uint256" },
        { name: "consumer",        type: "address" },
        { name: "operator",        type: "address" },
        { name: "payment",         type: "uint256" },
        { name: "taskParamsHash",  type: "bytes32" },
        { name: "resultCommit",    type: "bytes32" },
        { name: "resultData",      type: "bytes" },
        { name: "status",          type: "uint8" },
        { name: "createdAt",       type: "uint256" },
        { name: "commitDeadline",  type: "uint256" },
        { name: "revealDeadline",  type: "uint256" },
        { name: "disputeDeadline", type: "uint256" },
      ],
    }],
  },
  {
    name: "TaskCreated",
    type: "event",
    inputs: [
      { name: "taskId",        type: "uint256", indexed: true },
      { name: "agentId",       type: "uint256", indexed: true },
      { name: "consumer",      type: "address", indexed: true },
      { name: "payment",       type: "uint256", indexed: false },
      { name: "taskParamsHash",type: "bytes32", indexed: false },
    ],
  },
  {
    name: "ResultRevealed",
    type: "event",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "result", type: "bytes",   indexed: false },
    ],
  },
  {
    name: "TaskCompleted",
    type: "event",
    inputs: [
      { name: "taskId",       type: "uint256", indexed: true },
      { name: "operatorPay",  type: "uint256", indexed: false },
      { name: "platformFee",  type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── Capabilities ─────────────────────────────────────────────────────────────
import { keccak256, toHex } from "viem";

export const Capability = {
  ONCHAIN_DATA_FETCHING:      keccak256(toHex("ONCHAIN_DATA_FETCHING")),
  PRICE_ORACLE:               keccak256(toHex("PRICE_ORACLE")),
  WALLET_ANALYSIS:            keccak256(toHex("WALLET_ANALYSIS")),
  TRANSACTION_MONITORING:     keccak256(toHex("TRANSACTION_MONITORING")),
  SENTIMENT_ANALYSIS:         keccak256(toHex("SENTIMENT_ANALYSIS")),
  MARKET_ANALYSIS:            keccak256(toHex("MARKET_ANALYSIS")),
  RISK_ASSESSMENT:            keccak256(toHex("RISK_ASSESSMENT")),
  REPORT_GENERATION:          keccak256(toHex("REPORT_GENERATION")),
  CODE_GENERATION:            keccak256(toHex("CODE_GENERATION")),
  TRADE_EXECUTION:            keccak256(toHex("TRADE_EXECUTION")),
} as const;

// ─── GhostNode Constants ──────────────────────────────────────────────────────
export const GHOSTNODE = {
  MIN_STAKE:        BigInt(50 * 1e6),   // 50 USDC
  PLATFORM_FEE_BPS: 250n,               // 2.5%
  COMMIT_WINDOW:    3600,               // 1 hour in seconds
  REVEAL_WINDOW:    1800,               // 30 minutes
  DISPUTE_WINDOW:   86400,              // 24 hours
} as const;