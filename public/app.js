// app.js
(async function(){
  const catalogEl = document.getElementById('catalog');
  const cartBar = document.getElementById('cartBar');
  const cartSummary = document.getElementById('cartSummary');
  const openCartBtn = document.getElementById('openCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const payFake = document.getElementById('payFake');
  const resultToast = document.getElementById('resultToast');

  // load drinks
  let drinks = [];
  try {
    const res = await fetch('drinks.json');
    drinks = await res.json();
  } catch (e) {
    console.error('Не удалось загрузить drinks.json', e);
    drinks = [];
  }

  // simple cart
  const cart = {};

  // helper currency
  const format = (n) => `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;

  function renderCatalog(){
    catalogEl.innerHTML = '';
    drinks.forEach(d => {
      const li = document.createElement('div');
      li.className = 'card';
      li.innerHTML = `
        <div class="imgwrap"><img src="${d.img}" alt="${escapeHtml(d.title)}"></div>
        <div class="price-badge">${d.price} ₽</div>
        <div class="body">
          <div class="title">${escapeHtml(d.title)}</div>
          <div class="meta">${escapeHtml(d.ml)}</div>
          <div class="desc">${escapeHtml(d.desc)}</div>
          <div class="actions">
            <button class="btn-add" data-id="${d.id}">Добавить</button>
          </div>
        </div>
      `;
      catalogEl.appendChild(li);
    });
    // attach add handlers
    document.querySelectorAll('.btn-add').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = b.dataset.id;
        addToCart(id);
        e.stopPropagation();
      });
    });
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function addToCart(id){
    const item = drinks.find(x=>x.id===id);
    if(!item) return;
    cart[id] = cart[id] ? cart[id]+1 : 1;
    refreshCartUI();
    showToast(`Добавлено: ${item.title}`);
  }

  function refreshCartUI(){
    const keys = Object.keys(cart);
    if(keys.length === 0){
      cartSummary.textContent = 'Корзина пуста';
      checkoutBtn.disabled = true;
      return;
    }
    let total = 0;
    let totalCount = 0;
    keys.forEach(k=>{
      const qty = cart[k];
      const item = drinks.find(d=>d.id===k);
      if(item){
        total += item.price * qty;
        totalCount += qty;
      }
    });
    cartSummary.textContent = `В корзине: ${totalCount} шт • ${format(total)}`;
    checkoutBtn.disabled = false;
  }

  openCartBtn.addEventListener('click', ()=> {
    openCart();
  });
  closeCart && closeCart.addEventListener('click', ()=> { closeCartModal(); });

  function openCart(){
    cartModal.setAttribute('aria-hidden','false');
    renderCartItems();
  }
  function closeCartModal(){
    cartModal.setAttribute('aria-hidden','true');
  }

  function renderCartItems(){
    cartItemsEl.innerHTML = '';
    let total = 0;
    Object.keys(cart).forEach(k=>{
      const qty = cart[k];
      if(qty<=0) return;
      const item = drinks.find(d=>d.id===k);
      if(!item) return;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${item.img}" alt="${escapeHtml(item.title)}" />
        <div style="flex:1">
          <div class="c-title">${escapeHtml(item.title)}</div>
          <div class="c-meta">${item.ml} • ${format(item.price)}</div>
        </div>
        <div class="cart-qty">
          <button class="qty-btn" data-act="dec" data-id="${k}">−</button>
          <div>${qty}</div>
          <button class="qty-btn" data-act="inc" data-id="${k}">+</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
      total += item.price * qty;
    });
    cartTotalEl.textContent = format(total);
    // attach qty handlers
    cartItemsEl.querySelectorAll('.qty-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        const id = b.dataset.id, act = b.dataset.act;
        if(act==='inc') cart[id] = (cart[id]||0)+1;
        else { cart[id] = (cart[id]||0)-1; if(cart[id] <= 0) delete cart[id]; }
        renderCartItems();
        refreshCartUI();
      });
    });
  }

  // fake payment flow
  function fakePaymentProcess(){
    // show "processing"
    showToast('Идёт оплата — тестовая транзакция...');
    // emulate network
    setTimeout(()=> {
      const order = buildOrder();
      showToast('Оплата успешна ✅');
      // send data to bot if inside Telegram WebApp
      if(window.Telegram && Telegram.WebApp && Telegram.WebApp.sendData){
        try {
          Telegram.WebApp.sendData(JSON.stringify(order));
          showToast('Данные отправлены боту через Telegram Web App');
        } catch(e){
          console.warn(e);
        }
      } else {
        // fallback: show order JSON to copy
        showFallbackOrder(order);
      }
      // clear cart
      for(const k of Object.keys(cart)) delete cart[k];
      refreshCartUI();
      closeCartModal();
    }, 1200);
  }

  function buildOrder(){
    const items = [];
    let total = 0;
    Object.keys(cart).forEach(k=>{
      const qty = cart[k];
      if(qty<=0) return;
      const item = drinks.find(d=>d.id===k);
      if(!item) return;
      items.push({id:item.id,title:item.title, price:item.price, qty});
      total += item.price * qty;
    });
    return {
      created: new Date().toISOString(),
      source: (window.Telegram && Telegram.WebApp) ? 'telegram-webapp' : 'web-browser',
      items, total
    };
  }

  function showFallbackOrder(order){
    // show order JSON and "copy" button
    const txt = JSON.stringify(order, null, 2);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('aria-hidden','false');
    modal.innerHTML = `
      <div class="modal-inner">
        <button class="close" id="closeFallback">×</button>
        <h3>Заказ (скопируй и отправь боту)</h3>
        <pre style="background:#0b0b0d;padding:12px;border-radius:8px;color:#fff;max-height:40vh;overflow:auto">${escapeHtml(txt)}</pre>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button id="copyOrder" class="btn btn-primary">Копировать</button>
          <a id="openChat" class="btn btn-outline" target="_blank" rel="noopener">Открыть чат с ботом</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('openChat').href = 'https://t.me/Bubble_Boffee_Debot';
    document.getElementById('copyOrder').addEventListener('click', async ()=>{
      try {
        await navigator.clipboard.writeText(txt);
        showToast('Скопировано в буфер обмена');
      } catch(e){
        showToast('Не удалось скопировать — вручную выдели и скопируй');
      }
    });
    document.getElementById('closeFallback').addEventListener('click', ()=> modal.remove());
  }

  // small toast
  let toastTimer = null;
  function showToast(text, duration=1800){
    resultToast.textContent = text;
    resultToast.classList.add('show');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> resultToast.classList.remove('show'), duration);
  }

  // handlers
  checkoutBtn.addEventListener('click', ()=> {
    openCart();
  });
  payFake.addEventListener('click', ()=> {
    fakePaymentProcess();
  });

  // initial render
  renderCatalog();
  refreshCartUI();

  // small improvement: if inside Telegram WebApp, call Telegram.WebApp.ready() and adjust header
  if(window.Telegram && Telegram.WebApp){
    try {
      Telegram.WebApp.ready();
      // optional: set color theme
      Telegram.WebApp.setBackgroundColor('#0b0b0e');
    } catch(e){ console.warn(e); }
  }
})();
