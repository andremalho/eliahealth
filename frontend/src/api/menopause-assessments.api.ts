import api from './client';

export type STRAWStage =
  | 'reproductive_peak'
  | 'reproductive_late_a'
  | 'reproductive_late_b'
  | 'menopausal_transition_early'
  | 'menopausal_transition_late'
  | 'postmenopause_early_1a'
  | 'postmenopause_early_1b'
  | 'postmenopause_early_1c'
  | 'postmenopause_late';

export type MenopauseType =
  | 'natural'
  | 'surgical'
  | 'chemotherapy_induced'
  | 'radiation_induced'
  | 'premature_ovarian_insufficiency';

export type HotFlashIntensity = 'mild' | 'moderate' | 'severe';

export type OsteoporosisClassification =
  | 'normal'
  | 'osteopenia'
  | 'osteoporosis'
  | 'severe_osteoporosis';

export type CardioRisk = 'low' | 'intermediate' | 'high';

export type HRTScheme =
  | 'estrogen_only'
  | 'combined_sequential'
  | 'combined_continuous'
  | 'local_estrogen_only'
  | 'tibolone'
  | 'ospemifene'
  | 'none';

export type EstrogenRoute =
  | 'oral'
  | 'transdermal_patch'
  | 'transdermal_gel'
  | 'transdermal_spray'
  | 'vaginal_cream'
  | 'vaginal_ring'
  | 'vaginal_ovule'
  | 'none';

export interface MenopauseAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface MenopauseAssessment {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  assessmentDate: string;

  strawStage: STRAWStage;
  menopauseDate: string | null;
  menopauseType: MenopauseType;
  ageAtMenopause: number | null;

  // MRS
  mrsHotFlashes: number | null;
  mrsHeartPalpitations: number | null;
  mrsSleepDisorders: number | null;
  mrsJointMuscleDiscomfort: number | null;
  mrsDepressiveMood: number | null;
  mrsIrritability: number | null;
  mrsAnxiety: number | null;
  mrsPhysicalMentalExhaustion: number | null;
  mrsSexualProblems: number | null;
  mrsBladderProblems: number | null;
  mrsDrynessVagina: number | null;
  mrsTotalScore: number | null;

  hotFlashesPerDay: number | null;
  hotFlashesPerNight: number | null;
  hotFlashIntensity: HotFlashIntensity | null;

  // GSM
  gsmDiagnosis: boolean;
  gsmVaginalDryness: boolean | null;
  gsmDyspareunia: boolean | null;
  gsmRecurrentUTI: boolean | null;
  gsmUrinaryIncontinence: boolean | null;

  // Osso
  dexaLumbarTScore: number | null;
  dexaFemoralNeckTScore: number | null;
  dexaTotalHipTScore: number | null;
  dexaDate: string | null;
  osteoporosisClassification: OsteoporosisClassification | null;
  fraxScore10yrMajor: number | null;
  fraxScore10yrHip: number | null;

  // CV
  framinghamScore: number | null;
  cardioRiskCategory: CardioRisk | null;

  // THM
  hrtIndicated: boolean;
  hrtContraindicated: boolean;
  hrtScheme: HRTScheme | null;
  estrogenRoute: EstrogenRoute | null;
  estrogenDrug: string | null;
  progestogenDrug: string | null;
  hrtStartDate: string | null;

  vitaminDLevel: number | null;
  calciumSupplementation: number | null;
  vitaminDSupplementation: number | null;

  // Conduta
  diagnosis: string | null;
  treatmentPlan: string | null;
  returnDate: string | null;
  notes: string | null;

