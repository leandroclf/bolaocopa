import type { PickOutcome, UpcomingMatchInsight } from "@/lib/types";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
    .format(new Date(`${d}T12:00:00`))
    .replace(".", "");

const outcomeClass: Record<PickOutcome, string> = {
  home: "text-lime",
  draw: "text-gold",
  away: "text-danger",
};

function OutcomeBars({ match }: { match: UpcomingMatchInsight }) {
  const bars: Array<[PickOutcome, string, number]> = [
    ["home" as const, match.home, match.outcomeBreakdown.homeWin],
    ["draw" as const, "Empate", match.outcomeBreakdown.draw],
    ["away" as const, match.away, match.outcomeBreakdown.awayWin],
  ];

  return (
    <div className="space-y-2">
      {bars.map(([outcome, label, count]) => {
        const percentage = match.totalPicks === 0 ? 0 : Math.round((count / match.totalPicks) * 1000) / 10;
        return (
          <div key={outcome}>
            <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[11px]">
              <span className="truncate text-slatey">{label}</span>
              <span className={outcomeClass[outcome]}>{percentage}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-pitch">
              <div
                className={`h-full rounded-full ${
                  outcome === "home" ? "bg-lime" : outcome === "draw" ? "bg-gold" : "bg-danger"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NextMatchPanel({ match }: { match: UpcomingMatchInsight | null }) {
  if (!match) return null;
  const leadingScores = new Set(match.mostCommonScores.slice(0, 1).map((score) => score.score));

  return (
    <section className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-lime">próxima apuração</p>
          <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Próximo jogo</h2>
        </div>
        <p className="font-mono text-xs text-slatey">G{match.group} · {fmtDay(match.date)} · {match.time}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <p className="text-right font-display text-3xl uppercase leading-none tracking-wide text-chalk">
              {match.home}
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-gold">x</p>
            <p className="font-display text-3xl uppercase leading-none tracking-wide text-chalk">
              {match.away}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">favorito</p>
              <p className="mt-1 truncate text-sm font-semibold text-lime">{match.topOutcome.label}</p>
            </div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">média</p>
              <p className="mt-1 font-mono text-sm font-bold text-chalk">
                {match.averageHomeGoals} x {match.averageAwayGoals}
              </p>
            </div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">palpites</p>
              <p className="mt-1 font-mono text-sm font-bold text-chalk">{match.totalPicks}</p>
            </div>
          </div>

          <div className="mt-5">
            <OutcomeBars match={match} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {match.mostCommonScores.map((score) => (
              <span key={score.score} className="rounded bg-pitch px-2 py-1 font-mono text-xs text-chalk">
                {score.score} · {score.count}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slatey">
            Palpites dos competidores
          </h3>
          <div className="grid max-h-[34rem] gap-1.5 overflow-auto pr-1 sm:grid-cols-2">
            {match.picks.map((pick) => {
              const score = `${pick.homeGoals}-${pick.awayGoals}`;
              const leader = leadingScores.has(score);
              return (
                <div
                  key={pick.name}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border px-3 py-2 ${
                    leader ? "border-gold/40 bg-gold/10" : "border-pitch-line bg-pitch-2"
                  }`}
                >
                  <span className="truncate text-sm text-chalk">{pick.name}</span>
                  <span className={`font-mono text-sm font-bold ${leader ? "text-gold" : "text-lime"}`}>
                    {pick.homeGoals} x {pick.awayGoals}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
