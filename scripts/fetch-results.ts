/**
 * Fetches official results and writes data/results.json (index-keyed: 1..72).
 * Sources (RESULTS_SOURCE env):
 *   openfootball (default) — public-domain JSON, no key, ~daily updates
 *   fast                  — API-Football when configured + openfootball fallback
 *   api-football          — API-Football only (token required)
 *   football-data          — free tier (token required, scores delayed)
 *   manual                 — does nothing; results.json is edited by hand
 *
 * Resilient by design: if the source fails, the last valid results.json is
 * kept untouched so the site never breaks or loses standings.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { FixturesFile, ResultsFile, ResultEntry } from "../src/lib/types";

const DATA = join(process.cwd(), "data");
const read = <T>(f: string): T => JSON.parse(readFileSync(join(DATA, f), "utf8")) as T;
const readOptional = <T>(f: string, fallback: T): T => {
  const path = join(DATA, f);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as T : fallback;
};

const norm = (s: unknown) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const isGoal = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

type TeamMap = { enToCanon: Record<string, string>; fixtureCanon: Record<string, [string, string]> };
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const API_FOOTBALL_URL = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
const FINAL_STATUS = new Set(["FT", "AET", "PEN"]);

const stableResults = (results: Record<string, ResultEntry>) =>
  JSON.stringify(
    Object.keys(results)
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => [id, results[id]])
  );

function buildIndex(fixtures: FixturesFile, tm: TeamMap) {
  const byKey = new Map<string, { id: number; homeCanon: string }>();
  for (const m of fixtures.matches) {
    const [hc, ac] = tm.fixtureCanon[String(m.id)];
    byKey.set(`${m.group}|${[hc, ac].sort().join("~")}`, { id: m.id, homeCanon: hc });
  }
  return byKey;
}

function buildPairIndex(fixtures: FixturesFile, tm: TeamMap) {
  const byKey = new Map<string, Array<{ id: number; homeCanon: string }>>();
  for (const m of fixtures.matches) {
    const [hc, ac] = tm.fixtureCanon[String(m.id)];
    const key = [hc, ac].sort().join("~");
    const matches = byKey.get(key) ?? [];
    matches.push({ id: m.id, homeCanon: hc });
    byKey.set(key, matches);
  }
  return byKey;
}

async function fromOpenfootball(fixtures: FixturesFile, tm: TeamMap): Promise<Record<string, ResultEntry>> {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`openfootball HTTP ${res.status}`);
  const data = (await res.json()) as { matches: any[] };
  const idx = buildIndex(fixtures, tm);
  const canon = (n: string) => tm.enToCanon[norm(n)] ?? norm(n);
  const out: Record<string, ResultEntry> = {};
  for (const m of data.matches) {
    const g = String(m.group ?? "").replace(/group/i, "").trim().toUpperCase();
    if (!g) continue;
    const ft = m.score?.ft;
    if (!Array.isArray(ft) || !isGoal(ft[0]) || !isGoal(ft[1])) continue;
    const c1 = canon(m.team1), c2 = canon(m.team2);
    const hit = idx.get(`${g}|${[c1, c2].sort().join("~")}`);
    if (!hit) continue;
    const [hg, ag] = c1 === hit.homeCanon ? [ft[0], ft[1]] : [ft[1], ft[0]];
    out[String(hit.id)] = { home: hg, away: ag, status: "finished" };
  }
  return out;
}

async function fromApiFootball(fixtures: FixturesFile, tm: TeamMap): Promise<Record<string, ResultEntry>> {
  const token = process.env.API_FOOTBALL_KEY;
  if (!token) throw new Error("API_FOOTBALL_KEY not set");
  const res = await fetch(API_FOOTBALL_URL, {
    headers: { "x-apisports-key": token },
  });
  if (!res.ok) throw new Error(`api-football HTTP ${res.status}`);
  const data = (await res.json()) as { response: any[] };
  const idx = buildPairIndex(fixtures, tm);
  const canon = (n: string) => tm.enToCanon[norm(n)] ?? norm(n);
  const out: Record<string, ResultEntry> = {};
  for (const m of data.response ?? []) {
    const status = String(m.fixture?.status?.short ?? "").toUpperCase();
    if (!FINAL_STATUS.has(status)) continue;
    const c1 = canon(m.teams?.home?.name);
    const c2 = canon(m.teams?.away?.name);
    const hits = idx.get([c1, c2].sort().join("~"));
    if (!hits || hits.length !== 1) continue;
    const fh = m.score?.fulltime?.home ?? m.goals?.home;
    const fa = m.score?.fulltime?.away ?? m.goals?.away;
    if (!isGoal(fh) || !isGoal(fa)) continue;
    const hit = hits[0];
    const [hg, ag] = c1 === hit.homeCanon ? [fh, fa] : [fa, fh];
    out[String(hit.id)] = { home: hg, away: ag, status: "finished" };
  }
  return out;
}

async function fromFootballData(fixtures: FixturesFile, tm: TeamMap): Promise<Record<string, ResultEntry>> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN not set");
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) throw new Error(`football-data HTTP ${res.status}`);
  const data = (await res.json()) as { matches: any[] };
  const idx = buildIndex(fixtures, tm);
  const canon = (n: string) => tm.enToCanon[norm(n)] ?? norm(n);
  const out: Record<string, ResultEntry> = {};
  for (const m of data.matches) {
    if (m.status !== "FINISHED") continue;
    const g = String(m.group ?? "").replace(/group_?/i, "").trim().toUpperCase();
    if (!g) continue;
    const c1 = canon(m.homeTeam?.name), c2 = canon(m.awayTeam?.name);
    const hit = idx.get(`${g}|${[c1, c2].sort().join("~")}`);
    if (!hit) continue;
    const fh = m.score?.fullTime?.home, fa = m.score?.fullTime?.away;
    if (!isGoal(fh) || !isGoal(fa)) continue;
    const [hg, ag] = c1 === hit.homeCanon ? [fh, fa] : [fa, fh];
    out[String(hit.id)] = { home: hg, away: ag, status: "finished" };
  }
  return out;
}

export async function fetchResults(): Promise<void> {
  const source = process.env.RESULTS_SOURCE ?? "openfootball";
  const current = read<ResultsFile>("results.json");
  if (source === "manual") {
    console.log("manual mode: results.json left untouched");
    return;
  }
  const fixtures = read<FixturesFile>("fixtures.json");
  const tm = read<TeamMap>("team-map.json");
  try {
    const openfootball = source === "api-football"
      ? {}
      : await fromOpenfootball(fixtures, tm);
    let apiFootball: Record<string, ResultEntry> = {};
    if (source === "fast" || source === "api-football") {
      try {
        apiFootball = await fromApiFootball(fixtures, tm);
      } catch (err) {
        if (source === "api-football") throw err;
        console.warn(`api-football skipped (${(err as Error).message}); using openfootball fallback`);
      }
    }
    const fetched = source === "football-data"
      ? await fromFootballData(fixtures, tm)
      : { ...openfootball, ...apiFootball };
    const overrides = readOptional<Record<string, ResultEntry>>("result-overrides.json", {});
    const results = { ...fetched, ...overrides };
    const sourceLabel = source === "fast" && Object.keys(apiFootball).length > 0
      ? "api-football+openfootball"
      : source === "fast"
        ? "openfootball"
        : source;
    if (current.source === sourceLabel && stableResults(current.results) === stableResults(results)) {
      console.log(`fetched ${Object.keys(results).length} finished matches from ${sourceLabel}; no changes`);
      return;
    }
    const out: ResultsFile = { lastUpdated: new Date().toISOString(), source: sourceLabel, results };
    writeFileSync(join(DATA, "results.json"), JSON.stringify(out, null, 2));
    console.log(`fetched ${Object.keys(results).length} finished matches from ${sourceLabel}`);
  } catch (err) {
    console.warn(`fetch failed (${(err as Error).message}); keeping last valid results (${Object.keys(current.results).length} matches)`);
  }
}

if (process.argv[1]?.endsWith("fetch-results.ts")) fetchResults();
