import { describe, it, expect } from "vitest";
import { scoreMatch } from "./scoring";
const s = (home: number, away: number) => ({ home, away });

describe("scoreMatch — rules taken verbatim from the pool sheet examples", () => {
  it("exact score = 10", () => {
    expect(scoreMatch(s(2, 1), s(2, 1))).toBe(10);
    expect(scoreMatch(s(1, 1), s(1, 1))).toBe(10); // exact draw
    expect(scoreMatch(s(0, 0), s(0, 0))).toBe(10);
  });

  it("correct winner + one exact goal count (decisive) = 5", () => {
    expect(scoreMatch(s(2, 1), s(3, 1))).toBe(5); // matched the loser's goals
    expect(scoreMatch(s(3, 0), s(3, 1))).toBe(5); // matched the winner's goals
    expect(scoreMatch(s(0, 2), s(1, 2))).toBe(5); // away win, matched away goals
    expect(scoreMatch(s(0, 2), s(0, 3))).toBe(5); // away win, matched home goals
  });

  it("correct decisive winner, no exact goal count = 3", () => {
    expect(scoreMatch(s(2, 1), s(3, 0))).toBe(3);
    expect(scoreMatch(s(3, 0), s(2, 1))).toBe(3);
    expect(scoreMatch(s(0, 2), s(1, 3))).toBe(3);
  });

  it("correct draw, not exact = 3", () => {
    expect(scoreMatch(s(1, 1), s(0, 0))).toBe(3);
    expect(scoreMatch(s(1, 1), s(2, 2))).toBe(3);
  });

  it("wrong outcome = 0", () => {
    expect(scoreMatch(s(1, 1), s(1, 0))).toBe(0); // predicted draw, was a win
    expect(scoreMatch(s(1, 0), s(1, 1))).toBe(0); // predicted win, was a draw
    expect(scoreMatch(s(2, 1), s(1, 2))).toBe(0); // predicted home win, away won
  });

  it("5-point tier is unreachable for draws", () => {
    // result is a draw, prediction a non-exact draw: must be 3, never 5
    expect(scoreMatch(s(2, 2), s(1, 1))).toBe(3);
  });

  it("no prediction or unfinished match = 0", () => {
    expect(scoreMatch(null, s(2, 1))).toBe(0);
    expect(scoreMatch(s(2, 1), null)).toBe(0);
    expect(scoreMatch(undefined, undefined)).toBe(0);
  });
});
