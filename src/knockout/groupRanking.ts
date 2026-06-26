/**
 * Group-stage ranking with the official FIFA 2026 tie-breakers, in order:
 *   1. points
 *   2. goal difference (all group matches)
 *   3. goals scored (all group matches)
 *   — if still level between two or more teams —
 *   4. points in matches among the tied teams (head-to-head)
 *   5. goal difference among the tied teams
 *   6. goals scored among the tied teams
 *   7. fair-play points  (no card data available → skipped)
 *   8. drawing of lots   (→ alphabetical, deterministic, as the app already does)
 *
 * Positions are only considered decided once a group is complete; callers use
 * `GroupTable.complete` to decide between resolved teams and placeholders.
 */
import type { EngineInput, GroupRow, GroupTable } from "./types";
import { teamRef } from "./teams";

interface ScoredMatch {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

interface Agg {
  canon: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const emptyAgg = (canon: string): Agg => ({
  canon,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

function aggregate(teams: string[], matches: ScoredMatch[]): Map<string, Agg> {
  const table = new Map(teams.map((t) => [t, emptyAgg(t)]));
  for (const m of matches) {
    const h = table.get(m.home);
    const a = table.get(m.away);
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.goalsFor += m.homeGoals;
    h.goalsAgainst += m.awayGoals;
    a.goalsFor += m.awayGoals;
    a.goalsAgainst += m.homeGoals;
    if (m.homeGoals > m.awayGoals) {
      h.won++;
      h.points += 3;
      a.lost++;
    } else if (m.homeGoals < m.awayGoals) {
      a.won++;
      a.points += 3;
      h.lost++;
    } else {
      h.drawn++;
      a.drawn++;
      h.points++;
      a.points++;
    }
  }
  return table;
}

const gd = (a: Agg) => a.goalsFor - a.goalsAgainst;

/** Overall comparison: points, then goal difference, then goals scored. */
function compareOverall(a: Agg, b: Agg): number {
  return b.points - a.points || gd(b) - gd(a) || b.goalsFor - a.goalsFor;
}

/**
 * Break a tie among `tied` (all equal on the overall criteria) using
 * head-to-head, then alphabetical name as the final deterministic fallback.
 */
function breakTie(tied: Agg[], matches: ScoredMatch[]): Agg[] {
  const ids = new Set(tied.map((t) => t.canon));
  const mini = aggregate(
    tied.map((t) => t.canon),
    matches.filter((m) => ids.has(m.home) && ids.has(m.away))
  );
  return [...tied].sort((a, b) => {
    const ma = mini.get(a.canon)!;
    const mb = mini.get(b.canon)!;
    return (
      compareOverall(ma, mb) ||
      teamRef(a.canon).name.localeCompare(teamRef(b.canon).name, "pt-BR")
    );
  });
}

function rankGroup(group: string, teams: string[], matches: ScoredMatch[], complete: boolean): GroupTable {
  const table = aggregate(teams, matches);
  const ordered = [...table.values()].sort(compareOverall);

  // Re-order runs of teams that are level on the overall criteria.
  const resolved: Agg[] = [];
  let i = 0;
  while (i < ordered.length) {
    let j = i + 1;
    while (j < ordered.length && compareOverall(ordered[i], ordered[j]) === 0) j++;
    resolved.push(...(j - i > 1 ? breakTie(ordered.slice(i, j), matches) : ordered.slice(i, j)));
    i = j;
  }

  const rows: GroupRow[] = resolved.map((a, idx) => ({
    ...teamRef(a.canon),
    group,
    rank: idx + 1,
    played: a.played,
    won: a.won,
    drawn: a.drawn,
    lost: a.lost,
    goalsFor: a.goalsFor,
    goalsAgainst: a.goalsAgainst,
    goalDifference: gd(a),
    points: a.points,
  }));

  return { group, rows, complete };
}

/** Build every group table from the engine input. */
export function computeGroupTables(input: EngineInput): GroupTable[] {
  const byGroup = new Map<string, { teams: Set<string>; ids: number[] }>();
  for (const fx of input.fixtures) {
    const entry = byGroup.get(fx.group) ?? { teams: new Set<string>(), ids: [] };
    const pair = input.fixtureCanon[String(fx.id)];
    if (pair) {
      entry.teams.add(pair[0]);
      entry.teams.add(pair[1]);
    }
    entry.ids.push(fx.id);
    byGroup.set(fx.group, entry);
  }

  const tables: GroupTable[] = [];
  for (const group of [...byGroup.keys()].sort()) {
    const { teams, ids } = byGroup.get(group)!;
    const matches: ScoredMatch[] = [];
    let finished = 0;
    for (const id of ids) {
      const pair = input.fixtureCanon[String(id)];
      const res = input.groupResults[String(id)];
      if (pair && res && res.status === "finished") {
        matches.push({ home: pair[0], away: pair[1], homeGoals: res.home, awayGoals: res.away });
        finished++;
      }
    }
    const complete = finished === ids.length;
    tables.push(rankGroup(group, [...teams], matches, complete));
  }
  return tables;
}
