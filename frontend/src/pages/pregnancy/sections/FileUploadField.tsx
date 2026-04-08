import { useState, useRef } from 'react';
import { Upload, Loader2, Sparkles, Check } from 'lucide-react';
import { extractFromFile } from '../../../api/pregnancy.api';

interface Props {
  extractType: 'lab_result' | 'ultrasound';
  onExtracted: (data: any) => void;
  label?: string;
}

export default function ExtractFileField({ extractType, onExtracted, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    setDone(null);
    try {
      const data = await extractFromFile(file, extractType);
      onExtracted(data);
      setDone(file.name);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha na análise do arquivo');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const defaultLabel = label ?? 'Importar de arquivo (PDF ou imagem)';

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-lilac" /> {defaultLabel}
      </label>
      {!done ? (
        <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lilac hover:bg-lilac/5 transition">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-lilac" />
              <span className="text-sm text-gray-500">Analisando com IA…</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Selecione um arquivo para preencher automaticamente</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleSelect}
            className="hidden"
            disabled={busy}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <Check className="w-4 h-4" />
            <span className="truncate">Dados extraídos de <strong>{done}</strong>. Arquivo descartado.</span>
          </div>
          <button
            type="button"
            onClick={() => setDone(null)}
            className="text-xs text-emerald-700 hover:underline shrink-0"
          >
            Outro arquivo
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-[10px] text-gray-400 mt-1">
        O arquivo é processado e descartado imediatamente. Apenas os dados extraídos são salvos.
      </p>
    </div>
  );
}
