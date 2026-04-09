import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { createPatient } from '../../api/patients.api';
import { cn } from '../../utils/cn';

interface FormData {
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  phone: string;
  email: string;
}

/**
 * Cadastro de paciente sem vínculo a uma gestação. Para mulheres em
 * acompanhamento ginecológico de rotina, contracepção, menopausa, etc.
 * Para gestantes, usar o fluxo "Nova Gestante" no Dashboard.
 */
export default function NewPatientStandaloneModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return createPatient({
        fullName: data.fullName.trim(),
        cpf: data.cpf.replace(/\D/g, ''),
        dateOfBirth: data.dateOfBirth || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      });
    },
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      onClose();
      // Navega para o prontuário recém-criado
      navigate(`/patients/${patient.id}`);
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-navy">Nova paciente</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Para acompanhamento ginecológico, contracepção, menopausa, etc.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {((mutation.error as any)?.response?.data?.message as string) ??
                'Erro ao cadastrar paciente. Verifique os dados e tente novamente.'}
            </div>
          )}

          <Field label="Nome completo *" error={errors.fullName?.message}>
            <input
              {...register('fullName', { required: 'Obrigatório' })}
              placeholder="Maria da Silva"
              className={inputCn(!!errors.fullName)}
              autoFocus
            />
          </Field>

          <Field label="CPF *" error={errors.cpf?.message}>
            <input
              {...register('cpf', {
                required: 'Obrigatório',
                pattern: {
                  value: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$|^\d{11}$/,
                  message: 'CPF deve ter 11 dígitos',
                },
              })}
              placeholder="000.000.000-00"
              maxLength={14}
              className={inputCn(!!errors.cpf)}
            />
          </Field>

          <Field label="Data de nascimento">
            <input {...register('dateOfBirth')} type="date" className={inputCn(false)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefone">
              <input
                {...register('phone')}
                placeholder="11999998888"
                className={inputCn(false)}
              />
            </Field>
            <Field label="E-mail">
              <input
                {...register('email')}
                type="email"
                placeholder="email@exemplo.com"
                className={inputCn(false)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2"
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Cadastrar paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
