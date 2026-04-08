import api from './client';

export type InfertilityDefinition = 'primary' | 'secondary';

export type OvulatoryStatus = 'ovulatory' | 'oligoovulatory' | 'anovulatory';

export type WHOOvulationGroup = 'group_i' | 'group_ii' | 'group_iii' | 'group_iv';

export type InfertilityDiagnosis =
  | 'ovulatory_factor'
  | 'tubal_factor'
  | 'uterine_factor'
  | 'male_factor'
  | 'endometriosis'
  | 'diminished_ovarian_reserve'
  | 'premature_ovarian_insufficiency'
  | 'unexplained'
  | 'multiple_factors';

export type FertilityPreservationIndication =
  | 'oncofertility'
  | 'diminished_reserve'
  | 'advanced_age'
  | 'autoimmune_disease'
  | 'social_elective'
  | 'other';

export type InfertilityTreatment =
  | 'expectant_management'
  | 'ovulation_induction'
  | 'ovulation_induction_iui'
  | 'iui_alone'
  | 'ivf'
  | 'icsi'
  | 'donor_eggs'
  | 'donor_sperm'
  | 'donor_embryo'
  | 'surrogacy'
  | 'adoption_counseling'
  | 'surgery_first';

export interface InfertilityAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface InfertilityWorkup {
  id: string;
  tenantId: string | null;
  patientId: string;
  partnerId: string | null;
  doctorId: string | null;
  workupDate: string;

  infertilityDefinition: InfertilityDefinition;
  durationMonths: number;
  ageAtPresentation: number;
  expeditedEvaluation: boolean;
  immediateEvaluation: boolean;

  ovulatoryFactor: boolean | null;
  ovulatoryStatus: OvulatoryStatus | null;
  whoGroupOvulation: WHOOvulationGroup | null;

  ovarianReserve: Record<string, unknown> | null;

  tubalFactor: boolean | null;
  hsg: Record<string, unknown> | null;
  diagnosticHysteroscopy: Record<string, unknown> | null;
  laparoscopyDiagnostic: Record<string, unknown> | null;
  mullerianAnomaly: boolean;
  mullerianAnomalyType: string | null;

  maleFactor: boolean | null;
  semenAnalysis: Record<string, unknown> | null;
  dnaFragmentation: Record<string, unknown> | null;
  maleFertilitySpecialistReferral: boolean;

  primaryDiagnosis: InfertilityDiagnosis | null;
  secondaryDiagnoses: string[] | null;

  fertilityPreservation: boolean;
  preservationIndication: FertilityPreservationIndication | null;
  preservationMethod: string | null;
  preservationDate: string | null;

  treatmentPlan: InfertilityTreatment | null;
  referralToART: boolean;
  artClinicName: string | null;
  notes: string | null;
  returnDate: string | null;

  alerts: InfertilityAlert[] | null;

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

export interface CreateInfertilityWorkupDto {
  workupDate: string;
  infertilityDefinition: InfertilityDefinition;
  durationMonths: number;
  ageAtPresentation: number;
  partnerId?: string;

  ovulatoryFactor?: boolean;
  ovulatoryStatus?: OvulatoryStatus;
  whoGroupOvulation?: WHOOvulationGroup;
  ovarianReserve?: Record<string, unknown>;

  tubalFactor?: boolean;
  hsg?: Record<string, unknown>;
  diagnosticHysteroscopy?: Record<string, unknown>;
  mullerianAnomaly?: boolean;
  mullerianAnomalyType?: string;

  maleFactor?: boolean;
  semenAnalysis?: Record<string, unknown>;
  dnaFragmentation?: Record<string, unknown>;
  maleFertilitySpecialistReferral?: boolean;

  primaryDiagnosis?: InfertilityDiagnosis;
  secondaryDiagnoses?: string[];

  fertilityPreservation?: boolean;
  preservationIndication?: FertilityPreservationIndication;
  preservationMethod?: string;
  preservationDate?: string;

  treatmentPlan?: InfertilityTreatment;
  referralToART?: boolean;
  artClinicName?: string;
  notes?: string;
  returnDate?: string;
}

export async function fetchInfertilityWorkups(
  patientId: string,
): Promise<PaginatedResponse<InfertilityWorkup>> {
  const { data } = await api.get(`/patients/${patientId}/infertility-workups`);
  return data;
}

export async function createInfertilityWorkup(
  patientId: string,
  dto: CreateInfertilityWorkupDto,
): Promise<InfertilityWorkup> {
  const { data } = await api.post(`/patients/${patientId}/infertility-workups`, dto);
  return data;
}

// ── Labels ──

export const DEFINITION_LABELS: Record<InfertilityDefinition, string> = {
  primary: 'Primária — nunca engravidou',
  secondary: 'Secundária — gestação prévia',
};

export const OVULATORY_STATUS_LABELS: Record<OvulatoryStatus, string> = {
  ovulatory: 'Ovulatória',
  oligoovulatory: 'Oligo-ovulatória',
  anovulatory: 'Anovulatória',
};

export const WHO_GROUP_LABELS: Record<WHOOvulationGroup, string> = {
  group_i: 'Grupo I — Hipogonadismo hipogonadotrófico',
  group_ii: 'Grupo II — Normogonadotrófico (ex: SOP)',
  group_iii: 'Grupo III — Hipogonadismo hipergonadotrófico (POI)',
  group_iv: 'Grupo IV — Hiperprolactinemia',
};

export const DIAGNOSIS_LABELS: Record<InfertilityDiagnosis, string> = {
  ovulatory_factor: 'Fator ovulatório',
  tubal_factor: 'Fator tubário',
  uterine_factor: 'Fator uterino',
  male_factor: 'Fator masculino',
  endometriosis: 'Endometriose',
  diminished_ovarian_reserve: 'Reserva ovariana diminuída',
  premature_ovarian_insufficiency: 'Insuficiência ovariana prematura',
  unexplained: 'Sem causa aparente',
  multiple_factors: 'Múltiplos fatores',
};

export const PRESERVATION_LABELS: Record<FertilityPreservationIndication, string> = {
  oncofertility: 'Oncofertilidade',
  diminished_reserve: 'Reserva ovariana baixa',
  advanced_age: 'Idade avançada',
  autoimmune_disease: 'Doença autoimune',
  social_elective: 'Eletivo social',
  other: 'Outro',
};

export const TREATMENT_LABELS: Record<InfertilityTreatment, string> = {
  expectant_management: 'Manejo expectante',
  ovulation_induction: 'Indução de ovulação',
  ovulation_induction_iui: 'Indução + IIU',
  iui_alone: 'IIU isolada',
  ivf: 'FIV',
  icsi: 'ICSI',
  donor_eggs: 'Doação de óvulos',
  donor_sperm: 'Doação de sêmen',
  donor_embryo: 'Doação de embrião',
  surrogacy: 'Útero de substituição',
  adoption_counseling: 'Aconselhamento para adoção',
  surgery_first: 'Cirurgia primeiro',
};
