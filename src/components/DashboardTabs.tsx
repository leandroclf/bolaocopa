"use client";

import { useMemo, useState } from "react";
import InsightsPanel from "@/components/InsightsPanel";
import NextMatchPanel from "@/components/NextMatchPanel";
import UpcomingMatches from "@/components/UpcomingMatches";
import StandingsTable from "@/components/StandingsTable";
import RecentMatches from "@/components/RecentMatches";
import RulesCard from "@/components/RulesCard";
import type { StandingsFile } from "@/lib/types";

type TabKey = "classification" | "insights" | "next" | "map" | "recent";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "classification", label: "Classificação" },
  { key: "insights", label: "Leitura do bolão" },
  { key: "next", label: "Próxima apuração" },
  { key: "map", label: "Mapa de palpites" },
  { key: "recent", label: "Jogos apurados" },
];

export default function DashboardTabs({ standings }: { standings: StandingsFile }) {
  const [active, setActive] = useState<TabKey>("classification");
  const activeLabel = useMemo(() => tabs.find((tab) => tab.key === active)?.label, [active]);

  return (
    <div>
      <nav className="sticky top-0 z-20 border-y border-pitch-line bg-pitch/95 backdrop-blur" aria-label="Seções do bolão">
        <div className="mx-auto max-w-5xl px-3 py-2">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-pitch-line bg-pitch-2 p-1 sm:grid-cols-5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-pressed={active === tab.key}
                className={`h-11 rounded-md px-1.5 text-center font-mono text-[10px] uppercase leading-tight tracking-wider transition-colors sm:px-3 sm:text-[11px] ${
                  active === tab.key ? "bg-lime text-pitch" : "text-slatey hover:bg-pitch hover:text-chalk"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div role="region" aria-label={activeLabel}>
        {active === "classification" && (
          <>
            <StandingsTable standings={standings.standings} />
            <RulesCard />
          </>
        )}
        {active === "insights" && <InsightsPanel metrics={standings.metrics} />}
        {active === "next" && <NextMatchPanel match={standings.nextMatch} />}
        {active === "map" && <UpcomingMatches matches={standings.upcomingMatches} />}
        {active === "recent" && <RecentMatches results={standings.recentResults} />}
      </div>
    </div>
  );
}
