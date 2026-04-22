const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeLine(item) {
  const quantity = toNumber(item.quantity);
  const price = toNumber(item.price);
  const taxRate = toNumber(item.taxRate);
  const exclAmount = quantity * price;
  const taxAmount = exclAmount * (taxRate / 100);
  const inclAmount = exclAmount + taxAmount;

  return {
    itemCode: item.itemCode || '',
    description: item.description || '',
    note: item.note || '',
    quantity,
    price,
    taxRate,
    exclAmount,
    taxAmount,
    inclAmount,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/clients', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, customer_name AS customerName,
              address1, address2, address3, suburb, state, post_code AS postCode
       FROM client
       ORDER BY customer_name ASC`
    )
    .all();

  res.json(rows);
});

app.get('/api/orders', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, invoice_no AS invoiceNo, invoice_date AS invoiceDate, customer_name AS customerName,
              state, suburb, total_excl AS totalExcl, total_incl AS totalIncl, created_at AS createdAt
       FROM orders
       ORDER BY id DESC`
    )
    .all();

  res.json(rows);
});

app.get('/api/orders/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = db
    .prepare(
      `SELECT id, customer_name AS customerName, address1, address2, address3, suburb, state, post_code AS postCode,
              invoice_no AS invoiceNo, invoice_date AS invoiceDate, reference_no AS referenceNo, note,
              total_excl AS totalExcl, total_tax AS totalTax, total_incl AS totalIncl
       FROM orders
       WHERE id = ?`
    )
    .get(id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const items = db
    .prepare(
      `SELECT id, item_code AS itemCode, description, note, quantity, price,
              tax_rate AS taxRate, excl_amount AS exclAmount, tax_amount AS taxAmount, incl_amount AS inclAmount
       FROM order_items
       WHERE order_id = ?
       ORDER BY id ASC`
    )
    .all(id);

  return res.json({ ...order, items });
});

app.post('/api/orders', (req, res) => {
  const payload = req.body || {};
  const customerName = (payload.customerName || '').trim();

  if (!customerName) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  const inputItems = Array.isArray(payload.items) ? payload.items : [];
  const validItems = inputItems
    .map(computeLine)
    .filter((item) => item.itemCode || item.description || item.quantity || item.price);

  const totals = validItems.reduce(
    (acc, item) => {
      acc.totalExcl += item.exclAmount;
      acc.totalTax += item.taxAmount;
      acc.totalIncl += item.inclAmount;
      return acc;
    },
    { totalExcl: 0, totalTax: 0, totalIncl: 0 }
  );

  const insertOrder = db.prepare(
    `INSERT INTO orders (
      customer_name, address1, address2, address3, suburb, state, post_code,
      invoice_no, invoice_date, reference_no, note,
      total_excl, total_tax, total_incl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertItem = db.prepare(
    `INSERT INTO order_items (
      order_id, item_code, description, note, quantity, price,
      tax_rate, excl_amount, tax_amount, incl_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const txn = db.transaction(() => {
    const orderResult = insertOrder.run(
      customerName,
      payload.address1 || '',
      payload.address2 || '',
      payload.address3 || '',
      payload.suburb || '',
      payload.state || '',
      payload.postCode || '',
      payload.invoiceNo || '',
      payload.invoiceDate || '',
      payload.referenceNo || '',
      payload.note || '',
      totals.totalExcl,
      totals.totalTax,
      totals.totalIncl
    );

    const orderId = orderResult.lastInsertRowid;

    for (const item of validItems) {
      insertItem.run(
        orderId,
        item.itemCode,
        item.description,
        item.note,
        item.quantity,
        item.price,
        item.taxRate,
        item.exclAmount,
        item.taxAmount,
        item.inclAmount
      );
    }

    return orderId;
  });

  const orderId = txn();
  return res.status(201).json({ id: orderId });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
