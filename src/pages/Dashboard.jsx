import { useState, useMemo, useEffect } from "react";
import TopBar from "../components/TopBar";
import FlightPlansPanel from "../components/FlightPlansPanel";
import MapPanel from "../components/MapPanel";
import FreeTextFeed from "../components/FreeTextFeed";
import useAirframesData from "../hooks/useAirframesData";
import moment from "moment";

export default function Dashboard() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [timezone, setTimezone] = useState("UTC");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { flights: allFlights, messages: allMessages, isLive, error, countdown, refetch, isLoading } = useAirframesData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredFlights = allFlights;
  const filteredMessages = allMessages;

  const handleSelectFlight = (id) => {
    setSelectedFlight((prev) => (prev === id ? null : id));
  };

  const handleMessageClick = (msg) => {
    if (msg.flightPlanId) {
      setSelectedFlight(msg.flightPlanId);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        flightCount={filteredFlights.length}
        messageCount={filteredMessages.length}
        isLive={isLive}
        error={error}
        countdown={countdown}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        timezone={timezone}
        onTimezoneChange={setTimezone}
      />

      {isLoading && allFlights.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-xs text-muted-foreground font-mono">Fetching live data…</p>
        </div>
      )}

      {/* Desktop: 3-panel layout / Mobile: tab-based */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop layout (hidden on mobile) */}
        <div className="grid grid-cols-12 h-full">
          <div className="col-span-3 overflow-hidden">
            <FlightPlansPanel
              flights={filteredFlights}
              messages={filteredMessages}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
              timezone={timezone}
            />
          </div>
          <div className="col-span-5 overflow-hidden border-x border-border">
            <MapPanel
              flights={filteredFlights}
              messages={filteredMessages}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
            />
          </div>
          <div className="col-span-4 overflow-hidden">
            <FreeTextFeed
              messages={filteredMessages}
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              onMessageClick={handleMessageClick}
              timezone={timezone}
            />
          </div>
        </div>

      </div>
    </div>
  );
}