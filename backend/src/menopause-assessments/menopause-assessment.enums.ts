export enum STRAWStage {
  REPRODUCTIVE_PEAK = 'reproductive_peak',                  // -5
  REPRODUCTIVE_LATE_A = 'reproductive_late_a',              // -4
  REPRODUCTIVE_LATE_B = 'reproductive_late_b',              // -3
  MENOPAUSAL_TRANSITION_EARLY = 'menopausal_transition_early', // -2
  MENOPAUSAL_TRANSITION_LATE = 'menopausal_transition_late',   // -1
  POSTMENOPAUSE_EARLY_1A = 'postmenopause_early_1a',
  POSTMENOPAUSE_EARLY_1B = 'postmenopause_early_1b',
  POSTMENOPAUSE_EARLY_1C = 'postmenopause_early_1c',
  POSTMENOPAUSE_LATE = 'postmenopause_late',                // +2
}

export enum MenopauseType {
  NATURAL = 'natural',
  SURGICAL = 'surgical',
  CHEMOTHERAPY_INDUCED = 'chemotherapy_induced',
  RADIATION_INDUCED = 'radiation_induced',
  PREMATURE_OVARIAN_INSUFFICIENCY = 'premature_ovarian_insufficiency',
}

export enum HotFlashIntensity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum OsteoporosisClassification {
  NORMAL = 'normal',                     // T > -1
  OSTEOPENIA = 'osteopenia',             // -2.5 < T ≤ -1
  OSTEOPOROSIS = 'osteoporosis',         // T ≤ -2.5
  SEVERE_OSTEOPOROSIS = 'severe_osteoporosis', // T ≤ -2.5 + fratura
}

export enum CardioRisk {
  LOW = 'low',
  INTERMEDIATE = 'intermediate',
  HIGH = 'high',
}

export enum HRTScheme {
  ESTROGEN_ONLY = 'estrogen_only',                 // histerectomizadas
  COMBINED_SEQUENTIAL = 'combined_sequential',     // E + P cíclico
  COMBINED_CONTINUOUS = 'combined_continuous',     // E + P contínuo
  LOCAL_ESTROGEN_ONLY = 'local_estrogen_only',     // estrogênio vaginal
  TIBOLONE = 'tibolone',
  OSPEMIFENE = 'ospemifene',
  NONE = 'none',
}

export enum EstrogenRoute {
  ORAL = 'oral',
  TRANSDERMAL_PATCH = 'transdermal_patch',
  TRANSDERMAL_GEL = 'transdermal_gel',
  TRANSDERMAL_SPRAY = 'transdermal_spray',
  VAGINAL_CREAM = 'vaginal_cream',
  VAGINAL_RING = 'vaginal_ring',
  VAGINAL_OVULE = 'vaginal_ovule',
  NONE = 'none',
}

export interface MenopauseAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}
