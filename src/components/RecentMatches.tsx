import type { MatchPick, RecentResult } from "@/lib/types";
import { formatMatchLabel } from "@/lib/match-label";
import { teamFlag } from "@/lib/team-flags";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${d}T12:00:00`));

function MatchPickList({ picks }: { picks: MatchPick[] }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {picks.map((pick) => (
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
  );
}

function ResultCard({ match }: { match: RecentResult }) {
  return (
    <details className="rounded-lg border border-pitch-line bg-pitch-2 p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
              {formatMatchLabel(match.group, match.phaseLabel)} · {fmtDay(match.date)}
            </p>
            <h3 className="mt-1 font-display text-xl uppercase tracking-wide text-chalk">
              {teamFlag(match.home)} {match.home} {match.homeGoals}–{match.awayGoals} {teamFlag(match.away)} {match.away}
            </h3>
          </div>
          <span className="rounded bg-pitch px-2 py-1 font-mono text-xs text-slatey">
            {match.totalPicks} palpites
          </span>
        </div>
      </summary>
      <div className="mt-4 max-h-[28rem] overflow-auto border-t border-pitch-line pt-4 pr-1">
        <MatchPickList picks={match.picks} />
      </div>
    </details>
  );
}

export default function RecentMatches({ results }: { results: RecentResult[] }) {
  if (results.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-5">
        <div className="rounded-lg border border-dashed border-pitch-line bg-pitch-2 px-4 py-6 text-center text-sm text-slatey">
          Ainda sem resultados publicados na fase de 32 avos.
        </div>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-5xl px-5 py-5">
      <h2 className="mb-4 font-display text-xl uppercase tracking-widest text-chalk">Resultados da fase de 32 avos</h2>
      <div className="grid gap-2">
        {results.map((match) => (
          <ResultCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
