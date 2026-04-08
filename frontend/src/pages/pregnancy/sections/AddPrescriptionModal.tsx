import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { createPrescription } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';
import { cn } from '../../../utils/cn';

interface Props { pregnancyId: string; onClose: () => void }

interface MedicationItem {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
}

interface FormData {
  prescriptionDate: string;
  status: string;
  notes: string;
  medications: MedicationItem[];
}

export default function AddPrescriptionModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      prescriptionDate: new Date().toISOString().split('T')[0],
      status: 'active',
      medications: [{ name: '', dose: '', route: '', frequency: '', duration: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const validMeds = data.medications.filter((m) => m.name.trim());
      if (validMeds.length === 0) throw new Error('Adicione pelo menos um medicamento');
      const payload: Record<string, unknown> = {
        prescriptionDate: data.prescriptionDate,
        medications: validMeds,
        status: data.status,
      };
      if (data.notes) payload.notes = data.notes;
      return createPrescription(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Nova prescrição" max="max-w-2xl">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data *">
            <input {...register('prescriptionDate', { required: true })} type="date" className={iCn} />
          </Field>
          <Field label="Status">
            <select {...register('status')} className={iCn}>
              <option value="active">Ativa</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Medicamentos *</label>
            <button type="button" onClick={() => append({ name: '', dose: '', route: '', frequency: '', duration: '' })} className="flex items-center gap-1 text-xs text-lilac hover:text-primary-dark">
              <Plus className="w-3 h-3" /> Adicionar
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input {...register(`medications.${i}.name` as const)} placeholder="Nome do medicamento *" className={iCn} />
                    <input {...register(`medications.${i}.dose` as const)} placeholder="Dose (ex: 500mg)" className={iCn} />
                    <input {...register(`medications.${i}.route` as const)} placeholder="Via (VO, IM, IV...)" className={iCn} />
                    <input {...register(`medications.${i}.frequency` as const)} placeholder="Posologia (ex: 8/8h)" className={iCn} />
                    <input {...register(`medications.${i}.duration` as const)} placeholder="Duração (ex: 7 dias)" className={cn(iCn, 'col-span-2')} />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Field label="Observações">
          <textarea {...register('notes')} rows={2} placeholder="Orientações gerais..." className={cn(iCn, 'resize-none')} />
        </Field>

        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
