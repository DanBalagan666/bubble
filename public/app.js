
async function loadCatalog(){
  const res = await fetch('/api/catalog');
  const data = await res.json();
  const root = document.getElementById('catalog');
  root.innerHTML = '';
  data.items.forEach(it=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${it.image}" alt="${it.name}">
      <div class="title">${it.name}</div>
      <div class="meta">${it.size} — <span class="price">${it.price} ₽</span></div>
      <div class="actions">
        <button class="btn order-btn" data-id="${it.id}">Заказать</button>
        <a class="btn" href="/pay/manual-${it.id}" style="background:#fff;color:#000">Оплата</a>
      </div>
    `;
    root.appendChild(div);
  });
  document.querySelectorAll('.order-btn').forEach(btn=> btn.addEventListener('click', onOrder));
}
async function onOrder(e){
  const id = e.currentTarget.dataset.id;
  // fetch item details
  const catalog = await (await fetch('/api/catalog')).json();
  const item = catalog.items.find(x=>x.id===id);
  const payload = { items:[item], total:item.price };
  const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
  const order = await res.json();
  alert('Заказ создан. Откроется страница оплаты.');
  window.open(order.payUrl, '_blank');
}
loadCatalog();
