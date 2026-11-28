(() => {
  "use strict";

  // Bornes strictes anti-quota localStorage / anti-surcharge I/O
  const STORAGE_KEY = "cheer_pos_bridge_v165_snap";
  const MAX_PERSIST_WRITES = 80;
  const MAX_STORED_TICKETS = 50;
  const MAX_STORED_LEDGER = 50;
  const MAX_STORED_SKUS = 100;
  const STORAGE_DEBOUNCE_MS = 250;

  const state = {
    writeCount: 0,
    debounceTimer: null,
    lastZReport: null
  };

  function getStorageSafe() {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      const testKey = "__cheer_ls_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (_) {
      return null;
    }
  }

  function buildBoundedPayload() {
    const bridge = window.CheerPosBridgeState;
    if (!bridge || typeof bridge.getSnapshot !== "function") return null;

    const snap = bridge.getSnapshot();
    const entries = Object.entries(snap.stocks || {}).slice(0, MAX_STORED_SKUS);
    const boundedStocks = {};
    for (let i = 0; i < entries.length; i += 1) {
      const [k, v] = entries[i];
      boundedStocks[String(k).slice(0, 40)] = {
        sku: String((v && v.sku) || k).slice(0, 40),
        name: String((v && v.name) || "").slice(0, 80),
        remainingQty: Number((v && v.remainingQty) || 0),
        soldQty: Number((v && v.soldQty) || 0),
        lastUpdated: String((v && v.lastUpdated) || "")
      };
    }

    return {
      savedAt: new Date().toISOString(),
      pnl: snap.pnl || {},
      stocks: boundedStocks,
      tickets: Array.isArray(snap.tickets) ? snap.tickets.slice(-MAX_STORED_TICKETS) : [],
      ledger: Array.isArray(snap.ledger) ? snap.ledger.slice(-MAX_STORED_LEDGER) : [],
      lastZReport: state.lastZReport
    };
  }

  function flushToStorage() {
    if (state.writeCount >= MAX_PERSIST_WRITES) return false;
    const ls = getStorageSafe();
    if (!ls) return false;

    const payload = buildBoundedPayload();
    if (!payload) return false;

    try {
      const serialized = JSON.stringify(payload);
      if (serialized.length > 250000) return false;
      ls.setItem(STORAGE_KEY, serialized);
      state.writeCount += 1;
      return true;
    } catch (_) {
      return false;
    }
  }

  function schedulePersist() {
    if (state.writeCount >= MAX_PERSIST_WRITES) return;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      flushToStorage();
    }, STORAGE_DEBOUNCE_MS);
  }

  function restoreFromStorage() {
    const ls = getStorageSafe();
    const bridge = window.CheerPosBridgeState;
    if (!ls || !bridge || typeof bridge.recordSale !== "function") return 0;

    try {
      const raw = ls.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return 0;
      if (parsed.lastZReport && typeof parsed.lastZReport === "object") {
        state.lastZReport = parsed.lastZReport;
      }
      const ledger = Array.isArray(parsed.ledger) ? parsed.ledger.slice(-MAX_STORED_LEDGER) : [];
      let restored = 0;
      for (let i = 0; i < ledger.length; i += 1) {
        const entry = ledger[i];
        if (entry && entry.saleId) {
          const ok = bridge.recordSale({
            saleId: entry.saleId,
            timestamp: entry.timestamp,
            total: entry.grossSales,
            items: []
          });
          if (ok) restored += 1;
        }
      }
      return restored;
    } catch (_) {
      return 0;
    }
  }

  window.CheerBridgeStorageSync = Object.freeze({
    persistNow: () => flushToStorage(),
    restoreNow: () => restoreFromStorage(),
    clearStorage: () => {
      const ls = getStorageSafe();
      if (ls) {
        try {
          ls.removeItem(STORAGE_KEY);
        } catch (_) {}
      }
      state.writeCount = 0;
    },
    getStats: () => ({
      storageKey: STORAGE_KEY,
      writeCount: state.writeCount,
      maxPersistWrites: MAX_PERSIST_WRITES
    })
  });

  window.addEventListener("cheer:bridge_updated", schedulePersist, { passive: true });
  window.addEventListener("cheer:z_report_closed", (evt) => {
    state.lastZReport = evt && evt.detail ? evt.detail : null;
    schedulePersist();
  }, { passive: true });

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", restoreFromStorage, { once: true });
    } else {
      restoreFromStorage();
    }
  }
})();
