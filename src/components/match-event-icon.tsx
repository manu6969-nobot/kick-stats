import type { MatchEventType } from "@/data/types";
import { cn } from "@/lib/utils";

/** Icônes style feuille de match RBFA : but, carton, entrée / sortie. */
export function MatchEventIcon({
  type,
  penalty = false,
  className,
}: {
  type: MatchEventType;
  penalty?: boolean;
  className?: string;
}) {
  if (type === "goal" || type === "own_goal") {
    return (
      <span
        className={cn(
          "relative inline-flex h-5 w-5 shrink-0 items-center justify-center",
          className
        )}
        title={type === "own_goal" ? "CSC" : penalty ? "Pénalty" : "But"}
        aria-hidden
      >
        <SoccerBallIcon />
        {penalty && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-pitch-deep text-[7px] font-bold leading-none text-white">
            P
          </span>
        )}
      </span>
    );
  }

  if (type === "yellow") {
    return (
      <span
        className={cn(
          "inline-block h-[18px] w-[11px] shrink-0 rotate-[12deg] rounded-[1px] border border-black/25 bg-[#f7d117] shadow-sm",
          className
        )}
        title="Carton jaune"
        aria-hidden
      />
    );
  }

  if (type === "second_yellow") {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center gap-0.5", className)}
        title="2e jaune"
        aria-hidden
      >
        <span className="inline-block h-[18px] w-[10px] rotate-[12deg] rounded-[1px] border border-black/25 bg-[#f7d117]" />
        <span className="inline-block h-[18px] w-[10px] -rotate-[8deg] rounded-[1px] border border-black/25 bg-[#e11d2e]" />
      </span>
    );
  }

  if (type === "red") {
    return (
      <span
        className={cn(
          "inline-block h-[18px] w-[11px] shrink-0 rotate-[12deg] rounded-[1px] border border-black/25 bg-[#e11d2e] shadow-sm",
          className
        )}
        title="Carton rouge"
        aria-hidden
      />
    );
  }

  if (type === "sub_in" || type === "sub") {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center text-[#1a9e3f]", className)}
        title="Entrée"
        aria-hidden
      >
        <svg
          viewBox="0 0 22 12"
          width="22"
          height="12"
          className="block"
          fill="currentColor"
        >
          <path d="M0 4.5h12v3H0z" />
          <path d="M11 0.5l10.5 5.5L11 11.5V0.5z" />
        </svg>
      </span>
    );
  }

  if (type === "sub_out") {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center text-[#e11d2e]", className)}
        title="Sortie"
        aria-hidden
      >
        <svg
          viewBox="0 0 22 12"
          width="22"
          height="12"
          className="block"
          fill="currentColor"
        >
          <path d="M10 4.5h12v3H10z" />
          <path d="M11 0.5L0.5 6 11 11.5V0.5z" />
        </svg>
      </span>
    );
  }

  return null;
}

function SoccerBallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className="block"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#f4f4f4"
        stroke="#1a1a1a"
        strokeWidth="1.2"
      />
      <path
        fill="#1a1a1a"
        d="M12 7.2 14.4 9l-.9 2.8H10.5L9.6 9 12 7.2zm0 9.6-2.4-1.8.9-2.8h3l.9 2.8L12 16.8zM7.6 9.2l1.2 2.6-2.1 1.8-2.2-.5.3-2.5 2.8-1.4zm8.8 0-2.8 1.4.3 2.5-2.2.5-2.1-1.8 1.2-2.6zm-8.8 5.6 2.2-.5 2.1 1.8-1.2 2.6-2.8 0-.3-2.5zm8.8 0-.3 2.5-2.8 0-1.2-2.6 2.1-1.8 2.2.5z"
      />
    </svg>
  );
}
