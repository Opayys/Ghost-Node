import {
  createPublicClient,
  http,
  formatEther,
} from "viem";
import { base, baseSepolia } from "viem/chains";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnChainPulseParams {
  token:   string;
  window:  "1h" | "24h" | "7d";
  metrics: Array<"price" | "volume" | "block_info" | "gas_price">;
}

export interface OnChainPulseResult {
  token:     string;
  window:    string;
  timestamp: number;
  data: {
    price?:      PriceData;
    block_info?: BlockInfo;
    gas_price?:  GasData;
  };
  status: "success" | "partial" | "error";
}

interface PriceData {
  symbol: string;
  note:   string;
}

interface BlockInfo {
  number:    string;
  timestamp: string;
  gasLimit:  string;
}

interface GasData {
  baseFeePerGas: string;
  unit:          string;
}

// ─── OnChainPulse Agent ───────────────────────────────────────────────────────

export class OnChainPulseAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(rpcUrl: string, chainId: number) {
    const chain = chainId === 8453 ? base
                : chainId === 84532 ? baseSepolia
                : {
                    id: 31337,
                    name: "Anvil",
                    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                    rpcUrls: { default: { http: [rpcUrl] } },
                  };

    this.client = createPublicClient({
      chain: chain as any,
      transport: http(rpcUrl),
    });
  }

  async execute(params: OnChainPulseParams): Promise<OnChainPulseResult> {
    console.log(`[OnChainPulse] Executing task for ${params.token}...`);

    const result: OnChainPulseResult = {
      token:     params.token,
      window:    params.window,
      timestamp: Date.now(),
      data:      {},
      status:    "success",
    };

    try {
      for (const metric of params.metrics) {
        if (metric === "price") {
          result.data.price = await this.fetchPrice(params.token);
        } else if (metric === "block_info") {
          result.data.block_info = await this.fetchBlockInfo();
        } else if (metric === "gas_price") {
          result.data.gas_price = await this.fetchGasPrice();
        }
      }
    } catch (err) {
      console.error("[OnChainPulse] Error:", err);
      result.status = "partial";
    }

    console.log("[OnChainPulse] Done:", JSON.stringify(result, null, 2));
    return result;
  }

  private async fetchPrice(token: string): Promise<PriceData> {
    return {
      symbol: token.toUpperCase(),
      note:   "Price oracle integration needed for production",
    };
  }

  private async fetchBlockInfo(): Promise<BlockInfo> {
    const block = await this.client.getBlock();
    return {
      number:    block.number?.toString() ?? "0",
      timestamp: block.timestamp?.toString() ?? "0",
      gasLimit:  block.gasLimit?.toString() ?? "0",
    };
  }

  private async fetchGasPrice(): Promise<GasData> {
    const gasPrice = await this.client.getGasPrice();
    return {
      baseFeePerGas: formatEther(gasPrice),
      unit:          "ETH",
    };
  }
}

export function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}