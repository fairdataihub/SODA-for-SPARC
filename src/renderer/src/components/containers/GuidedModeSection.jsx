import { Stack } from "@mantine/core";

const GuidedModeSection = ({ children, sectionId }) => {
  return (
    <Stack gap="sm" w="100%" id={sectionId}>
      {children}
    </Stack>
  );
};

export default GuidedModeSection;
