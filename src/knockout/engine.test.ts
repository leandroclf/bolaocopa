import { describe, it, expect } from "vitest";
import { generateBracket } from "./bracketGenerator";
import { computeGroupTables } from "./groupRanking";
import { rankThirds, allocateThirds, qualifyingThirdGroups } from "./thirdPlaceRanking";
import { thirdPlaceSlots } from "./bracketRules";
import { template } from "./bracketGenerator";
import type { EngineInput } from "./types";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
// Round-robin pairings for 4 teams (indices); home listed first.
const PAIRS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];
const canon = (g: string, i: number) => `g${g}t${i}`;

/**
 * Builds a deterministic 12-group tournament where each group finishes
 * t0 > t1 > t2 > t3 (9/6/3/0 pts). The third-placed team's winning margin
 * decreases from group A → L, so the best-thirds ranking is A..L and the
 * eight qualifiers are groups A–H.
 */
function buildGroupStage(opts: { dropLastMatchOfGroup?: string } = {}): EngineInput {
  const fixtures: EngineInput["fixtures"] = [];
  const fixtureCanon: EngineInput["fixtureCanon"] = {};
  const groupResults: EngineInput["groupResults"] = {};
  let id = 0;

  GROUPS.forEach((g, gi) => {
    const thirdMargin = 12 - gi; // distinct per group → distinct third ranking
    PAIRS.forEach(([home, away], pairIndex) => {
      id++;
      fixtures.push({ id, group: g });
      fixtureCanon[String(id)] = [canon(g, home), canon(g, away)];
      const isThirdWin = home === 2 && away === 3;
      const drop = opts.dropLastMatchOfGroup === g && pairIndex === PAIRS.length - 1;
      if (!drop) {
        groupResults[String(id)] = {
          home: isThirdWin ? thirdMargin : 2,
          away: 0,
          status: "finished",
        };
      }
    });
  });

  return { fixtures, fixtureCanon, groupResults, knockoutResults: {}, source: "test" };
}

/** Every knockout match finishes 1–0, so the home participant always advances. */
function withHomeWinsKnockout(input: EngineInput): EngineInput {
  const knockoutResults: EngineInput["knockoutResults"] = {};
  for (let n = 73; n <= 104; n++) {
    knockoutResults[String(n)] = { home: 1, away: 0, status: "finished" };
  }
  return { ...input, knockoutResults };
}

