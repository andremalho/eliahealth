import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVaginalSwab } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';

interface Props { pregnancyId: string; onClose: () => void }

interface FormData {
  collectionDate: string;
  examType: string;
  result: string;
  resultDropdown: string;
  labName: string;
  notes: string;
}

const EXAM_TYPES = [
  'Streptococcus do grupo B (GBS)',
  'Cultura vaginal',
  'Bacterioscopia',
  'PCR HPV',
  'Citopatológico (Papanicolau)',
  'Outro',
];

export default function AddVaginalSwabModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { collectionDate: new Date().toISOString().split('T')[0] },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        collectionDate: data.collectionDate,
        examType: data.examType,
      };
      if (data.result) payload.result = data.result;
      if (data.resultDropdown) payload.resultDropdown = data.resultDropdown;
      if (data.labName) payload.labName = data.labName;
      if (data.notes) payload.notes = data.notes;
      return createVaginalSwab(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vaginal-swabs', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Nova coleta vaginal">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data da coleta *">
            <input {...register('collectionDate', { required: true })} type="date" className={iCn} />
          </Field>
          <Field label="Exame *">
            <select {...register('examType', { required: true })} className={iCn}>
              <option value="">Selecione...</option>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Resultado">
          <select {...register('resultDropdown')} className={iCn}>
            <option value="">—</option>
            <option value="positive">Positivo</option>
            <option value="negative">Negativo</option>
            <option value="pending">Aguardando</option>
            <option value="inconclusive">Inconclusivo</option>
          </select>
        </Field>
        <Field label="Detalhes do resultado">
          <input {...register('result')} type="text" placeholder="Texto livre se necessário" className={iCn} />
        </Field>
        <Field label="Laboratório">
          <input {...register('labName')} type="text" className={iCn} />
        </Field>
        <Field label="Observações">
          <input {...register('notes')} type="text" className={iCn} />
        </Field>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
