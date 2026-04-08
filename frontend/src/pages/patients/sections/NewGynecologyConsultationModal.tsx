import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createGynecologyConsultation,
  CONSULTATION_TYPE_LABELS,
  SMOKING_LABELS,
  ALCOHOL_USE_LABELS,
  DYSMENORRHEA_LABELS,
  MENSTRUAL_VOLUME_LABELS,
  BIRADS_LABELS,
  CONTRACEPTIVE_METHOD_OPTIONS,
  BREAST_FINDING_OPTIONS,
  type CreateGynecologyConsultationDto,
  type GynecologyConsultationType,
  type SmokingStatus,
  type AlcoholUsePattern,
  type DysmenorrheaGrade,
  type MenstrualVolume,
  type BiRads,
} from '../../../api/gynecology-consultations.api';
import { cn } from '../../../utils/cn';

interface FormData {
  consultationDate: string;
  consultationType: GynecologyConsultationType;
  chiefComplaint: string;
  currentIllnessHistory: string;

  // Ciclo
  lastMenstrualPeriod: string;
  cycleInterval: string;
  cycleDuration: string;
  cycleVolume: MenstrualVolume | '';
  dysmenorrhea: DysmenorrheaGrade | '';

  // Rastreios prévios
  lastPapSmear: string;
  lastMammography: string;

  // Contracepção
  contraceptiveMethodKey: string; // valor do select
  contraceptiveBrand: string; // marca/detalhes (DIU: Mirena)

  // Hábitos
  smokingStatus: SmokingStatus | '';
  alcoholUsePattern: AlcoholUsePattern | '';
  drugUse: boolean;
  drugUseDetails: string;

  // Vitais
  weight: string;
  height: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;

  // Mama
  breastExamPerformed: boolean;
  breastFindings: string[]; // checkboxes
  breastFindingDescNodulo: string;
  breastFindingDescRetracao: string;
  breastFindingDescAlteracaoPele: string;
  breastFindingDescDescargaPapilar: string;
  breastFindingDescOutros: string;
  biradsClassification: BiRads | '';

  // Pélvico
  pelvicExamPerformed: boolean;
  cervixAppearance: string;
  papSmearCollected: boolean;

  // Conduta
  diagnosis: string;
  referrals: string;
  returnDate: string;
  notes: string;
}

// ── Helpers de classificação ao vivo ──

function classifyCycle(
  intervalStr: string,
  durationStr: string,
  volume: MenstrualVolume | '',
): { label: string; color: 'green' | 'amber' | 'red'; details: string[] } | null {
  const interval = parseInt(intervalStr, 10);
  const duration = parseInt(durationStr, 10);
  if (!interval && !duration && !volume) return null;

  const issues: string[] = [];
  let worst: 'green' | 'amber' | 'red' = 'green';

  // FIGO: ciclo normal 24–38 dias
  if (interval) {
    if (interval < 24) {
      issues.push(`Frequente (${interval}d <24)`);
      worst = 'amber';
    } else if (interval > 38) {
      issues.push(`Infrequente (${interval}d >38)`);
      worst = 'amber';
    }
  }

  // Duração: ≤8 dias é normal
  if (duration && duration > 8) {
    issues.push(`Prolongado (${duration}d >8)`);
    worst = 'amber';
  }

  // Volume
  if (volume === 'hypermenorrhea') {
    issues.push('Hipermenorragia');
    worst = 'red';
  } else if (volume === 'hypomenorrhea') {
    issues.push('Hipomenorragia');
    if (worst === 'green') worst = 'amber';
  }

  if (issues.length === 0) {
    return { label: 'Ciclo normal (FIGO)', color: 'green', details: [] };
  }
  return { label: 'Ciclo anormal', color: worst, details: issues };
}

function computeBmi(weightStr: string, heightStr: string): { value: number; label: string; color: string } | null {
  const w = parseFloat(weightStr);
  const h = parseFloat(heightStr);
  if (!w || !h || h <= 0) return null;
  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  if (!isFinite(bmi) || bmi <= 0) return null;
  let label = 'Normal';
  let color = 'bg-emerald-100 text-emerald-700';
  if (bmi < 18.5) {
    label = 'Baixo peso';
    color = 'bg-blue-100 text-blue-700';
  } else if (bmi >= 30) {
    label = bmi >= 40 ? 'Obesidade grau III' : bmi >= 35 ? 'Obesidade grau II' : 'Obesidade grau I';
    color = 'bg-red-100 text-red-700';
  } else if (bmi >= 25) {
    label = 'Sobrepeso';
    color = 'bg-amber-100 text-amber-700';
  }
  return { value: Number(bmi.toFixed(1)), label, color };
}

