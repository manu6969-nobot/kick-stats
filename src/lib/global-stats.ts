import { players, teams } from "@/data/championship";
import type { Match, TeamId } from "@/data/types";
import { getRefereeSeasonStats } from "@/lib/referees";
import {
  computeStandings,
  getAllPlayerSeasonStats,
  getPlayer,
  getTeam,
  getTeamSeasonStats,
  playerDisplayName,
} from "@/lib/stats";
import { GOAL_PERIODS, type GoalPeriodId } from "@/lib/team-dashboard";

export type NamedStat = {
  id: string;
  label: string;
  href?: string;
  value: number | string;
  detail?: string;
};

export type LeaderRow = {
  id: string;
  name: string;
  href: string;
  teamId?: TeamId;
  teamShort?: string;
  primary: number;
  secondary?: number;
  tertiary?: string;
};

export type GlobalSeasonStats = {
  overview: {
    teams: number;
    players: number;
    totalMatches: number;
    finished: number;
    scheduled: number;
    goals: number;
    goalsPerMatch: number;
    homeGoals: number;
    awayGoals: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    cleanSheets: number;
    goallessDraws: number;
    penalties: number;
    ownGoals: number;
    yellowCards: number;
    secondYellows: number;
    redDirect: number;
    redTotal: number;
    yellowPerMatch: number;
    cardsPerMatch: number;
  };
  extremes: {
    highestScoring: {
      matchId: string;
      label: string;
      href: string;
      total: number;
      score: string;
    } | null;
    biggestWin: {
      matchId: string;
      label: string;
      href: string;
      margin: number;
      score: string;
    } | null;
  };
  periods: { id: GoalPeriodId; label: string; goals: number }[];
  scorelines: { score: string; count: number }[];
  players: {
    scorers: LeaderRow[];
    assists: LeaderRow[];
    minutes: LeaderRow[];
    yellows: LeaderRow[];
    reds: LeaderRow[];
  };
  clubs: {
    attack: LeaderRow[];
    defense: LeaderRow[];
    points: LeaderRow[];
    cleanSheets: LeaderRow[];
    yellows: LeaderRow[];
    reds: LeaderRow[];
  };
  referees: {
    busiest: LeaderRow[];
    yellowAvg: LeaderRow[];
  };
};

function periodIdForMinute(minute: number): GoalPeriodId {
  for (const p of GOAL_PERIODS) {
    if (minute >= p.min && minute <= p.max) return p.id;
  }
  return "76-90";
}

function matchLabel(match: Match) {
  const home = getTeam(match.homeTeamId)?.shortName ?? match.homeTeamId;
  const away = getTeam(match.awayTeamId)?.shortName ?? match.awayTeamId;
  return `${home} ${match.homeScore ?? 0}–${match.awayScore ?? 0} ${away}`;
}

function playerLeader(
  playerId: string,
  primary: number,
  secondary?: number,
  tertiary?: string
): LeaderRow | null {
  const player = getPlayer(playerId);
  if (!player) return null;
  const team = getTeam(player.teamId);
  return {
    id: player.id,
    name: playerDisplayName(player),
    href: `/joueurs/${player.id}`,
    teamId: player.teamId,
    teamShort: team?.shortName,
    primary,
    secondary,
    tertiary,
  };
}

function teamLeader(
  teamId: TeamId,
  primary: number,
  secondary?: number,
  tertiary?: string
): LeaderRow | null {
  const team = getTeam(teamId);
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    href: `/equipes/${team.id}`,
    teamId: team.id,
    teamShort: team.shortName,
    primary,
    secondary,
    tertiary,
  };
}

