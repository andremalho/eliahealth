import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPortalBp } from '../../api/portal.api';

interface FormData {
  date: string;
  time: string;
  systolic: string;
  diastolic: string;
}

export default function AddPortalBpModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const now = new Date();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createPortalBp({
        date: data.date,
        time: data.time + ':00',
        systolic: Number(data.systolic),
        diastolic: Number(data.diastolic),
        location: 'home',
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['portal-bp'] });
      toast.success('Pressao arterial registrada', {
        description: data?.isAltered ? 'Valor alterado — informe sua equipe medica' : undefined,
      });
      onClose();
    },
    onError: () => toast.error('Erro ao salvar medida'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Nova medida de PA</h2>
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
              <input {...register('time', { required: true })} type="time" className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Máxima (sistólica)</label>
              <input {...register('systolic', { required: true })} type="number" inputMode="numeric" min="40" max="300" placeholder="120" className="w-full px-3 py-4 border border-gray-300 rounded-lg text-2xl text-center font-bold text-navy" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Mínima (diastólica)</label>
              <input {...register('diastolic', { required: true })} type="number" inputMode="numeric" min="20" max="200" placeholder="80" className="w-full px-3 py-4 border border-gray-300 rounded-lg text-2xl text-center font-bold text-navy" />
            </div>
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
