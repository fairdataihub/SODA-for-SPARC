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
import { setDatasetStructureSearchFilter } from "../../../stores/slices/datasetTreeViewSlice";

const ENTITY_PREFIXES = ["sub-", "sam-", "perf-"];

const handleEntityClick = (entity) => setActiveEntity(entity);

const handleFileClick = (entityType, activeEntity, datasetEntityObj, fileContents) => {
  modifyDatasetEntityForRelativeFilePath(
    entityType,
    activeEntity,
    fileContents.relativePath,
    "toggle"
  );
};

const handleFolderClick = (
  entityType,
  activeEntity,
  datasetEntityObj,
  folderContents,
  folderWasSelectedBeforeClick
) => {
  const action = folderWasSelectedBeforeClick ? "remove" : "add";

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
    handleFolderClick(
      entityType,
      activeEntity,
      datasetEntityObj,
      subFolder,
      folderWasSelectedBeforeClick
    );
  });
};

const renderEntityList = (entityType, activeEntity, datasetEntityObj) => {
  if (!datasetEntityObj?.[entityType]) return null;

  return Object.keys(datasetEntityObj[entityType]).map((entity) => {
    const entityItemsCount = datasetEntityObj[entityType][entity].length || 0;
    console.log("entity", entity);
    console.log("activeEntity", activeEntity);
    const isActive = entity === activeEntity;
    console.log("isActive", isActive);

    // Check if search icon should be shown for specific entities
    const showSearchIcon = ENTITY_PREFIXES.some((prefix) => entity.startsWith(prefix));

    return (
      <Box
        key={entity}
        onClick={() => handleEntityClick(entity)}
        p="xs"
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
        <Group justify="space-between" align="center">
          <Text size="sm">{entity}</Text>
          <Group spacing="xs" align="center">
            <Text size="xs" fw={200}>
              {entityItemsCount}
            </Text>

            {showSearchIcon && (
              <Tooltip label="Search dataset for this entity" zIndex={2999}>
                <IconSearch
                  size={14}
                  onClick={(event) => {
                    event.stopPropagation(); // Prevent triggering parent `onClick` event
                    if (entity !== activeEntity) {
                      handleEntityClick(entity);
                    }
                    const entityName = entity.substring(entity.indexOf("-") + 1);
                    setDatasetStructureSearchFilter(entityName);
                  }}
                />
              </Tooltip>
            )}
          </Group>
        </Group>
      </Box>
    );
  });
};

const DatasetEntitySelector = () => {
  const { entityList, activeEntity, entityType, datasetEntityObj } = useGlobalStore((state) => ({
    entityList: state.entityList,
    activeEntity: state.activeEntity,
    entityType: state.entityType,
    datasetEntityObj: state.datasetEntityObj,
  }));

  return (
    <FullWidthContainer>
      <Grid gutter="lg">
        <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
          <Paper shadow="lg" p="md" radius="md" withBorder>
            <Group mb="sm" spacing="xs">
              <Text size="lg" weight={500}>
                {entityType}
              </Text>
            </Group>
            <Divider my="xs" />
            <Box sx={{ maxHeight: "70vh", overflowY: "auto" }}>
              {renderEntityList(entityType, activeEntity, datasetEntityObj)}
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={8}>
          {activeEntity ? (
            <Paper shadow="sm" radius="md">
              <DatasetTreeViewRenderer
                folderActions={{
                  "on-folder-click": (folderName, folderContents, folderIsSelected) =>
                    handleFolderClick(
                      entityType,
                      activeEntity,
                      datasetEntityObj,
                      folderContents,
                      folderIsSelected
                    ),
                  "is-folder-selected": (folderName, folderContents) => {
                    const entity = getEntityForRelativePath(
                      datasetEntityObj,
                      entityType,
                      folderContents.relativePath
                    );
                    return entity === activeEntity;
                  },
                }}
                fileActions={{
                  "on-file-click": (fileName, fileContents) =>
                    handleFileClick(entityType, activeEntity, datasetEntityObj, fileContents),
                  "is-file-selected": (fileContents) => {
                    console.log("Determining if file is selected", fileContents);
                    const entity = getEntityForRelativePath(
                      datasetEntityObj,
                      entityType,
                      fileContents.relativePath
                    );
                    return entity === activeEntity;
                  },
                }}
              />
            </Paper>
          ) : (
            <Box p="xl">
              <Text size="xl" c="gray">
                Select an item from the {entityType} on the left to map files to it.
              </Text>
            </Box>
          )}
        </Grid.Col>
      </Grid>
    </FullWidthContainer>
  );
};

export default DatasetEntitySelector;
