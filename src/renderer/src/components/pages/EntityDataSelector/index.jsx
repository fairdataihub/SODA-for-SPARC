import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityListContainer from "../../containers/EntityListContainer";
import { IconSearch } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Paper, Tooltip, Box, Progress } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import { externallySetSearchFilterValue } from "../../../stores/slices/datasetTreeViewSlice";
import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  checkIfRelativePathBelongsToEntity,
  checkIfFolderBelongsToEntity,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { naturalSort } from "../../shared/utils/util-functions";
import { countFilesInDatasetStructure } from "../../../scripts/utils/datasetStructure";

const ENTITY_PREFIXES = ["sub-", "sam-", "perf-"];

const handleEntityClick = (entity) => setActiveEntity(entity);

const handleFileClick = (
  entityType,
  activeEntity,
  datasetEntityObj,
  fileContents,
  mutuallyExclusive
) => {
  modifyDatasetEntityForRelativeFilePath(
    entityType,
    activeEntity,
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
  mutuallyExclusive = true
) => {
  // Simple folder click handler with no special cases

  const action = folderWasSelectedBeforeClick ? "remove" : "add";

  // Skip processing the folder itself - only process files
  // Process all files in the folder
  Object.values(folderContents.files || {}).forEach((file) => {
    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      file.relativePath,
      action,
      mutuallyExclusive
    );
  });

  // Process all subfolders recursively
  Object.values(folderContents.folders || {}).forEach((subFolder) => {
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

const renderEntityList = (entityType, activeEntity, datasetEntityObj) => {
  if (!datasetEntityObj?.[entityType]) return null;

  return naturalSort(Object.keys(datasetEntityObj[entityType])).map((entity) => {
    const isActive = entity === activeEntity;

    return (
      <Box
        key={entity}
        onClick={() => handleEntityClick(entity)}
        p="xs"
        style={{
          width: "100%",
          backgroundColor: isActive ? "#e3f2fd" : "transparent",
          color: isActive ? "#0d47a1" : "#333",
          border: "none",
          borderLeft: `3px solid ${isActive ? "#2196f3" : "transparent"}`,
          cursor: "pointer",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
          wordBreak: "break-word", // Apply word break for better wrapping
          whiteSpace: "normal", // Allow text wrapping instead of one long line
        }}
      >
        <Group justify="space-between" align="center">
          <Text size="sm">{entity}</Text>
        </Group>
      </Box>
    );
  });
};

const getInstructionalTextByEntityType = (entityType) => {
  const instructionalText = {
    Code: "Select the files that contain scripts, computational models, analysis pipelines, or other software used for data processing or analysis below.",
    "Experimental data":
      "Select the files containing data collected from experiments or analysis below.",
    Other:
      "Select the files that do not contain experimental data or code, such as protocols, notes, or supplementary materials below.",
  };

  return instructionalText[entityType] || `Select the files that contain data for ${entityType}`;
};

const EntityDataSelectorPage = ({
  pageName,
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
  showProgress = false,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  console.log("activeEntity", activeEntity);
  console.log("datasetEntityObj", datasetEntityObj);
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);

  const countSelectedFilesByEntityType = (entityType) => {
    if (!datasetEntityObj?.[entityType]) return 0;

    // Count total files across all entities using the map structure
    let totalCount = 0;
    const allEntities = Object.values(datasetEntityObj[entityType] || {});

    allEntities.forEach((entityFiles) => {
      // Each entry in entityFiles is a file path, so this is already counting only files
      totalCount += Object.keys(entityFiles).length;
    });

    return totalCount;
  };

  const itemCount = countFilesInDatasetStructure(datasetStructureJSONObj);
  const countItemsSelected = countSelectedFilesByEntityType(entityType);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        {entityType === "categorized-data" ? (
          <Stack>
            <Text>
              The SDS requires data to be categorized into three categories: experimental, code, and
              other (data that is not experimental or code). Use the interface below to classify
              your data files.
            </Text>
          </Stack>
        ) : (
          <Stack>
            <Text>
              For each {entityTypeStringSingular} ID you entered on the previous page, associate the
              relevant files from the dataset. To do this, select a {entityTypeStringSingular} ID
              from the list on the left, then choose the corresponding folders and files from your
              data on the right.
            </Text>
          </Stack>
        )}
      </GuidedModeSection>
      {datasetEntityObj?.[entityType] && showProgress && (
        <GuidedModeSection>
          <Paper p="xs" shadow="sm">
            <Text size="sm" c="gray">
              Progress: {countItemsSelected} of {itemCount} files categorized
            </Text>
            <Progress color="green" size="xl" value={100 * (countItemsSelected / itemCount)} />
          </Paper>
        </GuidedModeSection>
      )}
      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <EntityListContainer title={`Select a ${entityTypeStringSingular}`}>
              {renderEntityList(entityType, activeEntity, datasetEntityObj)}
            </EntityListContainer>
          </Grid.Col>

          <Grid.Col span={8}>
            {activeEntity ? (
              <Paper shadow="sm" radius="md">
                <DatasetTreeViewRenderer
                  itemSelectInstructions={getInstructionalTextByEntityType(activeEntity)}
                  mutuallyExclusiveSelection={true}
                  folderActions={{
                    "on-folder-click": (
                      folderName,
                      folderContents,
                      folderIsSelected,
                      mutuallyExclusive
                    ) => {
                      handleFolderClick(
                        entityType,
                        activeEntity,
                        datasetEntityObj,
                        folderContents,
                        folderIsSelected,
                        mutuallyExclusive
                      );
                    },
                    "is-folder-selected": (folderName, folderContents) => {
                      // Only check if all file contents belong to the entity
                      // Don't check if the folder itself is selected
                      return (
                        checkIfFolderBelongsToEntity(activeEntity, folderContents, entityType) ||
                        false
                      );
                    },
                  }}
                  fileActions={{
                    "on-file-click": (fileName, fileContents, fileIsSelected, mutuallyExclusive) =>
                      handleFileClick(
                        entityType,
                        activeEntity,
                        datasetEntityObj,
                        fileContents,
                        mutuallyExclusive
                      ),
                    "is-file-selected": (fileName, fileContents) => {
                      return (
                        checkIfRelativePathBelongsToEntity(
                          activeEntity,
                          fileContents.relativePath,
                          entityType
                        ) || false
                      );
                    },
                  }}
                  entityType={entityType}
                />
              </Paper>
            ) : (
              <Box>
                <Text size="xl" c="gray">
                  Select an item from the {entityTypeStringSingular} list on the left to map files
                  to it.
                </Text>
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default EntityDataSelectorPage;
