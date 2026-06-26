import type { UpcomingMatchInsight } from "@/lib/types";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })
    .format(new Date(`${d}T12:00:00`))
    .replace(".", "");

function MatchCard({ match }: { match: UpcomingMatchInsight }) {
  const rows: Array<[string, number, string]> = [
    [match.home, match.outcomeBreakdown.homeWin, "text-lime"],
    ["Empate", match.outcomeBreakdown.draw, "text-slatey"],
    [match.away, match.outcomeBreakdown.awayWin, "text-info"],
  ];

  return (
    <details className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
              G{match.group} · {fmtDay(match.date)} · {match.time}
            </p>
            <h3 className="mt-1 font-display text-xl uppercase tracking-wide text-chalk">
              {match.home} x {match.away}
            </h3>
          </div>
          <span className="rounded bg-pitch px-2 py-1 font-mono text-xs text-slatey">
            {match.totalPicks} palpites
          </span>
        </div>
      </summary>

      <div className="mt-4 border-t border-pitch-line pt-4">
        <div className="grid gap-1.5">
          {rows.map(([label, count, color]) => (
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

        {match.mostCommonScores.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slatey">
              placares mais apostados
            </p>
            <div className="flex flex-wrap gap-2">
              {match.mostCommonScores.map((score) => (
                <span key={score.score} className="rounded bg-pitch px-2 py-1 font-mono text-xs text-chalk">
                  {score.score} · {score.count} {score.count === 1 ? "voto" : "votos"}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid max-h-[28rem] gap-1.5 overflow-auto pr-1 sm:grid-cols-2">
          {match.picks.map((pick) => (
            <div
              key={pick.name}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-pitch-line bg-pitch px-3 py-2"
            >
              <span className="truncate text-sm text-chalk">{pick.name}</span>
              <span className="font-mono text-sm font-bold text-lime">
                {pick.homeGoals} x {pick.awayGoals}
              </span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}

export default function UpcomingMatches({ matches }: { matches: UpcomingMatchInsight[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-5 py-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-xl uppercase tracking-widest text-chalk">Mapa de palpites</h2>
        <p className="font-mono text-xs text-slatey">{matches.length} jogos pendentes</p>
      </div>
      <div className="grid gap-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
