import type { MatchMetric, StandingsMetrics } from "@/lib/types";

function MetricMatch({ metric }: { metric: MatchMetric | null }) {
  if (!metric) return <span className="text-slatey">Sem jogos pendentes</span>;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">{metric.label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-chalk">
        G{metric.group} · {metric.home} x {metric.away}
      </p>
      <p className="mt-1 font-mono text-xs text-lime">{metric.value}</p>
    </div>
  );
}

export default function InsightsPanel({ metrics }: { metrics: StandingsMetrics }) {
  const stats = [
    ["Jogos restantes", String(metrics.remainingMatches)],
    ["Jogos apurados", String(metrics.finishedMatches)],
    ["Palpites válidos", String(metrics.totalValidPicks)],
    ["Gols previstos", `${metrics.averageUpcomingGoals}`],
  ] as const;

  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-lime">leitura do bolão</p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Métricas</h2>
        </div>
        <p className="hidden max-w-sm text-right text-xs text-slatey sm:block">
          Consenso, divisão e expectativa calculados só com nome e palpites.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <MetricMatch metric={metrics.highestConsensus} />
        </div>
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <MetricMatch metric={metrics.mostDivisive} />
        </div>
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <MetricMatch metric={metrics.highestExpectedGoals} />
        </div>
      </div>
    </section>
  );
}
