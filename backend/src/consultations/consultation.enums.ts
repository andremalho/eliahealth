export enum EdemaGrade {
  ABSENT = 'absent',
  ONE_PLUS = '1plus',
  TWO_PLUS = '2plus',
  THREE_PLUS = '3plus',
  FOUR_PLUS = '4plus',
}

export enum FetalPresentation {
  NOT_PERFORMED = 'nr',
  CEPHALIC = 'cephalic',
  PELVIC = 'pelvic',
  TRANSVERSE = 'transverse',
  OBLIQUE = 'oblique',
  NOT_EVALUATED = 'not_evaluated',
}

export enum UmbilicalDopplerResult {
  NORMAL = 'normal',
  ALTERED = 'altered',
  NOT_PERFORMED = 'not_performed',
}

export enum CervicalPosition {
  POSTERIOR = 'posterior',
  MEDIANIZED = 'medianized',
  ANTERIOR = 'anterior',
}

export enum CervicalConsistency {
  FIRM = 'firm',
  MEDIUM = 'medium',
  SOFT = 'soft',
}

export enum CervicalState {
  NOT_PERFORMED = 'nr',
  IMPERVIOUS = 'impervious',
  SHORTENED = 'shortened',
  SOFTENED = 'softened',
  DILATED = 'dilated',
  OTHER = 'other',
}

export enum FetalStation {
  HIGH = 'high',
  INTERMEDIATE = 'intermediate',
  ENGAGED = 'engaged',
}

export enum Membranes {
  INTACT = 'intact',
  RUPTURED = 'ruptured',
  NOT_EVALUATED = 'not_evaluated',
}

export enum FhrStatus {
  PRESENT_NORMAL = 'present_normal',
  TACHYCARDIA = 'tachycardia',
  BRADYCARDIA = 'bradycardia',
  ARRHYTHMIA = 'arrhythmia',
  ABSENT = 'absent',
}

export interface ConsultationAlert {
  level: 'attention' | 'urgent' | 'critical';
  message: string;
}
