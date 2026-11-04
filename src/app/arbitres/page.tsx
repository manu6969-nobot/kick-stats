import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMergedMatches } from "@/lib/live-results";
import {
  getRefereeSeasonStats,
  officialDisplayName,
} from "@/lib/referees";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";


export const revalidate = 60;
export const metadata: Metadata = {
  title: "Arbitres",
};

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default async function ArbitresPage() {
  const allMatches = await getMergedMatches();
  const refs = getRefereeSeasonStats(allMatches);
  const centrals = refs.filter((r) => r.matchesAsReferee > 0);
  const assistantsOnly = refs.filter(
    (r) => r.matchesAsReferee === 0 && r.matchesAsAssistant > 0
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Officiels"
        title="Stats arbitres"
        description={`${centrals.length} arbitres centraux · ${assistantsOnly.length} assistants uniquement — cartons issus des feuilles de match RBFA.`}
      />

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Arbitres centraux</h2>
        {centrals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Aucun arbitre trouvé dans les matchs terminés.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Arbitre</TableHead>
                  <TableHead className="text-center">Matchs</TableHead>
                  <TableHead className="text-center">Jaunes</TableHead>
                  <TableHead className="text-center">2e j.</TableHead>
                  <TableHead className="text-center">Rouges</TableHead>
                  <TableHead className="text-center">Moy. j/m</TableHead>
                  <TableHead className="text-center">Buts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centrals.map((ref, index) => (
                  <TableRow key={ref.id}>
                    <TableCell className="text-center font-display font-bold text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/arbitres/${ref.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {officialDisplayName(ref)}
                      </Link>
                      {ref.matchesAsAssistant > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {ref.matchesAsAssistant} comme assistant
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-display tabular-nums font-bold">
                      {ref.matchesAsReferee}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-draw">
                      {ref.yellowCards}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {ref.secondYellows}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-loss">
                      {ref.redCards}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center font-display tabular-nums",
                        ref.avgYellowPerMatch >= 4 && "text-loss font-bold"
                      )}
                    >
                      {fmtAvg(ref.avgYellowPerMatch)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {ref.goals}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {assistantsOnly.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Assistants</h2>
          <p className="text-sm text-muted-foreground">
            Officiels n’ayant pas dirigé de match en central dans les données
            disponibles.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Assistant</TableHead>
                  <TableHead className="text-center">Matchs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assistantsOnly.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell>
                      <Link
                        href={`/arbitres/${ref.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {officialDisplayName(ref)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-display tabular-nums font-bold">
                      {ref.matchesAsAssistant}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
