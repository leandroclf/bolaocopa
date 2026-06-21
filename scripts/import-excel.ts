/**
 * Imports the consolidated pool workbook into PII-free JSON.
 * Reads ONE sheet per participant (sheet D2 = display name; rows 7–78 = the 72
 * group-stage picks in columns F/H). Fixtures come from the `Matriz` sheet.
 * Phone/Pix are deliberately NOT read — never published, never committed.
 *
 *   npm run import:excel -- ./path/to/Bolao_Copa_2026_preenchida.xlsx
 */
import * as XLSX from "xlsx";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "./Bolao_Copa_2026_preenchida.xlsx";
const OUT = join(process.cwd(), "data");

const TEAMS: [string, string[], string[]][] = [
  ["mexico", ["mexico"], ["mexico"]], ["south africa", ["africa do sul"], ["south africa"]],
  ["south korea", ["coreia do sul"], ["south korea"]], ["czech republic", ["republica tcheca", "repub tcheca"], ["czech republic"]],
  ["canada", ["canada"], ["canada"]], ["bosnia", ["bosnia"], ["bosnia and herzegovina", "bosnia herzegovina"]],
  ["qatar", ["catar"], ["qatar"]], ["switzerland", ["suica"], ["switzerland"]],
  ["brazil", ["brasil"], ["brazil"]], ["morocco", ["marrocos"], ["morocco"]],
  ["haiti", ["haiti"], ["haiti"]], ["scotland", ["escocia"], ["scotland"]],
  ["usa", ["estados unidos"], ["usa", "united states"]], ["paraguay", ["paraguai"], ["paraguay"]],
  ["australia", ["australia"], ["australia"]], ["turkey", ["turquia"], ["turkey", "turkiye"]],
  ["germany", ["alemanha"], ["germany"]], ["curacao", ["curacau", "curacao"], ["curacao"]],
  ["ivory coast", ["costa do marfim"], ["ivory coast", "cote divoire"]], ["ecuador", ["equador"], ["ecuador"]],
  ["netherlands", ["holanda"], ["netherlands"]], ["japan", ["japao"], ["japan"]],
  ["sweden", ["suecia"], ["sweden"]], ["tunisia", ["tunisia"], ["tunisia"]],
  ["belgium", ["belgica"], ["belgium"]], ["egypt", ["egito"], ["egypt"]],
  ["iran", ["ira"], ["iran"]], ["new zealand", ["nova zelandia"], ["new zealand"]],
  ["spain", ["espanha"], ["spain"]], ["cape verde", ["cabo verde"], ["cape verde"]],
  ["saudi arabia", ["arabia saudita"], ["saudi arabia"]], ["uruguay", ["uruguai"], ["uruguay"]],
  ["france", ["franca"], ["france"]], ["senegal", ["senegal"], ["senegal"]],
  ["iraq", ["iraque"], ["iraq"]], ["norway", ["noruega"], ["norway"]],
  ["argentina", ["argentina"], ["argentina"]], ["algeria", ["argelia", "argerlia"], ["algeria"]],
  ["austria", ["austria"], ["austria"]], ["jordan", ["jordania"], ["jordan"]],
  ["portugal", ["portugal"], ["portugal"]], ["dr congo", ["repub do congo", "republica do congo", "repub congo"], ["dr congo", "congo dr", "congo"]],
  ["uzbekistan", ["uzbequistao"], ["uzbekistan"]], ["colombia", ["colombia"], ["colombia"]],
  ["england", ["inglaterra"], ["england"]], ["croatia", ["croacia"], ["croatia"]],
  ["ghana", ["gana"], ["ghana"]], ["panama", ["panama"], ["panama"]],
];
const GROUPS: Record<string, string[]> = {
  A: ["mexico", "south africa", "south korea", "czech republic"],
  B: ["canada", "bosnia", "qatar", "switzerland"],
  C: ["brazil", "morocco", "haiti", "scotland"],
  D: ["usa", "paraguay", "australia", "turkey"],
  E: ["germany", "curacao", "ivory coast", "ecuador"],
  F: ["netherlands", "japan", "sweden", "tunisia"],
  G: ["belgium", "egypt", "iran", "new zealand"],
  H: ["spain", "cape verde", "saudi arabia", "uruguay"],
  I: ["france", "senegal", "iraq", "norway"],
  J: ["argentina", "algeria", "austria", "jordan"],
  K: ["portugal", "dr congo", "uzbekistan", "colombia"],
  L: ["england", "croatia", "ghana", "panama"],
};

