import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { meta } from "@/data/championship";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${meta.name} — Stats & Calendrier`,
    template: `%s · ${meta.name}`,
  },
  description: `${meta.tagline}. Classement, résultats, équipes et stats joueurs — saison ${meta.season}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
