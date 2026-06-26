/**
 * Consistency checks over a generated bracket. Pending matches (teams not yet
 * decided) are expected, not errors — only contradictions are reported.
 */
import type { BracketMatch } from "./types";

export function validateBracket(matches: BracketMatch[]): string[] {
  const errors: string[] = [];

  // No team may occupy two Round-of-32 slots (duplicate qualification).
  const seen = new Map<string, number>();
  for (const m of matches.filter((m) => m.phase === "R32")) {
    for (const side of ["home", "away"] as const) {
      const team = m[side].team;
      if (!team) continue;
      const prev = seen.get(team.canon);
      if (prev) errors.push(`Seleção duplicada nos 32avos: ${team.name} (jogos ${prev} e ${m.matchNumber}).`);
      else seen.set(team.canon, m.matchNumber);
    }
  }

  for (const m of matches) {
    if (m.status !== "finished") continue;

    if (!m.home.team || !m.away.team) {
      errors.push(`Jogo ${m.matchNumber} finalizado sem participantes definidos.`);
    }

    const hg = m.homeGoals ?? 0;
    const ag = m.awayGoals ?? 0;
    if (hg === ag && !m.winner) {
      errors.push(`Jogo ${m.matchNumber} empatado sem vencedor definido (pênaltis).`);
    }
    if (m.winner === "home" && ag > hg) {
      errors.push(`Jogo ${m.matchNumber}: vencedor incompatível com o placar (${hg}x${ag}).`);
    }
    if (m.winner === "away" && hg > ag) {
      errors.push(`Jogo ${m.matchNumber}: vencedor incompatível com o placar (${hg}x${ag}).`);
    }
  }

  return errors;
}
