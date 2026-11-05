import type { MetadataRoute } from "next";
import { matches, players, teams } from "@/data/championship";
import { getSiteUrl } from "@/lib/site";

/** lastmod au format date seule — mieux accepté par Google. */
function day(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  const today = day();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/classement`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/calendrier`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/equipes`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/joueurs`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/stats`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/arbitres`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const teamPages: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${base}/equipes/${team.id}`,
    lastModified: today,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${base}/joueurs/${player.id}`,
    lastModified: today,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const matchPages: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${base}/matchs/${match.id}`,
    lastModified: day(match.date),
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [...staticPages, ...teamPages, ...playerPages, ...matchPages];
}
