import Scoreboard from "@/components/Scoreboard";
import PaymentBlock from "@/components/PaymentBlock";
import DashboardTabs from "@/components/DashboardTabs";
import PhaseNotice from "@/components/PhaseNotice";
import { getBracket, getLiveStandings, getStandings } from "@/lib/data";

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opts }).format(new Date(iso));

export default function Page() {
  const s = getStandings();
  const live = getLiveStandings();
  const bracket = getBracket();
  const leader = s.standings[0] ?? null;
  return (
    <main className="min-h-screen pb-10">
      <Scoreboard
        lastUpdated={s.lastUpdated}
        totalParticipants={s.totalParticipants}
        countedMatches={s.countedMatches}
        totalMatches={s.metrics.totalMatches}
        leader={leader}
      />
      <PaymentBlock totalParticipants={s.totalParticipants} entryFee={50} />
      <PhaseNotice />
      <DashboardTabs standings={s} liveStandings={live} bracket={bracket} />
      <footer className="mx-auto max-w-5xl px-5 pt-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slatey">Última atualização</p>
        <p className="mt-1 font-mono text-sm text-chalk">{fmt(s.lastUpdated, { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
        <p className="font-mono text-sm text-chalk">{fmt(s.lastUpdated, { hour: "2-digit", minute: "2-digit" })}</p>
      </footer>
    </main>
  );
}
