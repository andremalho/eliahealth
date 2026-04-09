import { forwardRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Sparkles } from 'lucide-react';
import {
  fetchMenstrualCycleAssessments,
  type MenstrualCycleAssessment,
} from '../../../api/menstrual-cycle-assessments.api';
import {
  createMenopauseAssessment,
  updateMenopauseAssessment,
  STRAW_LABELS,
  STRAW_DESCRIPTIONS,
  STRAW_BADGE_COLORS,
  MENOPAUSE_TYPE_LABELS,
  HOT_FLASH_LABELS,
  CARDIO_RISK_LABELS,
  CARDIO_RISK_DESCRIPTIONS,
  CARDIO_RISK_BADGE_COLORS,
  HRT_SCHEME_LABELS,
  ESTROGEN_ROUTE_LABELS,
  OSTEOPOROSIS_LABELS,
  OSTEOPOROSIS_DESCRIPTIONS,
  OSTEOPOROSIS_BADGE_COLORS,
  classifyMRS,
  classifyOsteoporosis,
  classifyCardioRisk,
  classifySTRAW,
  MENSTRUAL_PATTERN_LABELS,
  type CreateMenopauseAssessmentDto,
  type MenopauseAssessment,
  type MenopauseType,
  type HotFlashIntensity,
  type HRTScheme,
  type EstrogenRoute,
  type MenstrualPattern,
} from '../../../api/menopause-assessments.api';
import { InfoTooltip } from '../../../components/forms/InfoTooltip';
import { cn } from '../../../utils/cn';

interface FormData {
  assessmentDate: string;
  menopauseDate: string;
  menopauseType: MenopauseType;
  ageAtMenopause: string;
  menstrualPattern: MenstrualPattern | '';

  // MRS — 11 itens 0-4
  mrsHotFlashes: string;
  mrsHeartPalpitations: string;
  mrsSleepDisorders: string;
  mrsJointMuscleDiscomfort: string;
  mrsDepressiveMood: string;
  mrsIrritability: string;
  mrsAnxiety: string;
  mrsPhysicalMentalExhaustion: string;
  mrsSexualProblems: string;
  mrsBladderProblems: string;
  mrsDrynessVagina: string;

  hotFlashesPerDay: string;
  hotFlashesPerNight: string;
  hotFlashIntensity: HotFlashIntensity | '';

  // GSM
  gsmDiagnosis: boolean;
  gsmVaginalDryness: boolean;
  gsmDyspareunia: boolean;
  gsmRecurrentUTI: boolean;
  gsmUrinaryIncontinence: boolean;

  // Osso
  dexaLumbarTScore: string;
  dexaFemoralNeckTScore: string;
  dexaTotalHipTScore: string;
  dexaDate: string;
  fraxScore10yrMajor: string;
  fraxScore10yrHip: string;

  // CV
  framinghamScore: string;

  // Vit D / Cálcio
  vitaminDLevel: string;
  calciumSupplementation: string;
  vitaminDSupplementation: string;

  // THM
  hrtIndicated: boolean;
  hrtContraindicated: boolean;
  hrtScheme: HRTScheme | '';
  estrogenRoute: EstrogenRoute | '';
  estrogenDrug: string;
  progestogenDrug: string;
  hrtStartDate: string;

