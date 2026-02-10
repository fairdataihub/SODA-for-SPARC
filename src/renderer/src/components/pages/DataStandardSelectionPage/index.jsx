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
            Select the data standard you will use to organize your dataset. SODA will guide you
            through the curation process based on the selected standard to ensure your dataset is
            organized correctly.
          </Text>
          <Text>
            <b>Not sure which standard to choose?</b> Select the SPARC Data Standard. SPARC is the
            default standard used in SODA. RE-JOIN and PRECISION data standards are an extension of
            SPARC and should only be selected if your dataset is part of the NIH HEAL initiative and
            requires additional metadata that is specific to HEAL projects.
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
