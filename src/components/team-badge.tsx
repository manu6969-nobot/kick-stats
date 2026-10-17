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
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold tracking-wide text-white shadow-sm ring-2 ring-white/40",
        sizes[size],
        className
      )}
      style={{ backgroundColor: team.colors.primary }}
      aria-hidden
    >
      {team.shortName.slice(0, 3)}
    </span>
  );
}
