/**
 * Best third-placed teams: rank the twelve third-placed sides, take the eight
 * best, and allocate them to the R32 third-place slots within the official
 * group constraints. The same FIFA tie-breakers used for groups apply.
 */
import type { GroupTable, ThirdPlaceEntry } from "./types";
import { ALLOCATION_OVERRIDES, type ThirdSlot } from "./bracketRules";

const QUALIFY = 8;

/** Rank every group's third-placed team across the tournament. */
export function rankThirds(tables: GroupTable[]): ThirdPlaceEntry[] {
  const thirds = tables
    .filter((t) => t.complete)
    .map((t) => t.rows.find((r) => r.rank === 3))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const sorted = [...thirds].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name, "pt-BR")
  );

  return sorted.map((r, i) => ({ ...r, overallRank: i + 1, qualified: i < QUALIFY }));
}

export interface ThirdAllocation {
  bySlot: Record<number, string>; // slot match number → group letter
  byGroup: Record<string, number>; // group letter → slot match number
}

const toAllocation = (bySlot: Record<number, string>): ThirdAllocation => {
  const byGroup: Record<string, number> = {};
  for (const [match, group] of Object.entries(bySlot)) byGroup[group] = Number(match);
  return { bySlot, byGroup };
};

function isValid(bySlot: Record<number, string>, groups: string[], slots: ThirdSlot[]): boolean {
  const assigned = Object.values(bySlot);
  if (assigned.length !== groups.length) return false;
  if (new Set(assigned).size !== assigned.length) return false;
  if (!groups.every((g) => assigned.includes(g))) return false;
  return slots.every((s) => {
    const g = bySlot[s.match];
    return g !== undefined && s.groups.includes(g);
  });
}

/**
 * Assign the eight qualifying third-place groups to the eight slots.
 * Uses an official override when present and valid, otherwise computes a
 * deterministic, constraint-respecting perfect matching via backtracking.
 * Returns null when no valid allocation exists (caller treats as an error).
 */
export function allocateThirds(groups: string[], slots: ThirdSlot[]): ThirdAllocation | null {
  if (groups.length !== slots.length) return null;

  const override = ALLOCATION_OVERRIDES[[...groups].sort().join("")];
  if (override && isValid(override, groups, slots)) return toAllocation(override);

  const orderedSlots = [...slots].sort((a, b) => a.match - b.match);
  const remaining = new Set(groups);
  const bySlot: Record<number, string> = {};

  const solve = (i: number): boolean => {
    if (i === orderedSlots.length) return true;
    const slot = orderedSlots[i];
    for (const g of [...remaining].sort()) {
      if (!slot.groups.includes(g)) continue;
      bySlot[slot.match] = g;
      remaining.delete(g);
      if (solve(i + 1)) return true;
      remaining.add(g);
      delete bySlot[slot.match];
    }
    return false;
  };

  return solve(0) ? toAllocation(bySlot) : null;
}

/** Groups whose third-placed team qualified, in ranking order. */
export const qualifyingThirdGroups = (thirds: ThirdPlaceEntry[]): string[] =>
  thirds.filter((t) => t.qualified).map((t) => t.group);
