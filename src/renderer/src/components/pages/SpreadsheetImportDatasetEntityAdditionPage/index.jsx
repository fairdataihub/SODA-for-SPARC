import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { IconUser, IconFlask, IconPin, IconFileSpreadsheet, IconCheck } from "@tabler/icons-react";
import { Text, Grid, Stack, Group, Button, Paper, Box, Divider, List, Card } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

import { swalConfirmAction } from "../../../scripts/utils/swal-utils";
import { DownloadCard, ImportCard } from "./SpreadsheetDownloadImport";

// --- Entity type configuration ---
const entityTypeConfig = {
  "entity-ids": {
    title: "Entity ID designation",
    singular: "entity",
    icon: <IconFileSpreadsheet size={24} />,
    color: "teal",
    description:
      "Assign unique IDs to each entity in your dataset using the template below. This is required before importing any metadata.",
    dependsOn: [],
  },
  subjects: {
    title: "Subject ID designation",
    singular: "subject",
    icon: <IconUser size={24} />,
    color: "blue",
    description: "Assign unique IDs to each subject in your dataset using the template below.",
    dependsOn: [],
  },
  samples: {
    title: "Import Samples",
    singular: "sample",
    icon: <IconFlask size={24} />,
    color: "green",
    description: "Import sample IDs and metadata from an Excel file.",
    dependsOn: ["subjects"],
  },
  sites: {
    title: "Import Sites",
    singular: "site",
    icon: <IconPin size={24} />,
    color: "grape",
    description: "Import site IDs and metadata from an Excel file.",
    dependsOn: ["subjects", "samples"],
  },
};

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const completionStatus = useGlobalStore((state) => state.entityImportCompletionStatus || {});
  const [importResults, setImportResults] = useState({});

  // Build list of enabled entity types
  const enabledEntities = [
    "entity-ids",
    ...(selectedEntities?.includes("subjects") ? ["subjects"] : []),
    ...(selectedEntities?.includes("samples") ? ["samples"] : []),
    ...(selectedEntities?.includes("sites") ? ["sites"] : []),
  ];

  const renderEntityImport = (entityType) => {
    const config = entityTypeConfig[entityType];
    const importResult = importResults[entityType];

    return (
      <Paper key={entityType} shadow="xs" p="lg" radius="md" withBorder mb="xl">
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
            <Box mt="md">
              <Paper p="md" radius="md" withBorder bg="green.0">
                <Group position="apart" align="center">
                  <Group spacing="md">
                    <IconCheck size={20} color="green" />
                    <Text fw={600}>
                      {importResult.imported} {entityType} imported successfully
                    </Text>
                  </Group>
                  <Button
                    variant="light"
                    color="blue"
                    onClick={() =>
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
                  >
                    Re-import {entityType}
                  </Button>
                </Group>
              </Paper>
            </Box>
          )}
        </Stack>
      </Paper>
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
