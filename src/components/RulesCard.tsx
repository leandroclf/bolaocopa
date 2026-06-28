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
        <h2 className="mt-1 font-display text-xl uppercase tracking-widest text-chalk">Pontuação e premiação</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="rounded-lg border border-pitch-line bg-pitch-2 p-5">
          <h3 className="mb-3 font-display text-base uppercase tracking-widest text-chalk">Premiação</h3>
          <p className="font-mono text-xs text-slatey">Bolada total</p>
          <p className="font-mono text-2xl font-bold text-lime">Soma das inscrições</p>
          <p className="mt-2 text-sm leading-6 text-slatey">
            A premiação será formada pela soma do valor captado de todos os apostadores. O valor final ainda não está
            fechado.
          </p>
          <p className="mt-3 rounded-md border border-lime/20 bg-lime/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-lime">
            1º lugar recebe 100% da bolada · em caso de empate na 1ª colocação, divisão igualitária
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">
            Taxa de inscrição R$ 50 · PIX 71994793104 (Leandro Freire) · sem taxa administrativa
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slatey">
            Para pontuação, vale o placar final da partida após o tempo normal e a prorrogação; pênaltis servem
            apenas para definir o classificado.
          </p>
        </div>
      </div>
    </section>
  );
}
