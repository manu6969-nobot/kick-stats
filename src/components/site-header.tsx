"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { meta } from "@/data/championship";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Primary nav (5 max) — Accueil = logo ; Arbitres via /stats + footer. */
const links = [
  { href: "/classement", label: "Classement" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/equipes", label: "Équipes" },
  { href: "/joueurs", label: "Joueurs" },
  { href: "/stats", label: "Stats" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pitch-deep/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
          aria-current={onHome ? "page" : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-score font-display text-sm font-bold tracking-tight text-pitch-deep transition group-hover:scale-105">
            {meta.shortName}
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-lg font-bold tracking-wide">
              {meta.name}
            </span>
            <span className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-white/55">
              Saison {meta.season}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Navigation principale"
        >
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                )}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-score"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <nav
          className="border-t border-white/10 px-4 py-3 md:hidden"
          aria-label="Navigation mobile"
        >
          <div className="flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              aria-current={onHome ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2.5 text-sm font-medium",
                onHome ? "bg-white/12 text-white" : "text-white/75"
              )}
            >
              Accueil
            </Link>
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    active ? "bg-white/12 text-white" : "text-white/75"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
