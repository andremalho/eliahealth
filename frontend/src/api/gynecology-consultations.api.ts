import api from './client';

export type GynecologyConsultationType =
  | 'routine'
  | 'return'
  | 'urgent'
  | 'preconception'
  | 'postpartum'
  | 'adolescent';

export type SmokingStatus = 'never' | 'former' | 'current';

export type AlcoholUsePattern = 'none' | 'social' | 'frequent' | 'abuse';

export type DysmenorrheaGrade = 'none' | 'mild' | 'moderate' | 'severe';

export type MenstrualVolume = 'hypomenorrhea' | 'normal' | 'hypermenorrhea';

export type BiRads =
  | 'birads_0'
  | 'birads_1'
  | 'birads_2'
  | 'birads_3'
  | 'birads_4a'
  | 'birads_4b'
  | 'birads_4c'
  | 'birads_5'
  | 'birads_6';

export interface GynecologyAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface GynecologyConsultation {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  consultationDate: string;
  consultationType: GynecologyConsultationType;

  chiefComplaint: string | null;
  currentIllnessHistory: string | null;
  lastMenstrualPeriod: string | null;
  cycleInterval: number | null;
  cycleDuration: number | null;
  cycleVolume: MenstrualVolume | null;
  dysmenorrhea: DysmenorrheaGrade | null;
  lastPapSmear: string | null;
  lastMammography: string | null;
  contraceptiveMethod: string | null;
  smokingStatus: SmokingStatus | null;
  alcoholUse: boolean | null;
  alcoholUsePattern: AlcoholUsePattern | null;
  drugUse: boolean | null;
  drugUseDetails: string | null;

  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;

  breastExamPerformed: boolean;
  breastExamFindings: string | null;
  biradsClassification: BiRads | null;

  pelvicExamPerformed: boolean;
  cervixAppearance: string | null;
  papSmearCollected: boolean | null;

  phq2Score: number | null;
  gad2Score: number | null;

  diagnosis: string | null;
  icd10Codes: string[] | null;
  referrals: string | null;
  returnDate: string | null;
  notes: string | null;
  internalNotes: string | null;

