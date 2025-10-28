# BUBBLE Coffee — Telegram Mini App (Demo)

This repository is a simple skeleton for a Telegram Mini App + Telegram Bot that demonstrates a menu, ordering flow and a simulated payment.

IMPORTANT: **This demo does NOT include a real payment provider by default.** It includes a simulated 'Pay' flow so you can test the overall UX. See "Payments" section below for instructions how to integrate real Telegram Payments / Stripe or other providers.

## What is included
- `server.js` — Express web server that serves the mini-app and API endpoints.
- `bot.js` — Telegram bot (polling) that shows the menu and creates orders. Replace token in `.env` or pass via environment variable.
- `public/` — Frontend (HTML/CSS/JS) — the mini-app. You can open it in a browser or use via Telegram Web App (setup required).
- `data/catalog.json` — Menu catalog. Edit to add/remove drinks.
- `README.md` — this file.

## Quick start (local)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` file next to project root with:
   ```env
   BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
   HOST_URL=http://localhost:3000
   ```
   If you want to run the bot locally with polling, just set BOT_TOKEN.
3. Start server:
   ```bash
   npm start
   ```
4. In another terminal start the bot (polling):
   ```bash
   npm run bot
   ```
5. Open `http://localhost:3000` to see the mini-app.

## How the demo order/payment works
- The bot sends a "menu" and the user can choose a product by button. The bot creates an "order" and sends a simulated payment link (to the mini-app endpoint `/pay/:orderId`).
- The `/pay/:orderId` page shows an example "Pay" button that simulates payment and notifies the bot via an API endpoint.

## Integrating real payments
To accept real payments via Telegram you must implement Telegram Payments (set up a payments provider with Telegram and use the proper invoice flow),
or integrate Stripe (server-side) and mark orders as paid after successful webhook.

## Deploying to Render / Heroku
- Set `BOT_TOKEN` environment variable in your service settings.
- Start the server (`npm start`) and the bot (`npm run bot`) — you can run both with a single process manager or two separate services.

## Notes & next steps
- The catalog is in `data/catalog.json` — edit prices, names, images.
- Replace the simulated payment flow with real provider webhooks for production.

Enjoy — you can modify styles and copy the neon look from your site into `public/styles.css`.