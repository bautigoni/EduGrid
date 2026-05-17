export type ImportPreview = {
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
};

export function parseCsvPreview(content: string, maxRows = 5): ImportPreview {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { columns: [], rows: [], errors: ["El archivo esta vacio."] };
  }

  const columns = splitCsvLine(lines[0]);
  const rows = lines.slice(1, maxRows + 1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""]));
  });

  const errors = rows.flatMap((row, index) => {
    const missing = columns.filter((column) => !row[column]);
    return missing.length ? [`Fila ${index + 2}: faltan valores en ${missing.join(", ")}`] : [];
  });

  return { columns, rows, errors };
}

export function parseCsvAll(content: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = content
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { columns: [], rows: [] };
  const columns = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""]));
  });
  return { columns, rows };
}

export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  result.push(value.trim());
  return result;
}
