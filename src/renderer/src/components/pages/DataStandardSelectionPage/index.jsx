import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { Stack, Text, Center } from "@mantine/core";
import CheckboxCard from "../../cards/CheckboxCard";

const DataStandardSelectionPage = () => {
  return (
    <GuidedModePage pageHeader="Data Standard Selection">
      <GuidedModeSection>
        <Stack>
          <Text>
            Choose the data standard for your dataset. If you are not sure which to use, select
            SPARC, the default in SODA. REJOIN and PRECISION should only be selected for NIH HEAL
            projects that require additional HEAL-specific metadata.
          </Text>
        </Stack>
      </GuidedModeSection>
      <GuidedModeSection>
        <Center>
          <CheckboxCard id="sparc-data-standard" />
          <CheckboxCard id="heal-rejoin-data-standard" />
          <CheckboxCard id="heal-precision-data-standard" />
        </Center>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataStandardSelectionPage;
