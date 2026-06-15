import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconUser, IconFlask, IconPin, IconFileSpreadsheet, IconCheck } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Box, Divider, List, Card } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { swalListDoubleAction, swalConfirmAction } from "../../../scripts/utils/swal-utils";
import SodaPaper from "../../utils/ui/SodaPaper";
import PageCompleteIndicator from "../../common/PageCompleteIndicator";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
  deleteSubject,
  deleteSample,
  deleteSite,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { normalizeEntityId } from "../../../stores/slices/datasetEntityStructureSlice";
import { clearImportedMetadataFilePath } from "../../../stores/slices/datasetContentSelectorSlice";
import { DownloadCard, ImportCard, EntityImportCompleteCard } from "./SpreadsheetDownloadImport";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  // Helper to get imported counts for display when available
  const subjectsCount = getExistingSubjects()?.length || 0;
  const samplesCount = getExistingSamples()?.length || 0;
  const sitesCount = getExistingSites()?.length || 0;

  // Build list of enabled entity types (removed legacy `entity-structure` option)
  const enabledEntities = [
    ...(selectedEntities?.includes("subjects") ? ["subjects"] : []),
    ...(selectedEntities?.includes("samples") ? ["samples"] : []),
    ...(selectedEntities?.includes("subjectSites") || selectedEntities?.includes("sampleSites")
      ? ["sites"]
      : []),
  ];

  // Determine which entities are required based on selection
  const requiredEntities = enabledEntities;

  // Check if all required entities have been imported
  const entityCounts = {
    subjects: subjectsCount,
    samples: samplesCount,
    sites: sitesCount,
  };

  const allRequiredEntitiesImported = requiredEntities.every((type) => entityCounts[type] > 0);

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
    sites: {
      title: "Step 3: Site IDs",
      singular: "site",
      icon: <IconPin size={24} />,
      color: "grape",
      description: "Link sites to subjects or samples with metadata.",
      dependsOn: ["subjects", "samples"],
      metadataFileName: "sites.xlsx",
    },
  };

  const renderEntityImport = (entityType) => {
    const config = entityTypeConfig[entityType];

    // Locked when any dependency is not satisfied
    const locked = !config.dependsOn.every((dep) => {
      if (dep === "subjects") {
        return subjectsCount > 0;
      }
      if (dep === "samples") {
        return samplesCount > 0;
      }
      return true;
    });

    // Determine import result based on actual counts from store
    let importResult = null;
    const count =
      entityType === "subjects"
        ? subjectsCount
        : entityType === "samples"
          ? samplesCount
          : entityType === "sites"
            ? sitesCount
            : 0;

    // Import is complete if there are entities of this type in the store
    if (count > 0) {
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
              onReimport={async () => {
                const confirmed = await swalConfirmAction(
                  "warning",
                  "Replace imported data?",
                  `This will remove the existing ${importResult.imported} ${entityType} and let you import new ones.`,
                  "Replace",
                  "Cancel"
                );
                if (confirmed) {
                  // Clear the stored file path for this entity type
                  clearImportedMetadataFilePath(entityType);

                  if (entityType === "subjects") {
                    const existingSubjectIDs = getExistingSubjects().map((s) => s.id);
                    existingSubjectIDs.forEach((id) => {
                      deleteSubject(id);
                    });
                    // When subjects are removed, also clear dependent file paths
                    clearImportedMetadataFilePath("samples");
                    clearImportedMetadataFilePath("sites");
                  } else if (entityType === "samples") {
                    const existingSampleIDs = getExistingSamples().map((s) => s.id);
                    existingSampleIDs.forEach((id) => {
                      deleteSample(id);
                    });
                    // When samples are removed, also clear dependent file paths
                    clearImportedMetadataFilePath("sites");
                  } else if (entityType === "sites") {
                    const existingSiteIDs = getExistingSites().map((s) => s.id);
                    existingSiteIDs.forEach((id) => {
                      deleteSite(id);
                    });
                  }
                }
              }}
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
        {allRequiredEntitiesImported && (
          <PageCompleteIndicator message="All required entities have been imported successfully!" />
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SpreadsheetImportDatasetEntityAdditionPage;
