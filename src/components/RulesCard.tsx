const tiers = [
  ["10", "Placar exato"],
  ["5", "Vencedor certo + um dos placares exato"],
  ["3", "Resultado certo (vitória ou empate)"],
  ["0", "Resultado errado"],
] as const;

export default function RulesCard() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-8 pt-2">
      <div className="mb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-lime">informações importantes</p>
        <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Pontuação</h2>
      </div>
      <div className="rounded-lg border border-pitch-line bg-pitch-2 p-5">
        <h3 className="mb-3 font-display text-base uppercase tracking-widest text-chalk">Pontuação</h3>
        <ul className="space-y-2">
          {tiers.map(([pts, label]) => (
            <li key={pts} className="flex items-center gap-3">
              <span className="w-8 text-center font-mono text-lg font-bold text-lime">{pts}</span>
              <span className="text-sm text-slatey">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
