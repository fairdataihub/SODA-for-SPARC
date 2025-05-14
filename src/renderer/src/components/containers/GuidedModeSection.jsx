import { Stack } from "@mantine/core";
import SodaPaper from "../utils/ui/SodaPaper";

const GuidedModeSection = ({ children, sectionId, withBorder }) => {
  // If withBorder is true, wrap the Stack in a SodaPaper
  if (withBorder) {
    return (
      <SodaPaper>
        <Stack gap="md" w="100%" id={sectionId}>
          {children}
        </Stack>
      </SodaPaper>
    );
  }

  // Otherwise, just return the Stack directly
  return (
    <Stack gap="md" w="100%" id={sectionId}>
      {children}
    </Stack>
  );
};

export default GuidedModeSection;
