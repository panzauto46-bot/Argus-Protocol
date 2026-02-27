# Argus Protocol 🛡️

**On-Chain Security For Your dApps, powered by Somnia Reactivity.**

*Submitted for the Somnia Reactivity Mini Hackathon.*

![Argus Protocol Banner](https://argus-protocol.vercel.app/og-image.png) <!-- Update this with your actual app screenshot if available -->

## 🚀 Vision
Argus Protocol is a paradigm shift in web3 security. Traditional security tools rely on off-chain cron jobs, delayed polling, or centralized indexing servers to detect smart contract exploits. 

By leveraging **Somnia Native On-chain Reactivity**, Argus Protocol acts as a true *Real-time On-chain Tracker & Guardian*. It listens directly to critical smart contract events (e.g., massive transfers, flash loans, unauthorized ownership changes) and pushes alerts or triggers defensive transactions in milliseconds—no external servers or polling required.

## 🛠️ How We Integrated Somnia Reactivity
The core of Argus Protocol relies on the `@somnia-chain/reactivity` SDK to achieve a **Real-Time UX**.

Here is how Reactivity is utilized in our stack:
1. **Push Delivery over Websockets**: Instead of continuously fetching blockchain state via `eth_call`, our React frontend subscribes to specific high-risk contracts on the **Somnia Testnet**.
2. **Atomic Notifications**: When a monitored contract emits an event (e.g., a massive token dump), Somnia's Reactivity layer pushes the event & the state from the exact same block directly to our typescript client.
3. **Instant Mitigation UI**: The dashboard instantly transitions from "Safe" to "Triggered", updating charts and alerting the Dev team in milliseconds without manual page refreshes.

This demonstrates the power of "Reactivity" vs traditional "Polling".

## 💻 Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS (for modern, responsive UI)
- **Blockchain SDK**: `@somnia-chain/reactivity`, `viem`, `ethers`
- **Charts**: Recharts (for real-time visualizations of on-chain events)
- **Deployment**: Vercel

## 🌐 Live Demo
- **App URL**: [https://argus-protocol.vercel.app](https://argus-protocol.vercel.app)
- **Network**: Somnia Testnet
- **Video Demo**: *(Link to your 2-5 min demo video here)*

## 📦 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Metamask wallet configured with **Somnia Testnet**:
  - Network Name: Somnia Testnet
  - RPC URL: `https://dream-rpc.somnia.network`
  - Chain ID: `50312`
  - Currency Symbol: `STT`

### Installation
1. Clone the repository
```bash
git clone https://github.com/panzauto46-bot/Argus-Protocol.git
cd Argus-Protocol
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

## 🎯 Use Cases Showcased
- **Automation & Infrastructure**: Real-time cross-contract alert system for dApp administrators.
- **Analytics Dashboards**: Fluid, real-time visualization of on-chain state changes.

---
*Built with ❤️ for the Somnia Reactivity Ecosystem.*
