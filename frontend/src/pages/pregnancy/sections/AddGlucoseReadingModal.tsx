import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { createGlucoseReading } from '../../../api/pregnancy.api';

interface Props {
  pregnancyId: string;
  onClose: () => void;
}

interface FormData {
  readingDate: string;
  readingTime: string;
  measurementType: string;
  glucoseValue: string;
  symptomsNotes: string;
}

const MEASUREMENT_TYPES = [
  { v: 'fasting', l: 'Jejum' },
  { v: 'post_breakfast_1h', l: 'Pós café 1h' },
  { v: 'post_breakfast_2h', l: 'Pós café 2h' },
  { v: 'pre_lunch', l: 'Antes almoço' },
  { v: 'post_lunch_1h', l: 'Pós almoço 1h' },
  { v: 'post_lunch_2h', l: 'Pós almoço 2h' },
  { v: 'pre_dinner', l: 'Antes jantar' },
  { v: 'post_dinner_1h', l: 'Pós jantar 1h' },
  { v: 'post_dinner_2h', l: 'Pós jantar 2h' },
  { v: 'bedtime', l: 'Antes de dormir' },
  { v: 'random', l: 'Aleatória' },
  { v: 'hypoglycemia', l: 'Hipoglicemia' },
];

export default function AddGlucoseReadingModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { readingDate: dateStr, readingTime: timeStr, measurementType: 'fasting' },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        readingDate: data.readingDate,
        readingTime: data.readingTime,
        measurementType: data.measurementType,
        glucoseValue: Number(data.glucoseValue),
      };
      if (data.symptomsNotes) payload.symptomsNotes = data.symptomsNotes;
      return createGlucoseReading(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['glucose-table', pregnancyId] });
      qc.invalidateQueries({ queryKey: ['glucose-summary', pregnancyId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Nova medida de glicemia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao salvar medida.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data *">
              <input {...register('readingDate', { required: true })} type="date" className={iCn} />
            </Field>
            <Field label="Hora *">
              <input {...register('readingTime', { required: true })} type="time" className={iCn} />
            </Field>
          </div>

          <Field label="Tipo de medição *">
            <select {...register('measurementType', { required: true })} className={iCn}>
              {MEASUREMENT_TYPES.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </Field>

          <Field label="Valor (mg/dL) *">
            <input {...register('glucoseValue', { required: true })} type="number" min="10" max="600" placeholder="Ex: 95" className={iCn} />
          </Field>

          <Field label="Observações">
            <input {...register('symptomsNotes')} type="text" placeholder="Sintomas, contexto..." className={iCn} />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2"
            >
              {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
