# 🤖 Personal Wealth AI - WAHA WhatsApp Chatbot

## Quick Setup

### 1. Deploy Worker
```bash
cd wealth-ai-waha
npm install
wrangler secret put CLAUDE_API_KEY
wrangler deploy
```

### 2. Configure WAHA Webhook

Setelah deploy, Anda akan mendapat URL seperti:
`https://wealth-ai-waha.YOUR_SUBDOMAIN.workers.dev`

Set webhook di WAHA:

**Option A: Via WAHA Dashboard**
1. Buka https://waha-qikiufjwa2nh.cgk-max.sumopod.my.id/dashboard
2. Pilih session `investku`
3. Set Webhook URL: `https://wealth-ai-waha.YOUR_SUBDOMAIN.workers.dev/webhook`

**Option B: Via API**
```bash
curl -X PUT "https://waha-qikiufjwa2nh.cgk-max.sumopod.my.id/api/sessions/investku" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "webhooks": [{
        "url": "https://wealth-ai-waha.YOUR_SUBDOMAIN.workers.dev/webhook",
        "events": ["message", "message.any"]
      }]
    }
  }'
```

### 3. Test Bot

Kirim pesan ke nomor WhatsApp yang terhubung:
- `/help` - Lihat menu
- `/status` - Lihat portfolio
- `Beli 7 lot BRIS di 2150` - Log transaksi

## Commands

| Command | Fungsi |
|---------|--------|
| /help | Tampilkan menu bantuan |
| /status | Ringkasan portfolio & net worth |
| /redday | Analisis saat IHSG merah |
| /invest | Panduan beli emas bi-weekly |
| /sharia | Cek compliance DES |

## Smart Features

Bot otomatis mendeteksi dan mencatat:
- "Beli 7 lot BRIS di 2150" → Log transaksi BUY
- "Jual 5 lot JATI @ 1600" → Log transaksi SELL
- "Update emas +1 gram" → Update portfolio emas

## Security

Bot hanya merespon pesan dari nomor owner (628159658833).
Ubah `OWNER_NUMBER` di `src/index.js` jika diperlukan.

## Troubleshooting

### Bot tidak merespon
1. Cek webhook URL sudah benar
2. Cek `wrangler tail` untuk melihat logs
3. Pastikan CLAUDE_API_KEY sudah di-set

### Database error
```bash
wrangler d1 execute sopian-wealth-ai-db --command "SELECT * FROM portfolio_status"
```

## Architecture

```
WhatsApp → WAHA Server → Webhook → Cloudflare Worker → Claude AI
                                        ↓
                                   Cloudflare D1
```
