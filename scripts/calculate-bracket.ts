/** Regenerates data/bracket.json from the archived group phase plus current knockout results. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { generateBracket } from "../src/knockout";
import type { Bracket, EngineInput, KnockoutResult } from "../src/knockout/types";
import type { FixturesFile, ResultsFile } from "../src/lib/types";

const DATA = join(process.cwd(), "data");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DATA, f), "utf8")) as T;

interface TeamMapFile {
  fixtureCanon: Record<string, [string, string]>;
}

/** Everything except generatedAt, so an unchanged bracket isn't rewritten. */
const material = (b: Bracket) => JSON.stringify({ ...b, generatedAt: "" });

export function calculateBracket(): void {
  const fixtures = read<FixturesFile>("history/group-fixtures.json");
  const teamMap = read<TeamMapFile>("team-map.json");
  const groupResults = read<ResultsFile>("history/group-results.json");
  const currentResults = read<ResultsFile>("results.json");

  const knockoutResults: Record<string, KnockoutResult> = {};
  for (const [key, value] of Object.entries(currentResults.results)) {
    knockoutResults[key] = value as KnockoutResult;
  }

  const normalizedGroupResults: EngineInput["groupResults"] = {};
  for (const [key, value] of Object.entries(groupResults.results)) {
    normalizedGroupResults[key] = value;
  }

  const bracket = generateBracket({
    fixtures: fixtures.matches.map((m) => ({ id: m.id, group: m.group })),
    fixtureCanon: teamMap.fixtureCanon,
    groupResults: normalizedGroupResults,
    knockoutResults,
    source: currentResults.source || groupResults.source,
  });

  if (!bracket.valid) {
    console.error("bracket inválido — geração interrompida:");
    for (const err of bracket.errors) console.error(`  - ${err}`);
    process.exitCode = 1;
    return;
  }

  const path = join(DATA, "bracket.json");
  const previous = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Bracket) : null;
  if (previous && material(previous) === material(bracket)) {
    console.log(`bracket unchanged: groups ${bracket.groupsComplete ? "complete" : "pending"}`);
    return;
  }

  writeFileSync(path, JSON.stringify(bracket, null, 2));
  const champion = bracket.phases.find((p) => p.key === "F")?.matches[0];
  const championName = champion?.winner ? champion[champion.winner].team?.name : null;
  console.log(
    `bracket: ${bracket.groupsComplete ? "fase de grupos completa" : "fase de grupos em andamento"}` +
      (championName ? ` — campeão ${championName}` : "")
  );
}

if (process.argv[1]?.endsWith("calculate-bracket.ts")) calculateBracket();