  // Conduta
  diagnosis: string;
  treatmentPlan: string;
  returnDate: string;
  notes: string;
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

// Infere padrão menstrual a partir da última avaliação de Ciclo/SUA
function inferMenstrualPattern(
  latest: MenstrualCycleAssessment | undefined,
): { pattern: MenstrualPattern; reason: string } | null {
  if (!latest) return null;
  if (latest.chiefComplaint === 'amenorrhea_secondary') {
    return { pattern: 'amenorrhea_60days', reason: 'amenorreia secundária registrada' };
  }
  if (latest.chiefComplaint === 'amenorrhea_primary') {
    return { pattern: 'amenorrhea_60days', reason: 'amenorreia primária registrada' };
  }
  if (latest.chiefComplaint === 'irregular_bleeding') {
    return { pattern: 'variation_7days', reason: 'sangramento irregular registrado' };
  }
  if (latest.cycleIntervalDays !== null) {
    if (latest.cycleIntervalDays < 24 || latest.cycleIntervalDays > 38) {
      return {
        pattern: 'variation_7days',
        reason: `intervalo de ${latest.cycleIntervalDays} dias (fora 24-38)`,
      };
    }
    return {
      pattern: 'regular',
      reason: `intervalo regular de ${latest.cycleIntervalDays} dias`,
    };
  }
  return null;
}

const MRS_FIELDS: { name: keyof FormData; label: string; group: string }[] = [
  { name: 'mrsHotFlashes', label: 'Fogachos / sudorese', group: 'Somato-vegetativo' },
  { name: 'mrsHeartPalpitations', label: 'Palpitações', group: 'Somato-vegetativo' },
  { name: 'mrsSleepDisorders', label: 'Distúrbios do sono', group: 'Somato-vegetativo' },
  { name: 'mrsJointMuscleDiscomfort', label: 'Dores musculares/articulares', group: 'Somato-vegetativo' },
  { name: 'mrsDepressiveMood', label: 'Humor depressivo', group: 'Psicológico' },
  { name: 'mrsIrritability', label: 'Irritabilidade', group: 'Psicológico' },
  { name: 'mrsAnxiety', label: 'Ansiedade', group: 'Psicológico' },
  { name: 'mrsPhysicalMentalExhaustion', label: 'Exaustão física/mental', group: 'Psicológico' },
  { name: 'mrsSexualProblems', label: 'Problemas sexuais', group: 'Urogenital' },
  { name: 'mrsBladderProblems', label: 'Problemas urinários', group: 'Urogenital' },
  { name: 'mrsDrynessVagina', label: 'Secura vaginal', group: 'Urogenital' },
];

export default function NewMenopauseAssessmentModal({
  patientId,
  assessment,
  onClose,
}: {
  patientId: string;
  assessment?: MenopauseAssessment;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!assessment;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: assessment
      ? {
          assessmentDate: assessment.assessmentDate,
          menopauseDate: assessment.menopauseDate ?? '',
          menopauseType: assessment.menopauseType,
          ageAtMenopause: assessment.ageAtMenopause?.toString() ?? '',
          menstrualPattern: '',
          mrsHotFlashes: assessment.mrsHotFlashes?.toString() ?? '0',
          mrsHeartPalpitations: assessment.mrsHeartPalpitations?.toString() ?? '0',
          mrsSleepDisorders: assessment.mrsSleepDisorders?.toString() ?? '0',
          mrsJointMuscleDiscomfort: assessment.mrsJointMuscleDiscomfort?.toString() ?? '0',
          mrsDepressiveMood: assessment.mrsDepressiveMood?.toString() ?? '0',
          mrsIrritability: assessment.mrsIrritability?.toString() ?? '0',
          mrsAnxiety: assessment.mrsAnxiety?.toString() ?? '0',
          mrsPhysicalMentalExhaustion: assessment.mrsPhysicalMentalExhaustion?.toString() ?? '0',
          mrsSexualProblems: assessment.mrsSexualProblems?.toString() ?? '0',
          mrsBladderProblems: assessment.mrsBladderProblems?.toString() ?? '0',
          mrsDrynessVagina: assessment.mrsDrynessVagina?.toString() ?? '0',
          hotFlashesPerDay: assessment.hotFlashesPerDay?.toString() ?? '',
          hotFlashesPerNight: assessment.hotFlashesPerNight?.toString() ?? '',
          hotFlashIntensity: assessment.hotFlashIntensity ?? '',
          gsmDiagnosis: assessment.gsmDiagnosis,
          gsmVaginalDryness: !!assessment.gsmVaginalDryness,
          gsmDyspareunia: !!assessment.gsmDyspareunia,
          gsmRecurrentUTI: !!assessment.gsmRecurrentUTI,
          gsmUrinaryIncontinence: !!assessment.gsmUrinaryIncontinence,
          dexaLumbarTScore: assessment.dexaLumbarTScore?.toString() ?? '',
          dexaFemoralNeckTScore: assessment.dexaFemoralNeckTScore?.toString() ?? '',
          dexaTotalHipTScore: assessment.dexaTotalHipTScore?.toString() ?? '',
          dexaDate: assessment.dexaDate ?? '',
          fraxScore10yrMajor: assessment.fraxScore10yrMajor?.toString() ?? '',
          fraxScore10yrHip: assessment.fraxScore10yrHip?.toString() ?? '',
          framinghamScore: assessment.framinghamScore?.toString() ?? '',
          vitaminDLevel: assessment.vitaminDLevel?.toString() ?? '',
          calciumSupplementation: assessment.calciumSupplementation?.toString() ?? '',
          vitaminDSupplementation: assessment.vitaminDSupplementation?.toString() ?? '',
          hrtIndicated: assessment.hrtIndicated,
          hrtContraindicated: assessment.hrtContraindicated,
          hrtScheme: assessment.hrtScheme ?? '',
          estrogenRoute: assessment.estrogenRoute ?? '',
          estrogenDrug: assessment.estrogenDrug ?? '',
          progestogenDrug: assessment.progestogenDrug ?? '',
          hrtStartDate: assessment.hrtStartDate ?? '',
          diagnosis: assessment.diagnosis ?? '',
          treatmentPlan: assessment.treatmentPlan ?? '',
          returnDate: assessment.returnDate ?? '',
          notes: assessment.notes ?? '',
        }
      : {
          assessmentDate: new Date().toISOString().split('T')[0],
          menopauseType: 'natural',
          gsmDiagnosis: false,
          gsmVaginalDryness: false,
          gsmDyspareunia: false,
          gsmRecurrentUTI: false,
          gsmUrinaryIncontinence: false,
          hrtIndicated: false,
          hrtContraindicated: false,
        },
  });

