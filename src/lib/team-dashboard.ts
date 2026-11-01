import type { Match, TeamId } from "@/data/types";
import type { TeamFormResult } from "@/lib/stats";

export const GOAL_PERIODS = [
  { id: "1-15", label: "1 - 15 min", min: 1, max: 15 },
  { id: "16-30", label: "16 - 30 min", min: 16, max: 30 },
  { id: "31-45", label: "31 - 45 min", min: 31, max: 45 },
  { id: "46-60", label: "46 - 60 min", min: 46, max: 60 },
  { id: "61-75", label: "61 - 75 min", min: 61, max: 75 },
  { id: "76-90", label: "76 - 90 min", min: 76, max: 200 },
] as const;

export type GoalPeriodId = (typeof GOAL_PERIODS)[number]["id"];
export type VenueFilter = "all" | "home" | "away";

export type GoalsSlice = {
  played: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type ScoreLine = {
  for: number;
  against: number;
  margin: number;
};

export type TeamDashboard = {
  goals: Record<VenueFilter, GoalsSlice>;
  cards: {
    yellow: number;
    red: number;
    played: number;
  };
  periods: Record<
    GoalPeriodId,
    { goalsFor: number; goalsAgainst: number }
  >;
  records: {
    biggestHomeWin: ScoreLine | null;
    biggestAwayWin: ScoreLine | null;
    maxUnbeaten: number;
    maxWinStreak: number;
    maxLoseStreak: number;
    maxWinless: number;
  };
  form: TeamFormResult[];
};

function emptySlice(): GoalsSlice {
  return { played: 0, goalsFor: 0, goalsAgainst: 0 };
}

function emptyPeriods(): TeamDashboard["periods"] {
  return {
    "1-15": { goalsFor: 0, goalsAgainst: 0 },
    "16-30": { goalsFor: 0, goalsAgainst: 0 },
    "31-45": { goalsFor: 0, goalsAgainst: 0 },
    "46-60": { goalsFor: 0, goalsAgainst: 0 },
    "61-75": { goalsFor: 0, goalsAgainst: 0 },
    "76-90": { goalsFor: 0, goalsAgainst: 0 },
  };
}

function periodIdForMinute(minute: number): GoalPeriodId {
  for (const p of GOAL_PERIODS) {
    if (minute >= p.min && minute <= p.max) return p.id;
  }
  return "76-90";
}

function isGoalForUs(teamId: TeamId, ev: Match["events"][number]) {
  if (ev.type === "goal") return ev.teamId === teamId;
  if (ev.type === "own_goal") return ev.teamId !== teamId;
  return false;
}

function isGoalAgainstUs(teamId: TeamId, ev: Match["events"][number]) {
  if (ev.type === "goal") return ev.teamId !== teamId;
  if (ev.type === "own_goal") return ev.teamId === teamId;
  return false;
}

function maxStreak(form: TeamFormResult[], ok: (r: TeamFormResult) => boolean) {
  let best = 0;
  let cur = 0;
  for (const r of form) {
    if (ok(r)) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function betterWin(
  current: ScoreLine | null,
  scored: number,
  conceded: number
): ScoreLine | null {
  if (scored <= conceded) return current;
  const margin = scored - conceded;
  if (!current || margin > current.margin) {
    return { for: scored, against: conceded, margin };
  }
  if (margin === current.margin && scored > current.for) {
    return { for: scored, against: conceded, margin };
  }
  return current;
}

/** Tableaux de bord type RBFA pour une fiche club. */
export function getTeamDashboard(
  teamId: TeamId,
  allMatches: Match[]
): TeamDashboard {
  const finished = allMatches
    .filter(
      (m) =>
        (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
        m.status === "finished" &&
        m.homeScore != null &&
        m.awayScore != null
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));

  const goals: TeamDashboard["goals"] = {
    all: emptySlice(),
    home: emptySlice(),
    away: emptySlice(),
  };
  const periods = emptyPeriods();
  let yellow = 0;
  let red = 0;
  const form: TeamFormResult[] = [];
  let biggestHomeWin: ScoreLine | null = null;
  let biggestAwayWin: ScoreLine | null = null;

  for (const match of finished) {
    const isHome = match.homeTeamId === teamId;
    const scored = isHome ? match.homeScore! : match.awayScore!;
    const conceded = isHome ? match.awayScore! : match.homeScore!;
    const venue: VenueFilter = isHome ? "home" : "away";

    goals.all.played += 1;
    goals.all.goalsFor += scored;
    goals.all.goalsAgainst += conceded;
    goals[venue].played += 1;
    goals[venue].goalsFor += scored;
    goals[venue].goalsAgainst += conceded;

    if (scored > conceded) form.push("W");
    else if (scored < conceded) form.push("L");
    else form.push("D");

    if (isHome) {
      biggestHomeWin = betterWin(biggestHomeWin, scored, conceded);
    } else {
      biggestAwayWin = betterWin(biggestAwayWin, scored, conceded);
    }

    for (const ev of match.events ?? []) {
      if (ev.teamId === teamId) {
        if (ev.type === "yellow") yellow += 1;
        else if (ev.type === "second_yellow") {
          yellow += 1;
          red += 1;
        } else if (ev.type === "red") {
          red += 1;
        }
      }

      const minute = Math.max(1, ev.minute || 1);
      const pid = periodIdForMinute(minute);
      if (isGoalForUs(teamId, ev)) periods[pid].goalsFor += 1;
      if (isGoalAgainstUs(teamId, ev)) periods[pid].goalsAgainst += 1;
    }
  }

  return {
    goals,
    cards: { yellow, red, played: finished.length },
    periods,
    records: {
      biggestHomeWin,
      biggestAwayWin,
      maxUnbeaten: maxStreak(form, (r) => r !== "L"),
      maxWinStreak: maxStreak(form, (r) => r === "W"),
      maxLoseStreak: maxStreak(form, (r) => r === "L"),
      maxWinless: maxStreak(form, (r) => r !== "W"),
    },
    form,
  };
}
