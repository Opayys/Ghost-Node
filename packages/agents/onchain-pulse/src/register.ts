import * as dotenv from "dotenv";
import { keccak256, toHex, type Hex } from "viem";
import { GhostNodeClient, Capability } from "@ghostnode/sdk";
import { OnChainPulseAgent } from "./agent";

dotenv.config({ path: "/home/opayybaikk/GhostNode_v1/.env" });

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL  = process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337");
const PRIV_KEY = process.env.PRIVATE_KEY_OPERATOR as Hex;

const CONTRACTS = {
  agentRegistry:      process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`,
  taskEscrow:         process.env.TASK_ESCROW_ADDRESS as `0x${string}`,
  reputationContract: process.env.REPUTATION_CONTRACT_ADDRESS as `0x${string}`,
  usdc:               process.env.USDC_ADDRESS as `0x${string}`,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==========================================");
  console.log("  ONCHAIN PULSE - Register to GhostNode");
  console.log("==========================================");

  const client = new GhostNodeClient({
    chainId:    CHAIN_ID,
    rpcUrl:     RPC_URL,
    privateKey: PRIV_KEY,
    contracts:  CONTRACTS,
  });

  console.log("Operator :", client.address);

  // Check USDC balance
  const balance = await client.getUSDCBalance();
  console.log("USDC Balance:", (Number(balance) / 1e6).toFixed(2), "USDC");
  console.log("");

  // Step 1: Register agent
  console.log("[Step 1] Registering OnChainPulse to marketplace...");

  const { agentId, txHash } = await client.registerAgent({
    metadataURI: JSON.stringify({
      name:        "OnChainPulse v1",
      description: "Real-time on-chain data monitoring for Ethereum & Base",
      version:     "1.0.0",
    }),
    capabilities:      [
      Capability.ONCHAIN_DATA_FETCHING,
      Capability.PRICE_ORACLE,
    ],
    pricePerTask:      BigInt(500_000),  // 0.5 USDC
    slaUptime:         9500,
    agentSmartAccount: client.address,
  });

  console.log(`Agent registered! ID: ${agentId}`);
  console.log(`Tx: ${txHash}`);
  console.log("");

  // Step 2: Verify agent terdaftar
  console.log("[Step 2] Verifying agent in registry...");
  const agent = await client.getAgent(agentId);
  console.log("Agent active  :", agent.isActive);
  console.log("Price per task:", (Number(agent.pricePerTask) / 1e6).toFixed(2), "USDC");
  console.log("Stake amount  :", (Number(agent.stakeAmount) / 1e6).toFixed(2), "USDC");
  console.log("");

  // Step 3: Search by capability
  console.log("[Step 3] Searching agents by capability...");
  const results = await client.searchAgents(Capability.ONCHAIN_DATA_FETCHING);
  console.log(`Found ${results.length} agent(s) with ONCHAIN_DATA_FETCHING`);
  console.log("Agent IDs:", results.map(id => id.toString()));
  console.log("");

  // Step 4: Submit test task dari consumer
  console.log("[Step 4] Submitting test task as consumer...");

  // Pakai wallet #1 sebagai consumer
  const consumerClient = new GhostNodeClient({
    chainId:    CHAIN_ID,
    rpcUrl:     RPC_URL,
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    contracts:  CONTRACTS,
  });

  // Mint USDC ke consumer dulu (hanya bisa di local testnet)
  console.log("Consumer :", consumerClient.address);

  const { taskId } = await consumerClient.submitTask({
    agentId:    agentId,
    taskParams: {
      token:   "ETH",
      window:  "24h",
      metrics: ["block_info", "gas_price", "price"],
    },
  });

  console.log(`Task submitted! ID: ${taskId}`);
  console.log("");

  // Step 5: Operator process task (commit + reveal)
  console.log("[Step 5] Operator processing task...");

  const pulseAgent = new OnChainPulseAgent(RPC_URL, CHAIN_ID);
  const result     = await pulseAgent.execute({
    token:   "ETH",
    window:  "24h",
    metrics: ["block_info", "gas_price", "price"],
  });

  const salt = keccak256(toHex(`salt-${taskId}-${Date.now()}`)) as Hex;

  console.log("Committing result...");
  await client.commitResult(taskId, result, salt);

  console.log("Revealing result...");
  await client.revealResult(taskId, result, salt);

  console.log("");
  console.log("==========================================");
  console.log("  FULL ON-CHAIN FLOW COMPLETE!");
  console.log("==========================================");
  console.log(`Agent ID  : ${agentId}`);
  console.log(`Task ID   : ${taskId}`);
  console.log("Status    : Result revealed, waiting 24h dispute window");
  console.log("Next step : Call finalizeTask() after dispute window");
  console.log("");
  console.log("On-chain result:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);