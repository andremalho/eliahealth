import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePatient } from '../../../api/pregnancies.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';

interface Props {
  patientId: string;
  initial: any;
  onClose: () => void;
}

interface FormData {
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

function maskCpf(value: string): string {
  const v = (value ?? '').replace(/\D/g, '').slice(0, 11);
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function EditPatientDataModal({ patientId, initial, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      fullName: initial?.fullName ?? '',
      cpf: maskCpf(initial?.cpf ?? ''),
      dateOfBirth: initial?.dateOfBirth ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      zipCode: initial?.zipCode ?? '',
    },
  });

  const cpf = watch('cpf');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        fullName: data.fullName,
        cpf: data.cpf.replace(/\D/g, ''),
      };
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.address) payload.address = data.address;
      if (data.city) payload.city = data.city;
      if (data.state) payload.state = data.state;
      if (data.zipCode) payload.zipCode = data.zipCode;
      return updatePatient(patientId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient'] });
      qc.invalidateQueries({ queryKey: ['pregnancies'] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Editar dados da paciente" max="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}

        <Field label="Nome completo *">
          <input {...register('fullName', { required: true })} type="text" className={iCn} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF *">
            <input
              value={cpf}
              onChange={(e) => setValue('cpf', maskCpf(e.target.value))}
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              className={iCn}
            />
          </Field>
          <Field label="Data de nascimento">
            <input {...register('dateOfBirth')} type="date" className={iCn} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="E-mail">
            <input {...register('email')} type="email" placeholder="email@exemplo.com" className={iCn} />
          </Field>
          <Field label="Telefone">
            <input {...register('phone')} type="text" placeholder="11999998888" className={iCn} />
          </Field>
        </div>

        <Field label="Endereço">
          <input {...register('address')} type="text" className={iCn} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Cidade">
              <input {...register('city')} type="text" className={iCn} />
            </Field>
          </div>
          <Field label="UF">
            <input {...register('state')} type="text" maxLength={2} className={iCn} />
          </Field>
        </div>

        <Field label="CEP">
          <input {...register('zipCode')} type="text" className={iCn} />
        </Field>

        <p className="text-[10px] text-gray-400 -mt-1">
          O CPF é a chave de acesso da paciente ao portal. Mantenha email e telefone atualizados — são usados para enviar o código de login.
        </p>

        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
