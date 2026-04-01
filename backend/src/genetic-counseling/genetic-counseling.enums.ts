export enum NiptResult {
  LOW_RISK = 'low_risk',
  HIGH_RISK = 'high_risk',
  INCONCLUSIVE = 'inconclusive',
}

export enum KaryotypeMethod {
  AMNIOCENTESIS = 'amniocentesis',
  CVS = 'cvs',
  CORDOCENTESIS = 'cordocentesis',
}

export enum KaryotypeClassification {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  VARIANT = 'variant',
  INCONCLUSIVE = 'inconclusive',
}

export enum GenomicResult {
  NORMAL = 'normal',
  PATHOGENIC = 'pathogenic',
  LIKELY_PATHOGENIC = 'likely_pathogenic',
  VUS = 'vus',
  BENIGN = 'benign',
}

export enum ExomeType {
  TRIO = 'trio',
  PROBAND_ONLY = 'proband_only',
  DUO = 'duo',
}
