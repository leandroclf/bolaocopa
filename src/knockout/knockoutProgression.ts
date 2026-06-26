/**
 * Resolves every knockout match: fills participants from group results and the
 * third-place allocation, reads scores from the knockout results, and advances
 * winners (and semi-final losers) automatically through the bracket.
 */
import type {
  BracketMatch,
  BracketParticipant,
  GroupTable,
  KnockoutResult,
  Side,
  SlotRef,
  TeamRef,
  TemplateMatch,
  BracketTemplate,
} from "./types";
import { slotLabel, slotSource } from "./placeholders";
import type { ThirdAllocation } from "./thirdPlaceRanking";

interface ResolveContext {
  groups: Map<string, GroupTable>;
  allocation: ThirdAllocation | null;
  resolved: Map<number, BracketMatch>;
}

const unresolved = (ref: SlotRef): BracketParticipant => ({
  label: slotLabel(ref),
  source: slotSource(ref),
  team: null,
});

const resolvedParticipant = (team: TeamRef, source: string): BracketParticipant => ({
  label: team.name,
  source,
  team,
});

function teamFromGroup(table: GroupTable | undefined, rank: number): TeamRef | null {
  if (!table || !table.complete) return null;
  const row = table.rows.find((r) => r.rank === rank);
  return row ? { canon: row.canon, name: row.name, flag: row.flag } : null;
}

function winnerLoserTeam(match: BracketMatch | undefined, which: "winner" | "loser"): TeamRef | null {
  if (!match || !match.winner) return null;
  const winnerSide = match.winner;
  const side: Side = which === "winner" ? winnerSide : winnerSide === "home" ? "away" : "home";
  return match[side].team;
}

function resolveSlot(ref: SlotRef, currentMatch: number, ctx: ResolveContext): BracketParticipant {
  switch (ref.kind) {
    case "winner": {
      const team = teamFromGroup(ctx.groups.get(ref.group), 1);
      return team ? resolvedParticipant(team, slotSource(ref)) : unresolved(ref);
    }
    case "runnerUp": {
      const team = teamFromGroup(ctx.groups.get(ref.group), 2);
      return team ? resolvedParticipant(team, slotSource(ref)) : unresolved(ref);
    }
    case "third": {
      const group = ctx.allocation?.bySlot[currentMatch];
      const team = group ? teamFromGroup(ctx.groups.get(group), 3) : null;
      return team ? resolvedParticipant(team, `3º Grupo ${group}`) : unresolved(ref);
    }
    case "matchWinner": {
      const team = winnerLoserTeam(ctx.resolved.get(ref.match), "winner");
      return team ? resolvedParticipant(team, slotSource(ref)) : unresolved(ref);
    }
    case "matchLoser": {
      const team = winnerLoserTeam(ctx.resolved.get(ref.match), "loser");
      return team ? resolvedParticipant(team, slotSource(ref)) : unresolved(ref);
    }
  }
}

function decideWinner(homeGoals: number, awayGoals: number, result: KnockoutResult): Side | null {
  // An explicit winner from the source is authoritative (it carries penalty
  // outcomes); validators flag it when it contradicts the score. Otherwise the
  // winner is derived from the goals, and a draw stays undecided.
  if (result.winner) return result.winner;
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return null;
}

/** Forward links derived from the template: where each match's winner/loser go. */
interface ForwardLink {
  nextMatch: number | null;
  winnerTo: Side | null;
  loserTo: number | null;
}

function buildForwardLinks(template: BracketTemplate): Map<number, ForwardLink> {
  const links = new Map<number, ForwardLink>(
    template.matches.map((m) => [m.matchNumber, { nextMatch: null, winnerTo: null, loserTo: null }])
  );
  for (const m of template.matches) {
    for (const side of ["home", "away"] as const) {
      const ref = m[side];
      if (ref.kind === "matchWinner") {
        const link = links.get(ref.match)!;
        link.nextMatch = m.matchNumber;
        link.winnerTo = side;
      } else if (ref.kind === "matchLoser") {
        links.get(ref.match)!.loserTo = m.matchNumber;
      }
    }
  }
  return links;
}

export function buildBracketMatches(
  template: BracketTemplate,
  groupTables: GroupTable[],
  allocation: ThirdAllocation | null,
  knockoutResults: Record<string, KnockoutResult>
): BracketMatch[] {
  const phaseLabel = new Map(template.phases.map((p) => [p.key, p.label]));
  const links = buildForwardLinks(template);
  const ctx: ResolveContext = {
    groups: new Map(groupTables.map((t) => [t.group, t])),
    allocation,
    resolved: new Map<number, BracketMatch>(),
  };

  // Template is authored in match-number order, so earlier rounds resolve first.
  const ordered = [...template.matches].sort((a, b) => a.matchNumber - b.matchNumber);

  for (const tm of ordered) {
    const home = resolveSlot(tm.home, tm.matchNumber, ctx);
    const away = resolveSlot(tm.away, tm.matchNumber, ctx);
    const result = knockoutResults[String(tm.matchNumber)];
    const finished = Boolean(result && result.status === "finished");

    let homeGoals: number | null = null;
    let awayGoals: number | null = null;
    let winner: Side | null = null;
    if (finished && result) {
      homeGoals = result.home;
      awayGoals = result.away;
      winner = decideWinner(result.home, result.away, result);
    }

    const bothKnown = Boolean(home.team && away.team);
    const status = finished ? "finished" : bothKnown ? "scheduled" : "pending";
    const link = links.get(tm.matchNumber)!;

    const match: BracketMatch = {
      id: `M${tm.matchNumber}`,
      matchNumber: tm.matchNumber,
      phase: tm.phase,
      phaseLabel: phaseLabel.get(tm.phase) ?? tm.phase,
      order: tm.order,
      home,
      away,
      homeGoals,
      awayGoals,
      winner,
      status,
      date: tm.date,
      time: tm.time,
      stadium: tm.stadium,
      city: tm.city,
      nextMatch: link.nextMatch,
      winnerTo: link.winnerTo,
      loserTo: link.loserTo,
    };
    ctx.resolved.set(tm.matchNumber, match);
  }

  return ordered.map((tm) => ctx.resolved.get(tm.matchNumber)!);
}

export type { TemplateMatch };
