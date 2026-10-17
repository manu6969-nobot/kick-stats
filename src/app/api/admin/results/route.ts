import { NextResponse } from "next/server";
import type { LiveResultsFile } from "@/data/types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  commitLiveResultsToGitHub,
  githubPersistConfigured,
} from "@/lib/github-persist";
import { readLiveResultsFile, writeLiveResultsFile } from "@/lib/live-results";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(readLiveResultsFile());
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as LiveResultsFile | null;
  if (!body || typeof body !== "object" || !body.matches) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const result = writeLiveResultsFile(body);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Écriture impossible sur ce serveur",
        data: body,
      },
      { status: 500 }
    );
  }

  // Sur Vercel le disque n’est pas durable → commit GitHub si token configuré
  let github: Awaited<ReturnType<typeof commitLiveResultsToGitHub>> | null =
    null;
  if (!result.persistedToRepo || githubPersistConfigured()) {
    github = await commitLiveResultsToGitHub(result.json);
  }

  const published = result.persistedToRepo || Boolean(github?.committed);
  let hint: string | null = null;
  if (github?.committed) {
    hint = github.message;
  } else if (!published) {
    hint =
      "Sur Vercel ce n’est pas encore public. Sur GitHub : ouvrez data/live-results.json → crayon → collez le JSON téléchargé → Commit changes. Puis attendez 1–2 min (redéploiement Vercel).";
  } else if (github && !github.committed && github.message) {
    hint = github.message;
  }

  return NextResponse.json({
    ok: true,
    path: result.path,
    persistedToRepo: result.persistedToRepo,
    publishedToGitHub: Boolean(github?.committed),
    githubUrl: github?.url ?? null,
    updatedAt: result.payload.updatedAt,
    hint,
  });
}
