import api from './client';

export type WomensLifePhase =
  | 'adolescence'
  | 'young_adult'
  | 'reproductive'
  | 'perimenopause'
  | 'early_menopause'
  | 'late_menopause';

export type PreventiveExamCategory =
  | 'oncologic'
  | 'metabolic'
  | 'bone'
  | 'cardiovascular'
  | 'infectious'
  | 'hormonal'
  | 'imaging'
  | 'mental_health';

export type PreventiveExamStatus = 'up_to_date' | 'due_soon' | 'overdue' | 'not_applicable';

export type PreventiveAlertSeverity = 'info' | 'warning' | 'urgent';

export type PreventiveAlertType =
  | 'overdue_exam'
  | 'due_soon'
  | 'risk_factor'
  | 'vaccination_due';

export interface PreventiveExamItem {
  examName: string;
  examCode: string;
  category: PreventiveExamCategory;
  frequency: string;
  recommendedDate: string;
  dueDate: string;
  lastPerformedDate: string | null;
  lastResult: string | null;
  status: PreventiveExamStatus;
  guideline: string;
  notes: string | null;
}

export interface VaccinationItem {
  vaccine: string;
  recommendedDate: string;
  lastDoseDate: string | null;
  status: PreventiveExamStatus;
}

export interface PreventiveAlert {
  type: PreventiveAlertType;
  message: string;
  severity: PreventiveAlertSeverity;
}

