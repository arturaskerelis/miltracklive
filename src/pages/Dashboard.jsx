import { useState, useMemo, useEffect } from "react";
import TopBar from "../components/TopBar";
import FlightPlansPanel from "../components/FlightPlansPanel";
import MapPanel from "../components/MapPanel";
import FreeTextFeed from "../components/FreeTextFeed";
import useAirframesData from "../hooks/useAirframesData";
import moment from "moment";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [timezone, setTimezone] = useState("UTC");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { flights: allFlights, messages: allMessages, isLive, error, countdown, refetch } = useAirframesData();

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
    setSelectedFlight(msg.flightPlanId);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
        <div className="hidden lg:grid lg:grid-cols-12 h-full">
          <div className="col-span-3 overflow-hidden">
            <FlightPlansPanel
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
              timezone={timezone}
            />
          </div>
          <div className="col-span-5 overflow-hidden border-x border-border">
            <MapPanel
              flights={filteredFlights}
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

        {/* Mobile layout (tab-based) */}
        <div className="lg:hidden h-full">
          {activeTab === "plans" && (
            <FlightPlansPanel
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
              timezone={timezone}
            />
          )}
          {activeTab === "map" && (
            <MapPanel
              flights={filteredFlights}
              selectedFlight={selectedFlight}
              onSelectFlight={handleSelectFlight}
            />
          )}
          {activeTab === "freetext" && (
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
  );
}