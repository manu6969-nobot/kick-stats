/**
 * Calcule les minutes jouées à partir des compositions RBFA (lineup + substitutes).
 */

export function matchDurationMinutes(detail) {
  let max = 90;
  for (const group of detail?.events || []) {
    const gMin = Number(group.minute) || 0;
    if (gMin > max) max = gMin;
    for (const side of ["home", "away"]) {
      for (const ev of group[side] || []) {
        const m = Number(ev.minute) || 0;
        if (m > max) max = m;
      }
    }
  }
  for (const row of [...(detail?.lineup || []), ...(detail?.substitutes || [])]) {
    for (const side of ["home", "away"]) {
      for (const pe of row[side]?.events || []) {
        const m = Number(pe.minute) || 0;
        if (m > max) max = m;
      }
    }
  }
  return max;
}

function startMinute(playerEvents, started) {
  if (started) return 0;
  let inMin = null;
  for (const e of playerEvents || []) {
    if (String(e.type || "").toLowerCase() !== "in") continue;
    const m = Number(e.minute) || 0;
    inMin = inMin == null ? m : Math.min(inMin, m);
  }
  return inMin;
}

function endMinute(playerEvents, matchEnd) {
  let leave = null;
  for (const e of playerEvents || []) {
    const t = String(e.type || "").toLowerCase();
    if (t !== "out" && t !== "red" && t !== "yellowred") continue;
    const m = Number(e.minute) || 0;
    leave = leave == null ? m : Math.min(leave, m);
  }
  if (leave == null) return matchEnd;
  return Math.min(leave, matchEnd);
}

/**
 * @param {object} detail MatchDetail RBFA
 * @param {string} homeKickId
 * @param {string} awayKickId
 * @param {(teamId:string, firstName:string, lastName:string) => string|undefined} findPlayerId
 */
export function extractAppearances(detail, homeKickId, awayKickId, findPlayerId) {
  if (!detail) return [];
  const matchEnd = matchDurationMinutes(detail);
  const byPlayer = new Map();

  const ingest = (rows, started) => {
    for (const row of rows || []) {
      for (const side of ["home", "away"]) {
        const p = row[side];
        if (!p || (!p.firstName && !p.lastName)) continue;
        const teamId = side === "home" ? homeKickId : awayKickId;
        const playerId = findPlayerId(teamId, p.firstName || "", p.lastName || "");
        if (!playerId) continue;

        const start = startMinute(p.events, started);
        if (start == null) continue; // remplaçant jamais entré

        const end = endMinute(p.events, matchEnd);
        const minutes = Math.max(0, end - start);
        const prev = byPlayer.get(playerId);
        if (prev) {
          // Garde la meilleure info (ex. doublon)
          byPlayer.set(playerId, {
            playerId,
            teamId,
            started: prev.started || started,
            minutes: Math.max(prev.minutes, minutes),
          });
        } else {
          byPlayer.set(playerId, { playerId, teamId, started, minutes });
        }
      }
    }
  };

  ingest(detail.lineup, true);
  ingest(detail.substitutes, false);
  return [...byPlayer.values()];
}
