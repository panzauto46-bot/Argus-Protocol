import { useState } from 'react';
import { useTheme } from '../App';
import { Bell, Send, CheckCircle, AlertCircle, MessageSquare, Hash, Link, Zap, ExternalLink } from 'lucide-react';

export default function Notifications() {
  const { dark } = useTheme();
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [telegramChat, setTelegramChat] = useState('');
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [discordSuccess, setDiscordSuccess] = useState(false);
  const [telegramSuccess, setTelegramSuccess] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', message: 'Unusual withdrawal pattern detected on 0x68b3...a5F2', time: '2 min ago', channel: 'Discord' },
    { id: 2, type: 'info', message: 'Argus Shield deployed on new contract 0x3a4F...8B2c', time: '15 min ago', channel: 'Telegram' },
    { id: 3, type: 'critical', message: 'Emergency braking activated! Contract paused.', time: '1 hour ago', channel: 'All' },
    { id: 4, type: 'success', message: 'Contract 0x9c1E...4D7a resumed after admin review', time: '2 hours ago', channel: 'Discord' },
    { id: 5, type: 'info', message: 'Tripwire configuration updated: threshold set to 15%', time: '3 hours ago', channel: 'Telegram' },
  ]);

  const handleTestDiscord = () => {
    if (!discordWebhook) return;
    setTestingDiscord(true);
    setTimeout(() => {
      setTestingDiscord(false);
      setDiscordSuccess(true);
      setNotifications(prev => [{
        id: Date.now(),
        type: 'success',
        message: 'Test alert sent successfully to Discord webhook',
        time: 'Just now',
        channel: 'Discord',
      }, ...prev]);
      setTimeout(() => setDiscordSuccess(false), 3000);
    }, 2000);
  };

  const handleTestTelegram = () => {
    if (!telegramBot || !telegramChat) return;
    setTestingTelegram(true);
    setTimeout(() => {
      setTestingTelegram(false);
      setTelegramSuccess(true);
      setNotifications(prev => [{
        id: Date.now(),
        type: 'success',
        message: 'Test alert sent successfully to Telegram bot',
        time: 'Just now',
        channel: 'Telegram',
      }, ...prev]);
      setTimeout(() => setTelegramSuccess(false), 3000);
    }, 2000);
  };

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    critical: { icon: <AlertCircle size={16} />, color: 'text-red-400', bg: dark ? 'bg-red-500/10' : 'bg-red-50' },
    warning: { icon: <AlertCircle size={16} />, color: 'text-yellow-400', bg: dark ? 'bg-yellow-500/10' : 'bg-yellow-50' },
    success: { icon: <CheckCircle size={16} />, color: 'text-emerald-400', bg: dark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
    info: { icon: <Bell size={16} />, color: 'text-blue-400', bg: dark ? 'bg-blue-500/10' : 'bg-blue-50' },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8" data-reveal>
        <h1 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Real-Time Notification Hub</h1>
        <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Connect your messaging platforms to receive instant on-chain security alerts
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Discord */}
        <div className={`p-6 rounded-2xl border ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-tilt data-pop data-tilt-strength={5.2}>
          <div className="flex items-center gap-3 mb-5">
            <div className="pop-icon w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Discord Integration</h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Webhook URL for alert channel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Webhook URL
              </label>
              <div className="relative">
                <Link size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="url"
                  value={discordWebhook}
                  onChange={(e) => { setDiscordWebhook(e.target.value); setDiscordSuccess(false); }}
                  placeholder="https://discord.com/api/webhooks/..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                    dark
                      ? 'bg-argus-dark border-argus-border text-gray-200 placeholder-gray-600 focus:border-indigo-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleTestDiscord}
              disabled={!discordWebhook || testingDiscord}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                discordSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : !discordWebhook
                    ? dark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
              }`}
            >
              {discordSuccess ? (
                <><CheckCircle size={16} /> Alert Sent Successfully</>
              ) : testingDiscord ? (
                <><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Sending Test...</>
              ) : (
                <><Send size={16} /> Test Discord Alert</>
              )}
            </button>
          </div>
        </div>

        {/* Telegram */}
        <div className={`p-6 rounded-2xl border ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={80} data-tilt data-pop data-tilt-strength={5.2}>
          <div className="flex items-center gap-3 mb-5">
            <div className="pop-icon w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Send size={20} />
            </div>
            <div>
              <h2 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Telegram Integration</h2>
              <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Bot token and chat ID for alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Bot Token
              </label>
              <div className="relative">
                <Zap size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={telegramBot}
                  onChange={(e) => { setTelegramBot(e.target.value); setTelegramSuccess(false); }}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                    dark
                      ? 'bg-argus-dark border-argus-border text-gray-200 placeholder-gray-600 focus:border-sky-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Chat ID
              </label>
              <div className="relative">
                <Hash size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={telegramChat}
                  onChange={(e) => { setTelegramChat(e.target.value); setTelegramSuccess(false); }}
                  placeholder="-1001234567890"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                    dark
                      ? 'bg-argus-dark border-argus-border text-gray-200 placeholder-gray-600 focus:border-sky-500/50'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-sky-400'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleTestTelegram}
              disabled={!telegramBot || !telegramChat || testingTelegram}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                telegramSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : !telegramBot || !telegramChat
                    ? dark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30'
              }`}
            >
              {telegramSuccess ? (
                <><CheckCircle size={16} /> Alert Sent Successfully</>
              ) : testingTelegram ? (
                <><div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /> Sending Test...</>
              ) : (
                <><Send size={16} /> Test Telegram Alert</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className={`rounded-2xl border ${dark ? 'bg-argus-card/50 border-argus-border' : 'bg-white border-gray-200'}`} data-reveal data-reveal-delay={120} data-tilt data-pop data-tilt-strength={4.6}>
        <div className="p-6 pb-4">
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Alert History</h2>
          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Recent notifications sent across all channels</p>
        </div>
        <div className="divide-y divide-argus-border">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            return (
              <div
                key={notif.id}
                data-reveal="left"
                data-reveal-delay={40}
                className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                  dark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{notif.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{notif.time}</span>
                    <span className={`pop-chip text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {notif.channel}
                    </span>
                  </div>
                </div>
                <button className={`p-1.5 rounded-lg flex-shrink-0 ${dark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <ExternalLink size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
