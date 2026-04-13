import { useState, useEffect } from "react";
import { Radar, Sun, Moon, Plane, Radio, Map, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterOptions, missionFilterOptions } from "../lib/mockData";

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TopBar({
  activeTab,
  onTabChange,
  branchFilter,
  onBranchFilterChange,
  missionFilter,
  onMissionFilterChange,
  flightCount,
  messageCount,
  isLive,
  error,
  countdown,
}) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="relative">
          <Radar className="w-6 h-6 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow" />
        </div>
        <span className="font-semibold text-base tracking-tight">
          MilTrack <span className="text-primary">Live</span>
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/50">
        {[
          { id: "plans", icon: Plane, label: "Flight Plans" },
          { id: "map", icon: Map, label: "Map View" },
          { id: "freetext", icon: Radio, label: "Free Text" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Filters */}
      <div className="flex items-center gap-2 ml-2">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <Select value={branchFilter} onValueChange={onBranchFilterChange}>
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={missionFilter} onValueChange={onMissionFilterChange}>
          <SelectTrigger className="h-8 w-28 text-xs bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {missionFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats + Controls */}
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-primary/30 text-primary">
            {flightCount} flights
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 border-accent/30 text-accent">
            {messageCount} msgs
          </Badge>
          {/* Live / Demo indicator */}
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono ${
            isLive
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
          {/* Countdown to next refresh */}
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
          onClick={() => setDark(!dark)}
        >
          {dark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </header>
  );
}