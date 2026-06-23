import Scoreboard from "@/components/Scoreboard";
import DashboardTabs from "@/components/DashboardTabs";
import { getLiveStandings, getStandings } from "@/lib/data";

export default function Page() {
  const s = getStandings();
  const live = getLiveStandings();
  const leader = s.standings[0] ?? null;
  return (
    <main className="min-h-screen pb-16">
      <Scoreboard
        lastUpdated={s.lastUpdated}
        totalParticipants={s.totalParticipants}
        countedMatches={s.countedMatches}
        leader={leader}
      />
      <DashboardTabs standings={s} liveStandings={live} />
      <footer className="mx-auto max-w-3xl px-5 pt-4">
        <p className="font-mono text-[11px] text-slatey/70">
          Resultados via openfootball (domínio público). Desempate alfabético. Atualiza automaticamente quando a planilha oficial é reprocessada e publicada.
        </p>
      </footer>
    </main>
  );
}
