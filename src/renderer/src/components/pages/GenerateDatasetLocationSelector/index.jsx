import { Text, Group } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";

const GenerateDatasetLocationSelectorPage = () => {
  return (
    <GuidedModePage pageHeader="Options">
      <GuidedModeSection>
        <Text mb="md">
          Check the box for all of the locations you would like to generate your dataset to.
        </Text>
        <Group align="stretch" gap="md" justify="center">
          <CheckboxCard id="generate-dataset-locally" />
          <CheckboxCard id="generate-dataset-on-pennsieve" />
        </Group>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default GenerateDatasetLocationSelectorPage;
