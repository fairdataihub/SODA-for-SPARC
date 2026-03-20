import { useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import { Stepper, Divider } from "@mantine/core";
import { getAllStepsInfo } from "../../../stores/slices/stepperSlice";

const SodaStepper = ({ id }) => {
  const stepperState = useGlobalStore((state) => state.steppers[id]);
  const currentStep = stepperState?.["currentStep"] ?? 69;
  const steps = useGlobalStore((state) => state.steppers[id]?.steps || []);
  const curationMode = useGlobalStore((state) => state.curationMode);

  // Filter out "Dataset Metadata" in free-form mode
  const filteredSteps = curationMode === "free-form" 
    ? steps.filter((step) => step !== "Dataset Metadata")
    : steps;

  // Mantine Stepper expects the index of the active step
  const activeIndex = stepperState?.currentStep ?? 0;

  return (
    <>
      <Stepper active={activeIndex} size="sm" mx="xl" my="md">
        {filteredSteps.map((step, idx) => {
          return <Stepper.Step key={step} label={step} completed={step.completed} index={idx} />;
        })}
      </Stepper>
      <Divider my="md" />
    </>
  );
};

export default SodaStepper;
