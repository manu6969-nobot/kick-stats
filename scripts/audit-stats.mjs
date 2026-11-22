#!/usr/bin/env node
/**
 * Audit d’incohérences entre scores, temps forts, classement et stats joueurs.
 * Usage: node scripts/audit-stats.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";
import { register } from "node:module";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const runner = `
import { matches as baseMatches, teams, players } from "../src/data/championship.ts";
import {
  applyLiveResult,
  isEmptyLiveResult,
  computePlayerStatsFromMatches,
  scoreFromGoals,
} from "../src/lib/live-results-shared.ts";
import { computeStandings } from "../src/lib/stats.ts";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const live = JSON.parse(readFileSync(path.join(ROOT, "data/live-results.json"), "utf8"));

function merge() {
  return baseMatches.map((m) => {
    const liveResult = live.matches?.[m.id];
    if (!liveResult || isEmptyLiveResult(liveResult)) return m;
    return applyLiveResult(m, liveResult);
  });
}

const all = merge();
const finished = all.filter((m) => m.status === "finished" && m.homeScore != null);
const standings = computeStandings(all);
const derived = computePlayerStatsFromMatches(all);
const byPlayer = new Map(derived.map((s) => [s.playerId, s]));
const teamName = new Map(teams.map((t) => [t.id, t.shortName || t.name]));
const playerName = new Map(
  players.map((p) => [p.id, \`\${p.firstName} \${p.lastName}\`.trim()])
);

const issues = [];

console.log("=== META ===");
console.log({
  updatedAt: live.updatedAt,
  finished: finished.length,
  total: all.length,
  playersWithStats: derived.length,
});

console.log("\\n=== SCORE vs TEMPS FORTS ===");
let scoreEventMismatch = 0;
let scoreEventOk = 0;
let goalsButNoEventGoals = 0;
for (const m of finished) {
  const ev = m.events || [];
  const goals = ev.filter((e) => e.type === "goal" || e.type === "own_goal");
  if (!goals.length) {
    if ((m.homeScore || 0) + (m.awayScore || 0) > 0) goalsButNoEventGoals++;
    continue;
  }
  const fromEv = scoreFromGoals(ev, m.homeTeamId, m.awayTeamId);
  if (fromEv.homeScore !== m.homeScore || fromEv.awayScore !== m.awayScore) {
    scoreEventMismatch++;
    issues.push(
      \`SCORE≠EVENTS \${m.id} \${teamName.get(m.homeTeamId)}-\${teamName.get(m.awayTeamId)} score=\${m.homeScore}-\${m.awayScore} events=\${fromEv.homeScore}-\${fromEv.awayScore} (\${m.date})\`
    );
  } else scoreEventOk++;
}
console.log({ scoreEventOk, scoreEventMismatch, goalsButNoEventGoals });

console.log("\\n=== CLASSEMENT POINTS / BP ===");
let standOk = 0;
let ptsBad = 0;
for (const row of standings) {
  const expect = row.won * 3 + row.drawn;
  if (row.points !== expect || row.played !== row.won + row.drawn + row.lost) {
    ptsBad++;
    issues.push(
      \`POINTS \${teamName.get(row.teamId)} pts=\${row.points} expect=\${expect} J=\${row.played} G/N/P=\${row.won}/\${row.drawn}/\${row.lost}\`
    );
  }
  if (row.goalDiff !== row.goalsFor - row.goalsAgainst) {
    issues.push(
      \`DIFF \${teamName.get(row.teamId)} Diff=\${row.goalDiff} BP-BC=\${row.goalsFor - row.goalsAgainst}\`
    );
  } else standOk++;
}
console.log({ standOk, ptsBad });

console.log("\\n=== BP ÉQUIPE vs BUTS ÉVÉNEMENTS ===");
for (const row of standings) {
  let eventGoals = 0;
  let matchesWithEvents = 0;
  let matchesFinished = 0;
  for (const m of finished) {
    if (m.homeTeamId !== row.teamId && m.awayTeamId !== row.teamId) continue;
    matchesFinished++;
    const hasGoalEv = (m.events || []).some(
      (e) => e.type === "goal" || e.type === "own_goal"
    );
    if (!hasGoalEv) continue;
    matchesWithEvents++;
    const s = scoreFromGoals(m.events || [], m.homeTeamId, m.awayTeamId);
    eventGoals += row.teamId === m.homeTeamId ? s.homeScore : s.awayScore;
  }
  // Compare only if every scored match for this team has events (or eventGoals covers)
  // Soft check: if all finished matches with goals>0 for team have events, totals must match
  let coveredScore = 0;
  let uncoveredScore = 0;
  for (const m of finished) {
    if (m.homeTeamId !== row.teamId && m.awayTeamId !== row.teamId) continue;
    const scored = row.teamId === m.homeTeamId ? m.homeScore : m.awayScore;
    const hasGoalEv = (m.events || []).some(
      (e) => e.type === "goal" || e.type === "own_goal"
    );
    if (hasGoalEv || scored === 0) coveredScore += scored;
    else uncoveredScore += scored;
  }
  if (uncoveredScore === 0 && eventGoals !== row.goalsFor) {
    issues.push(
      \`TEAM BP≠EVENTS \${teamName.get(row.teamId)} classement=\${row.goalsFor} events=\${eventGoals}\`
    );
  } else if (uncoveredScore > 0) {
    // partial coverage — report gap between known events and classement
    if (eventGoals !== coveredScore) {
      issues.push(
        \`TEAM BP PARTIEL \${teamName.get(row.teamId)} events=\${eventGoals} coveredScore=\${coveredScore} totalBP=\${row.goalsFor} sansEvents=\${uncoveredScore}\`
      );
    }
  }
}

console.log("\\n=== BUTEURS ===");
let goalsNoPlayer = 0;
let goalsOk = 0;
const goalCounts = new Map();
for (const m of finished) {
  for (const ev of m.events || []) {
    if (ev.type !== "goal") continue;
    if (!ev.playerId) {
      goalsNoPlayer++;
      issues.push(
        \`BUT SANS JOUEUR \${m.id} \${teamName.get(ev.teamId)} min=\${ev.minute} \${ev.detail || ""}\`
      );
    } else {
      goalsOk++;
      goalCounts.set(ev.playerId, (goalCounts.get(ev.playerId) || 0) + 1);
    }
  }
}
for (const [pid, n] of goalCounts) {
  const s = byPlayer.get(pid);
  if (!s || s.goals !== n) {
    issues.push(
      \`JOUEUR BUTS \${playerName.get(pid) || pid} events=\${n} stats=\${s?.goals ?? "—"}\`
    );
  }
}
console.log({ goalsOk, goalsNoPlayer, scorers: goalCounts.size });

console.log("\\n=== BUTS ÉQUIPE ≠ CLUB JOUEUR ===");
let teamMismatch = 0;
for (const m of finished) {
  for (const ev of m.events || []) {
    if (ev.type !== "goal" || !ev.playerId) continue;
    const p = players.find((x) => x.id === ev.playerId);
    if (p && p.teamId !== ev.teamId) {
      teamMismatch++;
      issues.push(
        \`BUT MAUVAISE ÉQUIPE \${m.id} \${playerName.get(ev.playerId)} club=\${teamName.get(p.teamId)} eventTeam=\${teamName.get(ev.teamId)} min=\${ev.minute}\`
      );
    }
  }
}
console.log({ teamMismatch });

console.log("\\n=== MINUTES ===");
let scoredNoMinutes = 0;
let minutesMismatch = 0;
for (const s of derived) {
  if (s.goals > 0 && s.minutes === 0) {
    scoredNoMinutes++;
    issues.push(
      \`BUTEUR 0 MIN \${playerName.get(s.playerId) || s.playerId} buts=\${s.goals}\`
    );
  }
  let mins = 0;
  let apps = 0;
  for (const m of finished) {
    const a = m.appearances?.find((x) => x.playerId === s.playerId);
    if (a) {
      apps++;
      mins += Math.max(0, a.minutes || 0);
    } else if (!m.appearances?.length) {
      const involved = (m.events || []).some(
        (e) => e.playerId === s.playerId || e.assistId === s.playerId
      );
      if (involved) {
        apps++;
        mins += 90;
      }
    }
  }
  if (mins !== s.minutes || apps !== s.appearances) {
    minutesMismatch++;
    issues.push(
      \`MIN/APP \${playerName.get(s.playerId) || s.playerId} stats=\${s.minutes}′/\${s.appearances} recalc=\${mins}′/\${apps}\`
    );
  }
}
console.log({ scoredNoMinutes, minutesMismatch });

console.log("\\n=== BUTEUR ABSENT COMPOS ===");
let scorerMissingApp = 0;
for (const m of finished) {
  if (!m.appearances?.length) continue;
  for (const ev of m.events || []) {
    if (ev.type !== "goal" || !ev.playerId) continue;
    if (!m.appearances.some((a) => a.playerId === ev.playerId)) {
      scorerMissingApp++;
      issues.push(
        \`BUTEUR HORS COMPOS \${m.id} \${playerName.get(ev.playerId) || ev.playerId} \${ev.detail || ""} min=\${ev.minute}\`
      );
    }
  }
}
console.log({ scorerMissingApp });

console.log("\\n=== ÉVÉNEMENTS ===");
let zeroMinGoals = 0;
let ownGoals = 0;
for (const m of finished) {
  for (const ev of m.events || []) {
    if (ev.type === "own_goal") ownGoals++;
    if (ev.type === "goal" && !(ev.minute > 0)) {
      zeroMinGoals++;
      issues.push(\`BUT 0′ \${m.id} \${ev.detail || ev.playerId}\`);
    }
  }
}
const sumPlayerGoals = [...goalCounts.values()].reduce((a, b) => a + b, 0);
const sumScores = finished.reduce(
  (a, m) => a + (m.homeScore || 0) + (m.awayScore || 0),
  0
);
console.log({
  zeroMinGoals,
  ownGoals,
  sumScores,
  sumPlayerGoals,
  unexplained: sumScores - sumPlayerGoals - goalsNoPlayer - ownGoals,
});

// Matches without any events but with score
console.log("\\n=== MATCHS AVEC SCORE SANS TEMPS FORTS ===");
const bare = finished.filter(
  (m) =>
    (m.homeScore || 0) + (m.awayScore || 0) > 0 &&
    !(m.events || []).some((e) => e.type === "goal" || e.type === "own_goal")
);
console.log({ count: bare.length });
for (const m of bare.slice(0, 25)) {
  console.log(
    \`  \${m.date} \${m.id} \${teamName.get(m.homeTeamId)}-\${teamName.get(m.awayTeamId)} \${m.homeScore}-\${m.awayScore} ev=\${(m.events||[]).length} apps=\${(m.appearances||[]).length}\`
  );
}
if (bare.length > 25) console.log("  ... +" + (bare.length - 25));

console.log("\\n=== ISSUES (" + issues.length + ") ===");
for (const line of issues.slice(0, 100)) console.log("-", line);
if (issues.length > 100) console.log("... +" + (issues.length - 100) + " autres");

writeFileSync(
  path.join(ROOT, "data/stats-audit.json"),
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      liveUpdatedAt: live.updatedAt,
      summary: {
        finished: finished.length,
        scoreEventMismatch,
        goalsNoPlayer,
        teamMismatch,
        scoredNoMinutes,
        scorerMissingApp,
        zeroMinGoals,
        ownGoals,
        sumScores,
        sumPlayerGoals,
        bareMatches: bare.length,
        issues: issues.length,
      },
      bareMatches: bare.map((m) => ({
        id: m.id,
        date: m.date,
        score: \`\${m.homeScore}-\${m.awayScore}\`,
        home: m.homeTeamId,
        away: m.awayTeamId,
        events: (m.events || []).length,
        appearances: (m.appearances || []).length,
      })),
      issues,
    },
    null,
    2
  ) + "\\n"
);
console.log("\\nÉcrit data/stats-audit.json");
`;

const runnerPath = path.join(ROOT, "scripts/_audit-stats-runner.ts");
writeFileSync(runnerPath, runner);
const r = spawnSync("npx", ["--yes", "tsx", runnerPath], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 30 * 1024 * 1024,
});
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
try {
  // cleanup temp runner
  // keep if failed for debug
} catch {}
process.exit(r.status ?? 1);