  alerts: MenopauseAlert[] | null;

  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMenopauseAssessmentDto {
  assessmentDate: string;
  strawStage: STRAWStage;
  menopauseDate?: string;
  menopauseType: MenopauseType;
  ageAtMenopause?: number;

  mrsHotFlashes?: number;
  mrsHeartPalpitations?: number;
  mrsSleepDisorders?: number;
  mrsJointMuscleDiscomfort?: number;
  mrsDepressiveMood?: number;
  mrsIrritability?: number;
  mrsAnxiety?: number;
  mrsPhysicalMentalExhaustion?: number;
  mrsSexualProblems?: number;
  mrsBladderProblems?: number;
  mrsDrynessVagina?: number;

  hotFlashesPerDay?: number;
  hotFlashesPerNight?: number;
  hotFlashIntensity?: HotFlashIntensity;

  gsmDiagnosis?: boolean;
  gsmVaginalDryness?: boolean;
  gsmDyspareunia?: boolean;
  gsmRecurrentUTI?: boolean;
  gsmUrinaryIncontinence?: boolean;

  dexaLumbarTScore?: number;
  dexaFemoralNeckTScore?: number;
  dexaTotalHipTScore?: number;
  dexaDate?: string;
  fraxScore10yrMajor?: number;
  fraxScore10yrHip?: number;

  framinghamScore?: number;
  cardioRiskCategory?: CardioRisk;

  hrtIndicated?: boolean;
  hrtContraindicated?: boolean;
  hrtScheme?: HRTScheme;
  estrogenRoute?: EstrogenRoute;
  estrogenDrug?: string;
  progestogenDrug?: string;
  hrtStartDate?: string;

  vitaminDLevel?: number;
  calciumSupplementation?: number;
  vitaminDSupplementation?: number;

  diagnosis?: string;
  treatmentPlan?: string;
  returnDate?: string;
  notes?: string;
}

export async function fetchMenopauseAssessments(
  patientId: string,
): Promise<PaginatedResponse<MenopauseAssessment>> {
  const { data } = await api.get(`/patients/${patientId}/menopause-assessments`);
  return data;
}

export async function fetchLatestMenopause(
  patientId: string,
): Promise<MenopauseAssessment | null> {
  const { data } = await api.get(`/patients/${patientId}/menopause-assessments/latest`);
  return data;
}

export async function createMenopauseAssessment(
  patientId: string,
  dto: CreateMenopauseAssessmentDto,
): Promise<MenopauseAssessment> {
  const { data } = await api.post(`/patients/${patientId}/menopause-assessments`, dto);
  return data;
}

export type UpdateMenopauseAssessmentDto = Partial<CreateMenopauseAssessmentDto>;

export async function updateMenopauseAssessment(
  patientId: string,
  id: string,
  dto: UpdateMenopauseAssessmentDto,
): Promise<MenopauseAssessment> {
  const { data } = await api.patch(
    `/patients/${patientId}/menopause-assessments/${id}`,
    dto,
  );
  return data;
}

export async function deleteMenopauseAssessment(
  patientId: string,
  id: string,
): Promise<void> {
  await api.delete(`/patients/${patientId}/menopause-assessments/${id}`);
}

// ── Labels ──

export const STRAW_LABELS: Record<STRAWStage, string> = {
  reproductive_peak: '−5 — Reprodutiva pico',
  reproductive_late_a: '−4 — Reprodutiva tardia A',
  reproductive_late_b: '−3 — Reprodutiva tardia B',
  menopausal_transition_early: '−2 — Transição precoce',
  menopausal_transition_late: '−1 — Transição tardia',
  postmenopause_early_1a: '+1a — Pós-menopausa precoce',
  postmenopause_early_1b: '+1b — Pós-menopausa precoce',
  postmenopause_early_1c: '+1c — Pós-menopausa precoce',
  postmenopause_late: '+2 — Pós-menopausa tardia',
};

export const MENOPAUSE_TYPE_LABELS: Record<MenopauseType, string> = {
  natural: 'Natural',
  surgical: 'Cirúrgica',
  chemotherapy_induced: 'Induzida por quimioterapia',
  radiation_induced: 'Induzida por radioterapia',
  premature_ovarian_insufficiency: 'Insuficiência ovariana prematura (POI)',
};

export const HOT_FLASH_LABELS: Record<HotFlashIntensity, string> = {
  mild: 'Leve',
  moderate: 'Moderado',
  severe: 'Intenso',
};

export const OSTEOPOROSIS_LABELS: Record<OsteoporosisClassification, string> = {
  normal: 'Normal',
  osteopenia: 'Osteopenia',
  osteoporosis: 'Osteoporose',
  severe_osteoporosis: 'Osteoporose grave',
};

export const CARDIO_RISK_LABELS: Record<CardioRisk, string> = {
  low: 'Baixo',
  intermediate: 'Intermediário',
  high: 'Alto',
};

export const HRT_SCHEME_LABELS: Record<HRTScheme, string> = {
  estrogen_only: 'Estrogênio isolado (histerectomizada)',
  combined_sequential: 'Combinado sequencial (E + P cíclico)',
  combined_continuous: 'Combinado contínuo (E + P contínuo)',
  local_estrogen_only: 'Estrogênio vaginal local',
  tibolone: 'Tibolona',
  ospemifene: 'Ospemifeno',
  none: 'Não usa',
};

export const ESTROGEN_ROUTE_LABELS: Record<EstrogenRoute, string> = {
  oral: 'Oral',
  transdermal_patch: 'Adesivo transdérmico',
  transdermal_gel: 'Gel transdérmico',
  transdermal_spray: 'Spray transdérmico',
  vaginal_cream: 'Creme vaginal',
  vaginal_ring: 'Anel vaginal',
  vaginal_ovule: 'Óvulo vaginal',
  none: 'Sem uso',
};

// MRS classification (somatório dos 11 itens, 0-44)
export function classifyMRS(score: number): { label: string; color: string } {
  if (score === 0) return { label: 'Sem sintomas', color: 'bg-emerald-100 text-emerald-700' };
  if (score <= 4) return { label: 'Leve', color: 'bg-blue-100 text-blue-700' };
  if (score <= 8) return { label: 'Moderado', color: 'bg-amber-100 text-amber-700' };
  if (score <= 16) return { label: 'Severo', color: 'bg-orange-100 text-orange-700' };
  return { label: 'Muito severo', color: 'bg-red-100 text-red-700' };
}

// ── Auto-classificação de osteoporose pela DEXA ──
// Critério OMS/NAMS: usa o MENOR T-score entre os sítios.
// Normal: > -1
// Osteopenia: -2.5 < T ≤ -1
// Osteoporose: T ≤ -2.5
// Osteoporose grave: T ≤ -2.5 + fratura por fragilidade (não capturado no form)
export function classifyOsteoporosis(
  lumbar: number | null | undefined,
  femoralNeck: number | null | undefined,
  totalHip: number | null | undefined,
): {
  category: OsteoporosisClassification;
  lowestSite: string;
  lowestValue: number;
} | null {
  const sites: { name: string; value: number }[] = [];
  if (lumbar !== null && lumbar !== undefined && !isNaN(Number(lumbar))) {
    sites.push({ name: 'Lombar', value: Number(lumbar) });
  }
  if (femoralNeck !== null && femoralNeck !== undefined && !isNaN(Number(femoralNeck))) {
    sites.push({ name: 'Colo do fêmur', value: Number(femoralNeck) });
  }
  if (totalHip !== null && totalHip !== undefined && !isNaN(Number(totalHip))) {
    sites.push({ name: 'Quadril total', value: Number(totalHip) });
  }
  if (sites.length === 0) return null;

  const lowest = sites.reduce((acc, s) => (s.value < acc.value ? s : acc));
  let category: OsteoporosisClassification;
  if (lowest.value > -1) category = 'normal';
  else if (lowest.value > -2.5) category = 'osteopenia';
  else category = 'osteoporosis';

  return { category, lowestSite: lowest.name, lowestValue: lowest.value };
}

export const OSTEOPOROSIS_DESCRIPTIONS: Record<OsteoporosisClassification, string> = {
  normal: 'T-score > −1. Massa óssea dentro da normalidade.',
  osteopenia:
    'T-score entre −1 e −2.5. Baixa massa óssea — otimizar cálcio/vitamina D, exercício resistido. Repetir DEXA em 2 anos.',
  osteoporosis:
    'T-score ≤ −2.5. Indicar tratamento específico (bisfosfonato, denosumabe ou similar).',
  severe_osteoporosis:
    'T-score ≤ −2.5 com fratura por fragilidade. Considerar teriparatida; referência à reumatologia.',
};

export const OSTEOPOROSIS_BADGE_COLORS: Record<OsteoporosisClassification, string> = {
  normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  osteopenia: 'bg-amber-100 text-amber-800 border-amber-200',
  osteoporosis: 'bg-red-100 text-red-800 border-red-200',
  severe_osteoporosis: 'bg-red-100 text-red-800 border-red-200',
};

// ── Auto-classificação de risco CV pelo Framingham 10-year ──
// Critério ACC/AHA: <10% baixo, 10-19% intermediário, ≥20% alto
export function classifyCardioRisk(
  framinghamPct: number | null | undefined,
): CardioRisk | null {
  if (framinghamPct === null || framinghamPct === undefined || isNaN(Number(framinghamPct))) {
    return null;
  }
  const v = Number(framinghamPct);
  if (v < 10) return 'low';
  if (v < 20) return 'intermediate';
  return 'high';
}

export const CARDIO_RISK_DESCRIPTIONS: Record<CardioRisk, string> = {
  low: 'Risco <10% em 10 anos. Manejo padrão de prevenção primária.',
  intermediate:
    'Risco 10-19% em 10 anos. Considerar avaliação adicional (escore de cálcio coronário, lipoproteína(a), PCR-us).',
  high: 'Risco ≥20% em 10 anos. Tratamento intensivo de fatores modificáveis. Estatina, controle pressórico e glicêmico rigoroso.',
};

export const CARDIO_RISK_BADGE_COLORS: Record<CardioRisk, string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

// ── Padrão menstrual (input para STRAW pré-menopausa) ──
export type MenstrualPattern =
  | 'regular' // ciclos regulares (-3 reproductive_late_b)
  | 'variation_7days' // variação ≥7 dias entre ciclos consecutivos (-2)
  | 'amenorrhea_60days' // amenorreia ≥60 dias (-1)
  | 'unknown';

export const MENSTRUAL_PATTERN_LABELS: Record<MenstrualPattern, string> = {
  regular: 'Ciclos regulares',
  variation_7days: 'Variação ≥7 dias entre ciclos consecutivos',
  amenorrhea_60days: 'Pelo menos um intervalo de amenorreia ≥60 dias',
  unknown: 'Não informado',
};

// ── Auto-classificação STRAW+10 ──
// Pós-menopausa: calculável pelo tempo desde a FMP.
// Pré-menopausa (-3 a -1): calculável a partir do padrão menstrual.
export function classifySTRAW(
  menopauseDate: string | null | undefined,
  assessmentDate: string | null | undefined,
  menopauseType: MenopauseType | null | undefined,
  menstrualPattern?: MenstrualPattern | null,
): {
  stage: STRAWStage;
  reason: string;
  method: 'computed' | 'induced' | 'pattern';
} | null {
  const isInduced =
    menopauseType === 'surgical' ||
    menopauseType === 'chemotherapy_induced' ||
    menopauseType === 'radiation_induced' ||
    menopauseType === 'premature_ovarian_insufficiency';

  // Caso 1: tem data da FMP → calcula pós-menopausa pelo tempo
  if (menopauseDate && assessmentDate) {
    const fmp = new Date(menopauseDate);
    const today = new Date(assessmentDate);
    const ms = today.getTime() - fmp.getTime();
    if (!isNaN(ms) && ms >= 0) {
      const years = ms / (365.25 * 24 * 3600 * 1000);
      const months = Math.round(years * 12);
      const reasonPrefix = isInduced ? 'Induzida · ' : '';
      const elapsedLabel = years < 1 ? `${months} meses` : `${years.toFixed(1)} anos`;

      let stage: STRAWStage;
      if (years < 1) stage = 'postmenopause_early_1a';
      else if (years < 2) stage = 'postmenopause_early_1b';
      else if (years < 8) stage = 'postmenopause_early_1c';
      else stage = 'postmenopause_late';

      return {
        stage,
        reason: `${reasonPrefix}${elapsedLabel} desde a última menstruação`,
        method: isInduced ? 'induced' : 'computed',
      };
    }
  }

  // Caso 2: induzida sem data → pós-menopausa imediata
  if (isInduced) {
    return {
      stage: 'postmenopause_early_1a',
      reason: 'Menopausa induzida — preencha a data para subdividir o estágio',
      method: 'induced',
    };
  }

  // Caso 3: pré-menopausa → padrão menstrual
  if (menstrualPattern && menstrualPattern !== 'unknown') {
    if (menstrualPattern === 'amenorrhea_60days') {
      return {
        stage: 'menopausal_transition_late',
        reason: 'Amenorreia ≥60 dias — transição menopáusica tardia',
        method: 'pattern',
      };
    }
    if (menstrualPattern === 'variation_7days') {
      return {
        stage: 'menopausal_transition_early',
        reason: 'Variação ≥7 dias entre ciclos — transição menopáusica precoce',
        method: 'pattern',
      };
    }
    if (menstrualPattern === 'regular') {
      return {
        stage: 'reproductive_late_b',
        reason: 'Ciclos regulares — fase reprodutiva tardia',
        method: 'pattern',
      };
    }
  }

  return null;
}

export const STRAW_DESCRIPTIONS: Record<STRAWStage, string> = {
  reproductive_peak: 'Período fértil pleno. Ciclos regulares, função ovariana ótima.',
  reproductive_late_a: 'Início de discretas alterações no padrão menstrual.',
  reproductive_late_b: 'Mudanças hormonais sutis, ciclos ainda regulares.',
  menopausal_transition_early:
    'Variação persistente ≥7 dias no intervalo entre ciclos consecutivos.',
  menopausal_transition_late:
    'Pelo menos um intervalo de amenorreia ≥60 dias. Sintomas vasomotores prováveis.',
  postmenopause_early_1a: 'Primeiro ano após a última menstruação. Sintomas vasomotores frequentes.',
  postmenopause_early_1b: 'Segundo ano após a FMP.',
  postmenopause_early_1c: 'De 2 a ~8 anos após a FMP. Sintomas vasomotores ainda comuns.',
  postmenopause_late: 'Pós-menopausa tardia (≥8 anos da FMP). Foco em saúde óssea e CV.',
};

export const STRAW_BADGE_COLORS: Record<STRAWStage, string> = {
  reproductive_peak: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reproductive_late_a: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reproductive_late_b: 'bg-blue-100 text-blue-800 border-blue-200',
  menopausal_transition_early: 'bg-amber-100 text-amber-800 border-amber-200',
  menopausal_transition_late: 'bg-amber-100 text-amber-800 border-amber-200',
  postmenopause_early_1a: 'bg-purple-100 text-purple-800 border-purple-200',
  postmenopause_early_1b: 'bg-purple-100 text-purple-800 border-purple-200',
  postmenopause_early_1c: 'bg-purple-100 text-purple-800 border-purple-200',
  postmenopause_late: 'bg-gray-100 text-gray-800 border-gray-200',
};
