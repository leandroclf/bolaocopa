/** Public API of the knockout engine. The UI consumes only the Bracket type. */
export { generateBracket, template } from "./bracketGenerator";
export { computeGroupTables } from "./groupRanking";
export { rankThirds, allocateThirds, qualifyingThirdGroups } from "./thirdPlaceRanking";
export { thirdPlaceSlots } from "./bracketRules";
export * from "./types";
