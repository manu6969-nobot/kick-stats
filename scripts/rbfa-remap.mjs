#!/usr/bin/env node
/**
 * Re-mappe data/rbfa-raw.json → live-results (sans rappeler l’API).
 * Corrige notamment le mapping VAUX-SUR-SURE.
 *
 *   node scripts/rbfa-remap.mjs --apply
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

const ALIASES = {
  "372427": "vaux-sur-sure", // R.E.S. VAUX-SUR-SURE
  "369885": "roy",
  "367508": "nothomb",
  "372322": "assenois",
  "372464": "bercheux",
  "370867": "arlon",
  "371455": "houffalize",
  "371403": "marloie",
  "368402": "ochamps",
  "375146": "harre-manhay",
  "365876": "libin",
  "371992": "bastogne",
  "367661": "oppagne",
  "373136": "florenville",
  "367074": "gouvy",
  "371977": "aye",
};

function loadChampionship() {
  const src = readFileSync(path.join(ROOT, "src/data/championship.ts"), "utf8");
  const teams = [];
  const teamRe =
    /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*shortName:\s*"([^"]+)"/g;
  let m;
  while ((m = teamRe.exec(src))) {
    teams.push({ id: m[1], name: m[2], shortName: m[3] });
  }
  const players = [];
  const playerRe =
    /\{\s*id:\s*"(p-[^"]+)",\s*teamId:\s*"([^"]+)",\s*number:\s*(\d+),\s*firstName:\s*"([^"]*)",\s*lastName:\s*"([^"]*)"/g;
  while ((m = playerRe.exec(src))) {
    players.push({
      id: m[1],
      teamId: m[2],
      number: Number(m[3]),
      firstName: m[4],
      lastName: m[5],
    });
  }
  const matches = [];
  const matchRe =
    /\{\s*id:\s*"(m\d+)",\s*matchday:\s*(\d+),\s*date:\s*"([^"]+)",\s*kickoff:\s*"([^"]+)",\s*status:\s*"([^"]+)",\s*homeTeamId:\s*"([^"]+)",\s*awayTeamId:\s*"([^"]+)"/g;
  while ((m = matchRe.exec(src))) {
    matches.push({
      id: m[1],
      matchday: Number(m[2]),
      date: m[3],
      kickoff: m[4],
      homeTeamId: m[6],
      awayTeamId: m[7],
    });
  }
  return { teams, players, matches };
}

function normalizeName(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreName(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 80;
  const ta = new Set(na.split(" ").filter((w) => w.length > 2));
  const tb = new Set(nb.split(" ").filter((w) => w.length > 2));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return Math.round((100 * inter) / (new Set([...ta, ...tb]).size || 1));
}

function findPlayerId(players, teamId, firstName, lastName) {
  const pool = players.filter((p) => p.teamId === teamId);
  let best;
  let bestScore = 0;
  for (const p of pool) {
    const s = scoreName(
      `${p.firstName} ${p.lastName}`,
      `${firstName} ${lastName}`
    );
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 60 ? best.id : undefined;
}

function mapEventKind(kind) {
  if (kind === "goal" || kind === "penalty") return "goal";
  if (kind === "ownGoal" || kind === "own_goal") return "own_goal";
  if (kind === "yellow") return "yellow";
  if (kind === "secondYellow" || kind === "yellowRed") return "second_yellow";
  if (kind === "red") return "red";
  return null;
}

function flattenEvents(detail, homeKickId, awayKickId, players) {
  const out = [];
  const rbfaHome = detail.homeTeam?.id;
  for (const group of detail.events || []) {
    for (const side of ["home", "away"]) {
      for (const ev of group[side] || []) {
        const type = mapEventKind(ev.kind);
        if (!type) continue;
        const teamId =
          ev.teamId === rbfaHome || side === "home" ? homeKickId : awayKickId;
        out.push({
          id: `rbfa-${detail.id}-${ev.minute}-${ev.kind}-${ev.lastName || "x"}`,
          minute: Number(ev.minute) || 0,
          type,
          teamId,
          playerId: findPlayerId(
            players,
            teamId,
            ev.firstName || "",
            ev.lastName || ""
          ),
          detail:
            ev.kind === "penalty"
              ? `penalty · ${ev.firstName || ""} ${ev.lastName || ""}`.trim()
              : `${ev.firstName || ""} ${ev.lastName || ""}`.trim() || undefined,
        });
      }
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
}

const champ = loadChampionship();
const byId = Object.fromEntries(champ.teams.map((t) => [t.id, t]));
const raw = JSON.parse(readFileSync(path.join(ROOT, "data/rbfa-raw.json"), "utf8"));

const teamMap = {};
for (const [rid, row] of Object.entries(raw.teamMap || {})) {
  const kickId = ALIASES[rid] || row.kickId;
  teamMap[rid] = {
    ...row,
    kickId,
    kickName: byId[kickId]?.name || row.kickName,
  };
}

const live = { updatedAt: new Date().toISOString(), matches: {} };
const mapped = [];
const unmatched = [];

for (const m of raw.calendar || []) {
  const detail = raw.details?.[m.id];
  const homeRbfa = m.homeTeam || detail?.homeTeam;
  const awayRbfa = m.awayTeam || detail?.awayTeam;
  const homeId = teamMap[homeRbfa?.id]?.kickId;
  const awayId = teamMap[awayRbfa?.id]?.kickId;
  const start = m.startTime || detail?.startTime || "";
  const dateIso = start.slice(0, 10);
  const outcome = detail?.outcome || m.outcome || {};
  const finished =
    detail?.state === "finished" ||
    outcome.status === "finished" ||
    outcome.isFinished ||
    (outcome.homeTeamGoals != null && outcome.awayTeamGoals != null);

  if (!homeId || !awayId) {
    unmatched.push({
      rbfaId: m.id,
      date: dateIso,
      home: homeRbfa?.name,
      away: awayRbfa?.name,
      reason: "équipe non mappée",
    });
    continue;
  }

  const kickMatch = champ.matches.find(
    (x) =>
      x.date === dateIso && x.homeTeamId === homeId && x.awayTeamId === awayId
  );
  if (!kickMatch) {
    unmatched.push({
      rbfaId: m.id,
      date: dateIso,
      home: byId[homeId]?.name,
      away: byId[awayId]?.name,
      reason: "pas de match kick-stats à cette date",
    });
    continue;
  }
  if (!finished) continue;

  const events = detail
    ? flattenEvents(detail, homeId, awayId, champ.players)
    : [];
  live.matches[kickMatch.id] = {
    status: "finished",
    homeScore: outcome.homeTeamGoals ?? null,
    awayScore: outcome.awayTeamGoals ?? null,
    events,
  };
  mapped.push({
    kickId: kickMatch.id,
    rbfaId: m.id,
    score: `${outcome.homeTeamGoals}-${outcome.awayTeamGoals}`,
    events: events.length,
  });
}

const outPath = path.join(ROOT, "data/live-results.from-rbfa.json");
writeFileSync(outPath, JSON.stringify(live, null, 2) + "\n");
writeFileSync(
  path.join(ROOT, "data/rbfa-team-map.json"),
  JSON.stringify(teamMap, null, 2) + "\n"
);

raw.teamMap = teamMap;
raw.mapped = mapped;
raw.unmatched = unmatched;
writeFileSync(
  path.join(ROOT, "data/rbfa-raw.json"),
  JSON.stringify(raw, null, 2) + "\n"
);

console.log(`Mappés: ${mapped.length} · Non mappés: ${unmatched.length}`);
console.log(`Écrit ${outPath}`);

if (APPLY) {
  const dest = path.join(ROOT, "data/live-results.json");
  let existing = { updatedAt: live.updatedAt, matches: {} };
  if (existsSync(dest)) existing = JSON.parse(readFileSync(dest, "utf8"));
  // Remplace les résultats issus de RBFA (tous les matchs mappés) + garde le reste
  existing.updatedAt = live.updatedAt;
  existing.matches = { ...existing.matches, ...live.matches };
  writeFileSync(dest, JSON.stringify(existing, null, 2) + "\n");
  console.log(
    `Appliqué ${dest} (${Object.keys(existing.matches).length} entrées)`
  );
}
