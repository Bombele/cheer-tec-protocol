/* Module alimente : 2-pos-edge/index.html et 2-pos-edge/modules/pnl-tickets.js (mouvements stock par ingredient) */
(function () {
  "use strict";

  var BOM_BY_SKU = {
    "CC-BURG-01": [
      { ing: "Pain brioche", qty: 1, unit: "pcs" },
      { ing: "Steak boeuf charolais", qty: 150, unit: "g" },
      { ing: "Cheddar affine", qty: 40, unit: "g" },
      { ing: "Sauce BBQ Smokey", qty: 25, unit: "g" }
    ],
    "CC-BURG-02": [
      { ing: "Pain brioche", qty: 1, unit: "pcs" },
      { ing: "Steak boeuf charolais", qty: 150, unit: "g" },
      { ing: "Fromage a raclette", qty: 50, unit: "g" }
    ],
    "CC-SID-01": [
      { ing: "Pommes de terre fraiches", qty: 180, unit: "g" },
      { ing: "Huile de friture", qty: 20, unit: "ml" }
    ],
    "CC-BOI-01": [
      { ing: "Limonade artisanale", qty: 330, unit: "ml" }
    ]
  };

  function expandSaleToIngredients(sale) {
    var rows = [];
    (sale.items || []).forEach(function (it) {
      var q = Number(it.qty || 1);
      var recipe = BOM_BY_SKU[it.sku] || [{ ing: "Matiere premiere (" + it.sku + ")", qty: 1, unit: "u" }];
      recipe.forEach(function (r) {
        rows.push({
          txId: sale.id,
          sku: it.sku,
          ingredient: r.ing,
          delta: -(Number(r.qty || 0) * q),
          unit: r.unit,
          ts: sale.timestamp
        });
      });
    });
    return rows;
  }

  window.cheerRenderStockIngredients = function () {
    var ledger = { sales: [], ingredient_movements: [] };
    try {
      ledger = JSON.parse(localStorage.getItem("cheer_pos_ledger_v163") || '{"sales":[],"ingredient_movements":[]}');
    } catch (e) {}

    var target = document.getElementById("view-stock") || document.getElementById("view-stocks") || document.getElementById("view-supply");
    if (!target) return;

    var box = document.getElementById("cc-v163-stock-ing-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "cc-v163-stock-ing-box";
      box.style.cssText = "margin:12px 0;padding:12px;border-radius:12px;background:#0f172a;border:1px solid rgba(148,163,184,0.3);color:#f8fafc;font-size:12px;";
      target.appendChild(box);
    }

    var movs = ledger.ingredient_movements || [];
    if (!movs.length) {
      box.innerHTML = "<strong>Stock & Ingrédients</strong> : aucun mouvement ingrédient enregistré.";
      return;
    }

    box.innerHTML = "<div style='margin-bottom:8px;'><strong>Sorties Stock par Ingrédient (" + movs.length + ")</strong></div>" +
      movs.slice(0, 12).map(function (m) {
        return "<div style='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(148,163,184,0.14);'>" +
          "<span><strong>" + m.ingredient + "</strong> (" + m.sku + " • " + m.txId + ")</span>" +
          "<span>" + m.delta + " " + m.unit + "</span></div>";
      }).join("");
  };

  window.addEventListener("cheer:sale_validated", function (ev) {
    var sale = ev && ev.detail ? ev.detail : null;
    if (!sale) return;
    try {
      var ledger = JSON.parse(localStorage.getItem("cheer_pos_ledger_v163") || '{"sales":[],"ingredient_movements":[],"pnl":[]}');
      ledger.sales.unshift(sale);
      var expanded = expandSaleToIngredients(sale);
      ledger.ingredient_movements = expanded.concat(ledger.ingredient_movements || []).slice(0, 300);
      localStorage.setItem("cheer_pos_ledger_v163", JSON.stringify(ledger));
    } catch (e) {}
    window.cheerRenderStockIngredients();
  });

  document.addEventListener("DOMContentLoaded", window.cheerRenderStockIngredients);
})();
