'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Github, Upload, Eye, Info, Shield, Cloud, Link as LinkIcon, Clock } from 'lucide-react';
import { CsvUploader } from '@/components/csv-uploader';
import { MobileNav } from '@/components/mobile-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UploadResponse } from '@/lib/api';

export default function Home() {
  const [lastUploadedFile, setLastUploadedFile] = useState<UploadResponse | null>(null);

  const handleFileUploaded = (result: UploadResponse) => {
    setLastUploadedFile(result);
  };

  const handleViewFile = (fileUrl: string) => {
    window.location.href = `/viewer?file=${encodeURIComponent(fileUrl)}`;
  };

  const shareFile = async (fileUrl: string) => {
    const fullUrl = new URL(window.location.href);
    fullUrl.pathname = '/viewer';
    fullUrl.searchParams.set('file', fileUrl);
    const shareUrl = fullUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'View CSV File',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, copy to clipboard instead
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
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
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/open4game/tempcsv"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block hover:opacity-80"
            >
              <Github className="h-6 w-6" />
            </a>
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Temp CSV Online</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload, view, and share CSV files online without registration.
              Your files are securely stored and easily accessible whenever you need them.
              No login required!
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-center">Upload your CSV file</h2>
            <CsvUploader onFileUploaded={handleFileUploaded} onViewFile={handleViewFile} />
          </div>

          {/* Recent Activity */}
          {lastUploadedFile && (
            <div className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">File Uploaded</p>
                      <code className="text-sm bg-muted p-2 rounded block overflow-hidden text-ellipsis whitespace-nowrap">
                        {lastUploadedFile.fileUrl}
                      </code>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => shareFile(lastUploadedFile.fileUrl)}
                      >
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(lastUploadedFile.fileUrl)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(lastUploadedFile.fileUrl, '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">One Click Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your CSV files with one click, no login required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Easy Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Update your files anytime while keeping the same URL.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <LinkIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Shareable Links</h3>
                <p className="text-sm text-muted-foreground">
                  Get permanent links to your files for easy sharing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Auto Delete</h3>
                <p className="text-sm text-muted-foreground">
                  Files are automatically deleted after 7 days for your privacy.
                </p>
              </CardContent>
            </Card>
          </div>
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
