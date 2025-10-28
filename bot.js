// Simple Telegram bot (polling) — shows menu, creates orders and sends payment link.
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');
const CATALOG = JSON.parse(fs.readFileSync('./data/catalog.json'));

const token = process.env.BOT_TOKEN || '';
if(!token){ console.error('BOT_TOKEN is empty. Set BOT_TOKEN env var.'); process.exit(1); }

const bot = new TelegramBot(token, { polling: true });
console.log('Bot started (polling)');

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, 'Привет! Это BUBBLE Coffee. Выберите команду:\n/menu — показать меню');
});

bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;
  // send inline keyboard with first 8 items
  const items = CATALOG.items.slice(0, 8);
  for(const it of items){
    await bot.sendPhoto(chatId, it.image || '', { caption: `${it.name}\n${it.price} ₽ — ${it.size || ''}`, reply_markup: { inline_keyboard: [[{text: 'Заказать', callback_data: 'order:'+it.id}]] }});
  }
});

bot.on('callback_query', async (q) => {
  const data = q.data;
  const chatId = q.message.chat.id;
  if(!data) return;
  if(data.startsWith('order:')){
    const id = data.split(':')[1];
    const item = CATALOG.items.find(x => x.id === id);
    if(!item) return bot.answerCallbackQuery(q.id, {text:'Товар не найден'});
    // create order on the server
    const res = await fetch((process.env.HOST_URL || 'http://localhost:3000') + '/api/orders', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: [item], total: item.price, meta:{ chatId }})
    });
    const order = await res.json();
    const text = `Заказ создан: ${order.id}\nСумма: ${order.total} ₽\nОплатить: ${order.payUrl}`;
    await bot.sendMessage(chatId, text);
    await bot.answerCallbackQuery(q.id, {text: 'Заказ создан — отправил ссылку на оплату'});
  }
});

bot.on('message', (msg) => {
  // simple helpers
  if(msg.text && msg.text.toLowerCase().includes('menu')) bot.emit('text', '/menu', msg);
});