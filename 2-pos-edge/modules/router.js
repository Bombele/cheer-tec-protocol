/* Module alimente : 2-pos-edge/index.html (navigation entre /POS/caisse et les autres vues POS) */
(function () {
  "use strict";

  function normalizeRoute() {
    var h = String(window.location.hash || "#/POS/caisse");
    if (h === "" || h === "#") h = "#/POS/caisse";
    return h.toLowerCase();
  }

  function applyRouteVisibility() {
    var route = normalizeRoute();
    var isCaisse = route.indexOf("/pos/caisse") !== -1;

    var host = document.getElementById("cheer-menu-v11-host");
    if (host) {
      host.style.display = isCaisse ? "" : "none";
    }

    var liveBox = document.getElementById("cc-v162-live-box");
    if (liveBox) {
      liveBox.style.display = isCaisse ? "" : "none";
    }

    var viewMap = {
      "view-pnl": ["/pos/pnl", "/pos/p&l", "/pos/z"],
      "view-costs": ["/pos/couts", "/pos/coûts"],
      "view-invoices": ["/pos/factures"],
      "view-payroll": ["/pos/paie", "/pos/charges"],
      "view-stock": ["/pos/stock", "/pos/stocks", "/pos/iot", "/pos/supply"],
      "view-suppliers": ["/pos/fournisseurs"],
      "view-tickets": ["/pos/tickets", "/pos/qr"],
      "view-fiscal": ["/pos/fiscalite", "/pos/fiscalité", "/pos/api"],
      "view-holding": ["/pos/holding", "/pos/kyc"]
    };

    Object.keys(viewMap).forEach(function (viewId) {
      var el = document.getElementById(viewId);
      if (!el) return;
      var matched = viewMap[viewId].some(function (tok) {
        return route.indexOf(tok) !== -1;
      });
      el.style.display = matched ? "block" : "none";
    });

    if (typeof window.cheerRenderStockIngredients === "function") {
      window.cheerRenderStockIngredients();
    }
    if (typeof window.cheerRenderPnlAndTickets === "function") {
      window.cheerRenderPnlAndTickets();
    }
  }

  document.addEventListener("click", function (ev) {
    var navEl = ev.target && ev.target.closest ? ev.target.closest("button, a") : null;
    if (!navEl) return;
    var txt = (navEl.textContent || "").trim().toLowerCase();
    var routeByLabel = {
      "caisse": "#/POS/caisse",
      "p&l / z": "#/POS/pnl",
      "coûts": "#/POS/couts",
      "couts": "#/POS/couts",
      "factures": "#/POS/factures",
      "paie & charges": "#/POS/paie",
      "stocks / iot": "#/POS/stocks",
      "fournisseurs": "#/POS/fournisseurs",
      "tickets & qr": "#/POS/tickets",
      "fiscalité & api": "#/POS/fiscalite",
      "holding & kyc": "#/POS/holding"
    };
    if (routeByLabel[txt]) {
      window.location.hash = routeByLabel[txt];
      setTimeout(applyRouteVisibility, 30);
    }
  }, false);

  window.addEventListener("hashchange", applyRouteVisibility);
  document.addEventListener("DOMContentLoaded", applyRouteVisibility);
  setTimeout(applyRouteVisibility, 120);
})();
