const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api';

export interface UploadResponse {
  success: boolean;
  fileUrl: string;
}

export interface UpdateResponse {
  success: boolean;
  message: string;
  fileUrl: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function uploadCsvFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name || '');

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new ApiError(response.status, error.error || 'Upload failed');
  }

  return response.json();
}

export async function updateCsvFile(fileUrl: string, file: File): Promise<UpdateResponse> {
  // Extract folder and fileName from fileUrl
  const urlParts = fileUrl.split('/');
  const fileName = urlParts.pop();
  const folder = urlParts.pop();

  if (!folder || !fileName) {
    throw new Error('Invalid file URL');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/update/${folder}/${fileName}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Update failed' }));
    throw new ApiError(response.status, error.error || 'Update failed');
  }

  return response.json();
}

export async function fetchCsvFile(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch file');
  }

  return response.text();
}

/** Fetch file as ArrayBuffer (for XLSX/XLS/ODS). */
export async function fetchFileAsArrayBuffer(fileUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new ApiError(response.status, 'Failed to fetch file');
  }

  return response.arrayBuffer();
}
