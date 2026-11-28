(() => {
  "use strict";

  // Bornes strictes anti-surcharge RAM / anti-boucle DOM
  const MAX_RENDER_UPDATES = 120;
  const RENDER_DEBOUNCE_MS = 100;
  const MAX_DOM_TEXT_LEN = 120;
  const MAX_TARGETS_PER_KEY = 20;

  const state = {
    renderCount: 0,
    debounceTimer: null,
    lastZReport: null
  };

  function clampText(val) {
    const str = String(val ?? "");
    return str.length > MAX_DOM_TEXT_LEN ? str.slice(0, MAX_DOM_TEXT_LEN) : str;
  }

  function formatMoney(num) {
    const n = Number(num);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  }

  function setBindingText(selectorList, value) {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    const text = clampText(value);
    const nodes = document.querySelectorAll(selectorList);
    const limit = Math.min(nodes.length, MAX_TARGETS_PER_KEY);
    for (let i = 0; i < limit; i += 1) {
      const el = nodes[i];
      if (el.textContent !== text) {
        el.textContent = text;
      }
    }
  }

  function renderBridgeToDom() {
    if (state.renderCount >= MAX_RENDER_UPDATES) return;
    state.renderCount += 1;

    const bridge = window.CheerPosBridgeState;
    if (!bridge || typeof bridge.getSnapshot !== "function") return;

    const snap = bridge.getSnapshot();
    const pnl = snap.pnl || {};
    const stocksList = Object.values(snap.stocks || {});
    const latestTicket = Array.isArray(snap.tickets) && snap.tickets.length > 0
      ? snap.tickets[snap.tickets.length - 1]
      : null;

    setBindingText('[data-bind="pnl-gross"], #bridge-pnl-gross', formatMoney(pnl.grossSales));
    setBindingText('[data-bind="pnl-tax"], #bridge-pnl-tax', formatMoney(pnl.taxCollected));
    setBindingText('[data-bind="pnl-cogs"], #bridge-pnl-cogs', formatMoney(pnl.cogsEstimated));
    setBindingText('[data-bind="pnl-margin"], #bridge-pnl-margin', formatMoney(pnl.netMargin));
    setBindingText('[data-bind="pnl-orders"], #bridge-pnl-orders', String(pnl.orderCount ?? 0));
    setBindingText('[data-bind="pnl-z-count"], #bridge-pnl-z-count', String(pnl.zReportCount ?? 0));
    setBindingText('[data-bind="stocks-skus"], #bridge-stocks-skus', String(stocksList.length));
    setBindingText(
      '[data-bind="latest-ticket"], #bridge-latest-ticket',
      latestTicket ? `${latestTicket.ticketId} (${formatMoney(latestTicket.total)})` : "AUCUN"
    );
    setBindingText(
      '[data-bind="latest-qr"], #bridge-latest-qr',
      latestTicket ? latestTicket.qrPayload : ""
    );
    setBindingText(
      '[data-bind="z-report-status"], #bridge-z-status',
      state.lastZReport ? `Z#${state.lastZReport.zNumber} (${formatMoney(state.lastZReport.grossSales)})` : "OUVERT"
    );
  }

  function scheduleDomSync() {
    if (state.renderCount >= MAX_RENDER_UPDATES) return;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      renderBridgeToDom();
    }, RENDER_DEBOUNCE_MS);
  }

  window.CheerBridgeDomSync = Object.freeze({
    syncNow: () => {
      state.renderCount = 0;
      renderBridgeToDom();
    },
    resetQuota: () => {
      state.renderCount = 0;
    },
    getStats: () => ({
      renderCount: state.renderCount,
      maxRenderUpdates: MAX_RENDER_UPDATES,
      lastZReport: state.lastZReport ? { ...state.lastZReport } : null
    })
  });

  window.addEventListener("cheer:bridge_updated", scheduleDomSync, { passive: true });
  window.addEventListener("cheer:z_report_closed", (evt) => {
    state.lastZReport = evt && evt.detail ? evt.detail : null;
    scheduleDomSync();
  }, { passive: true });

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleDomSync, { once: true });
    } else {
      scheduleDomSync();
    }
  }
})();
