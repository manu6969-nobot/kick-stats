"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TeamBadge } from "@/components/team-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { matches as baseMatches, players, teams } from "@/data/championship";
import type {
  LiveMatchResult,
  LiveResultsFile,
  Match,
  MatchEvent,
  MatchEventType,
} from "@/data/types";
import {
  applyLiveResult,
  eventLabel,
  normalizeCardEvent,
  scoreFromGoals,
} from "@/lib/live-results-shared";
import { formatDate, getTeam, playerDisplayName } from "@/lib/stats";
import { cn } from "@/lib/utils";

function emptyLive(): LiveResultsFile {
  return { updatedAt: new Date().toISOString(), matches: {} };
}

function newEventId() {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [live, setLive] = useState<LiveResultsFile>(emptyLive);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [matchday, setMatchday] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const merged = useMemo(
    () => baseMatches.map((m) => applyLiveResult(m, live.matches[m.id])),
    [live]
  );

  const matchdays = useMemo(
    () => [...new Set(baseMatches.map((m) => m.matchday))].sort((a, b) => a - b),
    []
  );

  const dayMatches = useMemo(
    () =>
      merged
        .filter((m) => m.matchday === matchday)
        .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff)),
    [merged, matchday]
  );

  const selected = merged.find((m) => m.id === selectedId) ?? null;

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    const data = (await res.json()) as { ok: boolean };
    setAuthed(data.ok);
    if (data.ok) {
      const r = await fetch("/api/admin/results");
      if (r.ok) {
        const file = (await r.json()) as LiveResultsFile;
        setLive(file);
        localStorage.setItem("p1-live-results", JSON.stringify(file));
      }
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    try {
      const cached = localStorage.getItem("p1-live-results");
      if (cached) setLive(JSON.parse(cached) as LiveResultsFile);
    } catch {
      /* ignore */
    }
  }, [refreshSession]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Mot de passe incorrect");
      return;
    }
    setPassword("");
    await refreshSession();
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
  }

  async function saveLive(next: LiveResultsFile, label = "Résultat enregistré") {
    setSaving(true);
    setMessage("");
    setLive(next);
    localStorage.setItem("p1-live-results", JSON.stringify(next));
    try {
      const res = await fetch("/api/admin/results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Erreur d’enregistrement");
      } else if (data.hint) {
        setMessage(`${label}. ${data.hint}`);
      } else {
        setMessage(`${label} ✓`);
      }
    } catch {
      setMessage(`${label} (local navigateur uniquement).`);
    } finally {
      setSaving(false);
    }
  }

  function updateMatchResult(matchId: string, result: LiveMatchResult | null) {
    const matches = { ...live.matches };
    if (
      result == null ||
      (result.status === "scheduled" &&
        result.homeScore == null &&
        result.awayScore == null &&
        (!result.events || result.events.length === 0))
    ) {
      delete matches[matchId];
      const next: LiveResultsFile = {
        updatedAt: new Date().toISOString(),
        matches,
      };
      void saveLive(next, "Résultat effacé");
      return;
    }

    // Jamais persister « programmé » avec un score : forcer terminé
    const normalized: LiveMatchResult =
      result.status === "scheduled" &&
      result.homeScore != null &&
      result.awayScore != null
        ? { ...result, status: "finished" }
        : result;

    matches[matchId] = normalized;
    const next: LiveResultsFile = {
      updatedAt: new Date().toISOString(),
      matches,
    };
    void saveLive(
      next,
      `Score enregistré ${normalized.homeScore ?? 0}-${normalized.awayScore ?? 0}`
    );
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(live, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "live-results.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authed === null) {
    return <p className="text-muted-foreground">Vérification de session…</p>;
  }

  if (!authed) {
    return (
      <form
        onSubmit={login}
        className="mx-auto max-w-sm space-y-4 rounded-xl border border-border/80 bg-card p-6 shadow-sm"
      >
        <h1 className="font-display text-2xl font-bold">Admin P1 Luxembourg</h1>
        <p className="text-sm text-muted-foreground">
          Mot de passe par défaut : <code>p1admin</code> (variable{" "}
          <code>ADMIN_PASSWORD</code> sur Vercel).
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
        {loginError && <p className="text-sm text-loss">{loginError}</p>}
        <Button type="submit" className="w-full">
          Connexion
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin — résultats</h1>
          <p className="text-sm text-muted-foreground">
            Encodez scores, buteurs (minute) et cartons. 2 jaunes = rouge automatique.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadJson}>
            Télécharger JSON
          </Button>
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            Déconnexion
          </Button>
        </div>
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
          {saving ? "Enregistrement… " : ""}
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {matchdays.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setMatchday(d);
              setSelectedId(null);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-semibold tabular-nums transition",
              matchday === d
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            J{d}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">Journée {matchday}</h2>
          {dayMatches.map((m) => {
            const home = getTeam(m.homeTeamId)!;
            const away = getTeam(m.awayTeamId)!;
            const done = m.status === "finished";
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  selectedId === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border/80 bg-card hover:border-primary/30"
                )}
              >
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {formatDate(m.date)}
                </span>
                <TeamBadge team={home} size="sm" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {home.shortName}
                  <span className="mx-1 text-muted-foreground">–</span>
                  {away.shortName}
                </span>
                <TeamBadge team={away} size="sm" />
                <span className="w-14 text-right font-display font-bold tabular-nums">
                  {done ? `${m.homeScore ?? 0}-${m.awayScore ?? 0}` : m.kickoff}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
          {selected ? (
            <MatchEditor
              key={selected.id}
              match={selected}
              onSave={(result) => updateMatchResult(selected.id, result)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sélectionnez un match pour encoder le résultat.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-3 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Publier sur le site (Vercel)</p>
        <p>
          Télécharger le JSON ne change pas le site tout seul. Il faut mettre à
          jour le fichier sur GitHub :
        </p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>
            Cliquez{" "}
            <button type="button" className="underline" onClick={downloadJson}>
              Télécharger JSON
            </button>
          </li>
          <li>
            Ouvrez{" "}
            <a
              className="underline"
              href="https://github.com/manu6969-nobot/kick-stats/blob/main/data/live-results.json"
              target="_blank"
              rel="noreferrer"
            >
              data/live-results.json
            </a>{" "}
            sur GitHub → icône crayon
          </li>
          <li>Effacez tout, collez le contenu du fichier téléchargé → Commit changes</li>
          <li>Attendez 1–2 min le redéploiement Vercel, puis rechargez le site</li>
        </ol>
        <p>
          Option durable : ajoutez <code>GITHUB_TOKEN</code> dans Vercel (PAT avec
          droit Contents) pour publier automatiquement à chaque enregistrement.
          Voir aussi{" "}
          <Link href="/" className="underline">
            le site public
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function isPastMatch(dateIso: string) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayIso = `${y}-${m}-${d}`;
  return dateIso <= todayIso;
}

function MatchEditor({
  match,
  onSave,
}: {
  match: Match;
  onSave: (result: LiveMatchResult | null) => void;
}) {
  const home = getTeam(match.homeTeamId)!;
  const away = getTeam(match.awayTeamId)!;
  const homePlayers = players
    .filter((p) => p.teamId === home.id)
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));
  const awayPlayers = players
    .filter((p) => p.teamId === away.id)
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));

  const past = isPastMatch(match.date);
  const initialStatus: "scheduled" | "live" | "finished" =
    match.status === "live" || match.status === "finished"
      ? match.status
      : past
        ? "finished"
        : "scheduled";

  const [homeScore, setHomeScore] = useState(String(match.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(match.awayScore ?? 0));
  const [status, setStatus] = useState<"scheduled" | "live" | "finished">(initialStatus);
  const [events, setEvents] = useState<MatchEvent[]>(match.events ?? []);
  const [evType, setEvType] = useState<MatchEventType>("goal");
  const [evTeam, setEvTeam] = useState(home.id);
  const [evPlayer, setEvPlayer] = useState("");
  const [evAssist, setEvAssist] = useState("");
  const [evMinute, setEvMinute] = useState("1");

  const teamPlayers = evTeam === home.id ? homePlayers : awayPlayers;

  function addEvent() {
    const minute = Math.max(1, Math.min(130, Number(evMinute) || 1));
    let incoming: MatchEvent = {
      id: newEventId(),
      minute,
      type: evType,
      teamId: evTeam,
      playerId: evPlayer || undefined,
      assistId: evType === "goal" && evAssist ? evAssist : undefined,
    };
    incoming = normalizeCardEvent(events, incoming);

    const nextEvents = [...events, incoming].sort((a, b) => a.minute - b.minute);
    setEvents(nextEvents);

    if (incoming.type === "goal" || incoming.type === "own_goal") {
      const scored = scoreFromGoals(nextEvents, home.id, away.id);
      setHomeScore(String(scored.homeScore));
      setAwayScore(String(scored.awayScore));
      if (status !== "live") setStatus("finished");
    }

    setEvMinute(String(minute));
    setEvPlayer("");
    setEvAssist("");
  }

  function removeEvent(id?: string, index?: number) {
    setEvents((prev) => prev.filter((e, i) => (id ? e.id !== id : i !== index)));
  }

  function recalcScore() {
    const scored = scoreFromGoals(events, home.id, away.id);
    setHomeScore(String(scored.homeScore));
    setAwayScore(String(scored.awayScore));
    if (status !== "live") setStatus("finished");
  }

  function save() {
    const hs = Math.max(0, Number.parseInt(String(homeScore), 10) || 0);
    const as = Math.max(0, Number.parseInt(String(awayScore), 10) || 0);
    // Toujours persister un vrai résultat (terminé), sauf si Live est choisi
    const finalStatus: "live" | "finished" = status === "live" ? "live" : "finished";

    setStatus(finalStatus);
    setHomeScore(String(hs));
    setAwayScore(String(as));

    onSave({
      status: finalStatus,
      homeScore: hs,
      awayScore: as,
      events,
    });
  }

  function clearResult() {
    setStatus(past ? "finished" : "scheduled");
    setHomeScore("0");
    setAwayScore("0");
    setEvents([]);
    onSave(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {formatDate(match.date)} · {match.kickoff} · J{match.matchday}
          </p>
          <h3 className="font-display text-xl font-bold">
            {home.name} – {away.name}
          </h3>
        </div>
        <Badge variant={status === "finished" ? "secondary" : "default"}>
          {status === "finished" ? "Terminé" : status === "live" ? "Live" : "Programmé"}
        </Badge>
      </div>

      {past && match.status === "scheduled" && (
        <p className="rounded-md border border-score/40 bg-score/10 px-3 py-2 text-sm">
          Date dépassée — saisissez le score puis cliquez{" "}
          <strong>Enregistrer le score</strong> (le match passera en Terminé).
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Score {home.shortName}</span>
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 font-display text-lg font-bold tabular-nums"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Statut</span>
          <select
            value={status === "scheduled" ? "finished" : status}
            onChange={(e) => setStatus(e.target.value as "live" | "finished")}
            className="w-full rounded-md border border-border px-2 py-1.5"
          >
            <option value="finished">Terminé</option>
            <option value="live">En cours</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Score {away.shortName}</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 font-display text-lg font-bold tabular-nums"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={recalcScore}>
          Score depuis les buts
        </Button>
        <Button type="button" size="sm" onClick={save}>
          Enregistrer le score
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearResult}>
          Effacer résultat
        </Button>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <h4 className="font-display text-lg font-bold">Ajouter un événement</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            Type
            <select
              value={evType}
              onChange={(e) => setEvType(e.target.value as MatchEventType)}
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
            >
              <option value="goal">But</option>
              <option value="own_goal">CSC</option>
              <option value="yellow">Carton jaune</option>
              <option value="red">Carton rouge (direct)</option>
              <option value="second_yellow">2e jaune (rouge)</option>
            </select>
          </label>
          <label className="text-sm">
            Minute
            <input
              type="number"
              min={1}
              max={130}
              value={evMinute}
              onChange={(e) => setEvMinute(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            Équipe
            <select
              value={evTeam}
              onChange={(e) => {
                setEvTeam(e.target.value);
                setEvPlayer("");
                setEvAssist("");
              }}
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
            >
              <option value={home.id}>{home.name}</option>
              <option value={away.id}>{away.name}</option>
            </select>
          </label>
          <label className="text-sm">
            Joueur
            <select
              value={evPlayer}
              onChange={(e) => setEvPlayer(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
            >
              <option value="">—</option>
              {teamPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {playerDisplayName(p)}
                </option>
              ))}
            </select>
          </label>
          {evType === "goal" && (
            <label className="text-sm sm:col-span-2">
              Passeur (optionnel)
              <select
                value={evAssist}
                onChange={(e) => setEvAssist(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-2 py-1.5"
              >
                <option value="">—</option>
                {teamPlayers
                  .filter((p) => p.id !== evPlayer)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {playerDisplayName(p)}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Un 2e carton jaune pour le même joueur est automatiquement converti en{" "}
          <strong>2e jaune (rouge)</strong> — distinct du rouge direct.
        </p>
        <Button type="button" onClick={addEvent}>
          Ajouter l’événement
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <h4 className="font-display text-lg font-bold">Feuille de match</h4>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((ev, index) => {
              const player = players.find((p) => p.id === ev.playerId);
              const assist = players.find((p) => p.id === ev.assistId);
              const team = teams.find((t) => t.id === ev.teamId);
              return (
                <li
                  key={ev.id ?? `${ev.minute}-${index}`}
                  className="flex items-start gap-2 rounded-md border border-border/60 px-2 py-1.5 text-sm"
                >
                  <span className="w-10 font-display font-bold text-pitch">
                    {ev.minute}&apos;
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {eventLabel(ev.type)}
                      {team ? ` · ${team.shortName}` : ""}
                      {player ? ` · ${playerDisplayName(player)}` : ""}
                    </p>
                    {assist && (
                      <p className="text-xs text-muted-foreground">
                        Passe : {playerDisplayName(assist)}
                      </p>
                    )}
                    {ev.type === "second_yellow" && (
                      <p className="text-xs text-loss">Expulsion (2 jaunes)</p>
                    )}
                    {ev.type === "red" && (
                      <p className="text-xs text-loss">Expulsion (rouge direct)</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-loss"
                    onClick={() => removeEvent(ev.id, index)}
                  >
                    Retirer
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
