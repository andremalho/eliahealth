import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createOICycle,
  OI_INDICATION_LABELS,
  OI_PROTOCOL_LABELS,
  OI_OUTCOME_LABELS,
  OHSS_LABELS,
  TRIGGER_LABELS,
  type CreateOvulationInductionCycleDto,
  type OIIndication,
  type OIProtocol,
  type OICycleOutcome,
  type OHSSGrade,
  type TriggerType,
} from '../../../api/assisted-reproduction.api';
import { cn } from '../../../utils/cn';

interface FormData {
  cycleNumber: string;
  cycleStartDate: string;
  indication: OIIndication;
  protocol: OIProtocol;
  startingDose: string;
  startingDoseUnit: string;
  triggerType: TriggerType | '';
  triggerDate: string;
  outcomeType: OICycleOutcome | '';
  folliclesAtTrigger: string;
  endometrialThicknessAtTrigger: string;
  estradiolAtTrigger: string;
  ovarianHyperstimulationSyndrome: boolean;
  ohssGrade: OHSSGrade | '';
  betaHcgValue: string;
  clinicalPregnancy: boolean;
  notes: string;
}

export default function NewOICycleModal({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      cycleNumber: '1',
      cycleStartDate: new Date().toISOString().split('T')[0],
      indication: 'anovulation_who_ii',
      protocol: 'letrozole',
      startingDose: '2.5',
      startingDoseUnit: 'mg',
      ovarianHyperstimulationSyndrome: false,
      clinicalPregnancy: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateOvulationInductionCycleDto = {
        cycleNumber: Number(data.cycleNumber),
        cycleStartDate: data.cycleStartDate,
        indication: data.indication,
        protocol: data.protocol,
        startingDose: Number(data.startingDose),
        startingDoseUnit: data.startingDoseUnit,
      };
      if (data.triggerType) dto.triggerType = data.triggerType;
      if (data.triggerDate) dto.triggerDate = data.triggerDate;
      if (data.outcomeType) dto.outcomeType = data.outcomeType;
      if (data.folliclesAtTrigger) dto.folliclesAtTrigger = Number(data.folliclesAtTrigger);
      if (data.endometrialThicknessAtTrigger)
        dto.endometrialThicknessAtTrigger = Number(data.endometrialThicknessAtTrigger);
      if (data.estradiolAtTrigger) dto.estradiolAtTrigger = Number(data.estradiolAtTrigger);
      dto.ovarianHyperstimulationSyndrome = data.ovarianHyperstimulationSyndrome;
      if (data.ohssGrade) dto.ohssGrade = data.ohssGrade;
      if (data.betaHcgValue) dto.betaHcgValue = Number(data.betaHcgValue);
      dto.clinicalPregnancy = data.clinicalPregnancy;
      if (data.notes) dto.notes = data.notes;
      return createOICycle(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oi-cycles', patientId] });
      onClose();
    },
  });

  return (
    <Modal title="Novo ciclo de indução" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
        {mutation.error && <ErrorBanner />}

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
            <Field label="Data de início *">
              <input
                {...register('cycleStartDate', { required: 'Obrigatório' })}
                type="date"
                className={inputCn(false)}
              />
            </Field>
            <Field label="Indicação *">
              <select {...register('indication')} className={inputCn(false)}>
                {Object.entries(OI_INDICATION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Protocolo">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Protocolo *">
              <select {...register('protocol')} className={inputCn(false)}>
                {Object.entries(OI_PROTOCOL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dose inicial *">
              <input
                {...register('startingDose', { required: 'Obrigatório' })}
                type="number"
                step="0.1"
                className={inputCn(false)}
              />
            </Field>
            <Field label="Unidade *">
              <select {...register('startingDoseUnit')} className={inputCn(false)}>
                <option value="mg">mg</option>
                <option value="UI">UI</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Trigger e monitorização">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de trigger">
              <select {...register('triggerType')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data do trigger">
              <input {...register('triggerDate')} type="date" className={inputCn(false)} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Folículos no trigger">
              <input
                {...register('folliclesAtTrigger')}
                type="number"
                min={0}
                className={inputCn(false)}
              />
            </Field>
            <Field label="Endométrio (mm)">
              <input
                {...register('endometrialThicknessAtTrigger')}
                type="number"
                step="0.1"
                className={inputCn(false)}
              />
            </Field>
            <Field label="E2 (pg/mL)">
              <input
                {...register('estradiolAtTrigger')}
                type="number"
                step="0.1"
                className={inputCn(false)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Desfecho">
          <Field label="Desfecho do ciclo">
            <select {...register('outcomeType')} className={inputCn(false)}>
              <option value="">—</option>
              {Object.entries(OI_OUTCOME_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="β-hCG">
              <input
                {...register('betaHcgValue')}
                type="number"
                step="0.1"
                className={inputCn(false)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm mt-7">
              <input type="checkbox" {...register('clinicalPregnancy')} />
              Gestação clínica
            </label>
          </div>
          <Field label="Observações">
            <textarea {...register('notes')} rows={2} className={inputCn(false)} />
          </Field>
        </Section>

        <FormActions onClose={onClose} isSubmitting={isSubmitting || mutation.isPending} />
      </form>
    </Modal>
  );
}

// ── Helpers ──

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
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
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner() {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
      Erro ao registrar ciclo. Verifique os dados.
    </div>
  );
}

function FormActions({
  onClose,
  isSubmitting,
}: {
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
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
        disabled={isSubmitting}
        className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar ciclo
      </button>
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
