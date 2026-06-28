"use client";
import { useMemo, useState } from "react";
import type { StandingsMetrics, StandingEntry } from "@/lib/types";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function StandingsTable({
  standings,
  metrics,
  emptyTitle = "CAPTURA ENCERRADA",
  emptyBody = "O prazo de envio terminou. A classificação desta fase segue apenas para conferência e apuração dos palpites já recebidos.",
}: {
  standings: StandingEntry[];
  metrics: StandingsMetrics;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    return q ? standings.filter((e) => normalize(e.name).includes(q)) : standings;
  }, [standings, query]);

  if (standings.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-4">
        <div className="rounded-xl border border-dashed border-pitch-line bg-pitch-2 px-5 py-8 text-center">
          <p className="font-display text-2xl uppercase tracking-wide text-gold">{emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slatey">{emptyBody}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl uppercase tracking-widest text-chalk">Classificação</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slatey">{rows.length} nomes</span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">líder</p>
          <p className="mt-1 truncate font-display text-lg uppercase tracking-wide text-gold">
            {standings[0]?.name ?? "-"}
          </p>
          <p className="mt-1 font-mono text-xs text-slatey">{standings[0]?.points ?? 0} pontos</p>
        </div>
        <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">diferença p/ vice</p>
          <p className="mt-1 font-mono text-2xl font-bold text-info">{metrics.leaderGap ?? 0}</p>
          <p className="mt-1 text-xs text-slatey">pontos</p>
        </div>
        <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">média do grupo</p>
          <p className="mt-1 font-mono text-2xl font-bold text-info">{metrics.averagePoints}</p>
          <p className="mt-1 text-xs text-slatey">pontos por apostador</p>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar apostador…"
        aria-label="Buscar apostador"
        className="mb-3 w-full rounded-lg border border-pitch-line bg-pitch-2 px-4 py-2.5 text-sm text-chalk placeholder:text-slatey/70 focus:border-lime"
      />

      <ol className="space-y-1.5">
        {rows.map((e) => {
          const leader = e.rank === 1;
          return (
            <li
              key={e.name}
              className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2.5 ${
                leader ? "border-gold/40 bg-gold/10" : "border-transparent bg-pitch-2"
              }`}
            >
              <div className={`text-center font-mono text-sm ${leader ? "text-gold" : "text-slatey"}`}>
                {e.rank}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${leader ? "text-gold" : "text-chalk"}`}>
                  {e.name}
                </p>
                <p className="font-mono text-[11px] text-slatey">
                  {e.exact} exatos · {e.partial} parciais
                </p>
              </div>
              <span className={`font-mono text-xl font-bold ${leader ? "text-gold" : "text-chalk"}`}>
                {e.points}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-lg border border-dashed border-pitch-line px-4 py-6 text-center text-sm text-slatey">
            Nenhum apostador encontrado.
          </li>
        )}
      </ol>
    </section>
  );
}
