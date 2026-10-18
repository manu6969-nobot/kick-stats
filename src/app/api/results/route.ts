import { NextResponse } from "next/server";
import { loadLiveResults } from "@/lib/live-results";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = await loadLiveResults();
  return NextResponse.json(live, {
    headers: { "Cache-Control": "no-store" },
  });
}
