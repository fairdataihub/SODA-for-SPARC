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
import InfoList from "../../shared/InfoList";
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
          backgroundColor: isActive ? "var(--mantine-color-primary-0)" : "transparent",
          border: "none",
          borderLeft: `3px solid ${isActive ? "var(--mantine-color-primary-6)" : "transparent"}`,
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

const getInstructionalTextByEntityType = (entityType, datasetType) => {
  const instructionalText = {
    Code: "Select the files that contain scripts, computational models, analysis pipelines, or other software used for data processing or analysis.",
    Primary: "Select the files that are the main data files produced or collected in your study.",
    Source: "Select the files that are the original unprocessed data used in your study.",
    Derivative:
      "Select the files that were created by processing or transforming other data files.",
    Experimental: "Select the files that contain data collected from experiments or analyses.",
    Protocol:
      datasetType === "computational"
        ? "Select the files that describe the computational workflows, analysis procedures, or processing steps used in your data."
        : "Select the files that document the experimental procedures, equipment setups, or workflows used in your study.",
    Docs: "Select the files that are supporting documents for your data.",
    experimental: "Select the files that are described in the list above.",
  };

  return (
    instructionalText[entityType] ||
    `Select the files that contain data pertaining to the entity ${entityType}.`
  );
};

function oxfordComma(arr) {
  if (!arr || arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(" and ");
  return arr.slice(0, -1).join(", ") + ", and " + arr[arr.length - 1];
}

const EntityDataSelectorPage = ({
  pageName,
  entityTypeStringSingular,
  showProgress = false,
  entityTypeOnlyHasOneCategory = false,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityType = useGlobalStore((state) => state.entityType); // e.g. 'data-folders'
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetIncludesCode = selectedEntities.includes("code");
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const datasetType = useGlobalStore((state) => state.datasetType);

  const itemCount = countFilesInDatasetStructure(window.datasetStructureJSONObj);
  const supplementaryFilesCount = countSelectedFilesByEntityType("non-data-folders");
  const countItemsSelected = countSelectedFilesByEntityType(entityType);
  const totalFilesSelected = countItemsSelected + supplementaryFilesCount;

  // Calculate percentages for stacked progress bar
  const categorizedPercentage = itemCount > 0 ? (countItemsSelected / itemCount) * 100 : 0;
  const supplementaryPercentage = itemCount > 0 ? (supplementaryFilesCount / itemCount) * 100 : 0;

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
        `Please wait while SODA processes your ${folderIsSelected ? "deselection" : "selection"}.`
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
              case "non-data-folders":
                // Map selected entities to their display names and format with Oxford comma
                const entityDisplayMap = {
                  Code: "code",
                  Protocol: "protocol documentation",
                  Docs: "documentation",
                };

                const selectedSupportingEntitiesFormatted = oxfordComma(
                  selectedEntities
                    .filter((entity) => entityDisplayMap[entity])
                    .map((entity) => entityDisplayMap[entity])
                );

                return (
                  <>
                    <Text mb={0}>
                      You indicated that your dataset contains {selectedSupportingEntitiesFormatted}{" "}
                      {selectedSupportingEntitiesFormatted != "Code" && "data"}. The SDS requires
                      these files to be placed into their own folders. Use the interface below to
                      assign your supporting files to the correct folder by selecting a category on
                      the left and then choosing the files that belong to it on the right.
                    </Text>
                    <Text>
                      <b>Note:</b> You should have files for each category shown on the left. Any
                      remaining files that are not categorized below will be handled in a later
                      step.
                    </Text>
                  </>
                );

              case "experimental":
                return (
                  <>
                    <Text mb={0}>
                      The SDS includes specific requirements for annotating data collected from a
                      subject, whether human or non-human, which we refer to as experimental data.
                      Select all of your experimental data below so SODA can help you annotate it in
                      the following steps.
                    </Text>
                    <InfoList id="dataset-entities" />
                  </>
                );

              case "data-folders":
                if (datasetType === "experimental") {
                  return (
                    <>
                      <Text mb={0}>
                        The SDS requires data in experimental datasets
                        {datasetIncludesCode ? " with code " : ""}to be organized into{" "}
                        {datasetIncludesCode ? "four" : "three"} categories: <b>Experimental</b>,{" "}
                        {datasetIncludesCode ? <b>Code,</b> : ""} <b>Protocol</b>, and{" "}
                        <b>Documentation</b>. Use the interface below to classify your data files.
                      </Text>
                      <Text mb={0}>
                        To categorize your data, choose a category on the left, then select the
                        files that belong to it on the right. Selecting a folder categorizes all
                        files within it. If a folder contains files that belong to different
                        categories, you can expand it and categorize individual files as needed.
                      </Text>

                      <DropDownNote id="data-categories-list" />
                    </>
                  );
                }

                if (datasetType === "computational") {
                  return (
                    <>
                      <Text mb={0}>
                        For computational datasets, all files imported on the Data Selection page
                        need to be categorized into four groups: <b>Code</b>, <b>Primary</b>,{" "}
                        <b>Protocol</b>, and <b>Documentation</b>.
                      </Text>
                      <Text mb={0}>
                        To categorize your data, choose a category on the left, then select the
                        files that belong to it on the right. Selecting a folder categorizes all
                        files within it. If a folder contains files that belong to different
                        categories, you can expand it and categorize individual files as needed.
                      </Text>
                      <DropDownNote id="data-categories-list" />
                    </>
                  );
                }

              case "modalities":
                return <Text>Select the folders and files that belong to each modality.</Text>;

              case "experimental-data-categorization":
                return (
                  <Text>
                    Use the interface below to categorize your Source and Derivative experimental
                    data files. Any files not categorized will be marked as "Primary" by default and
                    be placed in the Primary folder.
                  </Text>
                );

              case "remaining-data-categorization":
                return (
                  <Text>
                    Use the interface below to categorize your Source and Derivative data files. Any
                    files not categorized will be marked as "Primary" by default and be placed in
                    the Primary folder.
                  </Text>
                );

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
              Progress: {totalFilesSelected} of {itemCount} files categorized
              {supplementaryFilesCount > 0 && (
                <span> ({supplementaryFilesCount} supplementary files already selected)</span>
              )}
            </Text>
            <Progress.Root size="xl">
              {supplementaryFilesCount > 0 && (
                <Progress.Section
                  value={supplementaryPercentage}
                  color="lightgray"
                ></Progress.Section>
              )}
              <Progress.Section value={categorizedPercentage} color="green"></Progress.Section>
            </Progress.Root>
            {/* Simple old progress <Progress size="xl" value={100 * (countItemsSelected / itemCount)} /> */}
          </Paper>
        </GuidedModeSection>
      )}
      <GuidedModeSection>
        <Grid gutter="lg">
          {!entityTypeOnlyHasOneCategory && (
            <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
              <EntityListContainer title={`Select a ${entityTypeStringSingular}`}>
                {renderEntityList(entityType, activeEntity, datasetEntityObj)}
              </EntityListContainer>
            </Grid.Col>
          )}

          <Grid.Col span={!entityTypeOnlyHasOneCategory ? 8 : 12}>
            {activeEntity ? (
              <Paper shadow="sm" radius="md">
                <DatasetTreeViewRenderer
                  itemSelectInstructions={getInstructionalTextByEntityType(
                    activeEntity,
                    datasetType
                  )}
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
