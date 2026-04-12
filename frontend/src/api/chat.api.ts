import api from './client';
import portalApi from './portalClient';

// Doctor side
export const sendMessage = async (patientId: string, content: string, attachmentUrl?: string) =>
  (await api.post('/chat/send', { patientId, content, attachmentUrl })).data;

export const fetchConversations = async () =>
  (await api.get('/chat/conversations')).data;

export const fetchMessages = async (patientId: string, page = 1) =>
  (await api.get(`/chat/messages/${patientId}`, { params: { page } })).data;

export const markRead = async (patientId: string) =>
  (await api.post(`/chat/read/${patientId}`)).data;

export const fetchUnreadCount = async () =>
  (await api.get('/chat/unread')).data;

// Patient side (portal)
export const patientSendMessage = async (doctorId: string, content: string) =>
  (await portalApi.post('/chat/patient/send', { doctorId, content })).data;

export const patientFetchConversations = async () =>
  (await portalApi.get('/chat/patient/conversations')).data;

export const patientFetchMessages = async (doctorId: string, page = 1) =>
  (await portalApi.get(`/chat/patient/messages/${doctorId}`, { params: { page } })).data;

export const patientMarkRead = async (doctorId: string) =>
  (await portalApi.post(`/chat/patient/read/${doctorId}`)).data;
