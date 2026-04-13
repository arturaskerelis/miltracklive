// Airframes.io API — proxied through backend to avoid CORS
import { base44 } from '@/api/base44Client';

// Known military callsign prefixes / patterns
const MILITARY_CALLSIGNS = [
  "RCH", "PAT", "REACH", "EVAC", "DUKE", "DOOM", "VMGR", "ASCOT",
  "NAVY", "USMC", "USAF", "RAF", "SAM", "VENUS", "IRON", "BONE",
  "GHOST", "NIGHT", "HOOK", "VIPER", "EAGLE", "RAVEN",
];

function parseStructuredHeader(text = "", messageType = "FTX") {
  const match = text.trim().match(new RegExp(`${messageType}\\/ID([^,\\/]+),([^,\\/]+),`, 'i'));
  if (!match) return null;

  return {
    hex: match[1].trim().toUpperCase(),
    callsign: match[2].trim().toUpperCase(),
  };
}

function isMilitary(callsign) {
  if (!callsign) return false;
  const upper = callsign.toUpperCase();
  return MILITARY_CALLSIGNS.some((prefix) => upper.startsWith(prefix));
}

// Extract callsign string from message (API returns nested flight object)
function getCallsign(msg) {
  if (!msg) return '';
  if (msg.flight != null) {
    if (typeof msg.flight === 'object') {
      const nestedCallsign = msg.flight.flight || msg.flight.flightIcao || '';
      if (nestedCallsign) return nestedCallsign;
    } else if (String(msg.flight).trim()) {
      return String(msg.flight);
    }
  }

  const text = (msg.text || '').trim();
  const ftxHeader = parseStructuredHeader(text, 'FTX');
  if (ftxHeader?.callsign) return ftxHeader.callsign;

  const iniHeader = parseStructuredHeader(text, 'INI');
  if (iniHeader?.callsign) return iniHeader.callsign;

  return '';
}

function getHex(msg) {
  const text = (msg.text || '').trim();
  const ftxHeader = parseStructuredHeader(text, 'FTX');
  if (ftxHeader?.hex) return ftxHeader.hex;

  const iniHeader = parseStructuredHeader(text, 'INI');
  if (iniHeader?.hex) return iniHeader.hex;

  if (typeof msg.airframe === 'object' && msg.airframe !== null) {
    return msg.airframe.hex || msg.airframe.icaoHex || msg.airframe.icao || '';
  }
  return msg.hex || msg.icaoHex || msg.icao || msg.toHex || msg.fromHex || '';
}

function extractCallsignFromText(text) {
  const cleaned = (text || '').trim().toUpperCase();
  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean);

  const preferredToken = tokens.find((token) =>
    /^[A-Z]{2,8}\d{1,4}[A-Z]?$/.test(token) ||
    MILITARY_CALLSIGNS.some((prefix) => token.startsWith(prefix))
  );

  if (preferredToken) return preferredToken;

  const fallbackToken = tokens.find((token) => /^[A-Z0-9]{3,12}$/.test(token));
  return fallbackToken || '';
}

// Extract tail from message
function getTail(msg) {
  if (typeof msg.airframe === 'object' && msg.airframe !== null) {
    return msg.airframe.tail || '';
  }
  return msg.tail || '';
}

