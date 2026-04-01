export enum BpCondition {
  CHRONIC_HYPERTENSION = 'chronic_hypertension',
  GESTATIONAL_HYPERTENSION = 'gestational_hypertension',
  PREECLAMPSIA = 'preeclampsia',
  WHITE_COAT = 'white_coat',
  MONITORING_ONLY = 'monitoring_only',
}

export enum BpArm {
  LEFT = 'left',
  RIGHT = 'right',
  BOTH = 'both',
}

export enum BpPosition {
  SITTING = 'sitting',
  LYING = 'lying',
  STANDING = 'standing',
}

export enum BpStatus {
  NORMAL = 'normal',
  ATTENTION = 'attention',
  CRITICAL = 'critical',
}

export enum BpReadingSource {
  MANUAL = 'manual',
  DEVICE_SYNC = 'device_sync',
  PATIENT_APP = 'patient_app',
}

export const BP_ALARM_SYMPTOMS = [
  'cefaleia', 'escotomas', 'epigastralgia',
] as const;
