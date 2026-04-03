export enum WidgetType {
  PIE = 'pie',
  BAR = 'bar',
  LINE = 'line',
  SCATTER = 'scatter',
  NUMBER = 'number',
  TABLE = 'table',
}

export enum DashboardMetric {
  RISK_DISTRIBUTION = 'risk_distribution',
  PREECLAMPSIA_RATE = 'preeclampsia_rate',
  GESTATIONAL_DIABETES_RATE = 'gestational_diabetes_rate',
  PREGESTATIONAL_DIABETES_RATE = 'pregestational_diabetes_rate',
  FGR_RATE = 'fgr_rate',
  PRETERM_BIRTH_RATE = 'preterm_birth_rate',
  THROMBOPHILIA_RATE = 'thrombophilia_rate',
  HELLP_RATE = 'hellp_rate',
  CESAREAN_RATE = 'cesarean_rate',
  TRISOMY_SCREENING_RISK = 'trisomy_screening_risk',
  MATERNAL_AGE_DISTRIBUTION = 'maternal_age_distribution',
  BMI_DISTRIBUTION = 'bmi_distribution',
  DELIVERY_TYPE_DISTRIBUTION = 'delivery_type_distribution',
  REGIONAL_DISTRIBUTION = 'regional_distribution',
  ACTIVE_VS_COMPLETED = 'active_vs_completed',
  HIGH_VS_LOW_RISK = 'high_vs_low_risk',
}

export enum WidgetWidth {
  HALF = 'half',
  FULL = 'full',
}

export enum QueryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}
