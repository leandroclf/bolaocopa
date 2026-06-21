import type { MatchMetric, StandingEntry, StandingsMetrics } from "@/lib/types";
import type { RecentResult, UpcomingMatchInsight } from "@/lib/types";

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

export default function InsightsPanel({
  metrics,
  selectedParticipant,
  selectedStanding,
  recentResults,
  upcomingMatches,
  compactMode,
}: {
  metrics: StandingsMetrics;
  selectedParticipant: string;
  selectedStanding: StandingEntry | null;
  recentResults: RecentResult[];
  upcomingMatches: UpcomingMatchInsight[];
  compactMode: boolean;
}) {
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
  const focusDelta = selectedStanding ? selectedStanding.points - metrics.averagePoints : null;
  const riskyPicks = upcomingMatches
    .flatMap((match) =>
      match.picks
        .map((pick) => ({
          match,
          pick,
          diff: Math.abs(pick.homeGoals - match.averageHomeGoals) + Math.abs(pick.awayGoals - match.averageAwayGoals),
        }))
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 2)
    )
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4);
  const lastRound = recentResults.slice(0, 4);

  return (
    <section className={`mx-auto max-w-5xl px-5 ${compactMode ? "py-5" : "py-8"}`}>
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

      <div className="mt-3 rounded-lg border border-pitch-line bg-pitch-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime">resumo individual</p>
        {selectedStanding ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">apostador</p>
              <p className="mt-1 truncate text-sm font-semibold text-chalk">{selectedStanding.name}</p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">posição</p>
              <p className="mt-1 font-mono text-2xl font-bold text-gold">{selectedStanding.rank}</p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">acertos</p>
              <p className="mt-1 font-mono text-2xl font-bold text-lime">
                {selectedStanding.exact} / {selectedStanding.partial}
              </p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">vs grupo</p>
              <p className="mt-1 font-mono text-2xl font-bold text-chalk">
                {focusDelta != null ? `${focusDelta > 0 ? "+" : ""}${focusDelta}` : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slatey">Selecione um apostador para ver a leitura individual e a comparação com o grupo.</p>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime">histórico recente</p>
          <div className="mt-3 grid gap-2">
            {lastRound.map((match) => (
              <div key={match.id} className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
                  G{match.group} · {match.date}
                </p>
                <p className="mt-1 text-sm text-chalk">
                  {match.home} {match.homeGoals}–{match.awayGoals} {match.away}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime">apostas arriscadas</p>
          <div className="mt-3 grid gap-2">
            {riskyPicks.length > 0 ? (
              riskyPicks.map((item, index) => (
                <div key={`${item.match.id}-${item.pick.name}-${index}`} className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
                  <p className="truncate text-sm font-semibold text-chalk">{item.pick.name}</p>
                  <p className="mt-1 text-xs text-slatey">
                    {item.match.home} x {item.match.away} · {item.pick.homeGoals}x{item.pick.awayGoals}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slatey">Sem apostas com divergência relevante.</p>
            )}
          </div>
        </div>
      </div>

      <div className={`mt-3 grid gap-2 ${compactMode ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
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
