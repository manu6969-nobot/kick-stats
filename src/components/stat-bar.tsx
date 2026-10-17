export function StatBar({
  label,
  home,
  away,
  suffix = "",
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  const awayPct = (away / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-display text-base font-bold tabular-nums">{home}{suffix}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display text-base font-bold tabular-nums">{away}{suffix}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-primary transition-all duration-700"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="bg-score transition-all duration-700"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}
