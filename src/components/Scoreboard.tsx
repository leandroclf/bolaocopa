import Link from "next/link";
import type { StandingEntry } from "@/lib/types";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function Scoreboard({
  lastUpdated, totalParticipants, countedMatches, totalMatches, leader,
}: {
  lastUpdated: string; totalParticipants: number; countedMatches: number; totalMatches: number; leader: StandingEntry | null;
}) {
  return (
    <header className="border-b border-pitch-line">
      <div className="mx-auto max-w-5xl px-5 pb-4 pt-6 sm:pb-6 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime sm:text-xs">
              6ª edição · 32 avos de final
            </p>
            <h1 className="mt-1 font-display text-4xl leading-[0.9] tracking-wide text-chalk sm:text-6xl">
              BOLÃO<br />COPA 2026
            </h1>
            <Link
              href="/classificacao/"
              className="mt-3 inline-flex h-9 items-center rounded-md border border-lime/40 bg-lime/10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-lime"
            >
              Ver histórico
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-slatey sm:min-w-[24rem] sm:text-xs">
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-2.5 py-2">
              <span className="block text-chalk">{countedMatches}/{totalMatches}</span>
              <span>jogos da fase</span>
            </div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-2.5 py-2">
              <span className="block text-chalk">{totalParticipants}</span>
              <span>apostadores</span>
            </div>
            <div className="rounded-lg border border-pitch-line bg-pitch-2 px-2.5 py-2">
              <span className="block text-chalk">{formatStamp(lastUpdated)}</span>
              <span>atualizado</span>
            </div>
          </div>
        </div>

        {countedMatches === 0 || !leader ? (
          <div className="mt-4 rounded-lg border border-dashed border-pitch-line bg-pitch-2 px-4 py-4">
            <p className="font-display text-xl tracking-wide text-gold">CAPTURA DE PALPITES ABERTA</p>
            <p className="mt-1 text-sm text-slatey">
              A fase de 32 avos está aberta. A classificação aparece aqui quando os novos palpites forem enviados.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-r from-gold/15 to-transparent">
            <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
              <div className="font-display text-3xl leading-none text-gold sm:text-4xl">1º</div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">líder</p>
                <p className="truncate font-display text-xl tracking-wide text-chalk sm:text-2xl">{leader.name}</p>
                <p className="mt-0.5 font-mono text-xs text-slatey">
                  {leader.exact} exatos · {leader.partial} parciais
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-3xl font-bold leading-none text-gold sm:text-4xl">{leader.points}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-slatey">pontos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
