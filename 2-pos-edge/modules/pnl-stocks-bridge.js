(() => {
  "use strict";

  // Bornes strictes pour eviter la saturation RAM et les boucles infinies
  const MAX_TICKS = 12;
  const MAX_LEDGER_ITEMS = 500;
  const MAX_PROCESSED_IDS = 500;
  const TICK_INTERVAL_MS = 2500;

  const state = {
    ticks: 0,
    timerId: null,
    processedIds: [],
    pnl: {
      grossSales: 0,
      taxCollected: 0,
      cogsEstimated: 0,
      netMargin: 0,
      orderCount: 0,
      zReportCount: 0,
      lastSaleAt: null
    },
    stocks: {},
    tickets: [],
    ledger: []
  };

  function safeNumber(val, fallback = 0) {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  function pushBounded(arr, item, maxLen) {
    arr.push(item);
    if (arr.length > maxLen) {
      arr.splice(0, arr.length - maxLen);
    }
  }

  function normalizeSalePayload(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const saleId = String(
      data.saleId || data.id || data.orderId || `SALE-${Date.now()}-${state.pnl.orderCount + 1}`
    );
    const itemsRaw = Array.isArray(data.items) ? data.items.slice(0, 100) : [];
    const items = itemsRaw.map((it, idx) => ({
      sku: String(it.sku || it.code || it.id || `SKU-${idx + 1}`),
      name: String(it.name || it.label || "Article POS"),
      qty: Math.max(0, safeNumber(it.qty ?? it.quantity, 1)),
      unitPrice: Math.max(0, safeNumber(it.unitPrice ?? it.price, 0)),
      unitCost: Math.max(0, safeNumber(it.unitCost ?? it.cost, 0))
    }));

    const computedTotal = items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0);
    const computedCost = items.reduce((acc, it) => acc + it.qty * it.unitCost, 0);
    const grossSales = Math.max(0, safeNumber(data.total ?? data.grossSales, computedTotal));
    const taxRate = Math.max(0, Math.min(1, safeNumber(data.taxRate, 0)));
    const taxCollected = Math.max(
      0,
      safeNumber(data.tax ?? data.taxCollected, Number((grossSales * taxRate).toFixed(2)))
    );
    const cogsEstimated = Math.max(0, safeNumber(data.cogs ?? data.cogsEstimated, computedCost));

    return {
      saleId,
      timestamp: data.timestamp || new Date().toISOString(),
      paymentMethod: String(data.paymentMethod || data.method || "CASH"),
      items,
      grossSales,
      taxCollected,
      cogsEstimated
    };
  }

  function updateStocksAndPnl(sale) {
    if (state.processedIds.includes(sale.saleId)) {
      return false;
    }
    pushBounded(state.processedIds, sale.saleId, MAX_PROCESSED_IDS);

    for (let i = 0; i < sale.items.length; i += 1) {
      const item = sale.items[i];
      const current = state.stocks[item.sku] || {
        sku: item.sku,
        name: item.name,
        remainingQty: 0,
        soldQty: 0,
        lastUpdated: sale.timestamp
      };
      current.name = item.name || current.name;
      current.soldQty = Number((current.soldQty + item.qty).toFixed(3));
      current.remainingQty = Number((current.remainingQty - item.qty).toFixed(3));
      current.lastUpdated = sale.timestamp;
      state.stocks[item.sku] = current;
    }

    state.pnl.grossSales = Number((state.pnl.grossSales + sale.grossSales).toFixed(2));
    state.pnl.taxCollected = Number((state.pnl.taxCollected + sale.taxCollected).toFixed(2));
    state.pnl.cogsEstimated = Number((state.pnl.cogsEstimated + sale.cogsEstimated).toFixed(2));
    state.pnl.netMargin = Number(
      (state.pnl.grossSales - state.pnl.taxCollected - state.pnl.cogsEstimated).toFixed(2)
    );
    state.pnl.orderCount += 1;
    state.pnl.lastSaleAt = sale.timestamp;

    const ticket = {
      ticketId: `TKT-${sale.saleId}`,
      saleId: sale.saleId,
      createdAt: sale.timestamp,
      total: sale.grossSales,
      tax: sale.taxCollected,
      qrPayload: JSON.stringify({
        t: sale.saleId,
        a: sale.grossSales,
        ts: sale.timestamp
      })
    };
    pushBounded(state.tickets, ticket, MAX_LEDGER_ITEMS);

    pushBounded(
      state.ledger,
      {
        saleId: sale.saleId,
        timestamp: sale.timestamp,
        grossSales: sale.grossSales,
        netMargin: Number((sale.grossSales - sale.taxCollected - sale.cogsEstimated).toFixed(2))
      },
      MAX_LEDGER_ITEMS
    );

    return true;
  }

  function emitSnapshot() {
    const snapshot = {
      pnl: { ...state.pnl },
      stocks: { ...state.stocks },
      latestTicket: state.tickets[state.tickets.length - 1] || null,
      ticketsCount: state.tickets.length,
      ledgerCount: state.ledger.length
    };

    window.CheerPosBridgeState = Object.freeze({
      getSnapshot: () => ({
        pnl: { ...state.pnl },
        stocks: Object.fromEntries(
          Object.entries(state.stocks).map(([k, v]) => [k, { ...v }])
        ),
        tickets: state.tickets.slice(-50),
        ledger: state.ledger.slice(-50)
      }),
      recordSale: (payload) => {
        const sale = normalizeSalePayload(payload);
        const applied = updateStocksAndPnl(sale);
        if (applied) {
          emitSnapshot();
        }
        return applied;
      },
      closeZReport: () => {
        state.pnl.zReportCount += 1;
        const zSnapshot = {
          zNumber: state.pnl.zReportCount,
          closedAt: new Date().toISOString(),
          grossSales: state.pnl.grossSales,
          taxCollected: state.pnl.taxCollected,
          cogsEstimated: state.pnl.cogsEstimated,
          netMargin: state.pnl.netMargin,
          orderCount: state.pnl.orderCount
        };
        if (typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new CustomEvent("cheer:z_report_closed", { detail: zSnapshot }));
        }
        return zSnapshot;
      },
      stopHeartbeat: () => {
        if (state.timerId !== null) {
          clearInterval(state.timerId);
          state.timerId = null;
        }
      }
    });

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("cheer:bridge_updated", { detail: snapshot }));
    }
  }

  function handleSaleEvent(event) {
    const detail = event && event.detail ? event.detail : event;
    const sale = normalizeSalePayload(detail);
    const applied = updateStocksAndPnl(sale);
    if (applied) {
      emitSnapshot();
    }
  }

  // Ecoute l'evenement emis par caisse-unified-v165.js / pos-core-engine.js
  window.addEventListener("cheer:sale_validated", handleSaleEvent, { passive: true });

  // Heartbeat borne par MAX_TICKS (jamais infini)
  state.timerId = setInterval(() => {
    state.ticks += 1;
    if (state.ticks >= MAX_TICKS) {
      if (state.timerId !== null) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
      return;
    }
  }, TICK_INTERVAL_MS);

  emitSnapshot();
})();
