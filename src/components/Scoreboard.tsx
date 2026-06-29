import Link from "next/link";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function Scoreboard({
  lastUpdated, totalParticipants, countedMatches, totalMatches,
}: {
  lastUpdated: string; totalParticipants: number; countedMatches: number; totalMatches: number;
}) {
  return (
    <header className="border-b border-pitch-line">
      <div className="mx-auto max-w-5xl px-5 pb-4 pt-6 sm:pb-6 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lime sm:text-xs">
              6ª edição · fase de 32 avos consolidada
            </p>
            <h1 className="mt-1 font-display text-4xl leading-[0.9] tracking-wide text-chalk sm:text-6xl">
              BOLÃO<br />COPA 2026
            </h1>
            <Link
              href="/classificacao/"
              className="mt-3 inline-flex h-9 items-center rounded-md border border-lime/40 bg-lime/10 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-lime"
            >
              Classificação simples
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
      </div>
    </header>
  );
}
