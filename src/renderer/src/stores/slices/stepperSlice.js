import useGlobalStore from "../globalStore";

export const stepperSlice = (set) => ({
  steppers: {
    "guided-mode-progress-stepper": {
      steps: ["Getting Started", "Dataset Structure", "Dataset Metadata", "Generate Dataset"],
      currentStep: 0,
    },
  },
});

// Helper to get stepper and step index
const resolveStep = (stepperId, step) => {
  const state = useGlobalStore.getState();
  const stepper = state.steppers[stepperId];
  if (!stepper) return {};
  const steps = stepper.steps;
  const index = typeof step === "number" ? step : steps.indexOf(step);
  if (index === -1) return {};
  return { stepper, index, steps, state };
};

export const setCurrentStep = (stepperId, step) => {
  console.log("setCurrentStep", stepperId, step);
  useGlobalStore.setState((state) => {
    const { stepper, index } = resolveStep(stepperId, step);
    if (!stepper) return {};
    return {
      steppers: {
        ...state.steppers,
        [stepperId]: {
          ...stepper,
          currentStep: index,
        },
      },
    };
  });
};

export const getStepInfo = (stepperId, step) => {
  const { stepper, index, steps } = resolveStep(stepperId, step);
  if (!stepper) return null;
  return {
    id: steps[index],
    index,
    isCurrent: stepper.currentStep === index,
    completed: stepper.currentStep > index,
  };
};

export const getAllStepsInfo = (stepperId) => {
  const state = useGlobalStore.getState();
  const stepper = state.steppers[stepperId];
  if (!stepper) return [];
  return stepper.steps.map((id, index) => ({
    id,
    index,
    isCurrent: stepper.currentStep === index,
    completed: stepper.currentStep > index,
  }));
};