  // Live STRAW: depende da data da menopausa + tipo + data da consulta
  // OU do padrão menstrual atual (para pré-menopausa)
  const strawResult = classifySTRAW(
    watch('menopauseDate'),
    watch('assessmentDate'),
    watch('menopauseType'),
    (watch('menstrualPattern') || null) as MenstrualPattern | null,
  );

  // ── Cross-module: puxa última avaliação de Ciclo/SUA da paciente ──
  // Quando paciente não tem FMP nem menopausa induzida, infere o padrão
  // menstrual a partir do registro mais recente do módulo Ciclo/SUA.
  const { data: cycleData } = useQuery({
    queryKey: ['menstrual-cycle-assessments', patientId],
    queryFn: () => fetchMenstrualCycleAssessments(patientId, 1, 1),
    enabled: !!patientId,
  });
  const latestCycle = cycleData?.data?.[0];
  const inferred = inferMenstrualPattern(latestCycle);

  // Se a paciente não tem FMP/menopausa induzida E o usuário ainda não
  // selecionou padrão manualmente, aplica o padrão inferido do Ciclo/SUA.
  // Só executa em modo create (não sobrescreve edição).
  useEffect(() => {
    if (isEdit) return;
    if (!inferred) return;
    const currentPattern = watch('menstrualPattern');
    const hasMenopauseDate = !!watch('menopauseDate');
    if (currentPattern || hasMenopauseDate) return;
    setValue('menstrualPattern', inferred.pattern);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inferred?.pattern]);

  // Live MRS total
  const mrsValues = MRS_FIELDS.map((f) => parseInt((watch(f.name) as string) ?? '0', 10) || 0);
  const mrsTotal = mrsValues.reduce((a, b) => a + b, 0);
  const mrsClass = mrsTotal > 0 ? classifyMRS(mrsTotal) : null;

