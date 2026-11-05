import { meta } from "@/data/championship";
import { getSiteUrl, siteDescription } from "@/lib/site";

/** Données structurées WebSite pour Google. */
export function SiteJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: meta.name,
    alternateName: meta.shortName,
    url,
    description: siteDescription(),
    inLanguage: "fr-BE",
    about: {
      "@type": "SportsOrganization",
      name: meta.name,
      sport: "Soccer",
      areaServed: "Province de Luxembourg, Belgique",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
