import type { TeamDashboard } from "@/lib/team-dashboard";
import { cn } from "@/lib/utils";

const GREEN = "#6fbf63";
const RED = "#e85a57";

function Score({
  line,
}: {
  line: { for: number; against: number } | null;
}) {
  if (!line) {
    return <p className="font-display text-3xl font-extrabold text-muted-foreground">—</p>;
  }
  return (
    <p className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl">
      <span style={{ color: GREEN }}>{line.for}</span>
      <span className="mx-1 text-foreground">-</span>
      <span style={{ color: RED }}>{line.against}</span>
    </p>
  );
}

export function TeamVictoryHighlights({
  records,
}: {
  records: TeamDashboard["records"];
}) {
  const cells = [
    {
      key: "home",
      node: <Score line={records.biggestHomeWin} />,
      label: "Plus large victoire à domicile",
    },
    {
      key: "unbeaten",
      node: (
        <p
          className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
          style={{ color: GREEN }}
        >
          {records.maxUnbeaten}
        </p>
      ),
      label: "Matchs consécutifs sans défaite",
    },
    {
      key: "wins",
      node: (
        <p
          className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
          style={{ color: GREEN }}
        >
          {records.maxWinStreak}
        </p>
      ),
      label: "Victoires consécutives",
    },
    {
      key: "away",
      node: <Score line={records.biggestAwayWin} />,
      label: "Plus large victoire à l'extérieur",
    },
    {
      key: "losses",
      node: (
        <p
          className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
          style={{ color: RED }}
        >
          {records.maxLoseStreak}
        </p>
      ),
      label: "Défaites consécutives",
    },
    {
      key: "winless",
      node: (
        <p
          className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
          style={{ color: RED }}
        >
          {records.maxWinless}
        </p>
      ),
      label: "Matchs consécutifs sans victoire",
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(10rem,16rem)_1fr]">
        <div className="flex items-center justify-center border-b border-border/70 px-4 py-6 lg:border-b-0 lg:border-r">
          <h2 className="text-center font-display text-xl font-bold uppercase tracking-wide sm:text-2xl lg:text-left">
            Graphique des victoires
          </h2>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-y-0">
          {cells.map((cell, index) => (
            <div
              key={cell.key}
              className={cn(
                "flex flex-col items-center justify-center gap-2 px-4 py-6 text-center",
                index < 3 && "sm:border-b sm:border-border/70",
                index % 3 !== 2 && "sm:border-r sm:border-border/70"
              )}
            >
              {cell.node}
              <p className="max-w-[12rem] text-sm text-foreground">{cell.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
