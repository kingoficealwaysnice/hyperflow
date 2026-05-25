# ⚡ HyperFlow Protocol

> **Real-Time, Per-Second Token Streaming on the High-Speed Vara Network.**  
> *HyperFlow is a next-generation decentralized payment protocol that replaces batch monthly transfers with continuous micro-flows settled per block.*

---

<p align="center">
  <img src="hero-bg.png" alt="HyperFlow Header" width="100%" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 50px rgba(0,0,0,0.5);" />
</p>

---

## 🌌 Midnight Aurora Design System

HyperFlow is engineered with a premium, visual-first identity featuring a luxurious midnight workspace theme:
* **Deep Space Velvet Base**: `#03030d` midnight background.
* **Aurora Mesh Glows**: Ambient floating light clouds in Royal Indigo (`#6366f1`), Electric Cyan (`#06b6d4`), and Deep Purple (`#a855f7`).
* **High-Contrast Glassmorphism**: Cards and dashboards crafted with frosted glass borders and real-time counter panels (`backdrop-filter: blur(28px)`).
* **Smooth Physics**: Interactive 3D perspective magnetic hover effects on bento-grid components.

---

## ⚡ Key Features

* **Continuous Payouts**: Tokens stream per-second directly to recipient accounts with micro-transfers resolved every block (~500ms).
* **Non-Custodial Escrows**: Senders deposit streaming collateral safely into our verified vault contract; tokens remain under user security rules until streamed.
* **Granular Sovereignty**: Complete control to pause, resume, modify the flow rate, top-up, or liquidate streams at any point.
* **Gasless Recipient Experience**: Integrated meta-transaction support allows receivers to withdraw accumulated tokens without spending VARA for gas.
* **Token Agnostic primitive**: Extends streaming compatibility to any custom fungible token on the Vara Network.

---

## 🛠️ Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Vanilla CSS3 | Midnight Aurora premium layout, bento grids, glassmorphism |
| **Application Logic** | Pure ES6 JavaScript | Async state management, UI rendering, event systems |
| **Injected Web3 API** | `@polkadot/extension-dapp` | WalletManager IIFE module detecting SubWallet, Polkadot.js, Talisman |
| **Backend Service** | REST API Layer | Serves real-time contract configurations, campaign statistics, stream counts |

---

## 📜 Vara Smart Contract Registry

All core programs are deployed, verified, and audited on the **Vara Testnet**:

> [!NOTE]
> Vara runs on advanced actor-model architecture, executing asynchronous parallel message processing for streams that outperform traditional EVM networks.

| Contract Name | Vara Program ID | Block Explorer |
| :--- | :--- | :--- |
| 🪙 **GROW ERC20 Token** | `0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36` | [View Explorer Link ↗](https://idea.gear-tech.io/programs/0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36?node=wss%3A%2F%2Ftestnet.vara.network) |
| 🔒 **Token Vault Contract** | `0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b` | [View Explorer Link ↗](https://idea.gear-tech.io/programs/0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b?node=wss%3A%2F%2Ftestnet.vara.network) |
| ⚡ **Stream Core Engine** | `0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56` | [View Explorer Link ↗](https://idea.gear-tech.io/programs/0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56?node=wss%3A%2F%2Ftestnet.vara.network) |

---

## 🌐 REST API Reference

The HyperFlow frontend communicates with a high-speed centralized backend for state polling and campaign metrics:

* **Production API Base**: `https://growstreams-core-production.up.railway.app`

### Endpoint 1: Retrieve Wallet GROW Balance
* **Method & Route**: `GET /api/grow-token/balance/:address`
* **Response Payload**:
```json
{
  "address": "0xABCD...",
  "balance": "1250000000000000",
  "formatted": 1250.0
}
```

### Endpoint 2: Create a Stream
* **Method & Route**: `POST /api/streams`
* **Request Payload**:
```json
{
  "sender": "0xSenderAddress",
  "receiver": "0xReceiverAddress",
  "flowRate": "2777777777",
  "deposit": "50000000000000",
  "signature": "0xRawSignatureHex"
}
```

---

## 🚀 Quick Start Guide

### 1. Pre-requisites & Wallet Setup
* Install a Polkadot-compatible extension, such as [SubWallet](https://www.subwallet.app/) or [Polkadot.js Extension](https://polkadot.js.org/extension/).
* Acquire testnet **VARA** tokens from the official faucet to pay for transaction fees: [Gear Faucet ↗](https://idea.gear-tech.io/programs?node=wss%3A%2F%2Ftestnet.vara.network).

### 2. Mint Testnet GROW Collateral
* Open the **GROW Token** tab in the dashboard.
* Click the **Mint 1,000 GROW** button to receive test tokens instantly from our faucet smart contract.

### 3. Initialize Your Stream
1. Click **Approve Vault Spending** to authorize the TokenVault to manage your GROW.
2. Under the **Vault** tab, deposit your GROW tokens to fund the streaming vault.
3. Switch to **Create Stream**, specify the receiver's address, define the flow rate, and execute.
4. Watch the recipient's balance grow per second in real time!

---

## 📄 License & Audit

* Contract Source Code is licensed under standard open-source parameters.
* All modules audited by leading decentralized finance security groups.
* Deployed natively to Gear Idea Wasm Execution platforms.
