import { Plane, Clock, ArrowRight, CalendarDays } from "lucide-react";
import useNow from "../hooks/useNow";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getStatusColor, getBranchColor } from "../lib/mockData";
import moment from "moment";

function FlightRow({ flight, isSelected, onSelect, now }) {
  const statusClass = getStatusColor(flight.status);
  const branchClass = getBranchColor(flight.branch);

  return (
    <button
      onClick={() => onSelect(flight.id)}
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
          <span>{moment(flight.etd).format("DD MMM HH:mm")}Z</span>
          {relativeTime(flight.etd, now) && (
            <span className="opacity-50">· {relativeTime(flight.etd, now)}</span>
          )}
          {flight.altitude > 0 && (
            <><span className="opacity-40 mx-1">·</span><span>FL{Math.round(flight.altitude / 100)}</span></>
          )}
        </div>
        <span className="font-mono text-primary/70">{flight.missionCode}</span>
      </div>
    </button>
  );
}

export default function FlightPlansPanel({ flights, selectedFlight, onSelectFlight }) {
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