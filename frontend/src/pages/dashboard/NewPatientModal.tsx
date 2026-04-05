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
  referenceDate: z.string().min(1, 'Data obrigatória'),
});

const dateLabels: Record<string, string> = {
  dum: 'DUM (Data da Última Menstruação)',
  dpp: 'DPP (Data Provável do Parto)',
  ultrasound: 'Data da Ultrassonografia',
  ivf: 'Data da Transferência (FIV)',
  manual: 'Data de Referência',
};

type FormData = z.infer<typeof schema>;

export default function NewPatientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gaMethod: 'dum' },
  });

  const gaMethod = watch('gaMethod');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const patient = await createPatient({
        fullName: data.fullName,
        cpf: data.cpf,
        email: data.email || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
      });
      // Map frontend method to backend gaMethod + correct date field
      const methodMap: Record<string, string> = { dum: 'lmp', dpp: 'lmp', ultrasound: 'ultrasound', ivf: 'ivf', manual: 'lmp' };
      await createPregnancy(patient.id, {
        lmpDate: data.referenceDate,
        gaMethod: methodMap[data.gaMethod] ?? 'lmp',
        gravida: 1,
        para: 0,
        abortus: 0,
      });
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      onClose();
    },
  });

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

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
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

          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Método de datação *" error={errors.gaMethod?.message}>
              <select {...register('gaMethod')} className={inputCn(!!errors.gaMethod)}>
                <option value="dum">DUM</option>
                <option value="dpp">DPP</option>
                <option value="ultrasound">Ultrassonografia</option>
                <option value="ivf">FIV</option>
                <option value="manual">Manual</option>
              </select>
            </Field>
            <Field label={`${dateLabels[gaMethod] ?? 'Data'} *`} error={errors.referenceDate?.message}>
              <input {...register('referenceDate')} type="date" className={inputCn(!!errors.referenceDate)} />
            </Field>
          </div>

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
