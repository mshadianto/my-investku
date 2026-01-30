import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Send, PiggyBank, Coins, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'https://sopian-wealth-ai.YOUR_SUBDOMAIN.workers.dev'; // Update after deployment

export default function WealthAIDashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demonstration
  useEffect(() => {
    // Simulated portfolio data
    setPortfolio([
      { id: 1, asset_name: 'Deposito BSI', category: 'Cash', quantity: 15000000, avg_price: 1, estimated_value: 15000000 },
      { id: 2, asset_name: 'Emas', category: 'Gold', quantity: 3.31, avg_price: 1700000, estimated_value: 5627000 },
      { id: 3, asset_name: 'BRIS', category: 'Saham', quantity: 10, avg_price: 2200, estimated_value: 2200000 },
      { id: 4, asset_name: 'JATI', category: 'Saham', quantity: 5, avg_price: 1500, estimated_value: 750000 },
      { id: 5, asset_name: 'Mandiri Atraktif-Syariah', category: 'Reksadana', quantity: 500000, avg_price: 1.05, estimated_value: 525000 }
    ]);

    setTransactions([
      { id: 1, ticker: 'BRIS', action: 'BUY', lots: 7, price: 2150, status: 'OPEN', created_at: '2026-01-30 02:44:38' },
      { id: 2, ticker: 'JATI', action: 'BUY', lots: 10, price: 1450, status: 'OPEN', created_at: '2026-01-30 02:44:38' },
      { id: 3, ticker: 'BRIS', action: 'BUY', lots: 3, price: 2180, status: 'MATCH', created_at: '2026-01-30 02:44:38' }
    ]);

    setStatus({
      total_net_worth: 24102000,
      monthly_passive_income: 31250
    });
  }, []);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cash': return <PiggyBank className="w-5 h-5 text-green-500" />;
      case 'Gold': return <Coins className="w-5 h-5 text-yellow-500" />;
      case 'Saham': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'Reksadana': return <BarChart3 className="w-5 h-5 text-purple-500" />;
      default: return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    setLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      if (chatMessage.toLowerCase().includes('/status')) {
        setChatResponse(`Assalamualaikum Kak Sopian! 🎯

📊 **Portfolio Summary**

| Asset | Value |
|-------|-------|
| Deposito BSI | Rp 15.000.000 |
| Emas (3.31gr) | Rp 5.627.000 |
| BRIS (10 lot) | Rp 2.200.000 |
| JATI (5 lot) | Rp 750.000 |
| RD Syariah | Rp 525.000 |

**Total Net Worth: Rp 24.102.000**
**Monthly Passive Income: Rp 31.250**

💡 Reminder: Alokasikan return BSI ke RDPU Syariah bulan ini, Kak!`);
      } else if (chatMessage.toLowerCase().includes('beli') && chatMessage.toLowerCase().includes('bris')) {
        setChatResponse(`Siap Kak Sopian! 

Saya sudah catat antrean beli BRIS. Dengan posisi existing 10 lot @ Rp 2.200, kalau match di harga lebih rendah, avg price akan turun — strategi average down yang solid.

✅ Log: Antrean sudah dicatat di database, Kak.

⚡ Tips: Pantau support level BRIS di 2.100-2.150. Kalau IHSG merah, bisa jadi kesempatan akumulasi.`);
      } else {
        setChatResponse(`Baik Kak Sopian! 

Saya sudah analisis request Anda. Sebagai GRC-based AI, saya selalu memastikan semua rekomendasi sesuai dengan prinsip Syariah dan risk management yang prudent.

Ada yang bisa saya bantu lebih lanjut? Ketik /status untuk lihat portfolio, atau /sharia untuk cek compliance.`);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kak Sopian's Personal Wealth AI</h1>
            <p className="text-emerald-400 text-sm">GRC-based Sharia Portfolio Management</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">Total Net Worth</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatRupiah(status?.total_net_worth || 0)}</p>
          <p className="text-emerald-400 text-sm mt-2">+2.5% dari bulan lalu</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">Monthly Passive Income</span>
            <PiggyBank className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{formatRupiah(status?.monthly_passive_income || 0)}</p>
          <p className="text-yellow-400 text-sm mt-2">→ Alokasi ke RDPU Syariah</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm">Open Orders</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{transactions.filter(t => t.status === 'OPEN').length}</p>
          <p className="text-blue-400 text-sm mt-2">Antrean beli aktif</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 bg-slate-800/30 p-1 rounded-xl w-fit">
          {['dashboard', 'transactions', 'chat'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Portfolio Holdings
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              {portfolio.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.asset_name}</p>
                      <p className="text-slate-400 text-sm">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatRupiah(item.estimated_value)}</p>
                    <p className="text-slate-400 text-sm">
                      {item.category === 'Gold' ? `${item.quantity} gr` : 
                       item.category === 'Saham' ? `${item.quantity} lot @ ${formatRupiah(item.avg_price)}` :
                       item.category === 'Cash' ? '' :
                       `${item.quantity.toLocaleString()} unit`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Transaction History
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${tx.action === 'BUY' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {tx.action === 'BUY' ? 
                        <TrendingUp className="w-5 h-5 text-emerald-400" /> : 
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.action} {tx.lots} lot {tx.ticker}</p>
                      <p className="text-slate-400 text-sm">@ {formatRupiah(tx.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.status === 'MATCH' ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" /> Match
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        <AlertCircle className="w-4 h-4" /> Open
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Chat with Wealth AI
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4 flex-wrap">
                {['/status', '/redday', '/invest', '/sharia'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => setChatMessage(cmd)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Ketik pesan atau command..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleChat}
                  disabled={loading}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {chatResponse && (
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-400 text-sm font-medium mb-2">Wealth AI</p>
                      <div className="text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                        {chatResponse}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Bismillah, Berkah, Barokah 🤲 | Cloudflare Workers + D1 + Claude AI
        </p>
      </div>
    </div>
  );
}
