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

export enum BpMeasurementLocation {
  HOME = 'home',
  CONSULTATION = 'consultation',
  PHARMACY = 'pharmacy',
  HOSPITAL = 'hospital',
  OTHER = 'other',
}

export enum BpMeasurementMethod {
  MANUAL = 'manual',
  DIGITAL_WRIST = 'digital_wrist',
  DIGITAL_ARM = 'digital_arm',
  AUTOMATIC_DEVICE = 'automatic_device',
}

export const BP_ALARM_SYMPTOMS = [
  'cefaleia', 'escotomas', 'epigastralgia',
] as const;
