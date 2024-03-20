import useGuidedModeStore from "../../../stores/guidedModeStore";
import GuidedModePageContainer from "../../containers/GuidedModePageContainer";
import { TextInput, Textarea } from "@mantine/core";

const NameAndSubtitlePage = () => {
  const { datasetName, setDatasetName, datasetSubtitle, setDatasetSubtitle } = useGuidedModeStore();

  return (
    <GuidedModePageContainer>
      <TextInput
        label="Dataset Name"
        placeholder="Enter dataset name"
        description="This is the name of your dataset"
        value={datasetName}
        onChange={(event) => setDatasetName(event.target.value)}
      />
      <Textarea
        label="Dataset Subtitle"
        placeholder="Enter dataset subtitle"
        value={datasetSubtitle}
        onChange={(event) => setDatasetSubtitle(event.target.value)}
      />
    </GuidedModePageContainer>
  );
};

export default NameAndSubtitlePage;
