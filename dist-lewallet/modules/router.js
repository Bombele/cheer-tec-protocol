/* Module alimente : 2-pos-edge/index.html (navigation et affichage actif de chaque module POS) */
(function () {
  "use strict";

  var MODULES = {
    "caisse": { hash: "#/POS/caisse", title: "Caisse POS • CHEER-FLAGSHIP-01", isCaisse: true },
    "p&l / z": { hash: "#/POS/pnl", title: "P&L / Clôture Z • CHEER-FLAGSHIP-01", isCaisse: false },
    "coûts": { hash: "#/POS/couts", title: "Structure des Coûts • CHEER-FLAGSHIP-01", isCaisse: false },
    "couts": { hash: "#/POS/couts", title: "Structure des Coûts • CHEER-FLAGSHIP-01", isCaisse: false },
    "factures": { hash: "#/POS/factures", title: "Factures & Achats • CHEER-FLAGSHIP-01", isCaisse: false },
    "paie & charges": { hash: "#/POS/paie", title: "Paie & Charges (28%) • CHEER-FLAGSHIP-01", isCaisse: false },
    "stocks / iot": { hash: "#/POS/stocks", title: "Stocks / IoT & Ingrédients • CHEER-FLAGSHIP-01", isCaisse: false },
    "fournisseurs": { hash: "#/POS/fournisseurs", title: "Fournisseurs & Approvisionnement • CHEER-FLAGSHIP-01", isCaisse: false },
    "tickets & qr": { hash: "#/POS/tickets", title: "Tickets Clients & Codes QR • CHEER-FLAGSHIP-01", isCaisse: false },
    "fiscalité & api": { hash: "#/POS/fiscalite", title: "Fiscalité BE (21%/6%) & API • CHEER-FLAGSHIP-01", isCaisse: false },
    "holding & kyc": { hash: "#/POS/holding", title: "Holding CBL TEC & KYC (cbltec@proton.me)", isCaisse: false }
  };

  function getActiveKeyFromHash() {
    var h = String(window.location.hash || "#/POS/caisse").toLowerCase();
    if (h.indexOf("/pos/pnl") !== -1 || h.indexOf("/pos/z") !== -1) return "p&l / z";
    if (h.indexOf("/pos/couts") !== -1 || h.indexOf("/pos/coûts") !== -1) return "coûts";
    if (h.indexOf("/pos/factures") !== -1) return "factures";
    if (h.indexOf("/pos/paie") !== -1 || h.indexOf("/pos/charges") !== -1) return "paie & charges";
    if (h.indexOf("/pos/stocks") !== -1 || h.indexOf("/pos/stock") !== -1 || h.indexOf("/pos/iot") !== -1) return "stocks / iot";
    if (h.indexOf("/pos/fournisseurs") !== -1) return "fournisseurs";
    if (h.indexOf("/pos/tickets") !== -1 || h.indexOf("/pos/qr") !== -1) return "tickets & qr";
    if (h.indexOf("/pos/fiscalite") !== -1 || h.indexOf("/pos/fiscalité") !== -1 || h.indexOf("/pos/api") !== -1) return "fiscalité & api";
    if (h.indexOf("/pos/holding") !== -1 || h.indexOf("/pos/kyc") !== -1) return "holding & kyc";
    return "caisse";
  }

  function ensureStage() {
    var stage = document.getElementById("cc-v164-module-stage");
    if (stage) return stage;
    stage = document.createElement("div");
    stage.id = "cc-v164-module-stage";
    stage.style.cssText = "display:none;margin:14px 0;padding:14px;border-radius:12px;background:#0f172a;border:1px solid rgba(56,189,248,0.4);color:#f8fafc;font-size:13px;";
    var anchor = document.getElementById("cheer-menu-v11-host");
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(stage, anchor);
    } else {
      document.body.appendChild(stage);
    }
    return stage;
  }

  function renderActiveModule(forceKey) {
    var key = forceKey || getActiveKeyFromHash();
    var meta = MODULES[key] || MODULES["caisse"];
    var stage = ensureStage();

    var host = document.getElementById("cheer-menu-v11-host");
    if (host) host.style.display = meta.isCaisse ? "" : "none";

    var dupA = document.getElementById("cc-v162-live-box");
    var dupB = document.getElementById("cc-v163-live-box");
    if (dupA) dupA.remove();
    if (dupB) dupB.remove();

    document.querySelectorAll("button, a, div, span").forEach(function (el) {
      if (el.children.length === 0 && el.textContent && el.textContent.indexOf("Route active :") === 0) {
        el.textContent = "Route active : https://lexwallet.app" + meta.hash;
      }
    });

    if (meta.isCaisse) {
      stage.style.display = "none";
      return;
    }

    stage.style.display = "block";
    stage.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,0.2);padding-bottom:8px;margin-bottom:10px;">' +
        '<strong>' + meta.title + '</strong>' +
        '<button type="button" id="cc-v164-back-caisse" style="padding:5px 10px;border-radius:7px;border:none;background:#16a34a;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">Retour Caisse</button>' +
      '</div>' +
      '<div id="cc-v164-module-body"></div>';

    var backBtn = document.getElementById("cc-v164-back-caisse");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        window.location.hash = "#/POS/caisse";
        renderActiveModule("caisse");
      });
    }

    if (typeof window.cheerRenderModuleContent === "function") {
      window.cheerRenderModuleContent(key, document.getElementById("cc-v164-module-body"));
    }
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("button, a") : null;
    if (!btn) return;
    var label = (btn.textContent || "").trim().toLowerCase();
    if (MODULES[label]) {
      ev.preventDefault();
      window.location.hash = MODULES[label].hash;
      renderActiveModule(label);
    }
  }, false);

  window.addEventListener("hashchange", function () {
    renderActiveModule();
  });

  document.addEventListener("DOMContentLoaded", function () {
    renderActiveModule();
  });
  setTimeout(function () {
    renderActiveModule();
  }, 150);
})();
