import { Card, Group, Text, Box, List, Button, Stack, Paper } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { handleDownloadTemplate, handleEntityFileImport, entityConfigs } from "./excelImport";

const helperConfig = {
  "subjects.xlsx": {
    disabledColumns: [
      /*"metadata only", "number of directly derived samples"*/
    ],
  },
  "samples.xlsx": {
    disabledColumns: [
      /*"metadata only"*/
    ],
  },
  "sites.xlsx": {
    disabledColumns: [
      /*"metadata only"*/
    ],
  },
};

export const DownloadCard = ({ entityType, config, locked = false }) => {
  // Get real dependencies (filter out "entity-structure")
  const realDeps = config.dependsOn;
  const depsText = realDeps.map((d) => `${d} metadata`).join(", ");

  if (locked) {
    return (
      <Card shadow="sm" p="md" radius="md" withBorder bg="gray.0" style={{ opacity: 0.5 }}>
        <Card.Section withBorder inheritPadding py="xs" bg="gray.1">
          <Text fw={600}>1: Fill out the {config["metadataFileName"]} template</Text>
        </Card.Section>
        <Box mt="md" p="md" ta="center">
          <Text size="sm" fw={500} mb="sm">
            You must import the following before this step:
          </Text>
          <Text size="sm" c="blue.7" fw={600}>
            {depsText}
          </Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs" bg={`${config.color}.0`}>
        <Group position="apart">
          <Text fw={600}>1: Fill out the {config["metadataFileName"]} template</Text>
        </Group>
      </Card.Section>

      <Box mt="md" mb="lg" h={130} px="xs">
        <List type="ordered" spacing="sm" withPadding>
          <List.Item>
            Download the {config.metadataFileName || `${entityType}.xlsx`} template
          </List.Item>
          <List.Item>
            Assign every {config.singular} a unique ID in the {config.singular} ID column.
          </List.Item>
          <List.Item>Save the file and continue to step 2.</List.Item>
        </List>
      </Box>

      <Button
        fullWidth
        variant="light"
        color={config.color}
        onClick={() => handleDownloadTemplate(entityType, helperConfig[config.metadataFileName])}
      >
        Download {config["metadataFileName"] || `${entityType}.xlsx`}
      </Button>
    </Card>
  );
};

export const ImportCard = ({ entityType, config, importResult, locked = false }) => {
  // Get real dependencies (filter out "entity-structure")
  const realDeps = config.dependsOn?.filter((dep) => dep !== "entity-structure") || [];
  const depsText = realDeps.map((d) => `${d} metadata`).join(", ");

  if (locked) {
    return (
      <Card shadow="sm" p="md" radius="md" withBorder bg="gray.0" style={{ opacity: 0.5 }}>
        <Card.Section withBorder inheritPadding py="xs" bg="gray.1">
          <Text fw={600}>
            2: Import Completed {config.metadataFileName || `${entityType}.xlsx`} File
          </Text>
        </Card.Section>
        <Box mt="md" p="md" ta="center">
          <Text size="sm" fw={500} mb="sm">
            You must import the following before this step:
          </Text>
          <Text size="sm" c="blue.7" fw={600}>
            {depsText}
          </Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs" bg={`${config.color}.0`}>
        <Group position="apart">
          <Text fw={600}>
            2: Import Completed {config.metadataFileName || `${entityType}.xlsx`} File
          </Text>
        </Group>
      </Card.Section>

      <Box mt="md" h={185}>
        <Button
          fullWidth
          variant="light"
          color={config.color}
          onClick={() => handleEntityFileImport(entityType)}
          mt="md"
        >
          Import {config["metadataFileName"] || `${entityType}.xlsx`}
        </Button>

        {importResult && !importResult.success && (
          <Box mt="md" p="xs" bg="red.0" style={{ borderRadius: "4px" }}>
            <Text fw={500} c="red.8">
              {importResult.message}
            </Text>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export const EntityImportCompleteCard = ({ entityType, importResult, onReimport }) => (
  <Box mt="md">
    <Paper p="md" radius="md" withBorder bg="green.0">
      <Group position="apart" align="center">
        <Group spacing="md">
          <IconCheck size={20} color="green" />
          <Text fw={600}>
            {importResult.imported} {entityType} imported successfully
          </Text>
        </Group>
        <Button variant="light" color="blue" onClick={onReimport}>
          Re-import {entityType}
        </Button>
      </Group>
    </Paper>
  </Box>
);
