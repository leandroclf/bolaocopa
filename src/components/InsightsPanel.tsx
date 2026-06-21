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
  const primaryStories = metrics.storyMetrics.slice(0, 5);
  const secondaryStories = metrics.storyMetrics.slice(5);
  const stats = [
    ["Jogos restantes", String(metrics.remainingMatches)],
    ["Jogos apurados", String(metrics.finishedMatches)],
    ["Avanço da fase", `${metrics.completionRate}%`],
    ["Palpites válidos", String(metrics.totalValidPicks)],
    ["Gols previstos", `${metrics.averageUpcomingGoals}`],
  ] as const;
  const matchMetrics = [
    metrics.highestConsensus,
    metrics.mostDivisive,
    metrics.highestExpectedGoals,
  ];
  const roundSummary = [metrics.highestConsensus, metrics.mostDivisive, metrics.highestDrawShare, metrics.topUpcomingScore];

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

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">{value}</p>
          </div>
        ))}
        <div className="rounded-lg border border-pitch-line bg-pitch-2 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">Média de pontos</p>
          <p className="mt-1 font-mono text-2xl font-bold text-gold">{metrics.averagePoints}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {matchMetrics.map((metric, index) => (
          <div key={`${index}-${metric?.label ?? "empty"}`} className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
            <MetricMatch metric={metric} />
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {primaryStories.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">{metric.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">{metric.value}</p>
            <p className="mt-1 text-sm text-slatey">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-pitch-line bg-pitch-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime">resumo da rodada</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {roundSummary.map((metric) => (
            <div key={metric?.label ?? "empty"} className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
              {metric ? (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">{metric.label}</p>
                  <p className="mt-1 text-sm font-semibold text-chalk">{metric.value}</p>
                  <p className="mt-1 text-xs text-slatey">
                    {"detail" in metric ? metric.detail : `${metric.label} em destaque`}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slatey">Sem dado suficiente.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {secondaryStories.length > 0 && (
        <details className="mt-3 rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.24em] text-slatey">
            Mais leituras
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {secondaryStories.map((metric) => (
              <div key={metric.label} className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">{metric.label}</p>
                <p className="mt-1 font-mono text-xl font-bold text-chalk">{metric.value}</p>
                <p className="mt-1 text-sm text-slatey">{metric.detail}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
