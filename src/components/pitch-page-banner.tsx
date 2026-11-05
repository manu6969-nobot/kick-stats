import type { ReactNode } from "react";

/** Bandeau pitch plein largeur — pages données (classement, stats…). */
export function PitchPageBanner({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 -mt-6 mb-8 sm:-mt-10 sm:mb-10">
      <div className="pitch-stripe relative overflow-hidden bg-pitch-deep text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 65% 90% at 90% 10%, rgba(212,160,23,0.3), transparent 55%), radial-gradient(ellipse 55% 80% at 0% 100%, rgba(26,92,69,0.6), transparent 50%)",
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-14">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-score">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                {description}
              </p>
            )}
          </div>
          {children ? <div className="shrink-0">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
