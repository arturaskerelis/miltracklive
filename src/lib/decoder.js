// Military ACARS shorthand → plain English decoder
// This is the "hero" feature — makes cryptic messages readable for anyone

const abbreviations = {
  MAINT: "maintenance",
  REQ: "required",
  HYD: "hydraulic",
  SYS: "system",
  MLG: "main landing gear",
  NLG: "nose landing gear",
  RT: "right",
  LT: "left",
  ENG: "engine",
  OIL: "oil",
  PRESS: "pressure",
  TEMP: "temperature",
  WX: "weather",
  DIVERT: "diversion",
  POSS: "possible",
  BLW: "below",
  MINS: "minimums",
  ARR: "arrival",
  DEST: "destination",
  ETG: "estimated time to go",
  HRS: "hours",
  DISC: "disconnected",
  OPS: "operations",
  RCVR: "receiver aircraft",
  AR: "aerial refueling",
  PAX: "passengers",
  RPT: "report",
  POS: "position",
  FL: "flight level",
  TURB: "turbulence",
  DESCEND: "descent",
  COMSEC: "communication security",
  SIPR: "secure intelligence network",
  AFT: "rear",
  FWD: "forward",
  STA: "station",
  RESUPPLY: "resupply",
  AMMO: "ammunition",
  LBS: "pounds",
  BUOY: "sonobuoy",
  OFFLOAD: "fuel offload",
  MEDEVAC: "medical evacuation",
  SURG: "surgical",
  VITALS: "vital signs",
  CALLSIGN: "callsign",
  BOOM: "refueling boom",
  RECONTACT: "re-establish contact",
  LOADMASTER: "loadmaster",
  PALLET: "cargo pallet",
};

const decoderTemplates = [
  {
    pattern: /MAINT REQ HYD SYS (\d+)(.*)/i,
    decode: (m) => `The crew is reporting that maintenance is required on Hydraulic System ${m[1]}.${m[2] ? ` Additional details: ${cleanRemainder(m[2])}.` : ""} Ground support will be needed at the next stop.`,
  },
  {
    pattern: /CREW REST REQ.*ETG\s*([\d.]+)\s*HRS.*DUTY LIM/i,
    decode: (m) => `The crew is requesting a rest period upon arrival. They estimate ${m[1]} hours remaining and are approaching their maximum duty time limit. A fresh crew may be needed for the next leg.`,
  },
  {
    pattern: /RCVR CALLSIGN (\w+)\s+(\w+)\s+AR COMPLETE\s*(\d+)K OFFLOAD/i,
    decode: (m) => `Aerial refueling is complete. The receiving aircraft "${m[1]}" (${m[2]}) has been refueled with ${m[3]},000 pounds of fuel successfully transferred.`,
  },
  {
    pattern: /BUOY PATTERN (\w+) DEPLOYED (\d+) UNITS.*MED\s*(EAST|WEST|NORTH|SOUTH)?/i,
    decode: (m) => `A Pattern ${m[1]} sonobuoy deployment is complete — ${m[2]} sonobuoy units have been dropped in the eastern Mediterranean Sea for anti-submarine surveillance.`,
  },
  {
    pattern: /CARGO MANIFEST\s*(\d+)K?\s*LBS.*PRIORITY\s*(.*)/i,
    decode: (m) => `This aircraft is carrying a cargo load of ${m[1]},000 pounds. The cargo is classified as priority: ${cleanRemainder(m[2]).toLowerCase()}. This is a high-priority delivery.`,
  },
  {
    pattern: /WX DIVERT POSS\s*(\w+)\s*IF\s*(\w+)\s*BLW MINS/i,
    decode: (m) => `Due to weather conditions, the crew is reporting a possible diversion to ${m[1]} if the destination airport ${m[2]} falls below landing minimums at their estimated arrival time.`,
  },
  {
    pattern: /POS RPT FL(\d+)\s*([NS]\d+)\s*([EW]\d+)\s*MACH\s*(\d+)\s*ETA\s*(\w+)\s*(\d+Z)/i,
    decode: (m) => `Position report: Aircraft is at flight level ${m[1]} (${parseInt(m[1]) * 100} feet), coordinates ${m[2]}/${m[3]}, flying at Mach 0.${m[4]}. Estimated arrival at ${m[5]} is ${m[6]}.`,
  },
  {
    pattern: /MEDEVAC STATUS (\d+) PAX URGENT (\d+) PAX PRIORITY.*VITALS\s*STABLE/i,
    decode: (m) => `Medical evacuation status: carrying ${m[1]} urgent patients and ${m[2]} priority patients. All patients' vital signs are currently stable. Medical team is monitoring.`,
  },
  {
    pattern: /BOOM OPS DISC.*COMSEC.*STANDBY RECONTACT/i,
    decode: () => `Aerial refueling operations have been temporarily halted. The receiving aircraft disconnected due to a communication security (COMSEC) issue. Both aircraft are standing by to re-establish contact and resume refueling.`,
  },
  {
    pattern: /ENG\s*(\d+)\s*OIL PRESS LOW.*MONITORING.*NORMAL OPS/i,
    decode: (m) => `Engine ${m[1]} is showing low oil pressure. The crew is actively monitoring the situation but the aircraft remains within normal operating limits. No emergency action required at this time.`,
  },
  {
    pattern: /AR TRACK.*PACIFIC.*ANCHOR\s*(\d+)\s*ON STA\s*(\d+Z)\s*TO\s*(\d+Z)/i,
    decode: (m) => `The tanker is on its assigned aerial refueling track over the Pacific at Anchor Point ${m[1]}. On station from ${m[2]} to ${m[3]} UTC, ready to refuel aircraft in the area.`,
  },
  {
    pattern: /SURFACE CONTACT CLASSIFIED.*SIPR/i,
    decode: () => `A classified surface vessel contact has been detected. A detailed intelligence report has been submitted through the secure SIPR network. Details are restricted.`,
  },
  {
    pattern: /DESCEND REQ FL(\d+).*TURB\s*(MODERATE|SEVERE|LIGHT).*ABOVE FL(\d+)/i,
    decode: (m) => `The crew is requesting to descend to flight level ${m[1]} (${parseInt(m[1]) * 100} feet) due to ${m[2].toLowerCase()} turbulence reported above flight level ${m[3]} (${parseInt(m[3]) * 100} feet).`,
  },
  {
    pattern: /PATIENT UPDATE (\d+) PAX UPGRADED URGENT.*SURG.*REQ ON ARR/i,
    decode: (m) => `Medical update: ${m[1]} patient has been upgraded to urgent status. Surgical intervention will be required immediately upon arrival. Medical team at destination has been alerted.`,
  },
  {
    pattern: /LOADMASTER RPT CARGO SHIFT.*AFT PALLET RESECURED/i,
    decode: () => `The loadmaster reports a minor cargo shift occurred during flight. The rear cargo pallet has been inspected and re-secured. No safety concern at this time.`,
  },
];

