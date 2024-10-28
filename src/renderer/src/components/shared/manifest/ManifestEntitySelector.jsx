import { Grid, Button, Stack, Title, Paper, Divider, Text, Box } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import {
  setActiveEntity,
  toggleRelativeFilePathForManifestEntity,
  getEntityForRelativePath,
} from "../../../stores/slices/manifestEntitySelectorSlice";

const ManifestEntitySelector = () => {
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);
  const entityList = useGlobalStore((state) => state.entityList);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityType = useGlobalStore((state) => state.entityType);

  const handleEntityClick = (entity) => {
    setActiveEntity(entity);
  };

  const handleFolderClick = (folderName, folderContents) => {
    toggleRelativeFilePathForManifestEntity(entityType, activeEntity, folderContents.relativePath);
  };

  const handleFileClick = (fileName, fileContents) => {
    toggleRelativeFilePathForManifestEntity(entityType, activeEntity, fileContents.relativePath);
  };

  const getFileBackgroundColor = (fileRelativePath) => {
    const filesEntity = getEntityForRelativePath(fileRelativePath);
    return !filesEntity ? "transparent" : filesEntity === activeEntity ? "#D0E8FF" : "#F2F2F2";
  };

  return (
    <FullWidthContainer>
      <Grid gutter="lg">
        <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
          <Paper shadow="lg" p="md" radius="md" withBorder>
            <Title order={2} align="center" color="dark">
              Subject List
            </Title>
            <Divider my="md" />
            <Stack spacing="sm">
              {entityList.map((entity) => (
                <Button
                  key={entity}
                  variant={activeEntity === entity ? "filled" : "outline"}
                  color={activeEntity === entity ? "blue" : "gray"}
                  fullWidth
                  size="sm"
                  onClick={() => handleEntityClick(entity)}
                >
                  <Text c={activeEntity === entity ? "white" : "dark"}>{entity}</Text>
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={8}>
          {activeEntity ? (
            <Paper shadow="sm" p="xl" radius="md">
              <DatasetTreeViewRenderer
                datasetStructure={datasetStructureJSONObj}
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
                getFileBackgroundColor={getFileBackgroundColor}
              />
            </Paper>
          ) : (
            <Box p="xl" textAlign="center">
              <Text size="xl" c="gray">
                Select a subject from the list on the left to map files to it.
              </Text>
            </Box>
          )}
        </Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default ManifestEntitySelector;
