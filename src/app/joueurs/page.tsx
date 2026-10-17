import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTopAssists,
  getTopScorers,
  playerDisplayName,
  positionLabel,
} from "@/lib/stats";
import { playerStats, players } from "@/data/championship";
import { getPlayer, getTeam } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joueurs",
};

export default function JoueursPage() {
  const scorers = getTopScorers(20);
  const assists = getTopAssists(15);
  const all = playerStats
    .map((s) => ({
      stats: s,
      player: getPlayer(s.playerId)!,
      team: getTeam(getPlayer(s.playerId)!.teamId)!,
    }))
    .sort((a, b) => a.player.lastName.localeCompare(b.player.lastName, "fr"));

  return (
    <div>
      <PageHeader
        eyebrow="Individuels"
        title="Stats joueurs"
        description="Buteurs, passeurs et fiches complètes — ajoutez vos données dans championship.ts."
      />

      {players.length === 0 ? (
        <p className="animate-rise-delay-1 rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
          Aucun joueur saisi pour l&apos;instant.
          <br />
          Ajoutez l&apos;effectif et les stats dans{" "}
          <code className="text-foreground">src/data/championship.ts</code>.
        </p>
      ) : (
      <Tabs defaultValue="buteurs" className="animate-rise-delay-1 gap-6">
        <TabsList className="h-auto flex-wrap bg-muted/80 p-1">
          <TabsTrigger value="buteurs">Buteurs</TabsTrigger>
          <TabsTrigger value="passeurs">Passeurs</TabsTrigger>
          <TabsTrigger value="tous">Tous ({players.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="buteurs">
          <LeaderTable rows={scorers} mode="goals" />
        </TabsContent>
        <TabsContent value="passeurs">
          <LeaderTable rows={assists} mode="assists" />
        </TabsContent>
        <TabsContent value="tous">
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Joueur</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-center">MJ</TableHead>
                  <TableHead className="text-center">Buts</TableHead>
                  <TableHead className="text-center">Passes</TableHead>
                  <TableHead className="hidden text-center sm:table-cell">Cartons</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map(({ player, team, stats }) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Link
                        href={`/joueurs/${player.id}`}
                        className="flex items-center gap-2.5 font-medium hover:text-primary"
                      >
                        <TeamBadge team={team} size="sm" />
                        <span>
                          {playerDisplayName(player)}
                          <span className="ml-2 text-xs text-muted-foreground">
                            #{player.number}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {positionLabel(player.position)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{stats.appearances}</TableCell>
                    <TableCell className="text-center font-display font-bold tabular-nums">
                      {stats.goals}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{stats.assists}</TableCell>
                    <TableCell className="hidden text-center tabular-nums sm:table-cell">
                      <span className="text-score">{stats.yellowCards}</span>
                      {" / "}
                      <span className="text-loss">{stats.redCards}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

function LeaderTable({
  rows,
  mode,
}: {
  rows: ReturnType<typeof getTopScorers>;
  mode: "goals" | "assists";
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">Buts</TableHead>
            <TableHead className="text-center">Passes</TableHead>
            <TableHead className="text-center">MJ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ player, team, stats }, index) => (
            <TableRow key={player.id}>
              <TableCell className="text-center font-display font-bold text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/joueurs/${player.id}`}
                  className="font-medium hover:text-primary"
                >
                  {playerDisplayName(player)}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TeamBadge team={team} size="sm" />
                  <span className="text-sm">{team.shortName}</span>
                </div>
              </TableCell>
              <TableCell
                className={`text-center font-display tabular-nums ${mode === "goals" ? "text-lg font-bold text-pitch" : ""}`}
              >
                {stats.goals}
              </TableCell>
              <TableCell
                className={`text-center font-display tabular-nums ${mode === "assists" ? "text-lg font-bold text-pitch" : ""}`}
              >
                {stats.assists}
              </TableCell>
              <TableCell className="text-center tabular-nums">{stats.appearances}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
