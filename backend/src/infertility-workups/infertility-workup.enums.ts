export enum InfertilityDefinition {
  PRIMARY = 'primary',     // nunca engravidou
  SECONDARY = 'secondary', // já teve gestação anterior
}

export enum OvulatoryStatus {
  OVULATORY = 'ovulatory',
  OLIGOOVULATORY = 'oligoovulatory',
  ANOVULATORY = 'anovulatory',
}

// Classificação OMS dos transtornos ovulatórios
export enum WHOOvulationGroup {
  GROUP_I = 'group_i',     // hipogonadismo hipogonadotrófico
  GROUP_II = 'group_ii',   // normogonadotrófico (ex: SOP)
  GROUP_III = 'group_iii', // hipogonadismo hipergonadotrófico (IOP)
  GROUP_IV = 'group_iv',   // hiperprolactinemia
}

export enum InfertilityDiagnosis {
  OVULATORY_FACTOR = 'ovulatory_factor',
  TUBAL_FACTOR = 'tubal_factor',
  UTERINE_FACTOR = 'uterine_factor',
  MALE_FACTOR = 'male_factor',
  ENDOMETRIOSIS = 'endometriosis',
  DIMINISHED_OVARIAN_RESERVE = 'diminished_ovarian_reserve',
  PREMATURE_OVARIAN_INSUFFICIENCY = 'premature_ovarian_insufficiency',
  UNEXPLAINED = 'unexplained',
  MULTIPLE_FACTORS = 'multiple_factors',
}

export enum FertilityPreservationIndication {
  ONCOFERTILITY = 'oncofertility',
  DIMINISHED_RESERVE = 'diminished_reserve',
  ADVANCED_AGE = 'advanced_age',
  AUTOIMMUNE_DISEASE = 'autoimmune_disease',
  SOCIAL_ELECTIVE = 'social_elective',
  OTHER = 'other',
}

export enum InfertilityTreatment {
  EXPECTANT_MANAGEMENT = 'expectant_management',
  OVULATION_INDUCTION = 'ovulation_induction',
  OVULATION_INDUCTION_IUI = 'ovulation_induction_iui',
  IUI_ALONE = 'iui_alone',
  IVF = 'ivf',
  ICSI = 'icsi',
  DONOR_EGGS = 'donor_eggs',
  DONOR_SPERM = 'donor_sperm',
  DONOR_EMBRYO = 'donor_embryo',
  SURROGACY = 'surrogacy',
  ADOPTION_COUNSELING = 'adoption_counseling',
  SURGERY_FIRST = 'surgery_first',
}

export interface InfertilityAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}
