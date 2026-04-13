import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AIRFRAMES_BASE = "https://api.airframes.io";

Deno.serve(async () => {
  try {
    const apiKey = Deno.env.get("AIRFRAMES_API_KEY");
    const headers = {
      "Accept": "application/json",
      "User-Agent": "MilTrackLive/1.0",
    };
    if (apiKey) headers["X-Api-Key"] = apiKey;

    const url = `${AIRFRAMES_BASE}/messages?text=${encodeURIComponent("ini/id")}&timeframe=last-week&exclude_errors=3&exclude_labels=_d,Q0&limit=1`;
    const response = await fetch(url, { headers });
    const data = await response.json();
    const first = data.messages?.[0] || null;

    return Response.json({ first });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});