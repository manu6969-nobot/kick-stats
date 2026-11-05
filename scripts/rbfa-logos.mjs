#!/usr/bin/env node
/**
 * Télécharge les logos clubs depuis rbfa-raw.json → public/logos/{kickId}.jpg
 * Usage : node scripts/rbfa-logos.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const raw = JSON.parse(
  readFileSync(path.join(ROOT, "data/rbfa-raw.json"), "utf8")
);
const teamMap = JSON.parse(
  readFileSync(path.join(ROOT, "data/rbfa-team-map.json"), "utf8")
);

const logosByRbfaId = new Map();
for (const m of raw.calendar ?? []) {
  for (const side of ["homeTeam", "awayTeam"]) {
    const t = m[side];
    if (t?.id && t?.logo) logosByRbfaId.set(String(t.id), t.logo);
  }
}
for (const det of Object.values(raw.details ?? {})) {
  for (const side of ["homeTeam", "awayTeam"]) {
    const t = det[side];
    if (t?.id && t?.logo) logosByRbfaId.set(String(t.id), t.logo);
  }
}

const outDir = path.join(ROOT, "public/logos");
mkdirSync(outDir, { recursive: true });

const index = {};
for (const [rbfaId, info] of Object.entries(teamMap)) {
  const url = logosByRbfaId.get(String(rbfaId));
  if (!url) {
    console.warn(`Pas de logo pour ${info.kickId} (${rbfaId})`);
    continue;
  }
  const dest = path.join(outDir, `${info.kickId}.jpg`);
  const res = await fetch(url, {
    headers: { "User-Agent": "kick-stats-logo-fetch" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  index[info.kickId] = {
    rbfaId,
    source: url,
    path: `/logos/${info.kickId}.jpg`,
  };
  console.log(`✓ ${info.kickId} (${buf.length} o)`);
}

writeFileSync(
  path.join(ROOT, "data/club-logos.json"),
  `${JSON.stringify(index, null, 2)}\n`
);
console.log(`\n${Object.keys(index).length} logos → public/logos/`);
