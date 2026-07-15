import { Text, Grid, Paper, Box } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import useGlobalStore from "../../../stores/globalStore";

const DataBucketingPage = ({ pageID, pageName, entityTypeStringSingular, entityType }) => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          Use the interface below to organize your {entityTypeStringSingular} data files into
          buckets. Select an entity from the hierarchy on the left, then choose the files that
          belong to that entity on the right.
        </Text>
      </GuidedModeSection>

      <GuidedModeSection mt="lg">
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
                <DatasetTreeViewRenderer
                  fileExplorerId={pageID}
                  entityType={entityType}
                  hideSearchBar={false}
                />
              </Paper>
            ) : (
              <Box p="xl">
                <Text size="xl" c="gray">
                  Select an entity from the hierarchy on the left to view and organize its data
                  files.
                </Text>
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DataBucketingPage;
