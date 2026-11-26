-- Module alimente : worker/src/index.js et synchronisation des tickets, lots et audits POS (lexwallet.app / cbltec@proton.me)

CREATE TABLE IF NOT EXISTS pos_tickets (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  sale_type TEXT NOT NULL,
  subtotal_ht REAL NOT NULL,
  tva_amount REAL NOT NULL,
  total_ttc REAL NOT NULL,
  cogs_total REAL NOT NULL,
  qr_payload TEXT NOT NULL,
  integrity_hash TEXT NOT NULL,
  cancelled INTEGER NOT NULL DEFAULT 0,
  is_test INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pos_stock_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  lot_code TEXT NOT NULL,
  qty_consumed REAL NOT NULL,
  unit_cost REAL NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES pos_tickets(id)
);

CREATE TABLE IF NOT EXISTS pos_audit_chain (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pos_tickets_tenant_ts ON pos_tickets(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pos_alloc_ticket ON pos_stock_allocations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_pos_audit_tenant_seq ON pos_audit_chain(tenant_id, seq);
