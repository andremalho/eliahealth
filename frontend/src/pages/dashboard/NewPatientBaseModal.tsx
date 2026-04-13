import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { createPatient } from '../../api/patients.api';
import { cn } from '../../utils/cn';

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const schema = z.object({
  fullName: z.string().min(1, 'Nome obrigatorio'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 digitos'),
  email: z.string().email('E-mail invalido').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  height: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  specialty: 'obstetrics' | 'gynecology' | 'clinical' | 'ultrasound';
  onClose: () => void;
  onCreated: (patientId: string, patientName: string) => void;
}

const specialtyTitles: Record<string, string> = {
  obstetrics: 'Obstetricia',
  gynecology: 'Ginecologia',
  clinical: 'Clinica Medica',
  ultrasound: 'Ultrassonografia',
};

export default function NewPatientBaseModal({ specialty, onClose, onCreated }: Props) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => createPatient({
      fullName: data.fullName,
      cpf: data.cpf,
      email: data.email || undefined,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      maritalStatus: data.maritalStatus || undefined,
      profession: data.profession || undefined,
      education: data.education || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      height: data.height ? Number(data.height) : undefined,
    }),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onCreated(patient.id, patient.fullName);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">Identificacao — {specialtyTitles[specialty]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {(mutation.error as any)?.response?.data?.message ?? 'Erro ao cadastrar. Verifique os dados e tente novamente.'}
            </div>
          )}

          {/* Dados pessoais */}
          <Field label="Nome completo *" error={errors.fullName?.message}>
            <input {...register('fullName')} placeholder="Maria da Silva" className={inputCn(!!errors.fullName)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="CPF *" error={errors.cpf?.message}>
              <input {...register('cpf')} placeholder="12345678901" maxLength={11} className={inputCn(!!errors.cpf)} />
            </Field>
            <Field label="Data de nascimento">
              <input {...register('dateOfBirth')} type="date" className={inputCn(false)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="email@exemplo.com" className={inputCn(!!errors.email)} />
            </Field>
            <Field label="Telefone">
              <input {...register('phone')} placeholder="11999998888" className={inputCn(false)} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Estado civil">
              <select {...register('maritalStatus')} className={inputCn(false)}>
                <option value="">—</option>
                <option value="solteira">Solteira</option>
                <option value="casada">Casada</option>
                <option value="uniao_estavel">Uniao estavel</option>
                <option value="divorciada">Divorciada</option>
                <option value="viuva">Viuva</option>
              </select>
            </Field>
            <Field label="Profissao">
              <input {...register('profession')} placeholder="Ex: Professora" className={inputCn(false)} />
            </Field>
            <Field label="Escolaridade">
              <select {...register('education')} className={inputCn(false)}>
                <option value="">—</option>
                <option value="fundamental">Fundamental</option>
                <option value="medio">Medio</option>
                <option value="superior">Superior</option>
                <option value="pos_graduacao">Pos-graduacao</option>
              </select>
            </Field>
          </div>

          {/* Endereco */}
          <Field label="Endereco">
            <input {...register('address')} placeholder="Rua, numero, complemento" className={inputCn(false)} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Cidade">
              <input {...register('city')} placeholder="Sao Paulo" className={inputCn(false)} />
            </Field>
            <Field label="UF">
              <select {...register('state')} className={inputCn(false)}>
                <option value="">—</option>
                {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </Field>
            <Field label="CEP">
              <input {...register('zipCode')} placeholder="01234567" maxLength={8} className={inputCn(false)} />
            </Field>
          </div>

          {/* Altura */}
          <Field label="Altura (cm)">
            <input {...register('height')} type="number" step="0.1" min="100" max="220" placeholder="Ex: 165" className={inputCn(false)} />
          </Field>

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
              Cadastrar e continuar
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
