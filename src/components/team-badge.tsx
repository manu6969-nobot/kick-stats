"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Team } from "@/data/types";

export function TeamBadge({
  team,
  size = "md",
  className,
}: {
  team: Team;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-lg",
  };
  const logoSrc = `/logos/${team.id}.jpg`;
  const showLogo = !broken;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold tracking-wide shadow-sm ring-2 ring-white/40",
        sizes[size],
        showLogo ? "bg-white" : "text-white",
        className
      )}
      style={showLogo ? undefined : { backgroundColor: team.colors.primary }}
      aria-hidden
    >
      {showLogo ? (
        // Logos RBFA locaux (public/logos/{id}.jpg)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          width={56}
          height={56}
          className="h-full w-full object-contain p-[10%]"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        team.shortName.slice(0, 3)
      )}
    </span>
  );
}
