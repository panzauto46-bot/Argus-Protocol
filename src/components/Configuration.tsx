import { useState } from 'react';
import { useTheme, useApp } from '../App';
import { Shield, Settings, AlertTriangle, Check, Copy, ChevronDown, Zap, Info } from 'lucide-react';

export default function Configuration() {
  const { dark } = useTheme();
  const { setPage } = useApp();
  const [contractAddress, setContractAddress] = useState('');
  const [withdrawalLimit, setWithdrawalLimit] = useState(15);
  const [timeWindow, setTimeWindow] = useState('2');
  const [timeUnit, setTimeUnit] = useState('seconds');
  const [showDropdown, setShowDropdown] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDeploy = () => {
    if (!contractAddress) return;
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeOptions = [
    { value: 'milliseconds', label: 'Milliseconds' },
    { value: 'seconds', label: 'Seconds' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'minutes', label: 'Minutes' },
  ];

  const riskLevel =
    withdrawalLimit <= 5 ? { label: 'Very Strict', color: 'text-red-400', bg: 'bg-red-500/10' } :
    withdrawalLimit <= 10 ? { label: 'Strict', color: 'text-orange-400', bg: 'bg-orange-500/10' } :
    withdrawalLimit <= 20 ? { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10' } :
    withdrawalLimit <= 35 ? { label: 'Relaxed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' } :
    { label: 'Very Relaxed', color: 'text-blue-400', bg: 'bg-blue-500/10' };

  const selectedTimeLabel = (timeOptions.find((option) => option.value === timeUnit)?.label ?? timeUnit).toLowerCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8" data-reveal>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Custom Tripwires Configuration</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Define your threat parameters and deploy Argus Shield on your smart contract
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract Address */}
        <div className={`p-6 rounded-2xl border ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-tilt data-pop data-spotlight data-tilt-strength={5.4}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`pop-icon w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
              <Settings size={20} />
            </div>
            <div>
              <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Smart Contract Address</h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Enter the contract address you want to protect</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => { setContractAddress(e.target.value); setDeployed(false); }}
              placeholder="0x0000000000000000000000000000000000000000"
              className={`w-full px-4 py-3.5 rounded-xl font-mono text-sm border outline-none transition-all ${
                dark
                  ? 'bg-argus-dark border-argus-border text-gray-200 placeholder-gray-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200'
              }`}
            />
            {contractAddress && (
              <button
                onClick={handleCopy}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                  dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Withdrawal Limit */}
        <div className={`p-6 rounded-2xl border ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={70} data-tilt data-pop data-spotlight data-tilt-strength={5.4}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`pop-icon w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Maximum Withdrawal Threshold</h2>
                <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Trigger emergency braking if withdrawal exceeds this percentage</p>
              </div>
            </div>
            <span className={`pop-chip text-xs font-bold px-3 py-1.5 rounded-full ${riskLevel.bg} ${riskLevel.color}`}>
              {riskLevel.label}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-4xl font-black text-cyan-400`}>{withdrawalLimit}%</span>
              <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>of total TVL</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={withdrawalLimit}
              onChange={(e) => setWithdrawalLimit(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${withdrawalLimit * 2}%, ${dark ? '#1e293b' : '#e5e7eb'} ${withdrawalLimit * 2}%, ${dark ? '#1e293b' : '#e5e7eb'} 100%)`
              }}
            />
            <div className="flex justify-between">
              <span className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>1% (Very Strict)</span>
              <span className={`text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>50% (Very Relaxed)</span>
            </div>
          </div>

          {/* Info box */}
          <div className={`mt-4 p-4 rounded-xl flex gap-3 ${dark ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              If any single withdrawal exceeds <span className="text-cyan-400 font-bold">{withdrawalLimit}%</span> of the total locked value
              within the specified time window, Argus will automatically pause the contract to prevent further fund drainage.
            </p>
          </div>
        </div>

        {/* Time Window */}
        <div className={`p-6 rounded-2xl border relative ${showDropdown ? 'z-[90]' : 'z-10'} ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={120} data-tilt data-pop data-spotlight data-tilt-strength={5.4}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`pop-icon w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <Zap size={20} />
            </div>
            <div>
              <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Time Window</h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>The monitoring window for detecting abnormal withdrawals</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={`text-xs font-medium mb-2 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Duration</label>
              <input
                type="number"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                min="1"
                className={`w-full px-4 py-3.5 rounded-xl text-sm border outline-none transition-all ${
                  dark
                    ? 'bg-argus-dark border-argus-border text-gray-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20'
                    : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200'
                }`}
              />
            </div>
            <div className="flex-1 relative">
              <label className={`text-xs font-medium mb-2 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Unit</label>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full px-4 py-3.5 rounded-xl text-sm border text-left flex items-center justify-between transition-all ${
                  dark
                    ? 'bg-argus-dark border-argus-border text-gray-200 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300'
                }`}
              >
                {timeOptions.find((t) => t.value === timeUnit)?.label}
                <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border overflow-hidden z-[120] ${
                  dark ? 'bg-argus-card border-argus-border' : 'bg-white border-gray-200 shadow-lg'
                }`}>
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setTimeUnit(option.value); setShowDropdown(false); }}
                      className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                        timeUnit === option.value
                          ? dark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                          : dark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={`p-6 rounded-2xl border-2 border-dashed ${dark ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-cyan-300 bg-cyan-50'}`} data-reveal data-reveal-delay={160} data-tilt data-pop data-spotlight data-tilt-strength={4.6}>
          <h3 className={`text-sm font-bold mb-3 ${dark ? 'text-cyan-400' : 'text-cyan-700'}`}>Tripwire Rule Summary</h3>
          <p className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
            If any withdrawal exceeds <span className="text-cyan-400 font-bold">{withdrawalLimit}%</span> of total TVL within{' '}
            <span className="text-cyan-400 font-bold">{timeWindow} {selectedTimeLabel}</span>,
            the smart contract will be <span className="text-red-400 font-bold">automatically paused</span>.
          </p>
        </div>

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={!contractAddress || deploying || deployed}
          data-reveal
          data-reveal-delay={200}
          data-shimmer
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
            deployed
              ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30 cursor-default'
              : !contractAddress
                ? dark
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : deploying
                  ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
          }`}
        >
          {deployed ? (
            <>
              <Check size={24} />
              Argus Shield Deployed Successfully
            </>
          ) : deploying ? (
            <>
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              Deploying Shield...
            </>
          ) : (
            <>
              <Shield size={24} />
              Deploy Argus Shield
            </>
          )}
        </button>

        {deployed && (
          <div className={`p-4 rounded-xl text-center ${dark ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`} data-reveal data-spotlight>
            <p className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Your contract is now protected. View real-time monitoring on the{' '}
              <button onClick={() => setPage('dashboard')} className="text-cyan-400 font-bold hover:underline">Dashboard</button>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
