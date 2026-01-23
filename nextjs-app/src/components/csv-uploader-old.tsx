'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, Copy, Download, Share2, Check, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadCsvFile, type UploadResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CsvUploaderProps {
  onFileUploaded?: (result: UploadResponse) => void;
  onViewFile?: (fileUrl: string) => void;
}

export function CsvUploader({ onFileUploaded, onViewFile }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const processFile = useCallback((selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      setFile(null);
      setErrorMessage('Please select a valid CSV file');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    processFile(selectedFile);
  };

  const uploadFile = async () => {
    if (!file) {
      setErrorMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    try {
      const result = await uploadCsvFile(file);
      setUploadResult(result);
      onFileUploaded?.(result);
      setFile(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred during upload');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!uploadResult?.fileUrl) return;

    try {
      await navigator.clipboard.writeText(uploadResult.fileUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL to clipboard:', err);
    }
  };

  const openFileInNewWindow = () => {
    if (uploadResult?.fileUrl) {
      window.open(uploadResult.fileUrl, '_blank');
    }
  };

  const viewFile = () => {
    if (uploadResult?.fileUrl) {
      onViewFile?.(uploadResult.fileUrl);
    }
  };

  const resetUploader = () => {
    setUploadResult(null);
    setFile(null);
  };

  const shareFile = async () => {
    if (!uploadResult?.fileUrl) return;

    const fullUrl = new URL(window.location.href);
    fullUrl.pathname = '/viewer';
    fullUrl.searchParams.set('file', uploadResult.fileUrl);
    const shareUrl = fullUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'View CSV File',
          url: shareUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        // User cancelled or share failed, copy to clipboard instead
        if ((err as Error).name !== 'AbortError') {
          await copyShareUrlToClipboard(shareUrl);
        }
      }
    } else {
      await copyShareUrlToClipboard(shareUrl);
    }
  };

  const copyShareUrlToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy share URL to clipboard:', err);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-all min-h-[400px] flex flex-col justify-center',
        dragActive ? 'border-primary bg-primary/5' : 'border-border'
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {!uploadResult ? (
        <div className="max-w-2xl mx-auto w-full">
          <Upload className="w-16 h-16 mx-auto mb-6 text-primary" />

          <h3 className="text-2xl font-semibold mb-4">Drop your CSV file here</h3>

          <p className="text-lg mb-4">or</p>

          <div className="mb-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" size="lg" className="cursor-pointer" asChild>
                <span>
                  <FileUp className="mr-2 h-5 w-5" />
                  Select CSV file
                </span>
              </Button>
            </label>
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            size="lg"
            className="w-full max-w-md py-6 text-lg"
            disabled={!file || uploading}
            onClick={uploadFile}
          >
            <Upload className="mr-2 h-5 w-5" />
            {uploading ? 'Uploading...' : 'Upload Now'}
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto w-full">
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />

          <h3 className="text-2xl font-semibold mb-4">Upload Successful!</h3>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                  {uploadResult.fileUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className={copySuccess ? 'text-green-500' : ''}
                >
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full mb-6 py-6 text-lg"
            onClick={shareFile}
            variant={shareSuccess ? 'secondary' : 'default'}
          >
            {shareSuccess ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-5 w-5" />
                Share This File
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" onClick={resetUploader}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Another
            </Button>

            <Button variant="outline" size="lg" onClick={viewFile}>
              <FileUp className="mr-2 h-4 w-4" />
              View
            </Button>

            <Button size="lg" onClick={openFileInNewWindow}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
