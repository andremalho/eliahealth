export enum WomensLifePhase {
  ADOLESCENCE = 'adolescence',         // 12-19
  YOUNG_ADULT = 'young_adult',         // 20-29
  REPRODUCTIVE = 'reproductive',       // 30-39
  PERIMENOPAUSE = 'perimenopause',     // 40-49
  EARLY_MENOPAUSE = 'early_menopause', // 50-59
  LATE_MENOPAUSE = 'late_menopause',   // 60+
}

export enum PreventiveExamCategory {
  ONCOLOGIC = 'oncologic',
  METABOLIC = 'metabolic',
  BONE = 'bone',
  CARDIOVASCULAR = 'cardiovascular',
  INFECTIOUS = 'infectious',
  HORMONAL = 'hormonal',
  IMAGING = 'imaging',
  MENTAL_HEALTH = 'mental_health',
}

export enum PreventiveExamStatus {
  UP_TO_DATE = 'up_to_date',
  DUE_SOON = 'due_soon',
  OVERDUE = 'overdue',
  NOT_APPLICABLE = 'not_applicable',
}

export enum PreventiveAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
}

export enum PreventiveAlertType {
  OVERDUE_EXAM = 'overdue_exam',
  DUE_SOON = 'due_soon',
  RISK_FACTOR = 'risk_factor',
  VACCINATION_DUE = 'vaccination_due',
}

export interface PreventiveExamItem {
  examName: string;
  examCode: string;
  category: PreventiveExamCategory;
  frequency: string;
  recommendedDate: string;
  dueDate: string;
  lastPerformedDate: string | null;
  lastResult: string | null;
  status: PreventiveExamStatus;
  guideline: string;
  notes: string | null;
}

export interface VaccinationItem {
  vaccine: string;
  recommendedDate: string;
  lastDoseDate: string | null;
  status: PreventiveExamStatus;
}

export interface PreventiveAlert {
  type: PreventiveAlertType;
  message: string;
  severity: PreventiveAlertSeverity;
}
