import { scoreMatch } from "./scoring";
import type {
  FixturesFile, PredictionsFile, ResultsFile, StandingsFile, StandingEntry, RecentResult,
} from "./types";

/**
 * Pure standings computation. No I/O — the scripts read/write JSON around it.
 * Tiebreak: alphabetical by display name (the organiser's stated "Desempate
 * Alfabético"). To switch to registration order instead, change `tiebreak`.
 */
export function computeStandings(
  fixtures: FixturesFile,
  predictions: PredictionsFile,
  results: ResultsFile,
  previous?: StandingsFile | null
): StandingsFile {
  const finishedIds = Object.keys(results.results);
  const matchById = new Map(fixtures.matches.map((m) => [m.id, m]));
  const prevRankByName = new Map((previous?.standings ?? []).map((e) => [e.name, e.rank]));

  const rows = predictions.participants.map((p) => {
    let points = 0, exact = 0, partial = 0, played = 0;
    for (const idStr of finishedIds) {
      const r = results.results[idStr];
      const pick = p.picks[idStr];
      const pts = scoreMatch(pick ? { home: pick[0], away: pick[1] } : null, { home: r.home, away: r.away });
      if (pick) played += 1;
      points += pts;
      if (pts === 10) exact += 1;
      else if (pts === 5 || pts === 3) partial += 1;
    }
    return { name: p.name, points, exact, partial, played };
  });

  const tiebreak = (a: typeof rows[number], b: typeof rows[number]) =>
    a.name.localeCompare(b.name, "pt-BR");
  rows.sort((a, b) => b.points - a.points || tiebreak(a, b));

  const standings: StandingEntry[] = rows.map((row, i) => {
    const rank = i + 1;
    const previousRank = prevRankByName.has(row.name) ? prevRankByName.get(row.name)! : null;
    return { rank, previousRank, delta: previousRank == null ? null : previousRank - rank, ...row };
  });

  const recentResults: RecentResult[] = finishedIds
    .map((idStr) => {
      const m = matchById.get(Number(idStr))!;
      const r = results.results[idStr];
      return { id: m.id, date: m.date, group: m.group, home: m.home, away: m.away, homeGoals: r.home, awayGoals: r.away };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

  return {
    lastUpdated: new Date().toISOString(),
    source: results.source,
    totalParticipants: predictions.participants.length,
    countedMatches: finishedIds.length,
    standings,
    recentResults,
  };
}
