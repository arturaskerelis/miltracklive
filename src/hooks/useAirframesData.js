import { useState, useEffect, useRef, useCallback } from "react";
import { base44 as base44Client } from '@/api/base44Client';
import {
  fetchINIMessages,
  fetchFTXMessages,
  parseINItoFlightPlan,
  parseFTXtoMessage,
} from "../lib/airframesService";

import { flightPlans as mockFlights, freeTextMessages as mockMessages } from "../lib/mockData";

const POLL_INTERVAL = 6 * 60; // 6 minutes in seconds (2 calls × 250 = 500/day)

export default function useAirframesData() {
  const [flights, setFlights] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
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

        // Enrich with live ADSB data from adsb.lol
        try {
          const callsigns = parsedFlights.map((f) => f.callsign);
          const enrichRes = await base44Client.functions.invoke('adsbEnrich', { callsigns });
          const adsbMap = enrichRes.data?.results || {};
          parsedFlights.forEach((fp) => {
            const ac = adsbMap[fp.callsign];
            if (ac) {
              if (ac.lat != null) fp.lat = ac.lat;
              if (ac.lon != null) fp.lng = ac.lon;
              if (ac.alt_baro != null) fp.altitude = ac.alt_baro;
              if (ac.gs != null) fp.speed = Math.round(ac.gs);
              if (ac.track != null) fp.heading = Math.round(ac.track);
              if (ac.flight) fp.callsign = ac.flight.trim();
              if (ac.t) fp.aircraftType = ac.t;
              if (ac.dep) fp.departure = ac.dep;
              if (ac.dst) fp.destination = ac.dst;
              fp.status = 'en-route';
            }
          });
        } catch (e) {
          console.warn('ADSB enrich failed:', e.message);
        }

        const callsignToId = new Map(parsedFlights.map((f) => [f.callsign, f.id]));
        // Deduplicate FTX messages by id
        const seenMsgIds = new Set();
        const uniqueFtxRaw = ftxRaw.filter((msg) => {
          if (seenMsgIds.has(msg.id)) return false;
          seenMsgIds.add(msg.id);
          return true;
        });
        const parsedMessages = uniqueFtxRaw.map((msg) => {
          const parsedMessage = parseFTXtoMessage(msg, null);
          return {
            ...parsedMessage,
            flightPlanId: callsignToId.get(parsedMessage.callsign) || null,
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

        setFlights(parsedFlights.length > 0 ? parsedFlights : mockFlights);
        setMessages(parsedMessages.length > 0 ? parsedMessages : mockMessages);
        setIsLive(true);
        setError(null);
      }
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.warn("Airframes fetch failed:", err.message);
      setError("Live feed unavailable");
      setFlights(mockFlights);
      setMessages(mockMessages);
      setIsLive(false);
    }
    setIsLoading(false);
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

  return { flights, messages, isLive, error, lastRefresh, countdown, refetch: fetchAll, isLoading };
}