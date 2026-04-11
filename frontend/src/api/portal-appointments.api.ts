import portalApi from './portalClient';

export const fetchMyAppointments = async () =>
  (await portalApi.get('/portal/appointments')).data;

export const fetchAvailableSlots = async (doctorId: string, date: string) =>
  (await portalApi.get('/portal/appointments/slots', { params: { doctorId, date } })).data as {
    startTime: string; endTime: string; available: boolean;
  }[];

export const bookAppointment = async (dto: {
  doctorId: string; date: string; startTime: string; endTime: string; notes?: string;
}) => (await portalApi.post('/portal/appointments/book', dto)).data;

export const cancelMyAppointment = async (id: string) =>
  (await portalApi.delete(`/portal/appointments/${id}`)).data;
