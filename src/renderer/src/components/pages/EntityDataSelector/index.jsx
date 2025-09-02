import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityListContainer from "../../containers/EntityListContainer";
import { IconSearch } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Paper, Tooltip, Box, Progress } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import {
  externallySetSearchFilterValue,
  reRenderTreeView,
} from "../../../stores/slices/datasetTreeViewSlice";
import {
  setActiveEntity,
  modifyDatasetEntityForRelativeFilePath,
  checkIfRelativePathBelongsToEntity,
  checkIfFolderBelongsToEntity,
  setLargeFolderSelectionProgressValue,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { naturalSort } from "../../shared/utils/util-functions";
import {
  countFilesInDatasetStructure,
  countSelectedFilesByEntityType,
  getFolderDetailsByRelativePath,
} from "../../../scripts/utils/datasetStructure";
import InstructionsTowardsLeftContainer from "../../utils/ui/InstructionsTowardsLeftContainer";
import SodaPaper from "../../utils/ui/SodaPaper";
import DropDownNote from "../../utils/ui/DropDownNote";
import { swalShowLoading } from "../../../scripts/utils/swal-utils";
import Swal from "sweetalert2";

const ENTITY_PREFIXES = ["sub-", "sam-", "perf-"];

const handleEntityClick = (entity) => {
  setActiveEntity(entity);
  reRenderTreeView();
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

  return (
    instructionalText[entityType] ||
    `Select the folders and files that contain data pertaining to the entity ${entityType}.`
  );
};

const EntityDataSelectorPage = ({
  pageName,
  entityTypeStringSingular,
  entityTypeStringPlural,
  showProgress = false,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityType = useGlobalStore((state) => state.entityType); // e.g. 'high-level-folder-data-categorization'
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetIncludesCode = selectedEntities.includes("code");
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const datasetRenderArray = useGlobalStore((state) => state.datasetRenderArray);

  const itemCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
  const countItemsSelected = countSelectedFilesByEntityType(entityType);

  const handleFileClick = (relativePath, fileIsSelected, mutuallyExclusiveSelection) => {
    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      relativePath,
      fileIsSelected ? "remove" : "add",
      mutuallyExclusiveSelection
    );
    reRenderTreeView();
  };

  const handleFolderClick = async (relativePath, folderIsSelected, mutuallyExclusiveSelection) => {
    const action = folderIsSelected ? "remove" : "add";
    const { childrenFileRelativePaths } = getFolderDetailsByRelativePath(relativePath);
    if (childrenFileRelativePaths.length && childrenFileRelativePaths.length > 400) {
      swalShowLoading(
        folderIsSelected
          ? `Deselecting ${childrenFileRelativePaths.length} file${
              childrenFileRelativePaths.length > 1 ? "s" : ""
            } within the selected folder...`
          : `Selecting ${childrenFileRelativePaths.length} file${
              childrenFileRelativePaths.length > 1 ? "s" : ""
            } within the selected folder...`,
        "Please wait while SODA processes your changes."
      );
    }
    for (let index = 0; index < childrenFileRelativePaths.length; index++) {
      const filePath = childrenFileRelativePaths[index];
      modifyDatasetEntityForRelativeFilePath(
        entityType,
        activeEntity,
        filePath,
        action,
        mutuallyExclusiveSelection
      );
      // If the index divided by 50 equals 0, yield control to the event loop
      if (index % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    Swal.close();

    reRenderTreeView();
  };

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Stack>
          {(() => {
            switch (entityType) {
              case "high-level-folder-data-categorization":
                return (
                  <>
                    <Text mb={0}>
                      The SDS requires data to be organized into{" "}
                      {datasetIncludesCode ? "four" : "three"} categories: Experimental
                      {datasetIncludesCode ? ", Code," : ","} Documentation, and Protocol. Use the
                      interface below to classify your data files.
                    </Text>
                    <DropDownNote id="data-categories-list" />
                  </>
                );

              case "modalities":
                return <Text>Select the folders and files that belong to each modality.</Text>;

              default:
                return (
                  <Text>
                    For each {entityTypeStringSingular} ID you entered on the previous page,
                    associate the relevant files from the dataset. To do this, select a{" "}
                    {entityTypeStringSingular} ID from the list on the left, then choose the
                    corresponding folders and files from your data on the right.
                  </Text>
                );
            }
          })()}
        </Stack>
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
                    "on-folder-click": (relativePath, folderIsSelected, mutuallyExclusive) => {
                      handleFolderClick(relativePath, folderIsSelected, mutuallyExclusive);
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
                    "on-file-click": (relativePath, fileIsSelected, mutuallyExclusiveSelection) => {
                      handleFileClick(relativePath, fileIsSelected, mutuallyExclusiveSelection);
                    },
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
                  fileExplorerId="entity-data-selector"
                />
              </Paper>
            ) : (
              <InstructionsTowardsLeftContainer>
                <Text fw={500}>
                  Select an item from the {entityTypeStringSingular} list on the left to map files
                  to it.
                </Text>
              </InstructionsTowardsLeftContainer>
            )}
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default EntityDataSelectorPage;
