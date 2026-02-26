import { useState, useEffect } from 'react';
import { useTheme, useApp } from '../App';
import { Shield, Zap, Eye, Lock, Bell, RefreshCw, ArrowRight, ShieldCheck, Gauge, Fingerprint } from 'lucide-react';

function NetworkCube() {
  return (
    <div className="network-cube-wrap absolute inset-0 flex items-center justify-center pointer-events-none opacity-52">
      <div className="network-cube">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="network-cube-face" />
        ))}
      </div>
    </div>
  );
}

function ShieldAnimation() {
  const [attacks, setAttacks] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const angle = Math.random() * 360;
      const rad = (angle * Math.PI) / 180;
      setAttacks((prev) => [
        ...prev.slice(-6),
        {
          id: Date.now(),
          x: 50 + Math.cos(rad) * 45,
          y: 50 + Math.sin(rad) * 45,
          angle,
        },
      ]);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setAttacks((prev) => prev.filter((a) => Date.now() - a.id < 2400));
    }, 560);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="relative w-80 h-80 mx-auto" data-parallax="0.055">
      <NetworkCube />

      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin" style={{ animationDuration: '24s' }}>
        <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-cyan-400 rounded-full" />
      </div>
      <div className="absolute inset-4 rounded-full border border-cyan-500/10 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}>
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -ml-0.75 mb-[-3px] bg-cyan-300 rounded-full" />
      </div>

      <div className="absolute inset-8 pointer-events-none">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`line-${index}`}
            className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/33 to-transparent animate-data-flow"
            style={{
              top: `${22 + index * 17}%`,
              animationDelay: `-${index * 0.55}s`,
              animationDuration: `${3.2 + index * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative animate-shield-pulse" data-tilt>
          <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-2xl scale-150" />
          <div
            className="relative bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl p-8 backdrop-blur-sm"
            style={{ transform: 'translateZ(16px)' }}
          >
            <Shield className="text-cyan-400" size={64} />
          </div>
        </div>
      </div>

      {attacks.map((attack) => (
        <div
          key={attack.id}
          className="absolute w-2.5 h-2.5"
          style={{
            left: `${attack.x}%`,
            top: `${attack.y}%`,
            animation: 'pulse-glow 0.7s ease-out',
          }}
        >
          <div className="w-full h-full bg-red-500 rounded-full opacity-80 animate-ping" />
          <div className="absolute inset-0.5 bg-red-400 rounded-full" />
        </div>
      ))}

      {attacks.slice(-3).map((attack) => (
        <span
          key={`t-${attack.id}`}
          className="absolute text-[10px] font-bold text-cyan-400/60 pointer-events-none"
          style={{
            left: `${attack.x}%`,
            top: `${attack.y - 5}%`,
            animation: 'float 1s ease-out forwards',
          }}
        >
          BLOCKED
        </span>
      ))}
    </div>
  );
}

function StatCounter({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const { dark } = useTheme();
  return (
    <div
      className={`text-center rounded-2xl px-5 py-4 border ${
        dark ? 'border-argus-border/70 bg-argus-card/35' : 'border-gray-200 bg-white/80'
      }`}
      data-reveal="zoom"
      data-reveal-delay={delay}
      data-tilt
    >
      <div className="text-3xl font-bold text-cyan-400">{value}</div>
      <div className={`text-sm mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const { dark } = useTheme();
  const { setPage, setWalletConnected } = useApp();
  const [tvl, setTvl] = useState(247.3);

  useEffect(() => {
    const interval = setInterval(() => {
      setTvl((prev) => prev + (Math.random() - 0.45) * 0.5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: <Eye size={24} />, title: 'Sentinel Engine', desc: 'Real-time monitoring every millisecond using Somnia network reactivity.' },
    { icon: <Zap size={24} />, title: 'Custom Tripwires', desc: 'Set your own threat parameters. Define withdrawal limits and time windows.' },
    { icon: <Lock size={24} />, title: 'Emergency Braking', desc: 'Automatic contract pause when exploit patterns are detected.' },
    { icon: <Bell size={24} />, title: 'Instant Alerts', desc: 'On-chain notifications pushed to your Telegram or Discord in real-time.' },
    { icon: <RefreshCw size={24} />, title: 'Recovery Panel', desc: 'Full incident reports with one-click resolve and unpause capabilities.' },
    { icon: <Shield size={24} />, title: 'Zero Trust', desc: 'No external servers or admin intervention required. Fully on-chain security.' },
  ];

  const roadmapItems = [
    { phase: 'Phase 1', title: 'UI/UX Design', status: 'completed', desc: 'Full visual design of all pages including Dashboard, Configuration, Alerts, and Recovery panels.' },
    { phase: 'Phase 2', title: 'Smart Contract Development', status: 'in-progress', desc: 'Sentinel Engine core logic, tripwire mechanisms, and automated pause functionality on Somnia.' },
    { phase: 'Phase 3', title: 'Backend and Integration', status: 'upcoming', desc: 'Webhook integrations for Telegram/Discord, real-time data indexing, and API endpoints.' },
    { phase: 'Phase 4', title: 'Testnet Deployment', status: 'upcoming', desc: 'Deployment on Somnia testnet with simulated attack scenarios and stress testing.' },
    { phase: 'Phase 5', title: 'Mainnet Launch', status: 'upcoming', desc: 'Production deployment, security audit, and public launch with initial partner dApps.' },
  ];

  const trustSignals = [
    {
      icon: <ShieldCheck size={18} />,
      title: 'Autonomous Protection',
      desc: 'Protection logic runs continuously without requiring manual server intervention.',
      stat: '24/7 On-Chain',
    },
    {
      icon: <Gauge size={18} />,
      title: 'Detection Throughput',
      desc: 'Event evaluation pipeline is tuned for high-frequency state changes.',
      stat: '< 50ms Trigger',
    },
    {
      icon: <Fingerprint size={18} />,
      title: 'Deterministic Rules',
      desc: 'Tripwire conditions remain auditable and deterministic across execution paths.',
      stat: 'Rule-Based',
    },
  ];

  const handleConnect = () => {
    setWalletConnected(true);
    setPage('dashboard');
  };

  return (
    <div className="min-h-screen pt-16">
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute left-[-12%] top-[30%] h-px w-[124%] bg-gradient-to-r from-transparent via-cyan-500/36 to-transparent animate-data-flow" />
          <div
            className="absolute left-[-8%] top-[66%] h-px w-[116%] bg-gradient-to-r from-transparent via-blue-500/26 to-transparent animate-data-flow"
            style={{ animationDelay: '-1.6s', animationDuration: '5.2s' }}
          />
          {dark && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10" data-reveal="right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider mb-8 ${
                dark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              } flow-rail`}>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                POWERED BY SOMNIA NETWORK
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-[1.03] mb-6 tracking-[-0.03em]">
                <span className={dark ? 'text-white' : 'text-gray-900'}>On-Chain </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Security
                </span>
                <br />
                <span className={dark ? 'text-white' : 'text-gray-900'}>For Your </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  dApps
                </span>
              </h1>

              <p className={`text-lg leading-relaxed mb-10 max-w-xl ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time smart contract monitoring that detects and stops exploits in milliseconds.
                No servers. No admins. Pure on-chain protection powered by Somnia Reactivity.
              </p>

              <div className="flex flex-wrap gap-4" data-reveal data-reveal-delay={80}>
                <button
                  onClick={handleConnect}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-base hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-3"
                >
                  Launch App
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`px-8 py-4 rounded-xl font-bold text-base border transition-all ${
                    dark ? 'border-gray-700 text-gray-300 hover:bg-white/5 hover:border-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Learn More
                </button>
              </div>

              <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4" data-reveal data-reveal-delay={130}>
                <StatCounter value={`$${tvl.toFixed(1)}M`} label="TVL Protected" delay={40} />
                <StatCounter value="< 50ms" label="Response Time" delay={90} />
                <StatCounter value="99.9%" label="Uptime" delay={140} />
              </div>
            </div>

            <div className="hidden lg:block" data-reveal="left" data-reveal-delay={120}>
              <ShieldAnimation />
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className={`py-14 border-t ${dark ? 'border-argus-border' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-4">
            {trustSignals.map((signal, idx) => (
              <div
                key={signal.title}
                data-reveal="zoom"
                data-reveal-delay={idx * 80}
                data-tilt
                data-pop
                className={`rounded-2xl border px-6 py-5 transition-all ${
                  dark ? 'bg-argus-card/45 border-argus-border hover:border-cyan-500/30' : 'bg-white/90 border-gray-200 hover:border-cyan-300'
                }`}
              >
                <div className={`pop-icon inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${
                  dark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
                }`}>
                  {signal.icon}
                </div>
                <h3 className={`font-bold text-lg mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{signal.title}</h3>
                <p className={`text-sm leading-relaxed mb-3 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{signal.desc}</p>
                <span className={`pop-chip inline-block text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                  dark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {signal.stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={`py-24 border-t ${dark ? 'border-argus-border' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-reveal>
            <h2 className={`text-3xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Complete Security Suite
            </h2>
            <p className={`max-w-2xl mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Every tool you need to protect your decentralized application from exploits, flash loan attacks, and unauthorized fund movements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                data-reveal="zoom"
                data-reveal-delay={i * 70}
                data-tilt
                data-pop
                className={`group p-6 rounded-2xl border transition-all duration-300 ${
                  dark
                    ? 'bg-argus-card/50 border-argus-border hover:border-cyan-500/30 hover:bg-argus-card'
                    : 'bg-white border-gray-200 hover:border-cyan-300 hover:shadow-lg'
                }`}
              >
                <div className={`pop-icon w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  dark
                    ? 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20'
                    : 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className={`py-24 border-t ${dark ? 'border-argus-border' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl font-bold mb-12 text-center ${dark ? 'text-white' : 'text-gray-900'}`} data-reveal>
            Development Roadmap
          </h2>

          <div className="space-y-6">
            {roadmapItems.map((item, i) => (
              <div
                key={i}
                data-reveal="left"
                data-reveal-delay={i * 80}
                data-tilt
                data-pop
                className={`flex gap-6 p-6 rounded-2xl border transition-all relative overflow-hidden ${
                  dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-px ${
                  dark ? 'bg-gradient-to-r from-cyan-500/0 via-cyan-500/35 to-cyan-500/0' : 'bg-gradient-to-r from-cyan-300/0 via-cyan-300/80 to-cyan-300/0'
                }`} />
                <div className="flex-shrink-0">
                  <div className={`pop-icon w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold ${
                    item.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.status === 'in-progress'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : dark
                          ? 'bg-gray-800 text-gray-500'
                          : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.phase.split(' ')[1]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <span className={`pop-chip text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'in-progress'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : dark
                            ? 'bg-gray-800 text-gray-500'
                            : 'bg-gray-100 text-gray-400'
                    }`}>
                      {item.status === 'in-progress' ? 'In Progress' : item.status}
                    </span>
                  </div>
                  <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`py-20 border-t ${dark ? 'border-argus-border' : 'border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`rounded-3xl p-8 md:p-12 border text-center ${
              dark
                ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-argus-card/70 border-cyan-500/25'
                : 'bg-gradient-to-br from-cyan-50 via-blue-50 to-white border-cyan-200'
            }`}
            data-reveal="zoom"
            data-tilt
            data-pop
          >
            <h3 className={`text-3xl md:text-4xl font-black tracking-[-0.02em] mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Ready To Secure Your dApp Stack?
            </h3>
            <p className={`max-w-2xl mx-auto mb-8 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
              Start with live monitoring first, then progressively enforce autonomous tripwires as your protocol grows.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleConnect}
                className="px-7 py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
              >
                Launch App
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-7 py-3.5 rounded-xl font-bold border transition-all ${
                  dark ? 'border-gray-600 text-gray-200 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className={`py-12 border-t ${dark ? 'border-argus-border' : 'border-gray-200'}`} data-reveal="zoom">
        <div className="max-w-7xl mx-auto px-4 text-center" data-reveal data-reveal-delay={70}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="text-cyan-400" size={20} />
            <span className="font-bold tracking-wider text-cyan-400">ARGUS PROTOCOL</span>
          </div>
          <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            Built on Somnia Network - On-Chain Real-Time Security for Decentralized Applications
          </p>
        </div>
      </footer>
    </div>
  );
}
