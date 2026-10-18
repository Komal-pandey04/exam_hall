const pad = (n) => String(n).padStart(2, '0');

/** 1799 -> "29:59", 3725 -> "1:02:05" */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

/** 125 -> "2m 05s" (used on the result page) */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(s % 60)}s`;
  return `${s}s`;
}

export const formatMarks = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
export const optionLetter = (index) => String.fromCharCode(65 + index);
