/**
 * Domain types for the knockout engine. No competition rules live here —
 * only the shapes that flow Data → Engine → bracket.json → UI.
 */

export type KnockoutPhaseKey = "R32" | "R16" | "QF" | "SF" | "TP" | "F";

export type Side = "home" | "away";

export type MatchStatus = "pending" | "scheduled" | "finished";

/** A team identity resolved to display name + flag. */
export interface TeamRef {
  canon: string;
  name: string;
  flag: string;
}

/** Where a template slot's participant comes from. Pure references, no teams. */
export type SlotRef =
  | { kind: "winner"; group: string } // 1º of a group
  | { kind: "runnerUp"; group: string } // 2º of a group
  | { kind: "third"; groups: string[] } // one of the best thirds, from this set of groups
  | { kind: "matchWinner"; match: number } // winner of an earlier match
  | { kind: "matchLoser"; match: number }; // loser of an earlier match

export interface PhaseMeta {
  key: KnockoutPhaseKey;
  label: string;
  shortLabel: string;
}

/** One match as defined by the competition template (structure only). */
export interface TemplateMatch {
  matchNumber: number;
  phase: KnockoutPhaseKey;
  order: number;
  home: SlotRef;
  away: SlotRef;
  date: string | null;
  time: string | null;
  stadium: string | null;
  city: string | null;
}

export interface BracketTemplate {
  competition: string;
  phases: PhaseMeta[];
  matches: TemplateMatch[];
}

/** A row in a group standings table. */
export interface GroupRow extends TeamRef {
  group: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupTable {
  group: string;
  rows: GroupRow[];
  complete: boolean; // all matches in the group finished
}

/** A third-placed team ranked across all groups. */
export interface ThirdPlaceEntry extends GroupRow {
  overallRank: number;
  qualified: boolean;
}

/** Result of a knockout match, read from results.json (keys 73..104). */
export interface KnockoutResult {
  home: number;
  away: number;
  status: string;
  winner?: Side; // explicit winner when decided on penalties (equal score)
}

/** A participant slot in the generated bracket. */
export interface BracketParticipant {
  /** Display label: a team name when resolved, otherwise an official placeholder. */
  label: string;
  /** Human-readable origin, e.g. "Vencedor Grupo A" or "Vencedor Jogo 73". */
  source: string;
  team: TeamRef | null;
}

/** A fully resolved (or placeholder) bracket match consumed by the UI. */
export interface BracketMatch {
  id: string;
  matchNumber: number;
  phase: KnockoutPhaseKey;
  phaseLabel: string;
  order: number;
  home: BracketParticipant;
  away: BracketParticipant;
  homeGoals: number | null;
  awayGoals: number | null;
  winner: Side | null;
  status: MatchStatus;
  date: string | null;
  time: string | null;
  stadium: string | null;
  city: string | null;
  nextMatch: number | null; // where the winner goes
  winnerTo: Side | null; // which side of the next match the winner takes
  loserTo: number | null; // where the loser goes (third-place match)
}

export interface BracketPhase {
  key: KnockoutPhaseKey;
  label: string;
  shortLabel: string;
  matches: BracketMatch[];
}

export interface Bracket {
  generatedAt: string;
  competition: string;
  source: string;
  groupsComplete: boolean; // all 12 group tables finished
  complete: boolean; // the final has a winner
  phases: BracketPhase[];
  qualifiedThirds: Array<{ group: string; team: TeamRef }>;
  valid: boolean;
  errors: string[];
}

/** Inputs the engine needs, decoupled from file I/O. */
export interface FixtureMatch {
  id: number;
  group: string;
}

export interface EngineInput {
  /** group-stage fixtures (id → group); teams come from fixtureCanon. */
  fixtures: FixtureMatch[];
  /** id → [homeCanon, awayCanon] for group matches. */
  fixtureCanon: Record<string, [string, string]>;
  /** matchId → {home, away, status} for finished group matches (1..72). */
  groupResults: Record<string, { home: number; away: number; status: string }>;
  /** matchNumber → knockout result (73..104). */
  knockoutResults: Record<string, KnockoutResult>;
  source: string;
}
