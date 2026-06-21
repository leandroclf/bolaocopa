"use client";

import { useMemo, useState } from "react";
import InsightsPanel from "@/components/InsightsPanel";
import NextMatchPanel from "@/components/NextMatchPanel";
import UpcomingMatches from "@/components/UpcomingMatches";
import StandingsTable from "@/components/StandingsTable";
import RecentMatches from "@/components/RecentMatches";
import RulesCard from "@/components/RulesCard";
import LiveScorePanel from "@/components/LiveScorePanel";
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
  const [selectedParticipant, setSelectedParticipant] = useState<string>("todos");
  const [compactMode, setCompactMode] = useState(true);
  const activeLabel = useMemo(() => tabs.find((tab) => tab.key === active)?.label, [active]);
  const nextDayMatches = useMemo(
    () => standings.nextMatch
      ? standings.upcomingMatches.filter((match) => match.date === standings.nextMatch?.date)
      : [],
    [standings.nextMatch, standings.upcomingMatches]
  );
  const participantOptions = useMemo(() => {
    return ["todos", ...standings.standings.map((entry) => entry.name)];
  }, [standings.standings]);
  const selectedStanding = useMemo(
    () => standings.standings.find((entry) => entry.name === selectedParticipant) ?? null,
    [standings.standings, selectedParticipant]
  );
  const selectedSummary = useMemo(() => {
    if (!selectedStanding) return null;
    const leader = standings.standings[0] ?? null;
    return {
      rank: selectedStanding.rank,
      points: selectedStanding.points,
      exact: selectedStanding.exact,
      partial: selectedStanding.partial,
      delta: selectedStanding.delta,
      gapToLeader: leader ? leader.points - selectedStanding.points : null,
      averageGap: selectedStanding.points - standings.metrics.averagePoints,
    };
  }, [selectedStanding, standings.metrics.averagePoints, standings.standings]);

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
      <LiveScorePanel />

      <div className="mx-auto max-w-5xl px-5 pt-4">
        <div className="grid gap-2 rounded-lg border border-pitch-line bg-pitch-2 p-3 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">
              apostador em foco
            </span>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full rounded-lg border border-pitch-line bg-pitch px-3 py-2 text-sm text-chalk focus:border-lime"
            >
              {participantOptions.map((name) => (
                <option key={name} value={name}>
                  {name === "todos" ? "Todos os apostadores" : name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">foco</p>
              <p className="truncate text-sm font-semibold text-chalk">{selectedStanding?.name ?? "Grupo inteiro"}</p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">posição</p>
              <p className="font-mono text-sm font-bold text-gold">{selectedSummary?.rank ?? "-"}</p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">pontos</p>
              <p className="font-mono text-sm font-bold text-lime">{selectedSummary?.points ?? standings.metrics.averagePoints}</p>
            </div>
            <div className="rounded-md border border-pitch-line bg-pitch px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slatey">vs média</p>
              <p className="font-mono text-sm font-bold text-chalk">
                {selectedSummary ? `${selectedSummary.averageGap > 0 ? "+" : ""}${selectedSummary.averageGap}` : "—"}
              </p>
            </div>
          </div>
          {selectedStanding && (
            <p className="text-sm text-slatey lg:col-span-2">
              {selectedStanding.name} está em <span className="text-chalk">{selectedStanding.rank}º</span> com{" "}
              <span className="text-chalk">{selectedStanding.points} pontos</span>, {selectedStanding.exact} exatos e{" "}
              {selectedStanding.partial} parciais.{" "}
              {selectedSummary?.gapToLeader != null
                ? `Está a ${selectedSummary.gapToLeader} ponto${selectedSummary.gapToLeader === 1 ? "" : "s"} do líder.`
                : "Ainda não há líder definido."}
            </p>
          )}
          <div className="flex items-center gap-2 lg:col-span-2">
            <button
              type="button"
              onClick={() => setCompactMode((value) => !value)}
              className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
                compactMode ? "bg-lime text-pitch" : "bg-pitch text-slatey"
              }`}
            >
              {compactMode ? "modo compacto ligado" : "modo compacto desligado"}
            </button>
            <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">
              visão ultra compacta para celular
            </p>
          </div>
        </div>
      </div>

      <div role="region" aria-label={activeLabel}>
        {active === "classification" && (
          <>
            <StandingsTable
              standings={standings.standings}
              metrics={standings.metrics}
              selectedParticipant={selectedParticipant}
              onSelectParticipant={setSelectedParticipant}
              compactMode={compactMode}
            />
            <RulesCard />
          </>
        )}
        {active === "insights" && (
          <InsightsPanel
            metrics={standings.metrics}
            selectedParticipant={selectedParticipant}
            selectedStanding={selectedStanding}
            recentResults={standings.recentResults}
            upcomingMatches={standings.upcomingMatches}
            compactMode={compactMode}
          />
        )}
        {active === "next" && (
          <NextMatchPanel
            match={standings.nextMatch}
            dayMatches={nextDayMatches}
            selectedParticipant={selectedParticipant}
            participantOptions={participantOptions}
            onParticipantChange={setSelectedParticipant}
            compactMode={compactMode}
          />
        )}
        {active === "map" && (
          <UpcomingMatches matches={standings.upcomingMatches} selectedParticipant={selectedParticipant} compactMode={compactMode} />
        )}
        {active === "recent" && (
          <RecentMatches results={standings.recentResults} selectedParticipant={selectedParticipant} compactMode={compactMode} />
        )}
      </div>

      <div className="sticky bottom-0 z-20 mx-auto mt-4 max-w-5xl border-t border-pitch-line bg-pitch/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 rounded-lg border border-pitch-line bg-pitch-2 p-1">
          {tabs.map((tab) => (
            <button
              key={`mobile-${tab.key}`}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-pressed={active === tab.key}
              className={`rounded-md px-1 py-2 font-mono text-[9px] uppercase tracking-wider ${
                active === tab.key ? "bg-lime text-pitch" : "text-slatey"
              }`}
            >
              {tab.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
