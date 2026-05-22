import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconUser, IconFlask, IconPin, IconFileSpreadsheet, IconCheck } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Box, Divider, List, Card } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { importEntitiesFromExcel, entityConfigs, saveEntities } from "./excelImport";
import { swalListDoubleAction, swalConfirmAction } from "../../../scripts/utils/swal-utils";
import SodaPaper from "../../utils/ui/SodaPaper";
import { removeSuccessfullyImportedEntityType } from "../../../stores/slices/datasetContentSelectorSlice";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { normalizeEntityId } from "../../../stores/slices/datasetEntityStructureSlice";
import { DownloadCard, ImportCard, EntityImportCompleteCard } from "./SpreadsheetDownloadImport";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  console.log("Selected entities for import:", selectedEntities);
  const entityImportCompletionStatus = useGlobalStore(
    (state) => state.entityImportCompletionStatus
  );
  console.log("Entity import completion status:", entityImportCompletionStatus);
  const successfullyImportedEntityTypes = useGlobalStore(
    (state) => state.successfullyImportedEntityTypes || []
  );

  // Helper to get imported counts for display when available
  const subjectsCount = getExistingSubjects()?.length || 0;
  const samplesCount = getExistingSamples()?.length || 0;
  const sitesCount = getExistingSites()?.length || 0;

  // Build list of enabled entity types (removed legacy `entity-structure` option)
  const enabledEntities = [
    ...(selectedEntities?.includes("subjects") ? ["subjects"] : []),
    ...(selectedEntities?.includes("samples") ? ["samples"] : []),
    ...(selectedEntities?.includes("subjectSites") ? ["subjectSites"] : []),
    ...(selectedEntities?.includes("sampleSites") ? ["sampleSites"] : []),
  ];

  // --- Entity type configuration ---
  const entityTypeConfig = {
    /* `entity-structure` option removed per request */
    subjects: {
      title: "Step 1: Subject IDs",
      singular: "subject",
      icon: <IconUser size={24} />,
      color: "blue",
      description: "Download the template, assign unique IDs, and upload the completed file.",
      dependsOn: [],
      metadataFileName: "subjects.xlsx",
    },
    samples: {
      title: "Step 2: Sample IDs",
      singular: "sample",
      icon: <IconFlask size={24} />,
      color: "cyan",
      description: "Link samples to subjects and add metadata.",
      dependsOn: ["subjects"], // Depends on subjects being imported first
      sequence: 2,
      metadataFileName: "samples.xlsx",
    },
    subjectSites: {
      title: "Step 3a: Subject Site IDs",
      singular: "site",
      icon: <IconPin size={24} />,
      color: "grape",
      description: "Link sites to subjects with metadata.",
      dependsOn: ["subjects"],
      metadataFileName: "subject-sites.xlsx",
    },
    sampleSites: {
      title: "Step 3b: Sample Site IDs",
      singular: "site",
      icon: <IconPin size={24} />,
      color: "grape",
      description: "Link sites to samples with metadata.",
      dependsOn: ["samples"],
      metadataFileName: "sample-sites.xlsx",
    },
  };

  const renderEntityImport = (entityType) => {
    const config = entityTypeConfig[entityType];

    // Locked when any real dependency (not "entity-structure") is not satisfied
    const locked =
      config.dependsOn?.some(
        (dep) => dep !== "entity-structure" && !successfullyImportedEntityTypes.includes(dep)
      ) ?? false;

    // Determine import result from global successfullyImportedEntityTypes and compute counts
    let importResult = null;
    if (successfullyImportedEntityTypes.includes(entityType)) {
      const count =
        entityType === "subjects"
          ? subjectsCount
          : entityType === "samples"
            ? samplesCount
            : sitesCount;
      importResult = { success: true, imported: count };
    }

    return (
      <SodaPaper key={entityType}>
        <Stack>
          <Text size="lg" fw={600}>
            {config.title}
          </Text>
          {!importResult?.success && <Text>{config.description}</Text>}
          <Divider />

          {!importResult?.success ? (
            <Grid gutter={32} mt="sm">
              <Grid.Col span={6}>
                <DownloadCard entityType={entityType} config={config} locked={locked} />
              </Grid.Col>
              <Grid.Col span={6}>
                <ImportCard
                  entityType={entityType}
                  config={config}
                  importResult={importResult}
                  locked={locked}
                />
              </Grid.Col>
            </Grid>
          ) : (
            <EntityImportCompleteCard
              entityType={entityType}
              importResult={importResult}
              onReimport={() =>
                swalConfirmAction(
                  "warning",
                  "Replace imported data?",
                  `This will remove the existing ${importResult.imported} ${entityType} and let you import new ones.`,
                  "Replace",
                  "Cancel"
                ).then((confirmed) => {
                  if (confirmed) {
                    // Remove success flag for this entity type so it can be re-imported
                    removeSuccessfullyImportedEntityType(entityType);
                  }
                })
              }
            />
          )}
        </Stack>
      </SodaPaper>
    );
  };

  return (
    <GuidedModePage pageHeader="Designate Entity Metadata via Spreadsheets">
      <GuidedModeSection>
        <Text>
          Use the interface below to assign unique IDs and provide metadata for the entities in your
          dataset (for example, subjects and samples). If you haven't yet prepared the SDS metadata
          templates, you can download them here, fill them out in Excel or another spreadsheet
          program, and then import the completed files. If you already have SDS metadata files
          ready, you can progress to the next step to import them directly.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        {enabledEntities.map((entityType) => renderEntityImport(entityType))}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SpreadsheetImportDatasetEntityAdditionPage;
