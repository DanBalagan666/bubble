const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { nanoid } = require('nanoid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'webapp')));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
if(!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

function saveOrder(order){
  const arr = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
  arr.unshift(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(arr, null, 2));
}

async function notifyTelegram(order){
  if(!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  try{
    const text = [
      `🆕 Новый заказ — #${order.id}`,
      `Имя: ${order.name || '—'}`,
      `Тел: ${order.phone || '—'}`,
      `Сумма: ${order.total} ₽`,
      `Оплата: ${order.payment}`,
      `Комментарий: ${order.comment || '—'}`,
      `Состав:`,
      ...order.items.map(i=>`• ${i.title} ×${i.qty} — ${i.price}₽`)
    ].join('\n');
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text })
    });
  }catch(err){
    console.error('Telegram notify failed', err.message);
  }
}

app.post('/api/order', async (req,res)=>{
  try{
    const payload = req.body || {};
    if(!payload.items || !Array.isArray(payload.items) || payload.items.length===0){
      return res.status(400).json({ ok:false, error:'empty_items' });
    }
    const id = nanoid(8);
    const order = {
      id,
      created_at: new Date().toISOString(),
      items: payload.items,
      name: payload.name || '',
      phone: payload.phone || '',
      address: payload.address || '',
      comment: payload.comment || '',
      total: payload.total || 0,
      payment: payload.payment || 'test',
    };
    saveOrder(order);
    notifyTelegram(order).catch(()=>{});
    return res.json({ ok:true, orderId: id });
  }catch(e){
    console.error(e);
    return res.status(500).json({ ok:false, error:'server_error' });
  }
});

app.get('/admin/orders', (req,res)=>{
  const key = req.query.key || req.headers['x-admin-key'];
  if(!key || key !== ADMIN_CHAT_ID){
    return res.status(401).json({ ok:false, error:'unauthorized' });
  }
  const arr = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
  res.json({ ok:true, orders: arr });
});

app.get('/admin', (req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'webapp', 'admin.html'));
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
