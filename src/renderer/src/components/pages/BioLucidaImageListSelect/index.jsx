import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { TextInput, Textarea, Text } from "@mantine/core";
import ExternalLink from "../../buttons/ExternalLink";

const BioLucidaImageListSelectPage = () => {
  const {selectedBioLucidaImages, setSelectedBioLucidaImages } = useGuidedModeStore();

  return (
    <GuidedModePage pageHeader="Dataset name and subtitle">
      <Text>asdf</Text>
      {selectedBioLucidaImages.map((image) => {
        return (
          <Text>{image}</Text>
        );})
      }
    </GuidedModePage>
  );
};

export default BioLucidaImageListSelectPage;
