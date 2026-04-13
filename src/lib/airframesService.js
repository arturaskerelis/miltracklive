// Airframes.io API — proxied through backend to avoid CORS
import { base44 } from '@/api/base44Client';

// Known military callsign prefixes / patterns
const MILITARY_CALLSIGNS = [
  "RCH", "PAT", "REACH", "EVAC", "DUKE", "DOOM", "VMGR", "ASCOT",
  "NAVY", "USMC", "USAF", "RAF", "SAM", "VENUS", "IRON", "BONE",
  "GHOST", "NIGHT", "HOOK", "VIPER", "EAGLE", "RAVEN",
];

function isMilitary(callsign) {
  if (!callsign) return false;
  const upper = callsign.toUpperCase();
  return MILITARY_CALLSIGNS.some((prefix) => upper.startsWith(prefix));
}

// Extract callsign string from message (API returns nested flight object)
function getCallsign(msg) {
  if (!msg || msg.flight == null) return '';
  if (typeof msg.flight === 'object') {
    return msg.flight.flight || msg.flight.flightIcao || '';
  }
  return String(msg.flight);
}

// Extract tail from message
function getTail(msg) {
  if (typeof msg.airframe === 'object' && msg.airframe !== null) {
    return msg.airframe.tail || '';
  }
  return msg.tail || '';
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

  // Try to extract route: common format "KDOV.ETAR" or "KDOV/ETAR"
  const routeMatch = text.match(/([A-Z]{4})[/.]([A-Z]{4})/);
  const departure = routeMatch?.[1] || "????";
  const destination = routeMatch?.[2] || "????";

  // Aircraft type from tail or text
  const acTypeMatch = text.match(/\b(C17|C-17|C5|C-5|KC135|KC-135|KC10|KC-10|C130|C-130|B52|B-52|P8|P-8|A400|F16|F-16)\w*/i);
  const aircraftType = acTypeMatch?.[0]?.toUpperCase() || getTail(msg) || "UNKNOWN";

  // Determine branch from callsign pattern
  const callsign = getCallsign(msg).toUpperCase() || "UNKNWN";
  const branch = guessBranch(callsign);
  const missionType = guessMissionType(callsign, text);

  return {
    id: `ini-${msg.id}`,
    callsign,
    aircraftType,
    departure,
    destination,
    etd: msg.timestamp || msg.createdAt,
    eta: null,
    missionCode: extractMissionCode(text) || callsign,
    status: "en-route",
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
  return {
    id: `ftx-${msg.id}`,
    callsign: getCallsign(msg).toUpperCase() || "UNKNWN",
    timestamp: msg.timestamp,
    rawText: `FTX/ID ${(msg.text || "").trim()}`,
    flightPlanId: flightPlanId || null,
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