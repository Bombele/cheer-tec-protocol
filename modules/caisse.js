(() => {
  "use strict";

  const CATALOG = Object.freeze([
    {
      sku: "GC-CLASSIC-01",
      name: "Grilled Cheese Classique affiné",
      category: "Signature",
      unitPrice: 7.5,
      unitCost: 1.95,
      vatRate: 0.12,
      ingredients: [
        { item: "pain_mie_beurre", qty: 1.0 },
        { item: "cheddar_mature", qty: 0.11 },
        { item: "comte_18m", qty: 0.05 }
      ]
    },
    {
      sku: "GC-TRUFFE-02",
      name: "Grilled Cheese Truffe & Brie",
      category: "Signature",
      unitPrice: 9.8,
      unitCost: 2.65,
      vatRate: 0.12,
      ingredients: [
        { item: "pain_mie_beurre", qty: 1.0 },
        { item: "brie_fermier", qty: 0.12 },
        { item: "creme_truffe", qty: 0.025 }
      ]
    },
    {
      sku: "GC-JAMBON-03",
      name: "Grilled Cheese Jambon Serrano & Gouda",
      category: "Salé",
      unitPrice: 8.9,
      unitCost: 2.35,
      vatRate: 0.12,
      ingredients: [
        { item: "pain_mie_beurre", qty: 1.0 },
        { item: "gouda_vieux", qty: 0.11 },
        { item: "serrano_14m", qty: 0.05 }
      ]
    },
    {
      sku: "SAUCE-CROSS-01",
      name: "Sauce Matrice Cross-Utilisée (Moutarde Miel / Piment)",
      category: "Sauce",
      unitPrice: 1.5,
      unitCost: 0.32,
      vatRate: 0.12,
      ingredients: [
        { item: "sauce_matrice_base", qty: 0.06 }
      ]
    },
    {
      sku: "WINE-GLASS-01",
      name: "Verre de Vin Sélection Soirée (125 ml)",
      category: "Soirée Vin & Fromage",
      unitPrice: 6.2,
      unitCost: 1.45,
      vatRate: 0.21,
      ingredients: [
        { item: "vin_maison_bouteille", qty: 0.1667 }
      ]
    }
  ]);

  const MAX_TICKETS_STORED = 300;
  const MAX_RENDERED_TICKETS = 15;
  const RENT_CAP_RATIO = 0.07;

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function formatMoney(amount, currency) {
    return `${roundMoney(amount).toFixed(2)} ${currency || "EUR"}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function computeTicketTotals(cartMap) {
    let subtotalHt = 0;
    let totalVat = 0;
    let totalTtc = 0;
    let totalCost = 0;
    const lines = [];

    cartMap.forEach((qty, sku) => {
      const product = CATALOG.find((item) => item.sku === sku);
      if (!product || qty <= 0) return;

      const lineTtc = roundMoney(product.unitPrice * qty);
      const lineHt = roundMoney(lineTtc / (1 + product.vatRate));
      const lineVat = roundMoney(lineTtc - lineHt);
      const lineCost = roundMoney(product.unitCost * qty);

      subtotalHt = roundMoney(subtotalHt + lineHt);
      totalVat = roundMoney(totalVat + lineVat);
      totalTtc = roundMoney(totalTtc + lineTtc);
      totalCost = roundMoney(totalCost + lineCost);

      lines.push({
        sku: product.sku,
        name: product.name,
        category: product.category,
        qty,
        unitPrice: product.unitPrice,
        vatRate: product.vatRate,
        lineHt,
        lineVat,
        lineTtc,
        lineCost,
        ingredients: product.ingredients.map((ing) => ({
          item: ing.item,
          qty: roundMoney(ing.qty * qty)
        }))
      });
    });

    const grossMargin = roundMoney(totalHt - totalCost);
    const rentCapReserve = roundMoney(totalTtc * RENT_CAP_RATIO);

    return {
      lines,
      subtotalHt,
      totalVat,
      totalTtc,
      totalCost,
      grossMargin,
      rentCapReserve
    };
  }

  function buildQrPayload(ticket) {
    const raw = `${ticket.ticketId}|${ticket.tenantId}|${ticket.totalTtc.toFixed(2)}|${ticket.currency}|${ticket.createdAt}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const checksum = (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
    return `LWQR:${ticket.ticketId}:${ticket.tenantId}:${ticket.totalTtc.toFixed(2)}${ticket.currency}:${checksum}`;
  }

  function mount(mountRoot, ctx) {
    const state = {
      tenant: ctx.tenant,
      session: ctx.session,
      cart: new Map(),
      paymentMethod: "CARD",
      lastTicket: null
    };

    const ticketsKey = `lexwallet_pos_tickets_v4_${state.tenant.id}`;
    const stockKey = `lexwallet_pos_stock_v4_${state.tenant.id}`;

    function getTickets() {
      const list = ctx.storage.read(ticketsKey, []);
      return Array.isArray(list) ? list : [];
    }

    function saveTickets(list) {
      const trimmed = list.slice(-MAX_TICKETS_STORED);
      ctx.storage.write(ticketsKey, trimmed);
    }

    function render() {
      const totals = computeTicketTotals(state.cart);
      const tickets = getTickets();
      const currency = state.tenant.currency;
      const operatorLabel = state.session ? `${state.session.email} (${state.session.role})` : "Invité local";

      mountRoot.innerHTML = `
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs">
            <div>
              <span class="text-slate-400">Point Zéro actif :</span>
              <strong class="text-amber-300 font-mono">${escapeHtml(state.tenant.id)}</strong>
              <span class="text-slate-500">• Opérateur : ${escapeHtml(operatorLabel)}</span>
            </div>
            <div class="text-emerald-400 font-mono">
              Tickets journalisés : ${tickets.length} | Plafond loyer cible : 7.0%
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div class="lg:col-span-7 space-y-3">
              <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Catalogue Cheer Cheese &amp; Soirée</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${CATALOG.map((item) => {
                  const inCart = state.cart.get(item.sku) || 0;
                  return `
                    <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-3">
                      <div>
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-blue-300 border border-slate-700">${escapeHtml(item.category)}</span>
                          <span class="text-xs font-mono text-slate-400">${escapeHtml(item.sku)}</span>
                        </div>
                        <div class="text-sm font-semibold text-white mt-2">${escapeHtml(item.name)}</div>
                        <div class="text-xs text-slate-400 mt-1">TVA : ${Math.round(item.vatRate * 100)}% • Coût matière : ${formatMoney(item.unitCost, currency)}</div>
                      </div>
                      <div class="flex items-center justify-between pt-2 border-t border-slate-900">
                        <span class="text-sm font-bold text-amber-300">${formatMoney(item.unitPrice, currency)}</span>
                        <div class="flex items-center gap-2">
                          ${
                            inCart > 0
                              ? `<span class="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/15 text-amber-300">x${inCart}</span>`
                              : ""
                          }
                          <button type="button" data-add-sku="${escapeHtml(item.sku)}" class="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300 transition">
                            + Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 class="text-sm font-semibold text-white">Panier &amp; Encaissement</h3>
                  <button type="button" id="btn-clear-cart" class="text-xs text-rose-400 hover:text-rose-300">Vider</button>
                </div>

                ${
                  totals.lines.length === 0
                    ? '<div class="text-xs text-slate-500 py-6 text-center">Aucun article dans le panier.</div>'
                    : `<div class="space-y-2 max-h-56 overflow-y-auto pr-1">${totals.lines
                        .map(
                          (line) => `
                          <div class="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800/80 rounded-lg px-3 py-2 text-xs">
                            <div class="min-w-0">
                              <div class="text-white font-medium truncate">${escapeHtml(line.name)}</div>
                              <div class="text-slate-400 font-mono">${line.qty} × ${formatMoney(line.unitPrice, currency)}</div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                              <button type="button" data-dec-sku="${escapeHtml(line.sku)}" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">-</button>
                              <span class="font-mono text-amber-300 w-5 text-center">${line.qty}</span>
                              <button type="button" data-inc-sku="${escapeHtml(line.sku)}" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">+</button>
                              <span class="font-semibold text-white ml-1">${formatMoney(line.lineTtc, currency)}</span>
                            </div>
                          </div>
                        `
                        )
                        .join("")}</div>`
                }

                <div class="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                  <div class="flex justify-between text-slate-400">
                    <span>Sous-total HT</span>
                    <span class="font-mono">${formatMoney(totals.subtotalHt, currency)}</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>TVA collectée</span>
                    <span class="font-mono">${formatMoney(totals.totalVat, currency)}</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>Marge brute estimée (HT - Matière)</span>
                    <span class="font-mono text-emerald-400">${formatMoney(totals.grossMargin, currency)}</span>
                  </div>
                  <div class="flex justify-between text-slate-400">
                    <span>Réserve loyer max (7%)</span>
                    <span class="font-mono text-blue-300">${formatMoney(totals.rentCapReserve, currency)}</span>
                  </div>
                  <div class="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800">
                    <span>Total TTC</span>
                    <span class="font-mono text-amber-300">${formatMoney(totals.totalTtc, currency)}</span>
                  </div>
                </div>

                <div>
                  <label for="pos-payment-method" class="block text-xs text-slate-400 mb-1">Mode de règlement</label>
                  <select id="pos-payment-method" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
                    <option value="CARD" ${state.paymentMethod === "CARD" ? "selected" : ""}>Carte / Contactless / QR</option>
                    <option value="CASH" ${state.paymentMethod === "CASH" ? "selected" : ""}>Espèces (Cash)</option>
                    <option value="TRANSFER" ${state.paymentMethod === "TRANSFER" ? "selected" : ""}>Virement / Wallet Lex</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                id="btn-checkout-ticket"
                ${totals.lines.length === 0 ? "disabled" : ""}
                class="w-full py-2.5 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wide hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Encaisser &amp; Émettre Ticket + QR
              </button>
            </div>
          </div>

          ${
            state.lastTicket
              ? `
              <div class="bg-emerald-950/35 border border-emerald-700/60 rounded-xl p-4 space-y-1.5 text-xs">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-semibold text-emerald-300">Ticket validé : ${escapeHtml(state.lastTicket.ticketId)}</span>
                  <span class="font-mono text-amber-300">${formatMoney(state.lastTicket.totalTtc, state.lastTicket.currency)}</span>
                </div>
                <div class="font-mono text-slate-300 break-all">QR Payload : ${escapeHtml(state.lastTicket.qrPayload)}</div>
                <div class="text-slate-400">Événements émis sur le bus : pos:ticket_created, stock:consumption_recorded, ledger:sale_posted, qr:ticket_issued.</div>
              </div>
            `
              : ""
          }

          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Derniers tickets émis (${state.tenant.id})</div>
            ${
              tickets.length === 0
                ? '<div class="text-xs text-slate-500">Aucun ticket enregistré pour cet établissement.</div>'
                : `<div class="overflow-x-auto"><table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-400">
                        <th class="py-2 pr-3">Ticket</th>
                        <th class="py-2 pr-3">Heure</th>
                        <th class="py-2 pr-3">Paiement</th>
                        <th class="py-2 pr-3">HT</th>
                        <th class="py-2 pr-3">TVA</th>
                        <th class="py-2">TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tickets
                        .slice(-MAX_RENDERED_TICKETS)
                        .reverse()
                        .map(
                          (t) => `
                          <tr class="border-b border-slate-900 text-slate-200">
                            <td class="py-2 pr-3 font-mono text-amber-300">${escapeHtml(t.ticketId)}</td>
                            <td class="py-2 pr-3 font-mono text-slate-400">${escapeHtml(String(t.createdAt).slice(11, 19))}</td>
                            <td class="py-2 pr-3">${escapeHtml(t.paymentMethod)}</td>
                            <td class="py-2 pr-3 font-mono">${formatMoney(t.subtotalHt, t.currency)}</td>
                            <td class="py-2 pr-3 font-mono">${formatMoney(t.totalVat, t.currency)}</td>
                            <td class="py-2 font-mono font-semibold">${formatMoney(t.totalTtc, t.currency)}</td>
                          </tr>
                        `
                        )
                        .join("")}
                    </tbody>
                  </table></div>`
            }
          </div>
        </div>
      `;

      bindEvents();
    }

    function adjustSku(sku, delta) {
      const current = state.cart.get(sku) || 0;
      const next = current + delta;
      if (next <= 0) {
        state.cart.delete(sku);
      } else {
        state.cart.set(sku, next);
      }
      render();
    }

    function checkoutTicket() {
      const totals = computeTicketTotals(state.cart);
      if (totals.lines.length === 0) return;

      const now = new Date().toISOString();
      const seq = String(getTickets().length + 1).padStart(4, "0");
      const ticketId = `TCK-${state.tenant.country}-${seq}-${Date.now().toString().slice(-4)}`;

      const ticket = {
        ticketId,
        tenantId: state.tenant.id,
        currency: state.tenant.currency,
        paymentMethod: state.paymentMethod,
        operatorEmail: state.session ? state.session.email : "guest@local",
        createdAt: now,
        ...totals
      };
      ticket.qrPayload = buildQrPayload(ticket);

      const updatedTickets = [...getTickets(), ticket];
      saveTickets(updatedTickets);

      const consumptionMap = {};
      totals.lines.forEach((line) => {
        line.ingredients.forEach((ing) => {
          consumptionMap[ing.item] = roundMoney((consumptionMap[ing.item] || 0) + ing.qty);
        });
      });

      const currentStockLedger = ctx.storage.read(stockKey, { movements: [] });
      const movements = Array.isArray(currentStockLedger.movements) ? currentStockLedger.movements : [];
      movements.push({
        ticketId: ticket.ticketId,
        createdAt: now,
        consumption: consumptionMap
      });
      ctx.storage.write(stockKey, {
        lastUpdatedAt: now,
        movements: movements.slice(-MAX_TICKETS_STORED)
      });

      state.lastTicket = ticket;
      state.cart.clear();

      ctx.bus.emit("pos:ticket_created", { ticket });
      ctx.bus.emit("stock:consumption_recorded", {
        ticketId: ticket.ticketId,
        consumption: consumptionMap
      });
      ctx.bus.emit("ledger:sale_posted", {
        ticketId: ticket.ticketId,
        subtotalHt: ticket.subtotalHt,
        totalVat: ticket.totalVat,
        totalTtc: ticket.totalTtc,
        totalCost: ticket.totalCost,
        grossMargin: ticket.grossMargin,
        rentCapReserve: ticket.rentCapReserve,
        paymentMethod: ticket.paymentMethod,
        currency: ticket.currency
      });
      ctx.bus.emit("qr:ticket_issued", {
        ticketId: ticket.ticketId,
        qrPayload: ticket.qrPayload,
        totalTtc: ticket.totalTtc,
        currency: ticket.currency,
        createdAt: now
      });

      render();
    }

    function bindEvents() {
      mountRoot.querySelectorAll("[data-add-sku]").forEach((btn) => {
        btn.addEventListener("click", () => adjustSku(btn.getAttribute("data-add-sku"), 1));
      });

      mountRoot.querySelectorAll("[data-inc-sku]").forEach((btn) => {
        btn.addEventListener("click", () => adjustSku(btn.getAttribute("data-inc-sku"), 1));
      });

      mountRoot.querySelectorAll("[data-dec-sku]").forEach((btn) => {
        btn.addEventListener("click", () => adjustSku(btn.getAttribute("data-dec-sku"), -1));
      });

      const btnClearCart = mountRoot.querySelector("#btn-clear-cart");
      if (btnClearCart) {
        btnClearCart.addEventListener("click", () => {
          state.cart.clear();
          render();
        });
      }

      const paymentSelect = mountRoot.querySelector("#pos-payment-method");
      if (paymentSelect) {
        paymentSelect.addEventListener("change", (e) => {
          state.paymentMethod = e.target.value;
        });
      }

      const btnCheckout = mountRoot.querySelector("#btn-checkout-ticket");
      if (btnCheckout) {
        btnCheckout.addEventListener("click", checkoutTicket);
      }
    }

    const unsubscribe = ctx.bus.subscribe((envelope) => {
      if (envelope.type === "shell:tenant_changed" && envelope.payload && envelope.payload.tenant) {
        state.tenant = envelope.payload.tenant;
        state.cart.clear();
        state.lastTicket = null;
        render();
      } else if (envelope.type === "shell:session_changed") {
        state.session = envelope.payload ? envelope.payload.session : null;
        render();
      }
    });

    render();

    return {
      unmount() {
        unsubscribe();
        mountRoot.innerHTML = "";
      }
    };
  }

  window.LexWalletModules = window.LexWalletModules || {};
  window.LexWalletModules.caisse = Object.freeze({
    id: "caisse",
    version: "4.0.0-point-zero",
    mount
  });
})();
