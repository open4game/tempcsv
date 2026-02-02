/**
 * Parse table files to string[][] using PapaParse (CSV/TSV) or SheetJS (XLSX/XLS/ODS).
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getExtension, isBinaryFormat } from './tableFormats';

export type ParseInput = string | ArrayBuffer;

/**
 * Parse table content to array of rows (string[][]).
 * @param input - Raw string (CSV/TSV) or ArrayBuffer (XLSX/XLS/ODS)
 * @param extension - File extension e.g. '.csv', '.xlsx'
 */
export function parseTableToArray(input: ParseInput, extension: string): string[][] {
  const ext = extension.toLowerCase();
  if (isBinaryFormat(ext)) {
    return parseBinaryToArray(input as ArrayBuffer, ext);
  }
  return parseTextToArray(input as string, ext);
}

function parseTextToArray(text: string, ext: string): string[][] {
  const delimiter = ext === '.tsv' ? '\t' : undefined;
  const result = Papa.parse<string[]>(text, {
    delimiter,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0 && !result.data?.length) {
    throw new Error(result.errors[0]?.message || 'Parse error');
  }
  const rows = (result.data || []) as string[][];
  return rows.filter((row) => row.some((cell) => cell != null && String(cell).trim() !== ''));
}

function rowToStrArray(row: unknown): string[] {
  return Array.isArray(row) ? row.map((c) => (c != null ? String(c) : '')) : [String(row)];
}

function parseBinaryToArray(buffer: ArrayBuffer, ext: string): string[][] {
  const { sheetNames, sheetsData } = parseBinaryToMultiSheet(buffer, ext);
  if (!sheetNames.length || !sheetsData[0]?.length) {
    throw new Error('No data found in sheet');
  }
  return sheetsData[0];
}

/**
 * Parse binary workbook (XLSX/XLS/ODS) to all sheets.
 * Returns sheet names and each sheet's data as string[][].
 */
export function parseBinaryToMultiSheet(
  buffer: ArrayBuffer,
  _ext: string
): { sheetNames: string[]; sheetsData: string[][][] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];
  if (!sheetNames.length) {
    throw new Error('No sheet found in file');
  }
  const sheetsData: string[][][] = [];
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
    const rows = (aoa || []).map(rowToStrArray);
    sheetsData.push(rows);
  }
  return { sheetNames, sheetsData };
}

/**
 * Get file extension from URL or file name.
 */
export function getTableExtension(urlOrFileName: string): string {
  return getExtension(urlOrFileName);
}
