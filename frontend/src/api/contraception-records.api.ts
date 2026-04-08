import api from './client';

export type ContraceptiveMethod =
  | 'none'
  | 'combined_oral'
  | 'progestin_only_pill'
  | 'combined_injectable'
  | 'progestin_injectable'
  | 'copper_iud'
  | 'lng_iud_52mg'
  | 'lng_iud_19mg'
  | 'etonogestrel_implant'
  | 'combined_patch'
  | 'vaginal_ring'
  | 'male_condom'
  | 'female_condom'
  | 'diaphragm'
  | 'copper_iud_emergency'
  | 'levonorgestrel_emergency'
  | 'ulipristal_emergency'
  | 'tubal_ligation'
  | 'vasectomy_partner'
  | 'natural_family_planning'
  | 'abstinence'
  | 'other';

export type ReproductiveDesire =
  | 'desires_now'
  | 'desires_future_less_1year'
  | 'desires_future_1_3years'
  | 'desires_future_more_3years'
  | 'completed_family'
  | 'undecided';

export type WHOMECCategory = 'cat1' | 'cat2' | 'cat3' | 'cat4';

export type SmokingStatus = 'never' | 'former' | 'current';

export interface ContraceptionAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface ContraceptionRecord {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  consultationDate: string;

  currentMethod: ContraceptiveMethod;
  currentMethodStartDate: string | null;
  currentMethodDetails: string | null;

  desireForPregnancy: ReproductiveDesire;
  breastfeeding: boolean;

  whomecCategory: WHOMECCategory | null;
  contraindications: string[] | null;

  smokingStatus: SmokingStatus | null;
  smokingAge35Plus: boolean;
  historyOfVTE: boolean;
  thrombophilia: boolean;
  thrombophiliaDetails: string | null;
  migraineWithAura: boolean;
  uncontrolledHypertension: boolean;
  diabetesWith15yearsPlus: boolean;
  breastCancerHistory: boolean;
  liverDisease: boolean;
  cardiovascularDisease: boolean;
  stroke: boolean;

  // DIU
  iudInsertionDate: string | null;
  iudExpirationDate: string | null;
  iudPositionUltrasound: string | null;
  iudNextCheckDate: string | null;

  // Implante
  implantInsertionDate: string | null;
  implantExpirationDate: string | null;
  implantLocation: string | null;

  // PAE
  emergencyContraceptionUsed: boolean;
  emergencyContraceptionDate: string | null;
  emergencyContraceptionMethod: string | null;

  // Conduta
  methodPrescribed: ContraceptiveMethod | null;
  methodPrescribedDetails: string | null;
  counselingProvided: boolean;
  returnDate: string | null;
  notes: string | null;

  alerts: ContraceptionAlert[] | null;

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

export interface CreateContraceptionRecordDto {
  consultationDate: string;
  currentMethod?: ContraceptiveMethod;
  currentMethodStartDate?: string;
  currentMethodDetails?: string;
  desireForPregnancy: ReproductiveDesire;
  breastfeeding?: boolean;
  whomecCategory?: WHOMECCategory;
  smokingStatus?: SmokingStatus;
  smokingAge35Plus?: boolean;
  historyOfVTE?: boolean;
  thrombophilia?: boolean;
  thrombophiliaDetails?: string;
  migraineWithAura?: boolean;
  uncontrolledHypertension?: boolean;
  diabetesWith15yearsPlus?: boolean;
  breastCancerHistory?: boolean;
  liverDisease?: boolean;
  cardiovascularDisease?: boolean;
  stroke?: boolean;
  iudInsertionDate?: string;
  iudExpirationDate?: string;
  iudPositionUltrasound?: string;
  iudNextCheckDate?: string;
  implantInsertionDate?: string;
  implantExpirationDate?: string;
  implantLocation?: string;
  emergencyContraceptionUsed?: boolean;
  emergencyContraceptionDate?: string;
  emergencyContraceptionMethod?: string;
  methodPrescribed?: ContraceptiveMethod;
  methodPrescribedDetails?: string;
  counselingProvided?: boolean;
  returnDate?: string;
  notes?: string;
}

export async function fetchContraceptionRecords(
  patientId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<ContraceptionRecord>> {
  const { data } = await api.get(`/patients/${patientId}/contraception-records`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchCurrentContraception(
  patientId: string,
): Promise<ContraceptionRecord | null> {
  const { data } = await api.get(`/patients/${patientId}/contraception-records/current`);
  return data;
}

export async function createContraceptionRecord(
  patientId: string,
  dto: CreateContraceptionRecordDto,
): Promise<ContraceptionRecord> {
  const { data } = await api.post(`/patients/${patientId}/contraception-records`, dto);
  return data;
}

// ── Labels ──

export const METHOD_OPTIONS: { value: ContraceptiveMethod; label: string; group: string }[] = [
  { value: 'none', label: 'Sem método', group: 'Sem uso' },
  { value: 'combined_oral', label: 'ACO combinado (pílula)', group: 'Hormonais combinados' },
  { value: 'combined_injectable', label: 'Injetável mensal combinado', group: 'Hormonais combinados' },
  { value: 'combined_patch', label: 'Adesivo combinado', group: 'Hormonais combinados' },
  { value: 'vaginal_ring', label: 'Anel vaginal', group: 'Hormonais combinados' },
  { value: 'progestin_only_pill', label: 'Minipílula', group: 'Progestágeno isolado' },
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
  { value: 'natural_family_planning', label: 'Métodos naturais', group: 'Naturais' },
  { value: 'abstinence', label: 'Abstinência', group: 'Naturais' },
  { value: 'levonorgestrel_emergency', label: 'PAE — Levonorgestrel', group: 'Emergência' },
  { value: 'ulipristal_emergency', label: 'PAE — Ulipristal', group: 'Emergência' },
  { value: 'copper_iud_emergency', label: 'PAE — DIU de cobre', group: 'Emergência' },
  { value: 'other', label: 'Outro', group: 'Outros' },
];

export const METHOD_LABELS: Record<ContraceptiveMethod, string> = METHOD_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o.label;
    return acc;
  },
  {} as Record<ContraceptiveMethod, string>,
);

export const DESIRE_LABELS: Record<ReproductiveDesire, string> = {
  desires_now: 'Deseja engravidar agora',
  desires_future_less_1year: 'Deseja em menos de 1 ano',
  desires_future_1_3years: 'Deseja em 1-3 anos',
  desires_future_more_3years: 'Deseja em mais de 3 anos',
  completed_family: 'Família completa',
  undecided: 'Indecisa',
};

export const WHOMEC_LABELS: Record<WHOMECCategory, string> = {
  cat1: 'Categoria 1 — Sem restrição',
  cat2: 'Categoria 2 — Vantagens > riscos',
  cat3: 'Categoria 3 — Riscos > vantagens',
  cat4: 'Categoria 4 — Contraindicação absoluta',
};

export const SMOKING_LABELS: Record<SmokingStatus, string> = {
  never: 'Nunca fumou',
  former: 'Ex-tabagista',
  current: 'Fumante ativa',
};

export function isLarc(method: ContraceptiveMethod): boolean {
  return ['copper_iud', 'lng_iud_52mg', 'lng_iud_19mg', 'etonogestrel_implant'].includes(method);
}

export function isIud(method: ContraceptiveMethod): boolean {
  return ['copper_iud', 'lng_iud_52mg', 'lng_iud_19mg'].includes(method);
}

export function isImplant(method: ContraceptiveMethod): boolean {
  return method === 'etonogestrel_implant';
}
