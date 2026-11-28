(() => {
  "use strict";

  // Bornes strictes anti-surcharge CPU / anti-boucle
  const MAX_EVALUATIONS = 200;
  const EVAL_DEBOUNCE_MS = 150;
  const DEFAULT_ADMIN_EMAIL = "cbltec@proton.me";

  const state = {
    evalCount: 0,
    debounceTimer: null,
    holding: {
      entity: "CBL TEC",
      adminEmail: DEFAULT_ADMIN_EMAIL,
      kycStatus: "VERIFIED_LOCAL",
      rentCapRatio: 0.07
    },
    fiscal: {
      apiMode: "EDGE_OFFLINE_QUEUE",
      taxProvisionEst: 0,
      lastZNumber: 0,
      complianceFlag: "OK"
    }
  };

  function evaluateGovernance() {
    if (state.evalCount >= MAX_EVALUATIONS) return;
    state.evalCount += 1;

    const bridge = window.CheerPosBridgeState;
    const snap = bridge && typeof bridge.getSnapshot === "function" ? bridge.getSnapshot() : null;
    const pnl = snap && snap.pnl ? snap.pnl : {};

    const grossSales = Number(pnl.grossSales || 0);
    const taxCollected = Number(pnl.taxCollected || 0);
    const zCount = Number(pnl.zReportCount || 0);

    state.fiscal.taxProvisionEst = Number(
      (taxCollected > 0 ? taxCollected : grossSales * 0.16).toFixed(2)
    );
    state.fiscal.lastZNumber = Math.max(state.fiscal.lastZNumber, zCount);
    state.fiscal.complianceFlag =
      grossSales >= 0 && state.holding.adminEmail.includes("@") ? "OK" : "CHECK";

    if (typeof document !== "undefined" && document.querySelectorAll) {
      const kycNodes = document.querySelectorAll('[data-bind="holding-kyc"], #bridge-holding-kyc');
      for (let i = 0; i < Math.min(kycNodes.length, 10); i += 1) {
        const txt = `${state.holding.entity} | ${state.holding.kycStatus}`;
        if (kycNodes[i].textContent !== txt) kycNodes[i].textContent = txt;
      }

      const taxNodes = document.querySelectorAll('[data-bind="fiscal-provision"], #bridge-fiscal-provision');
      for (let i = 0; i < Math.min(taxNodes.length, 10); i += 1) {
        const txt = `${state.fiscal.taxProvisionEst.toFixed(2)} (${state.fiscal.complianceFlag})`;
        if (taxNodes[i].textContent !== txt) taxNodes[i].textContent = txt;
      }
    }

    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("cheer:holding_fiscal_updated", {
          detail: {
            holding: { ...state.holding },
            fiscal: { ...state.fiscal }
          }
        })
      );
    }
  }

  function scheduleGovernance() {
    if (state.evalCount >= MAX_EVALUATIONS) return;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      evaluateGovernance();
    }, EVAL_DEBOUNCE_MS);
  }

  window.CheerHoldingFiscalGuard = Object.freeze({
    getState: () => ({
      holding: { ...state.holding },
      fiscal: { ...state.fiscal },
      evalCount: state.evalCount
    }),
    setKycStatus: (status) => {
      if (typeof status === "string" && status.trim().length > 0) {
        state.holding.kycStatus = status.trim().slice(0, 40);
        state.evalCount = 0;
        evaluateGovernance();
        return true;
      }
      return false;
    },
    evaluateNow: () => {
      state.evalCount = 0;
      evaluateGovernance();
    }
  });

  window.addEventListener("cheer:bridge_updated", scheduleGovernance, { passive: true });
  window.addEventListener("cheer:z_report_closed", scheduleGovernance, { passive: true });

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", evaluateGovernance, { once: true });
    } else {
      evaluateGovernance();
    }
  }
})();