  alerts: GynecologyAlert[] | null;

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

export interface CreateGynecologyConsultationDto {
  consultationDate: string;
  consultationType?: GynecologyConsultationType;
  chiefComplaint?: string;
  currentIllnessHistory?: string;
  lastMenstrualPeriod?: string;
  cycleInterval?: number;
  cycleDuration?: number;
  cycleVolume?: MenstrualVolume;
  dysmenorrhea?: DysmenorrheaGrade;
  lastPapSmear?: string;
  lastMammography?: string;
  contraceptiveMethod?: string;
  smokingStatus?: SmokingStatus;
  alcoholUse?: boolean;
  alcoholUsePattern?: AlcoholUsePattern;
  drugUse?: boolean;
  drugUseDetails?: string;
  weight?: number;
  height?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  breastExamPerformed?: boolean;
  breastExamFindings?: string;
  biradsClassification?: BiRads;
  pelvicExamPerformed?: boolean;
  cervixAppearance?: string;
  papSmearCollected?: boolean;
  phq2Score?: number;
  gad2Score?: number;
  diagnosis?: string;
  referrals?: string;
  returnDate?: string;
  notes?: string;
}

export async function fetchGynecologyConsultations(
  patientId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<GynecologyConsultation>> {
  const { data } = await api.get(`/patients/${patientId}/gynecology-consultations`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchGynecologyConsultation(
  patientId: string,
  id: string,
): Promise<GynecologyConsultation> {
  const { data } = await api.get(`/patients/${patientId}/gynecology-consultations/${id}`);
  return data;
}

export async function createGynecologyConsultation(
  patientId: string,
  dto: CreateGynecologyConsultationDto,
): Promise<GynecologyConsultation> {
  const { data } = await api.post(`/patients/${patientId}/gynecology-consultations`, dto);
  return data;
}

export type UpdateGynecologyConsultationDto = Partial<CreateGynecologyConsultationDto>;

export async function updateGynecologyConsultation(
  patientId: string,
  id: string,
  dto: UpdateGynecologyConsultationDto,
): Promise<GynecologyConsultation> {
  const { data } = await api.patch(
    `/patients/${patientId}/gynecology-consultations/${id}`,
    dto,
  );
  return data;
}

export async function deleteGynecologyConsultation(
  patientId: string,
  id: string,
): Promise<void> {
  await api.delete(`/patients/${patientId}/gynecology-consultations/${id}`);
}

// ── Helpers de exibição em PT-BR ──

export const CONSULTATION_TYPE_LABELS: Record<GynecologyConsultationType, string> = {
  routine: 'Rotina',
  return: 'Retorno',
  urgent: 'Urgência',
  preconception: 'Pré-concepcional',
  postpartum: 'Puerpério',
  adolescent: 'Adolescência',
};

export const SMOKING_LABELS: Record<SmokingStatus, string> = {
  never: 'Nunca fumou',
  former: 'Ex-tabagista',
  current: 'Fumante ativa',
};

export const ALCOHOL_USE_LABELS: Record<AlcoholUsePattern, string> = {
  none: 'Não consome',
  social: 'Social / eventual',
  frequent: 'Frequente',
  abuse: 'Abusivo / dependência',
};

export const DYSMENORRHEA_LABELS: Record<DysmenorrheaGrade, string> = {
  none: 'Ausente',
  mild: 'Leve',
  moderate: 'Moderada',
  severe: 'Intensa',
};

export const MENSTRUAL_VOLUME_LABELS: Record<MenstrualVolume, string> = {
  hypomenorrhea: 'Hipomenorragia',
  normal: 'Normal',
  hypermenorrhea: 'Hipermenorragia',
};

// Métodos contraceptivos — espelha o enum do módulo de contracepção (FEBRASGO/OMS)
export const CONTRACEPTIVE_METHOD_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: 'none', label: 'Sem método', group: 'Sem uso' },

  { value: 'combined_oral', label: 'ACO combinado (pílula)', group: 'Hormonais combinados' },
  { value: 'combined_injectable', label: 'Injetável mensal combinado', group: 'Hormonais combinados' },
  { value: 'combined_patch', label: 'Adesivo combinado', group: 'Hormonais combinados' },
  { value: 'vaginal_ring', label: 'Anel vaginal', group: 'Hormonais combinados' },

  { value: 'progestin_only_pill', label: 'Minipílula (progestágeno isolado)', group: 'Progestágeno isolado' },
  { value: 'progestin_injectable', label: 'Injetável trimestral (DMPA)', group: 'Progestágeno isolado' },

  { value: 'copper_iud', label: 'DIU de cobre', group: 'LARC' },
  { value: 'lng_iud_52mg', label: 'DIU-LNG 52mg', group: 'LARC' },
  { value: 'lng_iud_19mg', label: 'DIU-LNG 19,5mg', group: 'LARC' },
  { value: 'etonogestrel_implant', label: 'Implante subdérmico', group: 'LARC' },

  { value: 'male_condom', label: 'Preservativo masculino', group: 'Barreira' },
  { value: 'female_condom', label: 'Preservativo feminino', group: 'Barreira' },
  { value: 'diaphragm', label: 'Diafragma', group: 'Barreira' },

  { value: 'tubal_ligation', label: 'Laqueadura tubária', group: 'Definitivos' },
  { value: 'vasectomy_partner', label: 'Vasectomia (parceiro)', group: 'Definitivos' },

  { value: 'natural_family_planning', label: 'Métodos naturais (tabela/sintotérmico)', group: 'Naturais' },
  { value: 'abstinence', label: 'Abstinência', group: 'Naturais' },

  { value: 'levonorgestrel_emergency', label: 'PAE — Levonorgestrel', group: 'Emergência' },
  { value: 'ulipristal_emergency', label: 'PAE — Ulipristal', group: 'Emergência' },
  { value: 'copper_iud_emergency', label: 'PAE — DIU de cobre', group: 'Emergência' },

  { value: 'other', label: 'Outro', group: 'Outros' },
];

// Achados do exame mamário (FEBRASGO)
export const BREAST_FINDING_OPTIONS: { value: string; label: string }[] = [
  { value: 'ndn', label: 'NDN (Nada Digno de Nota)' },
  { value: 'nodulo', label: 'Nódulo' },
  { value: 'retracao', label: 'Retração' },
  { value: 'alteracao_pele', label: 'Alteração de pele' },
  { value: 'descarga_papilar', label: 'Descarga papilar' },
  { value: 'outros', label: 'Outros' },
];

export const BIRADS_LABELS: Record<BiRads, string> = {
  birads_0: 'BI-RADS 0',
  birads_1: 'BI-RADS 1',
  birads_2: 'BI-RADS 2',
  birads_3: 'BI-RADS 3',
  birads_4a: 'BI-RADS 4A',
  birads_4b: 'BI-RADS 4B',
  birads_4c: 'BI-RADS 4C',
  birads_5: 'BI-RADS 5',
  birads_6: 'BI-RADS 6',
};
