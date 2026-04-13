import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import FlightPlansPanel from "../components/FlightPlansPanel";
import MapPanel from "../components/MapPanel";
import FreeTextFeed from "../components/FreeTextFeed";
import LiveDataLoadingPlaceholder from "../components/LiveDataLoadingPlaceholder";
import MobileDashboardTabs from "../components/MobileDashboardTabs";
import useAirframesData from "../hooks/useAirframesData";

export default function Dashboard() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [timezone, setTimezone] = useState("UTC");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("flights");
  const { flights: allFlights, messages: allMessages, isLive, error, countdown, refetch, isLoading } = useAirframesData();

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const interactiveFlightElement = event.target.closest('[data-flight-select="true"]');
      if (!interactiveFlightElement) {
        setSelectedFlight(null);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredFlights = allFlights;
  const filteredMessages = allMessages;

  const handleSelectFlight = (id) => {
    if (!id) return;

    const flight = allFlights.find((item) => item.id === id);
    if (!flight) return;

    const hasMapCoords = Number.isFinite(Number(flight.lat)) && Number.isFinite(Number(flight.lng));
    const hasDepartureCoords = /^[A-Z]{4}$/.test(String(flight.departure || ""));
    if (!hasMapCoords && !hasDepartureCoords) return;

    setSelectedFlight(id);

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
      handleSelectFlight(msg.flightPlanId);
      setActiveMobileTab("flights");
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
        selectedFlight={selectedFlight}
        onClearSelection={() => setSelectedFlight(null)}
      />

      {isLoading && <LiveDataLoadingPlaceholder />}

      <div className="flex-1 overflow-hidden">
        <div className="hidden md:grid md:grid-cols-12 h-full">
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

        <div className="flex h-full flex-col md:hidden">
          <MobileDashboardTabs activeTab={activeMobileTab} onTabChange={setActiveMobileTab} />
          <div className="flex-1 overflow-hidden">
            {activeMobileTab === "flights" && (
              <FlightPlansPanel
                flights={filteredFlights}
                messages={filteredMessages}
                selectedFlight={selectedFlight}
                onSelectFlight={handleSelectFlight}
                timezone={timezone}
              />
            )}
            {activeMobileTab === "map" && (
              <MapPanel
                flights={filteredFlights}
                messages={filteredMessages}
                selectedFlight={selectedFlight}
                onSelectFlight={handleSelectFlight}
              />
            )}
            {activeMobileTab === "messages" && (
              <FreeTextFeed
                messages={filteredMessages}
                flights={filteredFlights}
                selectedFlight={selectedFlight}
                onMessageClick={handleMessageClick}
                timezone={timezone}
              />
            )}
          </div>
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