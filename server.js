// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs-extra');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;
const API_KEY = process.env.API_KEY || 'dev-key';

// safety checks
if (!BOT_TOKEN) console.warn('WARNING: BOT_TOKEN not set in env — Telegram messages will fail');
if (!OWNER_CHAT_ID) console.warn('WARNING: OWNER_CHAT_ID not set — Telegram messages will fail');

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json({ limit: '200kb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// serve static frontend from public/
app.use('/', express.static(path.join(__dirname, 'public')));

// helper: persist orders to orders.json
const ORDERS_FILE = path.join(__dirname, 'orders.json');
async function appendOrder(order){
  try {
    let arr = [];
    if (await fs.pathExists(ORDERS_FILE)) arr = await fs.readJson(ORDERS_FILE);
    arr.push(order);
    await fs.writeJson(ORDERS_FILE, arr, { spaces: 2 });
  } catch(err){
    console.error('Failed to save order:', err);
  }
}

// middleware: API key check for endpoints that change state
function requireApiKey(req, res, next){
  const key = req.header('x-api-key') || req.query.api_key;
  if(!API_KEY || key !== API_KEY){
    return res.status(401).json({ ok:false, error:'Invalid API key' });
  }
  next();
}

/**
 * POST /api/order
 * body: { items: [{id, title, price, qty}], total, customer: {name, phone, address, comment}, source }
 */
app.post('/api/order', requireApiKey, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ ok:false, error:'Empty order' });
    }

    const order = {
      id: 'ord_' + Date.now(),
      created_at: new Date().toISOString(),
      items: payload.items,
      total: payload.total,
      customer: payload.customer || {},
      source: payload.source || 'web',
      paid: !!payload.paid
    };

    // persist
    await appendOrder(order);

    // send Telegram message to OWNER_CHAT_ID
    if (BOT_TOKEN && OWNER_CHAT_ID) {
      const summaryLines = order.items.map(it => `${it.qty}× ${it.title} — ${it.price} ₽`).join('\n');
      const text =
        `🟣 *Новый заказ* — ${order.id}\n` +
        `*Сумма:* ${order.total} ₽\n` +
        `*Позиции:*\n${summaryLines}\n\n` +
        `*Имя:* ${order.customer.name || '—'}\n` +
        `*Тел:* ${order.customer.phone || '—'}\n` +
        `*Адрес:* ${order.customer.address || '—'}\n` +
        `*Комментарий:* ${order.customer.comment || '—'}\n` +
        `*Оплачен:* ${order.paid ? 'Да' : 'Нет'}\n` +
        `*Время:* ${order.created_at}`;

      const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      try {
        await axios.post(tgUrl, {
          chat_id: OWNER_CHAT_ID,
          parse_mode: 'Markdown',
          text
        }, { timeout: 5000 });
      } catch(err){
        console.error('Telegram send error:', err?.response?.data || err.message);
      }
    }

    return res.json({ ok:true, orderId: order.id });
  } catch(err){
    console.error(err);
    res.status(500).json({ ok:false, error:'server error' });
  }
});

/**
 * POST /api/order/pay
 * body: { orderId, method }  - pretend payment confirmation (for demo)
 * protected by API key
 */
app.post('/api/order/pay', requireApiKey, async (req, res) => {
  try {
    const { orderId, method='fake' } = req.body;
    if(!orderId) return res.status(400).json({ ok:false, error:'orderId required' });

    // load orders and mark paid
    let orders = [];
    if (await fs.pathExists(ORDERS_FILE)) orders = await fs.readJson(ORDERS_FILE);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return res.status(404).json({ ok:false, error:'order not found' });

    orders[idx].paid = true;
    orders[idx].paid_at = new Date().toISOString();
    orders[idx].payment_method = method;
    await fs.writeJson(ORDERS_FILE, orders, { spaces: 2 });

    // notify owner
    if (BOT_TOKEN && OWNER_CHAT_ID) {
      const text = `✅ *Оплата получена* — ${orderId}\nСумма: ${orders[idx].total} ₽\nМетод: ${method}`;
      const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      try {
        await axios.post(tgUrl, {
          chat_id: OWNER_CHAT_ID,
          parse_mode: 'Markdown',
          text
        });
      } catch(e){
        console.error('Telegram pay notify error:', e?.response?.data || e.message);
      }
    }

    res.json({ ok:true });
  } catch(err){
    console.error(err);
    res.status(500).json({ ok:false, error:'server error' });
  }
});

// simple health
app.get('/api/health', (req,res) => res.json({ ok:true, time: new Date().toISOString() }));

// start
app.listen(PORT, ()=> {
  console.log(`Server started on port ${PORT}`);
});
