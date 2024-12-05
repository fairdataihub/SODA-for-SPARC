import { Grid, Paper, Divider, Text, Box, Group, Tooltip } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  getEntityForRelativePath,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { setDatasetstructureSearchFilter } from "../../../stores/slices/datasetTreeViewSlice";

const useDatasetEntityStore = () =>
  useGlobalStore((state) => ({
    entityList: state.entityList,
    entityListName: state.entityListName,
    activeEntity: state.activeEntity,
    entityType: state.entityType,
    datasetEntityObj: state.datasetEntityObj,
  }));

const handleEntityClick = (entity) => setActiveEntity(entity);

const handleFileClick = (entityType, activeEntity, datasetEntityObj, fileName, fileContents) => {
  modifyDatasetEntityForRelativeFilePath(
    entityType,
    activeEntity,
    fileContents.relativePath,
    "toggle"
  );
};

const recursiveFolderAction = (
  folderContents,
  entityType,
  activeEntity,
  datasetEntityObj,
  action
) => {
  modifyDatasetEntityForRelativeFilePath(
    entityType,
    activeEntity,
    folderContents.relativePath,
    action
  );

  Object.values(folderContents.files).forEach((file) => {
    modifyDatasetEntityForRelativeFilePath(entityType, activeEntity, file.relativePath, action);
  });

  Object.values(folderContents.folders).forEach((subFolder) => {
    recursiveFolderAction(subFolder, entityType, activeEntity, datasetEntityObj, action);
  });
};

const handleFolderClick = (
  entityType,
  activeEntity,
  datasetEntityObj,
  folderContents,
  folderClickAction
) => {
  if (folderClickAction === "folder-files-select") {
    const fileEntities = Object.keys(folderContents.files)
      .map((file) => folderContents.files[file].relativePath)
      .filter((fileEntity) => {
        const entity = getEntityForRelativePath(datasetEntityObj, entityType, fileEntity);
        return !entity || entity === activeEntity;
      });

    const allFilesClaimed = fileEntities.every((fileEntity) => {
      const entity = getEntityForRelativePath(datasetEntityObj, entityType, fileEntity);
      return entity === activeEntity;
    });

    fileEntities.forEach((fileEntity) => {
      modifyDatasetEntityForRelativeFilePath(
        entityType,
        activeEntity,
        fileEntity,
        allFilesClaimed ? "remove" : "add"
      );
    });
  }

  if (folderClickAction === "folder-recursive-select") {
    const clickedFoldersEntity = getEntityForRelativePath(
      datasetEntityObj,
      entityType,
      folderContents.relativePath
    );
    recursiveFolderAction(
      folderContents,
      entityType,
      activeEntity,
      datasetEntityObj,
      clickedFoldersEntity === activeEntity ? "remove" : "add"
    );
  }
};

const renderEntityList = (entityList, entityListName, activeEntity, datasetEntityObj) =>
  entityList.map((entity) => {
    const entityItemsCount = Object.keys(
      datasetEntityObj?.[datasetEntityObj.entityType]?.[entity] || {}
    ).length;
    const isActive = activeEntity === entity;

    return (
      <Box
        key={entity}
        component="button"
        onClick={() => handleEntityClick(entity)}
        p="sm"
        style={{
          width: "100%",
          backgroundColor: isActive ? "#e3f2fd" : "transparent",
          color: isActive ? "#0d47a1" : "#333",
          border: "none",
          borderLeft: `3px solid ${isActive ? "#2196f3" : "transparent"}`,
          cursor: "pointer",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        <Group justify="space-between">
          <Text>{entity}</Text>
          <Group spacing="xs">
            <Text size="sm">{entityItemsCount}</Text>

            <Tooltip label="Search dataset for this entity" zIndex={2999}>
              <IconSearch
                size={16}
                onClick={() => {
                  const knownEntityPrefixes = ["sub-", "sam-", "perf-"];
                  // Iterate through each prefix and check if the entity starts with it
                  let entityName = entity;
                  for (let prefix of knownEntityPrefixes) {
                    if (entity.startsWith(prefix)) {
                      // Remove the prefix if it matches
                      entityName = entity.substring(prefix.length);
                      break; // Stop once the first match is found
                    }
                  }

                  setDatasetstructureSearchFilter(entityName);
                }}
              />
            </Tooltip>
          </Group>
        </Group>
      </Box>
    );
  });

const DatasetEntitySelector = () => {
  const { entityList, entityListName, activeEntity, entityType, datasetEntityObj } =
    useDatasetEntityStore();

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
            <Box style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {renderEntityList(entityList, entityListName, activeEntity, datasetEntityObj)}
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={8}>
          {activeEntity ? (
            <Paper shadow="sm" radius="md">
              <DatasetTreeViewRenderer
                onFolderClick={(folderName, folderContents, folderClickAction) =>
                  handleFolderClick(
                    entityType,
                    activeEntity,
                    datasetEntityObj,
                    folderContents,
                    folderClickAction
                  )
                }
                onFileClick={(fileName, fileContents) =>
                  handleFileClick(
                    entityType,
                    activeEntity,
                    datasetEntityObj,
                    fileName,
                    fileContents
                  )
                }
                getEntityForRelativePath={getEntityForRelativePath}
              />
            </Paper>
          ) : (
            <Box p="xl">
              <Text size="xl" c="gray">
                Select an item from the {entityListName} on the left to map files to it.
              </Text>
            </Box>
          )}
        </Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default DatasetEntitySelector;
