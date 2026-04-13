import { Sparkles, Clock } from "lucide-react";
import { useState, useRef } from "react";
import useNow from "../hooks/useNow";
import { formatInTZ } from "../hooks/useZuluClock";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "@/components/ui/badge";
import { decodeMessage, getMessageCategory } from "../lib/decoder";
import moment from "moment";

export default function MessageCard({ message, flight, isHighlighted, onClick, timezone = "UTC" }) {
  const now = useNow();
  const [showRaw, setShowRaw] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowRaw(true), 500);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowRaw(false);
  };
  const decoded = message.decoded || decodeMessage(message.rawText);
  const category = getMessageCategory(message.rawText);

  return (
    <button
      onClick={() => onClick?.(message)}
      className={`w-full text-left p-3 border-b border-border/50 transition-all hover:bg-muted/40 ${
        isHighlighted ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-sm text-foreground">
            {message.callsign}
          </span>
          {flight && flight.departure && flight.destination && (
            <span className="font-mono text-[10px] text-muted-foreground/70">
              {flight.departure} → {flight.destination}
            </span>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${category.color}`}
          >
            {category.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" />
          {formatInTZ(message.timestamp, timezone, "HH:mm:ss")}
          {relativeTime(message.timestamp, now) && (
            <span className="opacity-50">· {relativeTime(message.timestamp, now)}</span>
          )}
        </div>
      </div>

      {/* Decoded / Raw toggle */}
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {showRaw ? (
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mt-0.5">RAW</span>
            <p className="text-xs font-mono leading-relaxed text-muted-foreground break-all">
              {message.rawText}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-foreground/90">
              {decoded}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}