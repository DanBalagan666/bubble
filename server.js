const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST_URL = process.env.HOST_URL || ('http://localhost:' + PORT);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// simple API: catalog & orders stored in-memory (and orders saved to disk)
const CATALOG_PATH = path.join(__dirname, 'data', 'catalog.json');
const ORDERS_PATH = path.join(__dirname, 'data', 'orders.json');

function readJSON(p){ return JSON.parse(fs.readFileSync(p)); }
function writeJSON(p, data){ fs.writeFileSync(p, JSON.stringify(data, null, 2)); }

app.get('/api/catalog', (req, res) => {
  res.json(readJSON(CATALOG_PATH));
});

// create order (from bot or web app)
app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const orders = fs.existsSync(ORDERS_PATH) ? readJSON(ORDERS_PATH) : [];
  const id = 'ord_' + Date.now();
  const order = { id, createdAt: new Date().toISOString(), items: body.items || [], total: body.total || 0, status: 'pending', meta: body.meta || {} };
  orders.push(order);
  writeJSON(ORDERS_PATH, orders);
  // return simple payment link (simulated)
  order.payUrl = HOST_URL + '/pay/' + id;
  res.json(order);
});

// mark order paid (simulated webhook)
app.post('/api/orders/:id/mark-paid', (req, res) => {
  const id = req.params.id;
  const orders = fs.existsSync(ORDERS_PATH) ? readJSON(ORDERS_PATH) : [];
  const idx = orders.findIndex(o => o.id === id);
  if(idx === -1) return res.status(404).json({error: 'Order not found'});
  orders[idx].status = 'paid';
  writeJSON(ORDERS_PATH, orders);
  // here you could call Telegram API to notify user (bot should poll server or have webhook)
  res.json({ok:true, order: orders[idx]});
});

// simple page to simulate payment
app.get('/pay/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const orders = fs.existsSync(ORDERS_PATH) ? readJSON(ORDERS_PATH) : [];
  const order = orders.find(o => o.id === orderId);
  if(!order) return res.status(404).send('Order not found');
  res.send(`
    <html>
    <head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Оплата заказа ${orderId}</title></head>
    <body style="font-family:sans-serif;padding:24px;background:#0b0b0e;color:#fff">
      <h2>Оплатить заказ ${orderId}</h2>
      <p>Сумма: ${order.total} ₽</p>
      <form method="POST" action="/api/orders/${orderId}/mark-paid">
        <button style="padding:12px 18px;border-radius:8px;background:#ff33cc;border:none;color:#000;font-weight:700">Оплатить (симуляция)</button>
      </form>
    </body>
    </html>
  `);
});

app.listen(PORT, ()=> console.log('Server listening on', PORT));