  // Live osteoporose: usa o menor T-score entre os 3 sítios
  const osteoResult = classifyOsteoporosis(
    parseFloat(watch('dexaLumbarTScore') || '') || null,
    parseFloat(watch('dexaFemoralNeckTScore') || '') || null,
    parseFloat(watch('dexaTotalHipTScore') || '') || null,
  );

  // Live risco CV pelo Framingham
  const cardioRiskCalc = classifyCardioRisk(parseFloat(watch('framinghamScore') || '') || null);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateMenopauseAssessmentDto = {
        assessmentDate: data.assessmentDate,
        // STRAW vem do cálculo automático; quando não calculável (sem data
        // e sem menopausa induzida), usa transição tardia como default seguro
        strawStage: strawResult?.stage ?? 'menopausal_transition_late',
        menopauseType: data.menopauseType,
      };

      if (data.menopauseDate) dto.menopauseDate = data.menopauseDate;
      if (data.ageAtMenopause) dto.ageAtMenopause = Number(data.ageAtMenopause);

      // MRS
      for (const f of MRS_FIELDS) {
        const v = data[f.name] as string;
        if (v !== '' && v !== undefined) {
          (dto as any)[f.name] = Number(v);
        }
      }

      if (data.hotFlashesPerDay) dto.hotFlashesPerDay = Number(data.hotFlashesPerDay);
      if (data.hotFlashesPerNight) dto.hotFlashesPerNight = Number(data.hotFlashesPerNight);
      if (data.hotFlashIntensity) dto.hotFlashIntensity = data.hotFlashIntensity;

      dto.gsmDiagnosis = data.gsmDiagnosis;
      dto.gsmVaginalDryness = data.gsmVaginalDryness;
      dto.gsmDyspareunia = data.gsmDyspareunia;
      dto.gsmRecurrentUTI = data.gsmRecurrentUTI;
      dto.gsmUrinaryIncontinence = data.gsmUrinaryIncontinence;

      if (data.dexaLumbarTScore) dto.dexaLumbarTScore = Number(data.dexaLumbarTScore);
      if (data.dexaFemoralNeckTScore) dto.dexaFemoralNeckTScore = Number(data.dexaFemoralNeckTScore);
      if (data.dexaTotalHipTScore) dto.dexaTotalHipTScore = Number(data.dexaTotalHipTScore);
      if (data.dexaDate) dto.dexaDate = data.dexaDate;
      if (data.fraxScore10yrMajor) dto.fraxScore10yrMajor = Number(data.fraxScore10yrMajor);
      if (data.fraxScore10yrHip) dto.fraxScore10yrHip = Number(data.fraxScore10yrHip);

      if (data.framinghamScore) dto.framinghamScore = Number(data.framinghamScore);
      // Categoria de risco CV vem do cálculo automático (Framingham)
      if (cardioRiskCalc) dto.cardioRiskCategory = cardioRiskCalc;

      if (data.vitaminDLevel) dto.vitaminDLevel = Number(data.vitaminDLevel);
      if (data.calciumSupplementation) dto.calciumSupplementation = Number(data.calciumSupplementation);
      if (data.vitaminDSupplementation) dto.vitaminDSupplementation = Number(data.vitaminDSupplementation);

      dto.hrtIndicated = data.hrtIndicated;
      dto.hrtContraindicated = data.hrtContraindicated;
      if (data.hrtScheme) dto.hrtScheme = data.hrtScheme;
      if (data.estrogenRoute) dto.estrogenRoute = data.estrogenRoute;
      if (data.estrogenDrug) dto.estrogenDrug = data.estrogenDrug;
      if (data.progestogenDrug) dto.progestogenDrug = data.progestogenDrug;
      if (data.hrtStartDate) dto.hrtStartDate = data.hrtStartDate;

      if (data.diagnosis) dto.diagnosis = data.diagnosis;
      if (data.treatmentPlan) dto.treatmentPlan = data.treatmentPlan;
      if (data.returnDate) dto.returnDate = data.returnDate;
      if (data.notes) dto.notes = data.notes;

