import { useState, useMemo, useEffect } from "react";
import TopBar from "../components/TopBar";
import FlightPlansPanel from "../components/FlightPlansPanel";
import MapPanel from "../components/MapPanel";
import FreeTextFeed from "../components/FreeTextFeed";
import useAirframesData from "../hooks/useAirframesData";
import moment from "moment";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("map");
  const [branchFilter, setBranchFilter] = useState("all");
  const [missionFilter, setMissionFilter] = useState("all");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const { flights: allFlights, messages: allMessages, isLive, error, countdown } = useAirframesData();

  const filteredFlights = useMemo(() => {
    return allFlights.filter((f) => {
      if (branchFilter !== "all" && f.branch !== branchFilter) return false;
      if (missionFilter !== "all" && f.missionType !== missionFilter) return false;
      return true;
    });
  }, [branchFilter, missionFilter]);

  const filteredMessages = useMemo(() => {
    const flightIds = new Set(filteredFlights.map((f) => f.id));
    return allMessages.filter((m) => flightIds.has(m.flightPlanId));
  }, [filteredFlights, allMessages]);

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
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        missionFilter={missionFilter}
        onMissionFilterChange={setMissionFilter}
        flightCount={filteredFlights.length}
        messageCount={filteredMessages.length}
        isLive={isLive}
        error={error}
        countdown={countdown}
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
              selectedFlight={selectedFlight}
              onMessageClick={handleMessageClick}
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
              selectedFlight={selectedFlight}
              onMessageClick={handleMessageClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}