export default function NewGynecologyConsultationModal({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      consultationDate: new Date().toISOString().split('T')[0],
      consultationType: 'routine',
      breastExamPerformed: false,
      pelvicExamPerformed: false,
      papSmearCollected: false,
      breastFindings: [],
      drugUse: false,
    },
  });

  // Live watches
  const weight = watch('weight');
  const height = watch('height');
  const cycleInterval = watch('cycleInterval');
  const cycleDuration = watch('cycleDuration');
  const cycleVolume = watch('cycleVolume');
  const contraceptiveMethodKey = watch('contraceptiveMethodKey');
  const breastFindings = watch('breastFindings') ?? [];

  const bmi = computeBmi(weight, height);
  const cycleClass = classifyCycle(cycleInterval, cycleDuration, cycleVolume);
  const showBrandField =
    contraceptiveMethodKey && contraceptiveMethodKey !== 'none' && contraceptiveMethodKey !== '';
  const drugUseChecked = watch('drugUse');

  // Agrupar opções de método contraceptivo por categoria
  const groupedMethods = CONTRACEPTIVE_METHOD_OPTIONS.reduce<Record<string, typeof CONTRACEPTIVE_METHOD_OPTIONS>>(
    (acc, opt) => {
      (acc[opt.group] ??= []).push(opt);
      return acc;
    },
    {},
  );

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateGynecologyConsultationDto = {
        consultationDate: data.consultationDate,
        consultationType: data.consultationType,
      };

      // Anamnese
      if (data.chiefComplaint) dto.chiefComplaint = data.chiefComplaint;
      if (data.currentIllnessHistory) dto.currentIllnessHistory = data.currentIllnessHistory;
      if (data.lastMenstrualPeriod) dto.lastMenstrualPeriod = data.lastMenstrualPeriod;
      if (data.cycleInterval) dto.cycleInterval = Number(data.cycleInterval);
      if (data.cycleDuration) dto.cycleDuration = Number(data.cycleDuration);
      if (data.cycleVolume) dto.cycleVolume = data.cycleVolume;
      if (data.dysmenorrhea) dto.dysmenorrhea = data.dysmenorrhea;
      if (data.lastPapSmear) dto.lastPapSmear = data.lastPapSmear;
      if (data.lastMammography) dto.lastMammography = data.lastMammography;

      // Contracepção: compõe label legível para o campo de texto livre
      if (data.contraceptiveMethodKey && data.contraceptiveMethodKey !== 'none') {
        const opt = CONTRACEPTIVE_METHOD_OPTIONS.find((o) => o.value === data.contraceptiveMethodKey);
        const baseLabel = opt?.label ?? data.contraceptiveMethodKey;
        dto.contraceptiveMethod = data.contraceptiveBrand
          ? `${baseLabel} — ${data.contraceptiveBrand}`
          : baseLabel;
      } else if (data.contraceptiveMethodKey === 'none') {
        dto.contraceptiveMethod = 'Sem método';
      }

      if (data.smokingStatus) dto.smokingStatus = data.smokingStatus;
      if (data.alcoholUsePattern) {
        dto.alcoholUsePattern = data.alcoholUsePattern;
        dto.alcoholUse = data.alcoholUsePattern !== 'none';
      }
      if (data.drugUse) {
        dto.drugUse = true;
        if (data.drugUseDetails) dto.drugUseDetails = data.drugUseDetails;
      }

      // Vitais
      if (data.weight) dto.weight = Number(data.weight);
      if (data.height) dto.height = Number(data.height);
      if (data.bloodPressureSystolic) dto.bloodPressureSystolic = Number(data.bloodPressureSystolic);
      if (data.bloodPressureDiastolic) dto.bloodPressureDiastolic = Number(data.bloodPressureDiastolic);
      if (data.heartRate) dto.heartRate = Number(data.heartRate);

      // Mama: monta string "Achado: descrição; Achado: descrição"
      dto.breastExamPerformed = !!data.breastExamPerformed;
      const findingDescMap: Record<string, string> = {
        nodulo: data.breastFindingDescNodulo,
        retracao: data.breastFindingDescRetracao,
        alteracao_pele: data.breastFindingDescAlteracaoPele,
        descarga_papilar: data.breastFindingDescDescargaPapilar,
        outros: data.breastFindingDescOutros,
      };
      const findingsLabels: string[] = [];
      for (const v of data.breastFindings ?? []) {
        const baseLabel = BREAST_FINDING_OPTIONS.find((o) => o.value === v)?.label ?? v;
        if (v === 'ndn') {
          findingsLabels.push(baseLabel);
        } else {
          const desc = (findingDescMap[v] ?? '').trim();
          findingsLabels.push(desc ? `${baseLabel}: ${desc}` : baseLabel);
        }
      }
      if (findingsLabels.length > 0) {
        dto.breastExamFindings = findingsLabels.join('; ');
      }
      if (data.biradsClassification) dto.biradsClassification = data.biradsClassification;

      // Pélvico
      dto.pelvicExamPerformed = !!data.pelvicExamPerformed;
      if (data.cervixAppearance) dto.cervixAppearance = data.cervixAppearance;
      if (data.papSmearCollected) dto.papSmearCollected = true;

      // Conduta
      if (data.diagnosis) dto.diagnosis = data.diagnosis;
      if (data.referrals) dto.referrals = data.referrals;
      if (data.returnDate) dto.returnDate = data.returnDate;
      if (data.notes) dto.notes = data.notes;

      return createGynecologyConsultation(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gynecology-consultations', patientId] });
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
          <h2 className="text-lg font-semibold text-navy">Nova consulta ginecológica</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar consulta. Verifique os dados e tente novamente.
            </div>
          )}

          {/* Cabeçalho */}
          <Section title="Identificação da consulta">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data da consulta *" error={errors.consultationDate?.message}>
                <input
                  {...register('consultationDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(!!errors.consultationDate)}
                />
              </Field>
              <Field label="Tipo de consulta *">
                <select {...register('consultationType')} className={inputCn(false)}>
                  {Object.entries(CONSULTATION_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Anamnese */}
          <Section title="Anamnese">
            <Field label="Queixa principal">
              <input
                {...register('chiefComplaint')}
                placeholder="Ex: check-up anual, sangramento irregular..."
                className={inputCn(false)}
              />
            </Field>
            <Field label="História da doença atual">
              <textarea
                {...register('currentIllnessHistory')}
                rows={3}
                className={inputCn(false)}
              />
            </Field>
          </Section>

          {/* Ciclo */}
          <Section title="Ciclo menstrual">
            <Field label="DUM">
              <input {...register('lastMenstrualPeriod')} type="date" className={inputCn(false)} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Intervalo (dias)">
                <input
                  {...register('cycleInterval')}
                  type="number"
                  min={10}
                  max={120}
                  placeholder="28"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Duração (dias)">
                <input
                  {...register('cycleDuration')}
                  type="number"
                  min={1}
                  max={30}
                  placeholder="5"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Volume">
                <select {...register('cycleVolume')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(MENSTRUAL_VOLUME_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Dismenorreia">
              <select {...register('dysmenorrhea')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(DYSMENORRHEA_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>

            {/* Classificação ao vivo */}
            {cycleClass && (
              <div
                className={cn(
                  'flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm',
                  cycleClass.color === 'green' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  cycleClass.color === 'amber' && 'bg-amber-50 border-amber-200 text-amber-700',
                  cycleClass.color === 'red' && 'bg-red-50 border-red-200 text-red-700',
                )}
              >
                <div>
                  <p className="font-semibold">{cycleClass.label}</p>
                  {cycleClass.details.length > 0 && (
                    <p className="text-xs mt-0.5">{cycleClass.details.join(' · ')}</p>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Rastreios prévios */}
          <Section title="Rastreios prévios">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Último citopatológico">
                <input {...register('lastPapSmear')} type="date" className={inputCn(false)} />
              </Field>
              <Field label="Última mamografia">
                <input {...register('lastMammography')} type="date" className={inputCn(false)} />
              </Field>
            </div>
          </Section>

          {/* Contracepção */}
          <Section title="Contracepção atual">
            <Field label="Método em uso">
              <select {...register('contraceptiveMethodKey')} className={inputCn(false)}>
                <option value="">— selecione —</option>
                {Object.entries(groupedMethods).map(([groupName, opts]) => (
                  <optgroup key={groupName} label={groupName}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            {showBrandField && (
              <Field label="Marca / detalhes">
                <input
                  {...register('contraceptiveBrand')}
                  placeholder="Ex: Mirena, Implanon, Yasmin, EE 30µg + LNG..."
                  className={inputCn(false)}
                />
              </Field>
            )}
          </Section>

          {/* Hábitos */}
          <Section title="Hábitos">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tabagismo">
                <select {...register('smokingStatus')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(SMOKING_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Etilismo">
                <select {...register('alcoholUsePattern')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(ALCOHOL_USE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('drugUse')} />
              Uso de drogas ilícitas
            </label>
            {drugUseChecked && (
              <Field label="Especificar substância(s) e padrão de uso">
                <textarea
                  {...register('drugUseDetails')}
                  rows={2}
                  placeholder="Ex: maconha — uso diário há 5 anos"
                  className={inputCn(false)}
                />
              </Field>
            )}
          </Section>

          {/* Vitais */}
          <Section title="Sinais vitais e antropometria">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Peso (kg)">
                <input
                  {...register('weight')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Altura (cm)">
                <input
                  {...register('height')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="FC (bpm)">
                <input
                  {...register('heartRate')}
                  type="number"
                  min={20}
                  max={250}
                  className={inputCn(false)}
                />
              </Field>
            </div>

            {/* IMC ao vivo */}
            {bmi && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase">IMC</span>
                <span className="text-lg font-bold text-navy">{bmi.value}</span>
                <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', bmi.color)}>
                  {bmi.label}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="PA Sistólica (mmHg)">
                <input
                  {...register('bloodPressureSystolic')}
                  type="number"
                  min={40}
                  max={300}
                  placeholder="120"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="PA Diastólica (mmHg)">
                <input
                  {...register('bloodPressureDiastolic')}
                  type="number"
                  min={20}
                  max={200}
                  placeholder="80"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          {/* Mama */}
          <Section title="Exame mamário">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('breastExamPerformed')} />
              Exame realizado
            </label>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Achados</p>
              <div className="space-y-2">
                {BREAST_FINDING_OPTIONS.map((opt) => {
                  const isChecked = breastFindings.includes(opt.value);
                  const descFieldName = `breastFindingDesc${opt.value
                    .split('_')
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join('')}` as keyof FormData;
                  return (
                    <div
                      key={opt.value}
                      className={cn(
                        'border rounded-lg transition',
                        isChecked ? 'border-lilac/40 bg-lilac/5' : 'border-gray-200',
                      )}
                    >
                      <label className="flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          value={opt.value}
                          {...register('breastFindings')}
                        />
                        {opt.label}
                      </label>
                      {isChecked && opt.value !== 'ndn' && (
                        <div className="px-3 pb-3">
                          <input
                            {...register(descFieldName)}
                            placeholder={`Descrever ${opt.label.toLowerCase()}`}
                            className={inputCn(false)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Field label="Classificação BI-RADS">
              <select {...register('biradsClassification')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(BIRADS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Pélvico */}
          <Section title="Exame pélvico">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('pelvicExamPerformed')} />
              Exame realizado
            </label>
            <Field label="Aparência do colo">
              <textarea {...register('cervixAppearance')} rows={2} className={inputCn(false)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('papSmearCollected')} />
              Citopatológico coletado
            </label>
          </Section>

          {/* Conduta */}
          <Section title="Diagnóstico e conduta">
            <Field label="Diagnóstico / impressão">
              <textarea {...register('diagnosis')} rows={2} className={inputCn(false)} />
            </Field>
            <Field label="Encaminhamentos">
              <textarea {...register('referrals')} rows={2} className={inputCn(false)} />
            </Field>
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
              Salvar consulta
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
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
        {title}
      </h3>
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
