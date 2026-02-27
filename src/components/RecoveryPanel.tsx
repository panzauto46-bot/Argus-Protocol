import { useState, useEffect } from "react";
import { useTheme, useApp } from "../App";
import { AlertTriangle, Shield, Clock, Lock, Unlock, FileText, Activity, CheckCircle, XCircle, AlertOctagon } from "lucide-react";
import { shortenAddress } from "../lib/somnia";

export default function RecoveryPanel() {
  const { dark } = useTheme();
  const { contractStatus, setContractStatus, setPage, latestIncident, setLatestIncident, monitoringConfig, addAlert } = useApp();
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isPaused = contractStatus === "triggered";

  const incidentData = latestIncident
    ? {
        detectedAt: latestIncident.detectedAt,
        contractAddress: latestIncident.contractAddress,
        topic0: latestIncident.topic0,
        eventCount: latestIncident.eventCount,
        windowSeconds: latestIncident.windowSeconds,
      }
    : {
        detectedAt: "No active incident",
        contractAddress: monitoringConfig.contractAddress || "Not configured",
        topic0: monitoringConfig.topic0 || "any",
        eventCount: 0,
        windowSeconds: monitoringConfig.windowSeconds,
      };

  const savedPercent = 96.2;
  const lostPercent = Number((100 - savedPercent).toFixed(1));

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTriggerDemo = () => {
    const now = new Date().toISOString();
    setLatestIncident({
      detectedAt: now,
      contractAddress: monitoringConfig.contractAddress || "0x0000000000000000000000000000000000000000",
      topic0: monitoringConfig.topic0 || "any",
      eventCount: monitoringConfig.burstThreshold + 1,
      windowSeconds: monitoringConfig.windowSeconds,
    });
    setContractStatus("triggered");
    setResolved(false);
    addAlert({
      level: "critical",
      channel: "Recovery",
      message: "Manual exploit simulation triggered for recovery workflow demo.",
    });
  };

  const handleResolve = () => {
    setShowConfirm(false);
    setResolving(true);
    setCountdown(5);
    setTimeout(() => {
      setResolving(false);
      setResolved(true);
      setContractStatus("safe");
      addAlert({
        level: "success",
        channel: "Recovery",
        message: "Incident resolved. Protocol status returned to SAFE.",
      });
    }, 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isPaused && !resolved && (
        <div className="mb-8 p-6 rounded-2xl border-2 border-red-500/50 bg-red-500/5 animate-blink-red relative overflow-hidden" data-reveal>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertOctagon size={32} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-red-500 tracking-wider">SYSTEM PAUSED: TRIPWIRE TRIGGERED</h1>
              <p className={`text-sm mt-1 ${dark ? "text-red-300/70" : "text-red-600"}`}>
                Burst threshold exceeded. Investigate incident data and recover carefully.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isPaused && !resolved && (
        <div className="mb-8" data-reveal>
          <h1 className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>Protocol Recovery Panel</h1>
          <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Incident review, response decisions, and contract recovery controls
          </p>

          <button
            onClick={handleTriggerDemo}
            data-shimmer
            className={`mt-4 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              dark ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            }`}
          >
            <AlertTriangle size={16} />
            Simulate Exploit Detection (Demo)
          </button>
        </div>
      )}

      {resolved && (
        <div className={`mb-8 p-6 rounded-2xl border-2 ${dark ? "border-emerald-500/30 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50"}`} data-reveal>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-500">INCIDENT RESOLVED</h1>
              <p className={`text-sm mt-1 ${dark ? "text-emerald-300/70" : "text-emerald-700"}`}>
                Contract monitoring resumed. Return to{" "}
                <button onClick={() => setPage("dashboard")} className="underline font-bold">Dashboard</button>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-2xl border mb-6 ${dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"}`} data-reveal data-tilt data-pop="strong" data-spotlight data-tilt-strength={4.8}>
        <div className="p-6 pb-4 flex items-center gap-3">
          <FileText size={20} className={dark ? "text-gray-400" : "text-gray-500"} />
          <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>Incident Report</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Detection Time", value: incidentData.detectedAt, icon: <Clock size={16} /> },
              { label: "Event Count", value: `${incidentData.eventCount} events`, icon: <Activity size={16} /> },
              { label: "Burst Window", value: `${incidentData.windowSeconds}s`, icon: <AlertTriangle size={16} /> },
              { label: "Contract Address", value: incidentData.contractAddress, icon: <FileText size={16} />, full: true, mono: true },
              { label: "Filtered Topic0", value: incidentData.topic0, icon: <Lock size={16} />, full: true, mono: true },
              { label: "Status", value: contractStatus.toUpperCase(), icon: <Shield size={16} />, success: contractStatus === "safe", danger: contractStatus === "triggered" },
            ].map((item, i) => (
              <div
                key={i}
                data-reveal="zoom"
                data-reveal-delay={i * 45}
                data-spotlight
                className={`p-4 rounded-xl ${item.full ? "md:col-span-2" : ""} ${dark ? "bg-argus-dark/50" : "bg-gray-50"}`}
              >
                <div className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {item.icon}
                  {item.label}
                </div>
                <div className={`text-sm font-semibold ${
                  item.danger ? "text-red-400" :
                  item.success ? "text-emerald-400" :
                  item.mono ? "font-mono text-cyan-400 text-xs break-all" :
                  dark ? "text-gray-200" : "text-gray-800"
                }`}>
                  {item.mono && item.value.startsWith("0x") ? shortenAddress(item.value) : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border mb-6 p-6 ${dark ? "bg-argus-card/50 border-argus-border" : "bg-white border-gray-200"}`} data-reveal data-reveal-delay={90} data-tilt data-pop="strong" data-spotlight data-tilt-strength={4.6}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className={`text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>Fund Protection Summary</h3>
          <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
            {savedPercent.toFixed(1)}% protected
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${dark ? "border-argus-border/80 bg-argus-dark/50" : "border-gray-200 bg-gray-50"}`}>
          <div className={`h-4 rounded-full overflow-hidden flex ${dark ? "bg-gray-800/70" : "bg-gray-200"}`}>
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${savedPercent}%` }} />
            <div className="h-full bg-gradient-to-r from-rose-500 to-red-400" style={{ width: `${lostPercent}%` }} />
          </div>
        </div>
      </div>

      {isPaused && !resolved && (
        <div className={`rounded-2xl border-2 p-6 ${dark ? "border-red-500/30 bg-red-500/5" : "border-red-300 bg-red-50"}`} data-reveal data-reveal-delay={120} data-spotlight>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={20} className="text-red-400" />
            <h3 className={`font-bold ${dark ? "text-white" : "text-gray-900"}`}>Recovery Actions</h3>
          </div>
          <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-600"}`}>
            Confirm incident handling before unpausing monitoring state.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={resolving}
              data-shimmer
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400 transition-all shadow-lg shadow-red-500/25"
            >
              <Unlock size={24} />
              Resolve & Resume Monitoring
            </button>
          ) : resolving ? (
            <div className={`text-center p-8 rounded-2xl ${dark ? "bg-argus-dark" : "bg-gray-100"}`}>
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={`font-bold text-lg ${dark ? "text-white" : "text-gray-900"}`}>Resolving Incident...</p>
              <p className={`text-sm mt-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                Returning to SAFE in {countdown} seconds...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${dark ? "bg-yellow-500/5 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}>
                <p className={`text-sm ${dark ? "text-yellow-300" : "text-yellow-700"}`}>
                  <strong>Warning:</strong> Unpause only after validation that abnormal event source has been mitigated.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  data-shimmer
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all"
                >
                  <CheckCircle size={18} />
                  Confirm Resume
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${
                    dark ? "border-gray-700 text-gray-300 hover:bg-white/5" : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <XCircle size={18} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
