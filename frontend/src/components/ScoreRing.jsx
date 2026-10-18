/** Circular progress indicator for the result percentage. */
export default function ScoreRing({ percentage, size = 168 }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const color = clamped >= 75 ? '#059669' : clamped >= 40 ? '#d97706' : '#dc2626';
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Score ${clamped} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clamped / 100)} style={{ transition: 'stroke-dashoffset .8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-4xl font-extrabold tabular-nums text-slate-900">{Math.round(clamped * 10) / 10}%</div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Score</div>
        </div>
      </div>
    </div>
  );
}
