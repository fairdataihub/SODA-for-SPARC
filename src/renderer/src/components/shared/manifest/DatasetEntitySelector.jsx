import { Grid, Button, Stack, Title, Paper, Divider, Text, Box } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import {
  setActiveEntity,
  toggleRelativeFilePathForDatasetEntity,
  getEntityForRelativePath,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const DatasetEntitySelector = () => {
  const entityList = useGlobalStore((state) => state.entityList);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityType = useGlobalStore((state) => state.entityType);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);

  const handleEntityClick = (entity) => {
    setActiveEntity(entity);
  };

  const handleFileClick = (fileName, fileContents) => {
    toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, fileContents.relativePath);
  };

  const getEntitySelectedStatus = (entityRelativePath) => {
    const entity = getEntityForRelativePath(datasetEntityObj, entityType, entityRelativePath);
    return entity;
  };

  const handleFolderClick = (folderName, folderContents, folderClickAction) => {
    if (folderClickAction === "folder-select") {
      toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, folderContents.relativePath);
      return;
    }

    if (folderClickAction === "folder-files-select") {
      // Check if all files have the same entity as the active entity
      const fileRelativePaths = Object.keys(folderContents.files).map(
        (file) => folderContents.files[file].relativePath
      );

      // Get the entities of all the files in the folder
      const fileEntities = fileRelativePaths.map((fileRelativePath) =>
        getEntityForRelativePath(datasetEntityObj, entityType, fileRelativePath)
      );

      // Determine if the files are consistent in terms of entity selection
      const allFilesHaveSameEntity = fileEntities.every((entity) => entity === activeEntity);

      // If all files in the folder are associated with the active entity, toggle selection
      if (allFilesHaveSameEntity) {
        fileRelativePaths.forEach((relativePath) => {
          toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, relativePath);
        });
      } else {
        // If the files belong to different entities, toggle each file independently
        fileRelativePaths.forEach((relativePath) => {
          toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, relativePath);
        });
      }
    }

    if (folderClickAction === "folder-recursive-select") {
      // Mark the folder itself as part of the active entity if needed
      toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, folderContents.relativePath);
      // Recursively toggle all subfolders and their contents
      for (const file of Object.keys(folderContents.files)) {
        const filesRelativePath = folderContents.files[file].relativePath;
        console.log("Files relative path", filesRelativePath);
        console.log(
          "Files entity",
          getEntityForRelativePath(datasetEntityObj, entityType, filesRelativePath)
        );

        toggleRelativeFilePathForDatasetEntity(entityType, activeEntity, filesRelativePath);
      }
      for (const subFolder of Object.keys(folderContents.folders)) {
        handleFolderClick(subFolder, folderContents.folders[subFolder], "folder-recursive-select");
      }
    }
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
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
                getEntitySelectedStatus={getEntitySelectedStatus}
              />
            </Paper>
          ) : (
            <Box p="xl">
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

export default DatasetEntitySelector;
