import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DropDownNote from "../../utils/ui/DropDownNote";
import { TextInput, Textarea, Text } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";
import useGlobalStore from "../../../stores/globalStore";
import {
  setGuidedDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../stores/slices/guidedModeSlice";

const NameAndSubtitlePage = () => {
  const guidedDatasetName = useGlobalStore((state) => state.guidedDatasetName);
  const setGuidedDatasetName = useGlobalStore((state) => state.setGuidedDatasetName);
  return (
    <GuidedModePage pageHeader="Dataset name and subtitle">
      <GuidedModeSection>
        <TextInput
          label="Dataset Name:"
          placeholder="Enter dataset name"
          value={guidedDatasetName}
          onChange={(event) => setGuidedDatasetName(event.target.value)}
        />
        <DropDownNote
          dropDownIcon="info"
          dropDownButtonText="What is the dataset name used for?"
          dropDownNote={
            <Text>
              This field will be displayed in public as the title of the dataset once it is
              published on the
              <ExternalLink
                href="https://sparc.science/"
                buttonText="SPARC Data Portal"
                buttonType="anchor"
              />
              . Please make sure that your dataset name is unique and relatively informative.
            </Text>
          }
        />
      </GuidedModeSection>
      <GuidedModeSection>
        <Textarea
          label="Dataset Subtitle:"
          placeholder="Enter dataset subtitle"
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
          dropDownButtonText="What is the dataset subtitle used for?"
          dropDownNote={
            <Text>
              This field will become the short description visible immediately under the title of
              your dataset once it is published on the
              <ExternalLink
                href="https://sparc.science/"
                buttonText="SPARC Data Portal"
                buttonType="anchor"
              />
            </Text>
          }
        />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default NameAndSubtitlePage;
