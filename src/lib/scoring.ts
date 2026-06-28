import type { Score } from "./types";

/**
 * Per-match scoring. Ported 1:1 from the pool's own Excel formula
 * (helper flags O–V on each participant sheet). Validated by unit tests
 * and cross-checked against the workbook as an oracle.
 *
 *  10  exact score (includes an exact draw)
 *   5  correct winner AND exactly one team's goal count exact (decisive games only)
 *   3  correct outcome (win or draw) with no exact goal count
 *   0  wrong outcome, or no prediction, or match not finished
 *
 * The 5-point tier is unreachable for draws by construction — intentional,
 * matching the organiser's rules. For knockout matches, the score compared
 * here is always the stored 90-minute result; the advancing winner is tracked
 * separately for the bracket.
 */
export function scoreMatch(pred: Score | null | undefined, actual: Score | null | undefined): number {
  if (!pred || !actual) return 0;
  const { home: ph, away: pa } = pred;
  const { home: ah, away: aa } = actual;
  if ([ph, pa, ah, aa].some((n) => !Number.isInteger(n))) return 0;

  if (ph === ah && pa === aa) return 10; // exact

  const po = Math.sign(ph - pa); // 1 home win, 0 draw, -1 away win
  const ao = Math.sign(ah - aa);
  if (po !== ao) return 0; // wrong outcome

  if (po !== 0 && (ph === ah || pa === aa)) return 5; // decisive + one exact score
  return 3; // correct outcome, no exact score
}
