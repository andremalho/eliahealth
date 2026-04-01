export enum ExamCategory {
  HEMATOLOGY = 'hematology',
  BIOCHEMISTRY = 'biochemistry',
  SEROLOGY_INFECTIOUS = 'serology_infectious',
  SEROLOGY_TORCH = 'serology_torch',
  THROMBOPHILIA = 'thrombophilia',
  URINE = 'urine',
  MICROBIOLOGY = 'microbiology',
  HORMONES = 'hormones',
  VITAMINS = 'vitamins',
  HEPATITIS = 'hepatitis',
  SEXUALLY_TRANSMITTED = 'sexually_transmitted',
  OTHER = 'other',
}

export enum LabResultStatus {
  PENDING = 'pending',
  NORMAL = 'normal',
  ATTENTION = 'attention',
  CRITICAL = 'critical',
}

export enum AttachmentType {
  PDF = 'pdf',
  IMAGE = 'image',
  LAB_INTEGRATION = 'lab_integration',
}

export enum DocumentType {
  REFERENCE_RANGE = 'reference_range',
  CLINICAL_GUIDELINE = 'clinical_guideline',
  PATIENT_RESULT = 'patient_result',
  OTHER = 'other',
}

export enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
}

/** Categories where a positive/reactive textual result triggers a critical alert */
export const INFECTIOUS_CATEGORIES: ExamCategory[] = [
  ExamCategory.SEROLOGY_INFECTIOUS,
  ExamCategory.SEROLOGY_TORCH,
  ExamCategory.HEPATITIS,
  ExamCategory.SEXUALLY_TRANSMITTED,
];
