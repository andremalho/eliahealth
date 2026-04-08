import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { createVaccine } from '../../../api/pregnancy.api';

interface Props { pregnancyId: string; onClose: () => void }

interface FormData {
  vaccineName: string;
  vaccineType: string;
  doseNumber: string;
  status: string;
  administeredDate: string;
  scheduledDate: string;
  batchNumber: string;
  notes: string;
}

const VACCINE_PRESETS = [
  { name: 'dT (dupla adulto - tétano e difteria)', type: 'dt' },
  { name: 'dTpa (tríplice acelular - difteria, tétano, coqueluche)', type: 'dtpa' },
  { name: 'Hepatite B', type: 'hepatitis_b' },
  { name: 'Influenza (gripe)', type: 'influenza' },
  { name: 'COVID-19', type: 'covid19' },
  { name: 'VRS / RSV (Abrysvo - bronquiolite)', type: 'rsv' },
  { name: 'Hepatite A', type: 'hepatitis_a' },
  { name: 'Pneumocócica', type: 'pneumococcal' },
  { name: 'Meningocócica ACWY', type: 'meningococcal_acwy' },
  { name: 'Meningocócica B', type: 'meningococcal_b' },
  { name: 'Febre amarela (área endêmica)', type: 'yellow_fever' },
  { name: 'Outro', type: 'other' },
];

export default function AddVaccineModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { status: 'administered' },
  });

  const status = watch('status');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Deriva vaccineType do nome escolhido (match com presets ou 'other')
      const matched = VACCINE_PRESETS.find((p) => p.name === data.vaccineName);
      const vaccineType = matched?.type ?? 'other';
      const payload: Record<string, unknown> = {
        vaccineName: data.vaccineName,
        vaccineType,
      };
      if (data.doseNumber) payload.doseNumber = parseInt(data.doseNumber, 10);
      if (data.status) payload.status = data.status;
      if (data.administeredDate) payload.administeredDate = data.administeredDate;
      if (data.scheduledDate) payload.scheduledDate = data.scheduledDate;
      if (data.batchNumber) payload.batchNumber = data.batchNumber;
      if (data.notes) payload.notes = data.notes;
      return createVaccine(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaccines', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Nova vacina">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Vacina *">
              <input {...register('vaccineName', { required: true })} list="vaccine-presets" placeholder="Ex: dTpa" className={iCn} />
              <datalist id="vaccine-presets">
                {VACCINE_PRESETS.map((v) => <option key={v.name} value={v.name} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Dose nº">
            <input {...register('doseNumber')} type="number" min="1" max="10" placeholder="1" className={iCn} />
          </Field>
        </div>
        <Field label="Status">
          <select {...register('status')} className={iCn}>
            <option value="administered">Administrada</option>
            <option value="scheduled">Agendada</option>
            <option value="pending">Pendente</option>
            <option value="overdue">Atrasada</option>
          </select>
        </Field>
        {status === 'administered' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de aplicação">
              <input {...register('administeredDate')} type="date" className={iCn} />
            </Field>
            <Field label="Lote">
              <input {...register('batchNumber')} type="text" placeholder="Ex: ABC123" className={iCn} />
            </Field>
          </div>
        )}
        {(status === 'scheduled' || status === 'pending') && (
          <Field label="Data agendada">
            <input {...register('scheduledDate')} type="date" className={iCn} />
          </Field>
        )}
        <Field label="Observações">
          <input {...register('notes')} type="text" className={iCn} />
        </Field>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}

export function Wrap({ onClose, title, children, max = 'max-w-md' }: { onClose: () => void; title: string; children: React.ReactNode; max?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${max} mx-4 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
export function ErrorBanner() {
  return <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">Erro ao salvar.</div>;
}
export function SubmitBar({ onClose, pending }: { onClose: () => void; pending: boolean }) {
  return (
    <div className="flex justify-end gap-3 pt-2 border-t">
      <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
      <button type="submit" disabled={pending} className="px-5 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar
      </button>
    </div>
  );
}
export const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
