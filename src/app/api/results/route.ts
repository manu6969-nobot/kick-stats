import { NextResponse } from "next/server";
import { readLiveResultsFile } from "@/lib/live-results";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = readLiveResultsFile();
  return NextResponse.json(live, {
    headers: { "Cache-Control": "no-store" },
  });
}
