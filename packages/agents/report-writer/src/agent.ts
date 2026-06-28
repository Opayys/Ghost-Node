import type { OnChainPulseResult } from "../../onchain-pulse/src/agent";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportWriterParams {
  token:       string;
  window:      "1h" | "24h" | "7d";
  reportType:  "summary" | "detailed" | "alert";
}

export interface MarketReport {
  title:       string;
  token:       string;
  window:      string;
  reportType:  string;
  generatedAt: string;
  sections:    ReportSection[];
  summary:     string;
  sentiment:   "bullish" | "bearish" | "neutral";
}

interface ReportSection {
  title:   string;
  content: string;
}

// ─── ReportWriter Agent ───────────────────────────────────────────────────────

export class ReportWriterAgent {

  generateReport(
    params: ReportWriterParams,
    onChainData: OnChainPulseResult
  ): MarketReport {
    console.log(`[ReportWriter] Generating ${params.reportType} report for ${params.token}...`);

    const sections: ReportSection[] = [];

    // Section 1: Market Overview
    sections.push({
      title:   "Market Overview",
      content: this.generateOverview(params, onChainData),
    });

    // Section 2: On-Chain Metrics
    sections.push({
      title:   "On-Chain Metrics",
      content: this.generateMetrics(onChainData),
    });

    // Section 3: Network Status
    sections.push({
      title:   "Network Status",
      content: this.generateNetworkStatus(onChainData),
    });

    // Section 4: Outlook (hanya untuk detailed report)
    if (params.reportType === "detailed") {
      sections.push({
        title:   "Market Outlook",
        content: this.generateOutlook(params),
      });
    }

    const sentiment = this.analyzeSentiment(onChainData);
    const summary   = this.generateSummary(params, sentiment);

    const report: MarketReport = {
      title:       `${params.token} Market Report - ${params.window.toUpperCase()} Window`,
      token:       params.token,
      window:      params.window,
      reportType:  params.reportType,
      generatedAt: new Date().toISOString(),
      sections,
      summary,
      sentiment,
    };

    console.log("[ReportWriter] Report generated successfully!");
    return report;
  }

  private generateOverview(
    params: ReportWriterParams,
    data:   OnChainPulseResult
  ): string {
    const timeLabel = {
      "1h":  "past hour",
      "24h": "past 24 hours",
      "7d":  "past 7 days",
    }[params.window];

    return (
      `Analysis of ${params.token} for the ${timeLabel}. ` +
      `Data collected at ${new Date(data.timestamp).toUTCString()}. ` +
      `Status: ${data.status}. ` +
      `This report covers on-chain activity and network conditions ` +
      `to provide actionable market intelligence.`
    );
  }

  private generateMetrics(data: OnChainPulseResult): string {
    const parts: string[] = [];

    if (data.data.price) {
      parts.push(
        `Token: ${data.data.price.symbol}. ` +
        `Note: ${data.data.price.note}.`
      );
    }

    if (data.data.block_info) {
      parts.push(
        `Latest block: #${data.data.block_info.number}. ` +
        `Block timestamp: ${data.data.block_info.timestamp}. ` +
        `Gas limit: ${data.data.block_info.gasLimit}.`
      );
    }

    return parts.length > 0
      ? parts.join(" ")
      : "On-chain metrics data not available for this window.";
  }

  private generateNetworkStatus(data: OnChainPulseResult): string {
    if (!data.data.gas_price) {
      return "Network status data unavailable.";
    }

    const gasEth = parseFloat(data.data.gas_price.baseFeePerGas);
    const gasGwei = gasEth * 1e9;

    let congestion: string;
    if (gasGwei < 10)       congestion = "low — excellent time to transact";
    else if (gasGwei < 50)  congestion = "moderate — normal conditions";
    else if (gasGwei < 100) congestion = "high — consider waiting";
    else                    congestion = "very high — network congested";

    return (
      `Current gas price: ${gasGwei.toFixed(4)} Gwei. ` +
      `Network congestion: ${congestion}. ` +
      `Base fee: ${data.data.gas_price.baseFeePerGas} ${data.data.gas_price.unit}.`
    );
  }

  private generateOutlook(params: ReportWriterParams): string {
    return (
      `Based on current on-chain data for ${params.token}, ` +
      `the ${params.window} window shows stable network activity. ` +
      `Key factors to monitor: gas price trends, block production rate, ` +
      `and large wallet movements. ` +
      `This analysis is generated automatically by GhostNode ReportWriter Agent ` +
      `and should not be considered financial advice.`
    );
  }

  private analyzeSentiment(data: OnChainPulseResult): "bullish" | "bearish" | "neutral" {
    // Simplified sentiment based on gas price (high gas = high activity = bullish)
    if (!data.data.gas_price) return "neutral";

    const gasEth  = parseFloat(data.data.gas_price.baseFeePerGas);
    const gasGwei = gasEth * 1e9;

    if (gasGwei > 50)      return "bullish";
    else if (gasGwei < 5)  return "bearish";
    else                   return "neutral";
  }

  private generateSummary(
    params:    ReportWriterParams,
    sentiment: string
  ): string {
    return (
      `${params.token} ${params.window} report complete. ` +
      `Market sentiment: ${sentiment}. ` +
      `Generated by GhostNode ReportWriter Agent v1.0 ` +
      `powered by OnChainPulse data feed.`
    );
  }
}