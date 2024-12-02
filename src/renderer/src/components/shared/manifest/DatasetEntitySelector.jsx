import { Grid, Button, Stack, Title, Paper, Divider, Text, Box, Group, rem } from "@mantine/core";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  getEntityForRelativePath,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const DatasetEntitySelector = () => {
  const { entityList, entityListName, activeEntity, entityType, datasetEntityObj } = useGlobalStore(
    (state) => ({
      entityList: state.entityList,
      entityListName: state.entityListName,
      activeEntity: state.activeEntity,
      entityType: state.entityType,
      datasetEntityObj: state.datasetEntityObj,
    })
  );

  const handleEntityClick = (entity) => {
    setActiveEntity(entity);
  };

  const handleFileClick = (fileName, fileContents) => {
    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      fileContents.relativePath,
      "toggle"
    );
  };

  const handleFolderClick = (folderName, folderContents, folderClickAction) => {
    console.log("handleFolderClick", folderClickAction);
    /*if (folderClickAction === "folder-select") {
      modifyDatasetEntityForRelativeFilePath(
        entityType,
        activeEntity,
        folderContents.relativePath,
        "toggle"
      );
      return;
    }*/

    if (folderClickAction === "folder-files-select") {
      // Get all of the files that do not belong to a seperate entity and are not claimed
      const fileEntities = Object.keys(folderContents.files)
        .map((file) => folderContents.files[file].relativePath)
        .filter((fileEntity) => {
          const entity = getEntityForRelativePath(datasetEntityObj, entityType, fileEntity);
          console.log("Entity", entity);

          return !entity || entity === activeEntity;
        });
      // Check to see if all of the files are already claimed by the active entity
      const allFilesClaimed = fileEntities.every((fileEntity) => {
        const entity = getEntityForRelativePath(datasetEntityObj, entityType, fileEntity);
        return entity === activeEntity;
      });
      console.log("All files claimed", allFilesClaimed);
      // If all files are claimed, unclaim them
      if (allFilesClaimed) {
        fileEntities.forEach((fileEntity) => {
          console;
          modifyDatasetEntityForRelativeFilePath(entityType, activeEntity, fileEntity, "remove");
        });
      } else {
        // Otherwise, claim them
        fileEntities.forEach((fileEntity) => {
          modifyDatasetEntityForRelativeFilePath(entityType, activeEntity, fileEntity, "add");
        });
      }
    }

    if (folderClickAction === "folder-recursive-select") {
      const clickedFoldersEntity = getEntityForRelativePath(
        datasetEntityObj,
        entityType,
        folderContents.relativePath
      );
      console.log("Clicked folders entity", clickedFoldersEntity);
      // If the folder is already claimed by an entity, recursively unclaim the entity and all of its contents
      if (clickedFoldersEntity === activeEntity) {
        const unclaimEntity = (folderContents) => {
          modifyDatasetEntityForRelativeFilePath(
            entityType,
            activeEntity,
            folderContents.relativePath,
            "remove"
          );
          for (const file of Object.keys(folderContents.files)) {
            const filesRelativePath = folderContents.files[file].relativePath;
            modifyDatasetEntityForRelativeFilePath(
              entityType,
              activeEntity,
              filesRelativePath,
              "remove"
            );
          }
          for (const subFolder of Object.keys(folderContents.folders)) {
            unclaimEntity(folderContents.folders[subFolder]);
          }
        };
        unclaimEntity(folderContents);
      } else {
        // Otherwise, claim the folder and all of its contents
        const claimEntity = (folderContents) => {
          modifyDatasetEntityForRelativeFilePath(
            entityType,
            activeEntity,
            folderContents.relativePath,
            "add"
          );
          for (const file of Object.keys(folderContents.files)) {
            const filesRelativePath = folderContents.files[file].relativePath;
            modifyDatasetEntityForRelativeFilePath(
              entityType,
              activeEntity,
              filesRelativePath,
              "add"
            );
          }
          for (const subFolder of Object.keys(folderContents.folders)) {
            claimEntity(folderContents.folders[subFolder]);
          }
        };
        claimEntity(folderContents);
      }

      /*
      // Mark the folder itself as part of the active entity if needed
      modifyDatasetEntityForRelativeFilePath(
        entityType,
        activeEntity,
        folderContents.relativePath,
        "add"
      );
      // Recursively toggle all subfolders and their contents
      for (const file of Object.keys(folderContents.files)) {
        const filesRelativePath = folderContents.files[file].relativePath;
        console.log("Files relative path", filesRelativePath);
        console.log(
          "Files entity",
          getEntityForRelativePath(datasetEntityObj, entityType, filesRelativePath)
        );

        modifyDatasetEntityForRelativeFilePath(entityType, activeEntity, filesRelativePath);
      }
      for (const subFolder of Object.keys(folderContents.folders)) {
        handleFolderClick(subFolder, folderContents.folders[subFolder], "folder-recursive-select");
      }*/
    }
  };

  return (
    <FullWidthContainer>
      <Grid gutter="lg">
        <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
          <Paper shadow="lg" p="md" radius="md" withBorder>
            <Group mb="md" spacing="xs">
              <Text size="lg" weight={500}>
                {entityListName}
              </Text>
            </Group>
            <Divider my="sm" />
            <Box
              style={{
                maxHeight: "70vh", // Contain list within a scrollable box
                overflowY: "auto",
              }}
            >
              {entityList.map((entity, index) => {
                const entityItemsCount = Object.keys(
                  datasetEntityObj?.[entityType]?.[entity] || {}
                ).length;
                const isActive = activeEntity === entity;

                return (
                  <Box
                    key={entity}
                    component="button"
                    onClick={() => handleEntityClick(entity)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      backgroundColor: isActive ? "#e3f2fd" : "transparent",
                      color: isActive ? "#0d47a1" : "#333",
                      padding: rem(8),
                      paddingLeft: rem(16), // Add space for hierarchy-like appearance
                      fontSize: rem(14),
                      lineHeight: 1.5,
                      fontWeight: isActive ? 500 : 400,
                      textDecoration: "none",
                      border: "none",
                      borderLeft: `3px solid ${isActive ? "#2196f3" : "transparent"}`, // Highlight active with a border
                      cursor: "pointer",
                      transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <Group justify="space-between">
                      <Text>{entity}</Text>
                      <Text size="sm" color={isActive ? "blue" : "gray"}>
                        {entityItemsCount}
                      </Text>
                    </Group>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={8}>
          {activeEntity ? (
            <Paper shadow="sm" radius="md">
              <DatasetTreeViewRenderer
                onFolderClick={handleFolderClick}
                onFileClick={handleFileClick}
                getEntityForRelativePath={getEntityForRelativePath}
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
