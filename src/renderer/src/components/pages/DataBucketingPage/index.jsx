import { Text, Grid, Paper, Box, Stack, Button, Flex } from "@mantine/core";
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
  console.log("DataBucketingPage: selectedHierarchyEntity:", selectedHierarchyEntity);
  const pathToRender = useGlobalStore((state) => state.pathToRender);

  const onAddEmptyFolderClick = () => {
    handleAddEmptyFolder(pathToRender);
  };

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          {entityType === "non-data-folders"
            ? "Use the interface below to add data to each of the high level folders. Select the folder from the hierarchy on the left, then import or drag and drop the files that belong in that folder on the right."
            : `Use the interface below to add data collected from each ${entityTypeStringSingular}. Select a ${entityTypeStringSingular} from the hierarchy on the left, then import or drag and drop the data files that belong to that ${entityTypeStringSingular} on the right.`}
        </Text>
      </GuidedModeSection>

      <GuidedModeSection mt="lg">
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
              <Text size="lg" fw={500} mb="sm">
                {entityType === "non-data-folders" ? "Select a folder" : "Select an entity"}
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
                    {["code", "protocol", "docs"].includes(selectedHierarchyEntity.id)
                      ? `Import your ${selectedHierarchyEntity.id} below`
                      : `Import data for ${selectedHierarchyEntity.id}`}
                  </Text>
                  <SelectedEntityPreviewer />
                  <EntityBucketingDataImporter pageID={pageID} entityType={entityType} />
                  <Flex justify="flex-end" my="xs">
                    <Button
                      leftSection={<IconFolderPlus size={16} />}
                      variant="light"
                      onClick={onAddEmptyFolderClick}
                    >
                      Add empty folder
                    </Button>
                  </Flex>
                  <Text size="xs" c="dimmed">
                    Path: {pathToRender.join(" / ") || "/"}
                  </Text>
                  <DatasetTreeViewRenderer
                    allowStructureEditing={true}
                    hideSearchBar={true}
                    entityType={entityType}
                    fileExplorerId="entity-bucketing-data-import-tab"
                  />
                </Paper>
              </Stack>
            ) : (
              <Box p="xl">
                <Text size="xl" c="gray">
                  {entityType === "non-data-folders"
                    ? "Select a folder from the hierarchy on the left to import files for it."
                    : "Select an entity from the hierarchy on the left to import files for it."}
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