describe("group ranking", () => {
  it("ranks a group by points with no ties", () => {
    const tables = computeGroupTables(buildGroupStage());
    const a = tables.find((t) => t.group === "A")!;
    expect(a.complete).toBe(true);
    expect(a.rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(a.rows.map((r) => r.points)).toEqual([9, 6, 3, 0]);
    expect(a.rows[0].canon).toBe("gAt0");
    expect(a.rows[2].canon).toBe("gAt2"); // the third-placed team
  });

  it("applies head-to-head to break a points/GD/GF tie", () => {
    // alpha and beta both finish 6 pts, GD +2, 4 GF — level on every overall
    // criterion. alpha won their direct encounter, so it must rank first.
    const fixtures = [1, 2, 3, 4, 5, 6].map((id) => ({ id, group: "Z" }));
    const fixtureCanon: EngineInput["fixtureCanon"] = {
      "1": ["alpha", "beta"],
      "2": ["alpha", "gamma"],
      "3": ["alpha", "delta"],
      "4": ["beta", "gamma"],
      "5": ["beta", "delta"],
      "6": ["gamma", "delta"],
    };
    const score = (home: number, away: number) => ({ home, away, status: "finished" });
    const groupResults: EngineInput["groupResults"] = {
      "1": score(2, 1), // alpha beats beta (head-to-head)
      "2": score(0, 1), // alpha loses to gamma
      "3": score(2, 0), // alpha beats delta
      "4": score(1, 0), // beta beats gamma
      "5": score(2, 0), // beta beats delta
      "6": score(0, 1), // delta beats gamma
    };
    const [table] = computeGroupTables({ fixtures, fixtureCanon, groupResults, knockoutResults: {}, source: "t" });
    expect(table.rows[0].points).toBe(table.rows[1].points);
    expect(table.rows[0].goalDifference).toBe(table.rows[1].goalDifference);
    expect(table.rows[0].canon).toBe("alpha");
    expect(table.rows[1].canon).toBe("beta");
  });
});

describe("best third-placed teams", () => {
  const tables = computeGroupTables(buildGroupStage());
  const thirds = rankThirds(tables);

  it("ranks twelve thirds and qualifies exactly eight", () => {
    expect(thirds).toHaveLength(12);
    expect(thirds.filter((t) => t.qualified)).toHaveLength(8);
    expect(qualifyingThirdGroups(thirds)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H"]);
  });

  it("allocates the eight thirds within the official slot constraints", () => {
    const slots = thirdPlaceSlots(template);
    const allocation = allocateThirds(qualifyingThirdGroups(thirds), slots)!;
    expect(allocation).not.toBeNull();
    const assigned = Object.values(allocation.bySlot);
    expect(new Set(assigned).size).toBe(8); // no duplicates
    for (const slot of slots) {
      expect(slot.groups).toContain(allocation.bySlot[slot.match]);
    }
  });
});

describe("bracket generation — pending stage", () => {
  it("fills R32 from completed groups and keeps later rounds as placeholders", () => {
    const bracket = generateBracket(buildGroupStage());
    expect(bracket.valid).toBe(true);
    expect(bracket.groupsComplete).toBe(true);
    expect(bracket.complete).toBe(false);

    const r32 = bracket.phases.find((p) => p.key === "R32")!;
    expect(r32.matches).toHaveLength(16);
    for (const m of r32.matches) {
      expect(m.home.team).not.toBeNull();
      expect(m.away.team).not.toBeNull();
      expect(m.status).toBe("scheduled");
    }
    // third-place slots resolved to an actual third-placed team
    const m74 = r32.matches.find((m) => m.matchNumber === 74)!;
    expect(m74.away.team?.canon).toMatch(/t2$/);

    const r16 = bracket.phases.find((p) => p.key === "R16")!;
    expect(r16.matches.every((m) => m.status === "pending")).toBe(true);
  });

  it("uses official placeholders before groups are decided", () => {
    const bracket = generateBracket(buildGroupStage({ dropLastMatchOfGroup: "A" }));
    expect(bracket.valid).toBe(true);
    expect(bracket.groupsComplete).toBe(false);

    const r16 = bracket.phases.find((p) => p.key === "R16")!;
    const m89 = r16.matches.find((m) => m.matchNumber === 89)!;
    expect(m89.home.label).toBe("Vencedor Jogo 74");

    // group A undecided → its winner slot is a placeholder; thirds too
    const r32 = bracket.phases.find((p) => p.key === "R32")!;
    const m79 = r32.matches.find((m) => m.matchNumber === 79)!; // 1A vs 3rd
    expect(m79.home.label).toBe("1º Grupo A");
    expect(m79.away.label).toBe("Melhor 3º colocado");
  });
});

describe("bracket generation — full tournament", () => {
  const bracket = generateBracket(withHomeWinsKnockout(buildGroupStage()));

  it("advances winners automatically through every round", () => {
    expect(bracket.valid).toBe(true);
    expect(bracket.complete).toBe(true);

    const all = bracket.phases.flatMap((p) => p.matches);
    const byNum = new Map(all.map((m) => [m.matchNumber, m]));

    // R16 match 89 home = winner of match 74 (its home team, since home won)
    const m74 = byNum.get(74)!;
    const m89 = byNum.get(89)!;
    expect(m89.home.team?.canon).toBe(m74.home.team?.canon);

    // every knockout match has a winner and no contradictions
    for (const m of all) {
      expect(m.status).toBe("finished");
      expect(m.winner).toBe("home");
    }
  });

  it("fills the third-place match from the semi-final losers", () => {
    const all = bracket.phases.flatMap((p) => p.matches);
    const byNum = new Map(all.map((m) => [m.matchNumber, m]));
    const sf1 = byNum.get(101)!;
    const sf2 = byNum.get(102)!;
    const third = byNum.get(103)!;
    // loser of a home-win semi is the away participant
    expect(third.home.team?.canon).toBe(sf1.away.team?.canon);
    expect(third.away.team?.canon).toBe(sf2.away.team?.canon);
  });

  it("crowns the winner of the final as champion", () => {
    const final = bracket.phases.find((p) => p.key === "F")!.matches[0];
    expect(final.winner).toBe("home");
    expect(final.home.team).not.toBeNull();
  });
});

describe("validation", () => {
  it("flags a finished match with an impossible winner", () => {
    const input = buildGroupStage();
    input.knockoutResults["73"] = { home: 0, away: 2, status: "finished", winner: "home" };
    const bracket = generateBracket(input);
    expect(bracket.valid).toBe(false);
    expect(bracket.errors.some((e) => e.includes("vencedor incompatível"))).toBe(true);
  });
});
