import Link from 'next/link';
import { Github, Upload, Eye, Shield, Cloud, Link as LinkIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
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
        <div className="container mx-auto px-4 py-10 md:py-16 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Temp CSV</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground mb-8">
              Temp CSV is a simple online service where you can upload, view, and share CSV files
              without any registration or login required.
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Upload className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Upload CSV Files</h3>
                    <p className="text-muted-foreground">
                      Easily upload your CSV files with drag-and-drop or file selection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Eye className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">View CSV Files</h3>
                    <p className="text-muted-foreground">
                      View your CSV files in a clean, organized table format with pagination.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <LinkIcon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Share Files</h3>
                    <p className="text-muted-foreground">
                      Get shareable links to your files that you can send to anyone.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li><strong>Frontend:</strong> Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui</li>
                  <li><strong>Backend:</strong> Hono (Cloudflare Workers)</li>
                  <li><strong>Storage:</strong> Cloudflare R2</li>
                  <li><strong>Deployment:</strong> Cloudflare Pages & Workers</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Privacy & Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Files uploaded to Temp CSV are automatically deleted after 7 days. We do not
                  collect any personal information, and no registration is required to use the service.
                  All files are stored securely on Cloudflare R2.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Temp CSV is an open-source project. You can view the source code, report issues,
                  or contribute on GitHub.
                </p>
                <a
                  href="https://github.com/open4game/tempcsv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Github className="h-5 w-5" />
                  <span>View on GitHub</span>
                </a>
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