      if (isEdit && assessment) {
        return updateMenopauseAssessment(patientId, assessment.id, dto);
      }
      return createMenopauseAssessment(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menopause-assessments', patientId] });
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
            {isEdit ? 'Editar avaliação de menopausa' : 'Nova avaliação de menopausa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar avaliação. Verifique os dados e tente novamente.
            </div>
          )}

          {/* Identificação */}
          <Section
            title={
              <span className="inline-flex items-center gap-1.5">
                Identificação e estadiamento
                <InfoTooltip title="STRAW+10 — Stages of Reproductive Aging Workshop">
                  Sistema padronizado pela NAMS para classificar o status reprodutivo
                  da mulher em 9 estágios:
                  <br />
                  <br />
                  <strong>Reprodutivo (−5 a −3)</strong> — ciclos regulares.<br />
                  <strong>Transição menopáusica (−2, −1)</strong> — variação ≥7 dias
                  entre ciclos (−2) ou amenorreia ≥60 dias (−1).<br />
                  <strong>Pós-menopausa precoce (+1a)</strong> — primeiro ano após a
                  última menstruação (FMP).<br />
                  <strong>+1b</strong> — segundo ano. <strong>+1c</strong> — 2 a 8 anos.<br />
                  <strong>Pós-menopausa tardia (+2)</strong> — ≥8 anos da FMP.
                  <br />
                  <br />
                  Cálculo automático abaixo a partir da data da última menstruação
                  (FMP) e do tipo de menopausa. Menopausa cirúrgica/induzida entra
                  diretamente em pós-menopausa.
                </InfoTooltip>
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data da avaliação *" error={errors.assessmentDate?.message}>
                <input
                  {...register('assessmentDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(!!errors.assessmentDate)}
                />
              </Field>
              <Field label="Tipo *">
                <select {...register('menopauseType')} className={inputCn(false)}>
                  {Object.entries(MENOPAUSE_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data da última menstruação (FMP)">
                <input {...register('menopauseDate')} type="date" className={inputCn(false)} />
              </Field>
              <Field label="Idade na menopausa">
                <input
                  {...register('ageAtMenopause')}
                  type="number"
                  min={20}
                  max={70}
                  className={inputCn(false)}
                />
              </Field>
            </div>

            {/* Padrão menstrual — só relevante quando paciente ainda menstrua (sem FMP) */}
            <Field label="Padrão menstrual atual (se ainda menstrua)">
              <select {...register('menstrualPattern')} className={inputCn(false)}>
                <option value="">— não informado —</option>
                {(Object.entries(MENSTRUAL_PATTERN_LABELS) as [MenstrualPattern, string][])
                  .filter(([k]) => k !== 'unknown')
                  .map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
              </select>
              {inferred && (
                <p className="mt-1 text-[11px] text-lilac flex items-start gap-1">
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    Sugerido pela última avaliação de Ciclo/SUA — {inferred.reason}.
                    Você pode alterar acima.
                  </span>
                </p>
              )}
            </Field>

            {/* Card STRAW ao vivo */}
            {strawResult ? (
              <div
                className={cn(
                  'border rounded-lg p-3 space-y-1',
                  STRAW_BADGE_COLORS[strawResult.stage],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase font-semibold opacity-75">
                      Estágio STRAW+10
                    </p>
                    <p className="text-base font-bold mt-0.5">
                      {STRAW_LABELS[strawResult.stage]}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/60 rounded font-semibold whitespace-nowrap">
                    Calculado
                  </span>
                </div>
                <p className="text-xs">{STRAW_DESCRIPTIONS[strawResult.stage]}</p>
                <p className="text-xs opacity-75 italic">{strawResult.reason}</p>
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500">
                Para classificação automática preencha <strong>uma</strong> das opções:
                <br />· Data da última menstruação (FMP) → pós-menopausa
                <br />· Tipo de menopausa cirúrgica/induzida → pós-menopausa imediata
                <br />· Padrão menstrual atual → estágio de transição/reprodutivo
              </div>
            )}
          </Section>

          {/* MRS */}
          <Section title="Menopause Rating Scale (MRS)">
            <p className="text-xs text-gray-500 -mt-1">
              0 = ausente · 1 = leve · 2 = moderado · 3 = severo · 4 = muito severo
            </p>
            {(['Somato-vegetativo', 'Psicológico', 'Urogenital'] as const).map((domain) => (
              <div key={domain}>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{domain}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MRS_FIELDS.filter((f) => f.group === domain).map((f) => (
                    <div key={f.name} className="flex items-center gap-2">
                      <span className="text-sm flex-1">{f.label}</span>
                      <select {...register(f.name)} className="px-2 py-1 border rounded text-sm">
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* MRS total ao vivo */}
            {mrsClass && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase">MRS total</span>
                <span className="text-lg font-bold text-navy">{mrsTotal}/44</span>
                <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', mrsClass.color)}>
                  {mrsClass.label}
                </span>
              </div>
            )}
          </Section>

          {/* Fogachos */}
          <Section title="Fogachos">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Por dia">
                <input
                  {...register('hotFlashesPerDay')}
                  type="number"
                  min={0}
                  max={50}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Por noite">
                <input
                  {...register('hotFlashesPerNight')}
                  type="number"
                  min={0}
                  max={50}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Intensidade">
                <select {...register('hotFlashIntensity')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(HOT_FLASH_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* GSM */}
          <Section title="Síndrome geniturinária da menopausa (GSM)">
            <Checkbox label="Diagnóstico de GSM" {...register('gsmDiagnosis')} />
            <div className="grid grid-cols-2 gap-2">
              <Checkbox label="Secura vaginal" {...register('gsmVaginalDryness')} />
              <Checkbox label="Dispareunia" {...register('gsmDyspareunia')} />
              <Checkbox label="ITU recorrente" {...register('gsmRecurrentUTI')} />
              <Checkbox label="Incontinência urinária" {...register('gsmUrinaryIncontinence')} />
            </div>
          </Section>

          {/* Osso */}
          <Section
            title={
              <span className="inline-flex items-center gap-1.5">
                Saúde óssea — DEXA / FRAX
                <InfoTooltip title="Classificação OMS de massa óssea">
                  Avaliação pelo MENOR T-score entre os sítios medidos:
                  <br />
                  <br />
                  <strong>Normal</strong>: T-score &gt; −1<br />
                  <strong>Osteopenia</strong>: −2.5 &lt; T-score ≤ −1<br />
                  <strong>Osteoporose</strong>: T-score ≤ −2.5<br />
                  <strong>Osteoporose grave</strong>: T-score ≤ −2.5 + fratura por fragilidade
                  <br />
                  <br />
                  Cálculo automático abaixo conforme você preenche os T-scores.
                </InfoTooltip>
              </span>
            }
          >
            <Field label="Data DEXA">
              <input {...register('dexaDate')} type="date" className={inputCn(false)} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="T-score lombar">
                <input
                  {...register('dexaLumbarTScore')}
                  type="number"
                  step="0.1"
                  placeholder="-2.5"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="T-score colo fêmur">
                <input
                  {...register('dexaFemoralNeckTScore')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="T-score quadril total">
                <input
                  {...register('dexaTotalHipTScore')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
            </div>

            {/* Card de classificação ao vivo */}
            {osteoResult && (
              <div
                className={cn(
                  'border rounded-lg p-3 space-y-1',
                  OSTEOPOROSIS_BADGE_COLORS[osteoResult.category],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase font-semibold opacity-75">
                      Menor T-score: {osteoResult.lowestSite} {osteoResult.lowestValue.toFixed(1)}
                    </p>
                    <p className="text-base font-bold mt-0.5">
                      {OSTEOPOROSIS_LABELS[osteoResult.category]}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/60 rounded font-semibold whitespace-nowrap">
                    Calculado
                  </span>
                </div>
                <p className="text-xs">{OSTEOPOROSIS_DESCRIPTIONS[osteoResult.category]}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="FRAX fratura major (%)">
                <input
                  {...register('fraxScore10yrMajor')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="FRAX fratura quadril (%)">
                <input
                  {...register('fraxScore10yrHip')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          {/* Risco CV */}
          <Section
            title={
              <span className="inline-flex items-center gap-1.5">
                Risco cardiovascular
                <InfoTooltip title="Estratificação de risco CV (ACC/AHA)">
                  Classificação pelo escore Framingham 10-year:
                  <br />
                  <br />
                  <strong>Baixo</strong>: &lt;10%<br />
                  <strong>Intermediário</strong>: 10-19%<br />
                  <strong>Alto</strong>: ≥20%
                  <br />
                  <br />
                  Cálculo automático abaixo conforme você preenche o Framingham.
                </InfoTooltip>
              </span>
            }
          >
            <Field label="Framingham 10 anos (%)">
              <input
                {...register('framinghamScore')}
                type="number"
                step="0.1"
                placeholder="Calcular separadamente"
                className={inputCn(false)}
              />
            </Field>

            {cardioRiskCalc && (
              <div
                className={cn(
                  'border rounded-lg p-3 space-y-1',
                  CARDIO_RISK_BADGE_COLORS[cardioRiskCalc],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-bold">
                    Risco {CARDIO_RISK_LABELS[cardioRiskCalc]}
                  </p>
                  <span className="text-xs px-2 py-1 bg-white/60 rounded font-semibold whitespace-nowrap">
                    Calculado
                  </span>
                </div>
                <p className="text-xs">{CARDIO_RISK_DESCRIPTIONS[cardioRiskCalc]}</p>
              </div>
            )}
          </Section>

          {/* Vit D / Cálcio */}
          <Section title="Vitamina D e cálcio">
            <div className="grid grid-cols-3 gap-4">
              <Field label="25-OH Vit D (ng/mL)">
                <input
                  {...register('vitaminDLevel')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Suplementação Ca (mg/dia)">
                <input
                  {...register('calciumSupplementation')}
                  type="number"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Suplementação D (UI/dia)">
                <input
                  {...register('vitaminDSupplementation')}
                  type="number"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          {/* THM */}
          <Section title="Terapia hormonal da menopausa (THM)">
            <div className="grid grid-cols-2 gap-2">
              <Checkbox label="THM indicada" {...register('hrtIndicated')} />
              <Checkbox label="THM contraindicada" {...register('hrtContraindicated')} />
            </div>
            <Field label="Esquema">
              <select {...register('hrtScheme')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(HRT_SCHEME_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Via do estrogênio">
              <select {...register('estrogenRoute')} className={inputCn(false)}>
                <option value="">—</option>
                {Object.entries(ESTROGEN_ROUTE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estrogênio">
                <input
                  {...register('estrogenDrug')}
                  placeholder="Ex: estradiol 1mg/dia"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Progestágeno">
                <input
                  {...register('progestogenDrug')}
                  placeholder="Ex: progesterona 200mg"
                  className={inputCn(false)}
                />
              </Field>
            </div>
            <Field label="Início da THM">
              <input {...register('hrtStartDate')} type="date" className={inputCn(false)} />
            </Field>
          </Section>

          {/* Conduta */}
          <Section title="Diagnóstico e conduta">
            <Field label="Diagnóstico / impressão">
              <textarea {...register('diagnosis')} rows={2} className={inputCn(false)} />
            </Field>
            <Field label="Plano terapêutico">
              <textarea {...register('treatmentPlan')} rows={3} className={inputCn(false)} />
            </Field>
            <Field label="Data de retorno">
              <input {...register('returnDate')} type="date" className={inputCn(false)} />
            </Field>
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
              {isEdit ? 'Atualizar avaliação' : 'Salvar avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
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
  label: React.ReactNode;
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
