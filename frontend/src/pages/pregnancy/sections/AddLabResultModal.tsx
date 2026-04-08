import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLabResult } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';
import ExtractFileField from './FileUploadField';

interface Props { pregnancyId: string; onClose: () => void }

interface FormData {
  examName: string;
  examCategory: string;
  requestedAt: string;
  resultDate: string;
  value: string;
  unit: string;
  referenceMin: string;
  referenceMax: string;
  resultText: string;
  labName: string;
  notes: string;
}

const CATEGORIES = [
  { v: 'hematology', l: 'Hematologia' },
  { v: 'biochemistry', l: 'Bioquímica' },
  { v: 'serology', l: 'Sorologia' },
  { v: 'urinalysis', l: 'Urinálise' },
  { v: 'hormonal', l: 'Hormonal' },
  { v: 'microbiology', l: 'Microbiologia' },
  { v: 'genetics', l: 'Genética' },
  { v: 'other', l: 'Outro' },
];

export default function AddLabResultModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const [extractedCount, setExtractedCount] = useState(0);
  const [extractedExtras, setExtractedExtras] = useState<any[]>([]);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { requestedAt: new Date().toISOString().split('T')[0] },
  });

  const handleExtracted = (data: any) => {
    const exams: any[] = data?.exams ?? [];
    if (exams.length === 0) return;
    const first = exams[0];
    if (first.examName) setValue('examName', first.examName);
    if (first.examCategory) setValue('examCategory', first.examCategory);
    if (first.resultDate) setValue('resultDate', first.resultDate);
    if (first.value != null) setValue('value', first.value.toString());
    if (first.unit) setValue('unit', first.unit);
    if (first.referenceMin != null) setValue('referenceMin', first.referenceMin.toString());
    if (first.referenceMax != null) setValue('referenceMax', first.referenceMax.toString());
    if (first.resultText) setValue('resultText', first.resultText);
    if (first.labName) setValue('labName', first.labName);
    setExtractedCount(exams.length);
    setExtractedExtras(exams.slice(1));
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        examName: data.examName,
        examCategory: data.examCategory,
        requestedAt: data.requestedAt,
      };
      if (data.resultDate) payload.resultDate = data.resultDate;
      if (data.value) payload.value = parseFloat(data.value);
      if (data.unit) payload.unit = data.unit;
      if (data.referenceMin) payload.referenceMin = parseFloat(data.referenceMin);
      if (data.referenceMax) payload.referenceMax = parseFloat(data.referenceMax);
      if (data.resultText) payload.resultText = data.resultText;
      if (data.labName) payload.labName = data.labName;
      if (data.notes) payload.notes = data.notes;
      const created = await createLabResult(pregnancyId, payload);

      // Cria os demais exames extraidos do mesmo arquivo (se houver)
      for (const ex of extractedExtras) {
        if (!ex.examName || !ex.examCategory) continue;
        await createLabResult(pregnancyId, {
          examName: ex.examName,
          examCategory: ex.examCategory,
          requestedAt: data.requestedAt,
          resultDate: ex.resultDate ?? undefined,
          value: ex.value ?? undefined,
          unit: ex.unit ?? undefined,
          referenceMin: ex.referenceMin ?? undefined,
          referenceMax: ex.referenceMax ?? undefined,
          resultText: ex.resultText ?? undefined,
          labName: ex.labName ?? undefined,
        });
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-results', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Novo exame laboratorial" max="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <ExtractFileField extractType="lab_result" onExtracted={handleExtracted} />
        {extractedCount > 1 && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            {extractedCount} exames extraídos. O primeiro foi carregado no formulário; os demais ({extractedCount - 1}) serão criados automaticamente ao salvar.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Exame *">
            <input {...register('examName', { required: true })} type="text" placeholder="Ex: Hemoglobina" className={iCn} />
          </Field>
          <Field label="Categoria *">
            <select {...register('examCategory', { required: true })} className={iCn}>
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da solicitação *">
            <input {...register('requestedAt', { required: true })} type="date" className={iCn} />
          </Field>
          <Field label="Data do resultado">
            <input {...register('resultDate')} type="date" className={iCn} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Valor">
            <input {...register('value')} type="number" step="0.01" placeholder="Ex: 11.5" className={iCn} />
          </Field>
          <Field label="Unidade">
            <input {...register('unit')} type="text" placeholder="g/dL" className={iCn} />
          </Field>
          <div className="grid grid-cols-2 gap-1">
            <Field label="Ref. mín">
              <input {...register('referenceMin')} type="number" step="0.01" className={iCn} />
            </Field>
            <Field label="Ref. máx">
              <input {...register('referenceMax')} type="number" step="0.01" className={iCn} />
            </Field>
          </div>
        </div>
        <Field label="Resultado em texto">
          <input {...register('resultText')} type="text" placeholder="Para resultados qualitativos" className={iCn} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Laboratório">
            <input {...register('labName')} type="text" className={iCn} />
          </Field>
          <Field label="Observações">
            <input {...register('notes')} type="text" className={iCn} />
          </Field>
        </div>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
