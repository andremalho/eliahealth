import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFile, updateFile } from '../../../api/pregnancy.api';
import { Wrap, Field, SubmitBar, ErrorBanner, iCn } from './AddVaccineModal';

interface Props { pregnancyId: string; initial?: any; onClose: () => void }

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

export default function AddFileModal({ pregnancyId, initial, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      fileName: initial?.fileName ?? initial?.file_name ?? '',
      fileUrl: initial?.fileUrl ?? initial?.file_url ?? '',
      fileType: initial?.fileType ?? initial?.file_type ?? 'document',
      mimeType: initial?.mimeType ?? initial?.mime_type ?? '',
      fileSize: initial?.fileSize?.toString() ?? initial?.file_size?.toString() ?? '',
      description: initial?.description ?? '',
      isVisibleToPatient: !!initial?.isVisibleToPatient ?? !!initial?.is_visible_to_patient,
    } as Partial<FormData>,
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
      payload.isVisibleToPatient = !!data.isVisibleToPatient;
      return isEdit ? updateFile(initial.id, payload) : createFile(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files', pregnancyId] });
      onClose();
    },
  });

  return (
    <Wrap onClose={onClose} title={isEdit ? 'Editar arquivo' : 'Novo arquivo'}>
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
