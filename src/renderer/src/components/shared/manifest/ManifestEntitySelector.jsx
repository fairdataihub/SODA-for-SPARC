import { Grid, Button, Stack } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const ManifestEntitySelector = () => {
  const setDatasetStructureJSONObj = useGlobalStore((state) => state.setDatasetStructureJSONObj);
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);

  const handleButtonClick = () => {
    console.log("Button clicked!");
    const datasetStructureJSONObjCopy = JSON.parse(JSON.stringify(window.datasetStructureJSONObj));
    setDatasetStructureJSONObj(datasetStructureJSONObjCopy);
  };

  return (
    <FullWidthContainer>
      <Button onClick={handleButtonClick}>Set Name</Button>
      <Grid>
        <Grid.Col span={4}>
          <Stack></Stack>
        </Grid.Col>
        <Grid.Col span={8}>
          <DatasetTreeViewRenderer datasetStructure={datasetStructureJSONObj} />
        </Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default ManifestEntitySelector;
