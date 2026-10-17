import { cn } from "@/lib/utils";

export function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Forme: ${form.join(", ")}`}>
      {form.map((result, i) => (
        <span
          key={`${result}-${i}`}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold text-white",
            result === "W" && "bg-win",
            result === "D" && "bg-draw",
            result === "L" && "bg-loss"
          )}
        >
          {result === "W" ? "V" : result === "D" ? "N" : "D"}
        </span>
      ))}
    </div>
  );
}
