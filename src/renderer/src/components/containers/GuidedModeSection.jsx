import { Stack } from "@mantine/core";
import SodaPaper from "../utils/ui/SodaPaper";
import useGlobalStore from "../../stores/globalStore";

const GuidedModeSection = ({ children, sectionId, withBorder, centered, mb, mt }) => {
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

  const stackProps = {
    gap: "md",
    w: "100%",
    id: sectionId,
    align: centered ? "center" : undefined,
    mt,
    mb,
  };

  // If withBorder is true, wrap the Stack in a SodaPaper
  if (withBorder) {
    return (
      <SodaPaper>
        <Stack {...stackProps}>{children}</Stack>
      </SodaPaper>
    );
  }

  // Otherwise, just return the Stack directly
  return <Stack {...stackProps}>{children}</Stack>;
};

export default GuidedModeSection;
