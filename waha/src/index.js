/**
 * Kak Sopian's Personal Wealth AI - WAHA WhatsApp Chatbot
 * Session: investku | WAHA Server: waha-qikiufjwa2nh.cgk-max.sumopod.my.id
 */

const WAHA_URL = 'https://waha-qikiufjwa2nh.cgk-max.sumopod.my.id';
const SESSION = 'investku';
const OWNER_NUMBER = '628159658833@c.us';

const SYSTEM_PROMPT = `Kamu adalah "Personal Wealth AI" milik Kak Sopian, AI advisor keuangan berbasis GRC untuk portofolio Syariah.

# KONTEKS USER (KAK SOPIAN)
- Roles: Founder Labbaik AI & Muezza AI, GRC Expert, Senior Audit Committee BPKH
- Investment Style: Aggressive-Balanced (Sharia Only)
- Core Assets:
  1. Deposito BSI: Passive Income source (~Rp 31rb/bulan)
  2. Emas: Physical gold investment
  3. Bibit: Stocks (BRIS, JATI) & Sharia Mutual Funds
- Strategy: "Anak Deposito beli RDPU" (Reinvesting BSI returns ke Money Market Funds)

# ATURAN
1. Return BSI bulanan HARUS dialokasi ke RDPU Syariah
2. Hanya saham Syariah (DES compliant)
3. Mode: Concise, Witty, Actionable
4. Panggil user "Kak Sopian"
5. Gunakan emoji secukupnya
6. Balas dalam Bahasa Indonesia

# COMMANDS
- /status : Tampilkan ringkasan portfolio
- /redday : Analisis saat IHSG merah
- /invest : Panduan beli emas bi-weekly
- /sharia : Cek compliance DES
- /help : Tampilkan bantuan

# FORMAT RESPONSE
- Maksimal 1000 karakter agar mudah dibaca di WhatsApp
- Gunakan bullet points untuk list
- Bold dengan *text* untuk penekanan`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        name: "Personal Wealth AI - WAHA Chatbot",
        status: "active",
        waha: WAHA_URL,
        session: SESSION,
        endpoints: ["POST /webhook - WAHA webhook"]
      }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // WAHA Webhook
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const data = await request.json();
      ctx.waitUntil(handleWebhook(data, env));
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Manual test endpoint
    if (url.pathname === '/test' && request.method === 'POST') {
      const body = await request.json();
      const reply = await processMessage(body.message || '/status', env);
      return new Response(JSON.stringify({ reply }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleWebhook(data, env) {
  try {
    console.log('Webhook received:', JSON.stringify(data));

    // Handle different WAHA event formats
    const event = data.event;
    const payload = data.payload || data;

    // Only process incoming messages
    if (!['message', 'message.any'].includes(event)) {
      return;
    }

    // Extract message details
    const messageBody = payload.body || payload.text || payload._data?.body || '';
    let from = payload.from || payload.chatId || payload._data?.from;
    const isFromMe = payload.fromMe || payload._data?.fromMe || false;
    // Get alternative JID (phone number format) when WAHA uses LID addressing
    const remoteJidAlt = payload._data?.key?.remoteJidAlt;

    // Normalize phone number: convert local 0-prefix to international 62-prefix
    if (from && from.startsWith('0')) {
      from = '62' + from.substring(1);
    }

    // Skip empty messages
    if (!messageBody) {
      console.log('Skipping: empty message');
      return;
    }

    // Check if sender is the owner — match by phone number, LID, or me.id
    const meId = data.me?.id;
    const meLid = data.me?.lid;
    const isOwner = from === OWNER_NUMBER
      || from?.includes('628159658833')
      || remoteJidAlt?.includes('628159658833')
      || (isFromMe && (meId === OWNER_NUMBER || meId?.includes('628159658833')));

    // Skip bot's own outgoing replies to prevent loops
    if (isFromMe && from !== OWNER_NUMBER && !from?.includes('628159658833') && !remoteJidAlt?.includes('628159658833')) {
      console.log('Skipping: bot reply');
      return;
    }

    // Only respond to owner — silently ignore non-owner messages
    if (!isOwner) {
      console.log('Skipping: not from owner', from);
      return;
    }

    // Use phone number format for reply (prefer remoteJidAlt over LID)
    if (from?.endsWith('@lid') && remoteJidAlt) {
      from = remoteJidAlt.replace('@s.whatsapp.net', '@c.us');
    }

    console.log(`Processing message from ${from}: ${messageBody}`);

    // Process message and get AI response
    const reply = await processMessage(messageBody, env);

    // Send reply via WAHA
    await sendMessage(from, reply, env);

  } catch (error) {
    console.error('Webhook error:', error);
  }
}

async function processMessage(message, env) {
  const msg = message.trim().toLowerCase();

  // Handle commands
  if (msg === '/help' || msg === 'help' || msg === 'menu') {
    return `🎯 *Personal Wealth AI*
    
Perintah tersedia:
• /status - Ringkasan portfolio
• /redday - Analisis IHSG merah
• /invest - Panduan beli emas
• /sharia - Cek compliance DES

Atau ketik bebas, misal:
• "Beli 7 lot BRIS di 2150"
• "Update emas +1 gram"
• "Berapa net worth saya?"

_Powered by Claude AI_ 🤖`;
  }

  // Get portfolio context from D1
  let portfolioContext = '';
  try {
    const portfolio = await env.DB.prepare(`
      SELECT asset_name, category, quantity, avg_price FROM portfolio_status
    `).all();

    portfolioContext = portfolio.results.map(p => {
      if (p.category === 'Cash') return `• ${p.asset_name}: Rp ${Number(p.quantity).toLocaleString('id-ID')}`;
      if (p.category === 'Gold') return `• ${p.asset_name}: ${p.quantity} gr @ Rp ${Number(p.avg_price).toLocaleString('id-ID')}/gr`;
      if (p.category === 'Saham') return `• ${p.asset_name}: ${p.quantity} lot @ Rp ${Number(p.avg_price).toLocaleString('id-ID')}`;
      return `• ${p.asset_name}: ${Number(p.quantity).toLocaleString('id-ID')} unit`;
    }).join('\n');

    // Calculate net worth
    let netWorth = 0;
    portfolio.results.forEach(p => {
      if (p.category === 'Cash') netWorth += p.quantity;
      else if (p.category === 'Gold') netWorth += p.quantity * p.avg_price;
      else if (p.category === 'Saham') netWorth += p.quantity * 100 * p.avg_price;
      else netWorth += p.quantity * p.avg_price;
    });

    portfolioContext += `\n\n💰 *Est. Net Worth: Rp ${netWorth.toLocaleString('id-ID')}*`;
  } catch (e) {
    console.error('DB Error:', e);
    portfolioContext = 'Database tidak tersedia';
  }

  // Check for transaction patterns and log
  const transactionLog = await detectAndLogTransaction(message, env);

  // Handle /status command directly
  if (msg === '/status' || msg === 'status') {
    let response = `📊 *Portfolio Kak Sopian*\n\n${portfolioContext}`;
    
    // Get open orders
    try {
      const orders = await env.DB.prepare(`
        SELECT ticker, action, lots, price FROM transactions WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT 5
      `).all();

      if (orders.results.length > 0) {
        response += '\n\n📝 *Antrean Aktif:*\n';
        orders.results.forEach(o => {
          response += `• ${o.action} ${o.lots} lot ${o.ticker} @ Rp ${Number(o.price).toLocaleString('id-ID')}\n`;
        });
      }
    } catch (e) {}

    response += '\n\n💡 _Reminder: Alokasi return BSI ke RDPU Syariah!_';
    return response;
  }

  // Call Claude API for other queries
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n# PORTFOLIO SAAT INI\n${portfolioContext}` },
          { role: 'user', content: message }
        ]
      })
    });

    const result = await response.json();
    let reply = result.choices?.[0]?.message?.content || 'Maaf ada kendala, coba lagi ya Kak.';

    // Append transaction log if detected
    if (transactionLog) {
      reply += `\n\n✅ ${transactionLog}`;
    }

    return reply;

  } catch (error) {
    console.error('Claude API error:', error);
    return '⚠️ Maaf Kak, ada kendala teknis. Coba lagi nanti ya.';
  }
}

