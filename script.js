/* =========================================================
   FAYRA HERBS — site interactions
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- mobile nav ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  /* ---------- ingredient data ---------- */
  const ingredients = [
    { name: 'Amla', glyph: 'Am', desc: 'Vitamin-C rich gooseberry that strengthens roots and slows premature greying.' },
    { name: 'Bhringraj', glyph: 'Bh', desc: 'Known in Ayurveda as the "king of hair" for its follicle-stimulating properties.' },
    { name: 'Hibiscus', glyph: 'Hb', desc: 'Softens strands and adds density-boosting nutrients to thinning areas.' },
    { name: 'Aloe Vera', glyph: 'Av', desc: 'Soothes an irritated scalp and balances excess oil production.' },
    { name: 'Curry Leaves', glyph: 'Cl', desc: 'Rich in antioxidants that help restore natural pigment and reduce breakage.' },
    { name: 'Fenugreek', glyph: 'Fg', desc: 'High in protein and nicotinic acid to support thicker, fuller regrowth.' },
    { name: 'Black Seed Oil', glyph: 'Bs', desc: 'A potent anti-inflammatory that calms flaking and locks in shine.' },
    { name: 'Coconut Oil', glyph: 'Co', desc: 'The carrier base — penetrates the shaft to reduce protein loss from washing.' },
  ];
  const grid = document.getElementById('ingredientGrid');
  grid.innerHTML = ingredients.map((ing, i) => `
    <div class="ing-card reveal" style="--rd:${(i % 4) * 0.08}s">
      <span class="ing-glyph">${ing.glyph}</span>
      <h3>${ing.name}</h3>
      <p>${ing.desc}</p>
    </div>
  `).join('');
  grid.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc-item').forEach(item => {
    const trigger = item.querySelector('.acc-trigger');
    const panel = item.querySelector('.acc-panel');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.acc-panel').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- before / after compare slider ---------- */
  const compareRange = document.getElementById('compareRange');
  const compareBefore = document.getElementById('compareBefore');
  const compareHandle = document.getElementById('compareHandle');
  if (compareRange) {
    compareRange.addEventListener('input', (e) => {
      const val = e.target.value;
      compareBefore.style.width = val + '%';
      compareHandle.style.left = val + '%';
    });
  }

  /* ---------- quantity stepper ---------- */
  const qtyVal = document.getElementById('qtyVal');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  let qty = 1;
  const renderQty = () => { qtyVal.textContent = qty; };
  qtyMinus.addEventListener('click', () => { if (qty > 1) qty--; renderQty(); });
  qtyPlus.addEventListener('click', () => { if (qty < 10) qty++; renderQty(); });

  /* =========================================================
     CART — session-only, in-memory array of { id, name, price, image, qty }
     ========================================================= */
  // Point this at your backend once it's running (see /backend/README.md).
  const API_BASE = 'http://localhost:4000';

  let cart = [];

  const cartCountEl = document.getElementById('cartCount');
  const cartNote = document.getElementById('cartNote');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartBtn = document.getElementById('cartBtn');
  const cartClose = document.getElementById('cartClose');

  const money = (n) => `₹${n.toFixed(2)}`;

  function cartTotalCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }
  function cartSubtotal() {
    return cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  function renderCart() {
    cartCountEl.textContent = cartTotalCount();

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="cart-empty" id="cartEmpty">Your cart is empty.</p>';
      cartCheckoutBtn.disabled = true;
    } else {
      cartItemsEl.innerHTML = cart.map(item => `
        <div class="cart-line" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <div class="cart-line-name">${item.name}</div>
            <div class="cart-line-price">${money(item.price)} each</div>
            <div class="cart-line-qty">
              <button class="cart-qty-minus" aria-label="Decrease quantity">−</button>
              <span>${item.qty}</span>
              <button class="cart-qty-plus" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="cart-line-remove">Remove</button>
        </div>
      `).join('');
      cartCheckoutBtn.disabled = false;
    }
    cartSubtotalEl.textContent = money(cartSubtotal());
  }

  function addToCart(product, quantity) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({ ...product, qty: quantity });
    }
    renderCart();
  }

  // delegate qty +/- and remove clicks inside the cart drawer
  cartItemsEl.addEventListener('click', (e) => {
    const line = e.target.closest('.cart-line');
    if (!line) return;
    const id = line.dataset.id;
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (e.target.classList.contains('cart-qty-plus')) {
      item.qty = Math.min(item.qty + 1, 20);
    } else if (e.target.classList.contains('cart-qty-minus')) {
      item.qty -= 1;
      if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    } else if (e.target.classList.contains('cart-line-remove')) {
      cart = cart.filter(i => i.id !== id);
    } else {
      return;
    }
    renderCart();
  });

  /* ---------- open / close drawer ---------- */
  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartBtn.setAttribute('aria-expanded', 'false');
  }
  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closeCheckout(); } });

  /* ---------- wire up product section buttons ---------- */
  const productInfo = document.querySelector('.product-info');
  const product = {
    id: productInfo.dataset.productId,
    name: productInfo.dataset.productName,
    price: parseFloat(productInfo.dataset.productPrice),
    image: productInfo.dataset.productImage,
  };

  document.getElementById('addCartBtn').addEventListener('click', () => {
    addToCart(product, qty);
    cartNote.textContent = `Added ${qty} to cart.`;
    setTimeout(() => { cartNote.textContent = ''; }, 3200);
  });
  document.getElementById('buyNowBtn').addEventListener('click', () => {
    addToCart(product, qty);
    openCart();
    openCheckout();
  });

  /* =========================================================
     CHECKOUT MODAL — posts order + customer to the backend
     ========================================================= */
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutClose = document.getElementById('checkoutClose');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSummary = document.getElementById('checkoutSummary');
  const checkoutStatus = document.getElementById('checkoutStatus');
  const checkoutSubmit = document.getElementById('checkoutSubmit');

  function renderCheckoutSummary() {
    checkoutSummary.innerHTML = cart.map(item => `
      <div><span>${item.name} × ${item.qty}</span><span>${money(item.price * item.qty)}</span></div>
    `).join('') + `<div class="total-row"><span>Total</span><span>${money(cartSubtotal())}</span></div>`;
  }

  function openCheckout() {
    if (cart.length === 0) return;
    renderCheckoutSummary();
    checkoutStatus.textContent = '';
    checkoutStatus.className = 'checkout-status';
    checkoutOverlay.classList.add('open');
  }
  function closeCheckout() {
    checkoutOverlay.classList.remove('open');
  }
  cartCheckoutBtn.addEventListener('click', () => { closeCart(); openCheckout(); });
  checkoutClose.addEventListener('click', closeCheckout);
  checkoutOverlay.addEventListener('click', (e) => { if (e.target === checkoutOverlay) closeCheckout(); });

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const formData = new FormData(checkoutForm);
    const orderPayload = {
      customer: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
      },
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      total: cartSubtotal(),
    };

    checkoutSubmit.disabled = true;
    checkoutSubmit.textContent = 'Placing order…';
    checkoutStatus.textContent = '';
    checkoutStatus.className = 'checkout-status';

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      checkoutStatus.textContent = `Order placed! Reference #${data.orderId}. We'll be in touch to arrange payment.`;
      checkoutStatus.className = 'checkout-status success';
      cart = [];
      renderCart();
      checkoutForm.reset();
      setTimeout(closeCheckout, 2400);
    } catch (err) {
      checkoutStatus.textContent = "Couldn't reach the order server. Make sure the backend is running (see backend/README.md), then try again.";
      checkoutStatus.className = 'checkout-status error';
    } finally {
      checkoutSubmit.disabled = false;
      checkoutSubmit.textContent = 'Place Order';
    }
  });

  renderCart();

  /* ---------- newsletter ---------- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      const btn = newsletterForm.querySelector('button');
      const original = btn.textContent;
      btn.textContent = 'Subscribed ✓';
      input.value = '';
      setTimeout(() => { btn.textContent = original; }, 2400);
    });
  }

  /* ---------- header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.style.boxShadow = y > 8 ? '0 12px 30px -20px rgba(0,0,0,.5)' : 'none';
    lastScroll = y;
  }, { passive: true });

});
