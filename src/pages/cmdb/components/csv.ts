/**
 * 最小 CSV 解析（RFC 4180：引号、转义引号、字段内换行、CRLF），首行为表头。
 */
export interface ParsedCsv {
  header: string[];
  rows: string[][];
}

export const parseCsv = (text: string): ParsedCsv => {
  const input = text.replace(/^﻿/, '');
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      records.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    records.push(row);
  }
  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ''));
  if (nonEmpty.length === 0) return { header: [], rows: [] };
  const [header, ...rows] = nonEmpty;
  return { header: header.map((h) => h.trim()), rows };
};
