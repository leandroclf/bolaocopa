/**
 * Imports the consolidated pool workbook into PII-free JSON.
 * Reads ONE sheet per participant (sheet D2 = display name; rows 7–78 = the 72
 * group-stage picks in columns F/H). Fixtures come from the `Matriz` sheet.
 * Phone/Pix are deliberately NOT read — never published, never committed.
 *
 *   npm run import:excel -- ./path/to/Bolao_Copa_2026_preenchida.xlsx
 */
import * as XLSX from "xlsx";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve as pathResolve } from "node:path";

const SRC = process.argv[2] ?? "./Bolao_Copa_2026_preenchida.xlsx";
const OUT = join(process.cwd(), "data");
const INPUTS = process.argv.slice(2);
const SOURCES = INPUTS.length > 0 ? INPUTS : [SRC];
const TEMPLATE = JSON.parse(readFileSync(join(process.cwd(), "src/knockout/bracketTemplate.json"), "utf8")) as {
  matches: Array<{ matchNumber: number; phase: string; date: string | null; time: string | null }>;
};
const R32_TEMPLATE = new Map(
  TEMPLATE.matches.filter((match) => match.phase === "R32").map((match) => [match.matchNumber, match])
);

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

const expandInputFiles = (sources: string[]) => {
  const files: string[] = [];
  for (const source of sources) {
    const abs = pathResolve(source);
    if (!existsSync(abs)) throw new Error(`input file not found: ${source}`);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      const entries = readdirSync(abs).filter((entry) => entry.toLowerCase().endsWith(".xlsx")).sort();
      for (const entry of entries) files.push(join(abs, entry));
    } else {
      files.push(abs);
    }
  }
  if (files.length === 0) throw new Error("no .xlsx workbook found in the provided input");
  return files;
};

const cellText = (ws: XLSX.WorkSheet, addr: string) => {
  const value = (ws[addr] as XLSX.CellObject | undefined)?.v;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value).trim();
  return "";
};

const firstTextInRange = (ws: XLSX.WorkSheet, row: number, cols: string[]) => {
  for (const col of cols) {
    const value = cellText(ws, `${col}${row}`);
    if (value) return value;
  }
  return "";
};

const detectWorkbookMode = (wb: XLSX.WorkBook) => {
  if (wb.SheetNames.includes("Matriz")) return "legacy" as const;
  if (wb.SheetNames.includes("Palpites 32-avos")) return "knockout" as const;
  return "unknown" as const;
};

const goal = (n: unknown, formatted?: unknown): number | null => {
  if (typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 30) return n;
  if (typeof formatted === "string" && /^\d+$/.test(formatted)) {
    const parsed = Number(formatted);
    if (parsed >= 0 && parsed <= 30) return parsed;
  }
  return null;
};

type Participant = { name: string; picks: Record<string, [number, number]> };

const writeJson = (file: string, value: unknown) => writeFileSync(join(OUT, file), JSON.stringify(value, null, 2));

