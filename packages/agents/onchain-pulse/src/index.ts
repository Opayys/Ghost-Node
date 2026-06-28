import * as dotenv from "dotenv";
import * as path from "path";
import { keccak256, toHex, encodePacked, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { GhostNodeClient, Capability } from "@ghostnode/sdk";
import { OnChainPulseAgent, type OnChainPulseParams, bigIntReplacer } from "./agent";

// Load .env dari root project
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL   = process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545";
const CHAIN_ID  = parseInt(process.env.CHAIN_ID || "31337");
const PRIV_KEY  = process.env.PRIVATE_KEY_OPERATOR as Hex;

const CONTRACTS = {
  agentRegistry:      process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`,
  taskEscrow:         process.env.TASK_ESCROW_ADDRESS as `0x${string}`,
  reputationContract: process.env.REPUTATION_CONTRACT_ADDRESS as `0x${string}`,
  usdc:               process.env.USDC_ADDRESS as `0x${string}`,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==========================================");
  console.log("  ONCHAIN PULSE AGENT - GhostNode");
  console.log("==========================================");
  console.log("RPC URL  :", RPC_URL);
  console.log("Chain ID :", CHAIN_ID);
  console.log("");

  // Init GhostNode SDK client
  const client = new GhostNodeClient({
    chainId:   CHAIN_ID,
    rpcUrl:    RPC_URL,
    privateKey: PRIV_KEY,
    contracts:  CONTRACTS,
  });

  console.log("Operator address:", client.address);

  // Init OnChainPulse agent logic
  const agent = new OnChainPulseAgent(RPC_URL, CHAIN_ID);

  // Step 1: Register agent ke GhostNode marketplace
  console.log("\n[Step 1] Registering OnChainPulse agent...");
  let agentId: bigint;

  try {
    const result = await client.registerAgent({
      metadataURI: JSON.stringify({
        name:        "OnChainPulse v1",
        description: "Real-time on-chain data monitoring for Ethereum & Base",
        version:     "1.0.0",
        endpoint:    "http://localhost:3001/task",
      }),
      capabilities:      [Capability.ONCHAIN_DATA_FETCHING, Capability.PRICE_ORACLE],
      pricePerTask:      BigInt(500_000),  // $0.50 USDC
      slaUptime:         9500,             // 95%
      agentSmartAccount: client.address,
    });

    agentId = result.agentId;
    console.log(`Agent registered! ID: ${agentId}`);
  } catch (err) {
    console.log("Agent already registered or error, trying agentId 0...");
    agentId = BigInt(0);
  }

  // Step 2: Polling untuk task baru
  console.log("\n[Step 2] Starting task polling...");
  console.log("Waiting for tasks... (Ctrl+C to stop)\n");

  let lastTaskId = BigInt(0);

  setInterval(async () => {
    try {
      // Cek apakah ada task baru untuk agent ini
      const nextTaskId = await getNextTaskId(client);

      for (let id = lastTaskId; id < nextTaskId; id++) {
        const task = await client.getTask(id);

        // Hanya proses task untuk agent ini yang statusnya CREATED (0)
        if (task.agentId === agentId && task.status === 0) {
          console.log(`\n[Task ${id}] New task received!`);
          await processTask(client, agent, id);
          lastTaskId = id + BigInt(1);
        }
      }
    } catch {
      // Silence polling errors
    }
  }, 5000); // Poll tiap 5 detik
}

async function getNextTaskId(client: GhostNodeClient): Promise<bigint> {
  try {
    const task = await client.getTask(BigInt(999999));
    return BigInt(0);
  } catch {
    return BigInt(0);
  }
}

async function processTask(
  client:  GhostNodeClient,
  agent:   OnChainPulseAgent,
  taskId:  bigint
): Promise<void> {
  try {
    console.log(`[Task ${taskId}] Processing...`);

    // Default params kalau tidak bisa decode
    const params: OnChainPulseParams = {
      token:   "ETH",
      window:  "24h",
      metrics: ["block_info", "gas_price"],
    };

    // Execute agent logic
    const result = await agent.execute(params);

    // Generate random salt
    const salt = keccak256(toHex(`salt-${taskId}-${Date.now()}`)) as Hex;

    // Commit result
    console.log(`[Task ${taskId}] Committing result...`);
    await client.commitResult(taskId, result, salt);

    // Reveal result
    console.log(`[Task ${taskId}] Revealing result...`);
    await client.revealResult(taskId, result, salt);

    console.log(`[Task ${taskId}] Done! Payment will auto-release in 24h.`);
    console.log(`Result: ${JSON.stringify(result, bigIntReplacer, 2)}`);

  } catch (err) {
    console.error(`[Task ${taskId}] Error:`, err);
  }
}

main().catch(console.error);