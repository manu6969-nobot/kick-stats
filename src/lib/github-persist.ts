import "server-only";

import type { LiveResultsFile } from "@/data/types";

function repoConfig() {
  return {
    repo: process.env.GITHUB_REPO?.trim() || "manu6969-nobot/kick-stats",
    branch: process.env.GITHUB_BRANCH?.trim() || "main",
    path: "data/live-results.json",
    token: process.env.GITHUB_TOKEN?.trim() || "",
  };
}

/**
 * Lit data/live-results.json depuis GitHub (source partagée entre toutes les
 * fonctions Vercel). Fonctionne en public sans token.
 */
export async function fetchLiveResultsFromGitHub(): Promise<LiveResultsFile | null> {
  const { repo, branch, path, token } = repoConfig();

  // 1) API GitHub (évite le cache CDN raw, et marche si le dépôt devient privé)
  if (token) {
    try {
      const api = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
      const res = await fetch(api, {
        headers: {
          Accept: "application/vnd.github.raw+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "p1-luxembourg-admin",
        },
        cache: "no-store",
      });
      if (res.ok) {
        const text = await res.text();
        const data = JSON.parse(text) as LiveResultsFile;
        if (data?.matches) return data;
      }
    } catch {
      /* fallback raw */
    }
  }

  // 2) raw.githubusercontent.com (dépôt public, sans token)
  try {
    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}?t=${Date.now()}`;
    const res = await fetch(rawUrl, {
      cache: "no-store",
      headers: { "User-Agent": "p1-luxembourg-admin", Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LiveResultsFile;
    if (!data?.matches) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Publie data/live-results.json sur GitHub via l’API Contents.
 * Variables Vercel :
 *   GITHUB_TOKEN  — PAT avec droit « Contents: Read and write »
 *   GITHUB_REPO   — ex. manu6969-nobot/kick-stats (défaut)
 *   GITHUB_BRANCH — ex. main (défaut)
 */
export async function commitLiveResultsToGitHub(json: string): Promise<{
  ok: boolean;
  committed: boolean;
  message: string;
  url?: string;
}> {
  const { repo, branch, path, token } = repoConfig();
  if (!token) {
    return {
      ok: true,
      committed: false,
      message:
        "GITHUB_TOKEN manquant : le score est sauvé ici mais n’apparaît PAS sur le calendrier. Ajoutez GITHUB_TOKEN dans Vercel → Settings → Environment Variables.",
    };
  }

  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "p1-luxembourg-admin",
  };

  let sha: string | undefined;
  try {
    const getRes = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
      headers,
      cache: "no-store",
    });
    if (getRes.ok) {
      const current = (await getRes.json()) as { sha?: string };
      sha = current.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.text();
      return {
        ok: false,
        committed: false,
        message: `Lecture GitHub impossible (${getRes.status}): ${err.slice(0, 200)}`,
      };
    }
  } catch (e) {
    return {
      ok: false,
      committed: false,
      message: `Réseau GitHub: ${e instanceof Error ? e.message : "erreur"}`,
    };
  }

  const body = {
    message: `chore: mise à jour des résultats (${new Date().toISOString()})`,
    content: Buffer.from(json, "utf8").toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  };

  try {
    const putRes = await fetch(api, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await putRes.json().catch(() => ({}))) as {
      content?: { html_url?: string };
      commit?: { html_url?: string };
      message?: string;
    };
    if (!putRes.ok) {
      return {
        ok: false,
        committed: false,
        message: `Commit GitHub échoué (${putRes.status}): ${data.message || "erreur"}`,
      };
    }
    return {
      ok: true,
      committed: true,
      message:
        "Résultat publié sur GitHub — calendrier et classement se mettent à jour tout de suite.",
      url: data.commit?.html_url || data.content?.html_url,
    };
  } catch (e) {
    return {
      ok: false,
      committed: false,
      message: `Commit GitHub: ${e instanceof Error ? e.message : "erreur"}`,
    };
  }
}

export function githubPersistConfigured() {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

export function isVercelRuntime() {
  return process.env.VERCEL === "1";
}
