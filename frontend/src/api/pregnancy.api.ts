import api from './client';

// ── BP Monitoring ──
export const fetchBpReadings = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/bp`)).data;

export const fetchBpTimeline = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/bp/timeline`)).data;

export const createBpReading = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/bp`, dto)).data;

// ── Glucose Monitoring ──
export const fetchGlucoseDailyTable = async (pregnancyId: string, startDate?: string, endDate?: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/glucose/daily-table`, { params: { startDate, endDate } })).data;

export const fetchGlucoseSummary = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/glucose/summary`)).data;

export const createGlucoseReading = async (pregnancyId: string, dto: Record<string, unknown>) =>
  (await api.post(`/pregnancies/${pregnancyId}/glucose`, dto)).data;

// ── Ultrasounds ──
export const fetchUltrasounds = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/ultrasound-summaries`)).data;

// ── Lab Results ──
export const fetchLabResults = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/lab-results`)).data;

// ── Vaccines ──
export const fetchVaccines = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaccines`)).data;

// ── Vaginal Swabs ──
export const fetchVaginalSwabs = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/vaginal-swabs`)).data;

// ── Biological Father ──
export const fetchBiologicalFather = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/biological-father`)).data;

// ── Files ──
export const fetchFiles = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/files`)).data;

// ── Prescriptions ──
export const fetchPrescriptions = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/prescriptions`)).data;

// ── Other Exams ──
export const fetchOtherExams = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/other-exams`)).data;

// ── Copilot ──
export const analyzeCopilot = async (pregnancyId: string) =>
  (await api.post(`/pregnancies/${pregnancyId}/copilot/analyze`)).data;

export const fetchCopilotAlerts = async (pregnancyId: string) =>
  (await api.get(`/pregnancies/${pregnancyId}/copilot/alerts`)).data;
