export function relativeTime(timestamp, now) {
  if (!timestamp) return null;
  const diffMs = now - new Date(timestamp).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 0) return null;
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}