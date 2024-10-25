import { Grid, Button, Stack, Text, Paper, Divider, Group } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import {
  setActiveEntity,
  toggleRelativeFilePathForManifestEntity,
  getEntityForRelativePath,
} from "../../../stores/slices/manifestEntitySelectorSlice";
import { get } from "jquery";

const ManifestEntitySelector = () => {
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);
  const entityList = useGlobalStore((state) => state.entityList);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityType = useGlobalStore((state) => state.entityType);
  const manifestEntityObj = useGlobalStore((state) => state.manifestEntityObj);
  console.log("Manifest entity object:", JSON.stringify(manifestEntityObj, null, 2));
  const handleEntityClick = (entity) => {
    setActiveEntity(entity);
  };

  const handleFolderClick = (folderName, folderContents) => {
    console.log("Folder clicked:", folderName);
    console.log("Folder contents:", folderContents);
    console.log("Entity type:", entityType);
    toggleRelativeFilePathForManifestEntity(entityType, activeEntity, folderContents.relativePath);
  };

  const handleFileClick = (fileName, fileContents) => {
    console.log("File clicked:", fileName);
    console.log("File contents:", fileContents);
    console.log("Entity type:", entityType);
    toggleRelativeFilePathForManifestEntity(entityType, activeEntity, fileContents.relativePath);
  };

  const getFileBackgroundColor = (fileRelativePath) => {
    const filesEntity = getEntityForRelativePath(fileRelativePath);
    if (!filesEntity) {
      return null;
    }
    if (filesEntity === "sub-2") {
      console.log(fileRelativePath + " is sub-2");
    }

    return filesEntity === activeEntity ? "var(--color-transparent-soda-green)" : "red";
  };

  return (
    <FullWidthContainer>
      <Grid gutter="md">
        <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
          <Paper shadow="lg" p="sm" radius="md" withBorder>
            <Text size="xl" weight={700} align="center" c="dark">
              Subject list
            </Text>
            <Divider my="sm" />
            <Stack gap="xs">
              {entityList.map((entity) => (
                <Button
                  key={entity}
                  variant={activeEntity === entity ? "filled" : "outline"}
                  color={activeEntity === entity ? "blue" : "gray"}
                  size="compact-md"
                  onClick={() => handleEntityClick(entity)}
                >
                  <Text size="md" c={activeEntity === entity ? "white" : "black"}>
                    {entity}
                  </Text>
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={8}>
          <Paper shadow="sm" p="lg" radius="md">
            <DatasetTreeViewRenderer
              datasetStructure={datasetStructureJSONObj}
              onFolderClick={handleFolderClick}
              onFileClick={handleFileClick}
              getFileBackgroundColor={getFileBackgroundColor}
            />
          </Paper>
        </Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default ManifestEntitySelector;
