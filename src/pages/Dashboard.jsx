import { useState } from "react";
import TopBar from "../components/TopBar";
import FlightPlansPanel from "../components/FlightPlansPanel";
import MapPanel from "../components/MapPanel";
import FreeTextFeed from "../components/FreeTextFeed";
import LiveDataLoadingPlaceholder from "../components/LiveDataLoadingPlaceholder";
import useAirframesData from "../hooks/useAirframesData";

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

    const relatedMessage = allMessages
      .filter((message) => message.flightPlanId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (relatedMessage) {
      const messageElement = document.getElementById(`message-${relatedMessage.id}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
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

      {/* Desktop: 3-panel layout / Mobile: tab-based */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop layout (hidden on mobile) */}
        <div className="grid grid-cols-12 h-full">
...
        </div>
      </div>

      <footer className="shrink-0 border-t border-border bg-card/60 px-4 py-2 text-[11px] text-muted-foreground">
        Data from 
        <a href="https://airframes.io" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          airframes.io
        </a>
        {" "}and{" "}
        <a href="https://adsb.lol" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          adsb.lol
        </a>
        .
      </footer>
    </div>
  );
}