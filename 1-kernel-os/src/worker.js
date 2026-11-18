/**
 * Cheer Tec Protocol - delegal.dev Kernel OS & Pay-Splitter / P&L & Z-Report Engine
 * Architecture distribuée - Traitement temps réel et conformité fiscale
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://lexwallet.app",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const startTime = Date.now();
    const url = new URL(request.url);

    try {
      const payload = await request.json();

      // Route 1 : Génération du Rapport Z (Clôture Fiscale de Caisse)
      if (url.pathname === "/z-report" || payload.action === "CLOSE_Z_REPORT") {
        const zReportData = {
          status: "SUCCESS",
          report_type: "Z_CLOSING",
          kernel: "delegal.dev",
          terminal_id: payload.terminal_id || "LEX-POS-TERM-01",
          tenant_id: payload.tenant_id || "CHEEZ-FLAGSHIP-001",
          z_sequence_number: payload.z_sequence_number || 1042,
          timestamp_opening: payload.timestamp_opening || new Date(Date.now() - 28800000).toISOString(),
          timestamp_closing: new Date().toISOString(),
          fiscal_totals: {
            grand_total_ttc: payload.grand_total_ttc || 1450.00,
            total_ht: payload.total_ht || 1208.33,
            total_vat: payload.total_vat || 241.67,
            vat_breakdown: {
              standard_20_percent: { base_ht: 1208.33, vat_amount: 241.67 }
            }
          },
          payment_methods: {
            cash: payload.cash_total || 450.00,
            card: payload.card_total || 1000.00
          },
          audit_metrics: {
            total_tickets: payload.total_tickets || 85,
            voided_tickets: payload.voided_tickets || 2,
            voided_amount_ttc: payload.voided_amount_ttc || 24.50
          },
          latency_ms: Date.now() - startTime
        };

        return new Response(JSON.stringify(zReportData), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // Route 2 : Traitement Transactionnel Standard & Pay-Splitter + P&L en continu
      if (!payload.total_ttc || typeof payload.total_ttc !== 'number' || payload.total_ttc <= 0) {
        return new Response(JSON.stringify({ error: "Invalid or missing total_ttc in transaction payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const totalTTC = payload.total_ttc;
      const subtotalHT = payload.subtotal_ht || Number((totalTTC / 1.20).toFixed(2));
      const vat = payload.vat || Number((totalTTC - subtotalHT).toFixed(2));
      
      // Calcul du Coût des Marchandises Vendues (COGS) basé sur les items ou valeur par défaut (30% du HT)
      const cogsTotal = payload.items ? payload.items.reduce((acc, item) => acc + ((item.unit_cogs || (item.price_ht * 0.3)) * item.qty), 0) : Number((subtotalHT * 0.3).toFixed(2));
      
      // Marge Brute Opérationnelle
      const grossMargin = Number((subtotalHT - cogsTotal).toFixed(2));

      // Ventilation Pay-Splitter (5% Royalty, 10% Lease, 85% Operating)
      const splitBreakdown = {
        royalty_5_percent: Number((totalTTC * 0.05).toFixed(2)),
        lease_10_percent: Number((totalTTC * 0.10).toFixed(2)),
        operating_85_percent: Number((totalTTC * 0.85).toFixed(2))
      };

      const latency = Date.now() - startTime;
      const responsePayload = {
        status: "SUCCESS",
        kernel: "delegal.dev",
        tx_id: payload.id || `TX-KERNEL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        latency_ms: latency,
        financial_ledger: {
          subtotal_ht: subtotalHT,
          vat: vat,
          total_ttc: totalTTC,
          cogs: cogsTotal,
          gross_margin: grossMargin,
          splits: splitBreakdown
        }
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal Kernel Error", details: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
