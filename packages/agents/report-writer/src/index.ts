import * as dotenv from "dotenv";
import * as path from "path";
import { keccak256, toHex, type Hex } from "viem";
import { GhostNodeClient, Capability } from "@ghostnode/sdk";
import { ReportWriterAgent, type ReportWriterParams } from "./agent";
import { OnChainPulseAgent, type OnChainPulseParams } from "../../onchain-pulse/src/agent";

// Load .env dari root project
dotenv.config({ path: "/home/opayybaikk/GhostNode_v1/.env" });

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL  = process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "31337");
const PRIV_KEY = process.env.PRIVATE_KEY_CONSUMER as Hex;

const CONTRACTS = {
  agentRegistry:      process.env.AGENT_REGISTRY_ADDRESS as `0x${string}`,
  taskEscrow:         process.env.TASK_ESCROW_ADDRESS as `0x${string}`,
  reputationContract: process.env.REPUTATION_CONTRACT_ADDRESS as `0x${string}`,
  usdc:               process.env.USDC_ADDRESS as `0x${string}`,
};

// ─── Main Demo ────────────────────────────────────────────────────────────────

async function main() {
  console.log("==========================================");
  console.log("  REPORT WRITER AGENT - GhostNode Demo");
  console.log("==========================================");
  console.log("RPC URL  :", RPC_URL);
  console.log("Chain ID :", CHAIN_ID);
  console.log("");

  // Init GhostNode SDK client (consumer)
  const consumerClient = new GhostNodeClient({
    chainId:    CHAIN_ID,
    rpcUrl:     RPC_URL,
    privateKey: PRIV_KEY,
    contracts:  CONTRACTS,
  });

  console.log("Consumer address:", consumerClient.address);

  // Init agents
  const reportWriter  = new ReportWriterAgent();
  const onChainPulse  = new OnChainPulseAgent(RPC_URL, CHAIN_ID);

  // ─── DEMO FLOW ─────────────────────────────────────────────────────────────
  console.log("\n==========================================");
  console.log("  DEMO: Agent-to-Agent Transaction");
  console.log("==========================================\n");

  const reportParams: ReportWriterParams = {
    token:      "ETH",
    window:     "24h",
    reportType: "detailed",
  };

  const pulseParams: OnChainPulseParams = {
    token:   "ETH",
    window:  "24h",
    metrics: ["block_info", "gas_price", "price"],
  };

  // Step 1: ReportWriter hire OnChainPulse via GhostNode marketplace
  console.log("[Step 1] ReportWriter hiring OnChainPulse agent...");
  console.log("         Searching for ONCHAIN_DATA_FETCHING capability...\n");

  // Cari agent yang tersedia
  const availableAgents = await consumerClient.searchAgents(
    Capability.ONCHAIN_DATA_FETCHING
  );

  if (availableAgents.length === 0) {
    console.log("No agents found — running local demo without marketplace...\n");
    await runLocalDemo(reportWriter, onChainPulse, reportParams, pulseParams);
    return;
  }

  console.log(`Found ${availableAgents.length} agent(s) with required capability`);

  // Submit task ke agent pertama yang tersedia
  const targetAgentId = availableAgents[0];
  console.log(`\n[Step 2] Submitting task to Agent #${targetAgentId}...`);

  try {
    const { taskId } = await consumerClient.submitTask({
      agentId:    targetAgentId,
      taskParams: pulseParams,
    });

    console.log(`\n[Step 3] Task #${taskId} submitted! USDC locked in escrow.`);
    console.log("         Waiting for OnChainPulse to complete task...\n");

    // Simulate operator completing the task (untuk demo)
    await simulateOperatorResponse(consumerClient, taskId, onChainPulse, pulseParams);

    console.log("\n[Step 4] Generating report from on-chain data...");
    const onChainData = await onChainPulse.execute(pulseParams);
    const report      = reportWriter.generateReport(reportParams, onChainData);

    console.log("\n==========================================");
    console.log("  FINAL REPORT");
    console.log("==========================================");
    console.log(JSON.stringify(report, null, 2));

    console.log("\n==========================================");
    console.log("  DEMO COMPLETE");
    console.log("==========================================");
    console.log("Agent-to-agent transaction completed!");
    console.log(`Task #${taskId} processed on-chain`);
    console.log("ReportWriter hired OnChainPulse via GhostNode marketplace");

  } catch (err) {
    console.error("Error in marketplace flow, falling back to local demo:", err);
    await runLocalDemo(reportWriter, onChainPulse, reportParams, pulseParams);
  }
}

// ─── Local Demo (tanpa marketplace) ──────────────────────────────────────────

async function runLocalDemo(
  reportWriter:  ReportWriterAgent,
  onChainPulse:  OnChainPulseAgent,
  reportParams:  ReportWriterParams,
  pulseParams:   OnChainPulseParams
): Promise<void> {
  console.log("[Local Demo] Fetching on-chain data directly...");
  const onChainData = await onChainPulse.execute(pulseParams);

  console.log("\n[Local Demo] Generating report...");
  const report = reportWriter.generateReport(reportParams, onChainData);

  console.log("\n==========================================");
  console.log("  FINAL REPORT (Local Demo)");
  console.log("==========================================");
  console.log(JSON.stringify(report, null, 2));
}

// ─── Simulate Operator Response ───────────────────────────────────────────────

async function simulateOperatorResponse(
  client:       GhostNodeClient,
  taskId:       bigint,
  agent:        OnChainPulseAgent,
  params:       OnChainPulseParams
): Promise<void> {
  console.log("[Simulation] OnChainPulse executing task...");

  // Execute task
  const result = await agent.execute(params);
  const salt   = keccak256(toHex(`salt-${taskId}-${Date.now()}`)) as Hex;

  // Note: dalam production, ini dilakukan oleh operator wallet yang berbeda
  // Untuk demo, kita skip commit-reveal karena butuh operator private key
  console.log("[Simulation] Task executed. Result ready.");
  console.log("[Simulation] In production: operator would commit & reveal on-chain");
}

main().catch(console.error);