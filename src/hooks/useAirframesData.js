import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchINIMessages,
  fetchFTXMessages,
  parseINItoFlightPlan,
  parseFTXtoMessage,
} from "../lib/airframesService";
import { flightPlans as mockFlights, freeTextMessages as mockMessages } from "../lib/mockData";

const POLL_INTERVAL = 6 * 60; // 6 minutes in seconds (2 calls × 250 = 500/day)

export default function useAirframesData() {
  const [flights, setFlights] = useState(mockFlights);
  const [messages, setMessages] = useState(mockMessages);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const countdownRef = useRef(POLL_INTERVAL);
  const timerRef = useRef(null);
  const tickRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [iniRaw, ftxRaw] = await Promise.all([fetchINIMessages(), fetchFTXMessages()]);

      if (iniRaw.length === 0 && ftxRaw.length === 0) {
        setError("No live data returned — showing demo data");
        setIsLive(false);
      } else {
        const flightMap = new Map();
        iniRaw.forEach((msg) => {
          const fp = parseINItoFlightPlan(msg);
          const existing = flightMap.get(fp.callsign);
          if (!existing || new Date(fp.etd) > new Date(existing.etd)) {
            flightMap.set(fp.callsign, fp);
          }
        });
        const parsedFlights = Array.from(flightMap.values());
        const callsignToId = new Map(parsedFlights.map((f) => [f.callsign, f.id]));
        const parsedMessages = ftxRaw.map((msg) => {
          const callsign = (typeof msg.flight === 'object' ? msg.flight?.flight : msg.flight || '').toUpperCase();
          return parseFTXtoMessage(msg, callsignToId.get(callsign) || null);
        });

        setFlights(parsedFlights.length > 0 ? parsedFlights : mockFlights);
        setMessages(parsedMessages.length > 0 ? parsedMessages : mockMessages);
        setIsLive(true);
        setError(null);
      }
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.warn("Airframes fetch failed, using mock data:", err.message);
      setError("Live feed unavailable — showing demo data");
      setIsLive(false);
    }
    // Reset countdown
    countdownRef.current = POLL_INTERVAL;
    setCountdown(POLL_INTERVAL);
  }, []);

  useEffect(() => {
    fetchAll();

    // Poll every 6 minutes
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL * 1000);

    // Tick countdown every second
    tickRef.current = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(tickRef.current);
    };
  }, [fetchAll]);

  return { flights, messages, isLive, error, lastRefresh, countdown, refetch: fetchAll };
}