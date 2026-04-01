export enum DiabetesType {
  GDM_A1 = 'gdm_a1',
  GDM_A2 = 'gdm_a2',
  TYPE1 = 'type1',
  TYPE2 = 'type2',
  OTHER = 'other',
}

export enum MeasurementType {
  FASTING = 'fasting',
  POST_BREAKFAST_1H = 'post_breakfast_1h',
  POST_LUNCH_1H = 'post_lunch_1h',
  POST_DINNER_1H = 'post_dinner_1h',
  POST_BREAKFAST_2H = 'post_breakfast_2h',
  POST_LUNCH_2H = 'post_lunch_2h',
  POST_DINNER_2H = 'post_dinner_2h',
  BEDTIME = 'bedtime',
  RANDOM = 'random',
  HYPOGLYCEMIA = 'hypoglycemia',
}

export enum GlucoseStatus {
  NORMAL = 'normal',
  ATTENTION = 'attention',
  CRITICAL = 'critical',
}

export enum ReadingSource {
  MANUAL = 'manual',
  DEVICE_SYNC = 'device_sync',
  PATIENT_APP = 'patient_app',
}

export enum AdministrationTimeLabel {
  PRE_BREAKFAST = 'pre_breakfast',
  POST_BREAKFAST = 'post_breakfast',
  PRE_LUNCH = 'pre_lunch',
  POST_LUNCH = 'post_lunch',
  PRE_DINNER = 'pre_dinner',
  POST_DINNER = 'post_dinner',
  BEDTIME_22H = 'bedtime_22h',
  CORRECTION = 'correction',
}

export enum AdministeredBy {
  PATIENT = 'patient',
  NURSE = 'nurse',
  PHYSICIAN = 'physician',
}

/** Measurement types that represent 1h post-meal */
export const POST_MEAL_1H_TYPES: MeasurementType[] = [
  MeasurementType.POST_BREAKFAST_1H,
  MeasurementType.POST_LUNCH_1H,
  MeasurementType.POST_DINNER_1H,
];

/** Measurement types that represent 2h post-meal */
export const POST_MEAL_2H_TYPES: MeasurementType[] = [
  MeasurementType.POST_BREAKFAST_2H,
  MeasurementType.POST_LUNCH_2H,
  MeasurementType.POST_DINNER_2H,
];
