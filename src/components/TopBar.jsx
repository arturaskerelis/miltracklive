import { useState, useEffect } from "react";
import { Radar, Sun, Moon, RefreshCw, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useZuluClock, { TIMEZONES } from "../hooks/useZuluClock";

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TopBar({
  flightCount,
  messageCount,
  isLive,
  error,
  countdown,
  onRefresh,
  isRefreshing,
  timezone,
  onTimezoneChange,
  selectedFlight,
  onClearSelection,
}) {
  const [dark, setDark] = useState(true);
  const clockTime = useZuluClock(timezone);
  const tzLabel = timezone === "UTC" ? "Z" : TIMEZONES.find(t => t.value === timezone)?.label?.split(" ")[0] || timezone;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="relative h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="relative">
          <Radar className="w-6 h-6 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-base tracking-tight">
            MilTrack <span className="text-primary">Live</span>
            <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Beta</span>
          </span>
          <a
            href="https://twitter.com/2tswfl"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            built by @2tswfl
          </a>
        </div>
      </div>

      {/* Live Clock */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40">
        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-mono text-sm tabular-nums font-medium">{clockTime}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{tzLabel}</span>
      </div>

      {/* Timezone selector */}
      <Select value={timezone} onValueChange={onTimezoneChange}>
        <SelectTrigger className="h-8 text-xs w-36 font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[9999]">
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value} className="text-xs font-mono">
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>



      {selectedFlight && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs font-mono"
            onClick={onClearSelection}
          >
            <X className="w-3.5 h-3.5" />
            Clear Selection
          </Button>
        </div>
      )}

      {/* Stats + Controls */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-primary/30 text-primary">
            {flightCount} flights
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-accent/30 text-accent">
            {messageCount} msgs
          </Badge>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono ${
            isLive
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
          {countdown !== undefined && (
            <span className="text-[10px] font-mono opacity-60 tabular-nums">
              refresh {formatCountdown(countdown)}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRefresh}
          title="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}