/**
 * Orchestrator: turns engine input into a complete Bracket. This is the only
 * place the pieces are wired together; it holds no competition rules of its own.
 *
 *   group results → group tables → best thirds → allocation
 *                → fill template → advance winners → validate → Bracket
 */
import templateJson from "./bracketTemplate.json";
import type { Bracket, BracketPhase, BracketTemplate, EngineInput } from "./types";
import { computeGroupTables } from "./groupRanking";
import { allocateThirds, qualifyingThirdGroups, rankThirds, type ThirdAllocation } from "./thirdPlaceRanking";
import { thirdPlaceSlots } from "./bracketRules";
import { buildBracketMatches } from "./knockoutProgression";
import { validateBracket } from "./validators";
import { teamRef } from "./teams";

export const template = templateJson as unknown as BracketTemplate;

export function generateBracket(input: EngineInput): Bracket {
  const errors: string[] = [];

  const groupTables = computeGroupTables(input);
  const groupsComplete = groupTables.length > 0 && groupTables.every((t) => t.complete);

  let allocation: ThirdAllocation | null = null;
  let qualifiedThirds: Bracket["qualifiedThirds"] = [];

  if (groupsComplete) {
    const thirds = rankThirds(groupTables);
    qualifiedThirds = thirds
      .filter((t) => t.qualified)
      .map((t) => ({ group: t.group, team: teamRef(t.canon) }));
    allocation = allocateThirds(qualifyingThirdGroups(thirds), thirdPlaceSlots(template));
    if (!allocation) errors.push("Não foi possível alocar os 8 melhores terceiros às vagas oficiais da FIFA.");
  }

  const matches = buildBracketMatches(template, groupTables, allocation, input.knockoutResults);
  errors.push(...validateBracket(matches));

  const phases: BracketPhase[] = template.phases.map((p) => ({
    key: p.key,
    label: p.label,
    shortLabel: p.shortLabel,
    matches: matches.filter((m) => m.phase === p.key).sort((a, b) => a.order - b.order),
  }));

  const final = matches.find((m) => m.phase === "F");

  return {
    generatedAt: new Date().toISOString(),
    competition: template.competition,
    source: input.source,
    groupsComplete,
    complete: Boolean(final?.winner),
    phases,
    qualifiedThirds,
    valid: errors.length === 0,
    errors,
  };
}