const norm = (s: unknown) =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

const base = new Map<string, string>();
for (const [c, pts, ens] of TEAMS) { base.set(c, c); for (const v of [...pts, ...ens]) base.set(norm(v), c); }

const lev = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const resolve = (name: string, group: string) => {
  const c = base.get(norm(name)) ?? norm(name);
  const gs = GROUPS[group] ?? [];
  if (gs.includes(c) || gs.length === 0) return c;
  return gs.slice().sort((x, y) => lev(norm(name), x) - lev(norm(name), y))[0];
};

const wb = XLSX.readFile(SRC, { cellDates: true });
const cell = (ws: XLSX.WorkSheet, addr: string) => (ws[addr] as XLSX.CellObject | undefined)?.v;
const isoDate = (v: unknown) =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v);

// Fixtures from Matriz (B=idx, C=date, D=time, E=home, I=away, J=group)
const mz = wb.Sheets["Matriz"];
type Fx = { id: number; date: string; time: string; group: string; home: string; away: string; hc: string; ac: string };
const fixtures: Fx[] = [];
for (let r = 7; r <= 78; r++) {
  const idx = cell(mz, `B${r}`);
  if (typeof idx !== "number") continue;
  const group = String(cell(mz, `J${r}`)).trim().toUpperCase();
  const home = String(cell(mz, `E${r}`)).trim();
  const away = String(cell(mz, `I${r}`)).trim();
  fixtures.push({
    id: idx, date: isoDate(cell(mz, `C${r}`)), time: String(cell(mz, `D${r}`)).trim(),
    group, home, away, hc: resolve(home, group), ac: resolve(away, group),
  });
}
if (fixtures.length !== 72) throw new Error(`expected 72 fixtures, got ${fixtures.length}`);

// Predictions: one sheet per participant
const SKIP = new Set(["Classificação", "Matriz"]);
const participants: { name: string; picks: Record<string, [number, number]> }[] = [];
const warnings: string[] = [];
for (const name of wb.SheetNames) {
  if (SKIP.has(name)) continue;
  const ws = wb.Sheets[name];
  const d2 = cell(ws, "D2");
  if (typeof d2 !== "string" || !d2.trim() || d2.trim() === "Preencher") continue;
  const display = d2.trim();
  const picks: Record<string, [number, number]> = {};
  let valid = 0;
  // A valid pick is a non-negative integer goal count. Floats, negatives, blanks
  // and out-of-range junk are treated as "no pick" (scores 0 for that match).
  const goal = (n: unknown, formatted?: unknown): number | null => {
    if (typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 30) return n;
    if (typeof formatted === "string" && /^\d+$/.test(formatted)) {
      const parsed = Number(formatted);
      if (parsed >= 0 && parsed <= 30) return parsed;
    }
    return null;
  };
  fixtures.forEach((fx, i) => {
    const fAddr = `F${7 + i}`;
    const hAddr = `H${7 + i}`;
    const f = goal(cell(ws, fAddr), (ws[fAddr] as XLSX.CellObject | undefined)?.w);
    const h = goal(cell(ws, hAddr), (ws[hAddr] as XLSX.CellObject | undefined)?.w);
    if (f != null && h != null) { picks[String(fx.id)] = [f, h]; valid++; }
  });
  if (valid === 0) continue;
  participants.push({ name: display, picks });
  if (valid < 72) warnings.push(`${display}: ${valid}/72`);
}
participants.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

const write = (f: string, o: unknown) => writeFileSync(join(OUT, f), JSON.stringify(o, null, 2));
write("fixtures.json", {
  tournament: "Bolão Copa do Mundo 2026 — Fase de Grupos", stage: "group",
  window: { start: "2026-06-11", end: "2026-06-27" },
  matches: fixtures.map((f) => ({ id: f.id, date: f.date, time: f.time, group: f.group, home: f.home, away: f.away })),
});
write("predictions.json", { participants });
write("team-map.json", {
  ptToCanon: Object.fromEntries(TEAMS.flatMap(([c, pts]) => pts.map((v) => [norm(v), c]))),
  enToCanon: Object.fromEntries(TEAMS.flatMap(([c, , ens]) => ens.map((v) => [norm(v), c]))),
  fixtureCanon: Object.fromEntries(fixtures.map((f) => [String(f.id), [f.hc, f.ac]])),
});
console.log(`imported: ${fixtures.length} fixtures, ${participants.length} participants`);
console.log("data-quality warnings:", warnings.length ? warnings.join("; ") : "none");
