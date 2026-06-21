import { describe, expect, it } from "vitest";
import { computeStandings } from "./standings";
import type { FixturesFile, PredictionsFile, ResultsFile } from "./types";

describe("computeStandings upcoming match insights", () => {
  it("adds next match picks, missing picks, and aggregate metrics", () => {
    const fixtures: FixturesFile = {
      tournament: "Teste",
      stage: "group",
      window: { start: "2026-06-11", end: "2026-06-27" },
      matches: [
        { id: 1, date: "2026-06-11", time: "16h", group: "A", home: "Brasil", away: "Haiti" },
        { id: 2, date: "2026-06-12", time: "13h", group: "A", home: "México", away: "Canadá" },
      ],
    };
    const predictions: PredictionsFile = {
      participants: [
        { name: "Ana", picks: { "1": [2, 1], "2": [2, 0] } },
        { name: "Bia", picks: { "1": [2, 0], "2": [1, 1] } },
        { name: "Caio", picks: { "1": [3, 1] } },
      ],
    };
    const results: ResultsFile = {
      lastUpdated: "2026-06-12T00:00:00.000Z",
      source: "manual",
      results: { "1": { home: 2, away: 1, status: "finished" } },
    };

    const standings = computeStandings(fixtures, predictions, results);

    expect(standings.countedMatches).toBe(1);
    expect(standings.standings.find((row) => row.name === "Bia")?.partialWinnerGoal).toBe(1);
    expect(standings.standings.find((row) => row.name === "Caio")?.partialLoserGoal).toBe(1);
    expect(standings.standings.find((row) => row.name === "Ana")?.exact).toBe(1);
    expect(standings.nextMatch?.id).toBe(2);
    expect(standings.nextMatch?.totalPicks).toBe(2);
    expect(standings.nextMatch?.missingPicks).toBe(1);
    expect(standings.nextMatch?.picks.map((pick) => pick.name)).toEqual(["Ana", "Bia"]);
    expect(standings.nextMatch?.mostCommonScores.map((score) => score.score)).toEqual(["1-1", "2-0"]);
    expect(standings.metrics.remainingMatches).toBe(1);
    expect(standings.metrics.averageUpcomingGoals).toBe(2);
    expect(standings.metrics.completionRate).toBe(50);
    expect(standings.metrics.completeCards).toBe(2);
    expect(standings.metrics.missingPickCards).toBe(1);
    expect(standings.metrics.topUpcomingScore?.value).toBe("1-1");
    expect(standings.metrics.storyMetrics.some((metric) => metric.label === "Briga pela liderança")).toBe(true);
  });
});
