import { meta } from "@/data/championship";

/**
 * URL publique du site (sitemap, robots, Open Graph).
 * Sur Vercel : VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL.
 * Override : NEXT_PUBLIC_SITE_URL=https://ton-domaine.be
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/\/$/, "")}`;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "https://kick-stats.vercel.app";
}

export function siteTitle(page?: string): string {
  return page ? `${page} · ${meta.name}` : `${meta.name} — Stats & Calendrier`;
}

export function siteDescription(): string {
  return `${meta.tagline}. Classement, résultats, équipes et stats joueurs — saison ${meta.season}, Province de Luxembourg (Belgique).`;
}
