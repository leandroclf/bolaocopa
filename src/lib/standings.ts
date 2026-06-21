import { scoreMatch } from "./scoring";
import type {
  FixturesFile,
  MatchMetric,
  MatchPick,
  PickOutcome,
  PopularScore,
  PredictionsFile,
  ResultsFile,
  StandingsFile,
  StandingEntry,
  RecentResult,
  UpcomingMatchInsight,
} from "./types";

const pct = (count: number, total: number) => total === 0 ? 0 : Math.round((count / total) * 1000) / 10;
const avg = (sum: number, total: number) => total === 0 ? 0 : Math.round((sum / total) * 10) / 10;
const outcomeOf = (home: number, away: number): PickOutcome => home > away ? "home" : home < away ? "away" : "draw";
const scoreKey = (home: number, away: number) => `${home}-${away}`;
const bySchedule = <T extends { date: string; id: number }>(a: T, b: T) =>
  a.date.localeCompare(b.date) || a.id - b.id;

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

  const upcomingMatches = computeUpcomingMatches(fixtures, predictions, results);

  return {
    lastUpdated: results.lastUpdated,
    source: results.source,
    totalParticipants: predictions.participants.length,
    countedMatches: finishedIds.length,
    standings,
    recentResults,
    nextMatch: upcomingMatches[0] ?? null,
    upcomingMatches,
    metrics: computeMetrics(fixtures.matches.length, finishedIds.length, predictions, upcomingMatches),
  };
}

function computeUpcomingMatches(
  fixtures: FixturesFile,
  predictions: PredictionsFile,
  results: ResultsFile
): UpcomingMatchInsight[] {
  const participantCount = predictions.participants.length;
  return fixtures.matches
    .filter((match) => !results.results[String(match.id)])
    .sort(bySchedule)
    .map((match) => {
      const picks: MatchPick[] = predictions.participants
        .map((participant) => {
          const pick = participant.picks[String(match.id)];
          if (!pick) return null;
          const [homeGoals, awayGoals] = pick;
          return {
            name: participant.name,
            homeGoals,
            awayGoals,
            outcome: outcomeOf(homeGoals, awayGoals),
          };
        })
        .filter((pick): pick is MatchPick => pick !== null)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      const outcomeBreakdown = picks.reduce(
        (acc, pick) => {
          if (pick.outcome === "home") acc.homeWin += 1;
          else if (pick.outcome === "away") acc.awayWin += 1;
          else acc.draw += 1;
          return acc;
        },
        { homeWin: 0, draw: 0, awayWin: 0 }
      );

      const topOutcome = [
        { outcome: "home" as const, label: `${match.home} vence`, count: outcomeBreakdown.homeWin },
        { outcome: "draw" as const, label: "Empate", count: outcomeBreakdown.draw },
        { outcome: "away" as const, label: `${match.away} vence`, count: outcomeBreakdown.awayWin },
      ].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))[0];

      const scoreGroups = new Map<string, { homeGoals: number; awayGoals: number; names: string[] }>();
      let homeGoalSum = 0;
      let awayGoalSum = 0;
      for (const pick of picks) {
        homeGoalSum += pick.homeGoals;
        awayGoalSum += pick.awayGoals;
        const key = scoreKey(pick.homeGoals, pick.awayGoals);
        const existing = scoreGroups.get(key) ?? { homeGoals: pick.homeGoals, awayGoals: pick.awayGoals, names: [] };
        existing.names.push(pick.name);
        scoreGroups.set(key, existing);
      }

      const mostCommonScores: PopularScore[] = Array.from(scoreGroups.values())
        .map((group) => ({
          homeGoals: group.homeGoals,
          awayGoals: group.awayGoals,
          score: scoreKey(group.homeGoals, group.awayGoals),
          count: group.names.length,
          percentage: pct(group.names.length, picks.length),
          names: group.names.sort((a, b) => a.localeCompare(b, "pt-BR")),
        }))
        .sort((a, b) => b.count - a.count || a.homeGoals - b.homeGoals || a.awayGoals - b.awayGoals)
        .slice(0, 3);

      return {
        ...match,
        totalPicks: picks.length,
        missingPicks: participantCount - picks.length,
        picks,
        outcomeBreakdown,
        topOutcome: {
          ...topOutcome,
          percentage: pct(topOutcome.count, picks.length),
        },
        averageHomeGoals: avg(homeGoalSum, picks.length),
        averageAwayGoals: avg(awayGoalSum, picks.length),
        averageTotalGoals: avg(homeGoalSum + awayGoalSum, picks.length),
        mostCommonScores,
      };
    });
}

function metricFromMatch(match: UpcomingMatchInsight, label: string, value: string): MatchMetric {
  return {
    id: match.id,
    date: match.date,
    time: match.time,
    group: match.group,
    home: match.home,
    away: match.away,
    label,
    value,
  };
}

function computeMetrics(
  totalMatches: number,
  finishedMatches: number,
  predictions: PredictionsFile,
  upcomingMatches: UpcomingMatchInsight[]
) {
  const totalValidPicks = predictions.participants.reduce(
    (sum, participant) => sum + Object.keys(participant.picks).length,
    0
  );
  const totalUpcomingPicks = upcomingMatches.reduce((sum, match) => sum + match.totalPicks, 0);
  const totalUpcomingGoals = upcomingMatches.reduce(
    (sum, match) => sum + match.averageTotalGoals * match.totalPicks,
    0
  );

  const withPicks = upcomingMatches.filter((match) => match.totalPicks > 0);
  const highestConsensus = withPicks
    .slice()
    .sort((a, b) => b.topOutcome.percentage - a.topOutcome.percentage || bySchedule(a, b))[0];
  const mostDivisive = withPicks
    .slice()
    .sort((a, b) => a.topOutcome.percentage - b.topOutcome.percentage || bySchedule(a, b))[0];
  const highestExpectedGoals = withPicks
    .slice()
    .sort((a, b) => b.averageTotalGoals - a.averageTotalGoals || bySchedule(a, b))[0];

  return {
    totalMatches,
    finishedMatches,
    remainingMatches: totalMatches - finishedMatches,
    totalValidPicks,
    averageUpcomingGoals: avg(totalUpcomingGoals, totalUpcomingPicks),
    highestConsensus: highestConsensus
      ? metricFromMatch(highestConsensus, "Maior consenso", `${highestConsensus.topOutcome.label} · ${highestConsensus.topOutcome.percentage}%`)
      : null,
    mostDivisive: mostDivisive
      ? metricFromMatch(mostDivisive, "Jogo mais dividido", `${mostDivisive.topOutcome.label} · ${mostDivisive.topOutcome.percentage}%`)
      : null,
    highestExpectedGoals: highestExpectedGoals
      ? metricFromMatch(highestExpectedGoals, "Mais gols previstos", `${highestExpectedGoals.averageTotalGoals} gols em média`)
      : null,
  };
}
