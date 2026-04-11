import api from './client';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const setDoctorSchedule = async (schedules: {
  dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number;
}[]) => (await api.post('/appointments/schedules', { schedules })).data;

export const getDoctorSchedule = async (doctorId: string) =>
  (await api.get(`/appointments/schedules/${doctorId}`)).data;

export const blockDate = async (date: string, reason?: string) =>
  (await api.post('/appointments/blocked-dates', { date, reason })).data;

export const getBlockedDates = async (doctorId: string) =>
  (await api.get(`/appointments/blocked-dates/${doctorId}`)).data;

export const unblockDate = async (id: string) =>
  (await api.delete(`/appointments/blocked-dates/${id}`)).data;

export const getAvailableSlots = async (doctorId: string, date: string) =>
  (await api.get('/appointments/available-slots', { params: { doctorId, date } })).data as TimeSlot[];

export const autoSchedulePrenatal = async (pregnancyId: string) =>
  (await api.post(`/appointments/auto-schedule/${pregnancyId}`)).data;

export const getAutoScheduled = async (pregnancyId: string) =>
  (await api.get(`/appointments/auto-schedule/${pregnancyId}`)).data;

const DAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
export { DAY_LABELS };
