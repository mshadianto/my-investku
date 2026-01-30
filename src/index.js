/**
 * Kak Sopian's Personal Wealth AI - Cloudflare Worker
 * GRC-based Sharia Portfolio Management System
 */

const SYSTEM_PROMPT = `You are "Kak Sopian's Personal Wealth AI", a specialized GRC-based financial advisor.

# USER CONTEXT (KAK SOPIAN)
- Roles: Founder Labbaik AI & Muezza AI, GRC Expert, Senior Audit Committee Member at BPKH
- Investment Style: Aggressive-Balanced (Sharia Only)
- Core Assets:
  1. Deposito BSI: Passive Income source
  2. Emas: Physical gold investment
  3. Bibit: Stocks (BRIS, JATI) & Sharia Mutual Funds (Mandiri Atraktif-Syariah)
- Strategy: "Anak Deposito beli RDPU" (Reinvesting BSI returns into Money Market Funds)

# RULES
1. Monthly BSI return must go to RDPU Syariah
2. Only Sharia stocks allowed (DES compliant)
3. Use 'Founder Mode' (Concise, Wit, Actionable)
4. Call user "Kak Sopian"
5. Mix technical GRC terms with supportive founder-to-founder wit

# COMMANDS
- /status : Show total assets summary
- /redday : Analyze portfolio when IHSG is red
- /invest : Guidance for bi-weekly gold purchase
- /sharia : Check compliance of current holdings`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handlers
      if (url.pathname === '/api/status' && request.method === 'GET') {
        return await handleStatus(env, corsHeaders);
      }
      
      if (url.pathname === '/api/portfolio' && request.method === 'GET') {
        return await handleGetPortfolio(env, corsHeaders);
      }
      
      if (url.pathname === '/api/portfolio' && request.method === 'PUT') {
        return await handleUpdatePortfolio(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/transaction' && request.method === 'POST') {
        return await handleTransaction(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/transactions' && request.method === 'GET') {
        return await handleGetTransactions(env, corsHeaders);
      }
      
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }
      
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWAHAWebhook(request, env, corsHeaders);
      }
      
      if (url.pathname === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          name: "Kak Sopian's Personal Wealth AI",
          version: "1.0.0",
          status: "active",
          endpoints: [
            "GET /api/status - Portfolio summary with net worth",
            "GET /api/portfolio - Get all portfolio items",
            "PUT /api/portfolio - Update portfolio item",
            "POST /api/transaction - Log new transaction",
            "GET /api/transactions - Get transaction history",
            "POST /api/chat - Chat with AI",
            "POST /webhook - WAHA WhatsApp webhook"
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// ============ PORTFOLIO HANDLERS ============

async function handleStatus(env, corsHeaders) {
  const portfolio = await env.DB.prepare(`
    SELECT asset_name, category, quantity, avg_price, last_updated 
    FROM portfolio_status
  `).all();

  // Calculate net worth
  let totalNetWorth = 0;
  const summary = portfolio.results.map(item => {
    let value = 0;
    if (item.category === 'Cash') {
      value = item.quantity;
    } else if (item.category === 'Gold') {
      value = item.quantity * item.avg_price;
    } else if (item.category === 'Saham') {
      value = item.quantity * 100 * item.avg_price; // lot * 100 shares * price
    } else if (item.category === 'Reksadana') {
      value = item.quantity * item.avg_price; // units * NAV
    }
    totalNetWorth += value;
    return { ...item, estimated_value: value };
  });

  // Monthly passive income from BSI (assuming 2.5% annual rate)
  const deposito = portfolio.results.find(p => p.asset_name === 'Deposito BSI');
  const monthlyIncome = deposito ? Math.round(deposito.quantity * 0.025 / 12) : 0;

  return new Response(JSON.stringify({
    status: "success",
    data: {
      portfolio: summary,
      total_net_worth: totalNetWorth,
      formatted_net_worth: formatRupiah(totalNetWorth),
      monthly_passive_income: monthlyIncome,
      formatted_income: formatRupiah(monthlyIncome),
      strategy_reminder: "Anak Deposito beli RDPU - Alokasikan return BSI ke RDPU Syariah",
      last_updated: new Date().toISOString()
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetPortfolio(env, corsHeaders) {
  const result = await env.DB.prepare(`
    SELECT * FROM portfolio_status ORDER BY category, asset_name
  `).all();

  return new Response(JSON.stringify({
    status: "success",
    data: result.results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleUpdatePortfolio(request, env, corsHeaders) {
  const body = await request.json();
  const { asset_name, quantity, avg_price } = body;

  if (!asset_name) {
    return new Response(JSON.stringify({ error: 'asset_name is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const updates = [];
  const params = [];
  
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    params.push(quantity);
  }
  if (avg_price !== undefined) {
    updates.push('avg_price = ?');
    params.push(avg_price);
  }
  updates.push("last_updated = datetime('now')");
  params.push(asset_name);

  await env.DB.prepare(`
    UPDATE portfolio_status 
    SET ${updates.join(', ')}
    WHERE asset_name = ?
  `).bind(...params).run();

  return new Response(JSON.stringify({
    status: "success",
    message: `Portfolio updated: ${asset_name}`,
    updated: { asset_name, quantity, avg_price }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============ TRANSACTION HANDLERS ============

async function handleTransaction(request, env, corsHeaders) {
  const body = await request.json();
  const { ticker, action, lots, price, status = 'OPEN' } = body;

  if (!ticker || !action || !lots || !price) {
    return new Response(JSON.stringify({ 
      error: 'Required: ticker, action, lots, price' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate action
  if (!['BUY', 'SELL'].includes(action.toUpperCase())) {
    return new Response(JSON.stringify({ 
      error: 'action must be BUY or SELL' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const result = await env.DB.prepare(`
    INSERT INTO transactions (ticker, action, lots, price, status)
    VALUES (?, ?, ?, ?, ?)
  `).bind(ticker.toUpperCase(), action.toUpperCase(), lots, price, status).run();

  // If MATCH status, update portfolio
  if (status === 'MATCH') {
    await updatePortfolioFromTransaction(env, ticker, action, lots, price);
  }

  return new Response(JSON.stringify({
    status: "success",
    message: `Transaction logged: ${action} ${lots} lot ${ticker} @ ${price}`,
    transaction_id: result.meta.last_row_id,
    data: { ticker, action, lots, price, status }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleGetTransactions(env, corsHeaders) {
  const result = await env.DB.prepare(`
    SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50
  `).all();

  return new Response(JSON.stringify({
    status: "success",
    data: result.results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updatePortfolioFromTransaction(env, ticker, action, lots, price) {
  const existing = await env.DB.prepare(`
    SELECT quantity, avg_price FROM portfolio_status WHERE asset_name = ?
  `).bind(ticker).first();

  if (!existing) return;

  let newQty, newAvg;
  
  if (action === 'BUY') {
    const totalOldValue = existing.quantity * existing.avg_price;
    const newValue = lots * price;
    newQty = existing.quantity + lots;
    newAvg = newQty > 0 ? (totalOldValue + newValue) / newQty : price;
  } else {
    newQty = Math.max(0, existing.quantity - lots);
    newAvg = existing.avg_price; // Keep avg_price on sell
  }

  await env.DB.prepare(`
    UPDATE portfolio_status 
    SET quantity = ?, avg_price = ?, last_updated = datetime('now')
    WHERE asset_name = ?
  `).bind(newQty, newAvg, ticker).run();
}

// ============ CHAT HANDLER ============

async function handleChat(request, env, corsHeaders) {
  const body = await request.json();
  const { message } = body;

  if (!message) {
    return new Response(JSON.stringify({ error: 'message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get portfolio context
  const portfolio = await env.DB.prepare(`
    SELECT asset_name, category, quantity, avg_price FROM portfolio_status
  `).all();

  const portfolioContext = portfolio.results.map(p => 
    `${p.asset_name} (${p.category}): ${p.quantity} @ Rp ${p.avg_price}`
  ).join('\n');

  // Check for transaction patterns
  const transactionLog = await detectAndLogTransaction(env, message);

  // Call Groq API
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n# CURRENT PORTFOLIO\n${portfolioContext}` },
        { role: 'user', content: message }
      ]
    })
  });

  const aiResponse = await response.json();
  let reply = aiResponse.choices?.[0]?.message?.content || aiResponse.error?.message || 'Maaf Kak Sopian, ada kendala teknis.';

  // Append transaction log if detected
  if (transactionLog) {
    reply += `\n\n✅ Log: ${transactionLog}`;
  }

  return new Response(JSON.stringify({
    status: "success",
    reply: reply,
    transaction_logged: transactionLog || null
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============ WAHA WEBHOOK HANDLER ============

async function handleWAHAWebhook(request, env, corsHeaders) {
  const data = await request.json();

  if (data.event === 'message' || data.event === 'message.any') {
    const payload = data.payload;
    const msg = payload.body || payload.text || '';
    const sender = payload.from || payload.chatId;

    if (!msg || msg.startsWith('👋')) return new Response('ok'); // Skip bot messages

    // Process message
    const portfolio = await env.DB.prepare(`
      SELECT asset_name, category, quantity, avg_price FROM portfolio_status
    `).all();

    const portfolioContext = portfolio.results.map(p => 
      `${p.asset_name} (${p.category}): ${p.quantity} @ Rp ${p.avg_price}`
    ).join('\n');

    const transactionLog = await detectAndLogTransaction(env, msg);

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n# CURRENT PORTFOLIO\n${portfolioContext}` },
          { role: 'user', content: msg }
        ]
      })
    });

    const aiResponse = await response.json();
    let reply = aiResponse.choices?.[0]?.message?.content || 'Maaf ada kendala teknis.';

    if (transactionLog) {
      reply += `\n\n✅ Log: ${transactionLog}`;
    }

    // Send reply via WAHA
    if (env.WAHA_URL) {
      await fetch(`${env.WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: sender,
          text: reply,
          session: 'default'
        })
      });
    }
  }

  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// ============ HELPER FUNCTIONS ============

async function detectAndLogTransaction(env, message) {
  const msg = message.toUpperCase();
  
  // Pattern: "beli X lot TICKER di PRICE" or "TICKER PRICE X lot"
  const buyPatterns = [
    /BELI\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@)\s*(\d+)/i,
    /(\w+)\s+(\d+)\s+(\d+)\s*LOT/i,
    /ANTRI\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@)\s*(\d+)/i
  ];

  for (const pattern of buyPatterns) {
    const match = message.match(pattern);
    if (match) {
      let lots, ticker, price;
      
      if (pattern.source.startsWith('BELI') || pattern.source.startsWith('ANTRI')) {
        [, lots, ticker, price] = match;
      } else {
        [, ticker, price, lots] = match;
      }

      await env.DB.prepare(`
        INSERT INTO transactions (ticker, action, lots, price, status)
        VALUES (?, 'BUY', ?, ?, 'OPEN')
      `).bind(ticker.toUpperCase(), parseInt(lots), parseInt(price)).run();

      return `Antrean ${lots} lot ${ticker.toUpperCase()} di ${price} sudah dicatat, Kak.`;
    }
  }

  // Pattern: "jual X lot TICKER di PRICE"
  const sellPattern = /JUAL\s+(\d+)\s*LOT\s+(\w+)\s+(?:DI|@)\s*(\d+)/i;
  const sellMatch = message.match(sellPattern);
  if (sellMatch) {
    const [, lots, ticker, price] = sellMatch;
    await env.DB.prepare(`
      INSERT INTO transactions (ticker, action, lots, price, status)
      VALUES (?, 'SELL', ?, ?, 'OPEN')
    `).bind(ticker.toUpperCase(), parseInt(lots), parseInt(price)).run();

    return `Antrean jual ${lots} lot ${ticker.toUpperCase()} di ${price} sudah dicatat, Kak.`;
  }

  // Pattern: "beli emas X gram" or "bought Xgr gold"
  const goldPattern = /(?:BELI|BOUGHT)\s+(?:EMAS|GOLD)\s+(\d+(?:\.\d+)?)\s*(?:GR|GRAM)?/i;
  const goldMatch = message.match(goldPattern);
  if (goldMatch) {
    const [, grams] = goldMatch;
    
    // Update gold portfolio
    const existing = await env.DB.prepare(`
      SELECT quantity FROM portfolio_status WHERE asset_name = 'Emas'
    `).first();

    const newQty = (existing?.quantity || 0) + parseFloat(grams);
    
    await env.DB.prepare(`
      UPDATE portfolio_status SET quantity = ?, last_updated = datetime('now')
      WHERE asset_name = 'Emas'
    `).bind(newQty).run();

    return `Emas +${grams}gr sudah dicatat. Total sekarang: ${newQty.toFixed(2)}gr, Kak.`;
  }

  return null;
}

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
