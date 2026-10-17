import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "p1_admin_session";

function secret() {
  return process.env.ADMIN_PASSWORD || "p1admin";
}

function tokenFor(password: string) {
  return createHmac("sha256", secret()).update(`ok:${password}`).digest("hex");
}

export function expectedAdminPassword() {
  return secret();
}

export function verifyPassword(password: string) {
  const a = Buffer.from(password);
  const b = Buffer.from(secret());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  const expected = tokenFor(secret());
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function adminSessionCookieValue() {
  return tokenFor(secret());
}

export { COOKIE as ADMIN_COOKIE_NAME };
