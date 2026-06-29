import Link from "next/link";
import { getStandings } from "@/lib/data";

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
  const data = getStandings();

  return (
    <main className="min-h-screen bg-[#f4dd84] px-2 py-3 text-[#061049] sm:px-4">
      <div className="mx-auto max-w-md overflow-hidden border-2 border-[#001a78] bg-[#fee7a3] shadow-[5px_5px_0_#fff200]">
        <div className="border-b-2 border-[#001a78] bg-[#b9c8e7] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-sm font-bold uppercase tracking-wide text-[#061049]">
                Classificação simples
              </h1>
              <p className="mt-0.5 font-mono text-[10px] text-[#26336b]">
                Classificação atual da fase de 32 avos · atualizado {formatStamp(data.lastUpdated)}
              </p>
            </div>
            <Link
              href="/"
              className="shrink-0 border border-[#001a78] bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase text-[#001a78]"
            >
              site principal
            </Link>
          </div>
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
