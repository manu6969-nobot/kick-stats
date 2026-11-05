import type { MetadataRoute } from "next";
import { matches, players, teams } from "@/data/championship";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/classement`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/calendrier`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/equipes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/joueurs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/stats`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${base}/arbitres`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const teamPages: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${base}/equipes/${team.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${base}/joueurs/${player.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const matchPages: MetadataRoute.Sitemap = matches.map((match) => ({
    url: `${base}/matchs/${match.id}`,
    lastModified: match.date ? new Date(match.date) : now,
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  return [...staticPages, ...teamPages, ...playerPages, ...matchPages];
}
