import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createInfertilityWorkup,
  updateInfertilityWorkup,
  DEFINITION_LABELS,
  OVULATORY_STATUS_LABELS,
  WHO_GROUP_LABELS,
  DIAGNOSIS_LABELS,
  PRESERVATION_LABELS,
  TREATMENT_LABELS,
  type CreateInfertilityWorkupDto,
  type InfertilityWorkup,
  type InfertilityDefinition,
  type OvulatoryStatus,
  type WHOOvulationGroup,
  type InfertilityDiagnosis,
  type FertilityPreservationIndication,
  type InfertilityTreatment,
} from '../../../api/infertility-workups.api';
import { cn } from '../../../utils/cn';

interface FormData {
  workupDate: string;
  infertilityDefinition: InfertilityDefinition;
  durationMonths: string;
  ageAtPresentation: string;

  ovulatoryStatus: OvulatoryStatus | '';
  whoGroupOvulation: WHOOvulationGroup | '';

  // Reserva ovariana
  amhValue: string;
  fshValue: string;
  afcValue: string;

  // Tubário/uterino
  tubalFactor: boolean;
  hsgFindings: string;
  mullerianAnomaly: boolean;
  mullerianAnomalyType: string;

  // Fator masculino
  maleFactor: boolean;
  semenConcentration: string;
  semenProgressiveMotility: string;
  semenMorphology: string;
  dnaFragmentation: string;
  maleFertilitySpecialistReferral: boolean;

  // Diagnóstico
  primaryDiagnosis: InfertilityDiagnosis | '';

  // Preservação
  fertilityPreservation: boolean;
  preservationIndication: FertilityPreservationIndication | '';
  preservationMethod: string;
  preservationDate: string;

  // Tratamento
  treatmentPlan: InfertilityTreatment | '';
  referralToART: boolean;
  artClinicName: string;
  notes: string;
  returnDate: string;
}

const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, ...rest }, ref) => (
  <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" ref={ref} {...rest} />
    {label}
  </label>
));
Checkbox.displayName = 'Checkbox';

