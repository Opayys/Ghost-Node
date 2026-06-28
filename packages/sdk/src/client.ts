import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  encodePacked,
  toHex,
  parseEventLogs,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hex,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

import {
  AGENT_REGISTRY_ABI,
  TASK_ESCROW_ABI,
  ERC20_ABI,
  GHOSTNODE,
} from "./constants";

import type {
  GhostNodeConfig,
  AgentProfile,
  RegisterAgentParams,
  Task,
  SubmitTaskParams,
} from "./types";

// ─── Anvil local chain ────────────────────────────────────────────────────────
const anvilChain: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
};

function getChain(chainId: number): Chain {
  if (chainId === 8453)  return base;
  if (chainId === 84532) return baseSepolia;
  return anvilChain;
}

// ─── GhostNodeClient ──────────────────────────────────────────────────────────
export class GhostNodeClient {
  private publicClient:  PublicClient;
  private walletClient:  WalletClient;
  private config:        GhostNodeConfig;
  private account:       ReturnType<typeof privateKeyToAccount>;
  private chain:         Chain;

  constructor(config: GhostNodeConfig) {
    this.config  = config;
    this.account = privateKeyToAccount(config.privateKey);
    this.chain   = getChain(config.chainId);

    this.publicClient = createPublicClient({
      chain:     this.chain,
      transport: http(config.rpcUrl),
    });

    this.walletClient = createWalletClient({
      chain:     this.chain,
      transport: http(config.rpcUrl),
      account:   this.account,
    });
  }

  // ─── Agent Registry ────────────────────────────────────────────────────────

  async registerAgent(params: RegisterAgentParams): Promise<{
    agentId: bigint;
    txHash:  Hex;
  }> {
    console.log("Approving USDC stake...");
    await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.usdc,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [this.config.contracts.agentRegistry, GHOSTNODE.MIN_STAKE],
      account:      this.account,
    });

    console.log("Registering agent...");
    const txHash = await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
      args: [
        params.metadataURI,
        params.capabilities,
        params.pricePerTask,
        params.slaUptime,
        params.agentSmartAccount,
      ],
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const logs    = parseEventLogs({ abi: AGENT_REGISTRY_ABI, logs: receipt.logs });

    const registeredEvent = logs.find((l) => l.eventName === "AgentRegistered");
    if (!registeredEvent) throw new Error("AgentRegistered event not found");

    const agentId = (registeredEvent.args as { agentId: bigint }).agentId;
    console.log(`Agent registered! ID: ${agentId}`);

    return { agentId, txHash };
  }

  async getAgent(agentId: bigint): Promise<AgentProfile> {
    const result = await this.publicClient.readContract({
      address:      this.config.contracts.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "getAgent",
      args:         [agentId],
    });
    return result as unknown as AgentProfile;
  }

  async searchAgents(capability: Hex): Promise<bigint[]> {
    const result = await this.publicClient.readContract({
      address:      this.config.contracts.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "searchByCapability",
      args:         [capability],
    });
    return result as bigint[];
  }

  // ─── Task Escrow ───────────────────────────────────────────────────────────

  async submitTask(params: SubmitTaskParams): Promise<{
    taskId: bigint;
    txHash: Hex;
  }> {
    const taskParamsHash = keccak256(toHex(JSON.stringify(params.taskParams)));
    const agent   = await this.getAgent(params.agentId);
    const payment = agent.pricePerTask;

    console.log(`Approving ${payment} USDC for task...`);
    await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.usdc,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [this.config.contracts.taskEscrow, payment],
      account:      this.account,
    });

    console.log("Submitting task...");
    const txHash = await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.taskEscrow,
      abi:          TASK_ESCROW_ABI,
      functionName: "submitTask",
      args:         [params.agentId, taskParamsHash],
      account:      this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const logs    = parseEventLogs({ abi: TASK_ESCROW_ABI, logs: receipt.logs });

    const createdEvent = logs.find((l) => l.eventName === "TaskCreated");
    if (!createdEvent) throw new Error("TaskCreated event not found");

    const taskId = (createdEvent.args as { taskId: bigint }).taskId;
    console.log(`Task submitted! ID: ${taskId}`);

    return { taskId, txHash };
  }

  async commitResult(taskId: bigint, result: object, salt: Hex): Promise<Hex> {
    const resultBytes = toHex(JSON.stringify(result));
    const commitHash  = keccak256(encodePacked(["bytes", "bytes32"], [resultBytes, salt]));

    const txHash = await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.taskEscrow,
      abi:          TASK_ESCROW_ABI,
      functionName: "commitResult",
      args:         [taskId, commitHash],
      account:      this.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Result committed for task ${taskId}`);
    return txHash;
  }

  async revealResult(taskId: bigint, result: object, salt: Hex): Promise<Hex> {
    const resultBytes = toHex(JSON.stringify(result));

    const txHash = await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.taskEscrow,
      abi:          TASK_ESCROW_ABI,
      functionName: "revealResult",
      args:         [taskId, resultBytes, salt],
      account:      this.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Result revealed for task ${taskId}`);
    return txHash;
  }

  async finalizeTask(taskId: bigint): Promise<Hex> {
    const txHash = await this.walletClient.writeContract({
      chain:        this.chain,
      address:      this.config.contracts.taskEscrow,
      abi:          TASK_ESCROW_ABI,
      functionName: "finalizeTask",
      args:         [taskId],
      account:      this.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    console.log(`Task ${taskId} finalized - payment released!`);
    return txHash;
  }

  async getTask(taskId: bigint): Promise<Task> {
    const result = await this.publicClient.readContract({
      address:      this.config.contracts.taskEscrow,
      abi:          TASK_ESCROW_ABI,
      functionName: "getTask",
      args:         [taskId],
    });
    return result as unknown as Task;
  }

  async waitForTask(
    taskId: bigint,
    options: { pollInterval?: number; timeout?: number } = {}
  ): Promise<Task> {
    const { pollInterval = 3000, timeout = 300_000 } = options;
    const startTime = Date.now();

    console.log(`Waiting for task ${taskId} to complete...`);

    while (Date.now() - startTime < timeout) {
      const task = await this.getTask(taskId);
      if (task.status === 3 || task.status === 7) {
        console.log(`Task ${taskId} completed!`);
        return task;
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
  }

  async getUSDCBalance(address?: Address): Promise<bigint> {
    const target = address ?? this.account.address;
    return this.publicClient.readContract({
      address:      this.config.contracts.usdc,
      abi:          ERC20_ABI,
      functionName: "balanceOf",
      args:         [target],
    }) as Promise<bigint>;
  }

  get address(): Address {
    return this.account.address;
  }
}