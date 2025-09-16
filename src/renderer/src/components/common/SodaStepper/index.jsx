import { useState } from "react";
import { Stepper } from "@mantine/core";
import { IconCircleX } from "@tabler/icons-react";

const SodaStepper = () => {
  const [active, setActive] = useState(2);
  // Example: mark step 2 as error
  const errorStep = 1; // zero-based index

  return (
    <Stepper active={active} onStepClick={setActive} size="sm">
      <Stepper.Step label="Import data" />
      <Stepper.Step
        label="Pennsieve Information"
        color={active === errorStep ? "red" : undefined}
        completedIcon={active === errorStep ? <IconCircleX size={20} /> : undefined}
      />
      <Stepper.Step label="Select Dataset" />
      <Stepper.Step label="Manifest Files" />
      <Stepper.Step label="Generate Dataset" />
    </Stepper>
  );
};

export default SodaStepper;
