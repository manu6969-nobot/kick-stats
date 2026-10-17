import Link from "next/link";
import { meta } from "@/data/championship";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-pitch-deep text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-2xl font-bold tracking-wide">{meta.name}</p>
          <p className="mt-1 max-w-md text-sm text-white/60">
            Statistiques, calendrier et classement — {meta.season}. Modifiez les
            données dans <code className="text-score">src/data/championship.ts</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <Link href="/classement" className="hover:text-white">
            Classement
          </Link>
          <Link href="/calendrier" className="hover:text-white">
            Calendrier
          </Link>
          <Link href="/equipes" className="hover:text-white">
            Équipes
          </Link>
          <Link href="/joueurs" className="hover:text-white">
            Joueurs
          </Link>
          <Link href="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
