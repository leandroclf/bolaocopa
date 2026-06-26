/**
 * Reference data: canonical team slug → display name (pt-BR) + flag emoji.
 *
 * This is competition data, not logic. Team *identity* always comes from
 * data/team-map.json (fixtureCanon); this map only adds a clean label and a
 * flag for rendering, since the imported spreadsheet has spelling variants.
 * Unknown slugs fall back to a title-cased name and a neutral flag.
 */
import type { TeamRef } from "./types";

export const TEAM_LABELS: Record<string, { name: string; flag: string }> = {
  mexico: { name: "México", flag: "🇲🇽" },
  "south africa": { name: "África do Sul", flag: "🇿🇦" },
  "south korea": { name: "Coreia do Sul", flag: "🇰🇷" },
  "czech republic": { name: "República Tcheca", flag: "🇨🇿" },
  canada: { name: "Canadá", flag: "🇨🇦" },
  bosnia: { name: "Bósnia", flag: "🇧🇦" },
  qatar: { name: "Catar", flag: "🇶🇦" },
  switzerland: { name: "Suíça", flag: "🇨🇭" },
  brazil: { name: "Brasil", flag: "🇧🇷" },
  morocco: { name: "Marrocos", flag: "🇲🇦" },
  haiti: { name: "Haiti", flag: "🇭🇹" },
  scotland: { name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  usa: { name: "Estados Unidos", flag: "🇺🇸" },
  paraguay: { name: "Paraguai", flag: "🇵🇾" },
  australia: { name: "Austrália", flag: "🇦🇺" },
  turkey: { name: "Turquia", flag: "🇹🇷" },
  germany: { name: "Alemanha", flag: "🇩🇪" },
  curacao: { name: "Curaçao", flag: "🇨🇼" },
  "ivory coast": { name: "Costa do Marfim", flag: "🇨🇮" },
  ecuador: { name: "Equador", flag: "🇪🇨" },
  netherlands: { name: "Holanda", flag: "🇳🇱" },
  japan: { name: "Japão", flag: "🇯🇵" },
  sweden: { name: "Suécia", flag: "🇸🇪" },
  tunisia: { name: "Tunísia", flag: "🇹🇳" },
  belgium: { name: "Bélgica", flag: "🇧🇪" },
  egypt: { name: "Egito", flag: "🇪🇬" },
  iran: { name: "Irã", flag: "🇮🇷" },
  "new zealand": { name: "Nova Zelândia", flag: "🇳🇿" },
  spain: { name: "Espanha", flag: "🇪🇸" },
  "cape verde": { name: "Cabo Verde", flag: "🇨🇻" },
  "saudi arabia": { name: "Arábia Saudita", flag: "🇸🇦" },
  uruguay: { name: "Uruguai", flag: "🇺🇾" },
  france: { name: "França", flag: "🇫🇷" },
  senegal: { name: "Senegal", flag: "🇸🇳" },
  iraq: { name: "Iraque", flag: "🇮🇶" },
  norway: { name: "Noruega", flag: "🇳🇴" },
  austria: { name: "Áustria", flag: "🇦🇹" },
  jordan: { name: "Jordânia", flag: "🇯🇴" },
  argentina: { name: "Argentina", flag: "🇦🇷" },
  algeria: { name: "Argélia", flag: "🇩🇿" },
  portugal: { name: "Portugal", flag: "🇵🇹" },
  "dr congo": { name: "Rep. Dem. do Congo", flag: "🇨🇩" },
  uzbekistan: { name: "Uzbequistão", flag: "🇺🇿" },
  colombia: { name: "Colômbia", flag: "🇨🇴" },
  england: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  croatia: { name: "Croácia", flag: "🇭🇷" },
  ghana: { name: "Gana", flag: "🇬🇭" },
  panama: { name: "Panamá", flag: "🇵🇦" },
};

const titleCase = (slug: string) =>
  slug.replace(/\b\w/g, (c) => c.toUpperCase());

export function teamRef(canon: string): TeamRef {
  const entry = TEAM_LABELS[canon];
  return {
    canon,
    name: entry?.name ?? titleCase(canon),
    flag: entry?.flag ?? "🏳️",
  };
}
