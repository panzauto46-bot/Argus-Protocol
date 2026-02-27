import { useState, useEffect, useCallback } from 'react';
import { useTheme, useApp } from '../App';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Activity, Clock, Wallet, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface DataPoint {
  time: string;
  tvl: number;
  timestamp: number;
}

interface Transaction {
  id: number;
  time: string;
  wallet: string;
  amount: string;
  type: 'deposit' | 'withdrawal';
  status: 'normal' | 'suspicious' | 'blocked';
}

export default function Dashboard() {
  const { dark } = useTheme();
  const { contractStatus, setContractStatus } = useApp();
  const [tvlData, setTvlData] = useState<DataPoint[]>([]);
  const [currentTVL, setCurrentTVL] = useState(2450000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const generateInitialData = useCallback(() => {
    const data: DataPoint[] = [];
    let val = 2450000;
    for (let i = 30; i >= 0; i--) {
      val += (Math.random() - 0.48) * 15000;
      const d = new Date(Date.now() - i * 2000);
      data.push({
        time: d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        tvl: Math.round(val),
        timestamp: d.getTime(),
      });
    }
    return data;
  }, []);

  useEffect(() => {
    setTvlData(generateInitialData());

    const initialTx: Transaction[] = [
      { id: 1, time: '14:23:01', wallet: '0x3a4F...8B2c', amount: '+12,500 USDC', type: 'deposit', status: 'normal' },
      { id: 2, time: '14:22:45', wallet: '0x9c1E...4D7a', amount: '-3,200 USDC', type: 'withdrawal', status: 'normal' },
      { id: 3, time: '14:22:12', wallet: '0x5b8A...1F3e', amount: '+45,000 USDC', type: 'deposit', status: 'normal' },
      { id: 4, time: '14:21:58', wallet: '0x2d6C...9A4b', amount: '-8,750 USDC', type: 'withdrawal', status: 'suspicious' },
      { id: 5, time: '14:21:30', wallet: '0x7e2B...5C8d', amount: '+21,300 USDC', type: 'deposit', status: 'normal' },
    ];
    setTransactions(initialTx);
  }, [generateInitialData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.48) * 15000;
      setCurrentTVL((prev) => {
        const newVal = prev + change;
        setTvlData((data) => {
          const now = new Date();
          const newData = [
            ...data.slice(-40),
            {
              time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              tvl: Math.round(newVal),
              timestamp: now.getTime(),
            },
          ];
          return newData;
        });
        return newVal;
      });

      // Random new transaction
      if (Math.random() > 0.6) {
        const wallets = ['0x3a4F...8B2c', '0x9c1E...4D7a', '0x5b8A...1F3e', '0x2d6C...9A4b', '0x7e2B...5C8d', '0xaB3D...7E1f'];
        const isDeposit = Math.random() > 0.4;
        const amount = Math.floor(Math.random() * 50000) + 1000;
        const isSuspicious = !isDeposit && amount > 30000;
        const now = new Date();
        setTransactions((prev) => [
          {
            id: Date.now(),
            time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            wallet: wallets[Math.floor(Math.random() * wallets.length)],
            amount: `${isDeposit ? '+' : '-'}${amount.toLocaleString()} USDC`,
            type: isDeposit ? 'deposit' : 'withdrawal',
            status: isSuspicious ? 'suspicious' : 'normal',
          },
          ...prev.slice(0, 9),
        ]);

        if (isSuspicious && contractStatus === 'safe') {
          setContractStatus('monitoring');
          setTimeout(() => setContractStatus('safe'), 5000);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [contractStatus, setContractStatus]);

  const statusConfig = {
    safe: {
      color: 'text-emerald-400',
      bg: dark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
      label: 'SAFE',
      desc: 'All systems nominal. No threats detected.',
      dot: 'bg-emerald-500',
    },
    monitoring: {
      color: 'text-yellow-400',
      bg: dark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200',
      label: 'MONITORING',
      desc: 'Unusual activity detected. Monitoring closely.',
      dot: 'bg-yellow-500 animate-pulse',
    },
    triggered: {
      color: 'text-red-400',
      bg: dark ? 'bg-red-500/10 border-red-500/30 animate-blink-red' : 'bg-red-50 border-red-200',
      label: 'TRIGGERED - PAUSED',
      desc: 'Exploit detected! Contract has been paused.',
      dot: 'bg-red-500 animate-blink-red',
    },
  };

  const status = statusConfig[contractStatus];
  const tvlChange = tvlData.length > 1 ? currentTVL - tvlData[tvlData.length - 2]?.tvl : 0;
  const tvlChangePercent = tvlData.length > 1 ? ((tvlChange / tvlData[tvlData.length - 2]?.tvl) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4" data-reveal>
        <div>
          <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Threat Matrix Dashboard</h1>
          <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Monitoring: <span className="text-cyan-400 font-mono">UniSwap V3 Pool</span> - Contract: <span className="font-mono text-cyan-400">0x68b3...a5F2</span>
          </p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${status.bg}`} data-tilt data-pop data-spotlight>
          <div className={`w-3 h-3 rounded-full ${status.dot}`} />
          <div>
            <div className={`text-sm font-bold ${status.color}`}>{status.label}</div>
            <div className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{status.desc}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Value Locked',
            value: `$${(currentTVL / 1000000).toFixed(2)}M`,
            change: `${tvlChange >= 0 ? '+' : ''}${(tvlChange / 1000).toFixed(1)}K`,
            changeColor: tvlChange >= 0 ? 'text-emerald-400' : 'text-red-400',
            icon: <TrendingUp size={20} />,
            iconBg: 'bg-cyan-500/10 text-cyan-400',
          },
          {
            label: 'TVL Change (24h)',
            value: `${tvlChangePercent >= 0 ? '+' : ''}${tvlChangePercent.toFixed(3)}%`,
            change: 'Last 24 hours',
            changeColor: dark ? 'text-gray-500' : 'text-gray-400',
            icon: tvlChangePercent >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />,
            iconBg: tvlChangePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
          },
          {
            label: 'Active Monitors',
            value: '3',
            change: 'Contracts watched',
            changeColor: dark ? 'text-gray-500' : 'text-gray-400',
            icon: <Eye size={20} />,
            iconBg: 'bg-purple-500/10 text-purple-400',
          },
          {
            label: 'Response Time',
            value: '< 50ms',
            change: 'Sub-second latency',
            changeColor: dark ? 'text-gray-500' : 'text-gray-400',
            icon: <Activity size={20} />,
            iconBg: 'bg-blue-500/10 text-blue-400',
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
              dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-medium uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{card.label}</span>
              <div className={`pop-icon w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>{card.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{card.value}</div>
            <span className={`text-xs ${card.changeColor}`}>{card.change}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className={`p-6 rounded-2xl border mb-8 ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`}
        data-reveal
        data-reveal-delay={90}
        data-tilt
        data-pop="strong"
        data-spotlight
        data-tilt-strength={5.5}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>TVL Live Monitor</h2>
            <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Real-time Total Value Locked tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className={`pop-chip text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>LIVE</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={tvlData}>
            <defs>
              <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#1e293b' : '#e5e7eb'} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: dark ? '#64748b' : '#9ca3af' }} interval="preserveStartEnd" />
            <YAxis
              tick={{ fontSize: 10, fill: dark ? '#64748b' : '#9ca3af' }}
              tickFormatter={(v: number) => `$${(v / 1000000).toFixed(2)}M`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: dark ? '#111827' : '#fff',
                border: `1px solid ${dark ? '#1e293b' : '#e5e7eb'}`,
                borderRadius: '12px',
                fontSize: '12px',
                color: dark ? '#e5e7eb' : '#1f2937',
              }}
              formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, 'TVL']}
            />
            <Area type="monotone" dataKey="tvl" stroke="#06b6d4" strokeWidth={2} fill="url(#tvlGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Log */}
      <div
        className={`rounded-2xl border overflow-hidden ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`}
        data-reveal
        data-reveal-delay={120}
        data-tilt
        data-pop="strong"
        data-spotlight
        data-tilt-strength={4.6}
      >
        <div className="p-6 pb-4">
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Activity Log</h2>
          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Recent transactions on monitored contracts</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs uppercase tracking-wider border-b ${
                dark ? 'text-gray-500 border-argus-border' : 'text-gray-400 border-gray-200'
              }`}>
                <th className="text-left px-6 py-3 font-medium">Time</th>
                <th className="text-left px-6 py-3 font-medium">Wallet</th>
                <th className="text-left px-6 py-3 font-medium">Amount</th>
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} data-reveal="left" data-reveal-delay={40} className={`surface-row border-b transition-colors ${
                  dark ? 'border-argus-border/50 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50'
                } ${tx.status === 'suspicious' ? (dark ? 'bg-yellow-500/5' : 'bg-yellow-50') : ''} ${tx.status === 'blocked' ? (dark ? 'bg-red-500/5' : 'bg-red-50') : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={dark ? 'text-gray-500' : 'text-gray-400'} />
                      <span className={`text-sm font-mono ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{tx.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-cyan-400" />
                      <span className="text-sm font-mono text-cyan-400">{tx.wallet}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      tx.type === 'deposit'
                        ? dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        : dark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      tx.status === 'normal'
                        ? dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        : tx.status === 'suspicious'
                          ? dark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                          : dark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
