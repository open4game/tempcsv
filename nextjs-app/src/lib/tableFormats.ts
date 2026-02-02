/**
 * Supported spreadsheet/table formats and extensions.
 * CSV/TSV: PapaParse. XLSX/XLS/ODS: SheetJS (xlsx).
 */

export const SUPPORTED_EXTENSIONS = ['.csv', '.tsv', '.xlsx', '.xls', '.ods'] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

const BINARY_EXTENSIONS: SupportedExtension[] = ['.xlsx', '.xls', '.ods'];

export function isSupportedExtension(ext: string): ext is SupportedExtension {
  return SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension);
}

export function getExtension(urlOrFileName: string): string {
  const match = urlOrFileName.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? ('.' + match[1].toLowerCase()) : '.csv';
  return isSupportedExtension(ext) ? ext : '.csv';
}

export function isBinaryFormat(ext: string): boolean {
  return BINARY_EXTENSIONS.includes(ext as SupportedExtension);
}

export const ACCEPT_UPLOAD = '.csv,.tsv,.xlsx,.xls,.ods';
