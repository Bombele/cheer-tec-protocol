/**
 * Cheer Tec Protocol - delegal.dev Kernel OS & Pay-Splitter
 * Exécution atomique des flux financiers (<400ms)
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

    try {
      const payload = await request.json();

      if (!payload.total_ttc || typeof payload.total_ttc !== 'number' || payload.total_ttc <= 0) {
        return new Response(JSON.stringify({ error: "Invalid or missing total_ttc in transaction payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      const totalTTC = payload.total_ttc;
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
        total_ttc: totalTTC,
        split_breakdown: splitBreakdown
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
