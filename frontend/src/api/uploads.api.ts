import api from './client';

export interface UploadResponse {
  url: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_UPLOAD_SIZE_MB = 20;

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResponse>('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export function isImage(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

export function isPdf(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/pdf';
}

// Resolve URL relativa do backend para URL absoluta
export function resolveUploadUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  return `${base}${url}`;
}
