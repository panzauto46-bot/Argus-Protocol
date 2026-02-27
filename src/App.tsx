import { useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { Shield, Sun, Moon, ChevronRight, Menu, X } from "lucide-react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Configuration from "./components/Configuration";
import Notifications from "./components/Notifications";
import RecoveryPanel from "./components/RecoveryPanel";
import Navbar from "./components/Navbar";
import NeuralBackground from "./components/NeuralBackground";
import useMotionEffects from "./hooks/useMotionEffects";
import {
  SOMNIA_TESTNET_CHAIN_ID,
  SOMNIA_TESTNET_CHAIN_HEX,
  SOMNIA_TESTNET_EXPLORER,
  SOMNIA_TESTNET_RPC_HTTP,
} from "./lib/somnia";

type Page = "landing" | "dashboard" | "config" | "notifications" | "recovery";
type ContractStatus = "safe" | "monitoring" | "triggered";
type AlertLevel = "info" | "warning" | "critical" | "success";

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}

interface MonitoringConfig {
  enabled: boolean;
  contractAddress: string;
  topic0: string;
  burstThreshold: number;
  windowSeconds: number;
}

interface IncidentSummary {
  detectedAt: string;
  contractAddress: string;
  topic0: string;
  eventCount: number;
  windowSeconds: number;
}

interface SecurityAlert {
  id: number;
  level: AlertLevel;
  message: string;
  time: string;
  channel: string;
}

interface AppContextType {
  page: Page;
  setPage: (p: Page) => void;
  walletConnected: boolean;
  walletAddress: string;
  walletChainId: number | null;
  walletBusy: boolean;
  walletError: string | null;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  contractStatus: ContractStatus;
  setContractStatus: (s: ContractStatus) => void;
  monitoringConfig: MonitoringConfig;
  updateMonitoringConfig: (next: Partial<MonitoringConfig>) => void;
  alerts: SecurityAlert[];
  addAlert: (next: Omit<SecurityAlert, "id" | "time">) => void;
  latestIncident: IncidentSummary | null;
  setLatestIncident: (incident: IncidentSummary | null) => void;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: false,
  contractAddress: "",
  topic0: "",
  burstThreshold: 8,
  windowSeconds: 12,
};

const MONITORING_CONFIG_STORAGE_KEY = "argus-monitoring-config-v1";

export const ThemeContext = createContext<ThemeContextType>({ dark: true, toggle: () => {} });
export const AppContext = createContext<AppContextType>({
  page: "landing",
  setPage: () => {},
  walletConnected: false,
  walletAddress: "",
  walletChainId: null,
  walletBusy: false,
  walletError: null,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  contractStatus: "safe",
  setContractStatus: () => {},
  monitoringConfig: DEFAULT_MONITORING_CONFIG,
  updateMonitoringConfig: () => {},
  alerts: [],
  addAlert: () => {},
  latestIncident: null,
  setLatestIncident: () => {},
});

export const useTheme = () => useContext(ThemeContext);
export const useApp = () => useContext(AppContext);

const landingNavItems = [
  { id: "home", label: "Home" },
  { id: "trust", label: "Trust" },
  { id: "features", label: "Features" },
  { id: "roadmap", label: "Roadmap" },
] as const;

