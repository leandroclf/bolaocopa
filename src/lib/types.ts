export type Score = { home: number; away: number };

export type Match = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // raw label from the pool sheet, e.g. "16h"
  group: string; // "A".."L"
  home: string;
  away: string;
};

export type FixturesFile = {
  tournament: string;
  stage: string;
  window: { start: string; end: string };
  matches: Match[];
};

export type Participant = {
  name: string;
  // matchId -> [homeGoals, awayGoals]; absent id = no valid prediction (scores 0)
  picks: Record<string, [number, number]>;
};

export type PredictionsFile = { participants: Participant[] };

export type ResultEntry = { home: number; away: number; status: "finished" };
export type ResultsFile = {
  lastUpdated: string;
  source: string;
  results: Record<string, ResultEntry>; // matchId -> result (only finished matches present)
};

export type StandingEntry = {
  rank: number;
  previousRank: number | null;
  delta: number | null; // previousRank - rank (positive = moved up)
  name: string;
  points: number;
  exact: number; // # of 10-point hits
  partial: number; // # of 5- or 3-point hits
  played: number; // # of finished matches this participant had a valid pick for
};

export type RecentResult = {
  id: number;
  date: string;
  group: string;
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
};

export type PickOutcome = "home" | "draw" | "away";

export type MatchPick = {
  name: string;
  homeGoals: number;
  awayGoals: number;
  outcome: PickOutcome;
};

export type PopularScore = {
  homeGoals: number;
  awayGoals: number;
  score: string;
  count: number;
  percentage: number;
  names: string[];
};

export type OutcomeBreakdown = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type OutcomeLeader = {
  outcome: PickOutcome;
  label: string;
  count: number;
  percentage: number;
};

export type UpcomingMatchInsight = Match & {
  totalPicks: number;
  missingPicks: number;
  picks: MatchPick[];
  outcomeBreakdown: OutcomeBreakdown;
  topOutcome: OutcomeLeader;
  averageHomeGoals: number;
  averageAwayGoals: number;
  averageTotalGoals: number;
  mostCommonScores: PopularScore[];
};

export type MatchMetric = {
  id: number;
  date: string;
  time: string;
  group: string;
  home: string;
  away: string;
  label: string;
  value: string;
};

export type StandingsMetrics = {
  totalMatches: number;
  finishedMatches: number;
  remainingMatches: number;
  totalValidPicks: number;
  averageUpcomingGoals: number;
  highestConsensus: MatchMetric | null;
  mostDivisive: MatchMetric | null;
  highestExpectedGoals: MatchMetric | null;
};

export type StandingsFile = {
  lastUpdated: string;
  source: string;
  totalParticipants: number;
  countedMatches: number; // # of finished matches scored
  standings: StandingEntry[];
  recentResults: RecentResult[];
  nextMatch: UpcomingMatchInsight | null;
  upcomingMatches: UpcomingMatchInsight[];
  metrics: StandingsMetrics;
};
