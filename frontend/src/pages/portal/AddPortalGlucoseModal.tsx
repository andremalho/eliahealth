import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPortalGlucose } from '../../api/portal.api';

interface FormData {
  date: string;
  measuredAt: string;
  mealType: string;
  value: string;
}

const MEAL_TYPES = [
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
];

export default function AddPortalGlucoseModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const now = new Date();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      date: now.toISOString().split('T')[0],
      measuredAt: now.toTimeString().slice(0, 5),
      mealType: 'fasting',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createPortalGlucose({
        date: data.date,
        measuredAt: data.measuredAt + ':00',
        mealType: data.mealType,
        value: Number(data.value),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['portal-glucose'] });
      toast.success('Glicemia registrada', {
        description: data?.isAltered ? 'Valor alterado — informe sua equipe médica' : undefined,
      });
      onClose();
    },
    onError: () => toast.error('Erro ao salvar medida'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Nova medida de glicemia</h2>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao salvar
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Data</label>
              <input {...register('date', { required: true })} type="date" className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Hora</label>
              <input {...register('measuredAt', { required: true })} type="time" className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Momento</label>
            <select {...register('mealType')} className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base">
              {MEAL_TYPES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">Valor (mg/dL)</label>
            <input {...register('value', { required: true })} type="number" inputMode="numeric" min="10" max="600" placeholder="95" className="w-full px-3 py-4 border border-gray-300 rounded-lg text-2xl text-center font-bold text-navy" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full py-4 bg-lilac text-white font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
