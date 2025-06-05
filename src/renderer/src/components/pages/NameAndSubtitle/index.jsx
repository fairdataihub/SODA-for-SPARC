import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DropDownNote from "../../utils/ui/DropDownNote";
import { TextInput, Textarea, Text, List } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";
import useGlobalStore from "../../../stores/globalStore";

import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../stores/slices/guidedModeSlice";

const NameAndSubtitlePage = () => {
  const guidedDatasetName = useGlobalStore((state) => state.guidedDatasetName);
  const guidedDatasetSubtitle = useGlobalStore((state) => state.guidedDatasetSubtitle);
  return (
    <GuidedModePage pageHeader="Dataset name and brief description">
      <GuidedModeSection>
        <TextInput
          label="Dataset Name:"
          required
          description="Enter a unique and informative name for your dataset."
          placeholder="Enter dataset name"
          value={guidedDatasetName}
          onChange={(event) => setGuidedDatasetName(event.target.value)}
        />
        <DropDownNote
          dropDownIcon="info"
          dropDownButtonText="What is the dataset name used for?"
          dropDownNote={
            <Text>
              The dataset name will be used for:
              <br />
              <List withPadding>
                <List.Item>As a placeholder to save your progress and resume it.</List.Item>
                <List.Item>
                  The title of your dataset in the dataset_description metadata file.
                </List.Item>
                <List.Item>
                  If you publish your dataset on the SPARC Portal, this name will be displayed as
                  the dataset title on the
                  <ExternalLink
                    href="https://sparc.science/"
                    buttonText="SPARC Data Portal"
                    buttonType="anchor"
                  />
                  .
                </List.Item>
              </List>
            </Text>
          }
        />
      </GuidedModeSection>
      <GuidedModeSection>
        <Textarea
          label="Brief dataset description:"
          placeholder="Summarize your dataset in a few sentences (255 characters max)"
          required
          autosize
          minRows={5}
          value={guidedDatasetSubtitle}
          onChange={(event) => setGuidedDatasetSubtitle(event.target.value)}
          maxLength={255}
        />
        <Text align="right" style={{ marginTop: "-35px", zIndex: "10", marginRight: "10px" }}>
          {255 - guidedDatasetSubtitle.length} characters remaining
        </Text>
        <DropDownNote
          dropDownIcon="info"
          dropDownButtonText="What is the dataset description used for?"
          dropDownNote={
            <Text>
              The description will be used for:
              <br />
              <List withPadding>
                <List.Item>
                  Appears as the description in your dataset_description metadata file.
                </List.Item>
                <List.Item>
                  If you publish your dataset on the SPARC Portal, this description will be shown
                  directly under the title on the
                  <ExternalLink
                    href="https://sparc.science/"
                    buttonText="SPARC Data Portal"
                    buttonType="anchor"
                  />
                  .
                </List.Item>
              </List>
            </Text>
          }
        />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default NameAndSubtitlePage;
