import "server-only";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { LiveResultsFile, Match } from "@/data/types";
import { matches as baseMatches } from "@/data/championship";
import {
  applyLiveResult,
  isEmptyLiveResult,
} from "@/lib/live-results-shared";
import bundledLive from "../../data/live-results.json";

export * from "@/lib/live-results-shared";

const DATA_PATH = path.join(process.cwd(), "data", "live-results.json");
const TMP_PATH = path.join("/tmp", "p1-live-results.json");

export function emptyLiveResults(): LiveResultsFile {
  return { updatedAt: new Date().toISOString(), matches: {} };
}

/** Retire les entrées vides (status scheduled + scores null). */
export function sanitizeLiveResults(data: LiveResultsFile): LiveResultsFile {
  const matches: LiveResultsFile["matches"] = {};
  for (const [id, result] of Object.entries(data.matches ?? {})) {
    if (isEmptyLiveResult(result)) continue;
    // Normalise score + programmé → terminé
    if (
      result.status === "scheduled" &&
      result.homeScore != null &&
      result.awayScore != null
    ) {
      matches[id] = { ...result, status: "finished" };
    } else {
      matches[id] = result;
    }
  }
  return { updatedAt: data.updatedAt, matches };
}

function parseLive(raw: unknown): LiveResultsFile | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as LiveResultsFile;
  if (!data.matches || typeof data.matches !== "object") return null;
  return sanitizeLiveResults(data);
}

export function readLiveResultsFile(): LiveResultsFile {
  // /tmp d'abord (saisies admin sur l'instance courante)
  try {
    if (existsSync(/*turbopackIgnore: true*/ TMP_PATH)) {
      const raw = JSON.parse(
        readFileSync(/*turbopackIgnore: true*/ TMP_PATH, "utf8")
      );
      const parsed = parseLive(raw);
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }

  // Fichier repo (local writable)
  try {
    if (existsSync(/*turbopackIgnore: true*/ DATA_PATH)) {
      const raw = JSON.parse(
        readFileSync(/*turbopackIgnore: true*/ DATA_PATH, "utf8")
      );
      const parsed = parseLive(raw);
      if (parsed) return parsed;
    }
  } catch {
    /* ignore */
  }

  const bundled = parseLive(bundledLive);
  return bundled ?? emptyLiveResults();
}

export function prepareLiveResultsPayload(data: LiveResultsFile): {
  payload: LiveResultsFile;
  json: string;
} {
  const payload: LiveResultsFile = {
    ...sanitizeLiveResults(data),
    updatedAt: new Date().toISOString(),
  };
  return { payload, json: `${JSON.stringify(payload, null, 2)}\n` };
}

export function writeLiveResultsFile(data: LiveResultsFile): {
  ok: boolean;
  path: string;
  persistedToRepo: boolean;
  payload: LiveResultsFile;
  json: string;
} {
  const { payload, json } = prepareLiveResultsPayload(data);

  try {
    writeFileSync(/*turbopackIgnore: true*/ TMP_PATH, json, "utf8");
  } catch {
    /* ignore */
  }

  try {
    mkdirSync(/*turbopackIgnore: true*/ path.dirname(DATA_PATH), {
      recursive: true,
    });
    writeFileSync(/*turbopackIgnore: true*/ DATA_PATH, json, "utf8");
    return {
      ok: true,
      path: DATA_PATH,
      persistedToRepo: true,
      payload,
      json,
    };
  } catch {
    try {
      writeFileSync(/*turbopackIgnore: true*/ TMP_PATH, json, "utf8");
      return {
        ok: true,
        path: TMP_PATH,
        persistedToRepo: false,
        payload,
        json,
      };
    } catch {
      return {
        ok: false,
        path: TMP_PATH,
        persistedToRepo: false,
        payload,
        json,
      };
    }
  }
}

export function getMergedMatches(
  live: LiveResultsFile = readLiveResultsFile()
): Match[] {
  return baseMatches.map((m) => applyLiveResult(m, live.matches[m.id]));
}

export function getMergedMatch(
  id: string,
  live: LiveResultsFile = readLiveResultsFile()
): Match | undefined {
  const base = baseMatches.find((m) => m.id === id);
  if (!base) return undefined;
  return applyLiveResult(base, live.matches[id]);
}
