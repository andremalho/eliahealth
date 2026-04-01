export enum SummaryExamType {
  OBSTETRIC_INITIAL_TV = 'obstetric_initial_tv',
  MORPHOLOGICAL_1ST = 'morphological_1st',
  MORPHOLOGICAL_2ND = 'morphological_2nd',
  ECHODOPPLER = 'echodoppler',
  OBSTETRIC_DOPPLER = 'obstetric_doppler',
  BIOPHYSICAL_PROFILE = 'biophysical_profile',
  OTHER = 'other',
}

export enum SummaryAttachmentType {
  PDF = 'pdf',
  IMAGE = 'image',
}

export enum SummaryReportStatus {
  UPLOADED = 'uploaded',
  SUMMARIZED = 'summarized',
  REVIEWED = 'reviewed',
}

export enum DopplerResult {
  NORMAL = 'normal',
  ALTERED = 'altered',
}

export enum MorphologyResult {
  NORMAL = 'normal',
  ALTERED = 'altered',
}

export enum RiskCategory {
  LOW = 'low',
  INTERMEDIATE = 'intermediate',
  HIGH = 'high',
}

export enum CervicalLengthCategory {
  SHORT = 'short',
  NORMAL = 'normal',
}

export enum PresentAbsentEnum {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export enum EchoResult {
  NORMAL = 'normal',
  ALTERED = 'altered',
}

// ── Achados pré-definidos por tipo de exame ──

export const MORPHO_1ST_FINDINGS = [
  'Higroma cístico',
  'Translucência nucal aumentada',
  'Osso nasal ausente',
  'Regurgitação tricúspide',
  'Ductus venoso alterado',
  'Holoprosencefalia',
  'Onfalocele',
  'Gastrosquise',
  'Cardiopatia suspeita',
] as const;

export const MORPHO_2ND_FINDINGS = [
  'Cardiopatia',
  'Lábio leporino',
  'Fenda palatina',
  'Malformação do SNC',
  'Malformação renal',
  'Malformação de membros',
  'Hérnia diafragmática',
  'Higroma cístico',
  'Hidropisia',
  'Restrição de crescimento suspeita',
  'Placenta prévia',
  'Vasa prévia suspeita',
] as const;

export const ECHO_FINDINGS = [
  'CIV - Comunicação Interventricular',
  'CIA - Comunicação Interatrial',
  'DSAV - Defeito do Septo Atrioventricular',
  'TGA - Transposição das Grandes Artérias',
  'DVSVD - Dupla Via de Saída do VD',
  'Tetralogia de Fallot',
  'Síndrome de Hipoplasia do Coração Esquerdo',
  'Coarctação de Aorta',
  'Estenose Pulmonar',
  'Arritmia Fetal',
  'Derrame Pericárdico',
  'Cardiomegalia',
] as const;
