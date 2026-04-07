export enum ContraceptiveMethod {
  NONE = 'none',
  COMBINED_ORAL = 'combined_oral',                       // pílula combinada
  PROGESTIN_ONLY_PILL = 'progestin_only_pill',           // minipílula
  COMBINED_INJECTABLE = 'combined_injectable',           // injetável mensal
  PROGESTIN_INJECTABLE = 'progestin_injectable',         // DMPA trimestral
  COPPER_IUD = 'copper_iud',
  LNG_IUD_52MG = 'lng_iud_52mg',                         // Mirena
  LNG_IUD_19MG = 'lng_iud_19mg',                         // Kyleena
  ETONOGESTREL_IMPLANT = 'etonogestrel_implant',
  COMBINED_PATCH = 'combined_patch',
  VAGINAL_RING = 'vaginal_ring',
  MALE_CONDOM = 'male_condom',
  FEMALE_CONDOM = 'female_condom',
  DIAPHRAGM = 'diaphragm',
  COPPER_IUD_EMERGENCY = 'copper_iud_emergency',
  LEVONORGESTREL_EMERGENCY = 'levonorgestrel_emergency', // PAE LNG
  ULIPRISTAL_EMERGENCY = 'ulipristal_emergency',         // PAE UPA
  TUBAL_LIGATION = 'tubal_ligation',
  VASECTOMY_PARTNER = 'vasectomy_partner',
  NATURAL_FAMILY_PLANNING = 'natural_family_planning',
  ABSTINENCE = 'abstinence',
  OTHER = 'other',
}

export enum ReproductiveDesire {
  DESIRES_NOW = 'desires_now',
  DESIRES_FUTURE_LESS_1YEAR = 'desires_future_less_1year',
  DESIRES_FUTURE_1_3YEARS = 'desires_future_1_3years',
  DESIRES_FUTURE_MORE_3YEARS = 'desires_future_more_3years',
  COMPLETED_FAMILY = 'completed_family',
  UNDECIDED = 'undecided',
}

// WHO Medical Eligibility Criteria (MEC) 2015
export enum WHOMECCategory {
  CAT1 = 'cat1', // Sem restrição
  CAT2 = 'cat2', // Vantagens superam riscos
  CAT3 = 'cat3', // Riscos superam vantagens
  CAT4 = 'cat4', // Risco inaceitável (contraindicação)
}

export interface ContraceptionAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}