export default function NewInfertilityWorkupModal({
  patientId,
  workup,
  onClose,
}: {
  patientId: string;
  workup?: InfertilityWorkup;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!workup;

  // Extrai valores aninhados de JSONB para campos planos
  const reserve = workup?.ovarianReserve as
    | { amh?: { value_ng_ml?: number }; fsh?: { value?: number }; antralFollicleCount?: { value?: number } }
    | undefined;
  const semen = workup?.semenAnalysis as
    | { concentration_M_ml?: number; progressiveMotility_pct?: number; morphology_pct_kruger?: number }
    | undefined;
  const dfi = workup?.dnaFragmentation as { dfi_pct?: number } | undefined;
  const hsgFindings =
    workup?.hsg && typeof (workup.hsg as Record<string, unknown>).findings === 'string'
      ? ((workup.hsg as Record<string, unknown>).findings as string)
      : '';

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: workup
      ? {
          workupDate: workup.workupDate,
          infertilityDefinition: workup.infertilityDefinition,
          durationMonths: workup.durationMonths.toString(),
          ageAtPresentation: workup.ageAtPresentation.toString(),
          ovulatoryStatus: workup.ovulatoryStatus ?? '',
          whoGroupOvulation: workup.whoGroupOvulation ?? '',
          amhValue: reserve?.amh?.value_ng_ml?.toString() ?? '',
          fshValue: reserve?.fsh?.value?.toString() ?? '',
          afcValue: reserve?.antralFollicleCount?.value?.toString() ?? '',
          tubalFactor: !!workup.tubalFactor,
          hsgFindings,
          mullerianAnomaly: workup.mullerianAnomaly,
          mullerianAnomalyType: workup.mullerianAnomalyType ?? '',
          maleFactor: !!workup.maleFactor,
          semenConcentration: semen?.concentration_M_ml?.toString() ?? '',
          semenProgressiveMotility: semen?.progressiveMotility_pct?.toString() ?? '',
          semenMorphology: semen?.morphology_pct_kruger?.toString() ?? '',
          dnaFragmentation: dfi?.dfi_pct?.toString() ?? '',
          maleFertilitySpecialistReferral: workup.maleFertilitySpecialistReferral,
          primaryDiagnosis: workup.primaryDiagnosis ?? '',
          fertilityPreservation: workup.fertilityPreservation,
          preservationIndication: workup.preservationIndication ?? '',
          preservationMethod: workup.preservationMethod ?? '',
          preservationDate: workup.preservationDate ?? '',
          treatmentPlan: workup.treatmentPlan ?? '',
          referralToART: workup.referralToART,
          artClinicName: workup.artClinicName ?? '',
          notes: workup.notes ?? '',
          returnDate: workup.returnDate ?? '',
        }
      : {
          workupDate: new Date().toISOString().split('T')[0],
          infertilityDefinition: 'primary',
          tubalFactor: false,
          mullerianAnomaly: false,
          maleFactor: false,
          maleFertilitySpecialistReferral: false,
          fertilityPreservation: false,
          referralToART: false,
        },
  });

  const fertilityPreservationChecked = watch('fertilityPreservation');
  const mullerianChecked = watch('mullerianAnomaly');
  const referralChecked = watch('referralToART');
  const ageStr = watch('ageAtPresentation');
  const durationStr = watch('durationMonths');

  // Live evaluation flags
  const age = parseInt(ageStr ?? '0', 10);
  const duration = parseInt(durationStr ?? '0', 10);
  const expedited = age >= 35 && duration >= 6;
  const immediate = age >= 40;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateInfertilityWorkupDto = {
        workupDate: data.workupDate,
        infertilityDefinition: data.infertilityDefinition,
        durationMonths: Number(data.durationMonths),
        ageAtPresentation: Number(data.ageAtPresentation),
      };

      if (data.ovulatoryStatus) dto.ovulatoryStatus = data.ovulatoryStatus;
      if (data.whoGroupOvulation) dto.whoGroupOvulation = data.whoGroupOvulation;

      // Reserva ovariana → JSONB
      const reserve: Record<string, unknown> = {};
      if (data.amhValue) reserve.amh = { value_ng_ml: Number(data.amhValue) };
      if (data.fshValue) reserve.fsh = { value: Number(data.fshValue) };
      if (data.afcValue) reserve.antralFollicleCount = { value: Number(data.afcValue) };
      if (Object.keys(reserve).length > 0) dto.ovarianReserve = reserve;

      dto.tubalFactor = data.tubalFactor;
      if (data.hsgFindings) dto.hsg = { findings: data.hsgFindings };
      dto.mullerianAnomaly = data.mullerianAnomaly;
      if (data.mullerianAnomalyType) dto.mullerianAnomalyType = data.mullerianAnomalyType;

      dto.maleFactor = data.maleFactor;
      const semen: Record<string, unknown> = {};
      if (data.semenConcentration) semen.concentration_M_ml = Number(data.semenConcentration);
      if (data.semenProgressiveMotility)
        semen.progressiveMotility_pct = Number(data.semenProgressiveMotility);
      if (data.semenMorphology) semen.morphology_pct_kruger = Number(data.semenMorphology);
      if (Object.keys(semen).length > 0) dto.semenAnalysis = semen;

      if (data.dnaFragmentation) {
        dto.dnaFragmentation = { dfi_pct: Number(data.dnaFragmentation) };
      }
      dto.maleFertilitySpecialistReferral = data.maleFertilitySpecialistReferral;

      if (data.primaryDiagnosis) dto.primaryDiagnosis = data.primaryDiagnosis;

      dto.fertilityPreservation = data.fertilityPreservation;
      if (data.preservationIndication) dto.preservationIndication = data.preservationIndication;
      if (data.preservationMethod) dto.preservationMethod = data.preservationMethod;
      if (data.preservationDate) dto.preservationDate = data.preservationDate;

      if (data.treatmentPlan) dto.treatmentPlan = data.treatmentPlan;
      dto.referralToART = data.referralToART;
      if (data.artClinicName) dto.artClinicName = data.artClinicName;
      if (data.notes) dto.notes = data.notes;
      if (data.returnDate) dto.returnDate = data.returnDate;

      if (isEdit && workup) {
        return updateInfertilityWorkup(patientId, workup.id, dto);
      }
      return createInfertilityWorkup(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infertility-workups', patientId] });
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
            {isEdit ? 'Editar investigação de infertilidade' : 'Nova investigação de infertilidade'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar investigação. Verifique os dados.
            </div>
          )}

          {/* Definição */}
          <Section title="Definição do caso (ACOG CO 781)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data *" error={errors.workupDate?.message}>
                <input
                  {...register('workupDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(!!errors.workupDate)}
                />
              </Field>
              <Field label="Tipo de infertilidade *">
                <select {...register('infertilityDefinition')} className={inputCn(false)}>
                  {Object.entries(DEFINITION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Idade da paciente *" error={errors.ageAtPresentation?.message}>
                <input
                  {...register('ageAtPresentation', { required: 'Obrigatório' })}
                  type="number"
                  min={15}
                  max={60}
                  className={inputCn(!!errors.ageAtPresentation)}
                />
              </Field>
              <Field label="Tempo tentando (meses) *" error={errors.durationMonths?.message}>
                <input
                  {...register('durationMonths', { required: 'Obrigatório' })}
                  type="number"
                  min={0}
                  max={240}
                  className={inputCn(!!errors.durationMonths)}
                />
              </Field>
            </div>

            {/* Live flags */}
            {(expedited || immediate) && (
              <div className="flex gap-2 flex-wrap">
                {immediate && (
                  <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded">
                    Avaliação imediata (≥40 anos)
                  </span>
                )}
                {expedited && !immediate && (
                  <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded">
                    Avaliação acelerada (≥35 anos, 6 meses)
                  </span>
                )}
              </div>
            )}
          </Section>

          {/* Fator ovulatório */}
          <Section title="Fator ovulatório">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select {...register('ovulatoryStatus')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(OVULATORY_STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Grupo OMS">
                <select {...register('whoGroupOvulation')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(WHO_GROUP_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Reserva ovariana */}
          <Section title="Reserva ovariana">
            <div className="grid grid-cols-3 gap-4">
              <Field label="AMH (ng/mL)">
                <input
                  {...register('amhValue')}
                  type="number"
                  step="0.01"
                  placeholder="≥1.1 normal"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="FSH basal (mUI/mL)">
                <input
                  {...register('fshValue')}
                  type="number"
                  step="0.1"
                  placeholder="≤10 normal"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="CFA">
                <input
                  {...register('afcValue')}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="≥5 normal"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          {/* Tubário/uterino */}
          <Section title="Fator tubário / uterino">
            <Checkbox label="Fator tubário presente" {...register('tubalFactor')} />
            <Field label="Achados HSG">
              <textarea
                {...register('hsgFindings')}
                rows={2}
                placeholder="Ex: trompas pérvias bilateralmente"
                className={inputCn(false)}
              />
            </Field>
            <Checkbox label="Anomalia mülleriana" {...register('mullerianAnomaly')} />
            {mullerianChecked && (
              <Field label="Tipo de anomalia">
                <input
                  {...register('mullerianAnomalyType')}
                  placeholder="Ex: septo uterino completo"
                  className={inputCn(false)}
                />
              </Field>
            )}
          </Section>

          {/* Fator masculino */}
          <Section title="Fator masculino">
            <Checkbox label="Fator masculino presente" {...register('maleFactor')} />
            <p className="text-xs text-gray-500">Espermograma (limites OMS 2021)</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Concentração (M/mL)">
                <input
                  {...register('semenConcentration')}
                  type="number"
                  step="0.1"
                  placeholder="≥16"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Motilidade prog (%)">
                <input
                  {...register('semenProgressiveMotility')}
                  type="number"
                  step="0.1"
                  placeholder="≥30"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Morfologia Kruger (%)">
                <input
                  {...register('semenMorphology')}
                  type="number"
                  step="0.1"
                  placeholder="≥4"
                  className={inputCn(false)}
                />
              </Field>
            </div>
            <Field label="Fragmentação de DNA (DFI %)">
              <input
                {...register('dnaFragmentation')}
                type="number"
                step="0.1"
                placeholder="<30 normal"
                className={inputCn(false)}
              />
            </Field>
            <Checkbox
              label="Encaminhamento para andrologista"
              {...register('maleFertilitySpecialistReferral')}
            />
          </Section>

          {/* Diagnóstico */}
          <Section title="Diagnóstico final">
            <Field label="Diagnóstico primário">
              <select {...register('primaryDiagnosis')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(DIAGNOSIS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Preservação */}
          <Section title="Preservação de fertilidade">
            <Checkbox label="Indicada/realizada preservação" {...register('fertilityPreservation')} />
            {fertilityPreservationChecked && (
              <>
                <Field label="Indicação">
                  <select {...register('preservationIndication')} className={inputCn(false)}>
                    <option value="">—</option>
                    {Object.entries(PRESERVATION_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Método">
                    <input
                      {...register('preservationMethod')}
                      placeholder="Ex: vitrificação de oócitos"
                      className={inputCn(false)}
                    />
                  </Field>
                  <Field label="Data">
                    <input
                      {...register('preservationDate')}
                      type="date"
                      className={inputCn(false)}
                    />
                  </Field>
                </div>
              </>
            )}
          </Section>

          {/* Tratamento */}
          <Section title="Plano de tratamento">
            <Field label="Plano">
              <select {...register('treatmentPlan')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(TREATMENT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Checkbox label="Encaminhar para clínica de TRA" {...register('referralToART')} />
            {referralChecked && (
              <Field label="Nome da clínica">
                <input {...register('artClinicName')} className={inputCn(false)} />
              </Field>
            )}
            <Field label="Data de retorno">
              <input {...register('returnDate')} type="date" className={inputCn(false)} />
            </Field>
            <Field label="Observações">
              <textarea {...register('notes')} rows={3} className={inputCn(false)} />
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
              {isEdit ? 'Atualizar investigação' : 'Salvar investigação'}
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
