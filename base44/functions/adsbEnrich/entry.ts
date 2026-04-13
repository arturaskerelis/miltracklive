import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADSB_BASE = "https://api.adsb.lol/v2";

async function adsbGet(path) {
  const r = await fetch(`${ADSB_BASE}${path}`, {
    headers: { "Accept": "application/json", "User-Agent": "MilTrackLive/1.0" }
  });
  if (!r.ok) return null;
  return r.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { callsigns = [] } = await req.json();

    if (callsigns.length === 0) {
      return Response.json({ results: {} });
    }

    // Primary: fetch ALL military aircraft in one request via /v2/mil
    const milData = await adsbGet("/mil");
    const results = {};

    if (milData?.ac) {
      const callsignSet = new Set(callsigns.map(c => c.trim().toUpperCase()));
      for (const ac of milData.ac) {
        const flight = ac.flight?.trim().toUpperCase();
        const hex = ac.hex?.toUpperCase();
        // Match by callsign or hex
        if (flight && callsignSet.has(flight)) {
          results[flight] = ac;
        } else if (hex) {
          // Try matching hex against provided callsigns list (hex passed as callsign entry)
          for (const cs of callsigns) {
            if (cs.toUpperCase() === hex && !results[cs.toUpperCase()]) {
              results[cs.toUpperCase()] = ac;
            }
          }
        }
      }
    }

    // Fallback: for any callsigns still not found, try individual /v2/callsign/ lookups
    const missing = callsigns.filter(cs => !results[cs.toUpperCase()]);
    if (missing.length > 0) {
      await Promise.all(missing.map(async (cs) => {
        try {
          const data = await adsbGet(`/callsign/${encodeURIComponent(cs.trim())}`);
          const ac = data?.ac?.[0];
          if (ac) results[cs.toUpperCase()] = ac;
        } catch {}
      }));
    }

    return Response.json({ results });
  } catch (error) {
    console.error("adsbEnrich error:", error.message);
    return Response.json({ results: {}, error: error.message }, { status: 200 });
  }
});