export interface PreventiveExamSchedule {
  id: string;
  tenantId: string | null;
  patientId: string;
  generatedDate: string;
  patientAgeAtGeneration: number;
  lifePhase: WomensLifePhase;
  examSchedule: PreventiveExamItem[];
  vaccinationSchedule: VaccinationItem[] | null;
  clinicalAlerts: PreventiveAlert[] | null;
  nextReviewDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreventiveSummary {
  hasSchedule: boolean;
  scheduleId?: string;
  lifePhase?: WomensLifePhase;
  generatedDate?: string;
  nextReviewDate?: string;
  totalExams: number;
  upToDate: number;
  dueSoon: number;
  overdue: number;
  alertsCount: number;
}

export interface CreatePreventiveExamScheduleDto {
  generatedDate: string;
  patientAgeAtGeneration: number;
  lifePhase: WomensLifePhase;
  examSchedule: PreventiveExamItem[];
  vaccinationSchedule?: VaccinationItem[];
  clinicalAlerts?: PreventiveAlert[];
  nextReviewDate: string;
  notes?: string;
}

export async function fetchPreventiveExamSchedules(
  patientId: string,
): Promise<PreventiveExamSchedule[]> {
  const { data } = await api.get(`/patients/${patientId}/preventive-exam-schedules`);
  return data;
}

export async function fetchLatestPreventive(
  patientId: string,
): Promise<PreventiveExamSchedule | null> {
  const { data } = await api.get(`/patients/${patientId}/preventive-exam-schedules/latest`);
  return data;
}

export async function fetchPreventiveSummary(
  patientId: string,
): Promise<PreventiveSummary> {
  const { data } = await api.get(`/patients/${patientId}/preventive-exam-schedules/summary`);
  return data;
}

export async function createPreventiveExamSchedule(
  patientId: string,
  dto: CreatePreventiveExamScheduleDto,
): Promise<PreventiveExamSchedule> {
  const { data } = await api.post(`/patients/${patientId}/preventive-exam-schedules`, dto);
  return data;
}

// ── Labels ──

export const LIFE_PHASE_LABELS: Record<WomensLifePhase, string> = {
  adolescence: 'Adolescência (12-19 anos)',
  young_adult: 'Adulto jovem (20-29 anos)',
  reproductive: 'Idade reprodutiva (30-39 anos)',
  perimenopause: 'Perimenopausa (40-49 anos)',
  early_menopause: 'Pós-menopausa precoce (50-59 anos)',
  late_menopause: 'Pós-menopausa tardia (60+ anos)',
};

export const CATEGORY_LABELS: Record<PreventiveExamCategory, string> = {
  oncologic: 'Oncológico',
  metabolic: 'Metabólico',
  bone: 'Ósseo',
  cardiovascular: 'Cardiovascular',
  infectious: 'Infeccioso',
  hormonal: 'Hormonal',
  imaging: 'Imagem',
  mental_health: 'Saúde mental',
};

export const STATUS_LABELS: Record<PreventiveExamStatus, string> = {
  up_to_date: 'Em dia',
  due_soon: 'Próximo',
  overdue: 'Em atraso',
  not_applicable: 'Não se aplica',
};

export const STATUS_COLORS: Record<PreventiveExamStatus, string> = {
  up_to_date: 'bg-emerald-100 text-emerald-700',
  due_soon: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  not_applicable: 'bg-gray-100 text-gray-500',
};

// Calcula life phase a partir da idade
export function lifePhaseFromAge(age: number): WomensLifePhase {
  if (age < 20) return 'adolescence';
  if (age < 30) return 'young_adult';
  if (age < 40) return 'reproductive';
  if (age < 50) return 'perimenopause';
  if (age < 60) return 'early_menopause';
  return 'late_menopause';
}

// Sugere exames padrão por fase da vida (FEBRASGO 2023, ACOG)
export function suggestExamsForPhase(phase: WomensLifePhase, today: string): PreventiveExamItem[] {
  const todayD = new Date(today);
  const inMonths = (m: number) => {
    const d = new Date(todayD);
    d.setMonth(d.getMonth() + m);
    return d.toISOString().split('T')[0]!;
  };
  const exams: PreventiveExamItem[] = [];

  // Citopatológico — 25-64 anos, a cada 3 anos
  if (phase !== 'adolescence' && phase !== 'late_menopause') {
    exams.push({
      examName: 'Citopatológico (Papanicolaou)',
      examCode: 'PAP',
      category: 'oncologic',
      frequency: 'A cada 3 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(36),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'FEBRASGO 2023',
      notes: null,
    });
  }

  // Mamografia — 40+ anos, anual ou bianual
  if (
    phase === 'perimenopause' ||
    phase === 'early_menopause' ||
    phase === 'late_menopause'
  ) {
    exams.push({
      examName: 'Mamografia',
      examCode: 'MMG',
      category: 'oncologic',
      frequency: 'Anual',
      recommendedDate: inMonths(0),
      dueDate: inMonths(12),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'FEBRASGO 2023',
      notes: null,
    });
  }

  // DEXA — 65+ ou pós-menopausa com risco
  if (phase === 'late_menopause' || phase === 'early_menopause') {
    exams.push({
      examName: 'Densitometria óssea (DEXA)',
      examCode: 'DEXA',
      category: 'bone',
      frequency: 'A cada 2 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(24),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'NAMS 2022',
      notes: null,
    });
  }

  // Perfil lipídico — 20+ anos, a cada 5 anos
  if (phase !== 'adolescence') {
    exams.push({
      examName: 'Perfil lipídico',
      examCode: 'LIPID',
      category: 'cardiovascular',
      frequency: 'A cada 5 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(60),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'AHA/ACC',
      notes: null,
    });
  }

  // Glicemia / HbA1c — 35+ anos a cada 3 anos
  if (
    phase === 'reproductive' ||
    phase === 'perimenopause' ||
    phase === 'early_menopause' ||
    phase === 'late_menopause'
  ) {
    exams.push({
      examName: 'Glicemia em jejum / HbA1c',
      examCode: 'GLU',
      category: 'metabolic',
      frequency: 'A cada 3 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(36),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'ADA 2024',
      notes: null,
    });
  }

  // Colonoscopia — 45+ anos
  if (
    phase === 'perimenopause' ||
    phase === 'early_menopause' ||
    phase === 'late_menopause'
  ) {
    exams.push({
      examName: 'Colonoscopia',
      examCode: 'COLO',
      category: 'oncologic',
      frequency: 'A cada 10 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(120),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'USPSTF 2021',
      notes: null,
    });
  }

  // TSH — pós-menopausa
  if (phase === 'early_menopause' || phase === 'late_menopause') {
    exams.push({
      examName: 'TSH',
      examCode: 'TSH',
      category: 'hormonal',
      frequency: 'A cada 5 anos',
      recommendedDate: inMonths(0),
      dueDate: inMonths(60),
      lastPerformedDate: null,
      lastResult: null,
      status: 'due_soon',
      guideline: 'AACE',
      notes: null,
    });
  }

  return exams;
}
