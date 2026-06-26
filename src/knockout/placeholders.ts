/**
 * Official-style placeholder labels and origin descriptions for slots whose
 * team is not yet decided. Used by the progression step; never holds rules.
 */
import type { SlotRef } from "./types";

export function slotLabel(ref: SlotRef): string {
  switch (ref.kind) {
    case "winner":
      return `1º Grupo ${ref.group}`;
    case "runnerUp":
      return `2º Grupo ${ref.group}`;
    case "third":
      return "Melhor 3º colocado";
    case "matchWinner":
      return `Vencedor Jogo ${ref.match}`;
    case "matchLoser":
      return `Perdedor Jogo ${ref.match}`;
  }
}

export function slotSource(ref: SlotRef): string {
  switch (ref.kind) {
    case "winner":
      return `Vencedor do Grupo ${ref.group}`;
    case "runnerUp":
      return `Vice do Grupo ${ref.group}`;
    case "third":
      return `Melhor 3º (${ref.groups.join("/")})`;
    case "matchWinner":
      return `Vencedor do Jogo ${ref.match}`;
    case "matchLoser":
      return `Perdedor do Jogo ${ref.match}`;
  }
}
