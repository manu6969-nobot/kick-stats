#!/usr/bin/env node
/**
 * Autorise le refresh RBFA uniquement aux créneaux Europe/Brussels :
 *   - vendredi 22:15
 *   - samedi 22:15
 *   - dimanche 17:00
 * Fenêtre ±8 minutes (les cron GitHub Actions sont en UTC / peu précis).
 *
 * FORCE=1 ou argument --force → toujours autoriser (manuel).
 *
 * Sortie GitHub Actions :
 *   echo "run=true|false" >> $GITHUB_OUTPUT
 */
import { appendFileSync } from "fs";

const FORCE =
  process.env.FORCE === "1" ||
  process.env.FORCE === "true" ||
  process.argv.includes("--force");

const WINDOW_MIN = 8;

/** Créneaux cibles (jour JS : 0=dim … 5=ven 6=sam) → heures:minutes Brussels */
const SLOTS = [
  { weekday: 5, hour: 22, minute: 15 }, // vendredi
  { weekday: 6, hour: 22, minute: 15 }, // samedi
  { weekday: 0, hour: 17, minute: 0 }, // dimanche
];

function brusselsNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[
    get("weekday")
  ];
  return {
    weekday: wd,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    label: `${get("weekday")} ${get("hour")}:${get("minute")} Europe/Brussels`,
  };
}

function minutesOfDay(hour, minute) {
  return hour * 60 + minute;
}

function inWindow(now, slot) {
  if (now.weekday !== slot.weekday) return false;
  const a = minutesOfDay(now.hour, now.minute);
  const b = minutesOfDay(slot.hour, slot.minute);
  return Math.abs(a - b) <= WINDOW_MIN;
}

const now = brusselsNow();
const matched = SLOTS.find((s) => inWindow(now, s));
const run = FORCE || Boolean(matched);

console.log(`Heure locale: ${now.label}`);
if (FORCE) console.log("FORCE=1 → run autorisé");
else if (matched) {
  console.log(
    `Créneau OK: weekday=${matched.weekday} ${String(matched.hour).padStart(2, "0")}:${String(matched.minute).padStart(2, "0")}`
  );
} else {
  console.log("Hors créneau → skip");
}
console.log(`run=${run}`);

const out = process.env.GITHUB_OUTPUT;
if (out) {
  appendFileSync(out, `run=${run}\n`);
}

process.exit(0);
