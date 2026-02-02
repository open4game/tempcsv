'use client';

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, Copy, Download, Share2, Check, FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadCsvFile, type UploadResponse } from '@/lib/api';
import { CsvViewer } from '@/components/csv-viewer';
import { cn } from '@/lib/utils';
import { getExtension, isSupportedExtension, ACCEPT_UPLOAD } from '@/lib/tableFormats';

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
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const ext = getExtension(selectedFile.name);
    if (isSupportedExtension(ext)) {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      setFile(null);
      setErrorMessage('Please select a CSV, TSV, XLSX, XLS or ODS file');
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

  const cancelPreview = () => {
    setFile(null);
    setErrorMessage('');
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

  // Show upload success
  if (uploadResult) {
    return (
      <div className="w-full">
        <Card className="border-2 border-green-200 bg-green-50/50 mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-2xl font-semibold mb-2">Upload Successful!</h3>
              <p className="text-muted-foreground">Your file has been uploaded and is ready to share</p>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">File URL:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap">
                  {uploadResult.fileUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copySuccess ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={shareFile}
              className="w-full mb-4"
              size="lg"
            >
              <Share2 className="mr-2 h-5 w-5" />
              {shareSuccess ? 'Link Copied!' : 'Share This File'}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button variant="outline" onClick={viewFile}>
                <Download className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button variant="outline" onClick={openFileInNewWindow}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={resetUploader}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show preview with unified CsvViewer
  if (file) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Preview: {file.name}</h3>
            <p className="text-sm text-muted-foreground">Review all your data before uploading</p>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelPreview}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <CsvViewer file={file} title={`Preview: ${file.name}`} />

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={uploadFile}
            disabled={uploading}
            className="flex-1"
            size="lg"
          >
            {uploading ? (
              <>
                <Upload className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirm & Upload
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={cancelPreview}
            disabled={uploading}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Show file selector
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
      <div className="max-w-2xl mx-auto w-full">
        <Upload className="w-16 h-16 mx-auto mb-6 text-primary" />

        <h3 className="text-2xl font-semibold mb-4">Drop your table file here</h3>
        <p className="text-sm text-muted-foreground mb-2">CSV, TSV, XLSX, XLS, ODS</p>

        <p className="text-lg mb-4">or</p>

        <div className="mb-6">
          <input
            type="file"
            accept={ACCEPT_UPLOAD}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="lg" className="cursor-pointer" asChild>
              <span>
                <FileUp className="mr-2 h-5 w-5" />
                Select file
              </span>
            </Button>
          </label>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mt-6">
          Supported: CSV, TSV, Excel (.xlsx, .xls), ODS. Preview before uploading.
        </p>
      </div>
    </div>
  );
}
