import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminSessionCookieValue,
  verifyPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, adminSessionCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    // Secure uniquement en HTTPS (Vercel). En local http://, sinon le cookie est ignoré.
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
