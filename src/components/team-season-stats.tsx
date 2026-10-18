import { CalendarCheck2, Goal } from "lucide-react";
import type { TeamFormResult } from "@/lib/stats";
import { cn } from "@/lib/utils";

type Props = {
  goalsFor: number;
  goalsAgainst: number;
  played: number;
  yellowCards: number;
  redCards: number;
  form: TeamFormResult[];
};

function formLetter(result: TeamFormResult) {
  // Style tableau belge / FR : Gagné / Nul / Perdu
  if (result === "W") return "G";
  if (result === "D") return "N";
  return "P";
}

export function TeamSeasonStats({
  goalsFor,
  goalsAgainst,
  played,
  yellowCards,
  redCards,
  form,
}: Props) {
  const metrics = [
    {
      label: "Buts marqués",
      value: goalsFor,
      color: "text-win",
      icon: <Goal className="size-5 text-win" aria-hidden />,
    },
    {
      label: "Buts encaissés",
      value: goalsAgainst,
      color: "text-loss",
      icon: <Goal className="size-5 text-loss" aria-hidden />,
    },
    {
      label: "Matchs joués",
      value: played,
      color: "text-foreground",
      icon: <CalendarCheck2 className="size-5 text-foreground" aria-hidden />,
    },
    {
      label: "Cartons jaunes",
      value: yellowCards,
      color: "text-draw",
      icon: (
        <span
          className="inline-block h-5 w-3.5 rounded-[2px] bg-draw shadow-sm"
          aria-hidden
        />
      ),
    },
    {
      label: "Cartons rouges",
      value: redCards,
      color: "text-loss",
      icon: (
        <span
          className="inline-block h-5 w-3.5 rounded-[2px] bg-loss shadow-sm"
          aria-hidden
        />
      ),
    },
  ];

  return (
    <section className="animate-rise-delay-1 overflow-hidden rounded-xl border border-border/80 bg-card">
      <div className="grid grid-cols-2 divide-x divide-y divide-border/70 sm:grid-cols-5 sm:divide-y-0">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col items-center justify-center gap-2 px-3 py-5 text-center"
          >
            {m.icon}
            <p className={cn("font-display text-4xl font-extrabold tabular-nums", m.color)}>
              {m.value}
            </p>
            <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 px-4 py-5 sm:px-6">
        <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Séries
        </h3>
        {form.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Aucun match terminé pour le moment.
          </p>
        ) : (
          <div
            className="flex flex-wrap items-center justify-center gap-1.5"
            aria-label={`Série: ${form.map(formLetter).join(", ")}`}
          >
            {form.map((result, i) => (
              <span
                key={`${result}-${i}`}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md font-display text-sm font-bold text-white shadow-sm",
                  result === "W" && "bg-win",
                  result === "D" && "bg-draw",
                  result === "L" && "bg-loss"
                )}
              >
                {formLetter(result)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
