/**
 * Fetches official results and writes data/results.json (fixture-id-keyed).
 * Regular-time scores are stored for scoring; knockout winners are stored too
 * when the source exposes them so the bracket can still advance.
 *
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
import { setTimeout as sleep } from "node:timers/promises";
import { join } from "node:path";
import type { FixturesFile, LiveResultEntry, LiveResultsFile, ResultsFile, ResultEntry } from "../src/lib/types";

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
type Side = "home" | "away";

type TeamMap = {
  ptToCanon?: Record<string, string>;
  enToCanon?: Record<string, string>;
  fixtureCanon?: Record<string, [string, string]>;
};
const OPENFOOTBALL_URLS = [
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json",
  "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json",
] as const;
const API_FOOTBALL_URL = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
const FINAL_STATUS = new Set(["FT", "AET", "PEN"]);
const LIVE_STATUS = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const API_FOOTBALL_WINDOW_START_MIN = 95;
const API_FOOTBALL_WINDOW_END_MIN = 135;
const API_FOOTBALL_LIVE_WINDOW_START_MIN = 45;
const API_FOOTBALL_LIVE_WINDOW_END_MIN = 135;

const FETCH_RETRIES = 2;

function describeFetchError(err: unknown) {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    const causeMessage = cause instanceof Error ? `; cause: ${cause.message}` : "";
    return `${err.message}${causeMessage}`;
  }
  return String(err);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_RETRIES + 1; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt <= FETCH_RETRIES) {
        await sleep(250 * attempt);
      }
    }
  }
  throw new Error(`${url} failed after ${FETCH_RETRIES + 1} attempt(s): ${describeFetchError(lastError)}`);
}

async function fetchFirstJson<T>(sourceName: string, urls: readonly string[]): Promise<T> {
  const failures: string[] = [];
  for (const url of urls) {
    try {
      return await fetchJson<T>(url);
    } catch (err) {
      failures.push(describeFetchError(err));
    }
  }
  throw new Error(`${sourceName} unavailable: ${failures.join(" | ")}`);
}

const stableResults = (results: Record<string, ResultEntry>) =>
  JSON.stringify(
    Object.keys(results)
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => [id, results[id]])
  );
const stableLiveResults = (results: Record<string, LiveResultEntry>) =>
  JSON.stringify(
    Object.keys(results)
      .sort((a, b) => Number(a) - Number(b))
      .map((id) => [id, results[id]])
  );

function buildIndex(fixtures: FixturesFile, tm: TeamMap) {
  const byKey = new Map<string, { id: number; homeCanon: string }>();
  for (const m of fixtures.matches) {
    const [hc, ac] = tm.fixtureCanon?.[String(m.id)] ?? [canonName(tm, m.home), canonName(tm, m.away)];
    byKey.set(`${m.group}|${[hc, ac].sort().join("~")}`, { id: m.id, homeCanon: hc });
  }
  return byKey;
}

function buildPairIndex(fixtures: FixturesFile, tm: TeamMap) {
  const byKey = new Map<string, Array<{ id: number; homeCanon: string }>>();
  for (const m of fixtures.matches) {
    const [hc, ac] = tm.fixtureCanon?.[String(m.id)] ?? [canonName(tm, m.home), canonName(tm, m.away)];
    const key = [hc, ac].sort().join("~");
    const matches = byKey.get(key) ?? [];
    matches.push({ id: m.id, homeCanon: hc });
    byKey.set(key, matches);
  }
  return byKey;
}

const canonName = (tm: TeamMap, name: string) =>
  tm.enToCanon?.[norm(name)] ?? tm.ptToCanon?.[norm(name)] ?? norm(name);

const winnerFromTuple = (score: unknown): boolean | null => {
  if (!Array.isArray(score) || !isGoal(score[0]) || !isGoal(score[1])) return null;
  if (score[0] > score[1]) return true;
  if (score[1] > score[0]) return false;
  return null;
};

const orientWinner = (team1Wins: boolean | null, homeIsTeam1: boolean): Side | undefined => {
  if (team1Wins == null) return undefined;
  return team1Wins === homeIsTeam1 ? "home" : "away";
};

const footballDataScore = (match: any): [number, number] | null => {
  const regular = match.score?.regularTime;
  const regularHome = regular?.homeTeam ?? regular?.home;
  const regularAway = regular?.awayTeam ?? regular?.away;
  if (isGoal(regularHome) && isGoal(regularAway)) return [regularHome, regularAway];

  const duration = String(match.score?.duration ?? "").toUpperCase();
  const fullTime = match.score?.fullTime ?? match.score?.fulltime;
  const fullHome = fullTime?.homeTeam ?? fullTime?.home;
  const fullAway = fullTime?.awayTeam ?? fullTime?.away;
  if (duration === "REGULAR" && isGoal(fullHome) && isGoal(fullAway)) return [fullHome, fullAway];

  return null;
};

function kickoffAtSaoPaulo(date: string, time: string) {
  const hour = Number(String(time).replace(/\D/g, ""));
  if (!Number.isFinite(hour)) return null;
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00-03:00`);
}

function hasMatchInWindow(
  fixtures: FixturesFile,
  current: ResultsFile,
  startMin: number,
  endMin: number,
  label: string
) {
  const mode = process.env.API_FOOTBALL_MODE ?? "smart";
  if (mode === "never") return false;
  if (mode === "always") return true;
  if (mode !== "smart") throw new Error(`invalid API_FOOTBALL_MODE: ${mode}`);

  const now = process.env.API_FOOTBALL_NOW
    ? new Date(process.env.API_FOOTBALL_NOW)
    : new Date();
  const activeWindows = fixtures.matches.filter((match) => {
    if (current.results[String(match.id)]) return false;
    const kickoff = kickoffAtSaoPaulo(match.date, match.time);
    if (!kickoff) return false;
    const minutesAfterKickoff = (now.getTime() - kickoff.getTime()) / 60000;
    return minutesAfterKickoff >= startMin
      && minutesAfterKickoff <= endMin;
  });

  if (activeWindows.length === 0) {
    console.log(`api-football skipped (outside ${label} smart quota window)`);
    return false;
  }
  console.log(`api-football ${label} smart window active for ${activeWindows.length} match(es)`);
  return true;
}

function shouldUseApiFootball(fixtures: FixturesFile, current: ResultsFile) {
  return hasMatchInWindow(
    fixtures,
    current,
    API_FOOTBALL_WINDOW_START_MIN,
    API_FOOTBALL_WINDOW_END_MIN,
    "final"
  );
}

function shouldUseApiFootballLive(fixtures: FixturesFile, current: ResultsFile) {
  return hasMatchInWindow(
    fixtures,
    current,
    API_FOOTBALL_LIVE_WINDOW_START_MIN,
    API_FOOTBALL_LIVE_WINDOW_END_MIN,
    "live"
  );
}

async function fromOpenfootball(fixtures: FixturesFile, tm: TeamMap): Promise<Record<string, ResultEntry>> {
  const data = await fetchFirstJson<{ matches: any[] }>("openfootball", OPENFOOTBALL_URLS);
  const idx = buildIndex(fixtures, tm);
  const canon = (n: string) => canonName(tm, n);
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
    const homeIsTeam1 = c1 === hit.homeCanon;
    const winner = orientWinner(
      winnerFromTuple(m.score?.p ?? m.score?.pen) ?? winnerFromTuple(m.score?.et) ?? winnerFromTuple(m.score?.ft),
      homeIsTeam1
    );
    out[String(hit.id)] = winner ? { home: hg, away: ag, status: "finished", winner } : { home: hg, away: ag, status: "finished" };
  }
  return out;
}

async function fetchApiFootballFixtures(): Promise<any[]> {
  const token = process.env.API_FOOTBALL_KEY;
  if (!token) throw new Error("API_FOOTBALL_KEY not set");
  const data = await fetchJson<{ response?: any[]; errors?: unknown }>(API_FOOTBALL_URL, {
    headers: { "x-apisports-key": token },
  } as RequestInit);
  if (data.errors && JSON.stringify(data.errors) !== "[]") {
    throw new Error(`api-football errors: ${JSON.stringify(data.errors)}`);
  }
  return data.response ?? [];
}

function finalResultsFromApiFootball(
  fixtures: FixturesFile,
  tm: TeamMap,
  response: any[]
): Record<string, ResultEntry> {
  const idx = buildPairIndex(fixtures, tm);
  const canon = (n: string) => canonName(tm, n);
  const out: Record<string, ResultEntry> = {};
  for (const m of response) {
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
    const winner = m.teams?.home?.winner === true
      ? "home"
      : m.teams?.away?.winner === true
        ? "away"
        : undefined;
    out[String(hit.id)] = winner ? { home: hg, away: ag, status: "finished", winner } : { home: hg, away: ag, status: "finished" };
  }
  return out;
}

function liveResultsFromApiFootball(
  fixtures: FixturesFile,
  tm: TeamMap,
  response: any[],
  official: ResultsFile
): Record<string, LiveResultEntry> {
  const idx = buildPairIndex(fixtures, tm);
  const canon = (n: string) => canonName(tm, n);
  const out: Record<string, LiveResultEntry> = {};
  for (const m of response) {
    const status = String(m.fixture?.status?.short ?? "").toUpperCase();
    if (!LIVE_STATUS.has(status)) continue;
    const c1 = canon(m.teams?.home?.name);
    const c2 = canon(m.teams?.away?.name);
    const hits = idx.get([c1, c2].sort().join("~"));
    if (!hits || hits.length !== 1) continue;
    const gh = m.goals?.home;
    const ga = m.goals?.away;
    if (!isGoal(gh) || !isGoal(ga)) continue;
    const hit = hits[0];
    if (official.results[String(hit.id)]) continue;
    const [home, away] = c1 === hit.homeCanon ? [gh, ga] : [ga, gh];
    out[String(hit.id)] = {
      home,
      away,
      status,
      elapsed: typeof m.fixture?.status?.elapsed === "number" ? m.fixture.status.elapsed : null,
    };
  }
  return out;
}

function writeLiveResults(source: string, results: Record<string, LiveResultEntry>) {
  const current = readOptional<LiveResultsFile>("live-results.json", {
    lastUpdated: "",
    source,
    results: {},
  });
  if (current.source === source && stableLiveResults(current.results) === stableLiveResults(results)) {
    console.log(`live results unchanged: ${Object.keys(results).length} match(es)`);
    return;
  }
  const out: LiveResultsFile = { lastUpdated: new Date().toISOString(), source, results };
  writeFileSync(join(DATA, "live-results.json"), JSON.stringify(out, null, 2));
  console.log(`live results: ${Object.keys(results).length} match(es)`);
}

async function fromFootballData(fixtures: FixturesFile, tm: TeamMap): Promise<Record<string, ResultEntry>> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN not set");
  const data = await fetchJson<{ matches: any[] }>("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
  } as RequestInit);
  const idx = buildIndex(fixtures, tm);
  const canon = (n: string) => canonName(tm, n);
  const out: Record<string, ResultEntry> = {};
  for (const m of data.matches) {
    if (m.status !== "FINISHED") continue;
    const g = String(m.group ?? "").replace(/group_?/i, "").trim().toUpperCase();
    if (!g) continue;
    const c1 = canon(m.homeTeam?.name), c2 = canon(m.awayTeam?.name);
    const hit = idx.get(`${g}|${[c1, c2].sort().join("~")}`);
    if (!hit) continue;
    const regular = footballDataScore(m);
    if (!regular) continue;
    const [hg, ag] = c1 === hit.homeCanon ? regular : [regular[1], regular[0]];
    const winner = m.score?.winner === "HOME_TEAM"
      ? (c1 === hit.homeCanon ? "home" : "away")
      : m.score?.winner === "AWAY_TEAM"
        ? (c1 === hit.homeCanon ? "away" : "home")
        : undefined;
    out[String(hit.id)] = winner ? { home: hg, away: ag, status: "finished", winner } : { home: hg, away: ag, status: "finished" };
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
    let apiFootballResponse: any[] | null = null;
    const useFinalApi = (source === "fast" && shouldUseApiFootball(fixtures, current)) || source === "api-football";
    const useLiveApi = source === "fast" && shouldUseApiFootballLive(fixtures, current);
    if (useFinalApi || useLiveApi) {
      try {
        apiFootballResponse = await fetchApiFootballFixtures();
        apiFootball = finalResultsFromApiFootball(fixtures, tm, apiFootballResponse);
        writeLiveResults(
          "api-football",
          useLiveApi ? liveResultsFromApiFootball(fixtures, tm, apiFootballResponse, current) : {}
        );
      } catch (err) {
        if (source === "api-football") throw err;
        console.warn(`api-football skipped (${describeFetchError(err)}); using openfootball fallback`);
        writeLiveResults("api-football", {});
      }
    } else if (source === "fast") {
      writeLiveResults("api-football", {});
    }
    const allowedIds = new Set(fixtures.matches.map((match) => String(match.id)));
    const fetched = source === "football-data"
      ? await fromFootballData(fixtures, tm)
      : { ...openfootball, ...apiFootball };
    const overrides = readOptional<Record<string, ResultEntry>>("result-overrides.json", {});
    const results = Object.fromEntries(
      Object.entries({ ...fetched, ...overrides }).filter(([id]) => allowedIds.has(id))
    ) as Record<string, ResultEntry>;
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
    console.warn(`fetch failed (${describeFetchError(err)}); keeping last valid results (${Object.keys(current.results).length} matches)`);
  }
}

if (process.argv[1]?.endsWith("fetch-results.ts")) fetchResults();
