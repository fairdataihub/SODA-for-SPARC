import React, { useEffect } from "react";
import { Grid, Paper, Box, Text, Title, Stack, Group, Button, Divider } from "@mantine/core";
import { IconFolders, IconFilter } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityFileFilterControl from "../../shared/EntityFileFilterControl";
import FileExplorer from "../../shared/FileExplorer";
import EntitySelector from "../../shared/EntitySelector";
import useGlobalStore from "../../../stores/globalStore";
import {
  setTreeViewDatasetStructure,
  setEntityFilter,
  clearEntityFilter,
} from "../../../stores/slices/datasetTreeViewSlice";
import { addEntityToEntityList } from "../../../stores/slices/datasetEntitySelectorSlice";

/**
 * DatasetCategorization Component
 *
 * This page allows users to categorize files into different entities (e.g., Code, Experimental data)
 * and filter the file explorer to show only files associated with specific entities.
 */
const DatasetCategorization = ({ autoApplyFilter = true }) => {
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityFilterActive = useGlobalStore((state) => state.entityFilterActive);
  const entityFilterType = useGlobalStore((state) => state.entityFilterType);
  const entityFilterName = useGlobalStore((state) => state.entityFilterName);

  // Initialize entity categories and set initial filter
  useEffect(() => {
    // Initialize the categorized-data entity type with buckets if it doesn't exist
    const bucketTypes = ["Code", "Experimental data", "Other"];

    bucketTypes.forEach((bucketType) => {
      addEntityToEntityList("categorized-data", bucketType);
    });

    // Set the file explorer to show the root folder structure
    if (datasetStructureJSONObj) {
      setTreeViewDatasetStructure(datasetStructureJSONObj, []);
    }

    // Auto-apply filter if enabled and not already active
    if (autoApplyFilter && !entityFilterActive) {
      autoApplyEntityFilter();
    }
  }, [datasetStructureJSONObj]);

  /**
   * Automatically applies an entity filter based on existing categorized data
   * Finds the entity with the most files associated with it
   */
  const autoApplyEntityFilter = () => {
    if (!datasetEntityObj || !datasetEntityObj["categorized-data"]) return;

    // Find entity with the most associated files to use as default filter
    let bestEntityName = null;
    let maxFileCount = 0;

    Object.entries(datasetEntityObj["categorized-data"]).forEach(([entityName, files]) => {
      const fileCount = Object.keys(files).length;
      console.log(`Entity ${entityName} has ${fileCount} files`);

      // Update if this entity has files and more than our current best
      if (fileCount > 0 && fileCount > maxFileCount) {
        maxFileCount = fileCount;
        bestEntityName = entityName;
      }
    });

    // Apply filter if we found an entity with files
    if (bestEntityName) {
      console.log(`Auto-applying filter for entity: ${bestEntityName}`);
      setEntityFilter("categorized-data", bestEntityName, true);
    } else {
      console.log("No entities with files found to auto-filter");
    }
  };

  return (
    <GuidedModePage pageHeader="Dataset Categorization">
      <GuidedModeSection>
        <Stack>
          <Text>
            Categorize your dataset's files and folders into different entity types. Use the filter
            control to show only files associated with a specific entity.
          </Text>
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="md">
          {/* Left Column - Entity Selector */}
          <Grid.Col span={3}>
            <Stack>
              <Paper shadow="sm" radius="md" p="md" withBorder>
                <Title order={5} mb="md">
                  Categories
                </Title>
                <EntitySelector entityType="categorized-data" />
              </Paper>

              {/* Entity File Filter Control */}
              <EntityFileFilterControl />
            </Stack>
          </Grid.Col>

          {/* Right Column - File Explorer */}
          <Grid.Col span={9}>
            <Paper shadow="sm" radius="md" p="md" withBorder>
              <Group position="apart" mb="md">
                <Group>
                  <IconFolders size={20} />
                  <Title order={5}>File Explorer</Title>
                </Group>

                {entityFilterActive && (
                  <Group spacing="xs">
                    <IconFilter size={16} />
                    <Text size="sm" color="blue" weight={500}>
                      Filtering by: {entityFilterName} ({entityFilterType})
                    </Text>
                  </Group>
                )}
              </Group>

              <Divider mb="md" />

              <Box style={{ minHeight: "400px" }}>
                <FileExplorer />
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetCategorization;
