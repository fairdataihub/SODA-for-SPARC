import { Stack } from "@mantine/core";
import SodaPaper from "../utils/ui/SodaPaper";
import useGlobalStore from "../../stores/globalStore";

const GuidedModeSection = ({ children, sectionId, withBorder, centered }) => {
  const hiddenGuidedModeSections = useGlobalStore((state) => state.hiddenGuidedModeSections);

  // Return null if this section should be hidden
  if (sectionId && hiddenGuidedModeSections.includes(sectionId)) {
    console.log("Not rendering guided mode section:", sectionId);
    console.log("Hidden sections:", hiddenGuidedModeSections);
    return null;
  } else {
    if (sectionId) {
      console.log("Rendering guided mode section:", sectionId);
    }
  }

  // If withBorder is true, wrap the Stack in a SodaPaper
  if (withBorder) {
    return (
      <SodaPaper>
        <Stack gap="md" w="100%" id={sectionId} align={centered ? "center" : undefined}>
          {children}
        </Stack>
      </SodaPaper>
    );
  }

  // Otherwise, just return the Stack directly
  return (
    <Stack gap="md" w="100%" id={sectionId} align={centered ? "center" : undefined}>
      {children}
    </Stack>
  );
};
export default GuidedModeSection;
