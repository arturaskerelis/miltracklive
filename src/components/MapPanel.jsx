import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Crosshair } from "lucide-react";
import { getBranchColor } from "../lib/mockData";
import { base44 } from "@/api/base44Client";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createAircraftIcon(color, isSelected) {
  const size = isSelected ? 28 : 22;
  return L.divIcon({
    className: "aircraft-icon",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      display: flex; align-items: center; justify-content: center;
      background: ${color}; border-radius: 50%;
      border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
      box-shadow: 0 0 ${isSelected ? '12' : '6'}px ${color}80;
      transition: all 0.3s;
    ">
      <svg width="${size - 8}" height="${size - 8}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.2 3 L6 14.3l-2.5-.3c-.4-.1-.8.1-1 .4L2 15l3.5 1.5L7 20l.5-.5c.3-.2.5-.6.4-1L7.6 16l3-2.9 3 5.2c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getBranchHexColor(branch) {
  switch (branch) {
    case "USAF": return "#60a5fa";
    case "US Navy": return "#22d3ee";
    case "RAF": return "#f87171";
    case "USMC": return "#fb923c";
    default: return "#94a3b8";
  }
}

function FlyToSelected({ flights, selectedFlight }) {
  const map = useMap();
  useEffect(() => {
    if (selectedFlight) {
      const flight = flights.find((f) => f.id === selectedFlight);
      if (flight && flight.lat && flight.lng) {
        map.flyTo([flight.lat, flight.lng], 5, { duration: 1 });
      }
    }
  }, [selectedFlight, flights, map]);
  return null;
}

const militaryBases = {
  KDOV: [39.1296, -75.4668],
  KWRI: [40.0156, -74.5936],
  ETAR: [49.4369, 7.6003],
  LTAN: [37.0021, 35.4259],
  OKBK: [29.2267, 47.9689],
  OAIX: [34.9461, 69.2650],
  PGUA: [13.5840, 144.9248],
  RJTY: [35.7485, 139.3487],
  PHIK: [21.3187, -157.9224],
  KBAD: [32.5012, -93.6627],
  KNKX: [32.8684, -117.1424],
  KLFI: [37.0829, -76.3605],
  EGVN: [51.7500, -1.5836],
  LICZ: [37.4017, 14.9224],
  OAKN: [31.5058, 65.8478],
};

export default function MapPanel({ flights, selectedFlight, onSelectFlight }) {
  const [liveAircraft, setLiveAircraft] = useState([]);

  useEffect(() => {
    async function fetchMil() {
      try {
        const res = await base44.functions.invoke('adsbAllMil', {});
        setLiveAircraft(res.data?.aircraft || []);
      } catch (e) {
        console.warn('adsbAllMil failed:', e.message);
      }
    }
    fetchMil();
    const interval = setInterval(fetchMil, 60000);
    return () => clearInterval(interval);
  }, []);

  const enRouteFlights = flights.filter((f) => f.status === "en-route" && f.lat && f.lng);

  // Deduplicate: skip liveAircraft already shown via ACARS-enriched flights
  const enRouteCallsigns = new Set(enRouteFlights.map(f => f.callsign.toUpperCase()));
  const extraAircraft = liveAircraft.filter(ac => {
    const cs = (ac.flight || ac.hex || '').trim().toUpperCase();
    return !enRouteCallsigns.has(cs);
  });

  return (
    <div className="h-full relative">
      <MapContainer
        center={[35, 10]}
        zoom={3}
        className="h-full w-full"
        zoomControl={false}
        style={{ background: "hsl(222, 28%, 7%)" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FlyToSelected flights={flights} selectedFlight={selectedFlight} />

        {/* Route lines for ACARS flights */}
        {enRouteFlights.map((flight) => {
          const depCoords = militaryBases[flight.departure];
          const destCoords = militaryBases[flight.destination];
          if (!depCoords || !destCoords) return null;
          return (
            <Polyline
              key={`route-${flight.id}`}
              positions={[depCoords, [flight.lat, flight.lng], destCoords]}
              pathOptions={{
                color: getBranchHexColor(flight.branch),
                weight: selectedFlight === flight.id ? 4 : 1,
                opacity: selectedFlight === flight.id ? 0.95 : 0.25,
                dashArray: "8 6",
              }}
            />
          );
        })}

        {/* ACARS-enriched flight markers */}
        {enRouteFlights.map((flight) => (
          <Marker
            key={flight.id}
            position={[flight.lat, flight.lng]}
            zIndexOffset={selectedFlight === flight.id ? 1000 : 0}
            icon={createAircraftIcon(getBranchHexColor(flight.branch), selectedFlight === flight.id)}
            eventHandlers={{ click: () => onSelectFlight(flight.id) }}
          >
            <Popup className="military-popup">
              <div className="min-w-48">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm">{flight.callsign}</span>
                  <span className="text-xs text-gray-400">{flight.aircraftType}</span>
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <div>{flight.departure} → {flight.destination}</div>
                  <div>FL{Math.round(flight.altitude / 100)} | {flight.speed} kts</div>
                  <div>Mission: {flight.missionCode}</div>
                  <div>Branch: {flight.branch} | {flight.missionType}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live adsb.lol military aircraft (grey markers) */}
        {extraAircraft.map((ac) => {
          const callsign = (ac.flight || ac.hex || 'MIL').trim();
          return (
            <Marker
              key={ac.hex || callsign}
              position={[ac.lat, ac.lon]}
              icon={createAircraftIcon('#94a3b8', false)}
            >
              <Popup>
                <div className="min-w-40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm">{callsign}</span>
                    {ac.t && <span className="text-xs text-gray-400">{ac.t}</span>}
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {ac.alt_baro != null && <div>Alt: FL{Math.round(ac.alt_baro / 100)}</div>}
                    {ac.gs != null && <div>Speed: {Math.round(ac.gs)} kts</div>}
                    {ac.r && <div>Reg: {ac.r}</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map overlay info */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-card/90 backdrop-blur-md border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Crosshair className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Tactical Overview
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {enRouteFlights.length + extraAircraft.length} aircraft tracked
          </p>
        </div>
      </div>
    </div>
  );
}