async function detectAndLogTransaction(message, env) {
  if (!env.DB) return null;

  const msg = message.toUpperCase();

  // Pattern: "beli X lot TICKER di PRICE"
  const buyPatterns = [
    /BELI\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@|HARGA)\s*(\d+)/i,
    /ANTRI\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@)\s*(\d+)/i,
    /(\w+)\s+(\d+)\s+(\d+)\s*LOT/i
  ];

  for (const pattern of buyPatterns) {
    const match = message.match(pattern);
    if (match) {
      let lots, ticker, price;

      if (pattern.source.includes('BELI') || pattern.source.includes('ANTRI')) {
        [, lots, ticker, price] = match;
      } else {
        [, ticker, price, lots] = match;
      }

      try {
        await env.DB.prepare(`
          INSERT INTO transactions (ticker, action, lots, price, status)
          VALUES (?, 'BUY', ?, ?, 'OPEN')
        `).bind(ticker.toUpperCase(), parseInt(lots), parseInt(price)).run();

        return `Antrean ${lots} lot ${ticker.toUpperCase()} @ Rp ${parseInt(price).toLocaleString('id-ID')} tercatat!`;
      } catch (e) {
        console.error('Transaction log error:', e);
      }
    }
  }

  // Pattern: "jual X lot TICKER di PRICE"
  const sellMatch = message.match(/JUAL\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@)\s*(\d+)/i);
  if (sellMatch) {
    const [, lots, ticker, price] = sellMatch;
    try {
      await env.DB.prepare(`
        INSERT INTO transactions (ticker, action, lots, price, status)
        VALUES (?, 'SELL', ?, ?, 'OPEN')
      `).bind(ticker.toUpperCase(), parseInt(lots), parseInt(price)).run();

      return `Antrean jual ${lots} lot ${ticker.toUpperCase()} @ Rp ${parseInt(price).toLocaleString('id-ID')} tercatat!`;
    } catch (e) {}
  }

  // Pattern: gold purchase
  const goldMatch = message.match(/(?:BELI|TAMBAH|UPDATE)\s*(?:EMAS|GOLD)\s*\+?\s*(\d+(?:\.\d+)?)\s*(?:GR|GRAM)?/i);
  if (goldMatch) {
    const [, grams] = goldMatch;
    try {
      const existing = await env.DB.prepare(`
        SELECT quantity FROM portfolio_status WHERE asset_name = 'Emas'
      `).first();

      const newQty = (existing?.quantity || 0) + parseFloat(grams);

      await env.DB.prepare(`
        UPDATE portfolio_status SET quantity = ?, last_updated = datetime('now')
        WHERE asset_name = 'Emas'
      `).bind(newQty).run();

      return `Emas +${grams}gr tercatat! Total: ${newQty.toFixed(2)} gr`;
    } catch (e) {}
  }

  return null;
}

async function sendMessage(chatId, text, env) {
  try {
    const response = await fetch(`${WAHA_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': env.WAHA_API_KEY || ''
      },
      body: JSON.stringify({
        chatId: chatId,
        text: text,
        session: SESSION
      })
    });

    const result = await response.json();
    console.log('Message sent:', result);
    return result;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}
