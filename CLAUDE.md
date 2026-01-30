# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo contains **two Cloudflare Workers** for personal Sharia-compliant portfolio management, plus a standalone React dashboard. Both workers share the same D1 database.

| Worker | Directory | wrangler name | Purpose |
|--------|-----------|---------------|---------|
| **sopian-wealth-ai** | `/` (root) | `sopian-wealth-ai` | REST API + chat + webhook |
| **wealth-ai-waha** | `/waha` | `wealth-ai-waha` | Dedicated WhatsApp chatbot via WAHA |

## Commands

Both workers use the same npm scripts. Run from the respective directory.

```bash
# Root worker (REST API)
npm run dev          # wrangler dev
npm run deploy       # wrangler deploy
npm run tail         # wrangler tail

# WAHA worker (WhatsApp chatbot) — run from waha/
cd waha && npm run dev
cd waha && npm run deploy

# Query shared D1 database
wrangler d1 execute sopian-wealth-ai-db --command "SQL_HERE"

# Set secrets (each worker needs its own)
wrangler secret put CLAUDE_API_KEY              # root worker
cd waha && wrangler secret put CLAUDE_API_KEY   # waha worker

# Configure WAHA webhook (edit WORKER_URL first)
# Note: setup-webhook.sh exists in both root and waha/ (identical copies)
bash setup-webhook.sh
```

There are no test or lint scripts configured in either worker.

## Architecture

Two single-file Cloudflare Workers (`src/index.js` in each), both exporting a `fetch` handler. No build step — plain JavaScript deployed directly. Both bind to the **same D1 database** (`sopian-wealth-ai-db`, id `17423673-ec65-43dd-99fd-c633c9aab833`). Both use `claude-sonnet-4-20250514` for AI calls.

### Root Worker (`sopian-wealth-ai`)

**Runtime bindings (defined in `wrangler.toml`):**
- `env.DB` — Cloudflare D1 database
- `env.CLAUDE_API_KEY` — Anthropic API key (secret)
- `env.WAHA_URL` — WAHA server URL (secret, optional)

**Request flow:**
1. Worker receives HTTP request
2. Routes by `pathname` + `method` (manual if/else chain, no router library)
3. Portfolio/transaction handlers query D1 directly via prepared statements
4. Chat handler (`/api/chat`) and webhook handler (`/webhook`) both: fetch portfolio from D1 for context, run `detectAndLogTransaction()` regex parser, then call Claude API with system prompt + portfolio context
5. WAHA webhook additionally sends the reply back to WhatsApp via `WAHA_URL/api/sendText`

### WAHA Worker (`wealth-ai-waha`)

Dedicated WhatsApp chatbot that receives WAHA webhooks and responds via the WAHA API.

**Key differences from root worker:**
- Hardcoded WAHA constants: `WAHA_URL`, `SESSION` ("investku"), `OWNER_NUMBER` (`628159658833@c.us`)
- Owner-only security: rejects messages not from `OWNER_NUMBER`
- Uses `ctx.waitUntil()` for async webhook processing (immediate 200 response)
- `/help` and `/status` commands handled locally without calling Claude API
- System prompt is in Bahasa Indonesia with WhatsApp formatting constraints (max 1000 chars, `*bold*` syntax)
- Has a `/test` endpoint for manual testing without WhatsApp
- `max_tokens` set to 500 (vs 1024 in root worker) for WhatsApp readability

**Key design patterns (shared across both workers):**
- All responses are JSON with `{ status, data/reply/error }` shape and CORS headers
- Transaction detection uses regex patterns to parse Indonesian natural language and auto-insert into D1. Key patterns: `BELI/ANTRI <lots> LOT <ticker> DI/@ <price>`, `JUAL <lots> LOT <ticker> DI/@ <price>`, `BELI/BOUGHT EMAS/GOLD <grams>`. See `detectAndLogTransaction()` in each worker.
- Transactions start as `status='OPEN'`. When updated to `status='MATCH'`, `updatePortfolioFromTransaction()` recalculates the portfolio's weighted average price and quantity.
- Portfolio valuation applies category-specific math: Cash=quantity, Gold=qty*price, Saham=lots*100*price, Reksadana=units*NAV
- Passive income calculation: BSI deposit quantity * 2.5% annual / 12 months
- `dashboard.jsx` is a standalone React component (Tailwind + lucide-react). Not bundled or served by either Worker — used independently.

## Database Schema

Two tables in D1 (no migration files — tables were created manually):

- **`portfolio_status`**: `id`, `asset_name`, `category` (Saham/Gold/Cash/Reksadana), `quantity`, `avg_price`, `last_updated`
- **`transactions`**: `id`, `ticker`, `action` (BUY/SELL), `lots`, `price`, `status` (OPEN/MATCH), `created_at`

## API Routes

### Root Worker (`src/index.js`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/` | Health check / endpoint list |
| GET | `/api/status` | `handleStatus()` — net worth + passive income |
| GET | `/api/portfolio` | `handleGetPortfolio()` |
| PUT | `/api/portfolio` | `handleUpdatePortfolio()` |
| POST | `/api/transaction` | `handleTransaction()` |
| GET | `/api/transactions` | `handleGetTransactions()` |
| POST | `/api/chat` | `handleChat()` — AI chat with transaction detection |
| POST | `/webhook` | `handleWAHAWebhook()` — WhatsApp integration |

### WAHA Worker (`waha/src/index.js`)

| Method | Path | Handler |
|--------|------|---------|
| GET | `/` | Health check |
| POST | `/webhook` | `handleWebhook()` — WAHA WhatsApp events (owner-only) |
| POST | `/test` | Manual test endpoint (send `{ "message": "..." }`) |

## Domain Context

This is a personal finance tool for "Kak Sopian" following Sharia-compliant investing. The AI system prompt enforces DES (Daftar Efek Syariah) compliance, uses Indonesian language in responses, and references the "Anak Deposito beli RDPU" strategy (reinvesting BSI deposit returns into Sharia money market funds). Chat commands: `/status`, `/redday`, `/invest`, `/sharia`.
