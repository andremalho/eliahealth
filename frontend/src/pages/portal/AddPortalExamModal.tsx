import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Upload, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { extractFromFilePortal, createPortalPatientExam } from '../../api/portal.api';

export default function AddPortalExamModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<any[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const data = await extractFromFilePortal(file, 'lab_result');
      const exams: any[] = data?.exams ?? [];
      if (exams.length === 0) {
        setError('Nenhum exame foi reconhecido neste arquivo.');
      } else {
        setExtracted(exams);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao analisar o arquivo. Tente novamente.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const saveAll = useMutation({
    mutationFn: async () => {
      if (!extracted) return;
      for (const e of extracted) {
        if (!e.examName) continue;
        await createPortalPatientExam({
          examName: e.examName,
          examDate: e.resultDate ?? new Date().toISOString().split('T')[0],
          result: e.value != null ? String(e.value) : (e.resultText ?? ''),
          unit: e.unit ?? '',
          referenceRange: e.referenceMin != null && e.referenceMax != null
            ? `${e.referenceMin} - ${e.referenceMax}`
            : '',
          labName: e.labName ?? '',
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-patient-exams'] });
      qc.invalidateQueries({ queryKey: ['portal-lab-results'] });
      toast.success('Exames enviados com sucesso', {
        description: 'Sua equipe medica vai revisar os resultados.',
      });
      onClose();
    },
    onError: () => toast.error('Erro ao salvar exames'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-auto p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-navy">Enviar exame</h2>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-lilac" />
          A IA vai ler o arquivo e extrair os dados automaticamente.
        </p>

        {!extracted ? (
          <>
            <label className="flex flex-col items-center justify-center gap-2 w-full px-4 py-10 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-lilac hover:bg-lilac/5 transition">
              {busy ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-lilac" />
                  <span className="text-sm text-gray-600">Analisando…</span>
                  <span className="text-[10px] text-gray-400">Pode levar até 30 segundos</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Toque para selecionar</span>
                  <span className="text-[10px] text-gray-400">PDF ou foto do exame</span>
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
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Seus exames ficam visíveis na sua área e serão revisados pela equipe médica.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700">
                {extracted.length} exame{extracted.length > 1 ? 's' : ''} reconhecido{extracted.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {extracted.map((e, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg text-xs">
                  <p className="font-medium text-navy">{e.examName ?? '—'}</p>
                  {e.value != null && (
                    <p className="text-gray-600 mt-0.5">
                      {e.value}{e.unit ? ' ' + e.unit : ''}
                      {e.referenceMin != null && e.referenceMax != null && (
                        <span className="text-gray-400 ml-2">(ref: {e.referenceMin}–{e.referenceMax})</span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {saveAll.error && (
              <p className="text-xs text-red-500 mb-2">Erro ao salvar. Tente novamente.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setExtracted(null); setError(null); }}
                className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg"
              >
                Outro arquivo
              </button>
              <button
                onClick={() => saveAll.mutate()}
                disabled={saveAll.isPending}
                className="flex-1 py-3 bg-lilac text-white font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saveAll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