/** Agrège tous les critères saison disponibles (matchs, joueurs, clubs, arbitres). */
export function getGlobalSeasonStats(
  allMatches: Match[],
  limit = 5
): GlobalSeasonStats {
  const finished = allMatches.filter(
    (m) =>
      m.status === "finished" && m.homeScore != null && m.awayScore != null
  );
  const scheduled = allMatches.filter((m) => m.status === "scheduled").length;

  let goals = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let cleanSheets = 0;
  let goallessDraws = 0;
  let penalties = 0;
  let ownGoals = 0;
  let yellowCards = 0;
  let secondYellows = 0;
  let redDirect = 0;
  let highest: GlobalSeasonStats["extremes"]["highestScoring"] = null;
  let biggest: GlobalSeasonStats["extremes"]["biggestWin"] = null;

  const periodCounts: Record<GoalPeriodId, number> = {
    "1-15": 0,
    "16-30": 0,
    "31-45": 0,
    "46-60": 0,
    "61-75": 0,
    "76-90": 0,
  };
  const scorelineMap = new Map<string, number>();

  for (const match of finished) {
    const hs = match.homeScore!;
    const as = match.awayScore!;
    const total = hs + as;
    goals += total;
    homeGoals += hs;
    awayGoals += as;

    if (hs > as) homeWins += 1;
    else if (hs < as) awayWins += 1;
    else {
      draws += 1;
      if (hs === 0) goallessDraws += 1;
    }
    if (as === 0) cleanSheets += 1;
    if (hs === 0) cleanSheets += 1;

    const key = `${Math.max(hs, as)}-${Math.min(hs, as)}`;
    scorelineMap.set(key, (scorelineMap.get(key) || 0) + 1);

    if (!highest || total > highest.total) {
      highest = {
        matchId: match.id,
        label: matchLabel(match),
        href: `/matchs/${match.id}`,
        total,
        score: `${hs}–${as}`,
      };
    }
    const margin = Math.abs(hs - as);
    if (margin > 0 && (!biggest || margin > biggest.margin)) {
      biggest = {
        matchId: match.id,
        label: matchLabel(match),
        href: `/matchs/${match.id}`,
        margin,
        score: `${hs}–${as}`,
      };
    }

    for (const ev of match.events ?? []) {
      if (ev.type === "goal") {
        const detail = ev.detail?.toLowerCase() ?? "";
        if (detail.includes("penalty") || detail.includes("pénal")) {
          penalties += 1;
        }
        periodCounts[periodIdForMinute(ev.minute)] += 1;
      } else if (ev.type === "own_goal") {
        ownGoals += 1;
        periodCounts[periodIdForMinute(ev.minute)] += 1;
      } else if (ev.type === "yellow") {
        yellowCards += 1;
      } else if (ev.type === "second_yellow") {
        yellowCards += 1;
        secondYellows += 1;
      } else if (ev.type === "red") {
        redDirect += 1;
      }
    }
  }

  const n = finished.length || 1;
  const redTotal = redDirect + secondYellows;
  const playerStats = getAllPlayerSeasonStats(allMatches);
  const standings = computeStandings(allMatches);
  const refs = getRefereeSeasonStats(allMatches).filter(
    (r) => r.matchesAsReferee > 0
  );

  const scorers = playerStats
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, limit)
    .map((s) => playerLeader(s.playerId, s.goals, s.assists, "buts"))
    .filter((x): x is LeaderRow => x != null);

  const assists = playerStats
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, limit)
    .map((s) => playerLeader(s.playerId, s.assists, s.goals, "passes"))
    .filter((x): x is LeaderRow => x != null);

  const minutes = playerStats
    .filter((s) => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || b.appearances - a.appearances)
    .slice(0, limit)
    .map((s) =>
      playerLeader(s.playerId, s.minutes, s.appearances, "min / MJ")
    )
    .filter((x): x is LeaderRow => x != null);

  const yellows = playerStats
    .filter((s) => s.yellowCards > 0)
    .sort((a, b) => b.yellowCards - a.yellowCards || b.redCards - a.redCards)
    .slice(0, limit)
    .map((s) =>
      playerLeader(s.playerId, s.yellowCards, s.redCards, "J / R")
    )
    .filter((x): x is LeaderRow => x != null);

  const reds = playerStats
    .filter((s) => s.redCards > 0)
    .sort(
      (a, b) =>
        b.redCards - a.redCards ||
        (b.secondYellows ?? 0) - (a.secondYellows ?? 0)
    )
    .slice(0, limit)
    .map((s) =>
      playerLeader(
        s.playerId,
        s.redCards,
        s.secondYellows ?? 0,
        "rouges / 2e j."
      )
    )
    .filter((x): x is LeaderRow => x != null);

  const clubRows = teams.map((t) => ({
    teamId: t.id as TeamId,
    season: getTeamSeasonStats(t.id, allMatches),
    standing: standings.find((s) => s.teamId === t.id),
  }));

  const attack = [...clubRows]
    .sort((a, b) => b.season.goalsFor - a.season.goalsFor)
    .slice(0, limit)
    .map((r) =>
      teamLeader(r.teamId, r.season.goalsFor, r.season.goalsAgainst, "BP / BC")
    )
    .filter((x): x is LeaderRow => x != null);

  const defense = [...clubRows]
    .sort((a, b) => a.season.goalsAgainst - b.season.goalsAgainst)
    .slice(0, limit)
    .map((r) =>
      teamLeader(
        r.teamId,
        r.season.goalsAgainst,
        r.season.cleanSheets,
        "BC / CS"
      )
    )
    .filter((x): x is LeaderRow => x != null);

  const points = standings.slice(0, limit).map((s) =>
    teamLeader(s.teamId, s.points, s.goalDiff, "pts / diff")
  ).filter((x): x is LeaderRow => x != null);

  const clubCleanSheets = [...clubRows]
    .sort((a, b) => b.season.cleanSheets - a.season.cleanSheets)
    .slice(0, limit)
    .map((r) =>
      teamLeader(r.teamId, r.season.cleanSheets, r.season.played, "CS / MJ")
    )
    .filter((x): x is LeaderRow => x != null);

  const clubYellows = [...clubRows]
    .sort((a, b) => b.season.yellowCards - a.season.yellowCards)
    .slice(0, limit)
    .map((r) =>
      teamLeader(r.teamId, r.season.yellowCards, r.season.redCards, "J / R")
    )
    .filter((x): x is LeaderRow => x != null);

  const clubReds = [...clubRows]
    .sort((a, b) => b.season.redCards - a.season.redCards)
    .slice(0, limit)
    .map((r) =>
      teamLeader(r.teamId, r.season.redCards, r.season.yellowCards, "R / J")
    )
    .filter((x): x is LeaderRow => x != null);

  const busiestRefs = [...refs]
    .sort((a, b) => b.matchesAsReferee - a.matchesAsReferee)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      href: `/arbitres/${r.id}`,
      primary: r.matchesAsReferee,
      secondary: r.yellowCards,
      tertiary: "matchs / jaunes",
    }));

  const yellowAvgRefs = [...refs]
    .filter((r) => r.matchesAsReferee >= 2)
    .sort((a, b) => b.avgYellowPerMatch - a.avgYellowPerMatch)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`.trim(),
      href: `/arbitres/${r.id}`,
      primary: Math.round(r.avgYellowPerMatch * 10) / 10,
      secondary: r.matchesAsReferee,
      tertiary: "moy. j/m · matchs",
    }));

  return {
    overview: {
      teams: teams.length,
      players: players.length,
      totalMatches: allMatches.length,
      finished: finished.length,
      scheduled,
      goals,
      goalsPerMatch: finished.length ? goals / finished.length : 0,
      homeGoals,
      awayGoals,
      homeWins,
      draws,
      awayWins,
      cleanSheets,
      goallessDraws,
      penalties,
      ownGoals,
      yellowCards,
      secondYellows,
      redDirect,
      redTotal,
      yellowPerMatch: finished.length ? yellowCards / finished.length : 0,
      cardsPerMatch:
        finished.length
          ? (yellowCards + secondYellows + redDirect) / finished.length
          : 0,
    },
    extremes: { highestScoring: highest, biggestWin: biggest },
    periods: GOAL_PERIODS.map((p) => ({
      id: p.id,
      label: p.label,
      goals: periodCounts[p.id],
    })),
    scorelines: [...scorelineMap.entries()]
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => b.count - a.count || a.score.localeCompare(b.score))
      .slice(0, 8),
    players: { scorers, assists, minutes, yellows, reds },
    clubs: {
      attack,
      defense,
      points,
      cleanSheets: clubCleanSheets,
      yellows: clubYellows,
      reds: clubReds,
    },
    referees: { busiest: busiestRefs, yellowAvg: yellowAvgRefs },
  };
}

export function fmt1(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function fmtPct(part: number, total: number) {
  if (!total) return "0 %";
  return `${Math.round((100 * part) / total)} %`;
}
