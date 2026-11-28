(() => {
  "use strict";

  // Bornes strictes anti-surcharge RAM / anti-boucle
  const MAX_OPS_ENTRIES = 200;
  const OPS_DEBOUNCE_MS = 150;
  const MAX_RENT_RATIO = 0.07;

  const state = {
    evalCount: 0,
    debounceTimer: null,
    costs: {
      rentMonthly: 0,
      rentRatio: 0,
      rentCapExceeded: false,
      fixedCharges: 0,
      variableCosts: 0
    },
    payroll: {
      wagesTotal: 0,
      socialCharges: 0
    },
    invoices: [],
    suppliers: {}
  };

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function pushBounded(arr, item) {
    arr.push(item);
    if (arr.length > MAX_OPS_ENTRIES) {
      arr.splice(0, arr.length - MAX_OPS_ENTRIES);
    }
  }

  function recomputeOps() {
    if (state.evalCount >= MAX_OPS_ENTRIES) return;
    state.evalCount += 1;

    const bridge = window.CheerPosBridgeState;
    const snap = bridge && typeof bridge.getSnapshot === "function" ? bridge.getSnapshot() : null;
    const grossSales = snap && snap.pnl ? safeNum(snap.pnl.grossSales, 0) : 0;

    state.costs.rentRatio =
      grossSales > 0 ? Number((state.costs.rentMonthly / grossSales).toFixed(4)) : 0;
    state.costs.rentCapExceeded =
      grossSales > 0 && state.costs.rentRatio > MAX_RENT_RATIO;

    const totalOutflows =
      state.costs.rentMonthly +
      state.costs.fixedCharges +
      state.costs.variableCosts +
      state.payroll.wagesTotal +
      state.payroll.socialCharges;

    if (typeof document !== "undefined" && document.querySelectorAll) {
      const bindMap = [
        ["[data-bind='ops-rent'], #bridge-ops-rent", state.costs.rentMonthly.toFixed(2)],
        [
          "[data-bind='ops-rent-cap'], #bridge-ops-rent-cap",
          state.costs.rentCapExceeded ? "ALERTE >7%" : "OK <=7%"
        ],
        ["[data-bind='ops-payroll'], #bridge-ops-payroll", (state.payroll.wagesTotal + state.payroll.socialCharges).toFixed(2)],
        ["[data-bind='ops-invoices-count'], #bridge-ops-invoices", String(state.invoices.length)],
        ["[data-bind='ops-suppliers-count'], #bridge-ops-suppliers", String(Object.keys(state.suppliers).length)],
        ["[data-bind='ops-outflows'], #bridge-ops-outflows", totalOutflows.toFixed(2)]
      ];

      for (let b = 0; b < bindMap.length; b += 1) {
        const [sel, txt] = bindMap[b];
        const nodes = document.querySelectorAll(sel);
        for (let i = 0; i < Math.min(nodes.length, 10); i += 1) {
          if (nodes[i].textContent !== txt) {
            nodes[i].textContent = txt;
          }
        }
      }
    }

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("cheer:ops_ledger_updated", {
          detail: {
            costs: { ...state.costs },
            payroll: { ...state.payroll },
            invoicesCount: state.invoices.length,
            suppliersCount: Object.keys(state.suppliers).length,
            totalOutflows: Number(totalOutflows.toFixed(2))
          }
        })
      );
    }
  }

  function scheduleRecompute() {
    if (state.evalCount >= MAX_OPS_ENTRIES) return;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      recomputeOps();
    }, OPS_DEBOUNCE_MS);
  }

  window.CheerOpsLedgerGuard = Object.freeze({
    getState: () => ({
      costs: { ...state.costs },
      payroll: { ...state.payroll },
      invoices: state.invoices.slice(-50),
      suppliers: { ...state.suppliers },
      evalCount: state.evalCount
    }),
    setCostsAndPayroll: (input = {}) => {
      if (input.rentMonthly !== undefined) {
        state.costs.rentMonthly = Math.max(0, safeNum(input.rentMonthly, state.costs.rentMonthly));
      }
      if (input.fixedCharges !== undefined) {
        state.costs.fixedCharges = Math.max(0, safeNum(input.fixedCharges, state.costs.fixedCharges));
      }
      if (input.variableCosts !== undefined) {
        state.costs.variableCosts = Math.max(0, safeNum(input.variableCosts, state.costs.variableCosts));
      }
      if (input.wagesTotal !== undefined) {
        state.payroll.wagesTotal = Math.max(0, safeNum(input.wagesTotal, state.payroll.wagesTotal));
      }
      if (input.socialCharges !== undefined) {
        state.payroll.socialCharges = Math.max(0, safeNum(input.socialCharges, state.payroll.socialCharges));
      }
      state.evalCount = 0;
      recomputeOps();
      return true;
    },
    recordInvoice: (inv = {}) => {
      const amount = Math.max(0, safeNum(inv.amount, 0));
      const supplier = String(inv.supplier || "Fournisseur POS").slice(0, 80);
      const ref = String(inv.ref || `FAC-${Date.now()}`).slice(0, 40);

      pushBounded(state.invoices, {
        ref,
        supplier,
        amount,
        recordedAt: new Date().toISOString()
      });

      const supKeys = Object.keys(state.suppliers);
      if (supKeys.length < MAX_OPS_ENTRIES || state.suppliers[supplier]) {
        const prev = safeNum(state.suppliers[supplier], 0);
        state.suppliers[supplier] = Number((prev + amount).toFixed(2));
      }

      state.costs.variableCosts = Number((state.costs.variableCosts + amount).toFixed(2));
      state.evalCount = 0;
      recomputeOps();
      return true;
    },
    recomputeNow: () => {
      state.evalCount = 0;
      recomputeOps();
    }
  });

  window.addEventListener("cheer:bridge_updated", scheduleRecompute, { passive: true });
  window.addEventListener("cheer:z_report_closed", scheduleRecompute, { passive: true });
  window.addEventListener("cheer:holding_fiscal_updated", scheduleRecompute, { passive: true });

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", recomputeOps, { once: true });
    } else {
      recomputeOps();
    }
  }
})();
