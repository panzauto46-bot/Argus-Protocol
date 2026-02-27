<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20on%20Testnet-00d4aa?style=for-the-badge&logo=ethereum&logoColor=white" alt="Status" />
  <img src="https://img.shields.io/badge/Network-Somnia%20Testnet-06b6d4?style=for-the-badge&logo=blockchain.com&logoColor=white" alt="Network" />
  <img src="https://img.shields.io/badge/Built%20With-Somnia%20Reactivity-3b82f6?style=for-the-badge&logo=lightning&logoColor=white" alt="Built With" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🛡️ Argus Protocol</h1>

<p align="center">
  <strong>Real-Time On-Chain Security Guardian — Powered by Somnia Reactivity</strong>
</p>

<p align="center">
  <em>Autonomous smart contract monitoring, burst anomaly detection, and incident recovery — all driven by on-chain reactive event streams with zero off-chain polling.</em>
</p>

<p align="center">
  <a href="https://argus-protocol.vercel.app"><strong>🌐 Live Demo</strong></a> ·
  <a href="#-features"><strong>✨ Features</strong></a> ·
  <a href="#-architecture"><strong>🏗️ Architecture</strong></a> ·
  <a href="#-getting-started"><strong>🚀 Getting Started</strong></a> ·
  <a href="#-roadmap"><strong>🗺️ Roadmap</strong></a>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [How Somnia Reactivity Is Integrated](#-how-somnia-reactivity-is-integrated)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Security Model](#-security-model)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**Argus Protocol** is a next-generation, real-time on-chain security platform built on top of the **Somnia Network**. Named after Argus Panoptes — the all-seeing giant from Greek mythology — Argus Protocol provides continuous, reactive monitoring of smart contract activity with zero reliance on traditional off-chain infrastructure.

Unlike conventional security tools that depend on centralized indexers, cron-job polling, or delayed event processing, Argus Protocol leverages **Somnia's Native On-Chain Reactivity** to deliver **sub-second threat detection and automated incident response** — directly from the blockchain to your dashboard.

> **🏆 Submitted for the [Somnia Reactivity Mini Hackathon](https://somnia.network)**

---

## ❌ The Problem

Traditional Web3 security approaches suffer from critical architectural flaws:

| Problem | Impact |
|---------|--------|
| **Off-chain polling** | Security tools rely on `eth_call` polling loops or centralized indexing servers, introducing 5-30 second detection delays |
| **Centralized servers** | Alert systems require external backends (AWS, GCP) — single points of failure in a supposedly decentralized stack |
| **Delayed detection** | By the time a flash loan exploit is detected through traditional means, funds are already drained |
| **No reactive defense** | Existing tools can only observe, not react — they cannot trigger defensive actions in the same block as the exploit |
| **Fragmented workflows** | Detection, alerting, and recovery exist in separate tools with no unified operator flow |

---

## ✅ Our Solution

Argus Protocol eliminates these problems with a fundamentally different architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARGUS PROTOCOL                             │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ Somnia   │───▶│ Reactivity   │───▶│ Argus Client-Side    │   │
│  │ Testnet  │    │ WebSocket    │    │ Detection Engine     │   │
│  │ (50312)  │    │ Push Stream  │    │                      │   │
│  └──────────┘    └──────────────┘    │ • Burst Analysis     │   │
│                                      │ • Threshold Engine   │   │
│                                      │ • Status FSM         │   │
│                                      │ • Alert Pipeline     │   │
│                                      └──────────┬───────────┘   │
│                                                 │               │
│                                      ┌──────────▼───────────┐   │
│                                      │ Operator Dashboard   │   │
│                                      │                      │   │
│                                      │ • Real-time Charts   │   │
│                                      │ • Activity Log       │   │
│                                      │ • Recovery Panel     │   │
│                                      │ • Notification Hub   │   │
│                                      └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Differentiators:**
- **🔴 Zero Polling** — Events are pushed, not pulled. No `setInterval`, no cron jobs.
- **⚡ Sub-Second Detection** — Reactive streams deliver events in the same block they are emitted.
- **🧠 Deterministic FSM** — Protocol status transitions follow a clear `SAFE → MONITORING → TRIGGERED` finite state machine.
- **🔄 Unified Workflow** — Detection, alerting, and recovery are handled in one continuous operator flow.
- **🌐 No Backend Required** — The entire security pipeline runs client-side, powered by Somnia's reactive transport.

---

## ⚙️ How Somnia Reactivity Is Integrated

Somnia Reactivity is not just a nice-to-have — it is the **core architectural foundation** of Argus Protocol. Here's exactly how we use it:

### 1. Push-Based Event Delivery via WebSocket

```typescript
// src/components/Dashboard.tsx
const sdk = new SDK({ public: publicClient });
const result = await sdk.subscribe({
  ethCalls: [],
  context: "topic0",
  eventContractSources: [contractAddress],
  topicOverrides: topic0 ? [topic0] : undefined,
  onlyPushChanges: false,
  onData: (packet) => {
    // Events arrive here in real time — no polling!
    const topics = packet?.result?.topics ?? [];
    const dataHex = packet?.result?.data ?? "0x";
    recordStreamEvent({ wallet, topic0, dataHex, source: "live" });
  },
});
```

Instead of calling `eth_getLogs` in a loop, Argus opens a **persistent WebSocket subscription** to the Somnia Testnet through the `@somnia-chain/reactivity` SDK. When a monitored contract emits an event, the data arrives at the client in **the same block** — with zero delay.

### 2. Atomic State Transitions

When events arrive through the reactive stream, Argus immediately evaluates them against the configured tripwire rules:

```
Event Received → Burst Counter Updated → Threshold Check → Status Transition
                                                            │
                                              ┌─────────────┼─────────────┐
                                              │             │             │
                                           SAFE        MONITORING    TRIGGERED
                                        (Normal)    (Warning Zone)  (Emergency)
```

This happens **atomically in the same execution context** as the event delivery — there is no lag between detection and response.

### 3. Automatic Reconnection with Exponential Backoff

The reactive stream includes resilient connection management:
- Automatic reconnection on WebSocket interruptions
- Exponential backoff (1s → 2s → 4s → 8s → 15s max)
- Connection state tracking (`IDLE → CONNECTING → LIVE → ERROR`)
- Alert emission for all connection state changes

---

## ✨ Features

### 🔰 Sentinel Engine (Dashboard)
The real-time monitoring dashboard that visualizes the reactive event stream:
- **Live Area Chart** — Rolling count of events in the detection window, updated every second
- **Status Indicator** — Visual `SAFE` / `MONITORING` / `TRIGGERED` state with color-coded animations
- **Metric Cards** — Events in window, burst threshold usage, window size, stream latency
- **Activity Log** — Tabular view of every event pushed by Somnia Reactivity, with source tagging

### ⚡ Custom Tripwires (Configuration)
The rule engine where operators define their threat parameters:
- **Contract Address** — EVM address of the smart contract to monitor (validated with `viem.isAddress`)
- **Topic0 Filter** — Optional event signature hash for filtering specific event types
- **Burst Threshold** — Number of events that trigger emergency status (2-24, with risk level indicator)
- **Time Window** — Configurable detection window in seconds or minutes
- **Quick Demo Mode** — One-click preset that loads a valid config and jumps to Dashboard
- **Persistent Config** — Settings saved to `localStorage` and restored on page reload

### 🔔 Instant Alerts (Notification Hub)
Multi-channel alert system that captures all system events:
- **Alert Feed** — Chronological log of all wallet, config, reactivity, and recovery events
- **Discord Integration** — Webhook URL configuration for alert forwarding
- **Telegram Integration** — Bot token and chat ID configuration for alert delivery
- **Alert Levels** — `info`, `warning`, `critical`, `success` with distinct visual styling
- **Channel Tagging** — Every alert is tagged with its source (`Wallet`, `Config`, `Reactivity`, `Recovery`, `Demo`)

### 🔄 Recovery Panel
Deterministic incident response workflow:
- **Incident Report** — Structured summary with detection time, event count, contract address, and topic filter
- **Fund Protection Summary** — Visual progress bar showing percentage of funds saved vs. lost
- **Recovery Actions** — Two-step confirmation flow (`Resolve & Resume → Confirm Resume`)
- **Countdown Timer** — 5-second visual countdown during incident resolution
- **Demo Trigger** — Manual exploit simulation for testing the complete recovery workflow

### 🎨 Premium UI/UX
- **Dark/Light Mode** — Full theme support with smooth CSS transitions
- **Neural Background** — Animated canvas background with particle network effect
- **Glassmorphism** — Backdrop blur, semi-transparent cards, and gradient overlays
- **Micro-Animations** — Tilt effects, reveal-on-scroll, parallax layers, shimmer buttons
- **Scroll Progress** — Gradient progress bar at the top of the viewport
- **Responsive Design** — Mobile-first layout with adaptive navigation

### 🔐 Wallet Integration
- **MetaMask Connection** — Full EIP-1193 provider integration
- **Auto Chain Switch** — Automatic Somnia Testnet network addition and switching (Chain ID: 50312)
- **Session Persistence** — Wallet state restored on page reload via `eth_accounts`
- **Account/Chain Listeners** — Real-time tracking of `accountsChanged` and `chainChanged` events

---

## 🏗️ Architecture

### Application State Machine

```
                    ┌──────────────────┐
                    │                  │
                    │   LANDING PAGE   │
                    │                  │
                    └────────┬─────────┘
                             │
                     Connect Wallet
                             │
              ┌──────────────▼──────────────┐
              │                             │
              │     APPLICATION SHELL       │
              │  ┌───────────────────────┐  │
              │  │       Navbar          │  │
              │  └───────────┬───────────┘  │
              │              │              │
              │  ┌───────────▼───────────┐  │
              │  │                       │  │
              │  │   Page Router (FSM)   │  │
              │  │                       │  │
              │  │  ┌─────┐ ┌────────┐   │  │
              │  │  │Dash │ │ Config │   │  │
              │  │  │board│ │  ure   │   │  │
              │  │  └─────┘ └────────┘   │  │
              │  │  ┌─────┐ ┌────────┐   │  │
              │  │  │Alert│ │Recovery│   │  │
              │  │  │  s  │ │ Panel  │   │  │
              │  │  └─────┘ └────────┘   │  │
              │  └───────────────────────┘  │
              └─────────────────────────────┘
```

### Data Flow

```
Somnia Testnet (Chain 50312)
        │
        │  WebSocket (wss://dream-rpc.somnia.network/ws)
        ▼
┌───────────────────┐
│  @somnia-chain/    │
│  reactivity SDK    │
│  subscribe()       │
└────────┬──────────┘
         │  onData callback
         ▼
┌───────────────────┐     ┌──────────────────┐
│  recordStreamEvent │────▶│  Burst Counter   │
│  (Dashboard.tsx)   │     │  (eventTimestamps│
└────────┬──────────┘     │   rolling window)│
         │                └────────┬─────────┘
         │                         │
         ▼                         ▼
┌───────────────────┐     ┌──────────────────┐
│  Transaction Log   │     │  Status FSM      │
│  (Activity Table)  │     │  SAFE→MONITORING │
└───────────────────┘     │  →TRIGGERED      │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌──────────┐  ┌──────────┐  ┌──────────────┐
             │  Alert    │  │  Chart   │  │  Recovery    │
             │  Pipeline │  │  Update  │  │  Trigger     │
             └──────────┘  └──────────┘  └──────────────┘
```

### Contract Status Finite State Machine

```
          events < warningThreshold
    ┌─────────────────────────────────┐
    │                                 │
    ▼           events ≥ 60%          │
┌────────┐    of threshold     ┌──────┴─────┐
│  SAFE  │ ──────────────────▶ │ MONITORING │
│ (Green)│                     │  (Yellow)  │
└────────┘                     └──────┬─────┘
    ▲                                 │
    │        events ≥ threshold       │
    │                                 ▼
    │    Resolve & Resume      ┌───────────┐
    └──────────────────────────│ TRIGGERED │
                               │   (Red)   │
                               └───────────┘
```

---

## 📁 Project Structure

```
Argus-Protocol/
│
├── 📄 index.html                 # Entry HTML file with Vite mount point
├── 📄 package.json               # Dependencies and scripts
├── 📄 tsconfig.json              # TypeScript configuration
├── 📄 vite.config.ts             # Vite build config with React & singlefile plugins
├── 📄 .gitignore                 # Git ignore rules
├── 📄 README.md                  # This file
│
├── 📂 src/                       # Application source code
│   │
│   ├── 📄 main.tsx               # React DOM entry point, renders <App />
│   ├── 📄 polyfills.ts           # Buffer polyfill for browser compatibility
│   ├── 📄 index.css              # Global styles, design tokens, animations
│   │                               (custom CSS variables, glassmorphism,
│   │                                neural grid, micro-animations)
│   │
│   ├── 📄 App.tsx                # Root component & application state manager
│   │                               ├── ThemeContext (dark/light mode)
│   │                               ├── AppContext (global state)
│   │                               ├── Wallet connection logic (EIP-1193)
│   │                               ├── Monitoring config persistence
│   │                               ├── Landing page navigation (scroll spy)
│   │                               └── Page router (landing|dashboard|config|
│   │                                    notifications|recovery)
│   │
│   ├── 📂 components/            # UI components
│   │   ├── 📄 LandingPage.tsx    # Hero section, trust signals, feature grid,
│   │   │                           roadmap timeline, CTA, live session state
│   │   ├── 📄 Dashboard.tsx      # Threat Matrix — real-time chart, activity
│   │   │                           log, Somnia Reactivity subscription,
│   │   │                           burst detection engine, demo controls
│   │   ├── 📄 Configuration.tsx  # Tripwire rule editor — contract address,
│   │   │                           topic filter, threshold slider, time
│   │   │                           window, Quick Demo Mode
│   │   ├── 📄 Notifications.tsx  # Alert feed, Discord webhook, Telegram bot
│   │   │                           integration, channel filtering
│   │   ├── 📄 RecoveryPanel.tsx  # Incident report, fund protection summary,
│   │   │                           recovery actions, demo exploit trigger
│   │   ├── 📄 Navbar.tsx         # App navigation bar (post-landing)
│   │   ├── 📄 NeuralBackground.tsx # Canvas-based particle network animation
│   │   └── 📄 AppErrorBoundary.tsx # React error boundary for graceful
│   │                                 error handling
│   │
│   ├── 📂 hooks/                 # Custom React hooks
│   │   └── 📄 useMotionEffects.ts # Scroll-reveal, tilt, parallax, spotlight,
│   │                                pop animations (IntersectionObserver +
│   │                                mousemove)
│   │
│   ├── 📂 lib/                   # Core libraries and configurations
│   │   └── 📄 somnia.ts          # Somnia Testnet chain definition (viem),
│   │                               RPC endpoints, chain constants,
│   │                               utility functions
│   │
│   └── 📂 utils/                 # Utility functions
│       └── 📄 cn.ts              # Class name merge utility (clsx +
│                                   tailwind-merge)
│
└── 📂 dist/                      # Production build output (Vite)
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI rendering with concurrent features |
| **Language** | TypeScript 5.9 | Type-safe development |
| **Build Tool** | Vite 7.2 | Lightning-fast HMR and optimized builds |
| **Styling** | Tailwind CSS 4 | Utility-first styling with custom design tokens |
| **Blockchain SDK** | `@somnia-chain/reactivity` | Real-time on-chain event subscriptions |
| **EVM Client** | `viem` 2.x | Type-safe Ethereum interactions, chain definitions |
| **Ethers** | `ethers` 6.x | Supplementary blockchain utilities |
| **Charts** | Recharts 3.x | Responsive, composable chart components |
| **Icons** | Lucide React | Consistent, tree-shakeable icon system |
| **Deployment** | Vercel | Serverless edge deployment, instant preview |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| **Node.js** | v18.0+ |
| **npm** | v9.0+ |
| **MetaMask** | Latest |

### Somnia Testnet Configuration

Add the Somnia Testnet to your MetaMask wallet (or let Argus do it automatically):

| Setting | Value |
|---------|-------|
| **Network Name** | Somnia Testnet |
| **RPC URL** | `https://dream-rpc.somnia.network` |
| **WebSocket URL** | `wss://dream-rpc.somnia.network/ws` |
| **Chain ID** | `50312` |
| **Currency Symbol** | `STT` |
| **Block Explorer** | `https://shannon-explorer.somnia.network` |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/panzauto46-bot/Argus-Protocol.git
cd Argus-Protocol

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# → http://localhost:5173
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📖 Usage Guide

### Quick Demo (2 Minutes)

Follow this guided walkthrough to experience the full Argus security lifecycle:

#### Step 1: Connect Wallet
1. Open the app and click **"Connect Wallet"** on the landing page
2. MetaMask will prompt you to switch to Somnia Testnet (auto-configured)
3. Approve the connection — you'll be redirected to the Dashboard

#### Step 2: Configure Tripwire
1. Navigate to **Configure** page
2. Click **"Run Quick Demo Mode"** — this loads a preset valid configuration:
   - Contract: `0x1111...1111`
   - Topic0: `0xddf252ad...` (ERC-20 Transfer event)
   - Threshold: 8 events
   - Window: 12 seconds
3. You'll be automatically redirected to the Dashboard with monitoring active

#### Step 3: Observe Real-Time Stream
1. On the Dashboard, observe the **Reactivity Event Stream** chart
2. The stream status indicator shows `LIVE` when the WebSocket subscription is active
3. The status badge shows `SAFE` (green)

#### Step 4: Trigger Burst Detection
1. In the **Guided Demo Controls** panel, click **"Simulate Attack Burst"**
2. Watch the chart spike as synthetic events are injected rapidly
3. Observe the status transition: `SAFE` → `MONITORING` (yellow) → `TRIGGERED` (red)
4. A critical alert appears in the alert feed

#### Step 5: Execute Recovery
1. Click **"Open Recovery Panel"** (now highlighted in red)
2. Review the **Incident Report** with full detection context
3. Click **"Resolve & Resume Monitoring"** → **"Confirm Resume"**
4. Watch the 5-second countdown as the protocol returns to `SAFE`

---

## 🔐 Security Model

### Zero Trust Architecture

Argus Protocol follows a **Zero Trust** approach:

| Principle | Implementation |
|-----------|---------------|
| **No backend trust** | All detection logic runs client-side; no external API calls for security decisions |
| **Transparent detection** | Every status transition is driven by observable on-chain events and configurable rules |
| **Deterministic behavior** | The FSM transitions are predictable: same events + same config = same response every time |
| **Operator accountability** | Recovery requires explicit human confirmation through a two-step flow |
| **Audit trail** | Every system event is logged in the alert feed with timestamp, channel, and severity |

### Threat Detection Pipeline

```
1. EVENT INGESTION     → WebSocket receives raw event from Somnia Reactivity
2. BURST COUNTING      → Rolling window counter tracks events within time window
3. THRESHOLD ANALYSIS  → Counter compared against configured burst threshold
4. STATUS TRANSITION   → FSM moves to appropriate state (SAFE/MONITORING/TRIGGERED)
5. ALERT EMISSION      → Severity-tagged alert pushed to notification pipeline
6. OPERATOR RESPONSE   → Recovery panel presents incident context and actions
```

---

## 🗺️ Roadmap

### Phase 1: UI/UX Design ✅ `Completed`
> Premium visual system with modern design principles

- [x] Landing page with hero, trust signals, feature grid, and roadmap
- [x] Real-time Dashboard with live charts and activity log
- [x] Configuration page with tripwire rule editor
- [x] Notification hub with multi-channel integration
- [x] Recovery panel with incident report and resolution flow
- [x] Dark/Light theme with smooth CSS transitions
- [x] Neural background animation and glassmorphism effects
- [x] Responsive design for mobile and desktop
- [x] Micro-animations: tilt, reveal, parallax, shimmer, spotlight

### Phase 2: Smart Contract Development 🔨 `In Progress`
> On-chain tripwire and automated pause mechanisms

- [x] Client-side burst detection engine
- [x] Configurable threshold and window parameters
- [x] Status FSM with deterministic transitions
- [x] Incident summary generation
- [ ] Solidity guardian contract with `pause()` / `unpause()`
- [ ] On-chain event emission for audit trail
- [ ] Multi-contract monitoring support
- [ ] Gas-optimized storage patterns

### Phase 3: Backend & Integration 🔨 `In Progress`
> Live Somnia Reactivity integration and webhook delivery

- [x] `@somnia-chain/reactivity` SDK integration
- [x] WebSocket subscription with `topic0` filtering
- [x] Automatic reconnection with exponential backoff
- [x] Wallet lifecycle management (EIP-1193)
- [x] Connection state tracking (IDLE/CONNECTING/LIVE/ERROR)
- [ ] Discord webhook delivery (currently UI-only)
- [ ] Telegram bot delivery (currently UI-only)
- [ ] Custom notification channels (Slack, email)

### Phase 4: Testnet Deployment 🔨 `In Progress`
> Full validation on Somnia Testnet

- [x] Vercel deployment with production build
- [x] Somnia Testnet chain configuration (Chain ID: 50312)
- [x] Auto-network switching via MetaMask
- [x] Session persistence and wallet restoration
- [ ] End-to-end stress testing with live contracts
- [ ] Multi-user concurrent monitoring validation
- [ ] Performance profiling and optimization

### Phase 5: Mainnet Launch 🔮 `Upcoming`
> Production-grade security platform

- [ ] Security audit by independent firm
- [ ] Gas optimization for on-chain guardian contracts
- [ ] Multi-chain deployment (Somnia Mainnet + EVM chains)
- [ ] DAO governance for protocol upgrades
- [ ] Professional threat intelligence feeds
- [ ] Enterprise SLA and support tiers
- [ ] Public API for third-party integrations

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feat/amazing-feature`
5. **Open** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code formatting (no logic changes) |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvements |
| `test:` | Test additions/changes |
| `chore:` | Build/tooling changes |

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for the Somnia Reactivity Ecosystem</strong>
</p>

<p align="center">
  <a href="https://argus-protocol.vercel.app">Live Demo</a> ·
  <a href="https://somnia.network">Somnia Network</a> ·
  <a href="https://github.com/panzauto46-bot/Argus-Protocol">GitHub</a>
</p>
