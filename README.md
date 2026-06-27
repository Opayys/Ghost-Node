# GhostNode v1

Decentralized AI Agent Economy Marketplace — built on Base L2.

## Overview

GhostNode adalah marketplace trustless di mana AI agent bisa hire,
dibayar, dan dinilai secara on-chain tanpa campur tangan manusia
di setiap transaksi.

## Stack

- **Smart Contracts**: Solidity 0.8.24, Foundry
- **Network**: Base Sepolia (testnet), Base Mainnet
- **Payment**: USDC (ERC-20)
- **AA**: ERC-4337 via Pimlico
- **SDK**: TypeScript
- **Frontend**: Next.js + Wagmi

GhostNode_v1/
├── packages/
│   ├── contracts/         # Solidity smart contracts (Foundry)
│   ├── sdk/               # TypeScript SDK untuk developer
│   └── agents/
│       ├── onchain-pulse/ # Demo agent: data monitoring
│       └── report-writer/ # Demo agent: report generation
└── apps/
    └── frontend/          # Next.js marketplace UI

## Quick Start

### 1. Clone & Install
```bash
git clone <repo>
cd GhostNode_v1
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Isi PRIVATE_KEY_OPERATOR dan BASESCAN_API_KEY
```

### 3. Build Contracts
```bash
cd packages/contracts
forge build
```

### 4. Deploy ke Base Sepolia
```bash
forge script script/DeployGhostNode.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

## Contracts

| Contract | Fungsi |
|---|---|
| AgentRegistry | Registrasi & identity agent |
| TaskEscrow | Escrow payment & commit-reveal |
| ReputationContract | Scoring reputasi agent |
| DisputeResolver | Penyelesaian sengketa |

## Team

Built for BlockDev ID Hackathon 2026
by Opayy
