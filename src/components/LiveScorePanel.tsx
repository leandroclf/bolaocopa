"use client";

import { useEffect, useState } from "react";
import type { LiveScoreMatch } from "@/lib/types";

const LIVESCORE_URL = "https://www.thesportsdb.com/api/v1/json/123/livescore.php?l=4429";

function formatTime(value: string | null) {
  if (!value) return "ao vivo";
  return value;
}

export default function LiveScorePanel() {
  const [matches, setMatches] = useState<LiveScoreMatch[] | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(LIVESCORE_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { livescores?: LiveScoreMatch[] };
        if (!active) return;
        setMatches(Array.isArray(json.livescores) ? json.livescores : []);
      } catch (err) {
        if (!active) return;
        setMatches([]);
      }
    }

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  if (matches == null) return null;
  if (matches.length === 0) return null;

  const live = matches?.[0] ?? null;

  return (
    <section className="mx-auto max-w-5xl px-5 pb-4 pt-2">
      <div className="rounded-lg border border-lime/20 bg-lime/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime">camada complementar</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg uppercase tracking-widest text-chalk">placar ao vivo</h2>
            <p className="mt-1 text-sm text-slatey">
              Informação informativa do TheSportsDB. Não altera a pontuação do bolão.
            </p>
          </div>
          <span className="rounded-full bg-pitch px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slatey">
            atualiza a cada 30s
          </span>
        </div>

        {live && (
          <div className="mt-3 rounded-lg border border-pitch-line bg-pitch-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
                  {live.strLeague} · {formatTime(live.strEventTime)}
                </p>
                <p className="mt-1 font-display text-2xl uppercase tracking-wide text-chalk">
                  {live.strHomeTeam} x {live.strAwayTeam}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">status</p>
                <p className="mt-1 font-mono text-2xl font-bold text-lime">
                  {live.intHomeScore ?? "-"} x {live.intAwayScore ?? "-"}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">
                  {live.strStatus ?? live.strProgress ?? "in play"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
