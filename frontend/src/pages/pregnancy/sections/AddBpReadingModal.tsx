import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { createBpReading } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';

interface Props {
  pregnancyId: string;
  onClose: () => void;
}

interface FormData {
  readingDate: string;
  readingTime: string;
  systolic: string;
  diastolic: string;
  heartRate: string;
  arm: string;
  position: string;
}

export default function AddBpReadingModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { readingDate: dateStr, readingTime: timeStr },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        readingDate: data.readingDate,
        readingTime: data.readingTime,
        systolic: Number(data.systolic),
        diastolic: Number(data.diastolic),
      };
      if (data.heartRate) payload.heartRate = Number(data.heartRate);
      if (data.arm) payload.arm = data.arm;
      if (data.position) payload.position = data.position;
      return createBpReading(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bp-timeline', pregnancyId] });
      qc.invalidateQueries({ queryKey: ['bp-readings', pregnancyId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Nova medida de PA</h2>
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

          <div className="grid grid-cols-3 gap-3">
            <Field label="Sistólica *">
              <input {...register('systolic', { required: true })} type="number" min="40" max="300" placeholder="mmHg" className={iCn} />
            </Field>
            <Field label="Diastólica *">
              <input {...register('diastolic', { required: true })} type="number" min="20" max="200" placeholder="mmHg" className={iCn} />
            </Field>
            <Field label="FC">
              <input {...register('heartRate')} type="number" min="30" max="250" placeholder="bpm" className={iCn} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Braço">
              <select {...register('arm')} className={iCn}>
                <option value="">—</option>
                <option value="left">Esquerdo</option>
                <option value="right">Direito</option>
              </select>
            </Field>
            <Field label="Posição">
              <select {...register('position')} className={iCn}>
                <option value="">—</option>
                <option value="seated">Sentada</option>
                <option value="supine">Decúbito</option>
                <option value="left_lateral">Lateral esquerda</option>
                <option value="standing">Em pé</option>
              </select>
            </Field>
          </div>

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
