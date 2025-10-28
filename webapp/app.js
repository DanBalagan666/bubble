// Simple frontend for Bubble Coffee mini-app (prototype)
const catalogEl = document.getElementById('catalog');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout');

// sample catalog (editable)
const catalog = [
  { id: 'c1', title: 'Bubble Latte', price: 310, meta: '300 мл', img: 'https://eda.yandex/images/16489290/aa41b0d9735e48a9aca50edf063f3d81-216x188.jpeg' },
  { id: 'c2', title: 'Cold Brew Citrus', price: 290, meta: '350 мл', img: 'https://eda.yandex/images/16066946/f8c2a247d7314e66a1b807949c56ab41-216x188.jpeg' },
  { id: 'c3', title: 'Matcha Dream', price: 350, meta: '300 мл', img: 'https://eda.yandex/images/18208126/58e05b82617a41f3bb3fd2ebd2174ec4-216x188.jpeg' },
  { id: 'c4', title: 'Raf Caramel', price: 330, meta: '300 мл', img: 'https://eda.yandex/images/16454428/c3f9b91c22a649ae8f1a77412d1989ac-216x188.jpeg' },
];

// cart state
let cart = [];

function renderCatalog(){
  catalogEl.innerHTML = '';
  catalog.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="imgwrap"><img src="${item.img}" alt="${item.title}"></div>
      <div class="price">${item.price} ₽</div>
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="meta">${escapeHtml(item.meta)}</div>
      <div class="actions">
        <button class="btn ghost" data-id="${item.id}">Подробнее</button>
        <button class="btn primary" data-add="${item.id}">Добавить</button>
      </div>
    `;
    catalogEl.appendChild(card);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function addToCart(id){
  const item = catalog.find(i=>i.id===id);
  if(!item) return;
  const row = cart.find(c=>c.id===id);
  if(row) row.qty++;
  else cart.push({ ...item, qty:1 });
  applyPromo();
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(c=>c.id!==id);
  applyPromo();
  renderCart();
}

function changeQty(id, delta){
  const row = cart.find(c=>c.id===id);
  if(!row) return;
  row.qty = Math.max(0, row.qty + delta);
  if(row.qty===0) removeFromCart(id);
  applyPromo();
  renderCart();
}

// Promo: 7th drink free — we calculate free item as cheapest unit when total items >=7
function applyPromo(){
  const totalCount = cart.reduce((s,c)=>s+c.qty,0);
  cart.forEach(c=>c._promoFree = 0);
  if(totalCount >= 7){
    const units = [];
    cart.forEach(c=>{
      for(let i=0;i<c.qty;i++) units.push({ id:c.id, price:c.price });
    });
    units.sort((a,b)=>a.price - b.price);
    const freeUnit = units[0];
    const target = cart.find(c=>c.id === freeUnit.id);
    if(target) target._promoFree = 1;
  }
}

function calcTotal(){
  let total = 0;
  cart.forEach(c=>{
    const subtotal = c.price * c.qty - (c._promoFree ? c.price : 0);
    total += subtotal;
  });
  return total;
}

function renderCart(){
  cartItemsEl.innerHTML = '';
  if(cart.length===0){
    cartItemsEl.innerHTML = '<div class="small">Корзина пуста</div>';
    cartTotalEl.textContent = '0';
    return;
  }
  cart.forEach(c=>{
    const div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(c.title)}</div>
        <div class="small">${c.meta} ${c._promoFree?'<span style="color:#ffd166"> • 7-й бесплатно</span>':''}</div>
      </div>
      <div style="text-align:right">
        <div class="qty">
          <button class="btn ghost" data-dec="${c.id}">−</button>
          <div style="min-width:26px;text-align:center">${c.qty}</div>
          <button class="btn ghost" data-inc="${c.id}">+</button>
        </div>
        <div style="margin-top:6px">${ (c.price * c.qty - (c._promoFree?c.price:0)) } ₽</div>
        <div style="margin-top:6px"><button class="btn ghost" data-remove="${c.id}">Удалить</button></div>
      </div>
    `;
    cartItemsEl.appendChild(div);
  });
  cartTotalEl.textContent = calcTotal();
}

document.addEventListener('click', (e)=>{
  const add = e.target.closest('[data-add]');
  if(add) { addToCart(add.getAttribute('data-add')); return; }
  const inc = e.target.closest('[data-inc]');
  if(inc){ changeQty(inc.getAttribute('data-inc'), +1); return; }
  const dec = e.target.closest('[data-dec]');
  if(dec){ changeQty(dec.getAttribute('data-dec'), -1); return; }
  const rem = e.target.closest('[data-remove]');
  if(rem){ removeFromCart(rem.getAttribute('data-remove')); return; }
  const detail = e.target.closest('[data-id]');
  if(detail){ alert('Здесь можно показать подробности напитка — позже.'); return; }
});

checkoutBtn.addEventListener('click', async ()=>{
  if(cart.length===0){ alert('Корзина пуста'); return; }
  const name = prompt('Ваше имя:') || '';
  const phone = prompt('Телефон:') || '';
  const address = prompt('Адрес (если нужна доставка):') || '';
  const comment = prompt('Комментарий к заказу:') || '';
  const body = {
    items: cart.map(c=>({ id:c.id, title:c.title, price:c.price, qty:c.qty })),
    name, phone, address, comment,
    total: calcTotal(),
    payment: 'test'
  };
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Отправка...';
  try{
    const r = await fetch('/api/order', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const js = await r.json();
    if(js.ok){
      alert('Заказ отправлен! Номер: ' + js.orderId + '\nСпасибо — мы свяжемся с вами.');
      cart = [];
      renderCart();
    }else{
      alert('Ошибка: ' + (js.error||'unknown'));
    }
  }catch(err){
    alert('Ошибка сети: ' + err.message);
  }finally{
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Оплатить (тест)';
  }
});

renderCatalog();
renderCart();
