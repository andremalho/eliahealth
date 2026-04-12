import api from './client';

export interface TenantConfig {
  id: string;
  name: string;
  type: 'consultorio' | 'ubs' | 'hospital';
  modPrenatal: boolean;
  modGynecology: boolean;
  modUltrasound: boolean;
  modPostpartum: boolean;
  modInfertility: boolean;
  modAssistedReproduction: boolean;
  modMenopause: boolean;
  modClinicalGeneral: boolean;
  modHospitalization: boolean;
  modEvolution: boolean;
  modPortal: boolean;
  modScheduling: boolean;
  modResearch: boolean;
  modTelemedicine: boolean;
  modTissBilling: boolean;
  modFhirRnds: boolean;
}

export const fetchMyModules = async () =>
  (await api.get<string[]>('/tenants/my/modules')).data;

export const fetchMyConfig = async () =>
  (await api.get<TenantConfig>('/tenants/my/config')).data;

export const updateMyConfig = async (dto: Partial<TenantConfig>) =>
  (await api.patch('/tenants/my/config', dto)).data;

export const setTenantType = async (type: 'consultorio' | 'ubs' | 'hospital') =>
  (await api.post('/tenants/my/type', { type })).data;
