// app.js — клиентская логика (обновлённая)
(() => {
  const API_BASE = window.API_BASE || ''; // если на том же хосте, оставить ''
  const API_KEY = window.API_KEY || 'some-secret-api-key'; // заменишь в HTML серверной переменной или inline

  const catalogEl = document.getElementById('catalog');
  const cartSummary = document.getElementById('cartSummary');
  const openCartBtn = document.getElementById('openCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const payFake = document.getElementById('payFake');
  const resultToast = document.getElementById('resultToast');

  // sample drinks (you may fetch from drinks.json or server)
  const drinks = window.DRINKS || [
    { id:'latte_explosion', title:'Латте — Взрывная карамель', price:310, ml:'300 мл', img:'https://eda.yandex/images/16489290/aa41b0d9735e48a9aca50edf063f3d81-216x188.jpeg', desc:'Эспрессо и карамель.' },
    { id:'tea_passion', title:'Чай — Ананас-маракуйя', price:290, ml:'300 мл', img:'https://eda.yandex/images/16066946/f8c2a247d7314e66a1b807949c56ab41-216x188.jpeg', desc:'Экзотический чай с маракуйей.' },
    { id:'bubble_salted', title:'Баблти — Солёная карамель', price:350, ml:'300 мл', img:'https://eda.yandex/images/18208126/58e05b82617a41f3bb3fd2ebd2174ec4-216x188.jpeg', desc:'Вкусно и нежно.' },
    { id:'rasp_pie', title:'Баблти — Малиновый пирог', price:350, ml:'300 мл', img:'https://eda.yandex/images/16454428/c3f9b91c22a649ae8f1a77412d1989ac-216x188.jpeg', desc:'Ягодная нежность.' }
  ];

  const cart = {}; // {id: qty}
  const itemNotes = {}; // optional per-item comment if needed

  const format = n => `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g," ")} ₽`;

  function renderCatalog(){
    catalogEl.innerHTML = '';
    drinks.forEach(d => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <div class="imgwrap"><img src="${d.img}" alt="${escapeHtml(d.title)}"></div>
        <div class="price-badge">${d.price} ₽</div>
        <div class="body">
          <div class="title">${escapeHtml(d.title)}</div>
          <div class="meta">${escapeHtml(d.ml)}</div>
          <div class="desc">${escapeHtml(d.desc)}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:auto">
            <div style="display:flex;gap:6px;align-items:center">
              <button class="qty-btn" data-act="dec" data-id="${d.id}">−</button>
              <div class="qty" id="qty-${d.id}">${cart[d.id] || 0}</div>
              <button class="qty-btn" data-act="inc" data-id="${d.id}">+</button>
            </div>
            <button class="btn-add small" data-id="${d.id}">Добавить</button>
          </div>
        </div>
      `;
      catalogEl.appendChild(el);
    });

    // attach listeners
    document.querySelectorAll('.qty-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = b.dataset.id;
        const act = b.dataset.act;
        if (act === 'inc') { cart[id] = (cart[id] || 0) + 1; }
        else { cart[id] = Math.max(0, (cart[id] || 0) - 1); if (cart[id] === 0) delete cart[id]; }
        updateQtyDisplays();
        refreshCartUI();
      });
    });

    document.querySelectorAll('.btn-add').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = b.dataset.id;
        cart[id] = (cart[id] || 0) + 1;
        updateQtyDisplays();
        refreshCartUI();
        showToast('Добавлено в корзину');
      });
    });
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function updateQtyDisplays(){
    Object.keys(cart).forEach(id => {
      const el = document.getElementById(`qty-${id}`);
      if(el) el.textContent = cart[id];
    });
    // zeroed items
    drinks.forEach(d => {
      if(!cart[d.id]) {
        const el = document.getElementById(`qty-${d.id}`);
        if(el) el.textContent = 0;
      }
    });
  }

  function refreshCartUI(){
    const keys = Object.keys(cart);
    if(keys.length === 0){
      cartSummary.textContent = 'Корзина пуста';
      checkoutBtn.disabled = true;
      return;
    }
    let total = 0, count = 0;
    keys.forEach(k => {
      const it = drinks.find(d => d.id === k);
      if(it) { total += it.price * cart[k]; count += cart[k]; }
    });
    cartSummary.textContent = `В корзине: ${count} шт • ${format(total)}`;
    checkoutBtn.disabled = false;
  }

  function openCart(){
    // render modal cart items
    cartModal.setAttribute('aria-hidden','false');
    renderCartItems();
  }
  function closeCartModal(){
    cartModal.setAttribute('aria-hidden','true');
  }

  function renderCartItems(){
    cartItemsEl.innerHTML = '';
    let total = 0;
    Object.keys(cart).forEach(k => {
      const it = drinks.find(d => d.id === k);
      if(!it) return;
      const qty = cart[k];
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <img src="${it.img}" alt="${escapeHtml(it.title)}" />
        <div style="flex:1">
          <div class="c-title">${escapeHtml(it.title)}</div>
          <div class="c-meta">${it.ml} • ${format(it.price)}</div>
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center">
            <button class="qty-btn" data-act="dec" data-id="${k}">−</button>
            <div style="min-width:28px;text-align:center">${qty}</div>
            <button class="qty-btn" data-act="inc" data-id="${k}">+</button>
          </div>
        </div>
      `;
      cartItemsEl.appendChild(row);
      total += it.price * qty;
    });
    cartTotalEl.textContent = format(total);

    // attach qty handlers inside modal
    cartItemsEl.querySelectorAll('.qty-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id, act = b.dataset.act;
        if(act === 'inc') cart[id] = (cart[id]||0)+1;
        else { cart[id] = (cart[id]||0)-1; if(cart[id] <= 0) delete cart[id]; }
        renderCartItems();
        updateQtyDisplays();
        refreshCartUI();
      });
    });

    // below the list, show form fields for customer
    const formWrapper = document.createElement('div');
    formWrapper.style.marginTop = '12px';
    formWrapper.innerHTML = `
      <label style="font-weight:700">Имя</label>
      <input id="custName" type="text" placeholder="Ваше имя" style="width:100%;padding:8px;margin:6px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:#fff" />
      <label style="font-weight:700">Телефон</label>
      <input id="custPhone" type="tel" placeholder="+7..." style="width:100%;padding:8px;margin:6px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:#fff" />
      <label style="font-weight:700">Адрес</label>
      <input id="custAddress" placeholder="Улица, дом, подъезд" style="width:100%;padding:8px;margin:6px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:#fff" />
      <label style="font-weight:700">Комментарий</label>
      <textarea id="custComment" placeholder="Без сахара / без льда / и т.д." style="width:100%;padding:8px;margin:6px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:#fff"></textarea>
    `;
    cartItemsEl.appendChild(formWrapper);

    // attach pay button handler (inside modal)
    // reuse payFake button
  }

  // payment flow: post order to server
  async function submitOrderAndPay(){
    // collect customer
    const name = document.getElementById('custName')?.value || '';
    const phone = document.getElementById('custPhone')?.value || '';
    const address = document.getElementById('custAddress')?.value || '';
    const comment = document.getElementById('custComment')?.value || '';

    const items = Object.keys(cart).map(k=>{
      const it = drinks.find(d => d.id === k);
      return { id: it.id, title: it.title, price: it.price, qty: cart[k] };
    });
    const total = items.reduce((s,i)=>s + i.price*i.qty, 0);

    if(items.length === 0) { showToast('Корзина пуста'); return; }
    if(!phone) { showToast('Пожалуйста, укажите телефон'); return; }

    const payload = { items, total, customer: { name, phone, address, comment }, source: 'webapp', paid: false };

    // call server to create order
    try {
      const resp = await fetch(`${API_BASE}/api/order`, {
        method: 'POST',
        headers: {
          'content-type':'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!data.ok) {
        showToast('Ошибка: '+(data.error || 'server error'));
        return;
      }
      const orderId = data.orderId;
      // simulate payment -> call /api/order/pay (server will mark paid=true and notify)
      const payResp = await fetch(`${API_BASE}/api/order/pay`, {
        method: 'POST',
        headers: { 'content-type':'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ orderId, method:'fake_card' })
      });
      const payData = await payResp.json();
      if (!payData.ok) { showToast('Ошибка оплаты: '+(payData.error||'')); return; }

      showToast('Оплата успешна — заказ оформлен');
      // clear cart
      for(const k in cart) delete cart[k];
      updateQtyDisplays();
      refreshCartUI();
      closeCartModal();
    } catch(err){
      console.error(err);
      showToast('Ошибка сети — повторите позже');
    }
  }

  // small toast helper
  let toastTimer = null;
  function showToast(t, d=2000){
    resultToast.textContent = t;
    resultToast.classList.add('show');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> resultToast.classList.remove('show'), d);
  }

  // attach main handlers
  openCartBtn.addEventListener('click', openCart);
  closeCart && closeCart.addEventListener('click', closeCartModal);
  checkoutBtn.addEventListener('click', openCart);
  payFake.addEventListener('click', () => {
    // in modal, collect and send
    submitOrderAndPay();
  });

  // initial render
  renderCatalog();
  refreshCartUI();
})();
