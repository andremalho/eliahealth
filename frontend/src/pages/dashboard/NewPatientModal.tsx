import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { createPatient } from '../../api/patients.api';
import { createPregnancy } from '../../api/pregnancies.api';
import { cn } from '../../utils/cn';

const schema = z.object({
  fullName: z.string().min(1, 'Nome obrigatório'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gaMethod: z.enum(['dum', 'dpp', 'ultrasound', 'ivf', 'manual']),
  referenceDate: z.string().optional(),
  usWeeks: z.string().optional(),
  usDays: z.string().optional(),
  manualWeeks: z.string().optional(),
  manualDays: z.string().optional(),
});

const dateLabels: Record<string, string> = {
  dum: 'DUM (Data da Última Menstruação)',
  dpp: 'DPP (Data Provável do Parto)',
  ivf: 'Data da Transferência (FIV)',
};

type FormData = z.infer<typeof schema>;

export default function NewPatientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gaMethod: 'dum' },
  });

  const gaMethod = watch('gaMethod');
  const needsDate = gaMethod === 'dum' || gaMethod === 'dpp' || gaMethod === 'ivf';
  const isUltrasound = gaMethod === 'ultrasound';
  const isManual = gaMethod === 'manual';

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const patient = await createPatient({
        fullName: data.fullName,
        cpf: data.cpf,
        email: data.email || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
      });

      // Build pregnancy payload based on method
      const pregPayload: Record<string, unknown> = { gravida: 1, para: 0, abortus: 0 };

      if (data.gaMethod === 'dum') {
        pregPayload.lmpDate = data.referenceDate;
        pregPayload.gaMethod = 'lmp';
      } else if (data.gaMethod === 'dpp') {
        pregPayload.edd = data.referenceDate;
        pregPayload.gaMethod = 'lmp';
      } else if (data.gaMethod === 'ultrasound') {
        pregPayload.usDatingDate = data.referenceDate;
        pregPayload.usDatingGaDays = (parseInt(data.usWeeks ?? '0', 10)) * 7 + parseInt(data.usDays ?? '0', 10);
        pregPayload.gaMethod = 'ultrasound';
      } else if (data.gaMethod === 'ivf') {
        pregPayload.ivfTransferDate = data.referenceDate;
        pregPayload.gaMethod = 'ivf';
      } else if (data.gaMethod === 'manual') {
        pregPayload.gaWeeks = parseInt(data.manualWeeks ?? '0', 10);
        pregPayload.gaDays = parseInt(data.manualDays ?? '0', 10);
        pregPayload.gaMethod = 'lmp';
      }

      await createPregnancy(patient.id, pregPayload as any);
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    // Manual validation for conditional fields
    if (needsDate && !data.referenceDate) return;
    if (isUltrasound && (!data.referenceDate || !data.usWeeks)) return;
    if (isManual && !data.manualWeeks) return;
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Nova Gestante</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao cadastrar. Verifique os dados e tente novamente.
            </div>
          )}

          <Field label="Nome completo *" error={errors.fullName?.message}>
            <input {...register('fullName')} placeholder="Maria da Silva" className={inputCn(!!errors.fullName)} />
          </Field>

          <Field label="CPF *" error={errors.cpf?.message}>
            <input {...register('cpf')} placeholder="12345678901" maxLength={11} className={inputCn(!!errors.cpf)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="email@exemplo.com" className={inputCn(!!errors.email)} />
            </Field>
            <Field label="Telefone">
              <input {...register('phone')} placeholder="11999998888" className={inputCn(false)} />
            </Field>
          </div>

          <Field label="Data de nascimento">
            <input {...register('dateOfBirth')} type="date" className={inputCn(false)} />
          </Field>

          <hr className="my-2" />
          <p className="text-sm font-medium text-navy">Dados da gestação</p>

          {/* Method selector — always visible */}
          <Field label="Método de datação *" error={errors.gaMethod?.message}>
            <select {...register('gaMethod')} className={inputCn(!!errors.gaMethod)}>
              <option value="dum">DUM</option>
              <option value="dpp">DPP</option>
              <option value="ultrasound">Ultrassonografia</option>
              <option value="ivf">FIV</option>
              <option value="manual">Manual</option>
            </select>
          </Field>

          {/* DUM / DPP / FIV — single date field */}
          {needsDate && (
            <Field label={`${dateLabels[gaMethod]} *`} error={errors.referenceDate?.message}>
              <input {...register('referenceDate')} type="date" className={inputCn(!!errors.referenceDate)} />
            </Field>
          )}

          {/* Ultrasound — date + weeks/days */}
          {isUltrasound && (
            <>
              <Field label="Data da Ultrassonografia *" error={errors.referenceDate?.message}>
                <input {...register('referenceDate')} type="date" className={inputCn(!!errors.referenceDate)} />
              </Field>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idade Gestacional no exame *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input {...register('usWeeks')} type="number" min={4} max={42} placeholder="Semanas" className={inputCn(false)} />
                    <span className="text-xs text-gray-400 mt-0.5 block">semanas</span>
                  </div>
                  <div>
                    <input {...register('usDays')} type="number" min={0} max={6} placeholder="0-6" className={inputCn(false)} />
                    <span className="text-xs text-gray-400 mt-0.5 block">dias</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Manual — weeks/days only */}
          {isManual && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idade Gestacional atual *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input {...register('manualWeeks')} type="number" min={4} max={42} placeholder="Semanas" className={inputCn(false)} />
                  <span className="text-xs text-gray-400 mt-0.5 block">semanas</span>
                </div>
                <div>
                  <input {...register('manualDays')} type="number" min={0} max={6} placeholder="0-6" className={inputCn(false)} />
                  <span className="text-xs text-gray-400 mt-0.5 block">dias</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2"
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac transition',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
