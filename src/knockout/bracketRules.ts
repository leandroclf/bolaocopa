/**
 * Competition rules that are not part of the per-match template: which R32
 * slots take a best-third, and any official overrides for their allocation.
 */
import type { BracketTemplate, SlotRef } from "./types";

export interface ThirdSlot {
  match: number;
  groups: string[];
}

const isThird = (ref: SlotRef): ref is { kind: "third"; groups: string[] } => ref.kind === "third";

/**
 * The R32 matches whose away slot is filled by one of the best third-placed
 * teams, together with the official set of groups eligible for that slot
 * (FIFA 2026). Derived from the template so the rule has a single source.
 */
export function thirdPlaceSlots(template: BracketTemplate): ThirdSlot[] {
  return template.matches
    .filter((m) => isThird(m.away))
    .map((m) => ({ match: m.matchNumber, groups: isThird(m.away) ? m.away.groups : [] }));
}

/**
 * Optional official allocation overrides. FIFA publishes a fixed table mapping
 * each combination of the eight qualifying third-place groups to specific R32
 * slots. The engine already computes a valid, constraint-respecting allocation
 * for any combination; to pin the exact official assignment for a given
 * combination, add a row here keyed by the eight group letters sorted and
 * joined (e.g. "ABCEFHIJ"). Each value maps a slot match number to the group
 * whose third-placed team plays there. Overrides are validated against the
 * official constraints before use and ignored if inconsistent.
 */
export const ALLOCATION_OVERRIDES: Record<string, Record<number, string>> = {};
