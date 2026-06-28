import { withBasePath } from "@/lib/site-path";

const downloadHref = withBasePath("/bolao_copa2026_final_envio.xlsx");

export default function PhaseNotice() {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-4">
      <div className="overflow-hidden rounded-xl border border-info/30 bg-gradient-to-br from-info/15 via-pitch-2 to-pitch-2">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-info">
              chaveamento oficial FIFA · 32 avos de final
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-chalk sm:text-3xl">
              Confrontos oficiais da fase de 32 avos
            </h2>
            <p className="mt-2 text-sm leading-6 text-slatey">
              A planilha oficial já está disponível para download com os confrontos corrigidos da fase de 32 avos.
              Apenas os espaços de identificação e as colunas de gols seguem editáveis; as demais colunas permanecem
              bloqueadas. A fase de grupos ficou preservada como histórico.
            </p>
          </div>

          <a
            href={downloadHref}
            download
            className="inline-flex h-11 items-center justify-center rounded-md border border-lime/40 bg-lime px-4 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-pitch transition-colors hover:bg-chalk"
          >
            Baixar planilha
          </a>
        </div>
      </div>
    </section>
  );
}
