import { useMemo } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconSearch } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Progress, Box, Tooltip } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  getEntityForRelativePath,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { externallySetSearchFilterValue } from "../../../stores/slices/datasetTreeViewSlice";

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

const getInstructionalTextByEntityType = (entityType) => {
  const instructionalText = {
    subject: "Select all folders and files that belong to this subject.",
    sample: "Select all folders and files that belong to this sample.",
    collection: "Select all folders and files that belong to this collection.",
    default: "Select the files that should be associated with this entity.",
  };

  return instructionalText[entityType] || instructionalText.default;
};

const getProgressSectionColorByEntityType = (entityType) => {
  const colorMap = {
    subject: "blue",
    sample: "green",
    collection: "orange",
  };
  return colorMap[entityType] || "cyan";
};

const DatasetEntityFileMapper = ({
  pageName = "Dataset Entity File Mapper",
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);

  const countItemsInDatasetStructure = (datasetStructure) => {
    if (!datasetStructure) return 0;
    let totalItems = 0;
    const keys = Object.keys(datasetStructure);

    for (const key of keys) {
      if (key === "files") {
        totalItems += Object.keys(datasetStructure[key]).length;
      }
      if (key === "folders") {
        const folders = Object.keys(datasetStructure[key]);
        totalItems += folders.length;
        for (const folder of folders) {
          totalItems += countItemsInDatasetStructure(datasetStructure[key][folder]);
        }
      }
    }
    return totalItems;
  };

  const countSelectedItemsByEntityType = (entityType) => {
    if (!datasetEntityObj?.[entityType]) return 0;
    return Object.values(datasetEntityObj[entityType]).reduce(
      (acc, entity) => acc + entity.length,
      0
    );
  };

  const itemCount = countItemsInDatasetStructure(datasetStructureJSONObj) - 1; // Subtract 1 to exclude the root folder
  const countItemsSelected = countSelectedItemsByEntityType(entityType);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Stack>
          <Text>
            Map your dataset files to the appropriate entities in your data structure. First, select
            an entity from the hierarchy on the left, then choose the corresponding files from your
            dataset on the right.
          </Text>
        </Stack>
      </GuidedModeSection>

      {datasetEntityObj?.[entityType] && (
        <GuidedModeSection>
          <Paper p="xs" shadow="sm">
            <Text size="sm" c="gray">
              Progress: {countItemsSelected} of {itemCount} files mapped
            </Text>
            <Progress.Root size="xl">
              {Object.keys(datasetEntityObj[entityType]).map((entity) => {
                const entityItemsCount = datasetEntityObj[entityType][entity].length || 0;
                const progressValue = (entityItemsCount / itemCount) * 100;

                return (
                  <Progress.Section
                    value={progressValue}
                    color={getProgressSectionColorByEntityType(entityType)}
                    key={entity}
                  >
                    <Progress.Label>{entity}</Progress.Label>
                  </Progress.Section>
                );
              })}
            </Progress.Root>
          </Paper>
        </GuidedModeSection>
      )}

      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
              <Text size="lg" fw={500} mb="md">
                Entity Hierarchy
              </Text>
              <EntityHierarchyRenderer
                allowEntityStructureEditing={false}
                allowEntitySelection={true}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            {activeEntity ? (
              <Paper shadow="sm" radius="md">
                <DatasetTreeViewRenderer
                  itemSelectInstructions={getInstructionalTextByEntityType(entityType)}
                  folderActions={{
                    "on-folder-click": (folderName, folderContents, folderIsSelected) => {
                      handleFolderClick(
                        entityType,
                        activeEntity,
                        datasetEntityObj,
                        folderContents,
                        folderIsSelected
                      );
                    },
                    "is-folder-selected": (folderName, folderContents) => {
                      const entity = getEntityForRelativePath(
                        datasetEntityObj,
                        entityType,
                        folderContents.relativePath
                      );
                      if (!entity) return null;
                      return entity === activeEntity;
                    },
                  }}
                  fileActions={{
                    "on-file-click": (fileName, fileContents) =>
                      handleFileClick(entityType, activeEntity, datasetEntityObj, fileContents),
                    "is-file-selected": (fileName, fileContents) => {
                      const entity = getEntityForRelativePath(
                        datasetEntityObj,
                        entityType,
                        fileContents.relativePath
                      );
                      if (!entity) return null;
                      return entity === activeEntity;
                    },
                  }}
                />
              </Paper>
            ) : (
              <Box p="xl">
                <Text size="xl" c="gray">
                  Select an entity from the hierarchy on the left to map files to it.
                </Text>
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityFileMapper;
