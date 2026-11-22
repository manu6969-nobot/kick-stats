#!/usr/bin/env node
/**
 * Synchronise les dossards (et prénoms corrompus) depuis data/rbfa-raw.json
 * vers src/data/championship.ts.
 *
 * Usage:
 *   node scripts/rbfa-sync-numbers.mjs           # dry-run
 *   node scripts/rbfa-sync-numbers.mjs --apply   # écrit championship.ts
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

const rawPath = path.join(ROOT, "data/rbfa-raw.json");
const champPath = path.join(ROOT, "src/data/championship.ts");

if (!existsSync(rawPath)) {
  console.error("Manque data/rbfa-raw.json — lance d’abord un extract RBFA.");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(rawPath, "utf8"));
let champSrc = readFileSync(champPath, "utf8");

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Parse joueurs depuis championship.ts */
const playerRe =
  /\{\s*id:\s*"(p-[^"]+)",\s*teamId:\s*"([^"]+)",\s*number:\s*(\d+),\s*firstName:\s*"([^"]*)",\s*lastName:\s*"([^"]*)",\s*position:\s*"([^"]*)",\s*nationality:\s*"([^"]*)",\s*age:\s*(\d+),\s*\}/g;

const players = [];
let m;
while ((m = playerRe.exec(champSrc))) {
  players.push({
    id: m[1],
    teamId: m[2],
    number: Number(m[3]),
    firstName: m[4],
    lastName: m[5],
    position: m[6],
    nationality: m[7],
    age: Number(m[8]),
    raw: m[0],
  });
}
if (!players.length) {
  console.error("Aucun joueur parsé dans championship.ts");
  process.exit(1);
}

const rbfaToKick = new Map();
for (const [rid, row] of Object.entries(raw.teamMap || {})) {
  if (row?.kickId) rbfaToKick.set(String(rid), row.kickId);
}

/** Observations RBFA: playerKey → shirts + firstName samples */
const obsByKey = new Map();

function findPlayer(teamId, firstName, lastName) {
  const ln = norm(lastName);
  const fn = norm(firstName);
  const pool = players.filter((p) => p.teamId === teamId);
  let hits = pool.filter(
    (p) => norm(p.lastName) === ln && norm(p.firstName) === fn
  );
  if (hits.length === 1) return hits[0];
  hits = pool.filter((p) => norm(p.lastName) === ln);
  if (hits.length === 1) return hits[0];
  // Prénom corrompu MAttaquant* : match sur suffixe
  hits = pool.filter((p) => {
    if (norm(p.lastName) !== ln) return false;
    const pf = norm(p.firstName);
    if (pf.startsWith("mattaquant")) {
      const rest = pf.replace(/^mattaquant/, "");
      return rest && (fn.endsWith(rest) || fn.includes(rest));
    }
    return pf.startsWith(fn[0] || "") && fn.length >= 3;
  });
  if (hits.length === 1) return hits[0];
  return undefined;
}

function addObs(teamId, firstName, lastName, shirt) {
  const n = Number(shirt);
  if (!Number.isFinite(n) || n <= 0) return;
  const p = findPlayer(teamId, firstName, lastName);
  if (!p) return;
  let row = obsByKey.get(p.id);
  if (!row) {
    row = {
      playerId: p.id,
      teamId,
      shirts: new Map(),
      firstNames: new Map(),
    };
    obsByKey.set(p.id, row);
  }
  row.shirts.set(n, (row.shirts.get(n) || 0) + 1);
  const fn = String(firstName || "").trim();
  if (fn) row.firstNames.set(fn, (row.firstNames.get(fn) || 0) + 1);
}

for (const detail of Object.values(raw.details || {})) {
  const homeKick = rbfaToKick.get(String(detail.homeTeam?.id));
  const awayKick = rbfaToKick.get(String(detail.awayTeam?.id));
  for (const side of ["home", "away"]) {
    const teamId = side === "home" ? homeKick : awayKick;
    if (!teamId) continue;
    for (const group of [...(detail.lineup || []), ...(detail.substitutes || [])]) {
      const p = group[side];
      if (!p?.lastName) continue;
      addObs(teamId, p.firstName || "", p.lastName, p.shirtNumber);
    }
  }
}

function dominant(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
}

/** Propositions par équipe avec résolution de collisions */
const updates = []; // { id, oldNumber, newNumber, oldFirst, newFirst?, confidence }
const skipped = [];
const byTeamProps = new Map();

for (const [playerId, row] of obsByKey) {
  const shirts = [...row.shirts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  if (!byTeamProps.has(row.teamId)) byTeamProps.set(row.teamId, []);
  byTeamProps.get(row.teamId).push({
    playerId,
    shirts,
    firstNames: row.firstNames,
    confidence: shirts[0][1],
  });
}

for (const [teamId, list] of byTeamProps) {
  list.sort((a, b) => b.confidence - a.confidence);
  const teamPlayers = players.filter((p) => p.teamId === teamId);
  const assigned = new Map(); // playerId -> number
  const taken = new Set();

  // 1) Attribuer d’abord les dossards RBFA (priorité = fiabilité)
  for (const prop of list) {
    const player = players.find((p) => p.id === prop.playerId);
    let shirt = null;
    for (const [n] of prop.shirts) {
      if (!taken.has(n)) {
        shirt = n;
        break;
      }
    }
    if (shirt == null) {
      skipped.push({
        playerId: prop.playerId,
        teamId,
        name: `${player.firstName} ${player.lastName}`,
        wanted: prop.shirts.map(([n, c]) => `#${n}×${c}`).join(", "),
        reason: "collision",
      });
      continue;
    }
    assigned.set(player.id, shirt);
    taken.add(shirt);

    const fnDom = dominant(prop.firstNames);
    const newFirst =
      fnDom &&
      player.firstName.startsWith("MAttaquant") &&
      fnDom[0] &&
      norm(fnDom[0]) !== norm(player.firstName)
        ? fnDom[0]
        : undefined;

    if (shirt !== player.number || newFirst) {
      updates.push({
        id: player.id,
        teamId,
        name: `${player.firstName} ${player.lastName}`,
        oldNumber: player.number,
        newNumber: shirt,
        oldFirst: player.firstName,
        newFirst,
        confidence: prop.confidence,
      });
    }
  }

  // 2) Joueurs sans obs RBFA : garder l’ancien n° s’il est libre, sinon prochain libre
  const withoutObs = teamPlayers.filter((p) => !assigned.has(p.id));
  withoutObs.sort((a, b) => a.number - b.number);
  for (const player of withoutObs) {
    let shirt = player.number;
    if (taken.has(shirt)) {
      shirt = 1;
      while (taken.has(shirt)) shirt += 1;
      updates.push({
        id: player.id,
        teamId,
        name: `${player.firstName} ${player.lastName}`,
        oldNumber: player.number,
        newNumber: shirt,
        oldFirst: player.firstName,
        newFirst: undefined,
        confidence: 0,
        reason: "déplacé (n° pris par dossard RBFA)",
      });
    }
    assigned.set(player.id, shirt);
    taken.add(shirt);
  }
}

console.log(`Joueurs site: ${players.length}`);
console.log(`Avec obs RBFA: ${obsByKey.size}`);
console.log(`Mises à jour: ${updates.length}`);
console.log(`Collisions ignorées: ${skipped.length}`);

const numberChanges = updates.filter((u) => u.oldNumber !== u.newNumber);
const nameChanges = updates.filter((u) => u.newFirst);
console.log(`  numéros: ${numberChanges.length}`);
console.log(`  prénoms: ${nameChanges.length}`);

if (numberChanges.length) {
  console.log("\n=== NUMÉROS (extrait) ===");
  for (const u of numberChanges.slice(0, 30)) {
    console.log(
      `  ${u.teamId} ${u.name}: #${u.oldNumber} → #${u.newNumber} (×${u.confidence})`
    );
  }
  if (numberChanges.length > 30) console.log(`  ... +${numberChanges.length - 30}`);
}

if (nameChanges.length) {
  console.log("\n=== PRÉNOMS ===");
  for (const u of nameChanges) {
    console.log(`  ${u.teamId} ${u.oldFirst} ${u.name.split(" ").slice(-1)} → ${u.newFirst}`);
  }
}

if (skipped.length) {
  console.log("\n=== COLLISIONS ===");
  for (const s of skipped) {
    console.log(`  ${s.teamId} ${s.name}: ${s.wanted}`);
  }
}

const reportPath = path.join(ROOT, "data/rbfa-numbers-sync-report.json");
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      detailsUsed: Object.keys(raw.details || {}).length,
      updates,
      skipped,
      stats: {
        players: players.length,
        withObs: obsByKey.size,
        numberChanges: numberChanges.length,
        nameChanges: nameChanges.length,
        collisions: skipped.length,
      },
    },
    null,
    2
  ) + "\n"
);
console.log(`\nRapport: ${reportPath}`);

if (!APPLY) {
  console.log("Dry-run. Relance avec --apply pour écrire championship.ts");
  process.exit(0);
}

let next = champSrc;
let applied = 0;
for (const u of updates) {
  const player = players.find((p) => p.id === u.id);
  const first = u.newFirst ?? player.firstName;
  const oldBlock = player.raw;
  const newBlock = oldBlock
    .replace(/number:\s*\d+/, `number: ${u.newNumber}`)
    .replace(/firstName:\s*"[^"]*"/, `firstName: "${first.replace(/"/g, '\\"')}"`);
  if (!next.includes(oldBlock)) {
    console.warn(`Bloc introuvable pour ${u.id}`);
    continue;
  }
  next = next.replace(oldBlock, newBlock);
  applied++;
  // refresh raw in memory for subsequent same-file safety
  player.raw = newBlock;
  player.number = u.newNumber;
  player.firstName = first;
}

writeFileSync(champPath, next);
console.log(`Appliqué: ${applied} joueurs dans championship.ts`);
