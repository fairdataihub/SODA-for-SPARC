import { useMemo, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconSearch } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Progress, Box, Tooltip } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";

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
  const entityId = selectedHierarchyEntity.id;

  modifyDatasetEntityForRelativeFilePath(
    "entity-to-file-mapping",
    entityId,
    fileContents.relativePath,
    "toggle",
    mutuallyExclusive
  );
};

const getInstructionalTextByEntityType = (entityType) => {
  const instructionalText = {
    subject: "Select all files that belong to the subject with the following attributes:",
    sample: "Select all files that belong to the sample with the following attributes:",
    site: "Select all files that belong to the site with the following attributes:",
    collection: "Select and files that belong to the collection with the following attributes:",
    default: "Select the files that should be associated with this entity.",
  };

  return instructionalText[entityType] || instructionalText.default;
};

const DatasetEntityFileMapper = ({ entityType }) => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const selectedEntityId = selectedHierarchyEntity ? selectedHierarchyEntity.id : null;
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
              <Text size="lg" fw={500} mb="sm">
                Select an entity
              </Text>
              <EntityHierarchyRenderer
                allowEntityStructureEditing={false}
                allowEntitySelection={true}
                onlyRenderEntityType={entityType}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            {selectedHierarchyEntity ? (
              <Paper shadow="sm" radius="md">
                <Text>if you see this check slack for code under rthis DatasetTreeViwRendeer</Text>
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
