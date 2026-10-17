import "server-only";

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
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return {
      ok: true,
      committed: false,
      message:
        "Pas de GITHUB_TOKEN : téléchargez le JSON, remplacez data/live-results.json sur GitHub, puis attendez le redéploiement Vercel.",
    };
  }

  const repo =
    process.env.GITHUB_REPO?.trim() || "manu6969-nobot/kick-stats";
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const path = "data/live-results.json";
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
      message: "Résultat publié sur GitHub — Vercel redéploie automatiquement.",
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
