/* Module alimente : 2-pos-edge/modules/router.js (rendu de chaque vue module POS) */
(function () {
  "use strict";

  window.cheerRenderModuleContent = function (key, container) {
    if (!container) return;
    var ledger = { sales: [], ingredient_movements: [] };
    try {
      ledger = JSON.parse(localStorage.getItem("cheer_pos_ledger_v163") || '{"sales":[],"ingredient_movements":[]}');
    } catch (e) {}

    var sales = ledger.sales || [];
    var movs = ledger.ingredient_movements || [];
    var caTtc = sales.reduce(function (s, x) { return s + Number(x.total_ttc || 0); }, 0);
    var caHt = Number((caTtc / 1.21).toFixed(2));
    var charges28 = Number((caHt * 0.28).toFixed(2));

    if (key === "p&l / z") {
      container.innerHTML =
        "<div>Ventes validées : <strong>" + sales.length + "</strong></div>" +
        "<div>Chiffre d'affaires TTC : <strong>" + caTtc.toFixed(2) + " €</strong></div>" +
        "<div>Chiffre d'affaires HT : <strong>" + caHt.toFixed(2) + " €</strong></div>" +
        "<div>Charges estimées (28%) : <strong>" + charges28.toFixed(2) + " €</strong></div>";
      return;
    }

    if (key === "stocks / iot") {
      container.innerHTML =
        "<div style='margin-bottom:8px;'>Mouvements ingrédients enregistrés : <strong>" + movs.length + "</strong></div>" +
        (movs.length
          ? movs.slice(0, 12).map(function (m) {
              return "<div style='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(148,163,184,0.14);'>" +
                "<span>" + m.ingredient + " (" + m.txId + ")</span><strong>" + m.delta + " " + m.unit + "</strong></div>";
            }).join("")
          : "<div style='color:#94a3b8;'>Aucun mouvement ingrédient pour le moment.</div>");
      return;
    }

    if (key === "tickets & qr") {
      container.innerHTML =
        "<div style='margin-bottom:8px;'>Tickets émis : <strong>" + sales.length + "</strong></div>" +
        (sales.length
          ? sales.slice(0, 12).map(function (s) {
              return "<div style='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(148,163,184,0.14);'>" +
                "<span><strong>" + s.id + "</strong> • " + new Date(s.timestamp).toLocaleString("fr-FR") + "</span>" +
                "<strong>" + Number(s.total_ttc || 0).toFixed(2) + " € TTC</strong></div>";
            }).join("")
          : "<div style='color:#94a3b8;'>Aucun ticket enregistré.</div>");
      return;
    }

    if (key === "holding & kyc") {
      container.innerHTML =
        "<div>Entité : <strong>CHEER-FLAGSHIP-01 (Cheer Flagship Bruxelles)</strong></div>" +
        "<div>Administrateur : <strong>cbltec@proton.me</strong></div>" +
        "<div>Statut KYC / Holding : <strong>Actif</strong></div>";
      return;
    }

    container.innerHTML =
      "<div>Module <strong>" + key.toUpperCase() + "</strong> actif • Point de vente : <strong>CHEER-FLAGSHIP-01</strong> • Transactions : <strong>" + sales.length + "</strong></div>";
  };
})();
