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
    <GuidedModePage pageHeader="Dataset Name">
      <GuidedModeSection>
        <TextInput
          label="Dataset Name:"
          required
          description="Enter a unique and informative name for your dataset."
          placeholder="Enter dataset name"
          value={guidedDatasetName}
          onChange={(event) => setGuidedDatasetName(event.target.value)}
        />

        <Textarea
          label="Brief dataset description:"
          description="Summarize your dataset in a few sentences (255 characters max)."
          placeholder="Enter dataset description"
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
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default NameAndSubtitlePage;
