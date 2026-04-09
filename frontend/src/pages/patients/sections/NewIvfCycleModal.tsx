import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createIvfCycle,
  updateIvfCycle,
  IVF_TYPE_LABELS,
  STIM_PROTOCOL_LABELS,
  FERT_METHOD_LABELS,
  TRIGGER_LABELS,
  TRANSFER_TYPE_LABELS,
  PGT_LABELS,
  OHSS_LABELS,
  type CreateIvfCycleDto,
  type IvfCycle,
  type IVFCycleType,
  type StimulationProtocol,
  type FertilizationMethod,
  type TriggerType,
  type TransferType,
  type PGTType,
  type OHSSGrade,
} from '../../../api/assisted-reproduction.api';
import { cn } from '../../../utils/cn';

interface FormData {
  cycleNumber: string;
  cycleType: IVFCycleType;
  stimulationProtocol: StimulationProtocol;
  fertilizationMethod: FertilizationMethod;
  stimulationStartDate: string;

  totalFSHDose: string;
  stimulationDays: string;
  peakEstradiol: string;
  triggerType: TriggerType | '';
  triggerDate: string;

  oocyteRetrievalDate: string;
  totalOocytesRetrieved: string;
  miiOocytes: string;
  fertilized2PN: string;
  blastocysts: string;

  pgtPerformed: boolean;
  pgtType: PGTType | '';
  euploidEmbryos: string;
  cryopreservedEmbryos: string;

  transferDate: string;
  embryosTransferred: string;
  transferType: TransferType | '';
  endometrialThicknessAtTransfer: string;

  ovarianHyperstimulationSyndrome: boolean;
  ohssGrade: OHSSGrade | '';
  betaHcgValue: string;
  clinicalPregnancy: boolean;
  liveBirth: boolean;
  notes: string;
}

