import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

type PredictionsFile = {
  participants: Array<{
    name: string;
    picks: Record<string, [number, number]>;
  }>;
};

type FixturesFile = {
  matches: Array<{
    id: number;
    home: string;
    away: string;
    date?: string;
    time?: string;
    phaseLabel?: string;
  }>;
};

const root = process.cwd();
const read = <T>(file: string) => JSON.parse(readFileSync(join(root, "data", file), "utf8")) as T;
const out = join(root, "public", "bolao_copa2026_conferencia_palpite_apostadores.xlsx");
const tmp = join(root, "public", ".bolao_copa2026_conferencia_palpite_apostadores.tmp.xlsx");
const predictions = read<PredictionsFile>("predictions.json");
const fixtures = read<FixturesFile>("fixtures.json");
const fixtureById = new Map(fixtures.matches.map((match) => [String(match.id), match]));

const sanitizeSheetName = (name: string) =>
  name.replace(/[\[\]\*\/\\\?\:]/g, " ").slice(0, 31).trim() || "Apostador";

const wb = XLSX.utils.book_new();

for (const participant of predictions.participants) {
  const rows: Array<Record<string, string | number>> = [];
  const matchIds = Object.keys(participant.picks).sort((a, b) => Number(a) - Number(b));
  for (const matchId of matchIds) {
    const fixture = fixtureById.get(matchId);
    const pick = participant.picks[matchId];
    if (!fixture || !pick) continue;
    rows.push({
      Jogo: `J${matchId}`,
      Fase: fixture.phaseLabel ?? "32 avos de final",
      Mandante: fixture.home,
      "Placar M": pick[0],
      "Placar V": pick[1],
      Visitante: fixture.away,
      Data: fixture.date ?? "",
      Hora: fixture.time ?? "",
      Confronto: `${fixture.home} x ${fixture.away}`,
      Palpite: `${pick[0]} x ${pick[1]}`,
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!autofilter"] = { ref: ws["!ref"] ?? "A1:A1" };
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(participant.name));
}

const indexRows = predictions.participants.map((participant) => ({
  Apostador: participant.name,
  "Qtd. palpites": Object.keys(participant.picks).length,
}));
const indexSheet = XLSX.utils.json_to_sheet(indexRows);
indexSheet["!autofilter"] = { ref: indexSheet["!ref"] ?? "A1:A1" };
indexSheet["!freeze"] = { xSplit: 0, ySplit: 1 };
XLSX.utils.book_append_sheet(wb, indexSheet, "Resumo");

writeFileSync(tmp, XLSX.write(wb, { bookType: "xlsx", type: "buffer" }));

const patchScript = `
import zipfile, shutil, tempfile, os, re, sys
from pathlib import Path

src = Path(r'''${tmp}''')
dst = Path(r'''${out}''')
password = "B0LAO2026"

def patch_sheet(xml: str) -> str:
    if "<sheetProtection" in xml:
        return xml
    insert = f'<sheetProtection sheet="1" objects="1" scenarios="1" password="{password}"/>'
    return xml.replace('</worksheet>', insert + '</worksheet>')

def patch_workbook(xml: str) -> str:
    if "<workbookProtection" in xml:
        return xml
    insert = f'<workbookProtection lockStructure="1" lockWindows="1" workbookPassword="{password}"/>'
    return xml.replace('</workbook>', insert + '</workbook>')

with zipfile.ZipFile(src, 'r') as zin, zipfile.ZipFile(dst, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == 'xl/workbook.xml':
            data = patch_workbook(data.decode('utf-8')).encode('utf-8')
        elif item.filename.startswith('xl/worksheets/sheet') and item.filename.endswith('.xml'):
            data = patch_sheet(data.decode('utf-8')).encode('utf-8')
        zout.writestr(item, data)
`;

const patchFile = join(root, "public", ".bolao_copa2026_patch.py");
writeFileSync(patchFile, patchScript);
try {
  execFileSync("python3", [patchFile], { stdio: "inherit" });
} finally {
  try {
    writeFileSync(patchFile, "");
    writeFileSync(tmp, "");
  } catch {}
}

console.log(`generated ${out} with ${predictions.participants.length} participant sheets`);
