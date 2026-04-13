import { Plane, ArrowRight, CalendarDays } from "lucide-react";
import { useState, useRef } from "react";
import useNow from "../hooks/useNow";
import { formatInTZ } from "../hooks/useZuluClock";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusColor, getBranchColor } from "../lib/mockData";

function FlightRow({ flight, isSelected, onSelect, now, timezone }) {
  const statusClass = getStatusColor(flight.status);
  const branchClass = getBranchColor(flight.branch);
  const [showRaw, setShowRaw] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowRaw(true), 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowRaw(false);
  };

  return (
    <button
      onClick={() => onSelect(flight.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-all hover:bg-muted/60 ${
        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono font-semibold text-sm">{flight.callsign}</span>
          <span className={`text-[10px] font-medium ${branchClass}`}>{flight.branch}</span>
        </div>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusClass}`}>
          {flight.status}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <span className="font-mono">{flight.departure || '????'}</span>
        <ArrowRight className="w-3 h-3" />
        <span className="font-mono">{flight.destination || '????'}</span>
        <span className="mx-1 opacity-40">|</span>
        <span>{flight.aircraftType}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
        <div className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          <span>{formatInTZ(flight.etd, timezone, "DD MMM HH:mm")}</span>
          {flight.etd && flight.status !== 'en-route' && (() => {
            const diffMs = new Date(flight.etd).getTime() - now;
            if (diffMs > 0) {
              const h = Math.floor(diffMs / 3600000);
              const m = Math.floor((diffMs % 3600000) / 60000);
              return <span className="opacity-60">· initiates in {h > 0 ? `${h}h ` : ''}{m}m</span>;
            }
            return <span className="opacity-50">· {relativeTime(flight.etd, now)}</span>;
          })()}
          {flight.altitude > 0 && (
            <><span className="opacity-40 mx-1">·</span><span>FL{Math.round(flight.altitude / 100)}</span></>
          )}
        </div>
        <span className="font-mono text-primary/70">{flight.missionCode}</span>
      </div>

      {showRaw && flight.rawAcars && (
        <div className="mt-2 flex items-start gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mt-0.5">RAW</span>
          <p className="text-xs font-mono leading-relaxed text-muted-foreground break-all">
            {flight.rawAcars.replace(/^INI\/ID\s*/i, '').replace(new RegExp(`^[^,]+,${flight.callsign}\\s*,?`, 'i'), '')}
          </p>
        </div>
      )}
    </button>
  );
}

export default function FlightPlansPanel({ flights, selectedFlight, onSelectFlight, timezone = "UTC" }) {
  const now = useNow();
  const sorted = [...flights].sort((a, b) => new Date(b.etd) - new Date(a.etd));
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Flight Plans
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {flights.length} active military flights
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          INI/ID
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        {sorted.map((flight) => (
          <FlightRow
            key={flight.id}
            flight={flight}
            isSelected={selectedFlight === flight.id}
            onSelect={onSelectFlight}
            now={now}
            timezone={timezone}
          />
        ))}
        {sorted.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No flights match current filters
          </div>
        )}
      </ScrollArea>
    </div>
  );
}