function cleanRemainder(text) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => abbreviations[word.toUpperCase()] || word.toLowerCase())
    .join(" ");
}

export function decodeMessage(rawText) {
  // Strip the FTX/ID prefix
  const cleaned = rawText.replace(/^FTX\/ID\s*/i, "").trim();

  for (const template of decoderTemplates) {
    const match = cleaned.match(template.pattern);
    if (match) {
      return template.decode(match);
    }
  }

  // Fallback: expand abbreviations word by word, or return the raw text
  const words = cleaned.split(/\s+/);
  const expanded = words
    .map((w) => abbreviations[w.toUpperCase()] || null)
    .filter(Boolean)
    .join(", ");
  if (expanded) return `Status update — ${expanded}.`;
  // Return the raw message so users can see what was actually sent
  return cleaned || "(empty message)";
}

export function getMessageCategory(rawText) {
  const text = rawText.toUpperCase();

  if (text.includes("HYD") || text.includes("MLG") || text.includes("NLG") || text.includes("MAINT REQ")) {
    return { label: "Hydraulic / Landing Gear", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  }

  if (text.includes("ENG") || text.includes("OIL PRESS") || text.includes("OIL") || text.includes("TEMP")) {
    return { label: "Engine / Oil System", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
  }

  if (text.includes("MEDEVAC") || text.includes("PATIENT") || text.includes("SURG") || text.includes("VITALS")) {
    return { label: "Medical Evacuation", color: "bg-red-500/20 text-red-300 border-red-500/30" };
  }

  if (text.includes("WX DIVERT") || text.includes("DIVERT")) {
    return { label: "Weather Diversion", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
  }

  if (text.includes("TURB") || text.includes("DESCEND REQ")) {
    return { label: "Turbulence / Altitude Change", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
  }

  if (text.includes("AR COMPLETE") || text.includes("OFFLOAD") || text.includes("RCVR")) {
    return { label: "Refueling Complete", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
  }

  if (text.includes("AR TRACK") || text.includes("ANCHOR") || text.includes("ON STA")) {
    return { label: "Tanker On-Station", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" };
  }

  if (text.includes("BOOM") || text.includes("RECONTACT") || text.includes("COMSEC")) {
    return { label: "Refueling Interruption", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" };
  }

  if (text.includes("RAMP FUEL") || text.includes("FUEL LOAD") || text.includes("UPLIFT") || text.includes("FUELING")) {
    return { label: "Fuel Load", color: "bg-lime-500/20 text-lime-300 border-lime-500/30" };
  }

  if (text.includes("CARGO MANIFEST") || text.includes("AMMO") || text.includes("RESUPPLY")) {
    return { label: "Cargo / Resupply", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
  }

  if (text.includes("LOADMASTER") || text.includes("PALLET") || text.includes("CARGO SHIFT")) {
    return { label: "Cargo Restraint Issue", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
  }

  if (text.includes("POS RPT") || text.includes("ETA ")) {
    return { label: "Position Report", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
  }

  if (text.includes("CLASSIFIED") || text.includes("SIPR") || text.includes("SURFACE CONTACT")) {
    return { label: "Classified Contact Report", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  }

  if (text.includes("BUOY") || text.includes("PATTERN") || text.includes("DEPLOYED")) {
    return { label: "Sonobuoy Deployment", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" };
  }

  if (text.includes("CREW REST") || text.includes("DUTY LIM") || text.includes("CREW")) {
    return { label: "Crew Duty / Rest", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
  }

  return { label: "Operational Update", color: "bg-muted text-muted-foreground" };
}