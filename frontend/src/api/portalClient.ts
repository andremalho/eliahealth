import axios from 'axios';

const portalApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('elia_portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('elia_portal_token');
      localStorage.removeItem('elia_portal_patient');
      // Redireciona apenas se a paciente estiver na area do portal
      if (window.location.pathname.startsWith('/portal') && window.location.pathname !== '/portal/login') {
        window.location.href = '/portal/login';
      }
    }
    return Promise.reject(error);
  },
);

export default portalApi;
