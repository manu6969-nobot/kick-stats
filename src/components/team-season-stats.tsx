import { CalendarCheck2, Goal, Shield, Trophy } from "lucide-react";
import type { TeamFormResult } from "@/lib/stats";
import { cn } from "@/lib/utils";

type Props = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  goalsPerGame: number;
  concededPerGame: number;
  penalties: number;
  form: TeamFormResult[];
};

function formLetter(result: TeamFormResult) {
  if (result === "W") return "V";
  if (result === "D") return "N";
  return "D";
}

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function TeamSeasonStats({
  played,
  won,
  drawn,
  lost,
  points,
  goalsFor,
  goalsAgainst,
  goalDiff,
  cleanSheets,
  yellowCards,
  redCards,
  goalsPerGame,
  concededPerGame,
  penalties,
  form,
}: Props) {
  const record = [
    {
      label: "Victoires",
      value: won,
      color: "text-win",
    },
    {
      label: "Nuls",
      value: drawn,
      color: "text-draw",
    },
    {
      label: "Défaites",
      value: lost,
      color: "text-loss",
    },
    {
      label: "Points",
      value: points,
      color: "text-pitch",
      icon: <Trophy className="size-4 text-pitch" aria-hidden />,
    },
  ];

  const metrics = [
    {
      label: "Buts marqués",
      value: goalsFor,
      hint: played ? `${fmtAvg(goalsPerGame)} / match` : undefined,
      color: "text-win",
      icon: <Goal className="size-5 text-win" aria-hidden />,
    },
    {
      label: "Buts encaissés",
      value: goalsAgainst,
      hint: played ? `${fmtAvg(concededPerGame)} / match` : undefined,
      color: "text-loss",
      icon: <Goal className="size-5 text-loss" aria-hidden />,
    },
    {
      label: "Différence",
      value: `${goalDiff > 0 ? "+" : ""}${goalDiff}`,
      color:
        goalDiff > 0 ? "text-win" : goalDiff < 0 ? "text-loss" : "text-foreground",
      icon: <Shield className="size-5 text-foreground" aria-hidden />,
    },
    {
      label: "Clean sheets",
      value: cleanSheets,
      color: "text-foreground",
      icon: <Shield className="size-5 text-pitch" aria-hidden />,
    },
    {
      label: "Matchs joués",
      value: played,
      color: "text-foreground",
      icon: <CalendarCheck2 className="size-5 text-foreground" aria-hidden />,
    },
    {
      label: "Pénaltys",
      value: penalties,
      color: "text-foreground",
      icon: (
        <span className="font-display text-sm font-bold text-pitch" aria-hidden>
          P
        </span>
      ),
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
    <section className="animate-rise-delay-1 space-y-4">
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="border-b border-border/70 px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-bold">Bilan de saison</h2>
          <p className="text-sm text-muted-foreground">
            Calculé depuis les scores et temps forts RBFA.
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border/70 sm:grid-cols-4 sm:divide-y-0">
          {record.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center justify-center gap-1 px-3 py-4 text-center"
            >
              {m.icon}
              <p className={cn("font-display text-3xl font-extrabold tabular-nums", m.color)}>
                {m.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border/70 border-t border-border/70 sm:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-center"
            >
              {m.icon}
              <p className={cn("font-display text-3xl font-extrabold tabular-nums", m.color)}>
                {m.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
              {m.hint ? (
                <p className="text-[11px] tabular-nums text-muted-foreground/80">{m.hint}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t border-border/70 px-4 py-5 sm:px-6">
          <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Série récente
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
      </div>
    </section>
  );
}
