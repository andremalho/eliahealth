import api from './client';
import portalApi from './portalClient';

export interface EducationalContent {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  category: string;
  contentType: string;
  tags: string[] | null;
  imageUrl: string | null;
  videoUrl: string | null;
  gaWeekMin: number | null;
  gaWeekMax: number | null;
  authorName: string | null;
}

// Admin
export const createContent = async (dto: Record<string, unknown>) =>
  (await api.post('/content', dto)).data;

export const fetchAllContent = async (category?: string) =>
  (await api.get('/content', { params: { category } })).data as EducationalContent[];

export const updateContent = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/content/${id}`, dto)).data;

export const deleteContent = async (id: string) =>
  (await api.delete(`/content/${id}`)).data;

// Patient portal
export const fetchPatientContent = async (gaWeek?: number) =>
  (await portalApi.get('/content/patient', { params: { gaWeek } })).data as EducationalContent[];

export const CATEGORY_LABELS: Record<string, string> = {
  pregnancy: 'Gravidez', postpartum: 'Pós-parto', gynecology: 'Ginecologia',
  menopause: 'Menopausa', fertility: 'Fertilidade', nutrition: 'Nutrição',
  exercise: 'Exercicio', mental_health: 'Saúde Mental', general: 'Geral',
};
