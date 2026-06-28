import Link from "next/link";
import { getHistoricalStandings } from "@/lib/data";
import { withBasePath } from "@/lib/site-path";

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function SimpleClassificationPage() {
  const data = getHistoricalStandings();

  return (
    <main className="min-h-screen bg-[#f4dd84] px-2 py-3 text-[#061049] sm:px-4">
      <div className="mx-auto max-w-md overflow-hidden border-2 border-[#001a78] bg-[#fee7a3] shadow-[5px_5px_0_#fff200]">
        <div className="border-b-2 border-[#001a78] bg-[#b9c8e7] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-sm font-bold uppercase tracking-wide text-[#061049]">
                Histórico da fase de grupos
              </h1>
              <p className="mt-0.5 font-mono text-[10px] text-[#26336b]">
                Fase congelada · nova fase de 32 avos aberta · atualizado {formatStamp(data.lastUpdated)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <a
                href={withBasePath("/bolao_copa2026_final_envio.xlsx")}
                download
                className="border border-[#001a78] bg-[#fff6a8] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#001a78]"
              >
                baixar planilha
              </a>
              <Link
                href="/"
                className="border border-[#001a78] bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#001a78]"
              >
                site principal
              </Link>
            </div>
          </div>
        </div>

        <div className="border-b border-[#001a78] bg-[#fff6a8] px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#061049]">
            A classificação da fase nova fica no site principal e começa vazia enquanto os novos apostadores enviam os palpites.
          </p>
        </div>

        <table className="w-full border-collapse font-mono text-[11px] sm:text-xs">
          <thead>
            <tr className="bg-[#b9c8e7]">
              <th className="w-12 border-b-2 border-r-2 border-[#001a78] px-1.5 py-1 text-left font-bold">
                Pos.
              </th>
              <th className="border-b-2 border-r-2 border-[#001a78] px-1.5 py-1 text-left font-bold">
                Apostador
              </th>
              <th className="w-16 border-b-2 border-[#001a78] px-1.5 py-1 text-right font-bold">
                Pontos
              </th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map((entry) => {
              const podium =
                entry.rank === 1
                  ? "bg-[#c6d4f0]"
                  : entry.rank === 2
                    ? "bg-[#d4ddf1]"
                    : entry.rank === 3
                      ? "bg-[#dde5f5]"
                      : "bg-[#ffe9a8]";
              return (
                <tr key={entry.name} className={`${podium} font-bold text-[#0821a8]`}>
                  <td className="border-b border-r-2 border-[#001a78] px-1.5 py-1 text-left">
                    {entry.rank}º
                  </td>
                  <td className="border-b border-r-2 border-[#001a78] px-1.5 py-1">
                    {entry.name}
                  </td>
                  <td className="border-b border-[#001a78] px-1.5 py-1 text-right">
                    {entry.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
