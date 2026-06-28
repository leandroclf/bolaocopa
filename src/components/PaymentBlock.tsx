export default function PaymentBlock({ totalParticipants, entryFee }: { totalParticipants: number; entryFee: number }) {
  const finalPrize = totalParticipants * entryFee;
  const formattedPrize = finalPrize.toFixed(2).replace(".00", ",00");

  return (
    <section className="mx-auto max-w-5xl px-5 pt-4">
      <div className="overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/20 via-pitch-2 to-pitch-2">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">premiação definida</p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-chalk sm:text-3xl">
              Bolada final: R$ {formattedPrize}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slatey">
              Todos os palpites e pagamentos já foram recebidos. A página agora fica focada na classificação,
              nos resultados apurados e na disputa pela liderança.
            </p>
          </div>

          <div className="rounded-xl border border-pitch-line bg-pitch-3/80 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slatey">regras da premiação</p>
            <p className="mt-1 font-display text-2xl leading-tight text-chalk">1º lugar leva 100%</p>
            <p className="mt-2 text-sm leading-6 text-slatey">
              Em caso de empate na primeira colocação, o prêmio será dividido igualmente entre os líderes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                {totalParticipants} participantes
              </span>
              <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                R$ {formattedPrize} em disputa
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
