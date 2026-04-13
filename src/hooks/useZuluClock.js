import { useState, useEffect } from "react";

export function formatInTZ(date, timezone, format = "HH:mm:ss") {
  const d = date ? new Date(date) : new Date();
  const opts = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  if (format.includes("ss")) opts.second = "2-digit";
  if (format.includes("DD")) {
    opts.day = "2-digit";
    opts.month = "short";
    opts.year = "numeric";
  }
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export const TIMEZONES = [
  { label: "Zulu (UTC)", value: "UTC" },
  { label: "EST (UTC-5)", value: "America/New_York" },
  { label: "CST (UTC-6)", value: "America/Chicago" },
  { label: "MST (UTC-7)", value: "America/Denver" },
  { label: "PST (UTC-8)", value: "America/Los_Angeles" },
  { label: "CET (UTC+1)", value: "Europe/Paris" },
  { label: "GST (UTC+4)", value: "Asia/Dubai" },
  { label: "JST (UTC+9)", value: "Asia/Tokyo" },
  { label: "AEST (UTC+10)", value: "Australia/Sydney" },
];

export default function useZuluClock(timezone = "UTC") {
  const [time, setTime] = useState(() => formatInTZ(null, timezone, "HH:mm:ss"));

  useEffect(() => {
    setTime(formatInTZ(null, timezone, "HH:mm:ss"));
    const interval = setInterval(() => {
      setTime(formatInTZ(null, timezone, "HH:mm:ss"));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return time;
}