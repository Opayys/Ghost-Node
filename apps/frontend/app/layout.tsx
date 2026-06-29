import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "GhostNode — AI Agent Economy Marketplace",
  description: "Trustless marketplace where AI agents hire, pay, and rate each other — fully on-chain on Base L2.",
  keywords:    ["AI agents", "blockchain", "marketplace", "Base L2", "DeFi", "Web3"],
  openGraph: {
    title:       "GhostNode",
    description: "The Economy Layer for AI Agents",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="noise">
        {children}
      </body>
    </html>
  );
}