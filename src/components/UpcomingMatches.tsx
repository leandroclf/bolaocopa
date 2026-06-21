"use client";

import { useMemo, useState } from "react";
import type { UpcomingMatchInsight } from "@/lib/types";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${d}T12:00:00`));

export default function UpcomingMatches({ matches }: { matches: UpcomingMatchInsight[] }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? null);
  const selected = useMemo(
    () => matches.find((match) => match.id === selectedId) ?? matches[0] ?? null,
    [matches, selectedId]
  );

  if (matches.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-lime">mapa de palpites</p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Próximos jogos</h2>
        </div>
        <p className="font-mono text-xs text-slatey">{matches.length} jogos pendentes</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid max-h-[42rem] gap-2 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelectedId(match.id)}
              aria-pressed={selected?.id === match.id}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected?.id === match.id
                  ? "border-lime bg-lime/10"
                  : "border-pitch-line bg-pitch-2 hover:border-slatey"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-lime">G{match.group}</span>
                <span className="font-mono text-[10px] text-slatey">{fmtDay(match.date)} · {match.time}</span>
              </div>
              <p className="truncate text-sm font-semibold text-chalk">{match.home} x {match.away}</p>
              <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[11px] text-slatey">
                <span className="truncate">{match.topOutcome.label}</span>
                <span className="text-gold">{match.topOutcome.percentage}%</span>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
                    G{selected.group} · {fmtDay(selected.date)} · {selected.time}
                  </p>
                  <h3 className="mt-1 font-display text-2xl uppercase tracking-wide text-chalk">
                    {selected.home} x {selected.away}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">média</p>
                  <p className="font-mono text-lg font-bold text-gold">
                    {selected.averageHomeGoals} x {selected.averageAwayGoals}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-pitch-line bg-pitch px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">mandante</p>
                  <p className="font-mono text-sm text-lime">{selected.outcomeBreakdown.homeWin}</p>
                </div>
                <div className="rounded border border-pitch-line bg-pitch px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">empate</p>
                  <p className="font-mono text-sm text-gold">{selected.outcomeBreakdown.draw}</p>
                </div>
                <div className="rounded border border-pitch-line bg-pitch px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">visitante</p>
                  <p className="font-mono text-sm text-danger">{selected.outcomeBreakdown.awayWin}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.mostCommonScores.map((score) => (
                  <span key={score.score} className="rounded bg-pitch px-2 py-1 font-mono text-xs text-chalk">
                    {score.score} · {score.count} votos
                  </span>
                ))}
                {selected.missingPicks > 0 && (
                  <span className="rounded bg-danger/15 px-2 py-1 font-mono text-xs text-danger">
                    {selected.missingPicks} sem palpite válido
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 grid max-h-[28rem] gap-1.5 overflow-auto pr-1 sm:grid-cols-2">
              {selected.picks.map((pick) => (
                <div key={pick.name} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-pitch-line bg-pitch-2 px-3 py-2">
                  <span className="truncate text-sm text-chalk">{pick.name}</span>
                  <span className="font-mono text-sm font-bold text-lime">{pick.homeGoals} x {pick.awayGoals}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
