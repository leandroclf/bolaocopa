"use client";
import { useMemo, useState } from "react";
import type { StandingEntry } from "@/lib/types";

type SortKey = "rank" | "points" | "exact" | "partial" | "name";
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Delta({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="font-mono text-[11px] text-slatey/60">novo</span>;
  if (delta > 0) return <span className="font-mono text-[11px] text-lime">▲{delta}</span>;
  if (delta < 0) return <span className="font-mono text-[11px] text-danger">▼{-delta}</span>;
  return <span className="font-mono text-[11px] text-slatey/60">–</span>;
}

export default function StandingsTable({ standings }: { standings: StandingEntry[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = q ? standings.filter((e) => normalize(e.name).includes(q)) : standings;
    const sorted = [...filtered];
    if (sortKey === "points") sorted.sort((a, b) => b.points - a.points || a.rank - b.rank);
    else if (sortKey === "exact") sorted.sort((a, b) => b.exact - a.exact || a.rank - b.rank);
    else if (sortKey === "partial") sorted.sort((a, b) => b.partial - a.partial || a.rank - b.rank);
    else if (sortKey === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    else sorted.sort((a, b) => a.rank - b.rank);
    return sorted;
  }, [standings, query, sortKey]);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      aria-pressed={sortKey === key}
      className={`h-8 shrink-0 rounded-full px-3 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        sortKey === key ? "bg-lime text-pitch" : "bg-pitch-2 text-slatey hover:text-chalk"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="mx-auto max-w-5xl px-5 py-6">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-lime">aba principal</p>
            <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Classificação</h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-slatey">{rows.length} nomes</span>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-slatey">ordenar</span>
          {sortBtn("rank", "posição")}
          {sortBtn("points", "pontos")}
          {sortBtn("exact", "exatos")}
          {sortBtn("partial", "parciais")}
          {sortBtn("name", "nome")}
          </div>
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar apostador…"
        aria-label="Buscar apostador"
        className="mb-4 w-full rounded-lg border border-pitch-line bg-pitch-2 px-4 py-2.5 text-sm text-chalk placeholder:text-slatey/70 focus:border-lime"
      />

      <ol className="space-y-1.5">
        {rows.map((e) => {
          const leader = e.rank === 1;
          return (
            <li
              key={e.name}
              className={`grid grid-cols-[2rem_1fr_2.2rem_3.3rem] items-center gap-2 rounded-lg border px-3 py-2.5 ${
                leader ? "border-gold/40 bg-gold/10" : "border-transparent bg-pitch-2"
              }`}
            >
              <div className={`text-center font-mono text-sm ${leader ? "text-gold" : "text-slatey"}`}>
                {e.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${leader ? "text-gold" : "text-chalk"}`}>
                  {e.name}
                </p>
                <p className="font-mono text-[11px] text-slatey">
                  {e.exact} exatos · {e.partial} parciais
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-lime">
                    gol venc. {e.partialWinnerGoal}
                  </span>
                  <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-gold">
                    gol perd. {e.partialLoserGoal}
                  </span>
                  <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-slatey">
                    resultado {e.resultOnly}
                  </span>
                </div>
              </div>
              <div className="text-center"><Delta delta={e.delta} /></div>
              <div className="text-right">
                <span className={`font-mono text-xl font-bold ${leader ? "text-gold" : "text-chalk"}`}>
                  {e.points}
                </span>
              </div>
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
