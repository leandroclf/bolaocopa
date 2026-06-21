import type { RecentResult } from "@/lib/types";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${d}T12:00:00`));

export default function RecentMatches({ results }: { results: RecentResult[] }) {
  if (results.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl px-5 py-8">
      <h2 className="mb-4 font-display text-lg uppercase tracking-widest text-chalk">Jogos apurados</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {results.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-pitch-line bg-pitch-2 px-3 py-2.5">
            <span className="rounded bg-pitch px-1.5 py-0.5 font-mono text-[10px] text-lime">G{m.group}</span>
            <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span className="truncate text-right text-sm text-chalk">{m.home}</span>
              <span className="font-mono text-sm font-bold text-chalk">{m.homeGoals}–{m.awayGoals}</span>
              <span className="truncate text-sm text-chalk">{m.away}</span>
            </div>
            <span className="font-mono text-[10px] text-slatey">{fmtDay(m.date)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
