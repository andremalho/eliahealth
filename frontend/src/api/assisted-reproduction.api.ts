import api from './client';

// ── Enums compartilhados ──

export type TriggerType = 'hcg_urinary' | 'hcg_recombinant' | 'gnrh_agonist' | 'none';

export type OHSSGrade = 'mild' | 'moderate' | 'severe' | 'critical';

export type TechnicalDifficulty = 'easy' | 'moderate' | 'difficult';

// ── Indução de ovulação ──

export type OIIndication =
  | 'anovulation_who_i'
  | 'anovulation_who_ii'
  | 'unexplained_infertility'
  | 'iui_adjuvant'
  | 'mild_male_factor';

export type OIProtocol =
  | 'clomiphene_citrate'
  | 'letrozole'
  | 'fsh_recombinant'
  | 'combined_cc_fsh'
  | 'hmg';

export type OICycleOutcome =
  | 'ovulated_scheduled_intercourse'
  | 'ovulated_with_iui'
  | 'cancelled_ohss_risk'
  | 'cancelled_poor_response'
  | 'cancelled_cyst'
  | 'no_response';

// ── IIU ──

export type IUIIndication =
  | 'cervical_factor'
  | 'mild_male_factor'
  | 'oi_adjuvant'
  | 'unexplained'
  | 'donor_sperm'
  | 'single_woman';

export type SpermPrep = 'density_gradient' | 'swim_up' | 'direct_wash';
export type SpermSource = 'partner' | 'donor';

// ── FIV ──

export type IVFCycleType = 'ivf' | 'icsi' | 'icsi_freeze_all' | 'fet';

export type StimulationProtocol =
  | 'antagonist'
  | 'long_agonist'
  | 'short_agonist'
  | 'natural_cycle'
  | 'minimal_stimulation';

export type FertilizationMethod = 'ivf_conventional' | 'icsi';

export type PGTType = 'pgt_a' | 'pgt_m' | 'pgt_sr';

export type TransferType = 'fresh' | 'frozen_thawed';

export interface ARTAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

// ── Entities ──

