import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AIRFRAMES_URLS = {
  FTX: "https://app.airframes.io/messages/historical?text=ftx/id&timeframe=last-week&exclude_labels=_d,Q0&exclude_errors=3&action=execute",
  INI: "https://app.airframes.io/messages/historical?text=ini/id&timeframe=last-week&exclude_labels=_d,Q0&exclude_errors=3&action=execute",
};

Deno.serve(async (req) => {
  try {

    const body = await req.json();
    const { type } = body; // "FTX" or "INI"

    if (!type || !["FTX", "INI"].includes(type)) {
      return Response.json({ error: "Invalid type. Must be FTX or INI." }, { status: 400 });
    }

    const url = AIRFRAMES_URLS[type];

    const headers = {
      "Accept": "application/json",
      "User-Agent": "MilTrackLive/1.0",
    };

    const response = await fetch(url, { headers });

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