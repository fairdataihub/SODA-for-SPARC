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

const DatasetEntityMetadata = ({
  pageName = "Dataset Entity File Mapper",
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

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

      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="md">
              <Text fw={600} mb="md">
                Entity Hierarchy
              </Text>
              <EntityHierarchyRenderer allowEntityStructureEditing={false} />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            {activeEntity ? (
              <Paper shadow="sm" radius="md"></Paper>
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

export default DatasetEntityMetadata;
