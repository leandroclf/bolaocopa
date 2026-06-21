import type { StandingEntry } from "@/lib/types";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function Scoreboard({
  lastUpdated, totalParticipants, countedMatches, leader,
}: {
  lastUpdated: string; totalParticipants: number; countedMatches: number; leader: StandingEntry | null;
}) {
  return (
    <header className="border-b border-pitch-line">
      <div className="mx-auto max-w-3xl px-5 pt-10 pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime">6ª edição · fase de grupos</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-wide text-chalk sm:text-6xl">
          BOLÃO<br />COPA 2026
        </h1>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-slatey">
          <span><span className="text-chalk">{countedMatches}</span>/72 jogos apurados</span>
          <span><span className="text-chalk">{totalParticipants}</span> apostadores</span>
          <span>atualizado <span className="text-chalk">{formatStamp(lastUpdated)}</span></span>
        </div>

        {countedMatches === 0 || !leader ? (
          <div className="mt-7 rounded-lg border border-dashed border-pitch-line bg-pitch-2 px-5 py-6">
            <p className="font-display text-xl tracking-wide text-gold">AGUARDANDO RESULTADOS</p>
            <p className="mt-1 text-sm text-slatey">
              Os palpites estão registrados. A classificação aparece assim que o primeiro jogo for apurado.
            </p>
          </div>
        ) : (
          <div className="mt-7 overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-r from-gold/15 to-transparent">
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="font-display text-4xl leading-none text-gold">1º</div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold/80">líder</p>
                <p className="truncate font-display text-2xl tracking-wide text-chalk">{leader.name}</p>
                <p className="mt-0.5 font-mono text-xs text-slatey">
                  {leader.exact} exatos · {leader.partial} parciais
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-4xl font-bold leading-none text-gold">{leader.points}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-slatey">pontos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
