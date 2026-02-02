'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchCsvFile, fetchFileAsArrayBuffer } from '@/lib/api';
import { parseTableToArray, parseBinaryToMultiSheet, getTableExtension } from '@/lib/tableParser';
import { isBinaryFormat } from '@/lib/tableFormats';

interface CsvViewerProps {
  fileUrl?: string;
  file?: File;
  title?: string;
}

/** Single table: CSV/TSV or one sheet. Multi-sheet: XLSX/XLS/ODS with multiple sheets. */
type TableState =
  | { kind: 'single'; headers: string[]; data: string[][] }
  | { kind: 'multi'; sheetNames: string[]; sheetsData: string[][][]; currentSheetIndex: number };

/** 最多显示列数，超出仅显示前 N 列，避免浏览器崩溃 */
const MAX_COLUMNS = 100;

export function CsvViewer({ fileUrl, file, title }: CsvViewerProps) {
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    if (!fileUrl && !file) return;

    const loadTableData = async () => {
      setLoading(true);
      setError('');

      try {
        const sourceName = file?.name ?? fileUrl ?? '';
        const ext = getTableExtension(sourceName);

        if (file) {
          if (isBinaryFormat(ext)) {
            const buffer = await file.arrayBuffer();
            const { sheetNames, sheetsData } = parseBinaryToMultiSheet(buffer, ext);
            if (sheetNames.length > 1) {
              setTableState({ kind: 'multi', sheetNames, sheetsData, currentSheetIndex: 0 });
            } else {
              const rows = sheetsData[0] || [];
              if (rows.length > 0) {
                const headerRow = rows[0];
                const dataRows = rows.slice(1).filter((row) =>
                  row.some((cell) => cell !== null && cell !== undefined && cell !== '')
                );
                setTableState({ kind: 'single', headers: headerRow, data: dataRows });
              } else {
                setError('No data found in file');
              }
            }
          } else {
            const text = await file.text();
            const rows = parseTableToArray(text, ext);
            if (rows.length > 0) {
              const headerRow = rows[0];
              const dataRows = rows.slice(1).filter((row) =>
                row.some((cell) => cell !== null && cell !== undefined && cell !== '')
              );
              setTableState({ kind: 'single', headers: headerRow, data: dataRows });
            } else {
              setError('No data found in file');
            }
          }
        } else if (fileUrl) {
          if (isBinaryFormat(ext)) {
            const buffer = await fetchFileAsArrayBuffer(fileUrl);
            const { sheetNames, sheetsData } = parseBinaryToMultiSheet(buffer, ext);
            if (sheetNames.length > 1) {
              setTableState({ kind: 'multi', sheetNames, sheetsData, currentSheetIndex: 0 });
            } else {
              const rows = sheetsData[0] || [];
              if (rows.length > 0) {
                const headerRow = rows[0];
                const dataRows = rows.slice(1).filter((row) =>
                  row.some((cell) => cell !== null && cell !== undefined && cell !== '')
                );
                setTableState({ kind: 'single', headers: headerRow, data: dataRows });
              } else {
                setError('No data found in file');
              }
            }
          } else {
            const text = await fetchCsvFile(fileUrl);
            const rows = parseTableToArray(text, ext);
            if (rows.length > 0) {
              const headerRow = rows[0];
              const dataRows = rows.slice(1).filter((row) =>
                row.some((cell) => cell !== null && cell !== undefined && cell !== '')
              );
              setTableState({ kind: 'single', headers: headerRow, data: dataRows });
            } else {
              setError('No data found in file');
            }
          }
        } else {
          return;
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    loadTableData();
  }, [fileUrl, file]);

  // Derive current sheet's headers and data for display
  const headers: string[] = tableState
    ? tableState.kind === 'single'
      ? tableState.headers
      : (tableState.sheetsData[tableState.currentSheetIndex]?.[0] ?? [])
    : [];
  const data: string[][] = tableState
    ? tableState.kind === 'single'
      ? tableState.data
      : (tableState.sheetsData[tableState.currentSheetIndex] ?? []).slice(1).filter((row) =>
          row.some((cell) => cell !== null && cell !== undefined && cell !== '')
        )
    : [];

  const setCurrentSheetIndex = (index: number) => {
    if (tableState?.kind === 'multi') {
      setTableState({ ...tableState, currentSheetIndex: index });
      setCurrentPage(1);
    }
  };

  const totalColumns = headers.length;
  const displayHeaders = headers.slice(0, MAX_COLUMNS);
  const displayData = data.map((row) => row.slice(0, MAX_COLUMNS));
  const columnTruncated = totalColumns > MAX_COLUMNS;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading table data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(displayData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = displayData.slice(startIndex, endIndex);

  const sheetNames = tableState?.kind === 'multi' ? tableState.sheetNames : [];
  const currentSheetIndex = tableState?.kind === 'multi' ? tableState.currentSheetIndex : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-3">
            {title || 'Table Data'}
            {sheetNames.length > 1 && (
              <select
                value={currentSheetIndex}
                onChange={(e) => setCurrentSheetIndex(Number(e.target.value))}
                className="rounded border bg-background px-2 py-1 text-sm font-normal"
                aria-label="Switch worksheet"
              >
                {sheetNames.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {displayData.length} rows × {totalColumns} columns
            {columnTruncated && ` (showing first ${MAX_COLUMNS})`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {columnTruncated && (
          <p className="text-sm text-red-600 mb-2">
            Showing first {MAX_COLUMNS} of {totalColumns} columns to avoid browser overload.
          </p>
        )}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 bg-muted/50 text-center sticky left-0 z-10 border-r font-sans">#</TableHead>
                {displayHeaders.map((header, index) => (
                  <TableHead key={index} className="bg-muted/50 font-semibold whitespace-nowrap px-3 min-w-[120px] font-sans">
                    {header || `Column ${index + 1}`}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((row, rowIndex) => (
                  <TableRow key={startIndex + rowIndex} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-muted-foreground text-center sticky left-0 bg-background border-r text-xs font-sans">
                      {startIndex + rowIndex + 1}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className="px-3 py-2 whitespace-nowrap text-sm font-sans"
                        title={cell}
                        style={{ letterSpacing: 'normal' }}
                      >
                        <div className="max-w-md overflow-hidden text-ellipsis">
                          {cell}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={displayHeaders.length + 1} className="text-center py-8">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, displayData.length)} of {displayData.length} rows
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
