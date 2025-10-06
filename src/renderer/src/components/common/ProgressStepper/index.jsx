import { useEffect } from "react";
import useGlobalStore from "../../../stores/globalStore";
import { Stepper, Divider } from "@mantine/core";
import { getAllStepsInfo } from "../../../stores/slices/stepperSlice";

const SodaStepper = ({ id }) => {
  const stepperState = useGlobalStore((state) => state.steppers[id]);
  const currentStep = stepperState?.["currentStep"] ?? 69;
  const steps = useGlobalStore((state) => state.steppers[id]?.steps || []);

  // Mantine Stepper expects the index of the active step
  const activeIndex = stepperState?.currentStep ?? 0;

  return (
    <>
      <Stepper active={activeIndex} size="sm" mx="xl" my="md">
        {steps.map((step, idx) => {
          return <Stepper.Step key={step} label={step} completed={step.completed} index={idx} />;
        })}
      </Stepper>
      <Divider my="md" />
    </>
  );
};

export default SodaStepper;
