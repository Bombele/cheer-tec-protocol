/* Module alimente : 2-pos-edge/modules/router.js et cheer_pos_ledger_v163 (mouvements stock par ingredient) */
(function () {
  "use strict";

  var BOM = {
    "CC-BURG-01": [
      { ing: "Pain brioche", qty: 1, unit: "pcs" },
      { ing: "Steak boeuf charolais", qty: 150, unit: "g" },
      { ing: "Cheddar affine", qty: 40, unit: "g" }
    ],
    "CC-SID-01": [
      { ing: "Pommes de terre fraiches", qty: 180, unit: "g" },
      { ing: "Huile de friture", qty: 20, unit: "ml" }
    ]
  };

  window.addEventListener("cheer:sale_validated", function (ev) {
    var sale = ev && ev.detail ? ev.detail : null;
    if (!sale) return;
    try {
      var ledger = JSON.parse(localStorage.getItem("cheer_pos_ledger_v163") || '{"sales":[],"ingredient_movements":[]}');
      ledger.sales.unshift(sale);
      var rows = [];
      (sale.items || []).forEach(function (it) {
        var rec = BOM[it.sku] || [{ ing: "Matiere premiere (" + it.name + ")", qty: Number(it.qty || 1), unit: "u" }];
        rec.forEach(function (r) {
          rows.push({ txId: sale.id, ingredient: r.ing, delta: -(Number(r.qty || 1) * Number(it.qty || 1)), unit: r.unit, ts: sale.timestamp });
        });
      });
      ledger.ingredient_movements = rows.concat(ledger.ingredient_movements || []).slice(0, 300);
      localStorage.setItem("cheer_pos_ledger_v163", JSON.stringify(ledger));
    } catch (e) {}
  });
})();
