import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchINIMessages,
  fetchFTXMessages,
  parseINItoFlightPlan,
  parseFTXtoMessage,
} from "../lib/airframesService";
import { flightPlans as mockFlights, freeTextMessages as mockMessages } from "../lib/mockData";

const POLL_INTERVAL = 30_000; // 30 seconds

export default function useAirframesData() {
  const [flights, setFlights] = useState(mockFlights);
  const [messages, setMessages] = useState(mockMessages);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [iniRaw, ftxRaw] = await Promise.all([fetchINIMessages(), fetchFTXMessages()]);

      if (iniRaw.length === 0 && ftxRaw.length === 0) {
        // API returned nothing military — keep mock data as fallback
        setError("No live military traffic found — showing demo data");
        setIsLive(false);
        return;
      }

      // Build flight plans from INI messages (dedupe by callsign, keep latest)
      const flightMap = new Map();
      iniRaw.forEach((msg) => {
        const fp = parseINItoFlightPlan(msg);
        const existing = flightMap.get(fp.callsign);
        if (!existing || new Date(fp.etd) > new Date(existing.etd)) {
          flightMap.set(fp.callsign, fp);
        }
      });
      const parsedFlights = Array.from(flightMap.values());

      // Build FTX messages, linking to flight plans by callsign
      const callsignToId = new Map(parsedFlights.map((f) => [f.callsign, f.id]));
      const parsedMessages = ftxRaw.map((msg) => {
        const callsign = (msg.flight || "").toUpperCase();
        const flightPlanId = callsignToId.get(callsign) || null;
        return parseFTXtoMessage(msg, flightPlanId);
      });

      setFlights(parsedFlights.length > 0 ? parsedFlights : mockFlights);
      setMessages(parsedMessages.length > 0 ? parsedMessages : mockMessages);
      setIsLive(parsedFlights.length > 0);
      setError(null);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.warn("Airframes fetch failed, using mock data:", err.message);
      setError("Live feed unavailable — showing demo data");
      setIsLive(false);
      // Keep whatever data we had (initially mock)
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  return { flights, messages, isLive, error, lastRefresh, refetch: fetchAll };
}