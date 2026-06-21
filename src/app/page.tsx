import Scoreboard from "@/components/Scoreboard";
import StandingsTable from "@/components/StandingsTable";
import RecentMatches from "@/components/RecentMatches";
import RulesCard from "@/components/RulesCard";
import InsightsPanel from "@/components/InsightsPanel";
import NextMatchPanel from "@/components/NextMatchPanel";
import UpcomingMatches from "@/components/UpcomingMatches";
import { getStandings } from "@/lib/data";

export default function Page() {
  const s = getStandings();
  const leader = s.standings[0] ?? null;
  return (
    <main className="min-h-screen pb-16">
      <Scoreboard
        lastUpdated={s.lastUpdated}
        totalParticipants={s.totalParticipants}
        countedMatches={s.countedMatches}
        leader={leader}
      />
      <InsightsPanel metrics={s.metrics} />
      <NextMatchPanel match={s.nextMatch} />
      <UpcomingMatches matches={s.upcomingMatches} />
      <StandingsTable standings={s.standings} />
      <RecentMatches results={s.recentResults} />
      <RulesCard />
      <footer className="mx-auto max-w-3xl px-5 pt-4">
        <p className="font-mono text-[11px] text-slatey/70">
          Resultados via openfootball (domínio público). Desempate alfabético. Atualização automática a cada apuração.
        </p>
      </footer>
    </main>
  );
}
