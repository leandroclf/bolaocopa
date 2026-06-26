import type { LiveStandingsFile } from "@/lib/types";

function formatStatus(status: string, elapsed: number | null) {
  if (elapsed == null) return status;
  return `${status} · ${elapsed}'`;
}

export default function LiveProjectionPanel({ live }: { live: LiveStandingsFile }) {
  if (!live.active || live.matches.length === 0) return null;
  const leaders = live.standings.slice(0, 8);
  const movers = live.standings
    .filter((entry) => entry.delta !== null && entry.delta !== 0)
    .slice()
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
    .slice(0, 3);

  return (
    <section className="mx-auto max-w-5xl px-5 pb-4 pt-3">
      <div className="border-y border-info/40 bg-info/10 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-info">simulação ao vivo</p>
            <h2 className="mt-1 font-display text-lg uppercase tracking-widest text-chalk">
              Classificação se acabasse agora
            </h2>
          </div>
          <span className="rounded bg-pitch px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slatey">
            não oficial
          </span>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-2">
            {live.matches.map((match) => (
              <div key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border border-pitch-line bg-pitch-2 px-3 py-2">
                <span className="truncate text-right text-sm font-semibold text-chalk">{match.home}</span>
                <span className="font-mono text-sm font-bold text-info">{match.homeGoals} x {match.awayGoals}</span>
                <span className="truncate text-sm font-semibold text-chalk">{match.away}</span>
                <span className="col-span-3 text-center font-mono text-[10px] uppercase tracking-wider text-slatey">
                  {formatStatus(match.status, match.elapsed)}
                </span>
              </div>
            ))}
            {movers.length > 0 && (
              <div className="grid gap-1 border border-pitch-line bg-pitch-2 px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">maiores movimentos</p>
                {movers.map((entry) => (
                  <p key={entry.name} className="truncate text-xs text-chalk">
                    {entry.name}: {entry.officialRank}º {"->"} {entry.rank}º
                  </p>
                ))}
              </div>
            )}
          </div>

          <ol className="grid gap-1">
            {leaders.map((entry) => (
              <li
                key={entry.name}
                className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 border border-pitch-line bg-pitch-2 px-3 py-2"
              >
                <span className="font-mono text-xs text-info">{entry.rank}º</span>
                <span className="truncate text-sm font-semibold text-chalk">{entry.name}</span>
                <span className="font-mono text-xs text-lime">+{entry.projectedGain}</span>
                <span className="font-mono text-sm font-bold text-chalk">{entry.points}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
