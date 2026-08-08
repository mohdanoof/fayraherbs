// server.js — minimal API that saves customers and orders for the
// Fayra Herbs website. No payment processing — that's handled separately.

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());              // allows the static site (opened via Live Server / file://) to call this API
app.use(express.json());

// ---------- prepared statements ----------
const findCustomerByEmail = db.prepare('SELECT * FROM customers WHERE email = ?');
const insertCustomer = db.prepare(`
  INSERT INTO customers (name, email, phone, address) VALUES (@name, @email, @phone, @address)
`);
const updateCustomer = db.prepare(`
  UPDATE customers SET name = @name, phone = @phone, address = @address WHERE id = @id
`);
const insertOrder = db.prepare(`
  INSERT INTO orders (customer_id, total) VALUES (@customerId, @total)
`);
const insertOrderItem = db.prepare(`
  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES (@orderId, @productId, @productName, @unitPrice, @quantity)
`);
const listOrders = db.prepare(`
  SELECT
    orders.id AS order_id, orders.total, orders.status, orders.created_at,
    customers.name AS customer_name, customers.email, customers.phone, customers.address
  FROM orders
  JOIN customers ON customers.id = orders.customer_id
  ORDER BY orders.id DESC
`);
const itemsForOrder = db.prepare('SELECT product_name, unit_price, quantity FROM order_items WHERE order_id = ?');

// ---------- health check ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'fayra-herbs-backend' });
});

// ---------- create an order (+ customer if new) ----------
app.post('/api/orders', (req, res) => {
  const { customer, items, total } = req.body || {};

  if (!customer || !customer.name || !customer.email) {
    return res.status(400).json({ error: 'customer.name and customer.email are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  const createOrder = db.transaction(() => {
    let existing = findCustomerByEmail.get(customer.email);
    let customerId;

    if (existing) {
      updateCustomer.run({
        id: existing.id,
        name: customer.name,
        phone: customer.phone || existing.phone,
        address: customer.address || existing.address,
      });
      customerId = existing.id;
    } else {
      const result = insertCustomer.run({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || null,
        address: customer.address || null,
      });
      customerId = result.lastInsertRowid;
    }

    const computedTotal = typeof total === 'number'
      ? total
      : items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderResult = insertOrder.run({ customerId, total: computedTotal });
    const orderId = orderResult.lastInsertRowid;

    for (const item of items) {
      insertOrderItem.run({
        orderId,
        productId: item.id || 'unknown',
        productName: item.name,
        unitPrice: item.price,
        quantity: item.qty,
      });
    }

    return orderId;
  });

  try {
    const orderId = createOrder();
    res.status(201).json({ orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save order' });
  }
});

// ---------- list all orders (simple admin view) ----------
app.get('/api/orders', (req, res) => {
  const orders = listOrders.all().map(order => ({
    ...order,
    items: itemsForOrder.all(order.order_id),
  }));
  res.json(orders);
});

app.listen(PORT, () => {
  console.log(`Fayra Herbs backend running at http://localhost:${PORT}`);
});
