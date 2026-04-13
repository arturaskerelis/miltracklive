import { Sparkles, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useNow from "../hooks/useNow";
import { formatInTZ } from "../hooks/useZuluClock";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "@/components/ui/badge";
import { decodeMessage, getMessageCategory } from "../lib/decoder";

function extractCallsignFromRawText(rawText = "") {
  const normalized = rawText.trim().toUpperCase();
  const structuredHeaderMatch = normalized.match(/FTX\/ID[^,]*,([^,\/]+),/i);
  if (structuredHeaderMatch) return structuredHeaderMatch[1].trim();

  const cleaned = normalized.replace(/^FTX\/ID\s*/i, '').trim();

  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Z0-9]/g, ''))
    .filter(Boolean);

  const preferredToken = tokens.find((token) => /^[A-Z]{2,8}\d{1,4}[A-Z]?$/.test(token));
  const fallbackToken = tokens.find((token) => /^[A-Z0-9]{3,12}$/.test(token));
  return preferredToken || fallbackToken || "UNKNWN";
}

export default function MessageCard({ message, flight, isHighlighted, onClick, timezone = "UTC" }) {
  const now = useNow();
  const [showRaw, setShowRaw] = useState(false);
  const hoverTimer = useRef(null);
  const decoded = message.decoded || decodeMessage(message.rawText);
  const category = getMessageCategory(message.rawText);
  const displayCallsign = message.callsign && message.callsign !== "UNKNWN"
    ? message.callsign
    : extractCallsignFromRawText(message.rawText);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowRaw(true), 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowRaw(false);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimer.current);
  }, []);

  return (
    <button
      id={`message-${message.id}`}
      data-flight-select="true"
      onClick={() => onClick?.(message)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full text-left p-3 border-b border-border/50 transition-all hover:bg-muted/40 ${
        isHighlighted ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-2 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-sm text-foreground">
            {displayCallsign}
          </span>
          {flight?.status === "en-route" && Number.isFinite(Number(flight?.lat)) && Number.isFinite(Number(flight?.lng)) && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-cyan-500/30 text-cyan-400">
              Live
            </Badge>
          )}
          {flight && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              INI
            </Badge>
          )}
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
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
          <Clock className="w-3 h-3" />
          <span>{formatInTZ(message.timestamp, timezone, "DD MMM HH:mm:ss")} {timezone === "UTC" ? "Z" : timezone}</span>
          {relativeTime(message.timestamp, now) && (
            <span className="opacity-50">· {relativeTime(message.timestamp, now)}</span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/90 break-all whitespace-pre-wrap">
          {decoded}
        </p>
      </div>

      {showRaw && message.rawText && (
        <div className="mt-2 flex items-start gap-2 min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mt-0.5">RAW</span>
          <p className="min-w-0 flex-1 text-xs font-mono leading-relaxed text-muted-foreground break-all whitespace-pre-wrap">
            {message.rawText.replace(/,[A-Z0-9]{4}$/i, '')}
          </p>
        </div>
      )}
    </button>
  );
}