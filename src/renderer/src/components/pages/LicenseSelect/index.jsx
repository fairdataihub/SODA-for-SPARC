import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";

import { Text } from "@mantine/core";
import DropDownNote from "../../utils/ui/DropDownNote";
import DropdownSelect from "../../common/DropdownSelect";

const LicenseSelectPage = () => {
  return (
    <GuidedModePage pageHeader="LICENSE">
      <GuidedModeSection>
        <Text>
          Please choose a License for your dataset. The license will dictate what future users can
          and cannot do with your dataset.
        </Text>
        <DropdownSelect id="license-select" />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default LicenseSelectPage;
