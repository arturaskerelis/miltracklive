Deno.serve(async (req) => {
  try {
    const { codes = [] } = await req.json();
    const normalizedCodes = [...new Set((codes || []).map((code) => String(code || '').trim().toUpperCase()).filter(Boolean))];

    if (normalizedCodes.length === 0) {
      return Response.json({ airports: {} });
    }

    const response = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv');
    if (!response.ok) {
      return Response.json({ airports: {}, error: `Airport source returned ${response.status}` }, { status: 200 });
    }

    const csv = await response.text();
    const rows = csv.split(/\r?\n/);
    const airports = {};

    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row) continue;

      const columns = row.match(/("(?:[^"]|"")*"|[^,]+)/g) || [];
      const gpsCode = (columns[10] || '').replace(/^"|"$/g, '').toUpperCase();
      const iataCode = (columns[13] || '').replace(/^"|"$/g, '').toUpperCase();
      const latitude = Number((columns[4] || '').replace(/^"|"$/g, ''));
      const longitude = Number((columns[5] || '').replace(/^"|"$/g, ''));

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

      if (gpsCode && normalizedCodes.includes(gpsCode) && !airports[gpsCode]) {
        airports[gpsCode] = [latitude, longitude];
      }

      if (iataCode && normalizedCodes.includes(iataCode) && !airports[iataCode]) {
        airports[iataCode] = [latitude, longitude];
      }

      if (Object.keys(airports).length === normalizedCodes.length) break;
    }

    return Response.json({ airports });
  } catch (error) {
    return Response.json({ airports: {}, error: error.message }, { status: 200 });
  }
});