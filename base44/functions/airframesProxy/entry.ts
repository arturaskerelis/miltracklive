import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AIRFRAMES_BASE = "https://api.airframes.io";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type } = body; // "FTX" or "INI"

    if (!type || !["FTX", "INI"].includes(type)) {
      return Response.json({ error: "Invalid type. Must be FTX or INI." }, { status: 400 });
    }

    const textSearch = type === "FTX" ? "ftx/id" : "ini/id";
    const url = `${AIRFRAMES_BASE}/messages?text=${encodeURIComponent(textSearch)}&timeframe=last-week&exclude_errors=3&exclude_labels=_d,Q0&limit=100`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "MilTrackLive/1.0",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Airframes error ${response.status}:`, text.slice(0, 200));
      return Response.json({ messages: [], error: `Airframes returned ${response.status}` }, { status: 200 });
    }

    const data = await response.json();
    return Response.json({ messages: data.messages || data || [], total: data.total || 0 });

  } catch (error) {
    console.error("airframesProxy error:", error.message);
    return Response.json({ messages: [], error: error.message }, { status: 200 });
  }
});