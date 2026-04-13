import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ADSB_BASE = "https://api.adsb.lol/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { callsigns = [], hexes = [] } = await req.json();

    const results = {};

    // Fetch by callsign
    await Promise.all(callsigns.map(async (cs) => {
      try {
        const r = await fetch(`${ADSB_BASE}/callsign/${encodeURIComponent(cs)}`, {
          headers: { "Accept": "application/json", "User-Agent": "MilTrackLive/1.0" }
        });
        if (!r.ok) return;
        const data = await r.json();
        const ac = data.ac?.[0];
        if (ac) results[cs.toUpperCase()] = ac;
      } catch {}
    }));

    // Fetch by hex for any not found by callsign
    await Promise.all(hexes.map(async ({ callsign, hex }) => {
      if (results[callsign?.toUpperCase()]) return; // already found
      try {
        const r = await fetch(`${ADSB_BASE}/hex/${encodeURIComponent(hex)}`, {
          headers: { "Accept": "application/json", "User-Agent": "MilTrackLive/1.0" }
        });
        if (!r.ok) return;
        const data = await r.json();
        const ac = data.ac?.[0];
        if (ac && callsign) results[callsign.toUpperCase()] = ac;
      } catch {}
    }));

    return Response.json({ results });
  } catch (error) {
    console.error("adsbEnrich error:", error.message);
    return Response.json({ results: {}, error: error.message }, { status: 200 });
  }
});