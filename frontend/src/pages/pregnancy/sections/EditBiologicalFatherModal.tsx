import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertBiologicalFather } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';
import { cn } from '../../../utils/cn';

interface Props {
  pregnancyId: string;
  initial?: any;
  onClose: () => void;
}

interface FormData {
  name: string;
  age: string;
  bloodTypeABO: string;
  bloodTypeRH: string;
  ethnicity: string;
  occupation: string;
  geneticConditions: string;
  infectiousDiseases: string;
  familyHistory: string;
  observations: string;
}

export default function EditBiologicalFatherModal({ pregnancyId, initial, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      name: initial?.name ?? '',
      age: initial?.age?.toString() ?? '',
      bloodTypeABO: initial?.bloodTypeABO ?? initial?.blood_type_abo ?? '',
      bloodTypeRH: initial?.bloodTypeRH ?? initial?.blood_type_rh ?? '',
      ethnicity: initial?.ethnicity ?? '',
      occupation: initial?.occupation ?? '',
      geneticConditions: initial?.geneticConditions ?? initial?.genetic_conditions ?? '',
      infectiousDiseases: initial?.infectiousDiseases ?? initial?.infectious_diseases ?? '',
      familyHistory: initial?.familyHistory ?? initial?.family_history ?? '',
      observations: initial?.observations ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {};
      if (data.name) payload.name = data.name;
      if (data.age) payload.age = parseInt(data.age, 10);
      if (data.bloodTypeABO) payload.bloodTypeABO = data.bloodTypeABO;
      if (data.bloodTypeRH) payload.bloodTypeRH = data.bloodTypeRH;
      if (data.ethnicity) payload.ethnicity = data.ethnicity;
      if (data.occupation) payload.occupation = data.occupation;
      if (data.geneticConditions) payload.geneticConditions = data.geneticConditions;
      if (data.infectiousDiseases) payload.infectiousDiseases = data.infectiousDiseases;
      if (data.familyHistory) payload.familyHistory = data.familyHistory;
      if (data.observations) payload.observations = data.observations;
      return upsertBiologicalFather(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bio-father', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Pai biológico" max="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <input {...register('name')} type="text" className={iCn} />
          </Field>
          <Field label="Idade">
            <input {...register('age')} type="number" min="10" max="100" className={iCn} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ABO">
            <select {...register('bloodTypeABO')} className={iCn}>
              <option value="">—</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </Field>
          <Field label="Rh">
            <select {...register('bloodTypeRH')} className={iCn}>
              <option value="">—</option>
              <option value="positive">+</option>
              <option value="negative">−</option>
            </select>
          </Field>
          <Field label="Etnia">
            <input {...register('ethnicity')} type="text" className={iCn} />
          </Field>
        </div>
        <Field label="Ocupação">
          <input {...register('occupation')} type="text" className={iCn} />
        </Field>
        <Field label="Condições genéticas">
          <textarea {...register('geneticConditions')} rows={2} className={cn(iCn, 'resize-none')} />
        </Field>
        <Field label="Doenças infecciosas">
          <textarea {...register('infectiousDiseases')} rows={2} className={cn(iCn, 'resize-none')} />
        </Field>
        <Field label="História familiar">
          <textarea {...register('familyHistory')} rows={2} className={cn(iCn, 'resize-none')} />
        </Field>
        <Field label="Observações">
          <textarea {...register('observations')} rows={2} className={cn(iCn, 'resize-none')} />
        </Field>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
