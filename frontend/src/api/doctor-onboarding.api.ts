import api from './client';

export async function fetchOnboardingProgress(flowName: string) {
  const { data } = await api.get(`/doctor-onboarding/progress/${flowName}`);
  return data;
}

export async function updateOnboardingProgress(
  flowName: string,
  body: { currentStep?: number; completed?: boolean; skipped?: boolean },
) {
  const { data } = await api.patch(`/doctor-onboarding/progress/${flowName}`, body);
  return data;
}

export async function restartOnboarding(flowName: string) {
  const { data } = await api.post(`/doctor-onboarding/restart/${flowName}`);
  return data;
}
