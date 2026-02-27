import { useCallback, useEffect, useRef, useState } from "react";
import { createPublicClient, isAddress, webSocket } from "viem";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Activity, Clock, Wallet, ArrowUpRight, ArrowDownRight, Eye, Wifi, WifiOff } from "lucide-react";
import { useTheme, useApp } from "../App";
import { SOMNIA_TESTNET_RPC_WS, shortenAddress, somniaTestnet } from "../lib/somnia";

interface DataPoint {
  time: string;
  events: number;
  timestamp: number;
}

interface StreamEvent {
  id: number;
  time: string;
  wallet: string;
  topic0: string;
  dataPreview: string;
  source: "live" | "demo";
  status: "normal" | "suspicious" | "blocked";
}

type StreamState = "idle" | "connecting" | "live" | "error";

function extractAddressFromTopic(topic?: string): string | null {
  if (!topic) return null;
  const clean = topic.toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(clean)) return null;
  return `0x${clean.slice(-40)}`;
}

function buildMetricSeed(): DataPoint[] {
  const now = Date.now();
  const seed: DataPoint[] = [];
  for (let i = 30; i >= 0; i -= 1) {
    const d = new Date(now - i * 1000);
    seed.push({
      time: d.toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" }),
      events: 0,
      timestamp: d.getTime(),
    });
  }
  return seed;
}

