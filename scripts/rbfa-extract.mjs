#!/usr/bin/env node
/**
 * Extrait les matchs « 1 PROV. Luxembourg » depuis l’API GraphQL RBFA
 * et produit un live-results.json injectable dans kick-stats.
 *
 * Usage:
 *   node scripts/rbfa-extract.mjs
 *   node scripts/rbfa-extract.mjs --apply   # écrit aussi data/live-results.json
 *
 * Sorties:
 *   data/rbfa-raw.json                 — dump brut (calendrier + détails)
 *   data/live-results.from-rbfa.json   — format kick-stats
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractAppearances } from "./rbfa-appearances.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** Mapping forcé RBFA teamId → kick-stats team id */
const TEAM_ALIASES = {
  "372427": "vaux-sur-sure",
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

const SERIES_ID = process.env.RBFA_SERIES_ID || "CHP_131416";
/** Endpoint public (hashes APQ à jour). Fallback datalake si besoin. */
const API_URLS = [
  process.env.RBFA_GRAPHQL_URL,
  "https://www.rbfa.be/graphql",
  "https://datalake-prod2018.rbfa.be/graphql",
].filter(Boolean);
const DELAY_MS = Number(process.env.RBFA_DELAY_MS || 1100);
const APPLY = process.argv.includes("--apply");
const DETAILS_ONLY_FINISHED = !process.argv.includes("--all-details");
/** Limite les détails aux matchs récents (cron week-end). Ex. RBFA_RECENT_DAYS=5 */
const RECENT_DAYS = process.env.RBFA_RECENT_DAYS
  ? Number(process.env.RBFA_RECENT_DAYS)
  : null;
/** Club d’ancrage pour récupérer le classement de série (API team-centric). */
const ANCHOR_TEAM_ID = process.env.RBFA_ANCHOR_TEAM_ID || "371455";

/** Hashes persisted queries RBFA (nov. 2026) — alignés sur le client web. */
const HASHES = {
  GetTeamCalendar:
    "5cc5fac5f4819eb5aba7e1961e46bb61105a99f234141f0f862a344bdc17b164",
  GetMatchDetail:
    "e4194e20528d04a046bd71ea20a044dbd445144b1104f5e6f5992cfdcf43a793",
  getSeriesAndRankingsQuery:
    "18a00fb0be3d9ac68294cba3c1542b0f48e52a1de5e792a158557f4ce78b9cf1",
};
const VAR_KEY = {
  GetTeamCalendar: "teamId",
  GetMatchDetail: "matchId",
  getSeriesAndRankingsQuery: "teamId",
};

const HEADERS = {
  Connection: "keep-alive",
  Accept: "*/*",
  "Accept-Language": "fr-BE,fr;q=0.9,en;q=0.8",
  "Content-Type": "application/json",
  Origin: "https://www.rbfa.be",
  Referer: "https://www.rbfa.be/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeName(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, "et")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(a|r|res|resc|rus|rlc|rjr|es|fc|us|ass|sp|athl|un|st|andre)\b/g, " ")
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
  const union = new Set([...ta, ...tb]).size || 1;
  return Math.round((100 * inter) / union);
}

async function graphql(operation, value) {
  const hash = HASHES[operation];
  if (!hash) throw new Error(`Hash GraphQL inconnu pour ${operation}`);
  const payload = {
    operationName: operation,
    variables: { [VAR_KEY[operation]]: value, language: "fr" },
    extensions: {
      persistedQuery: { version: 1, sha256Hash: hash },
    },
  };

  let lastErr = null;
  for (const url of API_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (text.includes("Access Denied")) {
        lastErr = new Error(`Access Denied sur ${url}`);
        continue;
      }
      if (!res.ok) {
        lastErr = new Error(`${operation} HTTP ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }
      if (text.trimStart().startsWith("<")) {
        lastErr = new Error(`${operation}: réponse HTML (bloquée?) sur ${url}`);
        continue;
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        lastErr = new Error(`${operation}: JSON invalide sur ${url}: ${text.slice(0, 120)}`);
        continue;
      }
      if (body.errors?.length) {
        lastErr = new Error(`${operation}: ${body.errors[0].message}`);
        // PersistedQueryNotFound → essayer l’URL suivante / hashes à jour
        continue;
      }
      return body.data;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error(`${operation}: échec GraphQL RBFA`);
}

function loadChampionship() {
  // Charge via tsx-compiled path: parse minimal from championship using dynamic import via tsx not available;
  // on lit live-results + on reconstruit les matchs depuis un export JSON généré, ou on parse le .ts.
  const tsPath = path.join(ROOT, "src/data/championship.ts");
  const src = readFileSync(tsPath, "utf8");

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
      status: m[5],
      homeTeamId: m[6],
      awayTeamId: m[7],
    });
  }

  return { teams, players, matches };
}

function mapRbfaTeamToKick(rbfaName, teams, rbfaTeamId) {
  if (rbfaTeamId && TEAM_ALIASES[rbfaTeamId]) {
    return teams.find((t) => t.id === TEAM_ALIASES[rbfaTeamId]) || null;
  }
  let best = null;
  let bestScore = 0;
  for (const t of teams) {
    const s = Math.max(scoreName(rbfaName, t.name), scoreName(rbfaName, t.shortName));
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return bestScore >= 50 ? best : null;
}

function findPlayerId(players, teamId, firstName, lastName) {
  const fn = normalizeName(firstName);
  const ln = normalizeName(lastName);
  if (!ln) return undefined;
  const pool = players.filter((p) => p.teamId === teamId);
  let best = null;
  let bestScore = 0;
  for (const p of pool) {
    const pfn = normalizeName(p.firstName);
    const pln = normalizeName(p.lastName);
    if (pln === ln && fn && pfn.startsWith(fn.slice(0, 3))) {
      return p.id;
    }
    const s = Math.max(
      scoreName(`${p.firstName} ${p.lastName}`, `${firstName} ${lastName}`),
      scoreName(p.lastName, lastName)
    );
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  if (bestScore >= 60) return best.id;

  // Nom de famille unique dans l’effectif → on lie même si le prénom diffère
  // (ex. Christian vs Kristijan Sicaja).
  if (ln.length >= 3) {
    const sameLast = pool.filter((p) => normalizeName(p.lastName) === ln);
    if (sameLast.length === 1) return sameLast[0].id;
  }
  return undefined;
}

function mapEventKind(kind) {
  const k = String(kind || "")
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
  switch (k) {
    case "goal":
    case "penalty":
      return "goal";
    case "owngoal":
      return "own_goal";
    case "yellow":
      return "yellow";
    case "secondyellow":
    case "yellowred":
      return "second_yellow";
    case "red":
      return "red";
    case "in":
      return "sub_in";
    case "out":
      return "sub_out";
    default:
      return null;
  }
}

function eventDetail(kind, firstName, lastName) {
  const name = `${firstName || ""} ${lastName || ""}`.trim();
  const k = String(kind || "")
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
  if (k === "penalty") return name ? `penalty · ${name}` : "penalty";
  if (k === "owngoal") return name ? `CSC · ${name}` : "CSC";
  return name || undefined;
}

function flattenEvents(detail, homeKickId, awayKickId, players) {
  const out = [];
  const rbfaHome = detail.homeTeam?.id;
  const rbfaAway = detail.awayTeam?.id;
  for (const group of detail.events || []) {
    for (const side of ["home", "away"]) {
      for (const ev of group[side] || []) {
        const type = mapEventKind(ev.kind);
        if (!type) continue;
        const teamId =
          ev.teamId === rbfaHome || side === "home" ? homeKickId : awayKickId;
        const playerId = findPlayerId(
          players,
          teamId,
          ev.firstName || "",
          ev.lastName || ""
        );
        out.push({
          id: `rbfa-${detail.id}-${ev.minute}-${ev.kind}-${ev.lastName || "x"}`,
          minute: Number(ev.minute) || 0,
          type,
          teamId,
          playerId,
          detail: eventDetail(ev.kind, ev.firstName, ev.lastName),
        });
      }
    }
  }
  return out.sort((a, b) => a.minute - b.minute);
}

function findKickMatch(baseMatches, dateIso, homeId, awayId) {
  const sameFixture = (m) =>
    m.homeTeamId === homeId && m.awayTeamId === awayId;
  const exact = baseMatches.find((m) => m.date === dateIso && sameFixture(m));
  if (exact) return exact;
  // RBFA décale parfois d’un jour (vendredi avancé, report…)
  const t = Date.parse(dateIso);
  if (!Number.isFinite(t)) return null;
  const near = [-1, 1, -2, 2]
    .map((d) => new Date(t + d * 86400000).toISOString().slice(0, 10))
    .map((d) => baseMatches.find((m) => m.date === d && sameFixture(m)))
    .find(Boolean);
  return near || null;
}

async function main() {
  console.log(`Série RBFA: ${SERIES_ID}`);
  const champ = loadChampionship();
  console.log(
    `kick-stats: ${champ.teams.length} équipes, ${champ.matches.length} matchs, ${champ.players.length} joueurs`
  );

  console.log(`Ancre classement: teamId=${ANCHOR_TEAM_ID}`);
  const rankingsData = await graphql(
    "getSeriesAndRankingsQuery",
    ANCHOR_TEAM_ID
  );
  await sleep(DELAY_MS);
  const seriesBlock =
    rankingsData.teamSeriesAndRankings?.rankings?.find(
      (r) => r.id === SERIES_ID
    ) || null;
  const seriesName = seriesBlock?.name || SERIES_ID;
  const rankingBlock =
    seriesBlock?.rankings?.find((r) => r.type === "generalRanking") ||
    seriesBlock?.rankings?.[0];
  const rbfaTeams = rankingBlock?.teams || [];
  if (!rbfaTeams.length) {
    throw new Error(
      `Aucun club dans le classement RBFA (${SERIES_ID}) via ancre ${ANCHOR_TEAM_ID}`
    );
  }

  const teamMap = {};
  for (const rt of rbfaTeams) {
    const kick = mapRbfaTeamToKick(rt.name, champ.teams, rt.teamId);
    teamMap[rt.teamId] = {
      rbfaId: rt.teamId,
      rbfaName: rt.name,
      kickId: kick?.id || null,
      kickName: kick?.name || null,
    };
    console.log(
      `  ${rt.name} → ${kick ? `${kick.id} (${kick.shortName})` : "NON MAPPE"}`
    );
  }

  const byMatchId = new Map();
  for (const rt of rbfaTeams) {
    process.stdout.write(`Calendrier ${rt.name}… `);
    const cal = await graphql("GetTeamCalendar", rt.teamId);
    await sleep(DELAY_MS);
    const list = (cal.teamCalendar || []).filter(
      (m) => m.series?.id === SERIES_ID
    );
    console.log(`${list.length} matchs P1`);
    for (const m of list) byMatchId.set(m.id, m);
  }

  const calendar = [...byMatchId.values()].sort((a, b) =>
    String(a.startTime).localeCompare(String(b.startTime))
  );
  console.log(`Total matchs uniques P1: ${calendar.length}`);

  const details = {};
  const finished = calendar.filter(
    (m) =>
      m.state === "finished" ||
      m.outcome?.status === "finished" ||
      (m.outcome?.homeTeamGoals != null && m.outcome?.awayTeamGoals != null)
  );
  let toFetch = DETAILS_ONLY_FINISHED ? finished : calendar;
  if (RECENT_DAYS != null && Number.isFinite(RECENT_DAYS) && RECENT_DAYS >= 0) {
    const cutoff = Date.now() - RECENT_DAYS * 86400000;
    const before = toFetch.length;
    toFetch = toFetch.filter((m) => {
      const start = Date.parse(String(m.startTime || "").slice(0, 10));
      if (!Number.isFinite(start)) return true;
      return start >= cutoff;
    });
    console.log(
      `Filtre RBFA_RECENT_DAYS=${RECENT_DAYS}: ${toFetch.length}/${before} détails`
    );
  }
  console.log(`Détails à charger: ${toFetch.length}`);

  let i = 0;
  for (const m of toFetch) {
    i += 1;
    process.stdout.write(`  [${i}/${toFetch.length}] match ${m.id}… `);
    try {
      const data = await graphql("GetMatchDetail", m.id);
      details[m.id] = data.matchDetail;
      console.log(
        data.matchDetail?.outcome
          ? `${data.matchDetail.outcome.homeTeamGoals}-${data.matchDetail.outcome.awayTeamGoals}`
          : "ok"
      );
    } catch (e) {
      console.log(`ERR ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  const live = { updatedAt: new Date().toISOString(), matches: {} };
  const unmatched = [];
  const mapped = [];

  for (const m of calendar) {
    const detail = details[m.id];
    const homeRbfa = m.homeTeam || detail?.homeTeam;
    const awayRbfa = m.awayTeam || detail?.awayTeam;
    const homeKick = teamMap[homeRbfa?.id]?.kickId
      ? champ.teams.find((t) => t.id === teamMap[homeRbfa.id].kickId)
      : mapRbfaTeamToKick(homeRbfa?.name, champ.teams, homeRbfa?.id);
    const awayKick = teamMap[awayRbfa?.id]?.kickId
      ? champ.teams.find((t) => t.id === teamMap[awayRbfa.id].kickId)
      : mapRbfaTeamToKick(awayRbfa?.name, champ.teams, awayRbfa?.id);

    const start = m.startTime || detail?.startTime || "";
    const dateIso = start.slice(0, 10);
    const outcome = detail?.outcome || m.outcome || {};
    const finishedMatch =
      detail?.state === "finished" ||
      outcome.status === "finished" ||
      outcome.isFinished ||
      (outcome.homeTeamGoals != null && outcome.awayTeamGoals != null);

    if (!homeKick || !awayKick) {
      unmatched.push({
        rbfaId: m.id,
        date: dateIso,
        home: homeRbfa?.name,
        away: awayRbfa?.name,
        reason: "équipe non mappée",
      });
      continue;
    }

    const kickMatch = findKickMatch(
      champ.matches,
      dateIso,
      homeKick.id,
      awayKick.id
    );
    if (!kickMatch) {
      unmatched.push({
        rbfaId: m.id,
        date: dateIso,
        home: homeKick.name,
        away: awayKick.name,
        reason: "pas de match kick-stats à cette date",
      });
      continue;
    }

    if (!finishedMatch) continue;

    // Sans détail match : maj score seule — ne pas écraser temps forts / compos
    // (ex. cron RBFA_RECENT_DAYS qui ne recharge que les matchs récents).
    if (!detail) {
      live.matches[kickMatch.id] = {
        status: "finished",
        homeScore: outcome.homeTeamGoals ?? null,
        awayScore: outcome.awayTeamGoals ?? null,
        scoreOnly: true,
        rbfaMatchId: m.id,
        rbfaUrl: `https://www.rbfa.be/fr/match/${m.id}`,
      };
      mapped.push({
        kickId: kickMatch.id,
        rbfaId: m.id,
        score: `${outcome.homeTeamGoals}-${outcome.awayTeamGoals}`,
        events: 0,
        scoreOnly: true,
      });
      continue;
    }

    const events = flattenEvents(
      detail,
      homeKick.id,
      awayKick.id,
      champ.players
    );

    const appearances = extractAppearances(
      detail,
      homeKick.id,
      awayKick.id,
      (teamId, firstName, lastName) =>
        findPlayerId(champ.players, teamId, firstName, lastName)
    );

    const officials = (detail.officials || [])
      .filter((o) => o && o.personAssigned !== false && (o.firstName || o.lastName))
      .map((o) => ({
        firstName: o.firstName || "",
        lastName: o.lastName || "",
        role: o.function || "referee",
      }));

    live.matches[kickMatch.id] = {
      status: "finished",
      homeScore: outcome.homeTeamGoals ?? null,
      awayScore: outcome.awayTeamGoals ?? null,
      events,
      officials,
      appearances,
      rbfaMatchId: m.id,
      rbfaUrl: `https://www.rbfa.be/fr/match/${m.id}`,
    };
    mapped.push({
      kickId: kickMatch.id,
      rbfaId: m.id,
      score: `${outcome.homeTeamGoals}-${outcome.awayTeamGoals}`,
      events: events.length,
    });
  }

  // Nettoie les champs non standards pour le fichier injectable
  const injectable = {
    updatedAt: live.updatedAt,
    matches: {},
  };
  for (const [id, row] of Object.entries(live.matches)) {
    if (row.scoreOnly) {
      injectable.matches[id] = {
        status: row.status,
        homeScore: row.homeScore,
        awayScore: row.awayScore,
      };
      continue;
    }
    injectable.matches[id] = {
      status: row.status,
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      events: row.events,
      officials: row.officials || [],
      appearances: row.appearances || [],
    };
  }

  const rawPath = path.join(ROOT, "data/rbfa-raw.json");
  const outPath = path.join(ROOT, "data/live-results.from-rbfa.json");
  const mapPath = path.join(ROOT, "data/rbfa-team-map.json");

  writeFileSync(
    rawPath,
    JSON.stringify(
      {
        seriesId: SERIES_ID,
        seriesName: rankingBlock?.name || SERIES_ID,
        extractedAt: live.updatedAt,
        teamMap,
        calendar,
        details,
        mapped,
        unmatched,
      },
      null,
      2
    ) + "\n"
  );
  writeFileSync(outPath, JSON.stringify(injectable, null, 2) + "\n");
  writeFileSync(mapPath, JSON.stringify(teamMap, null, 2) + "\n");

  console.log(`\nÉcrit ${outPath}`);
  console.log(`  ${Object.keys(injectable.matches).length} résultats terminés mappés`);
  console.log(`  ${unmatched.length} non mappés (voir rbfa-raw.json)`);
  console.log(`Écrit ${rawPath}`);

  if (APPLY) {
    const dest = path.join(ROOT, "data/live-results.json");
    let existing = { updatedAt: live.updatedAt, matches: {} };
    if (existsSync(dest)) {
      existing = JSON.parse(readFileSync(dest, "utf8"));
    }
    existing.updatedAt = live.updatedAt;
    for (const [id, incoming] of Object.entries(injectable.matches)) {
      const prev = existing.matches[id] || {};
      // Fusion profonde : une maj « score only » ne doit jamais vider events/apps.
      existing.matches[id] = {
        ...prev,
        ...incoming,
        events:
          incoming.events !== undefined ? incoming.events : prev.events || [],
        appearances:
          incoming.appearances !== undefined
            ? incoming.appearances
            : prev.appearances || [],
        officials:
          incoming.officials !== undefined
            ? incoming.officials
            : prev.officials || [],
      };
    }
    writeFileSync(dest, JSON.stringify(existing, null, 2) + "\n");
    console.log(`Appliqué dans ${dest} (${Object.keys(existing.matches).length} clés)`);
  } else {
    console.log("Astuce: relancez avec --apply pour fusionner dans data/live-results.json");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
