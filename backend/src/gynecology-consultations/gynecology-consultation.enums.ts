export enum GynecologyConsultationType {
  INITIAL = 'initial',                 // Primeira consulta
  ROUTINE = 'routine',                 // Consulta de rotina
  RETURN = 'return',                   // Retorno
  URGENT = 'urgent',                   // Urgência
  PRECONCEPTION = 'preconception',     // Pré-concepcional
  POSTPARTUM = 'postpartum',           // Puerpério
  ADOLESCENT = 'adolescent',           // Ginecologia da adolescência
}

export enum MenstrualVolume {
  HYPOMENORRHEA = 'hypomenorrhea',
  NORMAL = 'normal',
  HYPERMENORRHEA = 'hypermenorrhea',
}

export enum DysmenorrheaGrade {
  NONE = 'none',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum SmokingStatus {
  NEVER = 'never',
  FORMER = 'former',
  CURRENT = 'current',
}

export enum AlcoholUsePattern {
  NONE = 'none',           // Não usa
  SOCIAL = 'social',       // Social/eventual
  FREQUENT = 'frequent',   // Frequente
  ABUSE = 'abuse',         // Abusivo / dependência
}

export enum PhysicalActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  VIGOROUS = 'vigorous',
}

export enum EndometriosisStage {
  I = 'i',
  II = 'ii',
  III = 'iii',
  IV = 'iv',
}

export enum BiRads {
  BIRADS_0 = 'birads_0',
  BIRADS_1 = 'birads_1',
  BIRADS_2 = 'birads_2',
  BIRADS_3 = 'birads_3',
  BIRADS_4A = 'birads_4a',
  BIRADS_4B = 'birads_4b',
  BIRADS_4C = 'birads_4c',
  BIRADS_5 = 'birads_5',
  BIRADS_6 = 'birads_6',
}

export interface GynecologyAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}