function getEthereumProvider(): EthereumProvider | undefined {
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [page, setPage] = useState<Page>("landing");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus>("safe");
  const [latestIncident, setLatestIncident] = useState<IncidentSummary | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    {
      id: Date.now(),
      level: "info",
      message: "Argus initialized. Configure a contract and start monitoring.",
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      channel: "System",
    },
  ]);
  const [monitoringConfig, setMonitoringConfig] = useState<MonitoringConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_MONITORING_CONFIG;
    const raw = window.localStorage.getItem(MONITORING_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_MONITORING_CONFIG;
    try {
      return { ...DEFAULT_MONITORING_CONFIG, ...(JSON.parse(raw) as Partial<MonitoringConfig>) };
    } catch {
      return DEFAULT_MONITORING_CONFIG;
    }
  });
  const [landingScrolled, setLandingScrolled] = useState(false);
  const [landingMenuOpen, setLandingMenuOpen] = useState(false);
  const [activeLandingSection, setActiveLandingSection] = useState<(typeof landingNavItems)[number]["id"]>("home");
  const [scrollProgress, setScrollProgress] = useState(0);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const desktopNavButtonRefs = useRef<Partial<Record<(typeof landingNavItems)[number]["id"], HTMLButtonElement | null>>>({});
  const [desktopNavIndicator, setDesktopNavIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const addAlert = useCallback((next: Omit<SecurityAlert, "id" | "time">) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setAlerts((prev) => [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        time,
        ...next,
      },
      ...prev,
    ].slice(0, 120));
  }, []);

  const updateMonitoringConfig = useCallback((next: Partial<MonitoringConfig>) => {
    setMonitoringConfig((prev) => ({ ...prev, ...next }));
  }, []);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    const provider = getEthereumProvider();
    if (!provider) {
      const msg = "MetaMask tidak terdeteksi. Install MetaMask dulu untuk lanjut.";
      setWalletError(msg);
      addAlert({ level: "warning", message: msg, channel: "Wallet" });
      return false;
    }

    setWalletBusy(true);
    setWalletError(null);

    try {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SOMNIA_TESTNET_CHAIN_HEX }],
        });
      } catch (switchErr) {
        const err = switchErr as { code?: number; message?: string };
        if (err.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SOMNIA_TESTNET_CHAIN_HEX,
                chainName: "Somnia Testnet",
                nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
                rpcUrls: [SOMNIA_TESTNET_RPC_HTTP],
                blockExplorerUrls: [SOMNIA_TESTNET_EXPLORER],
              },
            ],
          });

          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SOMNIA_TESTNET_CHAIN_HEX }],
          });
        } else {
          throw switchErr;
        }
      }

      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) throw new Error("Wallet terhubung, tapi akun tidak ditemukan.");

      const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
      const parsedChainId = Number.parseInt(chainHex, 16);

      setWalletConnected(true);
      setWalletAddress(accounts[0]);
      setWalletChainId(Number.isFinite(parsedChainId) ? parsedChainId : null);
      addAlert({ level: "success", message: "Wallet connected to Somnia Testnet.", channel: "Wallet" });
      return true;
    } catch (error) {
      const walletErr = error as { code?: number; message?: string };
      const message =
        walletErr?.code === 4001
          ? "Wallet connection rejected by user."
          : error instanceof Error
            ? error.message
            : "Gagal menghubungkan wallet.";
      setWalletConnected(false);
      setWalletAddress("");
      setWalletChainId(null);
      setWalletError(message);
      addAlert({ level: "warning", message: `Wallet connection failed: ${message}`, channel: "Wallet" });
      return false;
    } finally {
      setWalletBusy(false);
    }
  }, [addAlert]);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress("");
    setWalletChainId(null);
    setWalletError(null);
    addAlert({ level: "info", message: "Wallet disconnected from current app session.", channel: "Wallet" });
  }, [addAlert]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MONITORING_CONFIG_STORAGE_KEY, JSON.stringify(monitoringConfig));
    } catch {
      // Ignore persistence failures (private mode, storage disabled, quota, etc).
    }
  }, [monitoringConfig]);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const restoreWalletSession = async () => {
      try {
        const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
        if (!accounts?.length) return;
        const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
        const parsedChainId = Number.parseInt(chainHex, 16);
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        setWalletChainId(Number.isFinite(parsedChainId) ? parsedChainId : null);
      } catch {
        // Ignore session restore failure.
      }
    };

    void restoreWalletSession();
  }, []);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider?.on || !provider.removeListener) return;

    const onAccountsChanged = (accountsRaw: unknown) => {
      const accounts = Array.isArray(accountsRaw) ? (accountsRaw as string[]) : [];
      if (!accounts.length) {
        setWalletConnected(false);
        setWalletAddress("");
        setWalletChainId(null);
        return;
      }
      setWalletConnected(true);
      setWalletAddress(accounts[0]);
      addAlert({ level: "info", message: "Wallet account changed.", channel: "Wallet" });
    };

    const onChainChanged = (chainRaw: unknown) => {
      if (typeof chainRaw !== "string") return;
      const parsed = Number.parseInt(chainRaw, 16);
      setWalletChainId(Number.isFinite(parsed) ? parsed : null);
      if (Number.isFinite(parsed) && parsed !== SOMNIA_TESTNET_CHAIN_ID) {
        addAlert({ level: "warning", message: "Wallet switched away from Somnia Testnet.", channel: "Wallet" });
      } else {
        addAlert({ level: "success", message: "Wallet connected on Somnia Testnet.", channel: "Wallet" });
      }
    };

    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [addAlert]);

  useMotionEffects(page);

  const toggle = () => setDark(!dark);

  const handleLandingConnect = async () => {
    setLandingMenuOpen(false);
    const connected = await connectWallet();
    if (connected) setPage("dashboard");
  };

  const scrollToLandingSection = (id: (typeof landingNavItems)[number]["id"]) => {
    setLandingMenuOpen(false);
    setActiveLandingSection(id);

    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 84;
    const top = window.scrollY + element.getBoundingClientRect().top - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    if (page !== "landing") {
      setLandingScrolled(false);
      setLandingMenuOpen(false);
      return;
    }

    const updateLandingNav = () => {
      const scrollY = window.scrollY;
      setLandingScrolled(scrollY > 14);

      const marker = scrollY + 170;
      let current: (typeof landingNavItems)[number]["id"] = "home";

      for (const item of landingNavItems) {
        const section = document.getElementById(item.id);
        if (section && section.offsetTop <= marker) current = item.id;
      }

      setActiveLandingSection(current);
    };

    updateLandingNav();
    window.addEventListener("scroll", updateLandingNav, { passive: true });
    window.addEventListener("resize", updateLandingNav);

    return () => {
      window.removeEventListener("scroll", updateLandingNav);
      window.removeEventListener("resize", updateLandingNav);
    };
  }, [page]);

  useEffect(() => {
    if (page !== "landing") {
      setDesktopNavIndicator({ left: 0, width: 0, opacity: 0 });
      return;
    }

    const updateIndicator = () => {
      const nav = desktopNavRef.current;
      const button = desktopNavButtonRefs.current[activeLandingSection];
      if (!nav || !button) {
        setDesktopNavIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const width = Math.max(22, buttonRect.width - 16);
      const left = buttonRect.left - navRect.left + (buttonRect.width - width) / 2;

      setDesktopNavIndicator({ left, width, opacity: 1 });
    };

    const rafId = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [page, activeLandingSection]);

  useEffect(() => {
    const updateScrollProgress = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = (window.scrollY / maxScroll) * 100;
      setScrollProgress(Math.max(0, Math.min(100, progress)));
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, [page]);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <AppContext.Provider
        value={{
          page,
          setPage,
          walletConnected,
          walletAddress,
          walletChainId,
          walletBusy,
          walletError,
          connectWallet,
          disconnectWallet,
          contractStatus,
          setContractStatus,
          monitoringConfig,
          updateMonitoringConfig,
          alerts,
          addAlert,
          latestIncident,
          setLatestIncident,
        }}
      >
        <div className={`min-h-screen relative isolate overflow-x-hidden transition-colors duration-500 ${dark ? "bg-argus-dark text-gray-100" : "bg-gray-50 text-gray-900"}`}>
          <NeuralBackground dark={dark} />
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[1000] h-[2px]">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.75)] transition-[width] duration-150 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
            <div className="app-ambient" />
            <div className="app-grid opacity-80" />
            <div className="app-vignette" />
            <div className="absolute -top-36 left-[8%] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" data-parallax="0.05" />
            <div className="absolute top-[35%] right-[4%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" data-parallax="-0.04" />
            <div className="absolute bottom-[-12rem] left-1/3 h-96 w-96 rounded-full bg-cyan-500/9 blur-3xl" data-parallax="0.06" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/36 to-transparent animate-data-flow" />
          </div>
          <div className="relative z-10">
            {page === "landing" && (
              <div
                className={`landing-topbar fixed inset-x-0 top-0 z-[999] border-b backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  dark
                    ? `border-argus-border ${landingScrolled ? "bg-argus-darker/88 shadow-[0_16px_36px_-28px_rgba(6,182,212,0.75)]" : "bg-argus-darker/72"} supports-[backdrop-filter]:bg-argus-darker/58`
                    : `border-gray-200 ${landingScrolled ? "bg-white/95 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.3)]" : "bg-white/84"} supports-[backdrop-filter]:bg-white/68`
                }`}
              >
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${landingScrolled ? "h-14" : "h-16"}`}>
                  <div className="flex items-center gap-2">
                    <Shield className="text-cyan-400" size={28} />
                    <span className="text-lg font-bold tracking-wider">
                      <span className="text-cyan-400">ARGUS</span>
                      <span className={dark ? "text-gray-400" : "text-gray-500"}> PROTOCOL</span>
                    </span>
                  </div>
                  <div
                    ref={desktopNavRef}
                    className="hidden md:flex relative items-center gap-1.5 rounded-xl p-1 border border-cyan-500/15 bg-cyan-500/5"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute bottom-1 h-0.5 rounded-full transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        dark
                          ? "bg-gradient-to-r from-cyan-400/80 via-cyan-300 to-blue-400/80 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                          : "bg-gradient-to-r from-cyan-600/90 via-cyan-500 to-blue-600/90 shadow-[0_0_10px_rgba(8,145,178,0.35)]"
                      }`}
                      style={{
                        width: `${desktopNavIndicator.width}px`,
                        opacity: desktopNavIndicator.opacity,
                        transform: `translateX(${desktopNavIndicator.left}px)`,
                      }}
                    />
                    {landingNavItems.map((item) => {
                      const isActive = activeLandingSection === item.id;
                      return (
                        <button
                          key={item.id}
                          ref={(el) => {
                            desktopNavButtonRefs.current[item.id] = el;
                          }}
                          onClick={() => scrollToLandingSection(item.id)}
                          className={`relative z-[1] px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
                            isActive
                              ? dark
                                ? "text-cyan-200"
                                : "text-cyan-800"
                              : dark
                                ? "text-gray-400 hover:text-gray-200 hover:bg-white/8"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      onClick={toggle}
                      className={`p-2 rounded-lg transition-colors ${
                        dark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                      }`}
                    >
                      {dark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                      onClick={handleLandingConnect}
                      disabled={walletBusy}
                      data-shimmer
                      className="hidden md:inline-flex px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 items-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                    >
                      {walletBusy ? "Connecting..." : "Connect Wallet"}
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => setLandingMenuOpen((prev) => !prev)}
                      className={`md:hidden p-2 rounded-lg transition-colors ${
                        dark ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      aria-label={landingMenuOpen ? "Close menu" : "Open menu"}
                    >
                      {landingMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                  </div>
                </div>
                <div
                  className={`md:hidden overflow-hidden transition-all duration-300 ${
                    landingMenuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <div className={`mx-3 mb-3 rounded-2xl border p-3 ${
                    dark ? "border-argus-border bg-argus-card/90" : "border-gray-200 bg-white/95"
                  }`}>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {landingNavItems.map((item) => {
                        const isActive = activeLandingSection === item.id;
                        return (
                          <button
                            key={`mobile-${item.id}`}
                            onClick={() => scrollToLandingSection(item.id)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                              isActive
                                ? dark
                                  ? "text-cyan-300 bg-cyan-500/15"
                                  : "text-cyan-700 bg-cyan-100"
                                : dark
                                  ? "text-gray-300 bg-white/5 hover:bg-white/10"
                                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={handleLandingConnect}
                      disabled={walletBusy}
                      data-shimmer
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                    >
                      {walletBusy ? "Connecting..." : "Connect Wallet"}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {page !== "landing" && <Navbar />}
            <main key={page} className="animate-page-enter">
              {page === "landing" && <LandingPage />}
              {page === "dashboard" && <Dashboard />}
              {page === "config" && <Configuration />}
              {page === "notifications" && <Notifications />}
              {page === "recovery" && <RecoveryPanel />}
            </main>
          </div>
        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}