export default function Dashboard() {
  const { dark } = useTheme();
  const {
    setPage,
    contractStatus,
    setContractStatus,
    monitoringConfig,
    addAlert,
    setLatestIncident,
  } = useApp();

  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [metricData, setMetricData] = useState<DataPoint[]>([]);
  const [transactions, setTransactions] = useState<StreamEvent[]>([]);
  const eventTimestampsRef = useRef<number[]>([]);
  const lastWarningAtRef = useRef(0);
  const lastCriticalAtRef = useRef(0);
  const contractStatusRef = useRef(contractStatus);
  const demoBurstTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);

  const canMonitor = monitoringConfig.enabled && isAddress(monitoringConfig.contractAddress);
  const warningThreshold = Math.max(2, Math.ceil(monitoringConfig.burstThreshold * 0.6));

  const stopBurstDemo = useCallback(() => {
    if (!demoBurstTimerRef.current) return;
    clearInterval(demoBurstTimerRef.current);
    demoBurstTimerRef.current = null;
    setDemoRunning(false);
  }, []);

  const recordStreamEvent = useCallback((next: {
    wallet?: string;
    topic0?: string;
    dataHex?: string;
    source?: StreamEvent["source"];
  }) => {
    const now = Date.now();
    const source = next.source ?? "live";
    const topic0 = next.topic0 ?? (monitoringConfig.topic0 || "0x");
    const dataHex = next.dataHex ?? "0x";
    const wallet = next.wallet ?? monitoringConfig.contractAddress;
    const cutoff = now - monitoringConfig.windowSeconds * 1000;

    eventTimestampsRef.current = [...eventTimestampsRef.current, now].filter((ts) => ts >= cutoff);
    const burstCount = eventTimestampsRef.current.length;

    const status: StreamEvent["status"] =
      burstCount >= monitoringConfig.burstThreshold
        ? "blocked"
        : burstCount >= warningThreshold
          ? "suspicious"
          : "normal";

    setTransactions((prev) => [
      {
        id: now + Math.floor(Math.random() * 1000),
        time: new Date(now).toLocaleTimeString("en-US", { hour12: false }),
        wallet: shortenAddress(wallet),
        topic0: topic0.length > 14 ? `${topic0.slice(0, 14)}...` : topic0,
        dataPreview: dataHex.length > 18 ? `${dataHex.slice(0, 18)}...` : dataHex,
        source,
        status,
      },
      ...prev.slice(0, 24),
    ]);

    if (status === "blocked") {
      setContractStatus("triggered");
      if (now - lastCriticalAtRef.current > 6000) {
        lastCriticalAtRef.current = now;
        setLatestIncident({
          detectedAt: new Date(now).toISOString(),
          contractAddress: monitoringConfig.contractAddress,
          topic0: monitoringConfig.topic0 || "any",
          eventCount: burstCount,
          windowSeconds: monitoringConfig.windowSeconds,
        });
        addAlert({
          level: "critical",
          channel: source === "demo" ? "Demo" : "Reactivity",
          message: `${source === "demo" ? "[Demo] " : ""}Tripwire triggered: ${burstCount} events/${monitoringConfig.windowSeconds}s on ${shortenAddress(monitoringConfig.contractAddress)}.`,
        });
      }
    } else if (status === "suspicious" && contractStatusRef.current !== "triggered") {
      setContractStatus("monitoring");
      if (now - lastWarningAtRef.current > 8000) {
        lastWarningAtRef.current = now;
        addAlert({
          level: "warning",
          channel: source === "demo" ? "Demo" : "Reactivity",
          message: `${source === "demo" ? "[Demo] " : ""}Burst detected: ${burstCount}/${monitoringConfig.burstThreshold} events in active window.`,
        });
      }
    } else if (contractStatusRef.current !== "triggered") {
      setContractStatus("safe");
    }
  }, [
    addAlert,
    monitoringConfig.burstThreshold,
    monitoringConfig.contractAddress,
    monitoringConfig.topic0,
    monitoringConfig.windowSeconds,
    setContractStatus,
    setLatestIncident,
    warningThreshold,
  ]);

  const injectDemoEvent = useCallback(() => {
    const demoWallet = `0x${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16).padStart(40, "0").slice(-40)}`;
    const demoTopic =
      monitoringConfig.topic0 ||
      "0xddf252ad00000000000000000000000000000000000000000000000000000000";
    const demoData = `0x${Date.now().toString(16)}${Math.floor(Math.random() * 0xfffff).toString(16).padStart(5, "0")}`;
    recordStreamEvent({
      wallet: demoWallet,
      topic0: demoTopic,
      dataHex: demoData,
      source: "demo",
    });
  }, [monitoringConfig.topic0, recordStreamEvent]);

  const runBurstDemo = useCallback(() => {
    if (demoRunning || contractStatusRef.current === "triggered") return;
    const target = Math.max(monitoringConfig.burstThreshold + 1, warningThreshold + 2);
    let emitted = 0;
    setDemoRunning(true);
    addAlert({
      level: "info",
      channel: "Demo",
      message: `Burst demo started. Injecting ${target} synthetic events into active window.`,
    });

    demoBurstTimerRef.current = setInterval(() => {
      emitted += 1;
      injectDemoEvent();
      if (emitted >= target) {
        stopBurstDemo();
      }
    }, 220);
  }, [addAlert, demoRunning, injectDemoEvent, monitoringConfig.burstThreshold, stopBurstDemo, warningThreshold]);

  const resetDemoState = useCallback(() => {
    stopBurstDemo();
    eventTimestampsRef.current = [];
    setTransactions([]);
    setMetricData(buildMetricSeed());
    lastWarningAtRef.current = 0;
    lastCriticalAtRef.current = 0;
    setLatestIncident(null);
    setContractStatus("safe");
    addAlert({
      level: "info",
      channel: "Demo",
      message: "Demo state reset. Activity log and rolling counters cleared.",
    });
  }, [addAlert, setContractStatus, setLatestIncident, stopBurstDemo]);

  useEffect(() => {
    contractStatusRef.current = contractStatus;
  }, [contractStatus]);

  useEffect(() => {
    if (contractStatus !== "triggered") return;
    stopBurstDemo();
  }, [contractStatus, stopBurstDemo]);

  useEffect(() => {
    return () => {
      stopBurstDemo();
    };
  }, [stopBurstDemo]);

  useEffect(() => {
    setMetricData(buildMetricSeed());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const cutoff = now - monitoringConfig.windowSeconds * 1000;
      eventTimestampsRef.current = eventTimestampsRef.current.filter((ts) => ts >= cutoff);
      const count = eventTimestampsRef.current.length;

      if (contractStatusRef.current !== "triggered") {
        if (count >= warningThreshold) {
          setContractStatus("monitoring");
        } else {
          setContractStatus("safe");
        }
      }

      setMetricData((prev) => [
        ...prev.slice(-44),
        {
          time: new Date(now).toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" }),
          events: count,
          timestamp: now,
        },
      ]);
    }, 1000);

    return () => clearInterval(timer);
  }, [monitoringConfig.windowSeconds, setContractStatus, warningThreshold]);

  useEffect(() => {
    if (!canMonitor) {
      eventTimestampsRef.current = [];
      setTransactions([]);
      setStreamState("idle");
      setStreamError(null);
      if (contractStatusRef.current !== "triggered") {
        setContractStatus("safe");
      }
      return;
    }

    eventTimestampsRef.current = [];
    setTransactions([]);
    if (contractStatusRef.current !== "triggered") {
      setContractStatus("safe");
    }

    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: webSocket(SOMNIA_TESTNET_RPC_WS),
    });

    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let lastConnectionAlertAt = 0;
    let unsubscribeFn: (() => Promise<unknown>) | null = null;

    const emitConnectionAlert = (level: "info" | "warning", message: string) => {
      const now = Date.now();
      if (now - lastConnectionAlertAt < 8000) return;
      lastConnectionAlertAt = now;
      addAlert({
        level,
        channel: "Reactivity",
        message,
      });
    };

    const clearSubscription = async () => {
      if (!unsubscribeFn) return;
      const currentUnsubscribe = unsubscribeFn;
      unsubscribeFn = null;
      try {
        await currentUnsubscribe();
      } catch {
        // Ignore unsubscribe errors while reconnecting/teardown.
      }
    };

    const scheduleReconnect = (reason: string) => {
      if (closed) return;
      reconnectAttempt += 1;
      const delay = Math.min(15000, 1000 * (2 ** Math.max(0, reconnectAttempt - 1)));
      setStreamState("connecting");
      setStreamError(reason);
      emitConnectionAlert("warning", `Stream interrupted: ${reason}. Reconnecting in ${Math.round(delay / 1000)}s.`);

      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (closed) return;
      try {
        await clearSubscription();
        const { SDK } = await import("@somnia-chain/reactivity");
        if (closed) return;
        setStreamState("connecting");
        setStreamError(null);

        const sdk = new SDK({ public: publicClient });
        const result = await sdk.subscribe({
          ethCalls: [],
          context: "topic0",
          eventContractSources: [monitoringConfig.contractAddress as `0x${string}`],
          topicOverrides: monitoringConfig.topic0 ? [monitoringConfig.topic0 as `0x${string}`] : undefined,
          onlyPushChanges: false,
          onData: (packet) => {
            if (closed) return;
            const topics = packet?.result?.topics ?? [];
            const dataHex = packet?.result?.data ?? "0x";
            const topic0 = topics[0] ?? "0x";
            const wallet =
              extractAddressFromTopic(topics[1]) ??
              extractAddressFromTopic(topics[2]) ??
              monitoringConfig.contractAddress;
            recordStreamEvent({ wallet, topic0, dataHex, source: "live" });
          },
          onError: (error) => {
            if (closed) return;
            const message = error?.message || "WebSocket subscription error";
            setStreamState("error");
            setStreamError(message);
            scheduleReconnect(message);
          },
        });

        if (closed) {
          if (!(result instanceof Error)) {
            try {
              await result.unsubscribe();
            } catch {
              // Ignore cleanup error on race conditions.
            }
          }
          return;
        }

        if (result instanceof Error) {
          throw result;
        }

        unsubscribeFn = result.unsubscribe;
        reconnectAttempt = 0;
        setStreamState("live");
        setStreamError(null);
        emitConnectionAlert("info", `Subscription live for ${shortenAddress(monitoringConfig.contractAddress)}.`);
      } catch (error) {
        if (closed) return;
        const message = error instanceof Error ? error.message : "Failed to initialize subscription";
        setStreamState("error");
        setStreamError(message);
        scheduleReconnect(message);
      }
    };

    void connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      void clearSubscription();
    };
  }, [
    addAlert,
    canMonitor,
    monitoringConfig.burstThreshold,
    monitoringConfig.contractAddress,
    monitoringConfig.topic0,
    monitoringConfig.windowSeconds,
    setContractStatus,
    setLatestIncident,
    recordStreamEvent,
    warningThreshold,
  ]);

  const statusConfig = {
    safe: {
      color: "text-emerald-400",
      bg: dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200",
      label: "SAFE",
      desc: "No suspicious burst in configured window.",
      dot: "bg-emerald-500",
    },
    monitoring: {
      color: "text-yellow-400",
      bg: dark ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200",
      label: "MONITORING",
      desc: "Burst pattern detected, threshold not yet breached.",
      dot: "bg-yellow-500 animate-pulse",
    },
    triggered: {
      color: "text-red-400",
      bg: dark ? "bg-red-500/10 border-red-500/30 animate-blink-red" : "bg-red-50 border-red-200",
      label: "TRIGGERED",
      desc: "Burst threshold breached, investigate recovery panel.",
      dot: "bg-red-500 animate-blink-red",
    },
  };

  const streamConfig = {
    idle: { label: "IDLE", className: "text-gray-400", icon: <WifiOff size={14} /> },
    connecting: { label: "CONNECTING", className: "text-yellow-400", icon: <Activity size={14} className="animate-pulse" /> },
    live: { label: "LIVE", className: "text-cyan-400", icon: <Wifi size={14} /> },
    error: { label: "ERROR", className: "text-red-400", icon: <WifiOff size={14} /> },
  } as const;

  const status = statusConfig[contractStatus];
  const stream = streamConfig[streamState];
  const currentEvents = metricData[metricData.length - 1]?.events ?? 0;
  const previousEvents = metricData[metricData.length - 2]?.events ?? 0;
  const change = currentEvents - previousEvents;
  const changePercent = previousEvents > 0 ? (change / previousEvents) * 100 : 0;
  const thresholdUsage = monitoringConfig.burstThreshold > 0
    ? (currentEvents / monitoringConfig.burstThreshold) * 100
    : 0;

  if (!canMonitor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-2xl border p-6 ${dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"}`}>
          <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Threat Matrix Dashboard</h1>
          <p className={`text-sm mt-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Monitoring belum aktif. Buka halaman Configure untuk set contract address dan start subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4" data-reveal>
        <div>
          <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Threat Matrix Dashboard</h1>
          <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Monitoring contract: <span className="text-cyan-400 font-mono">{shortenAddress(monitoringConfig.contractAddress)}</span>{" "}
            {monitoringConfig.topic0 ? (
              <>
                | topic0: <span className="text-cyan-400 font-mono">{monitoringConfig.topic0.slice(0, 14)}...</span>
              </>
            ) : (
              <>| topic0: <span className="text-cyan-400 font-mono">any</span></>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-argus-card/60 border-argus-border" : "bg-white border-gray-200"}`}>
            <span className={stream.className}>{stream.icon}</span>
            <span className={`text-xs font-bold tracking-wider ${stream.className}`}>{stream.label}</span>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${status.bg}`} data-tilt data-pop data-spotlight>
            <div className={`w-3 h-3 rounded-full ${status.dot}`} />
            <div>
              <div className={`text-sm font-bold ${status.color}`}>{status.label}</div>
              <div className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>{status.desc}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`p-5 rounded-2xl border mb-8 ${
          dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"
        }`}
        data-reveal
        data-reveal-delay={40}
        data-tilt
        data-pop
        data-spotlight
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${dark ? "text-cyan-300" : "text-cyan-700"}`}>
              Guided Demo Controls
            </h2>
            <p className={`text-xs mt-1 ${dark ? "text-gray-400" : "text-gray-600"}`}>
              Jalankan simulasi reactivity end-to-end: inject events, trigger burst, lalu buka recovery panel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "1. Stream", done: streamState === "live" },
              { label: "2. Burst", done: contractStatus === "monitoring" || contractStatus === "triggered" },
              { label: "3. Triggered", done: contractStatus === "triggered" },
            ].map((step) => (
              <span
                key={step.label}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  step.done
                    ? dark
                      ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                      : "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : dark
                      ? "border-gray-700 bg-gray-800/70 text-gray-400"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={injectDemoEvent}
            disabled={demoRunning}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
              demoRunning
                ? dark
                  ? "border-gray-700 text-gray-500 bg-gray-800/70 cursor-not-allowed"
                  : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
                : dark
                  ? "border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20"
                  : "border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100"
            }`}
          >
            Inject Safe Event
          </button>
          <button
            onClick={runBurstDemo}
            disabled={demoRunning || contractStatus === "triggered"}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
              demoRunning || contractStatus === "triggered"
                ? dark
                  ? "border-gray-700 text-gray-500 bg-gray-800/70 cursor-not-allowed"
                  : "border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed"
                : dark
                  ? "border-yellow-500/30 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20"
                  : "border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
            }`}
          >
            {demoRunning ? "Injecting Burst..." : "Simulate Attack Burst"}
          </button>
          <button
            onClick={() => setPage("recovery")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
              contractStatus === "triggered"
                ? dark
                  ? "border-red-500/35 text-red-300 bg-red-500/10 hover:bg-red-500/20"
                  : "border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                : dark
                  ? "border-gray-700 text-gray-300 hover:bg-white/5"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Open Recovery Panel
          </button>
          <button
            onClick={resetDemoState}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors ${
              dark
                ? "border-slate-600 text-slate-200 bg-slate-900/50 hover:bg-slate-800/70"
                : "border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            Reset Demo State
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Events in Window",
            value: currentEvents.toString(),
            change: `${change >= 0 ? "+" : ""}${change} vs prev second`,
            changeColor: change >= 0 ? "text-emerald-400" : "text-red-400",
            icon: <TrendingUp size={20} />,
            iconBg: "bg-cyan-500/10 text-cyan-400",
          },
          {
            label: "Burst Threshold",
            value: `${monitoringConfig.burstThreshold}`,
            change: `${thresholdUsage.toFixed(1)}% usage`,
            changeColor: thresholdUsage >= 100 ? "text-red-400" : thresholdUsage >= 60 ? "text-yellow-400" : dark ? "text-gray-500" : "text-gray-400",
            icon: changePercent >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />,
            iconBg: "bg-emerald-500/10 text-emerald-400",
          },
          {
            label: "Window Size",
            value: `${monitoringConfig.windowSeconds}s`,
            change: "Configurable in Configure page",
            changeColor: dark ? "text-gray-500" : "text-gray-400",
            icon: <Eye size={20} />,
            iconBg: "bg-purple-500/10 text-purple-400",
          },
          {
            label: "Stream Latency",
            value: "< 1s",
            change: streamState === "error" && streamError ? streamError : "Somnia Reactivity WebSocket",
            changeColor: streamState === "error" ? "text-red-400" : dark ? "text-gray-500" : "text-gray-400",
            icon: <Activity size={20} />,
            iconBg: "bg-blue-500/10 text-blue-400",
          },
        ].map((card, i) => (
          <div
            key={i}
            data-reveal="zoom"
            data-reveal-delay={i * 70}
            data-tilt
            data-pop
            data-spotlight
            className={`p-5 rounded-2xl border transition-colors ${
              dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-medium uppercase tracking-wider ${dark ? "text-gray-500" : "text-gray-400"}`}>{card.label}</span>
              <div className={`pop-icon w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>{card.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{card.value}</div>
            <span className={`text-xs ${card.changeColor}`}>{card.change}</span>
          </div>
        ))}
      </div>

      <div
        className={`p-6 rounded-2xl border mb-8 ${dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"}`}
        data-reveal
        data-reveal-delay={90}
        data-tilt
        data-pop="strong"
        data-spotlight
        data-tilt-strength={5.5}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>Reactivity Event Stream</h2>
            <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>Rolling count over configured detection window</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${streamState === "live" ? "bg-cyan-400 animate-pulse" : "bg-gray-500"}`} />
            <span className={`pop-chip text-xs ${stream.className}`}>{stream.label}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={metricData}>
            <defs>
              <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#e5e7eb"} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? "#64748b" : "#9ca3af" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: dark ? "#64748b" : "#9ca3af" }} allowDecimals={false} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? "#111827" : "#fff",
                border: `1px solid ${dark ? "#1e293b" : "#e5e7eb"}`,
                borderRadius: "12px",
                fontSize: "12px",
                color: dark ? "#e5e7eb" : "#1f2937",
              }}
              formatter={(value: unknown) => [`${Number(value)} events`, "Window count"]}
            />
            <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fill="url(#eventGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`rounded-2xl border overflow-hidden ${dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"}`}
        data-reveal
        data-reveal-delay={120}
        data-tilt
        data-pop="strong"
        data-spotlight
        data-tilt-strength={4.6}
      >
        <div className="p-6 pb-4">
          <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>Activity Log</h2>
          <p className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>Recent live events pushed by Somnia Reactivity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs uppercase tracking-wider border-b ${
                dark ? "text-gray-500 border-argus-border" : "text-gray-400 border-gray-200"
              }`}>
                <th className="text-left px-6 py-3 font-medium">Time</th>
                <th className="text-left px-6 py-3 font-medium">Emitter/Actor</th>
                <th className="text-left px-6 py-3 font-medium">Topic0</th>
                <th className="text-left px-6 py-3 font-medium">Data</th>
                <th className="text-left px-6 py-3 font-medium">Source</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className={`surface-row border-b transition-colors ${
                  dark ? "border-argus-border/50 hover:bg-white/[0.02]" : "border-gray-100 hover:bg-gray-50"
                } ${tx.status === "suspicious" ? (dark ? "bg-yellow-500/5" : "bg-yellow-50") : ""} ${tx.status === "blocked" ? (dark ? "bg-red-500/5" : "bg-red-50") : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={dark ? "text-gray-500" : "text-gray-400"} />
                      <span className={`text-sm font-mono ${dark ? "text-gray-300" : "text-gray-700"}`}>{tx.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-cyan-400" />
                      <span className="text-sm font-mono text-cyan-400">{tx.wallet}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs font-mono text-cyan-400">{tx.topic0}</span></td>
                  <td className="px-6 py-4"><span className={`text-xs font-mono ${dark ? "text-gray-400" : "text-gray-600"}`}>{tx.dataPreview}</span></td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                      tx.source === "live"
                        ? dark ? "bg-cyan-500/15 text-cyan-300" : "bg-cyan-50 text-cyan-700"
                        : dark ? "bg-purple-500/15 text-purple-300" : "bg-purple-50 text-purple-700"
                    }`}>
                      {tx.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      tx.status === "normal"
                        ? dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                        : tx.status === "suspicious"
                          ? dark ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-600"
                          : dark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className={`px-6 py-8 text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    Waiting for live events from Somnia Reactivity subscription...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
