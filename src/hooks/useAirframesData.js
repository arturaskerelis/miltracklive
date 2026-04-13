import { useState, useEffect, useRef, useCallback } from "react";
import { base44 as base44Client } from '@/api/base44Client';
import {
  fetchINIMessages,
  fetchFTXMessages,
  parseINItoFlightPlan,
  parseFTXtoMessage,
} from "../lib/airframesService";

const STORAGE_KEY = "miltrack-live-cache";

const POLL_INTERVAL = 6 * 60; // 6 minutes in seconds (2 calls × 250 = 500/day)

export default function useAirframesData() {
  const [flights, setFlights] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    try {
      return JSON.parse(cached).flights || [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];
    try {
      return JSON.parse(cached).messages || [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const countdownRef = useRef(POLL_INTERVAL);
  const timerRef = useRef(null);
  const tickRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [iniRaw, ftxRaw] = await Promise.all([fetchINIMessages(), fetchFTXMessages()]);

      if (iniRaw.length === 0 && ftxRaw.length === 0) {
        setError("No live data returned");
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

        // Enrich with live ADSB data from adsb.lol
        try {
          const callsigns = parsedFlights.map((f) => f.callsign);
          const enrichRes = await base44Client.functions.invoke('adsbEnrich', { callsigns });
          const adsbMap = enrichRes.data?.results || {};
          parsedFlights.forEach((fp) => {
            const ac = adsbMap[fp.callsign];
            if (ac) {
              const originalDeparture = fp.departure;
              const originalDestination = fp.destination;

              if (ac.lat != null) fp.lat = ac.lat;
              if (ac.lon != null) fp.lng = ac.lon;
              if (ac.alt_baro != null) fp.altitude = ac.alt_baro;
              if (ac.gs != null) fp.speed = Math.round(ac.gs);
              if (ac.track != null) fp.heading = Math.round(ac.track);
              if (ac.flight) fp.callsign = ac.flight.trim();
              if (ac.t) fp.aircraftType = ac.t;
              if (ac.dep && /^[A-Z]{4}$/.test(ac.dep)) fp.departure = ac.dep;
              if (ac.dst && /^[A-Z]{4}$/.test(ac.dst)) fp.destination = ac.dst;

              if (!fp.departure || fp.departure === '????') fp.departure = originalDeparture;
              if (!fp.destination || fp.destination === '????') fp.destination = originalDestination;

              fp.status = 'en-route';
            }
          });
        } catch (e) {
          console.warn('ADSB enrich failed:', e.message);
        }

        const normalizeCallsign = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const callsignToId = new Map(parsedFlights.map((f) => [normalizeCallsign(f.callsign), f.id]));
        // Deduplicate FTX messages by content, since Airframes can return the same message from multiple stations
        const seenFtxKeys = new Set();
        const uniqueFtxRaw = ftxRaw.filter((msg) => {
          const normalizedText = `FTX/ID ${(msg.text || '').trim()}`.replace(/\s+/g, ' ').trim().toUpperCase();

          if (!normalizedText || seenFtxKeys.has(normalizedText)) return false;
          seenFtxKeys.add(normalizedText);
          return true;
        });
        const parsedMessages = uniqueFtxRaw.map((msg) => {
          const parsedMessage = parseFTXtoMessage(msg, null);
          return {
            ...parsedMessage,
            flightPlanId: callsignToId.get(normalizeCallsign(parsedMessage.callsign)) || null,
          };
        });

        // Batch AI-decode the real ACARS messages
        try {
          const toDecodeSlice = parsedMessages.slice(0, 30);
          const texts = toDecodeSlice.map((m) => m.rawText);
          const result = await base44Client.integrations.Core.InvokeLLM({
            prompt: `You are a military ACARS message decoder. Translate each of the following raw ACARS messages into a single clear, plain-English sentence for ground crew. Be concise. Return a JSON object with key "decoded" being an array of strings, one per message in the same order.\n\nMessages:\n${texts.map((t, i) => `${i}: ${t}`).join('\n')}`,
            response_json_schema: { type: 'object', properties: { decoded: { type: 'array', items: { type: 'string' } } } }
          });
          const decodedList = result?.decoded || [];
          decodedList.forEach((text, i) => {
            if (text && toDecodeSlice[i]) toDecodeSlice[i].decoded = text;
          });
        } catch (e) {
          console.warn('AI decode failed:', e.message);
        }

        const nextFlights = parsedFlights;
        const nextMessages = parsedMessages;
        setFlights(nextFlights);
        setMessages(nextMessages);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ flights: nextFlights, messages: nextMessages }));
        setIsLive(true);
        setError(null);
      }
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.warn("Airframes fetch failed:", err.message);
      setError("Live feed unavailable");
      setIsLive(false);
    }
    setIsLoading(false);
    // Reset countdown
    countdownRef.current = POLL_INTERVAL;
    setCountdown(POLL_INTERVAL);
  }, []);

  useEffect(() => {
    const triggerInitialRefresh = () => {
      fetchAll();
    };

    if (document.readyState === "complete") {
      triggerInitialRefresh();
    } else {
      window.addEventListener("load", triggerInitialRefresh, { once: true });
    }

    // Poll every 6 minutes
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL * 1000);

    // Tick countdown every second
    tickRef.current = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, 1000);

    return () => {
      window.removeEventListener("load", triggerInitialRefresh);
      clearInterval(timerRef.current);
      clearInterval(tickRef.current);
    };
  }, [fetchAll]);

  return { flights, messages, isLive, error, lastRefresh, countdown, refetch: fetchAll, isLoading };
}