function getAircraftType(msg, text = '') {
  const acTypeMatch = text.match(/\/([A-Z][0-9A-Z]{2,5})\//) ||
    text.match(/\b(C17A?|C-17A?|C5M?|C-5M?|KC135|KC-135|KC10|KC-10|C130J?|C-130J?|B52H?|B-52H?|P8A?|P-8A?|A400M?|F16C?|F-16C?|E3|E-3|E8|E-8|RC135|RC-135|WC135|WC-135|707|727|737|747|757|767|777|MD11|DC10|L100)\b/i);
  return acTypeMatch?.[1]?.toUpperCase() || acTypeMatch?.[0]?.toUpperCase() || getTail(msg) || getHex(msg).toUpperCase() || "UNKNOWN";
}

function extractAirportPairFromRawINI(rawSource = "") {
  const normalized = rawSource.toUpperCase().replace(/\s+/g, '');

  const pairBeforeFinalSlash = normalized.match(/([A-Z]{4}),([A-Z]{4})(?=\/[^/]*$)/);
  if (pairBeforeFinalSlash) {
    return {
      departure: pairBeforeFinalSlash[1],
      destination: pairBeforeFinalSlash[2],
    };
  }

  const allPairs = [...normalized.matchAll(/([A-Z]{4}),([A-Z]{4})/g)];
  if (allPairs.length === 0) return null;

  for (let i = allPairs.length - 1; i >= 0; i -= 1) {
    const [, departure, destination] = allPairs[i];
    if (departure !== destination || allPairs.length === 1) {
      return { departure, destination };
    }
  }

  const [, departure, destination] = allPairs[allPairs.length - 1];
  return { departure, destination };
}

// Fetch INI (flight plan / position init) messages via backend proxy
export async function fetchINIMessages() {
  const res = await base44.functions.invoke('airframesProxy', { type: 'INI' });
  return res.data?.messages || [];
}

// Fetch FTX (free text) messages via backend proxy
export async function fetchFTXMessages() {
  const res = await base44.functions.invoke('airframesProxy', { type: 'FTX' });
  return res.data?.messages || [];
}

// Parse an INI message into a flight plan object
export function parseINItoFlightPlan(msg) {
  const text = msg.text || "";
  const rawSource = [msg.text, msg.rawAcars, msg.message, msg.body].filter(Boolean).join(" ");

  let departure = "????";
  let destination = "????";
  const airportPair = extractAirportPairFromRawINI(rawSource);
  const routeSlash = rawSource.match(/\.([A-Z]{4})\/([A-Z]{4})\./);
  const routeDot = rawSource.match(/([A-Z]{4})[/.]([A-Z]{4})/);
  const depDest = rawSource.match(/DEP[/\s]*([A-Z]{4}).*?DEST[/\s]*([A-Z]{4})/i);
  const orgDest = rawSource.match(/ORG[/\s]*([A-Z]{4}).*?DST[/\s]*([A-Z]{4})/i);
  if (airportPair) { departure = airportPair.departure; destination = airportPair.destination; }
  else if (routeSlash) { departure = routeSlash[1]; destination = routeSlash[2]; }
  else if (depDest) { departure = depDest[1]; destination = depDest[2]; }
  else if (orgDest) { departure = orgDest[1]; destination = orgDest[2]; }
  else if (routeDot) { departure = routeDot[1]; destination = routeDot[2]; }

  const aircraftType = getAircraftType(msg, text);

  const callsign = getCallsign(msg).toUpperCase() || extractCallsignFromText(text) || "UNKNWN";
  const branch = guessBranch(callsign);
  const missionType = guessMissionType(callsign, text);

  return {
    id: `ini-${msg.id}`,
    callsign,
    hex: getHex(msg).toUpperCase() || "UNKNOWN",
    aircraftType,
    departure,
    destination,
    etd: msg.timestamp || msg.createdAt,
    eta: null,
    missionCode: extractMissionCode(text) || callsign,
    status: "filed",
    branch,
    missionType,
    lat: msg.latitude || null,
    lng: msg.longitude || null,
    heading: msg.heading || 0,
    altitude: msg.altitude || 0,
    speed: msg.speed || 0,
    rawAcars: `INI/ID ${text}`,
    _rawMsg: msg,
  };
}

// Parse a FTX message into a free-text message object
export function parseFTXtoMessage(msg, flightPlanId) {
  const text = (msg.text || "").trim();
  const callsign = getCallsign(msg).toUpperCase() || extractCallsignFromText(text) || "UNKNWN";
  return {
    id: `ftx-${msg.id}`,
    callsign,
    timestamp: msg.timestamp,
    rawText: `FTX/ID ${(msg.text || "").trim()}`,
    flightPlanId: flightPlanId || null,
    aircraftType: getAircraftType(msg, text),
    _rawMsg: msg,
  };
}

function guessBranch(callsign) {
  if (/^(RCH|PAT|REACH|EVAC|DUKE|DOOM|BONE|GHOST)/.test(callsign)) return "USAF";
  if (/^(NAVY|BLUEHAWK|CJAV)/.test(callsign)) return "US Navy";
  if (/^(ASCOT|VIXN|TARTAN)/.test(callsign)) return "RAF";
  if (/^(VMGR|USMC|IRON)/.test(callsign)) return "USMC";
  return "USAF"; // default
}

function guessMissionType(callsign, text) {
  const t = (text + callsign).toUpperCase();
  if (/MEDEVAC|EVAC/.test(t)) return "Medevac";
  if (/TNKR|TANKER|KC|BOOM|AR TRACK/.test(t)) return "Tanker";
  if (/ISR|P-8|BUOY|PATROL/.test(t)) return "ISR";
  if (/AIRLIFT|C-17|C17|C-5|C5/.test(t)) return "Airlift";
  if (/C-130|C130|TRANSPORT/.test(t)) return "Transport";
  if (/B-52|B52|F-16|F16|FIGHTER|STRAT/.test(t)) return "Fighter";
  return "Transport";
}

function extractMissionCode(text) {
  const match = text.match(/\b([A-Z]{2,6}-[A-Z0-9]{2,8})\b/);
  return match?.[0] || null;
}