import type { ReactNode } from "react";
import { useTheme, useApp } from "../App";
import { Shield, Sun, Moon, LayoutDashboard, Settings, Bell, AlertTriangle, LogOut } from "lucide-react";
import { SOMNIA_TESTNET_CHAIN_ID, shortenAddress } from "../lib/somnia";

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const {
    page,
    setPage,
    walletConnected,
    connectWallet,
    disconnectWallet,
    walletAddress,
    walletBusy,
    walletChainId,
    contractStatus,
  } = useApp();

  const statusColors = {
    safe: "bg-emerald-500",
    monitoring: "bg-yellow-500",
    triggered: "bg-red-500 animate-blink-red",
  };

  const statusLabels = {
    safe: "SAFE",
    monitoring: "MONITORING",
    triggered: "TRIGGERED",
  };

  const navItems: { id: "dashboard" | "config" | "notifications" | "recovery"; label: string; icon: ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "config", label: "Configure", icon: <Settings size={18} /> },
    { id: "notifications", label: "Alerts", icon: <Bell size={18} /> },
    { id: "recovery", label: "Recovery", icon: <AlertTriangle size={18} /> },
  ];

  const wrongNetwork = walletConnected && walletChainId !== null && walletChainId !== SOMNIA_TESTNET_CHAIN_ID;

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
      dark ? "bg-argus-dark/90 border-argus-border" : "bg-white/90 border-gray-200"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => setPage("landing")} className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="text-cyan-400 group-hover:text-cyan-300 transition-colors" size={28} />
              <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md group-hover:blur-lg transition-all" />
            </div>
            <span className="text-lg font-bold tracking-wider">
              <span className="text-cyan-400">ARGUS</span>
              <span className={dark ? "text-gray-400" : "text-gray-500"}> PROTOCOL</span>
            </span>
          </button>

          {/* Nav items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                data-tilt
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  page === item.id
                    ? dark
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    : dark
                      ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
              dark ? "bg-gray-800/80" : "bg-gray-100"
            }`} data-tilt>
              <div className={`w-2 h-2 rounded-full ${statusColors[contractStatus]}`} />
              {statusLabels[contractStatus]}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={`p-2 rounded-lg transition-colors ${
                dark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Wallet */}
            {walletConnected ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono px-3 py-1.5 rounded-lg ${
                  dark ? "bg-gray-800 text-cyan-400" : "bg-gray-100 text-cyan-700"
                }`}>
                  {shortenAddress(walletAddress)}
                </span>
                {wrongNetwork && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">
                    Wrong Network
                  </span>
                )}
                <button
                  onClick={() => {
                    disconnectWallet();
                    setPage("landing");
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => void connectWallet()}
                disabled={walletBusy}
                data-shimmer
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-75 disabled:cursor-wait"
              >
                {walletBusy ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                page === item.id
                  ? dark
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                  : dark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