const writeKnockoutWorkbook = (files: string[]) => {
  const workbooks = files.map((file) => ({ file, wb: XLSX.readFile(file, { cellDates: true }) }));
  const modes = new Set(workbooks.map(({ wb }) => detectWorkbookMode(wb)));
  if (modes.has("legacy")) {
    throw new Error("mixed workbook formats are not supported in the same import run");
  }
  if (modes.has("unknown")) {
    throw new Error("unable to detect the workbook format");
  }

  const firstWb = workbooks[0].wb;
  const sheet = firstWb.Sheets["Palpites 32-avos"];
  if (!sheet) throw new Error("sheet 'Palpites 32-avos' not found");

  const fixtures = TEMPLATE.matches
    .filter((match) => match.phase === "R32")
    .map((match, index) => {
      const row = 16 + index;
      const matchNumberText = cellText(sheet, `B${row}`);
      const matchNumber = Number(matchNumberText.replace(/\D+/g, "")) || match.matchNumber;
      const template = R32_TEMPLATE.get(matchNumber) ?? match;
      return {
        id: matchNumber,
        date: template.date ?? "2026-06-28",
        time: template.time ?? "",
        group: "R32",
        phaseLabel: "32 avos de final",
        home: firstTextInRange(sheet, row, ["C"]) || "",
        away: firstTextInRange(sheet, row, ["G"]) || "",
      };
    });

  const participants: Participant[] = [];
  const warnings: string[] = [];
  for (const { file, wb } of workbooks) {
    const ws = wb.Sheets["Palpites 32-avos"];
    if (!ws) continue;

    const fullName = firstTextInRange(ws, 9, ["D", "E", "F", "G", "H"]);
    const displayName = firstTextInRange(ws, 10, ["D", "E", "F", "G", "H"]);
    const fallbackName = basename(file, extname(file));
    const name = displayName || fullName || fallbackName;

    const picks: Record<string, [number, number]> = {};
    let valid = 0;
    for (let i = 0; i < fixtures.length; i++) {
      const row = 16 + i;
      const matchNumber = fixtures[i].id;
      const home = goal((ws[`D${row}`] as XLSX.CellObject | undefined)?.v, (ws[`D${row}`] as XLSX.CellObject | undefined)?.w);
      const away = goal((ws[`F${row}`] as XLSX.CellObject | undefined)?.v, (ws[`F${row}`] as XLSX.CellObject | undefined)?.w);
      if (home != null && away != null) {
        picks[String(matchNumber)] = [home, away];
        valid++;
      }
    }

    if (valid === 0) continue;
    participants.push({ name, picks });
    if (!displayName && !fullName) warnings.push(`${fallbackName}: nome de exibição ausente`);
  }

  participants.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  writeJson("fixtures.json", {
    tournament: "Bolão Copa do Mundo 2026 — Fase Mata-Mata",
    stage: "knockout",
    window: {
      start: fixtures[0]?.date ?? "2026-06-28",
      end: fixtures[fixtures.length - 1]?.date ?? "2026-07-03",
    },
    matches: fixtures,
  });
  writeJson("predictions.json", { participants });

  console.log(`imported: ${fixtures.length} fixtures, ${participants.length} participants`);
  console.log("data-quality warnings:", warnings.length ? warnings.join("; ") : "none");
};

const writeLegacyWorkbook = (file: string) => {
  const wb = XLSX.readFile(file, { cellDates: true });
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
  const participants: Participant[] = [];
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

  writeJson("fixtures.json", {
    tournament: "Bolão Copa do Mundo 2026 — Fase de Grupos", stage: "group",
    window: { start: "2026-06-11", end: "2026-06-27" },
    matches: fixtures.map((f) => ({ id: f.id, date: f.date, time: f.time, group: f.group, home: f.home, away: f.away })),
  });
  writeJson("predictions.json", { participants });
  writeJson("team-map.json", {
    ptToCanon: Object.fromEntries(TEAMS.flatMap(([c, pts]) => pts.map((v) => [norm(v), c]))),
    enToCanon: Object.fromEntries(TEAMS.flatMap(([c, , ens]) => ens.map((v) => [norm(v), c]))),
    fixtureCanon: Object.fromEntries(fixtures.map((f) => [String(f.id), [f.hc, f.ac]])),
  });
  console.log(`imported: ${fixtures.length} fixtures, ${participants.length} participants`);
  console.log("data-quality warnings:", warnings.length ? warnings.join("; ") : "none");
};

const inputFiles = expandInputFiles(SOURCES);
const workbooks = inputFiles.map((file) => ({ file, wb: XLSX.readFile(file, { cellDates: true }) }));
const modes = new Set(workbooks.map(({ wb }) => detectWorkbookMode(wb)));
if (modes.size === 1 && modes.has("knockout")) {
  writeKnockoutWorkbook(inputFiles);
  process.exit(0);
}
if (modes.size === 1 && modes.has("legacy")) {
  // Fall through to the original legacy parser below.
} else if (modes.has("unknown")) {
  throw new Error("unable to detect the workbook format");
} else if (modes.size > 1) {
  throw new Error("mixed workbook formats are not supported in the same import run");
}

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
