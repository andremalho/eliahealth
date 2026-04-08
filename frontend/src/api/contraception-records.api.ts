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

export const WHOMEC_DESCRIPTIONS: Record<WHOMECCategory, string> = {
  cat1: 'Método pode ser usado sem qualquer restrição.',
  cat2: 'Vantagens superam riscos teóricos ou comprovados. Uso geralmente seguro, com acompanhamento de rotina.',
  cat3: 'Riscos teóricos ou comprovados superam vantagens. Uso não recomendado — preferir alternativa. Apenas se outros métodos não disponíveis e com supervisão clínica próxima.',
  cat4: 'Risco inaceitável à saúde. Método NÃO deve ser usado — contraindicação absoluta.',
};

export const WHOMEC_BADGE_COLORS: Record<WHOMECCategory, string> = {
  cat1: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cat2: 'bg-blue-100 text-blue-800 border-blue-200',
  cat3: 'bg-amber-100 text-amber-800 border-amber-200',
  cat4: 'bg-red-100 text-red-800 border-red-200',
};

// ── Calculadora OMS MEC 2015 (subset) ──
// Recebe método contraceptivo + fatores de risco da paciente.
// Retorna a pior categoria aplicável + lista de razões.

export interface RiskFactors {
  smokingAge35Plus: boolean;
  historyOfVTE: boolean;
  thrombophilia: boolean;
  migraineWithAura: boolean;
  uncontrolledHypertension: boolean;
  diabetesWith15yearsPlus: boolean;
  breastCancerHistory: boolean;
  liverDisease: boolean;
  cardiovascularDisease: boolean;
  stroke: boolean;
  breastfeeding: boolean;
}

export interface WHOMECResult {
  category: WHOMECCategory;
  reasons: { reason: string; cat: WHOMECCategory }[];
  hasInputs: boolean;
}

const COMBINED_HORMONAL: ContraceptiveMethod[] = [
  'combined_oral',
  'combined_injectable',
  'combined_patch',
  'vaginal_ring',
];

const PROGESTIN_ONLY: ContraceptiveMethod[] = [
  'progestin_only_pill',
  'progestin_injectable',
  'lng_iud_52mg',
  'lng_iud_19mg',
  'etonogestrel_implant',
];

const CAT_ORDER: Record<WHOMECCategory, number> = {
  cat1: 1,
  cat2: 2,
  cat3: 3,
  cat4: 4,
};

export function computeWHOMEC(
  method: ContraceptiveMethod | '' | null | undefined,
  risks: RiskFactors,
): WHOMECResult | null {
  if (!method || method === 'none') return null;

  const reasons: { reason: string; cat: WHOMECCategory }[] = [];
  const isCombined = COMBINED_HORMONAL.includes(method);
  const isProgestinOnly = PROGESTIN_ONLY.includes(method);

  // CHC — Contracepção Hormonal Combinada
  if (isCombined) {
    if (risks.smokingAge35Plus) {
      reasons.push({ reason: 'Tabagista ≥35 anos (≥15 cigarros/dia)', cat: 'cat4' });
    }
    if (risks.historyOfVTE) {
      reasons.push({ reason: 'História de tromboembolismo venoso (TEV)', cat: 'cat4' });
    }
    if (risks.thrombophilia) {
      reasons.push({ reason: 'Trombofilia conhecida', cat: 'cat4' });
    }
    if (risks.migraineWithAura) {
      reasons.push({ reason: 'Enxaqueca com aura (em qualquer idade)', cat: 'cat4' });
    }
    if (risks.stroke) {
      reasons.push({ reason: 'AVC prévio', cat: 'cat4' });
    }
    if (risks.cardiovascularDisease) {
      reasons.push({ reason: 'Doença cardiovascular ativa/prévia', cat: 'cat4' });
    }
    if (risks.uncontrolledHypertension) {
      reasons.push({ reason: 'HAS não controlada (≥160/100)', cat: 'cat4' });
    }
    if (risks.diabetesWith15yearsPlus) {
      reasons.push({ reason: 'DM ≥20 anos ou com lesão de órgão-alvo', cat: 'cat3' });
    }
    if (risks.breastCancerHistory) {
      reasons.push({
        reason: 'Câncer de mama prévio (com ou sem evidência atual)',
        cat: 'cat4',
      });
    }
    if (risks.liverDisease) {
      reasons.push({ reason: 'Hepatopatia grave/cirrose descompensada', cat: 'cat4' });
    }
    if (risks.breastfeeding) {
      reasons.push({ reason: 'Amamentando (<6 meses pós-parto)', cat: 'cat4' });
    }
  }

  // Progestágeno isolado — geralmente mais seguro que CHC
  if (isProgestinOnly) {
    if (risks.breastCancerHistory) {
      reasons.push({
        reason: 'Câncer de mama prévio (>5 anos sem evidência)',
        cat: 'cat3',
      });
    }
    if (risks.liverDisease) {
      reasons.push({ reason: 'Hepatopatia grave', cat: 'cat3' });
    }
    if (method === 'progestin_injectable' && risks.cardiovascularDisease) {
      reasons.push({
        reason: 'DMPA + doença cardiovascular (afeta perfil lipídico)',
        cat: 'cat3',
      });
    }
  }

  // DIU de cobre — geralmente cat 1-2 para tudo do nosso form.
  // Cat 3-4 só em condições não capturadas (cervical cancer initiation,
  // infecção pélvica atual, sepse puerperal, doença trofoblástica, etc.).

  if (reasons.length === 0) {
    return { category: 'cat1', reasons: [], hasInputs: true };
  }

  const worst = reasons.reduce<WHOMECCategory>(
    (acc, r) => (CAT_ORDER[r.cat] > CAT_ORDER[acc] ? r.cat : acc),
    'cat1',
  );

  return { category: worst, reasons, hasInputs: true };
}

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
