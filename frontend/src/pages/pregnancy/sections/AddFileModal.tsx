import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFile } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';

interface Props { pregnancyId: string; onClose: () => void }

interface FormData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: string;
  description: string;
  isVisibleToPatient: boolean;
}

const FILE_TYPES = [
  { v: 'document', l: 'Documento', mime: 'application/pdf' },
  { v: 'image', l: 'Imagem', mime: 'image/jpeg' },
  { v: 'exam', l: 'Exame', mime: 'application/pdf' },
  { v: 'report', l: 'Laudo', mime: 'application/pdf' },
  { v: 'other', l: 'Outro', mime: 'application/octet-stream' },
];

export default function AddFileModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { fileType: 'document' },
  });

  const fileType = watch('fileType');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const preset = FILE_TYPES.find((t) => t.v === data.fileType);
      const payload: Record<string, unknown> = {
        fileName: data.fileName,
        fileType: data.fileType,
        mimeType: data.mimeType || preset?.mime || 'application/octet-stream',
        fileSize: data.fileSize ? parseInt(data.fileSize, 10) : 0,
        fileUrl: data.fileUrl,
      };
      if (data.description) payload.description = data.description;
      if (data.isVisibleToPatient) payload.isVisibleToPatient = true;
      return createFile(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title="Novo arquivo">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
        {mutation.error && <ErrorBanner />}
        <p className="text-xs text-gray-500 -mt-2">Cadastro por URL externa. Upload direto será adicionado em breve.</p>
        <Field label="Nome do arquivo *">
          <input {...register('fileName', { required: true })} type="text" placeholder="Ex: USG 20s.pdf" className={iCn} />
        </Field>
        <Field label="URL do arquivo *">
          <input {...register('fileUrl', { required: true })} type="url" placeholder="https://..." className={iCn} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <select {...register('fileType')} className={iCn}>
              {FILE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </Field>
          <Field label="Tamanho (bytes)">
            <input {...register('fileSize')} type="number" placeholder="Opcional" className={iCn} />
          </Field>
        </div>
        <Field label="Descrição">
          <input {...register('description')} type="text" className={iCn} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('isVisibleToPatient')} type="checkbox" className="w-4 h-4 text-lilac rounded focus:ring-lilac" />
          Visível para a paciente
        </label>
        <SubmitBar onClose={onClose} pending={isSubmitting || mutation.isPending} />
      </form>
    </Wrap>
  );
}
