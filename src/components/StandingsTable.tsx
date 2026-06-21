"use client";
import { useMemo, useState } from "react";
import type { StandingsMetrics, StandingEntry } from "@/lib/types";

type SortKey = "rank" | "points" | "exact" | "partial" | "name";
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Delta({ delta }: { delta: number | null }) {
  if (delta == null) return <span className="rounded-full bg-pitch px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slatey">novo</span>;
  if (delta > 0) return <span className="rounded-full bg-lime/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">subiu +{delta}</span>;
  if (delta < 0) return <span className="rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danger">caiu {delta}</span>;
  return <span className="rounded-full bg-pitch px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slatey">estável</span>;
}

export default function StandingsTable({
  standings,
  metrics,
  selectedParticipant,
  onSelectParticipant,
}: {
  standings: StandingEntry[];
  metrics: StandingsMetrics;
  selectedParticipant: string;
  onSelectParticipant: (name: string) => void;
}) {
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
  const topMovement = useMemo(() => {
    const movers = standings
      .filter((entry) => entry.delta !== null && entry.delta !== 0)
      .slice()
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0) || b.delta! - a.delta!);
    return {
      up: movers.find((entry) => (entry.delta ?? 0) > 0) ?? null,
      down: movers.find((entry) => (entry.delta ?? 0) < 0) ?? null,
    };
  }, [standings]);

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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">líder</p>
            <p className="mt-1 truncate font-display text-lg uppercase tracking-wide text-chalk">
              {standings[0]?.name ?? "-"}
            </p>
            <p className="mt-1 font-mono text-xs text-gold">{standings[0]?.points ?? 0} pontos</p>
          </div>
          <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">diferença</p>
            <p className="mt-1 font-mono text-2xl font-bold text-lime">{metrics.leaderGap ?? 0} pts</p>
            <p className="mt-1 text-xs text-slatey">para o vice-líder</p>
          </div>
          <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">média do pelotão</p>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">{metrics.averagePoints}</p>
            <p className="mt-1 text-xs text-slatey">pontos por apostador</p>
          </div>
          <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">jogos apurados</p>
            <p className="mt-1 font-mono text-2xl font-bold text-chalk">{metrics.finishedMatches}</p>
            <p className="mt-1 text-xs text-slatey">de {metrics.totalMatches}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">subida mais forte</p>
            <p className="mt-1 truncate text-sm font-semibold text-chalk">{topMovement.up?.name ?? "Sem mudança"}</p>
            <p className="mt-1 font-mono text-xs text-lime">{topMovement.up ? `+${topMovement.up.delta} posições` : "Aguardando nova apuração"}</p>
          </div>
          <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">queda mais forte</p>
            <p className="mt-1 truncate text-sm font-semibold text-chalk">{topMovement.down?.name ?? "Sem queda"}</p>
            <p className="mt-1 font-mono text-xs text-danger">{topMovement.down ? `${topMovement.down.delta} posições` : "Aguardando nova apuração"}</p>
          </div>
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
      <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-slatey">
        {query ? `${rows.length} resultado${rows.length === 1 ? "" : "s"} para "${query}"` : "busca rápida por nome"}
      </p>
      {selectedParticipant !== "todos" && (
        <div className="mb-3 rounded-lg border border-lime/30 bg-lime/10 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-lime">modo foco</p>
              <p className="mt-1 text-sm font-semibold text-chalk">{selectedParticipant}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectParticipant("todos")}
              className="rounded-full bg-pitch px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slatey"
            >
              limpar
            </button>
          </div>
        </div>
      )}

      {selectedParticipant !== "todos" && standings.find((entry) => entry.name === selectedParticipant) && (
        <div className="mb-4 rounded-lg border border-pitch-line bg-pitch-2 p-4">
          {(() => {
            const focused = standings.find((entry) => entry.name === selectedParticipant)!;
            return (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">posição</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-gold">{focused.rank}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">pontos</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-lime">{focused.points}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">exatos</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-chalk">{focused.exact}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">parciais</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-chalk">{focused.partial}</p>
                </div>
              </div>
            );
          })()}
          <p className="mt-3 text-sm text-slatey">
            {selectedParticipant} está a{" "}
            <span className="text-chalk">
              {Math.abs((standings[0]?.points ?? 0) - (standings.find((entry) => entry.name === selectedParticipant)?.points ?? 0))}
            </span>{" "}
            ponto{Math.abs((standings[0]?.points ?? 0) - (standings.find((entry) => entry.name === selectedParticipant)?.points ?? 0)) === 1 ? "" : "s"} do líder e
            {(() => {
              const focused = standings.find((entry) => entry.name === selectedParticipant);
              if (!focused) return " ainda não tem dados suficientes.";
              const delta = focused.points - metrics.averagePoints;
              return ` está ${delta > 0 ? "+" : ""}${delta} em relação à média do grupo.`;
            })()}
          </p>
        </div>
      )}

      <ol className="space-y-1.5">
        {rows.map((e) => {
          const leader = e.rank === 1;
          const focused = e.name === selectedParticipant;
          const deltaLabel =
            e.delta == null ? "novo" : e.delta === 0 ? "estável" : e.delta > 0 ? `subiu ${e.delta}` : `caiu ${Math.abs(e.delta)}`;
          return (
            <li
              key={e.name}
              className={`grid grid-cols-[2rem_1fr_2.8rem_3.3rem] items-center gap-2 rounded-lg border px-3 py-2.5 sm:grid-cols-[2rem_1fr_4rem_3.3rem] ${
                focused ? "border-lime/50 bg-lime/10" : leader ? "border-gold/40 bg-gold/10" : "border-transparent bg-pitch-2"
              }`}
              onClick={() => onSelectParticipant(e.name)}
            >
              <div className={`text-center font-mono text-sm ${leader ? "text-gold" : focused ? "text-lime" : "text-slatey"}`}>
                {e.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${leader ? "text-gold" : focused ? "text-lime" : "text-chalk"}`}>
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
              <div className="text-center">
                <Delta delta={e.delta} />
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slatey">{deltaLabel}</p>
              </div>
              <div className="text-right">
                <span className={`font-mono text-xl font-bold ${leader ? "text-gold" : focused ? "text-lime" : "text-chalk"}`}>
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
