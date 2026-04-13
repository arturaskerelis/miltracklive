import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const r = await fetch("https://api.adsb.lol/v2/mil", {
      headers: { "Accept": "application/json", "User-Agent": "MilTrackLive/1.0" }
    });

    if (!r.ok) {
      return Response.json({ aircraft: [], error: `adsb.lol returned ${r.status}` });
    }

    const data = await r.json();
    // Only return aircraft with valid positions
    const aircraft = (data.ac || []).filter(ac => ac.lat != null && ac.lon != null);
    return Response.json({ aircraft, total: aircraft.length });
  } catch (error) {
    console.error("adsbAllMil error:", error.message);
    return Response.json({ aircraft: [], error: error.message });
  }
});