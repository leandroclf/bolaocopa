export default function PaymentBlock() {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-4">
      <div className="overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/20 via-pitch-2 to-pitch-2">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-gold">pagamento da inscrição</p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-chalk sm:text-3xl">
              Chave PIX para confirmação do palpite
            </h2>
            <p className="mt-2 text-sm leading-6 text-slatey">
              A taxa de inscrição é de <strong className="text-chalk">R$ 50</strong> por apostador. O valor deve ser
              enviado para a chave PIX destacada ao lado.
            </p>
            <p className="mt-3 rounded-md border border-lime/20 bg-lime/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-lime">
              Os resultados contam apenas o placar normal da partida, nos 90 minutos, sem prorrogação ou pênaltis.
            </p>
          </div>

          <div className="rounded-xl border border-pitch-line bg-pitch-3/80 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slatey">chave pix</p>
            <p className="mt-1 font-display text-3xl leading-none text-chalk sm:text-4xl">71994793104</p>
            <p className="mt-2 text-sm text-slatey">Leandro Freire</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                sem taxa administrativa
              </span>
              <span className="rounded-full border border-pitch-line bg-pitch-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slatey">
                90 minutos
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