export interface OvulationInductionCycle {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  cycleNumber: number;
  cycleStartDate: string;
  indication: OIIndication;
  protocol: OIProtocol;
  startingDose: number;
  startingDoseUnit: string;
  triggerType: TriggerType | null;
  triggerDate: string | null;
  outcomeType: OICycleOutcome | null;
  folliclesAtTrigger: number | null;
  endometrialThicknessAtTrigger: number | null;
  estradiolAtTrigger: number | null;
  ovarianHyperstimulationSyndrome: boolean;
  ohssGrade: OHSSGrade | null;
  pregnancyTest: boolean | null;
  betaHcgValue: number | null;
  clinicalPregnancy: boolean | null;
  notes: string | null;
  alerts: ARTAlert[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface IuiCycle {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  cycleNumber: number;
  iuiDate: string;
  indication: IUIIndication;
  spermPreparationMethod: SpermPrep;
  spermSource: SpermSource;
  postWashConcentration: number | null;
  postWashTotalMotile: number | null;
  postWashProgressiveMotility: number | null;
  technicalDifficulty: TechnicalDifficulty | null;
  luteralSupport: boolean;
  betaHcgValue: number | null;
  clinicalPregnancy: boolean | null;
  notes: string | null;
  alerts: ARTAlert[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface IvfCycle {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  cycleNumber: number;
  cycleType: IVFCycleType;
  stimulationProtocol: StimulationProtocol;
  stimulationStartDate: string | null;
  totalFSHDose: number | null;
  stimulationDays: number | null;
  peakEstradiol: number | null;
  triggerType: TriggerType | null;
  triggerDate: string | null;
  oocyteRetrievalDate: string | null;
  totalOocytesRetrieved: number | null;
  miiOocytes: number | null;
  fertilizationMethod: FertilizationMethod;
  fertilized2PN: number | null;
  fertilizationRate: number | null;
  blastocysts: number | null;
  pgtPerformed: boolean;
  pgtType: PGTType | null;
  euploidEmbryos: number | null;
  cryopreservedEmbryos: number | null;
  transferDate: string | null;
  embryosTransferred: number | null;
  transferType: TransferType | null;
  endometrialThicknessAtTransfer: number | null;
  ovarianHyperstimulationSyndrome: boolean;
  ohssGrade: OHSSGrade | null;
  betaHcgValue: number | null;
  clinicalPregnancy: boolean | null;
  liveBirth: boolean | null;
  notes: string | null;
  alerts: ARTAlert[] | null;
  createdAt: string;
  updatedAt: string;
}

// ── Create DTOs ──

export interface CreateOvulationInductionCycleDto {
  cycleNumber: number;
  cycleStartDate: string;
  indication: OIIndication;
  protocol: OIProtocol;
  startingDose: number;
  startingDoseUnit: string;
  triggerType?: TriggerType;
  triggerDate?: string;
  outcomeType?: OICycleOutcome;
  folliclesAtTrigger?: number;
  endometrialThicknessAtTrigger?: number;
  estradiolAtTrigger?: number;
  ovarianHyperstimulationSyndrome?: boolean;
  ohssGrade?: OHSSGrade;
  pregnancyTest?: boolean;
  betaHcgValue?: number;
  clinicalPregnancy?: boolean;
  notes?: string;
}

export interface CreateIuiCycleDto {
  cycleNumber: number;
  iuiDate: string;
  indication: IUIIndication;
  spermPreparationMethod: SpermPrep;
  spermSource: SpermSource;
  postWashConcentration?: number;
  postWashTotalMotile?: number;
  postWashProgressiveMotility?: number;
  technicalDifficulty?: TechnicalDifficulty;
  luteralSupport?: boolean;
  betaHcgValue?: number;
  clinicalPregnancy?: boolean;
  notes?: string;
}

export interface CreateIvfCycleDto {
  cycleNumber: number;
  cycleType: IVFCycleType;
  stimulationProtocol: StimulationProtocol;
  fertilizationMethod: FertilizationMethod;
  stimulationStartDate?: string;
  totalFSHDose?: number;
  stimulationDays?: number;
  peakEstradiol?: number;
  triggerType?: TriggerType;
  triggerDate?: string;
  oocyteRetrievalDate?: string;
  totalOocytesRetrieved?: number;
  miiOocytes?: number;
  fertilized2PN?: number;
  blastocysts?: number;
  pgtPerformed?: boolean;
  pgtType?: PGTType;
  euploidEmbryos?: number;
  cryopreservedEmbryos?: number;
  transferDate?: string;
  embryosTransferred?: number;
  transferType?: TransferType;
  endometrialThicknessAtTransfer?: number;
  ovarianHyperstimulationSyndrome?: boolean;
  ohssGrade?: OHSSGrade;
  betaHcgValue?: number;
  clinicalPregnancy?: boolean;
  liveBirth?: boolean;
  notes?: string;
}

// ── API ──

export async function fetchOICycles(patientId: string): Promise<OvulationInductionCycle[]> {
  const { data } = await api.get(`/patients/${patientId}/ovulation-induction-cycles`);
  return data;
}

export async function createOICycle(
  patientId: string,
  dto: CreateOvulationInductionCycleDto,
): Promise<OvulationInductionCycle> {
  const { data } = await api.post(`/patients/${patientId}/ovulation-induction-cycles`, dto);
  return data;
}

export async function fetchIuiCycles(patientId: string): Promise<IuiCycle[]> {
  const { data } = await api.get(`/patients/${patientId}/iui-cycles`);
  return data;
}

export async function createIuiCycle(
  patientId: string,
  dto: CreateIuiCycleDto,
): Promise<IuiCycle> {
  const { data } = await api.post(`/patients/${patientId}/iui-cycles`, dto);
  return data;
}

export async function fetchIvfCycles(patientId: string): Promise<IvfCycle[]> {
  const { data } = await api.get(`/patients/${patientId}/ivf-cycles`);
  return data;
}

export async function createIvfCycle(
  patientId: string,
  dto: CreateIvfCycleDto,
): Promise<IvfCycle> {
  const { data } = await api.post(`/patients/${patientId}/ivf-cycles`, dto);
  return data;
}

// ── Labels ──

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  hcg_urinary: 'hCG urinário',
  hcg_recombinant: 'hCG recombinante',
  gnrh_agonist: 'Agonista GnRH',
  none: 'Nenhum',
};

export const OHSS_LABELS: Record<OHSSGrade, string> = {
  mild: 'Leve',
  moderate: 'Moderada',
  severe: 'Severa',
  critical: 'Crítica',
};

export const OI_INDICATION_LABELS: Record<OIIndication, string> = {
  anovulation_who_i: 'Anovulação OMS I',
  anovulation_who_ii: 'Anovulação OMS II (SOP)',
  unexplained_infertility: 'Infertilidade sem causa',
  iui_adjuvant: 'Adjuvante para IIU',
  mild_male_factor: 'Fator masculino leve',
};

export const OI_PROTOCOL_LABELS: Record<OIProtocol, string> = {
  clomiphene_citrate: 'Citrato de clomifeno (CC)',
  letrozole: 'Letrozol',
  fsh_recombinant: 'FSH recombinante',
  combined_cc_fsh: 'CC + FSH combinado',
  hmg: 'hMG',
};

export const OI_OUTCOME_LABELS: Record<OICycleOutcome, string> = {
  ovulated_scheduled_intercourse: 'Ovulou — coito programado',
  ovulated_with_iui: 'Ovulou — IIU',
  cancelled_ohss_risk: 'Cancelado por risco de OHSS',
  cancelled_poor_response: 'Cancelado por resposta pobre',
  cancelled_cyst: 'Cancelado por cisto',
  no_response: 'Sem resposta',
};

export const IUI_INDICATION_LABELS: Record<IUIIndication, string> = {
  cervical_factor: 'Fator cervical',
  mild_male_factor: 'Fator masculino leve',
  oi_adjuvant: 'Adjuvante a indução',
  unexplained: 'Sem causa aparente',
  donor_sperm: 'Sêmen de doador',
  single_woman: 'Mulher sem parceiro',
};

export const SPERM_PREP_LABELS: Record<SpermPrep, string> = {
  density_gradient: 'Gradiente de densidade',
  swim_up: 'Swim-up',
  direct_wash: 'Lavagem direta',
};

export const SPERM_SOURCE_LABELS: Record<SpermSource, string> = {
  partner: 'Parceiro',
  donor: 'Doador',
};

export const IVF_TYPE_LABELS: Record<IVFCycleType, string> = {
  ivf: 'FIV convencional',
  icsi: 'ICSI',
  icsi_freeze_all: 'ICSI freeze-all',
  fet: 'FET (transferência de congelado)',
};

export const STIM_PROTOCOL_LABELS: Record<StimulationProtocol, string> = {
  antagonist: 'Antagonista',
  long_agonist: 'Agonista longo',
  short_agonist: 'Agonista curto',
  natural_cycle: 'Ciclo natural',
  minimal_stimulation: 'Mini-estimulação',
};

export const FERT_METHOD_LABELS: Record<FertilizationMethod, string> = {
  ivf_conventional: 'FIV convencional',
  icsi: 'ICSI',
};

export const PGT_LABELS: Record<PGTType, string> = {
  pgt_a: 'PGT-A (aneuploidia)',
  pgt_m: 'PGT-M (monogênica)',
  pgt_sr: 'PGT-SR (estrutural)',
};

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  fresh: 'A fresco',
  frozen_thawed: 'Congelado-descongelado',
};
