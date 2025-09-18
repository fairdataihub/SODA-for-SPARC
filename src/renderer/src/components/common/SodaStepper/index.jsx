import { useState } from "react";
import { Stepper } from "@mantine/core";
import { IconCircleX } from "@tabler/icons-react";

const SodaStepper = () => {
  const [active, setActive] = useState(2);
  // Example: mark step 2 as error
  const errorStep = 1; // zero-based index

  return (
    <Stepper active={active} onStepClick={setActive} size="sm">
      <Stepper.Step label="Getting Started"></Stepper.Step>
      <Stepper.Step label="Dataset Structure" />
      <Stepper.Step label="Dataset Metadata" />
      <Stepper.Step label="Generate Dataset" />
    </Stepper>
  );
};

export default SodaStepper;
