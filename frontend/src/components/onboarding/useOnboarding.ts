import { useState, useEffect, useCallback } from 'react';
import {
  fetchOnboardingProgress,
  updateOnboardingProgress,
} from '../../api/doctor-onboarding.api';
import { getStepsByFlow, type OnboardingStep } from './onboarding-steps';

export function useOnboarding(flowName: string) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    const flowSteps = getStepsByFlow(flowName);
    if (flowSteps.length === 0) return;

    setSteps(flowSteps);

    fetchOnboardingProgress(flowName)
      .then((progress) => {
        if (!progress || (!progress.completed && !progress.skipped)) {
          setCurrentStep(progress?.currentStep ?? 0);
          setIsActive(true);
        }
      })
      .catch(() => {
        // First time — show onboarding
        setIsActive(true);
      });
  }, [flowName]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      updateOnboardingProgress(flowName, { currentStep: newStep }).catch(() => {});
    } else {
      setIsActive(false);
      updateOnboardingProgress(flowName, { completed: true }).catch(() => {});
    }
  }, [currentStep, steps.length, flowName]);

  const skip = useCallback(() => {
    setIsActive(false);
    updateOnboardingProgress(flowName, { skipped: true }).catch(() => {});
  }, [flowName]);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return {
    isActive,
    currentStep,
    steps,
    step: steps[currentStep] ?? null,
    totalSteps: steps.length,
    next,
    skip,
    restart,
  };
}
