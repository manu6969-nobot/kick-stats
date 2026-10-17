import Link from "next/link";
import type { Match } from "@/data/types";
import { formatDate, getTeam } from "@/lib/stats";
import { TeamBadge } from "@/components/team-badge";
import { Badge } from "@/components/ui/badge";

export function MatchRow({ match }: { match: Match }) {
  const home = getTeam(match.homeTeamId)!;
  const away = getTeam(match.awayTeamId)!;
  const played = match.status === "finished";

  return (
    <Link
      href={`/matchs/${match.id}`}
      className="group relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-3 transition hover:border-primary/30 hover:shadow-sm sm:gap-4 sm:px-4"
    >
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <span className="hidden text-right text-sm font-medium sm:block">{home.name}</span>
        <span className="text-right text-sm font-medium sm:hidden">{home.shortName}</span>
        <TeamBadge team={home} size="sm" />
      </div>

      <div className="flex min-w-[4.5rem] flex-col items-center justify-center">
        {played ? (
          <span className="animate-score-pop font-display text-xl font-bold tabular-nums tracking-wide sm:text-2xl">
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span className="font-display text-lg font-semibold tabular-nums text-muted-foreground">
            {match.kickoff}
          </span>
        )}
        <span className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {formatDate(match.date)}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TeamBadge team={away} size="sm" />
        <span className="hidden text-sm font-medium sm:block">{away.name}</span>
        <span className="text-sm font-medium sm:hidden">{away.shortName}</span>
      </div>

      {match.status === "live" && (
        <Badge className="absolute right-2 top-2 bg-loss text-white">Live</Badge>
      )}
    </Link>
  );
}
