import "server-only";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import type { LiveResultsFile, Match } from "@/data/types";
import { matches as baseMatches } from "@/data/championship";
import {
  fetchLiveResultsFromGitHub,
  isVercelRuntime,
} from "@/lib/github-persist";
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

function newer(a: LiveResultsFile, b: LiveResultsFile): LiveResultsFile {
  const ta = Date.parse(a.updatedAt || "") || 0;
  const tb = Date.parse(b.updatedAt || "") || 0;
  return ta >= tb ? a : b;
}

/** Lecture disque locale uniquement (le plus récent entre /tmp et le repo → bundle). */
export function readLiveResultsFileLocal(): LiveResultsFile {
  let fromTmp: LiveResultsFile | null = null;
  let fromDisk: LiveResultsFile | null = null;

  try {
    if (existsSync(/*turbopackIgnore: true*/ TMP_PATH)) {
      const raw = JSON.parse(
        readFileSync(/*turbopackIgnore: true*/ TMP_PATH, "utf8")
      );
      fromTmp = parseLive(raw);
    }
  } catch {
    /* ignore */
  }

  try {
    if (existsSync(/*turbopackIgnore: true*/ DATA_PATH)) {
      const raw = JSON.parse(
        readFileSync(/*turbopackIgnore: true*/ DATA_PATH, "utf8")
      );
      fromDisk = parseLive(raw);
    }
  } catch {
    /* ignore */
  }

  if (fromTmp && fromDisk) return newer(fromTmp, fromDisk);
  if (fromTmp) return fromTmp;
  if (fromDisk) return fromDisk;

  const bundled = parseLive(bundledLive);
  return bundled ?? emptyLiveResults();
}

/**
 * Source de vérité pour les pages publiques.
 * Sur Vercel : GitHub (partagé entre toutes les instances) + /tmp si plus récent.
 * En local : fichier disque.
 */
export async function loadLiveResults(): Promise<LiveResultsFile> {
  const local = readLiveResultsFileLocal();

  if (isVercelRuntime() || process.env.LIVE_RESULTS_FROM_GITHUB === "1") {
    const remote = await fetchLiveResultsFromGitHub();
    if (remote) {
      const remoteClean = sanitizeLiveResults(remote);
      return newer(local, remoteClean);
    }
  }

  return local;
}

/** @deprecated Préférer loadLiveResults() — synchrone = disque local seulement. */
export function readLiveResultsFile(): LiveResultsFile {
  return readLiveResultsFileLocal();
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

export async function getMergedMatches(
  live?: LiveResultsFile
): Promise<Match[]> {
  const data = live ?? (await loadLiveResults());
  return baseMatches.map((m) => applyLiveResult(m, data.matches[m.id]));
}

export async function getMergedMatch(
  id: string,
  live?: LiveResultsFile
): Promise<Match | undefined> {
  const data = live ?? (await loadLiveResults());
  const base = baseMatches.find((m) => m.id === id);
  if (!base) return undefined;
  return applyLiveResult(base, data.matches[id]);
}
