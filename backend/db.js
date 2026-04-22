const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS client (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL UNIQUE,
    address1 TEXT,
    address2 TEXT,
    address3 TEXT,
    suburb TEXT,
    state TEXT,
    post_code TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    address1 TEXT,
    address2 TEXT,
    address3 TEXT,
    suburb TEXT,
    state TEXT,
    post_code TEXT,
    invoice_no TEXT,
    invoice_date TEXT,
    reference_no TEXT,
    note TEXT,
    total_excl REAL NOT NULL DEFAULT 0,
    total_tax REAL NOT NULL DEFAULT 0,
    total_incl REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_code TEXT,
    description TEXT,
    note TEXT,
    quantity REAL NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    excl_amount REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    incl_amount REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

const clientColumns = db
  .prepare("PRAGMA table_info(client)")
  .all()
  .map((column) => column.name);

if (!clientColumns.includes('address1')) {
  db.exec('ALTER TABLE client ADD COLUMN address1 TEXT');
}

if (!clientColumns.includes('address2')) {
  db.exec('ALTER TABLE client ADD COLUMN address2 TEXT');
}

if (!clientColumns.includes('address3')) {
  db.exec('ALTER TABLE client ADD COLUMN address3 TEXT');
}

if (!clientColumns.includes('suburb')) {
  db.exec('ALTER TABLE client ADD COLUMN suburb TEXT');
}

if (!clientColumns.includes('state')) {
  db.exec('ALTER TABLE client ADD COLUMN state TEXT');
}

if (!clientColumns.includes('post_code')) {
  db.exec('ALTER TABLE client ADD COLUMN post_code TEXT');
}

const clientCount = db.prepare('SELECT COUNT(*) AS count FROM client').get();

const seedClients = [
  {
    customerName: 'Acme Stores',
    address1: '12 Market Street',
    address2: 'Suite 4',
    address3: '',
    suburb: 'Sydney',
    state: 'NSW',
    postCode: '2000',
  },
  {
    customerName: 'Blue Ocean Traders',
    address1: '48 Harbour Road',
    address2: '',
    address3: '',
    suburb: 'Melbourne',
    state: 'VIC',
    postCode: '3000',
  },
  {
    customerName: 'City Retail Hub',
    address1: '87 King Avenue',
    address2: 'Level 2',
    address3: '',
    suburb: 'Brisbane',
    state: 'QLD',
    postCode: '4000',
  },
  {
    customerName: 'Delta Supplies',
    address1: '5 Station Lane',
    address2: '',
    address3: '',
    suburb: 'Perth',
    state: 'WA',
    postCode: '6000',
  },
];

if (clientCount.count === 0) {
  const insertClient = db.prepare(
    `INSERT INTO client (customer_name, address1, address2, address3, suburb, state, post_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const seedTxn = db.transaction(() => {
    for (const client of seedClients) {
      insertClient.run(
        client.customerName,
        client.address1,
        client.address2,
        client.address3,
        client.suburb,
        client.state,
        client.postCode
      );
    }
  });

  seedTxn();
} else {
  const updateClient = db.prepare(
    `UPDATE client
     SET address1 = COALESCE(NULLIF(address1, ''), ?),
         address2 = COALESCE(NULLIF(address2, ''), ?),
         address3 = COALESCE(NULLIF(address3, ''), ?),
         suburb = COALESCE(NULLIF(suburb, ''), ?),
         state = COALESCE(NULLIF(state, ''), ?),
         post_code = COALESCE(NULLIF(post_code, ''), ?)
     WHERE customer_name = ?`
  );

  const updateTxn = db.transaction(() => {
    for (const client of seedClients) {
      updateClient.run(
        client.address1,
        client.address2,
        client.address3,
        client.suburb,
        client.state,
        client.postCode,
        client.customerName
      );
    }
  });

  updateTxn();
}

module.exports = db;
