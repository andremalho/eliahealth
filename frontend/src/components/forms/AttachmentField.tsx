import { useState } from 'react';
import { Loader2, Paperclip, FileText, X } from 'lucide-react';
import {
  uploadFile,
  isImage,
  isPdf,
  resolveUploadUrl,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from '../../api/uploads.api';
import { cn } from '../../utils/cn';

export interface AttachmentValue {
  url: string | null;
  name: string | null;
  mimeType: string | null;
}

/**
 * Slot único de upload de anexo (foto ou PDF).
 * - Sem arquivo: botão tracejado "Anexar foto ou PDF"
 * - Com arquivo: card com preview/link + botão de remover
 *
 * Componente controlado: receba `value` e `onChange`.
 */
export function AttachmentField({
  value,
  onChange,
  label,
}: {
  value: AttachmentValue;
  onChange: (next: AttachmentValue) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      setError('Tipo não permitido (use JPG, PNG, WebP ou PDF).');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande (máximo ${MAX_UPLOAD_SIZE_MB}MB).`);
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onChange({
        url: result.url,
        name: result.fileName,
        mimeType: result.mimeType,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange({ url: null, name: null, mimeType: null });
    setError(null);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      {value.url ? (
        <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
          {isImage(value.mimeType) ? (
            <a
              href={resolveUploadUrl(value.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src={resolveUploadUrl(value.url)}
                alt={value.name ?? ''}
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
            </a>
          ) : isPdf(value.mimeType) ? (
            <a
              href={resolveUploadUrl(value.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded border border-red-200 shrink-0"
              title="Abrir PDF"
            >
              <FileText className="w-6 h-6" />
            </a>
          ) : (
            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded shrink-0">
              <Paperclip className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <a
              href={resolveUploadUrl(value.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-lilac hover:underline truncate block"
            >
              {value.name ?? 'arquivo'}
            </a>
            <p className="text-xs text-gray-400">
              {isImage(value.mimeType)
                ? 'Imagem'
                : isPdf(value.mimeType)
                  ? 'PDF'
                  : 'Arquivo'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 text-gray-400 hover:text-red-600 p-1"
            title="Remover anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            'flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-sm text-gray-600 rounded-lg cursor-pointer hover:border-lilac hover:text-lilac transition',
            uploading && 'opacity-60 cursor-wait',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Paperclip className="w-4 h-4" />
              Anexar foto ou PDF
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      )}
      <p className="text-[10px] text-gray-400 mt-1">
        Formatos: JPG, PNG, WebP, PDF (máx {MAX_UPLOAD_SIZE_MB}MB)
      </p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
