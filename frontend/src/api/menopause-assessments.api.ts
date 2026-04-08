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
