import api from './client';

export type MenstrualComplaint =
  | 'heavy_menstrual_bleeding'
  | 'irregular_bleeding'
  | 'intermenstrual_bleeding'
  | 'postcoital_bleeding'
  | 'amenorrhea_primary'
  | 'amenorrhea_secondary'
  | 'dysmenorrhea'
  | 'premenstrual_syndrome'
  | 'pmdd';

export type LeiomyomaFIGO =
  | 'submucosal_0'
  | 'submucosal_1'
  | 'submucosal_2'
  | 'intramural_3'
  | 'subserosal_4'
  | 'subserosal_5'
  | 'subserosal_6'
  | 'intraligamentous_7'
  | 'hybrid_2_5'
  | 'cervical_8';

export type EndometriosisStage = 'i' | 'ii' | 'iii' | 'iv';

export interface MenstrualCycleAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface HysteroscopyEntry {
  date: string;
  findings: string;
  conduct: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
}

export interface MenstrualCycleAssessment {
  id: string;
  tenantId: string | null;
  patientId: string;
  doctorId: string | null;
  assessmentDate: string;

  chiefComplaint: MenstrualComplaint;

  cycleIntervalDays: number | null;
  cycleDurationDays: number | null;
  lastMenstrualPeriod: string | null;
  estimatedBloodVolumeMl: number | null;
  pictorialBloodChart: number | null;
  numberOfPadsPerDay: number | null;

  // PALM
  palmPolyp: boolean;
  palmAdenomyosis: boolean;
  palmLeiomyoma: boolean;
  palmLeiomyomaLocation: LeiomyomaFIGO | null;
  palmMalignancyOrHyperplasia: boolean;
  palmMalignancyDetails: string | null;

  // COEIN
  coeinCoagulopathy: boolean;
  coeinCoagulopathyType: string | null;
  coeinOvulatoryDysfunction: boolean;
  coeinOvulatoryType: string | null;
  coeinEndometrial: boolean;
  coeinIatrogenic: boolean;
  coeinIatrogenicDetails: string | null;
  coeinNotYetClassified: boolean;

  // Diagnósticos
  pcosDiagnosis: boolean;
  endometriosisDiagnosis: boolean;
  endometriosisStage: EndometriosisStage | null;

  // Conduta
  diagnosis: string | null;
  treatmentPlan: string | null;
  surgicalReferral: boolean;
  surgicalDetails: string | null;
  hysteroscopyPerformed: boolean;
  hysteroscopyDate: string | null;
  hysteroscopyFindings: string | null;
  hysteroscopies: HysteroscopyEntry[] | null;
  returnDate: string | null;
  notes: string | null;

  alerts: MenstrualCycleAlert[] | null;

  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMenstrualCycleAssessmentDto {
  assessmentDate: string;
  chiefComplaint: MenstrualComplaint;

  cycleIntervalDays?: number;
  cycleDurationDays?: number;
  lastMenstrualPeriod?: string;
  estimatedBloodVolumeMl?: number;
  pictorialBloodChart?: number;
  numberOfPadsPerDay?: number;

  palmPolyp?: boolean;
  palmAdenomyosis?: boolean;
  palmLeiomyoma?: boolean;
  palmLeiomyomaLocation?: LeiomyomaFIGO;
  palmMalignancyOrHyperplasia?: boolean;
  palmMalignancyDetails?: string;

  coeinCoagulopathy?: boolean;
  coeinCoagulopathyType?: string;
  coeinOvulatoryDysfunction?: boolean;
  coeinOvulatoryType?: string;
  coeinEndometrial?: boolean;
  coeinIatrogenic?: boolean;
  coeinIatrogenicDetails?: string;
  coeinNotYetClassified?: boolean;

  pcosDiagnosis?: boolean;
  endometriosisDiagnosis?: boolean;
  endometriosisStage?: EndometriosisStage;

  diagnosis?: string;
  treatmentPlan?: string;
  surgicalReferral?: boolean;
  surgicalDetails?: string;
  hysteroscopyPerformed?: boolean;
  hysteroscopies?: HysteroscopyEntry[];
  returnDate?: string;
  notes?: string;
}

export type UpdateMenstrualCycleAssessmentDto = Partial<CreateMenstrualCycleAssessmentDto>;

export async function fetchMenstrualCycleAssessments(
  patientId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<MenstrualCycleAssessment>> {
  const { data } = await api.get(`/patients/${patientId}/menstrual-cycle-assessments`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchMenstrualCycleAssessment(
  patientId: string,
  id: string,
): Promise<MenstrualCycleAssessment> {
  const { data } = await api.get(`/patients/${patientId}/menstrual-cycle-assessments/${id}`);
  return data;
}

export async function createMenstrualCycleAssessment(
  patientId: string,
  dto: CreateMenstrualCycleAssessmentDto,
): Promise<MenstrualCycleAssessment> {
  const { data } = await api.post(`/patients/${patientId}/menstrual-cycle-assessments`, dto);
  return data;
}

export async function updateMenstrualCycleAssessment(
  patientId: string,
  id: string,
  dto: UpdateMenstrualCycleAssessmentDto,
): Promise<MenstrualCycleAssessment> {
  const { data } = await api.patch(`/patients/${patientId}/menstrual-cycle-assessments/${id}`, dto);
  return data;
}

export async function deleteMenstrualCycleAssessment(
  patientId: string,
  id: string,
): Promise<void> {
  await api.delete(`/patients/${patientId}/menstrual-cycle-assessments/${id}`);
}

// ── Labels PT-BR ──

export const COMPLAINT_LABELS: Record<MenstrualComplaint, string> = {
  heavy_menstrual_bleeding: 'Sangramento menstrual aumentado (menorragia)',
  irregular_bleeding: 'Sangramento irregular',
  intermenstrual_bleeding: 'Sangramento intermenstrual (metrorragia)',
  postcoital_bleeding: 'Sangramento pós-coital',
  amenorrhea_primary: 'Amenorreia primária',
  amenorrhea_secondary: 'Amenorreia secundária',
  dysmenorrhea: 'Dismenorreia',
  premenstrual_syndrome: 'Síndrome pré-menstrual (TPM)',
  pmdd: 'Transtorno disfórico pré-menstrual (TDPM)',
};

export const LEIOMYOMA_FIGO_LABELS: Record<LeiomyomaFIGO, string> = {
  submucosal_0: 'FIGO 0 — Pediculado intracavitário',
  submucosal_1: 'FIGO 1 — Submucoso <50% intramural',
  submucosal_2: 'FIGO 2 — Submucoso ≥50% intramural',
  intramural_3: 'FIGO 3 — Intramural contato endométrio',
  subserosal_4: 'FIGO 4 — Intramural',
  subserosal_5: 'FIGO 5 — Subseroso ≥50% intramural',
  subserosal_6: 'FIGO 6 — Subseroso <50% intramural',
  intraligamentous_7: 'FIGO 7 — Subseroso pediculado',
  hybrid_2_5: 'FIGO 2-5 — Híbrido (transmural)',
  cervical_8: 'FIGO 8 — Outros (cervical, parasitário)',
};

export const ENDOMETRIOSIS_STAGE_LABELS: Record<EndometriosisStage, string> = {
  i: 'Estágio I — Mínima',
  ii: 'Estágio II — Leve',
  iii: 'Estágio III — Moderada',
  iv: 'Estágio IV — Severa',
};
