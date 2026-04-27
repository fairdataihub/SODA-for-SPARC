import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconUser, IconFlask, IconPin, IconFileSpreadsheet, IconCheck } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Box, Divider, List, Card } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { importEntitiesFromExcel, entityConfigs, saveEntities } from "./excelImport";
import { swalListDoubleAction, swalConfirmAction } from "../../../scripts/utils/swal-utils";
import SodaPaper from "../../utils/ui/SodaPaper";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { normalizeEntityId } from "../../../stores/slices/datasetEntityStructureSlice";
import { DownloadCard, ImportCard } from "./SpreadsheetDownloadImport";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const entityImportCompletionStatus = useGlobalStore(
    (state) => state.entityImportCompletionStatus
  );
  console.log("Entity import completion status:", entityImportCompletionStatus);
  const importResults = {};

  // Build list of enabled entity types
  const enabledEntities = [
    "entity-structure",
    ...(selectedEntities?.includes("subjects") ? ["subjects"] : []),
    ...(selectedEntities?.includes("samples") ? ["samples"] : []),
    ...(selectedEntities?.includes("sites") ? ["sites"] : []),
  ];

  // --- Entity type configuration ---
  const entityTypeConfig = {
    "entity-structure": {
      title: "Assign IDs to all entities in your dataset",
      singular: "entity",
      spreadsheetInstructions: [
        "Save the entity-structure.xlsx file by clicking the button below.",
      ],
      icon: <IconFileSpreadsheet size={24} />,
      color: "teal",
      description:
        "Assign unique IDs to each entity in your dataset using the template below. Once you have filled out the template and re-import it into SODA, you will be able to provide metadata for each entity.",
      dependsOn: [],
      metadataFileName: "entity-structure.xlsx",
    },
    subjects: {
      title: "Provide Subject Metadata",
      singular: "subject",
      icon: <IconUser size={24} />,
      color: "blue",
      description: "Assign unique IDs to each subject in your dataset using the template below.",
      dependsOn: ["entity-structure"],
      metadataFileName: "subjects.xlsx",
    },
    samples: {
      title: "Provide Sample Metadata",
      singular: "sample",
      icon: <IconFlask size={24} />,
      color: "black",
      description: "Import sample IDs and metadata from an Excel file",
      dependsOn: ["subjects"], // Depends on subjects being imported first
      sequence: 2,
    },
    sites: {
      title: "Provide Site Metadata",
      singular: "site",
      icon: <IconPin size={24} />,
      color: "grape",
      description: "Import site IDs and metadata from an Excel file.",
      dependsOn: ["entity-structure", "subjects", "samples"],
      metadataFileName: "sites.xlsx",
    },
  };

  const renderEntityImport = (entityType) => {
    const config = entityTypeConfig[entityType];
    const importResult = importResults[entityType];

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
                <DownloadCard entityType={entityType} config={config} />
              </Grid.Col>
              <Grid.Col span={6}>
                <ImportCard entityType={entityType} config={config} importResult={importResult} />
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
                    setImportResults((prev) => ({ ...prev, [entityType]: null }));
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
    <GuidedModePage pageHeader="Designate entity IDs using spreadsheets">
      <GuidedModeSection>
        {enabledEntities.map((entityType) => renderEntityImport(entityType))}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SpreadsheetImportDatasetEntityAdditionPage;
