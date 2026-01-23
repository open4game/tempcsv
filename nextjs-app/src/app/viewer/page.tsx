'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Github, Loader2, FileSearch } from 'lucide-react';
import { CsvViewer } from '@/components/csv-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function ViewerContent() {
  const searchParams = useSearchParams();
  const [fileUrl, setFileUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    const urlParam = searchParams.get('file');
    if (urlParam) {
      setFileUrl(urlParam);
      setInputUrl(urlParam);
    }
  }, [searchParams]);

  const handleLoadFile = () => {
    if (inputUrl) {
      setFileUrl(inputUrl);
    }
  };

  const handleClearFile = () => {
    setFileUrl('');
    setInputUrl('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Temp CSV
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/viewer" className="hover:underline">
              CSV Viewer
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
          </nav>
          <a
            href="https://github.com/open4game/tempcsv"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80"
          >
            <Github className="h-6 w-6" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">CSV Viewer</h2>

          {/* File URL Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                Enter CSV File URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="url"
                  placeholder="https://example.com/files/your-file.csv"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadFile()}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button onClick={handleLoadFile} disabled={!inputUrl}>
                    View File
                  </Button>
                  {fileUrl && (
                    <Button variant="outline" onClick={handleClearFile}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CSV Viewer */}
          {fileUrl ? (
            <CsvViewer fileUrl={fileUrl} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileSearch className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
                <p className="text-muted-foreground">
                  Please enter a CSV file URL above to view its contents.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Temp CSV</h3>
              <p className="text-sm text-muted-foreground">
                Upload, view, and share CSV files online.
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Temp CSV
              </p>
            </div>
            <div className="text-right">
              <a
                href="https://github.com/open4game/tempcsv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}
