// Supabase Edge Function: expire-alerts
// Ejecutar cada 30 minutos vía Supabase Dashboard → Edge Functions → Schedule.
//
// Lógica:
//   1. Incidentes dinámicos (accidente, obras, corte_via, desvio):
//      desactivar si > 4h Y votos_up < 3.
//   2. Incidentes estáticos (bache, terreno): no tocar, solo viven por votación.
//   3. Alertas de hielo: desactivar si temperatura actual >= 5 °C.
//      Datos de Open-Meteo (gratuito, sin API key).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: Record<string, unknown> = {};

  // ── 1. Incidentes dinámicos ──────────────────────────────────────────────
  const DYNAMIC_TYPES = ["accidente", "obras", "corte_via", "desvio"];
  const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { error: dynErr, count: dynCount } = await supabase
    .from("route_alerts")
    .update({ is_active: false })
    .in("alert_type", DYNAMIC_TYPES)
    .eq("is_active", true)
    .lt("votes_up", 3)
    .lt("created_at", cutoff);

  if (dynErr) {
    console.error("[expire-alerts] dynamic:", dynErr.message);
    results.dynamic = { error: dynErr.message };
  } else {
    results.dynamic = { deactivated: dynCount ?? 0 };
  }

  // ── 2. Alertas de hielo — temperatura Open-Meteo ─────────────────────────
  const { data: iceAlerts, error: iceSelectErr } = await supabase
    .from("route_alerts")
    .select("id, latitude, longitude")
    .eq("alert_type", "hielo")
    .eq("is_active", true);

  if (iceSelectErr) {
    console.error("[expire-alerts] ice fetch:", iceSelectErr.message);
    results.ice = { error: iceSelectErr.message };
  } else {
    let iceDeactivated = 0;
    const iceErrors: string[] = [];

    for (const alert of iceAlerts ?? []) {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${alert.latitude}&longitude=${alert.longitude}&current=temperature_2m&forecast_days=1`,
        );
        if (!weatherRes.ok) continue;

        const weather = await weatherRes.json() as {
          current?: { temperature_2m?: number };
        };
        const temp = weather?.current?.temperature_2m;

        if (typeof temp === "number" && temp >= 5.0) {
          const { error: deactErr } = await supabase
            .from("route_alerts")
            .update({ is_active: false })
            .eq("id", alert.id);

          if (deactErr) {
            iceErrors.push(`${alert.id}: ${deactErr.message}`);
          } else {
            iceDeactivated++;
            console.log(`[expire-alerts] ice ${alert.id} desactivada (${temp}°C)`);
          }
        }
      } catch (e) {
        iceErrors.push(`${alert.id}: ${String(e)}`);
      }
    }

    results.ice = { checked: (iceAlerts ?? []).length, deactivated: iceDeactivated };
    if (iceErrors.length > 0) results.ice = { ...results.ice as object, errors: iceErrors };
  }

  console.log("[expire-alerts] done:", JSON.stringify(results));

  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { "Content-Type": "application/json" },
  });
});
