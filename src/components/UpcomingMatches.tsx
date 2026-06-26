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
    <section className="mx-auto max-w-5xl px-5 py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-xl uppercase tracking-widest text-chalk">Mapa de palpites</h2>
        <p className="font-mono text-xs text-slatey">{matches.length} jogos pendentes</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid max-h-[42rem] gap-2 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
          {matches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => setSelectedId(match.id)}
              aria-pressed={selected?.id === match.id}
              className={`rounded-lg border p-3 text-left ${
                selected?.id === match.id
                  ? "border-lime bg-lime/10"
                  : "border-pitch-line bg-pitch-2"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-slatey">G{match.group}</span>
                <span className="font-mono text-[10px] text-slatey">{fmtDay(match.date)} · {match.time}</span>
              </div>
              <p className="truncate text-sm font-semibold text-chalk">{match.home} x {match.away}</p>
              <p className="mt-1 font-mono text-[11px] text-slatey">{match.totalPicks} palpites</p>
            </button>
          ))}
        </div>

        {selected && (
          <div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl uppercase tracking-wide text-chalk">
                  {selected.home} x {selected.away}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">
                  G{selected.group} · {fmtDay(selected.date)} · {selected.time}
                </p>
              </div>

              <div className="grid gap-1.5">
                {([
                  [selected.home, selected.outcomeBreakdown.homeWin, "text-lime"],
                  ["Empate", selected.outcomeBreakdown.draw, "text-slatey"],
                  [selected.away, selected.outcomeBreakdown.awayWin, "text-info"],
                ] as Array<[string, number, string]>).map(([label, count, color]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-md border border-pitch-line bg-pitch px-3 py-2"
                  >
                    <span className="truncate text-sm text-chalk">{label}</span>
                    <span className={`font-mono text-sm font-bold ${color}`}>
                      {count} {count === 1 ? "aposta" : "apostas"}
                    </span>
                  </div>
                ))}
              </div>

              {selected.mostCommonScores.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slatey">placares mais apostados</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.mostCommonScores.map((score) => (
                      <span key={score.score} className="rounded bg-pitch px-2 py-1 font-mono text-xs text-chalk">
                        {score.score} · {score.count} {score.count === 1 ? "voto" : "votos"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
