import useGlobalStore from "../globalStore";

export const stepperSlice = (set) => ({
  steppers: {
    "guided-mode-progress-stepper": {
      steps: ["Getting Started", "Dataset Structure", "Dataset Metadata", "Generate Dataset"],
      currentStep: 0,
    },
    "freeform-mode-progress-stepper": {
      steps: [
        "Import Data",
        "Pennsieve Account",
        "Select Dataset",
        "Manifest Files",
        "Generate Dataset",
      ],
      currentStep: 0,
    },
  },
});

// Internal helper to resolve stepper state
const resolveStep = (stepperId, step) => {
  const { steppers } = useGlobalStore.getState();
  const stepper = steppers[stepperId];
  if (!stepper) return {};

  const index = typeof step === "number" ? step : stepper.steps.indexOf(step);
  if (index === -1) return {};

  return { stepper, index, steps: stepper.steps };
};

export const setCurrentStep = (stepperId, step) => {
  useGlobalStore.setState((state) => {
    const stepper = state.steppers[stepperId];
    if (!stepper) return {};

    const index = typeof step === "number" ? step : stepper.steps.indexOf(step);
    if (index === -1 || index == null) return {};

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
  const resolved = resolveStep(stepperId, step);
  if (!resolved.stepper) return null;

  const { stepper, index, steps } = resolved;
  return {
    id: steps[index],
    index,
    isCurrent: stepper.currentStep === index,
    completed: stepper.currentStep > index,
  };
};

export const getAllStepsInfo = (stepperId) => {
  const { steppers } = useGlobalStore.getState();
  const stepper = steppers[stepperId];
  if (!stepper) return [];

  return stepper.steps.map((id, index) => ({
    id,
    index,
    isCurrent: stepper.currentStep === index,
    completed: stepper.currentStep > index,
  }));
};