export default function NewIvfCycleModal({
  patientId,
  cycle,
  onClose,
}: {
  patientId: string;
  cycle?: IvfCycle;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!cycle;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: cycle
      ? {
          cycleNumber: cycle.cycleNumber.toString(),
          cycleType: cycle.cycleType,
          stimulationProtocol: cycle.stimulationProtocol,
          fertilizationMethod: cycle.fertilizationMethod,
          stimulationStartDate: cycle.stimulationStartDate ?? '',
          totalFSHDose: cycle.totalFSHDose?.toString() ?? '',
          stimulationDays: cycle.stimulationDays?.toString() ?? '',
          peakEstradiol: cycle.peakEstradiol?.toString() ?? '',
          triggerType: cycle.triggerType ?? '',
          triggerDate: cycle.triggerDate ?? '',
          oocyteRetrievalDate: cycle.oocyteRetrievalDate ?? '',
          totalOocytesRetrieved: cycle.totalOocytesRetrieved?.toString() ?? '',
          miiOocytes: cycle.miiOocytes?.toString() ?? '',
          fertilized2PN: cycle.fertilized2PN?.toString() ?? '',
          blastocysts: cycle.blastocysts?.toString() ?? '',
          pgtPerformed: cycle.pgtPerformed,
          pgtType: cycle.pgtType ?? '',
          euploidEmbryos: cycle.euploidEmbryos?.toString() ?? '',
          cryopreservedEmbryos: cycle.cryopreservedEmbryos?.toString() ?? '',
          transferDate: cycle.transferDate ?? '',
          embryosTransferred: cycle.embryosTransferred?.toString() ?? '',
          transferType: cycle.transferType ?? '',
          endometrialThicknessAtTransfer: cycle.endometrialThicknessAtTransfer?.toString() ?? '',
          ovarianHyperstimulationSyndrome: cycle.ovarianHyperstimulationSyndrome,
          ohssGrade: cycle.ohssGrade ?? '',
          betaHcgValue: cycle.betaHcgValue?.toString() ?? '',
          clinicalPregnancy: !!cycle.clinicalPregnancy,
          liveBirth: !!cycle.liveBirth,
          notes: cycle.notes ?? '',
        }
      : {
          cycleNumber: '1',
          cycleType: 'icsi',
          stimulationProtocol: 'antagonist',
          fertilizationMethod: 'icsi',
          pgtPerformed: false,
          ovarianHyperstimulationSyndrome: false,
          clinicalPregnancy: false,
          liveBirth: false,
        },
  });

  const pgtChecked = watch('pgtPerformed');

  // Live fertilization rate
  const m2pn = parseInt(watch('fertilized2PN') || '0', 10);
  const mii = parseInt(watch('miiOocytes') || '0', 10);
  const fertRate = mii > 0 ? Math.round((m2pn / mii) * 100) : null;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateIvfCycleDto = {
        cycleNumber: Number(data.cycleNumber),
        cycleType: data.cycleType,
        stimulationProtocol: data.stimulationProtocol,
        fertilizationMethod: data.fertilizationMethod,
      };
      if (data.stimulationStartDate) dto.stimulationStartDate = data.stimulationStartDate;
      if (data.totalFSHDose) dto.totalFSHDose = Number(data.totalFSHDose);
      if (data.stimulationDays) dto.stimulationDays = Number(data.stimulationDays);
      if (data.peakEstradiol) dto.peakEstradiol = Number(data.peakEstradiol);
      if (data.triggerType) dto.triggerType = data.triggerType;
      if (data.triggerDate) dto.triggerDate = data.triggerDate;

      if (data.oocyteRetrievalDate) dto.oocyteRetrievalDate = data.oocyteRetrievalDate;
      if (data.totalOocytesRetrieved) dto.totalOocytesRetrieved = Number(data.totalOocytesRetrieved);
      if (data.miiOocytes) dto.miiOocytes = Number(data.miiOocytes);
      if (data.fertilized2PN) dto.fertilized2PN = Number(data.fertilized2PN);
      if (data.blastocysts) dto.blastocysts = Number(data.blastocysts);

      dto.pgtPerformed = data.pgtPerformed;
      if (data.pgtType) dto.pgtType = data.pgtType;
      if (data.euploidEmbryos) dto.euploidEmbryos = Number(data.euploidEmbryos);
      if (data.cryopreservedEmbryos) dto.cryopreservedEmbryos = Number(data.cryopreservedEmbryos);

      if (data.transferDate) dto.transferDate = data.transferDate;
      if (data.embryosTransferred) dto.embryosTransferred = Number(data.embryosTransferred);
      if (data.transferType) dto.transferType = data.transferType;
      if (data.endometrialThicknessAtTransfer)
        dto.endometrialThicknessAtTransfer = Number(data.endometrialThicknessAtTransfer);

      dto.ovarianHyperstimulationSyndrome = data.ovarianHyperstimulationSyndrome;
      if (data.ohssGrade) dto.ohssGrade = data.ohssGrade;
      if (data.betaHcgValue) dto.betaHcgValue = Number(data.betaHcgValue);
      dto.clinicalPregnancy = data.clinicalPregnancy;
      dto.liveBirth = data.liveBirth;
      if (data.notes) dto.notes = data.notes;
      if (isEdit && cycle) {
        return updateIvfCycle(patientId, cycle.id, dto);
      }
      return createIvfCycle(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ivf-cycles', patientId] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">
            {isEdit ? 'Editar ciclo de FIV / ICSI' : 'Novo ciclo de FIV / ICSI'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar ciclo. Verifique os dados.
            </div>
          )}

          <Section title="Identificação">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Ciclo nº *" error={errors.cycleNumber?.message}>
                <input
                  {...register('cycleNumber', { required: 'Obrigatório' })}
                  type="number"
                  min={1}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Tipo *">
                <select {...register('cycleType')} className={inputCn(false)}>
                  {Object.entries(IVF_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Método fertilização *">
                <select {...register('fertilizationMethod')} className={inputCn(false)}>
                  {Object.entries(FERT_METHOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Estimulação">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Protocolo *">
                <select {...register('stimulationProtocol')} className={inputCn(false)}>
                  {Object.entries(STIM_PROTOCOL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Início estimulação">
                <input {...register('stimulationStartDate')} type="date" className={inputCn(false)} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="FSH total (UI)">
                <input
                  {...register('totalFSHDose')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Dias de estim.">
                <input
                  {...register('stimulationDays')}
                  type="number"
                  min={0}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="E2 pico (pg/mL)">
                <input
                  {...register('peakEstradiol')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Trigger">
                <select {...register('triggerType')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Data trigger">
                <input {...register('triggerDate')} type="date" className={inputCn(false)} />
              </Field>
            </div>
          </Section>

          <Section title="Captação e fertilização">
            <Field label="Data da captação">
              <input {...register('oocyteRetrievalDate')} type="date" className={inputCn(false)} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Oócitos totais">
                <input
                  {...register('totalOocytesRetrieved')}
                  type="number"
                  min={0}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="MII (maduros)">
                <input
                  {...register('miiOocytes')}
                  type="number"
                  min={0}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="2PN (fertilizados)">
                <input
                  {...register('fertilized2PN')}
                  type="number"
                  min={0}
                  className={inputCn(false)}
                />
              </Field>
            </div>
            {fertRate !== null && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase">Taxa fertilização</span>
                <span className="text-lg font-bold text-navy">{fertRate}%</span>
              </div>
            )}
            <Field label="Blastocistos">
              <input
                {...register('blastocysts')}
                type="number"
                min={0}
                className={inputCn(false)}
              />
            </Field>
          </Section>

          <Section title="PGT e criopreservação">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('pgtPerformed')} />
              PGT realizado
            </label>
            {pgtChecked && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo PGT">
                  <select {...register('pgtType')} className={inputCn(false)}>
                    <option value="">—</option>
                    {Object.entries(PGT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Embriões euplóides">
                  <input
                    {...register('euploidEmbryos')}
                    type="number"
                    min={0}
                    className={inputCn(false)}
                  />
                </Field>
              </div>
            )}
            <Field label="Embriões criopreservados">
              <input
                {...register('cryopreservedEmbryos')}
                type="number"
                min={0}
                className={inputCn(false)}
              />
            </Field>
          </Section>

          <Section title="Transferência">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data">
                <input {...register('transferDate')} type="date" className={inputCn(false)} />
              </Field>
              <Field label="Tipo">
                <select {...register('transferType')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(TRANSFER_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Embriões transferidos">
                <input
                  {...register('embryosTransferred')}
                  type="number"
                  min={0}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Endométrio TX (mm)">
                <input
                  {...register('endometrialThicknessAtTransfer')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Desfecho">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('ovarianHyperstimulationSyndrome')} />
              OHSS presente
            </label>
            <Field label="Grau OHSS">
              <select {...register('ohssGrade')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(OHSS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="β-hCG">
              <input
                {...register('betaHcgValue')}
                type="number"
                step="0.1"
                className={inputCn(false)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('clinicalPregnancy')} />
                Gestação clínica
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('liveBirth')} />
                Nascido vivo
              </label>
            </div>
            <Field label="Observações">
              <textarea {...register('notes')} rows={2} className={inputCn(false)} />
            </Field>
          </Section>

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
              {isEdit ? 'Atualizar ciclo' : 'Salvar ciclo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">{title}</h3>
      {children}
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
