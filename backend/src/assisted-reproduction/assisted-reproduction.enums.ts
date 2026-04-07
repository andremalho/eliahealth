// ── Enums compartilhados entre OI, IUI e FIV ──

export enum TriggerType {
  HCG_URINARY = 'hcg_urinary',
  HCG_RECOMBINANT = 'hcg_recombinant',
  GNRH_AGONIST = 'gnrh_agonist',
  NONE = 'none',
}

export enum OHSSGrade {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum TechnicalDifficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  DIFFICULT = 'difficult',
}

// ── Indução de ovulação (OI) ──

export enum OIIndication {
  ANOVULATION_WHO_I = 'anovulation_who_i',
  ANOVULATION_WHO_II = 'anovulation_who_ii',
  UNEXPLAINED_INFERTILITY = 'unexplained_infertility',
  IUI_ADJUVANT = 'iui_adjuvant',
  MILD_MALE_FACTOR = 'mild_male_factor',
}

export enum OIProtocol {
  CLOMIPHENE_CITRATE = 'clomiphene_citrate',
  LETROZOLE = 'letrozole',
  FSH_RECOMBINANT = 'fsh_recombinant',
  COMBINED_CC_FSH = 'combined_cc_fsh',
  HMG = 'hmg',
}

export enum OICycleOutcome {
  OVULATED_SCHEDULED_INTERCOURSE = 'ovulated_scheduled_intercourse',
  OVULATED_WITH_IUI = 'ovulated_with_iui',
  CANCELLED_OHSS_RISK = 'cancelled_ohss_risk',
  CANCELLED_POOR_RESPONSE = 'cancelled_poor_response',
  CANCELLED_CYST = 'cancelled_cyst',
  NO_RESPONSE = 'no_response',
}

// ── IUI ──

export enum IUIIndication {
  CERVICAL_FACTOR = 'cervical_factor',
  MILD_MALE_FACTOR = 'mild_male_factor',
  OI_ADJUVANT = 'oi_adjuvant',
  UNEXPLAINED = 'unexplained',
  DONOR_SPERM = 'donor_sperm',
  SINGLE_WOMAN = 'single_woman',
}

export enum SpermPrep {
  DENSITY_GRADIENT = 'density_gradient',
  SWIM_UP = 'swim_up',
  DIRECT_WASH = 'direct_wash',
}

export enum SpermSource {
  PARTNER = 'partner',
  DONOR = 'donor',
}

// ── FIV ──

export enum IVFCycleType {
  IVF = 'ivf',
  ICSI = 'icsi',
  ICSI_FREEZE_ALL = 'icsi_freeze_all',
  FET = 'fet',
}

export enum StimulationProtocol {
  ANTAGONIST = 'antagonist',
  LONG_AGONIST = 'long_agonist',
  SHORT_AGONIST = 'short_agonist',
  NATURAL_CYCLE = 'natural_cycle',
  MINIMAL_STIMULATION = 'minimal_stimulation',
}

export enum FertilizationMethod {
  IVF_CONVENTIONAL = 'ivf_conventional',
  ICSI = 'icsi',
}

export enum PGTType {
  PGT_A = 'pgt_a',
  PGT_M = 'pgt_m',
  PGT_SR = 'pgt_sr',
}

export enum TransferType {
  FRESH = 'fresh',
  FROZEN_THAWED = 'frozen_thawed',
}

export interface AssistedReproductionAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}
