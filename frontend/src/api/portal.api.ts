import portalApi from './portalClient';

export const requestOtp = async (cpf: string) => {
  const { data } = await portalApi.post('/portal/auth/request-otp', { cpf });
  return data as { sent: boolean; channels: string[]; devCode?: string };
};

export const verifyOtp = async (cpf: string, code: string) => {
  const { data } = await portalApi.post('/portal/auth/verify-otp', { cpf, code });
  return data as {
    accessToken: string;
    role: string;
    patient: { id: string; fullName: string; email: string | null; phone: string | null };
  };
};

export const fetchDashboard = async () => {
  const { data } = await portalApi.get('/portal/dashboard');
  return data;
};

export const fetchProfile = async () => {
  const { data } = await portalApi.get('/portal/profile-data');
  return data;
};

export const fetchPortalConsultations = async () => {
  const { data } = await portalApi.get('/portal/consultations');
  return data;
};

export const fetchPortalVaccines = async () => {
  const { data } = await portalApi.get('/portal/vaccines');
  return data;
};

export const fetchPortalLabResults = async () => {
  const { data } = await portalApi.get('/portal/lab-results');
  return data;
};

export const fetchPortalUltrasounds = async () => {
  const { data } = await portalApi.get('/portal/ultrasounds');
  return data;
};

export const fetchPortalProfile = async () => {
  const { data } = await portalApi.get('/portal/profile-data');
  return data;
};

export const fetchPortalVaginalSwabs = async () => {
  const { data } = await portalApi.get('/portal/vaginal-swabs');
  return data;
};

export const fetchPortalBp = async () => {
  const { data } = await portalApi.get('/portal/blood-pressure');
  return data;
};

export const fetchPortalGlucose = async () => {
  const { data } = await portalApi.get('/portal/glucose');
  return data;
};

export const createPortalBp = async (dto: { date: string; time: string; systolic: number; diastolic: number; location?: string }) => {
  const { data } = await portalApi.post('/portal/blood-pressure', dto);
  return data;
};

export const createPortalGlucose = async (dto: { date: string; mealType: string; value: number; measuredAt: string }) => {
  const { data } = await portalApi.post('/portal/glucose', dto);
  return data;
};

export const createPortalPatientExam = async (dto: any) => {
  const { data } = await portalApi.post('/portal/patient-exams', dto);
  return data;
};

export const fetchPortalPatientExams = async () => {
  const { data } = await portalApi.get('/portal/patient-exams');
  return data;
};

export const fetchPortalPostpartum = async () => {
  const { data } = await portalApi.get('/portal/postpartum');
  return data;
};

export const extractFromFilePortal = async (file: File, type: 'lab_result' | 'ultrasound') => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await portalApi.post(`/uploads/extract?type=${type}`, form, {
    headers: { 'Content-Type': undefined as any },
    timeout: 90000,
  });
  return data;
};
