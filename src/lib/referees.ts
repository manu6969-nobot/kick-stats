import type { Match, MatchOfficial, OfficialRole } from "@/data/types";
import { summarizeCards } from "@/lib/live-results-shared";

export type RefereeRoleFilter = "referee" | "assistant" | "all";

export type RefereeMatchSummary = {
  matchId: string;
  role: OfficialRole;
  yellowCards: number;
  secondYellows: number;
  redCards: number;
  goals: number;
};

export type RefereeSeasonStats = {
  id: string;
  firstName: string;
  lastName: string;
  matchesAsReferee: number;
  matchesAsAssistant: number;
  yellowCards: number;
  secondYellows: number;
  redCards: number;
  goals: number;
  avgYellowPerMatch: number;
  avgCardsPerMatch: number;
  matchIds: string[];
  matches: RefereeMatchSummary[];
};

export function officialId(firstName: string, lastName: string) {
  const raw = `${firstName} ${lastName}`
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `ref-${raw || "inconnu"}`;
}

export function officialDisplayName(o: Pick<MatchOfficial, "firstName" | "lastName">) {
  return `${o.firstName} ${o.lastName}`.trim();
}

export function roleLabel(role: OfficialRole) {
  if (role === "referee") return "Arbitre central";
  if (role === "firstAssistantReferee") return "Assistant 1";
  if (role === "secondAssistantReferee") return "Assistant 2";
  return String(role);
}

function isAssistant(role: OfficialRole) {
  return (
    role === "firstAssistantReferee" ||
    role === "secondAssistantReferee" ||
    /assistant/i.test(String(role))
  );
}

/** Agrège les officiels présents sur les feuilles de match fusionnées. */
export function getRefereeSeasonStats(
  allMatches: Match[]
): RefereeSeasonStats[] {
  const byId = new Map<string, RefereeSeasonStats>();

  for (const match of allMatches) {
    if (match.status !== "finished") continue;
    const officials = match.officials ?? [];
    if (!officials.length) continue;

    const cards = summarizeCards(match.events ?? []);
    const goals = (match.homeScore ?? 0) + (match.awayScore ?? 0);

    for (const off of officials) {
      if (!off.firstName && !off.lastName) continue;
      const id = officialId(off.firstName, off.lastName);
      let row = byId.get(id);
      if (!row) {
        row = {
          id,
          firstName: off.firstName,
          lastName: off.lastName,
          matchesAsReferee: 0,
          matchesAsAssistant: 0,
          yellowCards: 0,
          secondYellows: 0,
          redCards: 0,
          goals: 0,
          avgYellowPerMatch: 0,
          avgCardsPerMatch: 0,
          matchIds: [],
          matches: [],
        };
        byId.set(id, row);
      }

      const asCentral = off.role === "referee";
      if (asCentral) {
        row.matchesAsReferee += 1;
        row.yellowCards += cards.yellowCards;
        row.secondYellows += cards.redFromSecondYellow;
        row.redCards += cards.redDirect;
        row.goals += goals;
      } else if (isAssistant(off.role)) {
        row.matchesAsAssistant += 1;
      }

      if (!row.matchIds.includes(match.id)) row.matchIds.push(match.id);
      row.matches.push({
        matchId: match.id,
        role: off.role,
        yellowCards: asCentral ? cards.yellowCards : 0,
        secondYellows: asCentral ? cards.redFromSecondYellow : 0,
        redCards: asCentral ? cards.redDirect : 0,
        goals: asCentral ? goals : 0,
      });
    }
  }

  for (const row of byId.values()) {
    const n = row.matchesAsReferee;
    row.avgYellowPerMatch = n ? row.yellowCards / n : 0;
    row.avgCardsPerMatch = n
      ? (row.yellowCards + row.secondYellows + row.redCards) / n
      : 0;
    row.matches.sort((a, b) => a.matchId.localeCompare(b.matchId));
  }

  return [...byId.values()].sort((a, b) => {
    if (b.matchesAsReferee !== a.matchesAsReferee) {
      return b.matchesAsReferee - a.matchesAsReferee;
    }
    if (b.matchesAsAssistant !== a.matchesAsAssistant) {
      return b.matchesAsAssistant - a.matchesAsAssistant;
    }
    return a.lastName.localeCompare(b.lastName, "fr");
  });
}

export function getRefereeById(
  id: string,
  allMatches: Match[]
): RefereeSeasonStats | undefined {
  return getRefereeSeasonStats(allMatches).find((r) => r.id === id);
}
