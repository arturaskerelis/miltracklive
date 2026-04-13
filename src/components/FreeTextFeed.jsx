import { Radio, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageCard from "./MessageCard";
import { getMessageCategory } from "../lib/decoder";

export default function FreeTextFeed({ messages, flights = [], selectedFlight, onMessageClick, timezone = "UTC" }) {
  const [hideWeather, setHideWeather] = useState(false);
  const flightMap = Object.fromEntries(flights.map((f) => [f.id, f]));
  const selectedMessages = selectedFlight
    ? messages.filter((m) => m.flightPlanId === selectedFlight)
    : messages;

  const filteredMessages = hideWeather
    ? selectedMessages.filter((m) => getMessageCategory(m.rawText).label !== "Weather")
    : selectedMessages;

  const weatherCount = selectedMessages.filter((m) => getMessageCategory(m.rawText).label === "Weather").length;

  const sortedMessages = [...filteredMessages].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Free Text — Plain English
            </h2>
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {sortedMessages.length} decoded messages
            {selectedFlight && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {weatherCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideWeather((current) => !current)}
              className="h-6 px-2 text-[10px] font-mono"
            >
              {hideWeather ? `Show Weather (${weatherCount})` : `Hide Weather (${weatherCount})`}
            </Button>
          )}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            FTX/ID · {timezone === "UTC" ? "Z" : timezone}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {sortedMessages.map((msg) => (
          <MessageCard
            key={msg.id}
            message={msg}
            flight={flightMap[msg.flightPlanId] || null}
            isHighlighted={selectedFlight === msg.flightPlanId && !!msg.flightPlanId}
            onClick={onMessageClick}
            timezone={timezone}
          />
        ))}
        {sortedMessages.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No messages match current selection
          </div>
        )}
      </ScrollArea>
    </div>
  );
}