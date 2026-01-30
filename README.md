# 🎯 Kak Sopian's Personal Wealth AI

**GRC-based Sharia Portfolio Management System**

A Cloudflare Worker-based API for managing hybrid Sharia portfolio consisting of Sharia Stocks, Gold, and Deposits.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   WhatsApp      │────▶│  Cloudflare      │────▶│  Cloudflare D1  │
│   (WAHA)        │     │  Worker API      │     │  Database       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Claude API      │
                        │  (AI Assistant)  │
                        └──────────────────┘
```

## 📊 Database Schema

### portfolio_status
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| asset_name | TEXT | BRIS, Emas, Deposito BSI, etc |
| category | TEXT | Saham, Gold, Cash, Reksadana |
| quantity | REAL | Grams, Lots, or Rupiah |
| avg_price | REAL | Average purchase price |
| last_updated | TEXT | Timestamp |

### transactions
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| ticker | TEXT | Stock ticker |
| action | TEXT | BUY / SELL |
| lots | INTEGER | Number of lots |
| price | REAL | Transaction price |
| status | TEXT | OPEN / MATCH |
| created_at | TEXT | Timestamp |

## 🚀 Deployment

### 1. Prerequisites
```bash
npm install -g wrangler
wrangler login
```

### 2. Set Secrets
```bash
wrangler secret put CLAUDE_API_KEY
# Enter your Anthropic API key

wrangler secret put WAHA_URL
# Enter your WAHA server URL (optional)
```

### 3. Deploy
```bash
wrangler deploy
```

## 📡 API Endpoints

### GET /
Health check and endpoint list

### GET /api/status
**Portfolio summary with net worth calculation**

Response:
```json
{
  "status": "success",
  "data": {
    "portfolio": [...],
    "total_net_worth": 21152000,
    "formatted_net_worth": "Rp 21.152.000",
    "monthly_passive_income": 31250,
    "formatted_income": "Rp 31.250",
    "strategy_reminder": "Anak Deposito beli RDPU..."
  }
}
```

### GET /api/portfolio
**Get all portfolio items**

### PUT /api/portfolio
**Update portfolio item**

Request:
```json
{
  "asset_name": "BRIS",
  "quantity": 15,
  "avg_price": 2180
}
```

### POST /api/transaction
**Log new transaction**

Request:
```json
{
  "ticker": "BRIS",
  "action": "BUY",
  "lots": 7,
  "price": 2150,
  "status": "OPEN"
}
```

### GET /api/transactions
**Get transaction history**

### POST /api/chat
**Chat with AI Assistant**

Request:
```json
{
  "message": "/status"
}
```

### POST /webhook
**WAHA WhatsApp webhook**

## 💬 Chat Commands

| Command | Description |
|---------|-------------|
| `/status` | Show total assets summary |
| `/redday` | Analyze portfolio when IHSG is red |
| `/invest` | Guidance for bi-weekly gold purchase |
| `/sharia` | Check DES compliance of holdings |

## 🤖 Smart Transaction Detection

The AI automatically detects and logs transactions from natural language:

- **"Beli 7 lot BRIS di 2150"** → Logs BUY order
- **"Jual 5 lot JATI @ 1600"** → Logs SELL order  
- **"Bought 1gr gold"** → Updates gold portfolio
- **"Antri 10 lot BRIS di 2100"** → Logs pending order

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| CLAUDE_API_KEY | Yes | Anthropic API key |
| WAHA_URL | No | WAHA server URL for WhatsApp |

## 📱 WAHA Integration

To enable WhatsApp integration:

1. Deploy WAHA server
2. Set webhook URL to: `https://your-worker.workers.dev/webhook`
3. Configure WAHA_URL secret

## 🎯 Strategy Reminders

- **Anak Deposito beli RDPU**: Monthly BSI return (Rp 31k) → RDPU Syariah
- **Average Down**: If BRIS drops >5%, consider adding position
- **DES Compliance**: Monitor stocks for Sharia index removal

## 📈 Current Portfolio (Sample)

| Asset | Category | Quantity | Avg Price | Est. Value |
|-------|----------|----------|-----------|------------|
| Deposito BSI | Cash | Rp 15.000.000 | - | Rp 15.000.000 |
| Emas | Gold | 3.31 gr | Rp 1.700.000 | Rp 5.627.000 |
| BRIS | Saham | 10 lot | Rp 2.200 | Rp 2.200.000 |
| JATI | Saham | 5 lot | Rp 1.500 | Rp 750.000 |
| Mandiri Atraktif-Syariah | Reksadana | 500.000 unit | Rp 1,05 | Rp 525.000 |

**Total Est. Net Worth: ~Rp 24.102.000**

## 🛠️ Development

```bash
# Run locally
wrangler dev

# View logs
wrangler tail

# Query database
wrangler d1 execute sopian-wealth-ai-db --command "SELECT * FROM portfolio_status"
```

## 📝 License

MIT - Built with ❤️ by Kak Sopian

---

**Bismillah, Berkah, Barokah** 🤲
