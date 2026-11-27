/* Module alimente : 2-pos-edge/src/frontend/LexWalletPOS.tsx et etat POS synchronise (BUR-BEF-CHED / ACC-FRITES) */
const MAX_QUEUE_ITEMS = 250;

export const DEFAULT_CATALOG = [
  {
    sku: "BUR-BEF-CHED",
    name: "Burger Boeuf Cheddar",
    price_ht: 11.50,
    unit_cogs: 3.45,
    vat_rate: 0.10,
    lot_code: "LOT-BEF-01",
  },
  {
    sku: "ACC-FRITES",
    name: "Frites Maison",
    price_ht: 3.50,
    unit_cogs: 0.85,
    vat_rate: 0.10,
    lot_code: "LOT-FRI-01",
  },
];

function round2(n) {
  return Number((Number(n) || 0).toFixed(2));
}

export function createPosEngine(catalog = DEFAULT_CATALOG, meta = {}) {
  const tenantId = meta.tenantId || "CHEER-FLAGSHIP-01";
  const adminEmail = meta.adminEmail || "cbltec@proton.me";
  const itemsBySku = new Map();

  for (const item of catalog) {
    if (item && item.sku) {
      itemsBySku.set(String(item.sku).trim(), { ...item });
    }
  }

  let cart = [];
  let tickets = [];
  let audit = [];

  function findItem(sku) {
    const key = String(sku || "").trim();
    return itemsBySku.get(key) || null;
  }

  function addItem(sku, qty = 1) {
    const base = findItem(sku);
    const inc = Math.max(1, Math.floor(Number(qty) || 1));
    if (!base) return getCart();
    const existing = cart.find((line) => line.sku === base.sku);
    if (existing) {
      existing.qty += inc;
    } else {
      cart.push({
        sku: base.sku,
        name: base.name,
        price_ht: round2(base.price_ht),
        unit_cogs: round2(base.unit_cogs),
        vat_rate: Number(base.vat_rate) || 0.10,
        lot_code: base.lot_code || "LOT-STD-01",
        qty: inc,
      });
    }
    return getCart();
  }

  function clearCart() {
    cart = [];
    return getCart();
  }

  function getCart() {
    return cart.map((line) => ({ ...line }));
  }

  function getTotals() {
    let subtotalHt = 0;
    let tvaAmount = 0;
    let totalTtc = 0;
    let cogsTotal = 0;
    let itemCount = 0;

    for (const line of cart) {
      const qty = Number(line.qty) || 0;
      const lineHt = round2((Number(line.price_ht) || 0) * qty);
      const lineVat = round2(lineHt * (Number(line.vat_rate) || 0));
      const lineTtc = round2(lineHt + lineVat);
      const lineCogs = round2((Number(line.unit_cogs) || 0) * qty);

      subtotalHt = round2(subtotalHt + lineHt);
      tvaAmount = round2(tvaAmount + lineVat);
      totalTtc = round2(totalTtc + lineTtc);
      cogsTotal = round2(cogsTotal + lineCogs);
      itemCount += qty;
    }

    return {
      itemCount,
      subtotalHt,
      tvaAmount,
      totalTtc,
      cogsTotal,
    };
  }

  function validateTicket(saleType = "sur_place", isTest = false) {
    const totals = getTotals();
    if (cart.length === 0 || totals.itemCount <= 0) {
      return null;
    }
    const seq = tickets.length + 1;
    const ticket = {
      id: `TKT-${String(seq).padStart(4, "0")}`,
      createdAt: new Date().toISOString(),
      tenantId,
      adminEmail,
      saleType: saleType === "emporter" ? "emporter" : "sur_place",
      isTest: Boolean(isTest),
      items: getCart(),
      ...totals,
      qrPayload: `CHEER|${tenantId}|TKT-${String(seq).padStart(4, "0")}|${totals.totalTtc.toFixed(2)}`,
    };

    tickets.push(ticket);
    if (tickets.length > MAX_QUEUE_ITEMS) {
      tickets = tickets.slice(tickets.length - MAX_QUEUE_ITEMS);
    }

    audit.push({
      seq: audit.length + 1,
      ts: ticket.createdAt,
      tenantId,
      adminEmail,
      eventType: isTest ? "TICKET_TEST" : "TICKET_VALIDATED",
      ticketId: ticket.id,
      totalTtc: ticket.totalTtc,
    });
    if (audit.length > MAX_QUEUE_ITEMS) {
      audit = audit.slice(audit.length - MAX_QUEUE_ITEMS);
    }

    clearCart();
    return ticket;
  }

  return {
    tenantId,
    adminEmail,
    findItem,
    addItem,
    clearCart,
    getCart,
    getTotals,
    validateTicket,
    getTickets: () => tickets.map((t) => ({ ...t })),
    getAudit: () => audit.map((a) => ({ ...a })),
  };
}
