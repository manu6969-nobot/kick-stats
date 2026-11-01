import { cn } from "@/lib/utils";

/** Anneau SVG simple (2 segments) pour les tableaux de bord club. */
export function DonutChart({
  primary,
  secondary,
  primaryColor,
  secondaryColor,
  size = 148,
  thickness = 18,
  className,
}: {
  primary: number;
  secondary: number;
  primaryColor: string;
  secondaryColor: string;
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const total = Math.max(primary + secondary, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const primaryLen =
    total === 0 ? 0 : (primary / total) * circumference;
  const secondaryLen =
    total === 0 ? circumference : (secondary / total) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 -rotate-90", className)}
      aria-hidden
    >
      {total === 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-border"
        />
      ) : (
        <>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={primaryColor}
            strokeWidth={thickness}
            strokeDasharray={`${primaryLen} ${circumference - primaryLen}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={thickness}
            strokeDasharray={`${secondaryLen} ${circumference - secondaryLen}`}
            strokeDashoffset={-primaryLen}
            strokeLinecap="butt"
          />
        </>
      )}
    </svg>
  );
}
