import { Text, Grid, Paper, Box, Stack, Button } from "@mantine/core";
import { IconFolderPlus } from "@tabler/icons-react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import EntityBucketingDataImporter from "../../shared/EntityBucketingDataImporter";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import SelectedEntityPreviewer from "../../shared/SelectedEntityPreviewer";
import useGlobalStore from "../../../stores/globalStore";
import { handleAddEmptyFolder } from "./utils";

const DataBucketingPage = ({ pageID, pageName, entityTypeStringSingular, entityType }) => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const pathToRender = useGlobalStore((state) => state.pathToRender);

  const onAddEmptyFolderClick = () => {
    handleAddEmptyFolder(pathToRender);
  };

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          Use the interface below to add data collected from each {entityTypeStringSingular}. Select
          a {entityTypeStringSingular} from the hierarchy on the left, then import or drag and drop
          the data files that belong to that {entityTypeStringSingular} on the right.
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
                reRenderTreeViewOnEntitySelection={true}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            {selectedHierarchyEntity ? (
              <Stack gap="lg">
                <Paper shadow="sm" radius="md" p="md" withBorder>
                  <Text size="md" fw={500} mb="sm">
                    Import data for {selectedHierarchyEntity.id}
                  </Text>
                  <SelectedEntityPreviewer />
                  <EntityBucketingDataImporter pageID={pageID} entityType={entityType} />
                  <Stack gap="sm">
                    <Button
                      leftSection={<IconFolderPlus size={16} />}
                      variant="light"
                      onClick={onAddEmptyFolderClick}
                    >
                      Add empty folder
                    </Button>
                    <DatasetTreeViewRenderer
                      allowStructureEditing={true}
                      hideSearchBar={true}
                      entityType={entityType}
                      fileExplorerId="entity-bucketing-data-import-tab"
                    />
                  </Stack>
                </Paper>
              </Stack>
            ) : (
              <Box p="xl">
                <Text size="xl" c="gray">
                  Select an entity from the hierarchy on the left to import files for it.
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
