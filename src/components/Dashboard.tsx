import { useEffect, useMemo, useRef, useState } from "react";
import { SDK } from "@somnia-chain/reactivity";
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
  status: "normal" | "suspicious" | "blocked";
}

type StreamState = "idle" | "connecting" | "live" | "error";

function extractAddressFromTopic(topic?: string): string | null {
  if (!topic) return null;
  const clean = topic.toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(clean)) return null;
  return `0x${clean.slice(-40)}`;
}

export default function Dashboard() {
  const { dark } = useTheme();
  const {
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

  const canMonitor = monitoringConfig.enabled && isAddress(monitoringConfig.contractAddress);
  const warningThreshold = Math.max(2, Math.ceil(monitoringConfig.burstThreshold * 0.6));

  useEffect(() => {
    contractStatusRef.current = contractStatus;
  }, [contractStatus]);

  useEffect(() => {
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
    setMetricData(seed);
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
      setStreamState("idle");
      setStreamError(null);
      return;
    }

    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: webSocket(SOMNIA_TESTNET_RPC_WS),
    });
    const sdk = new SDK({ public: publicClient });

    let closed = false;
    let unsubscribeFn: (() => Promise<unknown>) | null = null;

    const connect = async () => {
      try {
        setStreamState("connecting");
        setStreamError(null);

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
            const now = Date.now();
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
                id: now,
                time: new Date(now).toLocaleTimeString("en-US", { hour12: false }),
                wallet: shortenAddress(wallet),
                topic0: topic0.slice(0, 14) + "...",
                dataPreview: dataHex.length > 18 ? `${dataHex.slice(0, 18)}...` : dataHex,
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
                  channel: "Reactivity",
                  message: `Tripwire triggered: ${burstCount} events/${monitoringConfig.windowSeconds}s on ${shortenAddress(monitoringConfig.contractAddress)}.`,
                });
              }
            } else if (status === "suspicious" && contractStatusRef.current !== "triggered") {
              setContractStatus("monitoring");
              if (now - lastWarningAtRef.current > 8000) {
                lastWarningAtRef.current = now;
                addAlert({
                  level: "warning",
                  channel: "Reactivity",
                  message: `Burst detected: ${burstCount}/${monitoringConfig.burstThreshold} events in active window.`,
                });
              }
            } else if (contractStatusRef.current !== "triggered") {
              setContractStatus("safe");
            }
          },
          onError: (error) => {
            if (closed) return;
            setStreamState("error");
            setStreamError(error.message);
          },
        });

        if (result instanceof Error) {
          throw result;
        }

        unsubscribeFn = result.unsubscribe;
        setStreamState("live");
        addAlert({
          level: "info",
          channel: "Reactivity",
          message: `Subscription live for ${shortenAddress(monitoringConfig.contractAddress)}.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to initialize subscription";
        setStreamState("error");
        setStreamError(message);
        addAlert({
          level: "warning",
          channel: "Reactivity",
          message: `Subscription error: ${message}`,
        });
      }
    };

    void connect();

    return () => {
      closed = true;
      if (unsubscribeFn) {
        void unsubscribeFn();
      }
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
                <th className="text-left px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} data-reveal="left" data-reveal-delay={40} className={`surface-row border-b transition-colors ${
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
                  <td colSpan={5} className={`px-6 py-8 text-center text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
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
