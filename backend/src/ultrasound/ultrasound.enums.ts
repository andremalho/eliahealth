export enum UltrasoundExamType {
  OBSTETRIC_INITIAL_TV = 'obstetric_initial_tv',
  MORPHOLOGICAL_1ST = 'morphological_1st',
  MORPHOLOGICAL_2ND = 'morphological_2nd',
  ECHODOPPLER = 'echodoppler',
  OBSTETRIC_DOPPLER = 'obstetric_doppler',
  BIOPHYSICAL_PROFILE = 'biophysical_profile',
  OTHER = 'other',
}

export enum ImageQuality {
  GOOD = 'good',
  REGULAR = 'regular',
  POOR = 'poor',
}

export enum ReportStatus {
  DRAFT = 'draft',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
}

export enum NasalBone {
  PRESENT = 'present',
  ABSENT = 'absent',
  NOT_EVALUATED = 'not_evaluated',
}

export enum PlacentaGrade {
  ZERO = '0',
  I = 'I',
  II = 'II',
  III = 'III',
}

export enum EndDiastolicFlow {
  PRESENT = 'present',
  ABSENT = 'absent',
  REVERSED = 'reversed',
}

export enum DuctusVenosusAwave {
  POSITIVE = 'positive',
  ABSENT = 'absent',
  REVERSED = 'reversed',
}

export enum PresentAbsent {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export enum AmnioticFluidStatus {
  NORMAL = 'normal',
  REDUCED = 'reduced',
  ABSENT = 'absent',
}

export enum NstResult {
  REACTIVE = 'reactive',
  NON_REACTIVE = 'non_reactive',
  NOT_PERFORMED = 'not_performed',
}
