import type { Address, Hash, Hex } from "viem";

// ─── Agent ───────────────────────────────────────────────────────────────────

export interface AgentProfile {
  agentId:           bigint;
  operator:          Address;
  agentSmartAccount: Address;
  metadataURI:       string;
  capabilities:      Hex[];
  pricePerTask:      bigint;
  stakeAmount:       bigint;
  registeredAt:      bigint;
  isActive:          boolean;
  slaUptime:         number;
}

export interface RegisterAgentParams {
  metadataURI:       string;
  capabilities:      Hex[];
  pricePerTask:      bigint;     // in USDC wei (6 decimals)
  slaUptime:         number;     // basis points: 9500 = 95%
  agentSmartAccount: Address;
}

export interface AgentSearchParams {
  capability:    Hex;
  minReputation?: number;
  maxPrice?:     bigint;
  sortBy?:       "reputation" | "price";
}

// ─── Task ────────────────────────────────────────────────────────────────────

export enum TaskStatus {
  CREATED    = 0,
  COMMITTED  = 1,
  REVEALED   = 2,
  COMPLETED  = 3,
  CANCELLED  = 4,
  TIMED_OUT  = 5,
  IN_DISPUTE = 6,
  RESOLVED   = 7,
}

export interface Task {
  taskId:          bigint;
  agentId:         bigint;
  consumer:        Address;
  operator:        Address;
  payment:         bigint;
  taskParamsHash:  Hex;
  resultCommit:    Hex;
  resultData:      Hex;
  status:          TaskStatus;
  createdAt:       bigint;
  commitDeadline:  bigint;
  revealDeadline:  bigint;
  disputeDeadline: bigint;
}

export interface SubmitTaskParams {
  agentId:    bigint;
  taskParams: object;   // akan di-hash sebelum dikirim
}

export interface TaskResult {
  taskId: bigint;
  data:   unknown;
}

// ─── SDK Config ───────────────────────────────────────────────────────────────

export interface GhostNodeConfig {
  chainId:              number;
  rpcUrl:               string;
  privateKey:           Hex;
  contracts: {
    agentRegistry:      Address;
    taskEscrow:         Address;
    reputationContract: Address;
    usdc:               Address;
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface TaskCreatedEvent {
  taskId:        bigint;
  agentId:       bigint;
  consumer:      Address;
  payment:       bigint;
  taskParamsHash: Hex;
}

export interface TaskCompletedEvent {
  taskId:      bigint;
  operatorPay: bigint;
  platformFee: bigint;
}