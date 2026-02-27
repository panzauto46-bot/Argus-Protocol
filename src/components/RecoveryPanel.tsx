import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../App';
import { AlertTriangle, Shield, Clock, Lock, Unlock, FileText, Activity, CheckCircle, XCircle, AlertOctagon } from 'lucide-react';

export default function RecoveryPanel() {
  const { dark } = useTheme();
  const { contractStatus, setContractStatus, setPage } = useApp();
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isPaused = contractStatus === 'triggered';

  const incidentData = {
    detectedAt: '2024-01-15 14:23:01 UTC',
    contractAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45a5F2',
    attackType: 'Flash Loan Attack - Abnormal Withdrawal Pattern',
    totalDrained: '$127,450 USDC',
    totalSaved: '$2,322,550 USDC',
    responseTime: '47ms',
    tripwireTriggered: '15% threshold in 1.2 seconds',
    attackerWallet: '0x9c1E...4D7a',
    blockNumber: '#18,234,567',
    txHash: '0x3a4F8B2c...7E1f9c1E',
  };
  const savedPercent = 94.8;
  const lostPercent = Number((100 - savedPercent).toFixed(1));

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTriggerDemo = () => {
    setContractStatus('triggered');
    setResolved(false);
  };

  const handleResolve = () => {
    setShowConfirm(false);
    setResolving(true);
    setCountdown(5);
    setTimeout(() => {
      setResolving(false);
      setResolved(true);
      setContractStatus('safe');
    }, 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Emergency Header */}
      {isPaused && !resolved && (
        <div className="mb-8 p-6 rounded-2xl border-2 border-red-500/50 bg-red-500/5 animate-blink-red relative overflow-hidden" data-reveal>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertOctagon size={32} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-red-500 tracking-wider">
                SYSTEM PAUSED: EXPLOIT DETECTED
              </h1>
              <p className={`text-sm mt-1 ${dark ? 'text-red-300/70' : 'text-red-600'}`}>
                Emergency braking has been activated. All contract operations are frozen.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isPaused && !resolved && (
        <div className="mb-8" data-reveal>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Protocol Recovery Panel</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Incident review, resolution, and contract recovery management
          </p>

          {/* Demo trigger */}
          <button
            onClick={handleTriggerDemo}
            data-shimmer
            className={`mt-4 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              dark ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            }`}
          >
            <AlertTriangle size={16} />
            Simulate Exploit Detection (Demo)
          </button>
        </div>
      )}

      {resolved && (
        <div className={`mb-8 p-6 rounded-2xl border-2 ${dark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-300 bg-emerald-50'}`} data-reveal>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-500">INCIDENT RESOLVED</h1>
              <p className={`text-sm mt-1 ${dark ? 'text-emerald-300/70' : 'text-emerald-700'}`}>
                Contract has been unpaused and is operating normally. Return to{' '}
                <button onClick={() => setPage('dashboard')} className="underline font-bold">Dashboard</button>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report */}
      <div className={`rounded-2xl border mb-6 ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-tilt data-pop="strong" data-spotlight data-tilt-strength={4.8}>
        <div className="p-6 pb-4 flex items-center gap-3">
          <FileText size={20} className={dark ? 'text-gray-400' : 'text-gray-500'} />
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Incident Report</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Detection Time', value: incidentData.detectedAt, icon: <Clock size={16} /> },
              { label: 'Response Time', value: incidentData.responseTime, icon: <Activity size={16} /> },
              { label: 'Attack Type', value: incidentData.attackType, icon: <AlertTriangle size={16} />, full: true },
              { label: 'Contract Address', value: incidentData.contractAddress, icon: <FileText size={16} />, full: true, mono: true },
              { label: 'Total Drained (Before Pause)', value: incidentData.totalDrained, icon: <XCircle size={16} />, danger: true },
              { label: 'Total Saved', value: incidentData.totalSaved, icon: <Shield size={16} />, success: true },
              { label: 'Tripwire Triggered', value: incidentData.tripwireTriggered, icon: <AlertTriangle size={16} /> },
              { label: 'Attacker Wallet', value: incidentData.attackerWallet, icon: <Lock size={16} />, mono: true },
              { label: 'Block Number', value: incidentData.blockNumber, icon: <Activity size={16} />, mono: true },
              { label: 'Transaction Hash', value: incidentData.txHash, icon: <FileText size={16} />, mono: true },
            ].map((item, i) => (
              <div
                key={i}
                data-reveal="zoom"
                data-reveal-delay={i * 45}
                data-spotlight
                className={`p-4 rounded-xl ${item.full ? 'md:col-span-2' : ''} ${
                  dark ? 'bg-argus-dark/50' : 'bg-gray-50'
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {item.icon}
                  {item.label}
                </div>
                <div className={`text-sm font-semibold ${
                  item.danger ? 'text-red-400' :
                  item.success ? 'text-emerald-400' :
                  item.mono ? 'font-mono text-cyan-400 text-xs break-all' :
                  dark ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Savings Visualization */}
      <div className={`rounded-2xl border mb-6 p-6 ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={90} data-tilt data-pop="strong" data-spotlight data-tilt-strength={4.6}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Fund Protection Summary</h3>
          <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
            {savedPercent.toFixed(1)}% protected
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${dark ? 'border-argus-border/80 bg-argus-dark/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`h-4 rounded-full overflow-hidden flex ${dark ? 'bg-gray-800/70' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${savedPercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-red-400"
              style={{ width: `${lostPercent}%` }}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className={`rounded-lg px-3 py-2 border ${dark ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Funds Saved</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">{savedPercent.toFixed(1)}%</span>
              </div>
              <p className={`text-sm font-semibold mt-1 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>$2,322,550</p>
            </div>

            <div className={`rounded-lg px-3 py-2 border ${dark ? 'border-red-500/25 bg-red-500/8' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Funds Lost</span>
                </div>
                <span className="text-xs font-bold text-red-400">{lostPercent.toFixed(1)}%</span>
              </div>
              <p className={`text-sm font-semibold mt-1 ${dark ? 'text-red-300' : 'text-red-700'}`}>$127,450</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resolve & Unpause */}
      {isPaused && !resolved && (
        <div className={`rounded-2xl border-2 p-6 ${dark ? 'border-red-500/30 bg-red-500/5' : 'border-red-300 bg-red-50'}`} data-reveal data-reveal-delay={120} data-spotlight>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={20} className="text-red-400" />
            <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Contract Recovery Actions</h3>
          </div>
          <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            Only the admin wallet can resolve this incident and unpause the contract. Ensure you have reviewed the incident report thoroughly.
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={resolving}
              data-shimmer
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400 transition-all shadow-lg shadow-red-500/25"
            >
              <Unlock size={24} />
              Resolve & Unpause Contract
            </button>
          ) : resolving ? (
            <div className={`text-center p-8 rounded-2xl ${dark ? 'bg-argus-dark' : 'bg-gray-100'}`}>
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>Resolving Incident...</p>
              <p className={`text-sm mt-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Unpausing contract in {countdown} seconds...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${dark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`text-sm ${dark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  <strong>Warning:</strong> You are about to unpause the contract. Make sure the exploit has been addressed and the attacker wallet has been blacklisted.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResolve}
                  data-shimmer
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 transition-all"
                >
                  <CheckCircle size={18} />
                  Confirm Unpause
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${
                    dark ? 'border-gray-700 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
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

      {/* Timeline */}
      <div className={`rounded-2xl border mt-6 ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={160} data-tilt data-pop="strong" data-spotlight data-tilt-strength={4.4}>
        <div className="p-6 pb-4">
          <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Incident Timeline</h3>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-0">
            {[
              { time: '14:23:01.000', event: 'Abnormal withdrawal detected', detail: '$127,450 withdrawal in 1.2s', color: 'bg-yellow-500' },
              { time: '14:23:01.023', event: 'Tripwire threshold exceeded', detail: '15% threshold breached (actual: 5.2%)', color: 'bg-orange-500' },
              { time: '14:23:01.047', event: 'Emergency braking activated', detail: 'Contract paused automatically', color: 'bg-red-500' },
              { time: '14:23:01.052', event: 'Alert notifications dispatched', detail: 'Discord + Telegram alerts sent', color: 'bg-blue-500' },
              { time: '14:23:01.100', event: 'Incident report generated', detail: 'Full analysis available', color: 'bg-purple-500' },
              ...(resolved ? [{ time: '14:25:30.000', event: 'Incident resolved by admin', detail: 'Contract unpaused', color: 'bg-emerald-500' }] : []),
            ].map((item, i, arr) => (
              <div key={i} className="surface-row flex gap-4 rounded-lg px-1">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0 mt-1.5`} />
                  {i < arr.length - 1 && <div className={`w-0.5 flex-1 min-h-8 ${dark ? 'bg-gray-800' : 'bg-gray-200'}`} />}
                </div>
                <div className="pb-6">
                  <span className={`text-xs font-mono ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{item.time}</span>
                  <p className={`text-sm font-semibold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{item.event}</p>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
