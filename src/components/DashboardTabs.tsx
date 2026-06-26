"use client";

import { useMemo, useState } from "react";
import NextMatchPanel from "@/components/NextMatchPanel";
import UpcomingMatches from "@/components/UpcomingMatches";
import StandingsTable from "@/components/StandingsTable";
import RecentMatches from "@/components/RecentMatches";
import RulesCard from "@/components/RulesCard";
import LiveProjectionPanel from "@/components/LiveProjectionPanel";
import BracketView from "@/components/BracketView";
import type { LiveStandingsFile, StandingsFile } from "@/lib/types";
import type { Bracket } from "@/knockout/types";

type TabKey = "classification" | "next" | "bracket" | "map" | "recent";

const tabs: Array<{ key: TabKey; label: string; short: string }> = [
  { key: "classification", label: "Classificação", short: "Tabela" },
  { key: "next", label: "Próximos jogos", short: "Próximos" },
  { key: "bracket", label: "Chaveamento", short: "Chave" },
  { key: "map", label: "Mapa de palpites", short: "Palpites" },
  { key: "recent", label: "Resultados", short: "Resultados" },
];

export default function DashboardTabs({
  standings,
  liveStandings,
  bracket,
}: {
  standings: StandingsFile;
  liveStandings: LiveStandingsFile;
  bracket: Bracket | null;
}) {
  const [active, setActive] = useState<TabKey>("classification");
  const activeLabel = useMemo(() => tabs.find((tab) => tab.key === active)?.label, [active]);
  const nextDayMatches = useMemo(
    () => standings.nextMatch
      ? standings.upcomingMatches.filter((match) => match.date === standings.nextMatch?.date)
      : [],
    [standings.nextMatch, standings.upcomingMatches]
  );

  return (
    <div>
      <nav className="sticky top-0 z-20 border-y border-pitch-line bg-pitch" aria-label="Seções do bolão">
        <div className="mx-auto max-w-5xl px-3 py-2">
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-pitch-line bg-pitch-2 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-pressed={active === tab.key}
                className={`h-11 rounded-md px-1 text-center font-mono text-[10px] uppercase leading-tight tracking-wider sm:px-3 sm:text-[11px] ${
                  active === tab.key ? "bg-lime text-pitch" : "text-slatey hover:text-chalk"
                }`}
              >
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      <LiveProjectionPanel live={liveStandings} />

      <div role="region" aria-label={activeLabel}>
        {active === "classification" && (
          <>
            <StandingsTable standings={standings.standings} metrics={standings.metrics} />
            <RulesCard />
          </>
        )}
        {active === "next" && (
          <NextMatchPanel match={standings.nextMatch} dayMatches={nextDayMatches} />
        )}
        {active === "bracket" && <BracketView bracket={bracket} />}
        {active === "map" && <UpcomingMatches matches={standings.upcomingMatches} />}
        {active === "recent" && <RecentMatches results={standings.recentResults} />}
      </div>
    </div>
  );
}
