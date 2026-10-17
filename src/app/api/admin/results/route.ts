import { NextResponse } from "next/server";
import type { LiveResultsFile } from "@/data/types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
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

  return NextResponse.json({
    ok: true,
    path: result.path,
    persistedToRepo: result.persistedToRepo,
    updatedAt: body.updatedAt,
    hint: result.persistedToRepo
      ? null
      : "Sur Vercel le fichier n’est pas durable : téléchargez le JSON et committez data/live-results.json pour publier.",
  });
}
