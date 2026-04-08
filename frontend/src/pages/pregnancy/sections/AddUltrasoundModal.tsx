import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUltrasound } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';
import ExtractFileField from './FileUploadField';
import { cn } from '../../../utils/cn';

interface Props { pregnancyId: string; onClose: () => void }

interface FormData {
  examType: string;
  examDate: string;
  operatorName: string;
  equipmentModel: string;
  finalReport: string;
}

const EXAM_TYPES = [
  { v: 'first_trimester', l: 'USG 1º trimestre' },
  { v: 'morphology', l: 'Morfológica (2º Tri)' },
  { v: 'morphology_3t', l: 'Morfológica (3º Tri)' },
  { v: 'obstetric', l: 'USG obstétrica' },
  { v: 'doppler', l: 'Doppler' },
  { v: 'transvaginal', l: 'Transvaginal' },
  { v: 'biophysical_profile', l: 'Perfil biofísico' },
  { v: 'other', l: 'Outro' },
];

export default function AddUltrasoundModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { examDate: new Date().toISOString().split('T')[0] },
  });

  const handleExtracted = (data: any) => {
    if (data?.examType) setValue('examType', data.examType);
    if (data?.examDate) setValue('examDate', data.examDate);
    if (data?.operatorName) setValue('operatorName', data.operatorName);
    if (data?.equipmentModel) setValue('equipmentModel', data.equipmentModel);
    if (data?.finalReport) setValue('finalReport', data.finalReport);
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: Record<string, unknown> = {
        examType: data.examType,
        examDate: data.examDate,
      };
      if (data.operatorName) payload.operatorName = data.operatorName;
      if (data.equipmentModel) payload.equipmentModel = data.equipmentModel;
      if (data.finalReport) payload.finalReport = data.finalReport;
      return createUltrasound(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ultrasounds', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Nova ultrassonografia" max="max-w-lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <ExtractFileField extractType="ultrasound" onExtracted={handleExtracted} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de exame *">
            <select {...register('examType', { required: true })} className={iCn}>
              <option value="">Selecione...</option>
              {EXAM_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </Field>
          <Field label="Data do exame *">
            <input {...register('examDate', { required: true })} type="date" className={iCn} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Operador">
            <input {...register('operatorName')} type="text" placeholder="Nome do médico" className={iCn} />
          </Field>
          <Field label="Equipamento">
            <input {...register('equipmentModel')} type="text" placeholder="Modelo" className={iCn} />
          </Field>
        </div>
        <Field label="Laudo">
          <textarea {...register('finalReport')} rows={5} placeholder="Laudo final do exame..." className={cn(iCn, 'resize-none')} />
        </Field>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
