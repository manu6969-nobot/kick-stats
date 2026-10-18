import { NextResponse } from "next/server";
import type { LiveResultsFile } from "@/data/types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  commitLiveResultsToGitHub,
  githubPersistConfigured,
  isVercelRuntime,
} from "@/lib/github-persist";
import { loadLiveResults, writeLiveResultsFile } from "@/lib/live-results";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json(await loadLiveResults());
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

  // Sur Vercel : il FAUT publier sur GitHub sinon calendrier/classement
  // (autres instances) ne voient pas le score.
  let github: Awaited<ReturnType<typeof commitLiveResultsToGitHub>> | null =
    null;
  const mustPublish = isVercelRuntime() || !result.persistedToRepo;
  if (mustPublish || githubPersistConfigured()) {
    github = await commitLiveResultsToGitHub(result.json);
  }

  const published = result.persistedToRepo || Boolean(github?.committed);

  if (isVercelRuntime() && !github?.committed) {
    return NextResponse.json({
      ok: true,
      warning: true,
      path: result.path,
      persistedToRepo: result.persistedToRepo,
      publishedToGitHub: false,
      updatedAt: result.payload.updatedAt,
      hint:
        github?.message ||
        "Score enregistré uniquement sur ce serveur. Ajoutez GITHUB_TOKEN dans Vercel pour que le calendrier et le classement se mettent à jour.",
    });
  }

  let hint: string | null = null;
  if (github?.committed) {
    hint = github.message;
  } else if (!published) {
    hint =
      "Score local OK. Pour le site public : ajoutez GITHUB_TOKEN sur Vercel, ou collez le JSON sur GitHub (data/live-results.json).";
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
