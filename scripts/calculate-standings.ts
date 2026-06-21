/** Recomputes data/standings.json from fixtures + predictions + results. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { computeStandings } from "../src/lib/standings";
import type { FixturesFile, PredictionsFile, ResultsFile, StandingsFile } from "../src/lib/types";

const DATA = join(process.cwd(), "data");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DATA, f), "utf8")) as T;

export function calculateStandings(): void {
  const fixtures = read<FixturesFile>("fixtures.json");
  const predictions = read<PredictionsFile>("predictions.json");
  const results = read<ResultsFile>("results.json");
  const prevPath = join(DATA, "standings.json");
  const previous = existsSync(prevPath) ? (JSON.parse(readFileSync(prevPath, "utf8")) as StandingsFile) : null;

  const standings = computeStandings(fixtures, predictions, results, previous);
  writeFileSync(prevPath, JSON.stringify(standings, null, 2));
  const leader = standings.standings[0];
  console.log(`standings: ${standings.totalParticipants} participants, ${standings.countedMatches} matches counted` +
    (leader ? ` — leader ${leader.name} (${leader.points} pts)` : ""));
}

if (process.argv[1]?.endsWith("calculate-standings.ts")) calculateStandings();
