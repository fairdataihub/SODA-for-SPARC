import React from "react";
import { Grid, Paper, Box, Text, Title, Stack, Group, Divider, Alert, Badge } from "@mantine/core";
import { IconFolders, IconFilter, IconInfoCircle } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import FileExplorer from "../../shared/FileExplorer";
import EntitySelector from "../../shared/EntitySelector";
import useGlobalStore from "../../../stores/globalStore";

/**
 * EntityFileMapping Component
 *
 * This page displays files that have been categorized as "Experimental data"
 * for mapping to specific entity types (e.g., subjects, samples)
 */
const EntityFileMapping = () => {
  const entityFilterActive = useGlobalStore((state) => state.entityFilterActive);
  const entityFilterName = useGlobalStore((state) => state.entityFilterName);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);

  // Check if there is experimental data to show
  const hasExperimentalData =
    datasetEntityObj &&
    datasetEntityObj["categorized-data"] &&
    datasetEntityObj["categorized-data"]["Experimental data"] &&
    Object.keys(datasetEntityObj["categorized-data"]["Experimental data"] || {}).length > 0;

  return (
    <GuidedModePage pageHeader="Map Files to Entities">
      <GuidedModeSection>
        <Stack>
          <Text>
            Associate your experimental data files with specific entities such as subjects, samples,
            or sites.
          </Text>

          {!hasExperimentalData && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="No experimental data found"
              color="blue"
            >
              You haven't categorized any files as "Experimental data" yet. Please go back to the
              Dataset Categorization page to assign files to the Experimental data category.
            </Alert>
          )}
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="md">
          {/* Left Column - Entity Selector */}
          <Grid.Col span={3}>
            <Paper shadow="sm" radius="md" p="md" withBorder>
              <Title order={5} mb="md">
                Entity Types
              </Title>
              <EntitySelector entityType="entity-to-file-mapping" />
            </Paper>
          </Grid.Col>

          {/* Right Column - File Explorer */}
          <Grid.Col span={9}>
            <Paper shadow="sm" radius="md" p="md" withBorder>
              <Group position="apart" mb="md">
                <Group>
                  <IconFolders size={20} />
                  <Title order={5}>File Explorer</Title>
                </Group>
              </Group>

              <Divider mb="md" />

              <Box style={{ minHeight: "400px" }}>
                <FileExplorer hideClearFilter={true} />
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default EntityFileMapping;
