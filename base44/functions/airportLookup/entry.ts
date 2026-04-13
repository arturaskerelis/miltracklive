Deno.serve(async (req) => {
  try {
    const { codes = [] } = await req.json();
    const normalizedCodes = [...new Set((codes || []).map((code) => String(code || '').trim().toUpperCase()).filter(Boolean))];

    if (normalizedCodes.length === 0) {
      return Response.json({ airports: {} });
    }

    const cacheUrl = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
    const cacheKey = 'miltrack-airports-cache-v1';
    const cachePath = `/tmp/${cacheKey}.csv`;
    const metaPath = `/tmp/${cacheKey}.json`;
    const cacheMaxAgeMs = 1000 * 60 * 60 * 24 * 7;

    let csv = null;

    try {
      const metaRaw = await Deno.readTextFile(metaPath);
      const meta = JSON.parse(metaRaw);
      const isFresh = meta.cachedAt && (Date.now() - meta.cachedAt < cacheMaxAgeMs);
      if (isFresh) {
        csv = await Deno.readTextFile(cachePath);
      }
    } catch {
      // cache miss, continue to network fetch
    }

    if (!csv) {
      const response = await fetch(cacheUrl);
      if (!response.ok) {
        return Response.json({ airports: {}, error: `Airport source returned ${response.status}` }, { status: 200 });
      }

      csv = await response.text();
      await Deno.writeTextFile(cachePath, csv);
      await Deno.writeTextFile(metaPath, JSON.stringify({ cachedAt: Date.now() }));
    }

    const rows = csv.split(/\r?\n/);
    const requestedCodes = new Set(normalizedCodes);
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

      if (gpsCode && requestedCodes.has(gpsCode) && !airports[gpsCode]) {
        airports[gpsCode] = [latitude, longitude];
      }

      if (iataCode && requestedCodes.has(iataCode) && !airports[iataCode]) {
        airports[iataCode] = [latitude, longitude];
      }

      if (Object.keys(airports).length === normalizedCodes.length) break;
    }

    return Response.json({ airports });
  } catch (error) {
    return Response.json({ airports: {}, error: error.message }, { status: 200 });
  }
});