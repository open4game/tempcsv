'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
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
import { fetchCsvFile } from '@/lib/api';

interface CsvViewerProps {
  fileUrl?: string;
  file?: File;
  title?: string;
}

export function CsvViewer({ fileUrl, file, title }: CsvViewerProps) {
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    if (!fileUrl && !file) return;

    const loadCsvData = async () => {
      setLoading(true);
      setError('');

      try {
        let csvText: string;

        if (file) {
          // Load from local file
          csvText = await file.text();
        } else if (fileUrl) {
          // Load from URL
          csvText = await fetchCsvFile(fileUrl);
        } else {
          return;
        }

        Papa.parse(csvText, {
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const parsedData = results.data as string[][];

              // First row as headers
              const headerRow = parsedData[0];
              const dataRows = parsedData.slice(1).filter(row =>
                row.some(cell => cell !== null && cell !== undefined && cell !== '')
              );

              setHeaders(headerRow);
              setData(dataRows);
            } else {
              setError('No data found in CSV file');
            }
            setLoading(false);
          },
          error: (err) => {
            setError(`Failed to parse CSV: ${err.message}`);
            setLoading(false);
          },
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load CSV file');
        setLoading(false);
      }
    };

    loadCsvData();
  }, [fileUrl, file]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading CSV data...</span>
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

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title || 'CSV Data'}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {data.length} rows × {headers.length} columns
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 bg-muted/50 text-center sticky left-0 z-10 border-r font-sans">#</TableHead>
                {headers.map((header, index) => (
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
                  <TableCell colSpan={headers.length + 1} className="text-center py-8">
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
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} rows
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
