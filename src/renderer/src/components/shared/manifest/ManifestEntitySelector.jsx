import { Grid, Button } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore"; // or wherever your store hook is

const ManifestEntitySelector = () => {
  const setDatasetStructureJSONObj = useGlobalStore((state) => state.setDatasetStructureJSONObj);
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);

  const handleButtonClick = () => {
    console.log(window.datasetStructureJSONObj);
    setDatasetStructureJSONObj({ hi: "test" });
  };

  return (
    <FullWidthContainer>
      <Button onClick={handleButtonClick}>Set Name</Button>
      <Grid>
        <Grid.Col span={3}>Entity</Grid.Col>
        <Grid.Col span={9}>{JSON.stringify(datasetStructureJSONObj)}</Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default ManifestEntitySelector;
