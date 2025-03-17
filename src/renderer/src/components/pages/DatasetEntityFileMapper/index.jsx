import { useMemo, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconSearch } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Progress, Box, Tooltip } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import SelectedHierarchyEntityPreviewer from "../../shared/SelectedHierarchyEntityPreviewer";

import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  checkIfRelativePathBelongsToEntity,
  areAllFilesInFolderSelectedForEntity,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const handleFileClick = (
  selectedHierarchyEntity,
  fileContents,
  fileIsSelected,
  mutuallyExclusive // Remove default value - require explicit parameter
) => {
  console.log("handleFileClick");
  const entityId = selectedHierarchyEntity.id;
  console.log("entityId", entityId);
  console.log("fileContents", fileContents);
  console.log("fileIsSelected", fileIsSelected);
  modifyDatasetEntityForRelativeFilePath(
    "entity-to-file-mapping",
    entityId,
    fileContents.relativePath,
    "toggle",
    mutuallyExclusive
  );
};

const handleFolderClick = (
  entityType,
  activeEntity,
  datasetEntityObj,
  folderContents,
  folderWasSelectedBeforeClick,
  mutuallyExclusive // Remove default value - require explicit parameter
) => {
  const action = folderWasSelectedBeforeClick ? "remove" : "add";

  // IMPORTANT: We only map individual files to entities, never the folder paths themselves.
  // This ensures the entity mapping only contains actual files, not folders.

  // Process all files in the folder
  Object.values(folderContents.files).forEach((file) => {
    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      file.relativePath,
      action,
      mutuallyExclusive
    );
  });

  // Recursively process subfolders (only their contained files)
  Object.values(folderContents.folders).forEach((subFolder) => {
    handleFolderClick(
      entityType,
      activeEntity,
      datasetEntityObj,
      subFolder,
      folderWasSelectedBeforeClick,
      mutuallyExclusive
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

const DatasetEntityFileMapper = () => {
  const entityType = "entity-to-file-mapping";
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  console.log("selectedHierarchyEntity", selectedHierarchyEntity);
  const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
  console.log("selectedEntityId", selectedEntityId);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);

  return (
    <GuidedModePage pageHeader={"Dataset entity file association"}>
      <GuidedModeSection>
        <Stack>
          <Text>
            Map your dataset files to the appropriate entities in your data structure. First, select
            an entity from the hierarchy on the left, then choose the corresponding files from your
            dataset on the right.
          </Text>
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
              {selectedHierarchyEntity ? (
                <SelectedHierarchyEntityPreviewer />
              ) : (
                <Text size="lg" fw={500} mb="md">
                  Select an Entity
                </Text>
              )}

              <EntityHierarchyRenderer
                allowEntityStructureEditing={false}
                allowEntitySelection={true}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            {selectedHierarchyEntity ? (
              <Paper shadow="sm" radius="md">
                <DatasetTreeViewRenderer
                  itemSelectInstructions={getInstructionalTextByEntityType(
                    selectedHierarchyEntity.type
                  )}
                  mutuallyExclusiveSelection={false}
                  folderActions={{
                    "on-folder-click": (
                      folderName,
                      folderContents,
                      folderIsSelected,
                      mutuallyExclusive
                    ) => {
                      handleFolderClick(
                        entityType,
                        selectedEntityId,
                        datasetEntityObj,
                        folderContents,
                        folderIsSelected,
                        mutuallyExclusive
                      );
                    },
                    "is-folder-selected": (folderName, folderContents) => {
                      // Use the imported function from store
                      return areAllFilesInFolderSelectedForEntity(
                        selectedEntityId,
                        folderContents,
                        entityType
                      );
                    },
                  }}
                  fileActions={{
                    "on-file-click": (fileName, fileContents, fileIsSelected, mutuallyExclusive) =>
                      handleFileClick(
                        selectedHierarchyEntity,
                        fileContents,
                        fileIsSelected,
                        mutuallyExclusive
                      ),
                    "is-file-selected": (fileName, fileContents) => {
                      return checkIfRelativePathBelongsToEntity(
                        selectedEntityId,
                        fileContents.relativePath,
                        entityType
                      );
                    },
                  }}
                  entityType={entityType}
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
