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
  { label: "New York (America/New_York)", value: "America/New_York" },
  { label: "Chicago (America/Chicago)", value: "America/Chicago" },
  { label: "Denver (America/Denver)", value: "America/Denver" },
  { label: "Los Angeles (America/Los_Angeles)", value: "America/Los_Angeles" },
  { label: "Anchorage (America/Anchorage)", value: "America/Anchorage" },
  { label: "Honolulu (Pacific/Honolulu)", value: "Pacific/Honolulu" },
  { label: "Toronto (America/Toronto)", value: "America/Toronto" },
  { label: "Mexico City (America/Mexico_City)", value: "America/Mexico_City" },
  { label: "Bogota (America/Bogota)", value: "America/Bogota" },
  { label: "Sao Paulo (America/Sao_Paulo)", value: "America/Sao_Paulo" },
  { label: "Buenos Aires (America/Argentina/Buenos_Aires)", value: "America/Argentina/Buenos_Aires" },
  { label: "London (Europe/London)", value: "Europe/London" },
  { label: "Paris (Europe/Paris)", value: "Europe/Paris" },
  { label: "Berlin (Europe/Berlin)", value: "Europe/Berlin" },
  { label: "Rome (Europe/Rome)", value: "Europe/Rome" },
  { label: "Madrid (Europe/Madrid)", value: "Europe/Madrid" },
  { label: "Athens (Europe/Athens)", value: "Europe/Athens" },
  { label: "Helsinki (Europe/Helsinki)", value: "Europe/Helsinki" },
  { label: "Moscow (Europe/Moscow)", value: "Europe/Moscow" },
  { label: "Istanbul (Europe/Istanbul)", value: "Europe/Istanbul" },
  { label: "Cairo (Africa/Cairo)", value: "Africa/Cairo" },
  { label: "Johannesburg (Africa/Johannesburg)", value: "Africa/Johannesburg" },
  { label: "Lagos (Africa/Lagos)", value: "Africa/Lagos" },
  { label: "Nairobi (Africa/Nairobi)", value: "Africa/Nairobi" },
  { label: "Dubai (Asia/Dubai)", value: "Asia/Dubai" },
  { label: "Riyadh (Asia/Riyadh)", value: "Asia/Riyadh" },
  { label: "Tehran (Asia/Tehran)", value: "Asia/Tehran" },
  { label: "Karachi (Asia/Karachi)", value: "Asia/Karachi" },
  { label: "Delhi (Asia/Kolkata)", value: "Asia/Kolkata" },
  { label: "Dhaka (Asia/Dhaka)", value: "Asia/Dhaka" },
  { label: "Bangkok (Asia/Bangkok)", value: "Asia/Bangkok" },
  { label: "Singapore (Asia/Singapore)", value: "Asia/Singapore" },
  { label: "Hong Kong (Asia/Hong_Kong)", value: "Asia/Hong_Kong" },
  { label: "Shanghai (Asia/Shanghai)", value: "Asia/Shanghai" },
  { label: "Seoul (Asia/Seoul)", value: "Asia/Seoul" },
  { label: "Tokyo (Asia/Tokyo)", value: "Asia/Tokyo" },
  { label: "Perth (Australia/Perth)", value: "Australia/Perth" },
  { label: "Adelaide (Australia/Adelaide)", value: "Australia/Adelaide" },
  { label: "Sydney (Australia/Sydney)", value: "Australia/Sydney" },
  { label: "Auckland (Pacific/Auckland)", value: "Pacific/Auckland" },
  { label: "Apia (Pacific/Apia)", value: "Pacific/Apia" }
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