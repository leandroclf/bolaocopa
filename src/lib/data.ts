import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FixturesFile, StandingsFile } from "./types";

const dataDir = join(process.cwd(), "data");
const read = <T>(file: string): T => JSON.parse(readFileSync(join(dataDir, file), "utf8")) as T;

export const getStandings = () => read<StandingsFile>("standings.json");
export const getFixtures = () => read<FixturesFile>("fixtures.json");
