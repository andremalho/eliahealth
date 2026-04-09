import { create } from 'zustand';

interface PortalPatient {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

interface PatientAuthState {
  patient: PortalPatient | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, patient: PortalPatient) => void;
  logout: () => void;
}

export const usePatientAuthStore = create<PatientAuthState>((set) => {
  const storedToken = localStorage.getItem('elia_portal_token');
  const storedPatient = localStorage.getItem('elia_portal_patient');

  return {
    token: storedToken,
    patient: storedPatient ? JSON.parse(storedPatient) : null,
    isAuthenticated: !!storedToken,

    login: (token, patient) => {
      localStorage.setItem('elia_portal_token', token);
      localStorage.setItem('elia_portal_patient', JSON.stringify(patient));
      set({ token, patient, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('elia_portal_token');
      localStorage.removeItem('elia_portal_patient');
      set({ token: null, patient: null, isAuthenticated: false });
    },
  };
});
