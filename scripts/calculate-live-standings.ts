/** Builds the "if it ended now" standings from in-progress scores. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeStandings } from "../src/lib/standings";
import type {
  FixturesFile,
  LiveMatch,
  LiveResultsFile,
  LiveStandingEntry,
  LiveStandingsFile,
  PredictionsFile,
  ResultsFile,
  StandingsFile,
} from "../src/lib/types";

const DATA = join(process.cwd(), "data");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DATA, f), "utf8")) as T;
const write = (f: string, value: unknown) => writeFileSync(join(DATA, f), JSON.stringify(value, null, 2));
const stableLiveStandings = (s: LiveStandingsFile) => JSON.stringify({
  active: s.active,
  source: s.source,
  matches: s.matches,
  standings: s.standings,
});

export function calculateLiveStandings(): void {
  const fixtures = read<FixturesFile>("fixtures.json");
  const predictions = read<PredictionsFile>("predictions.json");
  const officialResults = read<ResultsFile>("results.json");
  const officialStandings = read<StandingsFile>("standings.json");
  const liveResults = read<LiveResultsFile>("live-results.json");
  const prevPath = join(DATA, "live-standings.json");
  const previous = existsSync(prevPath) ? (JSON.parse(readFileSync(prevPath, "utf8")) as LiveStandingsFile) : null;
  const matchById = new Map(fixtures.matches.map((match) => [String(match.id), match]));

  const liveIds = Object.keys(liveResults.results);
  if (liveIds.length === 0) {
    const empty: LiveStandingsFile = {
      active: false,
      lastUpdated: liveResults.lastUpdated,
      source: liveResults.source,
      matches: [],
      standings: [],
    };
    if (!previous || stableLiveStandings(previous) !== stableLiveStandings(empty)) write("live-standings.json", empty);
    console.log("live standings inactive");
    return;
  }

  const simulatedResults: ResultsFile = {
    lastUpdated: liveResults.lastUpdated,
    source: `${officialResults.source}+live`,
    results: {
      ...officialResults.results,
      ...Object.fromEntries(
        liveIds.map((id) => {
          const live = liveResults.results[id];
          return [id, { home: live.home, away: live.away, status: "finished" as const }];
        })
      ),
    },
  };

  const simulated = computeStandings(fixtures, predictions, simulatedResults, officialStandings);
  const officialByName = new Map(officialStandings.standings.map((entry) => [entry.name, entry]));
  const standings: LiveStandingEntry[] = simulated.standings.map((entry) => {
    const official = officialByName.get(entry.name);
    return {
      ...entry,
      officialRank: official?.rank ?? entry.rank,
      officialPoints: official?.points ?? 0,
      projectedGain: entry.points - (official?.points ?? 0),
    };
  });

  const matches: LiveMatch[] = liveIds
    .map((id) => {
      const match = matchById.get(id);
      const live = liveResults.results[id];
      if (!match) return null;
      return {
        ...match,
        homeGoals: live.home,
        awayGoals: live.away,
        status: live.status,
        elapsed: live.elapsed,
      };
    })
    .filter((match): match is LiveMatch => match !== null);

  const out: LiveStandingsFile = {
    active: true,
    lastUpdated: liveResults.lastUpdated,
    source: liveResults.source,
    matches,
    standings,
  };
  if (previous && stableLiveStandings(previous) === stableLiveStandings(out)) {
    console.log(`live standings unchanged: ${matches.length} match(es)`);
    return;
  }
  write("live-standings.json", out);
  console.log(`live standings: ${matches.length} match(es)`);
}

if (process.argv[1]?.endsWith("calculate-live-standings.ts")) calculateLiveStandings();
