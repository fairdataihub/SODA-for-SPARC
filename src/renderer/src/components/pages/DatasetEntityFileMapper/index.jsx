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
  checkIfRelativePathBelongsToEntity,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const handleFileClick = (selectedHierarchyEntity, fileContents, fileIsSelected) => {
  console.log("handleFileClick");
  const entityId = selectedHierarchyEntity.id;
  console.log("entityId", entityId);
  console.log("fileContents", fileContents);
  console.log("fileIsSelected", fileIsSelected);
  modifyDatasetEntityForRelativeFilePath(
    "entity-to-file-mapping",
    entityId,
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
    "entity-to-file-mapping",
    activeEntity,
    folderContents.relativePath,
    action
  );

  Object.values(folderContents.files).forEach((file) => {
    modifyDatasetEntityForRelativeFilePath(
      "entity-to-file-mapping",
      activeEntity,
      file.relativePath,
      action
    );
  });

  Object.values(folderContents.folders).forEach((subFolder) => {
    handleFolderClick(
      "entity-to-file-mapping",
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

const DatasetEntityFileMapper = () => {
  const entityType = null;
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  return (
    <GuidedModePage pageHeader={"Dataset Entity File Mapper"}>
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
            {selectedHierarchyEntity ? (
              <Paper shadow="sm" radius="md">
                <DatasetTreeViewRenderer
                  itemSelectInstructions={getInstructionalTextByEntityType(entityType)}
                  folderActions={{
                    "on-folder-click": (folderName, folderContents, folderIsSelected) => {
                      handleFolderClick(
                        "entity-to-file-mapping",
                        activeEntity,
                        datasetEntityObj,
                        folderContents,
                        folderIsSelected
                      );
                    },
                    "is-folder-selected": (folderName, folderContents) => {
                      const entity = getEntityForRelativePath(
                        datasetEntityObj,
                        "entity-to-file-mapping",
                        folderContents.relativePath
                      );
                      if (!entity) return null;
                      return entity === activeEntity;
                    },
                  }}
                  fileActions={{
                    "on-file-click": (fileName, fileContents, fileIsSelected) =>
                      handleFileClick(selectedHierarchyEntity, fileContents, fileIsSelected),
                    "is-file-selected": (fileName, fileContents) => {
                      const entityId = selectedHierarchyEntity.id;
                      const fileIsSelected = checkIfRelativePathBelongsToEntity(
                        entityId,
                        fileContents.relativePath
                      );
                      return fileIsSelected;
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
