import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import { SiteJsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { meta } from "@/data/championship";
import { getSiteUrl, siteDescription } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-barlow",
});

const siteUrl = getSiteUrl();
const description = siteDescription();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${meta.name} — Stats & Calendrier`,
    template: `%s · ${meta.name}`,
  },
  description,
  applicationName: meta.name,
  keywords: [
    "P1 Luxembourg",
    "classement P1 Luxembourg",
    "football Province Luxembourg",
    "calendrier P1",
    "résultats football belge",
    meta.season,
    "stats joueurs",
  ],
  authors: [{ name: meta.name }],
  creator: meta.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: siteUrl,
    siteName: meta.name,
    title: `${meta.name} — Stats & Calendrier`,
    description,
  },
  twitter: {
    card: "summary",
    title: `${meta.name} — Stats & Calendrier`,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#072419",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteJsonLd />
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
