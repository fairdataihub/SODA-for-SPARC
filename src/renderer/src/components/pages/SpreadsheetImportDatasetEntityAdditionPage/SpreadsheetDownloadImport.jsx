import {
  Card,
  Group,
  Text,
  Box,
  List,
  Button,
  Stack,
  Paper,
  ThemeIcon,
  Alert,
  Progress,
  Divider,
  Collapse,
} from "@mantine/core";
import {
  IconCheck,
  IconUpload,
  IconFileSpreadsheet,
  IconDownload,
  IconArrowForwardUp,
  IconChevronDown,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";
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

      <Box mt="md" mb="lg">
        <Stack spacing="md">
          <Group spacing="xs" wrap="nowrap">
            <ThemeIcon
              size="lg"
              variant="light"
              color={config.color}
              radius="md"
              style={{ flexShrink: 0 }}
            >
              <IconDownload size={18} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Download if not already prepared
              </Text>
              <Text size="xs" c="dimmed">
                Skip if you already have the template completed
              </Text>
            </Box>
          </Group>
          <Group spacing="xs" wrap="nowrap">
            <ThemeIcon
              size="lg"
              variant="light"
              color={config.color}
              radius="md"
              style={{ flexShrink: 0 }}
            >
              <IconFileSpreadsheet size={18} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Fill in the metadata
              </Text>
              <Text size="xs" c="dimmed">
                Add unique IDs and complete all required fields
              </Text>
            </Box>
          </Group>
        </Stack>
      </Box>

      <Button
        fullWidth
        variant="light"
        color={config.color}
        onClick={() => handleDownloadTemplate(entityType, helperConfig[config.metadataFileName])}
        leftSection={<IconDownload size={16} />}
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

      <Box mt="md" mb="lg">
        <Stack spacing="md">
          <Group spacing="xs" wrap="nowrap">
            <ThemeIcon
              size="lg"
              variant="light"
              color={config.color}
              radius="md"
              style={{ flexShrink: 0 }}
            >
              <IconUpload size={18} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Click the import button below
              </Text>
              <Text size="xs" c="dimmed">
                Select your completed spreadsheet file to import
              </Text>
            </Box>
          </Group>
          <Group spacing="xs" wrap="nowrap">
            <ThemeIcon
              size="lg"
              variant="light"
              color={config.color}
              radius="md"
              style={{ flexShrink: 0 }}
            >
              <IconFileSpreadsheet size={18} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                SODA will notify you of any errors
              </Text>
              <Text size="xs" c="dimmed">
                If the import fails, fix issues in your file and try again
              </Text>
            </Box>
          </Group>
        </Stack>
      </Box>

      <Button
        fullWidth
        variant="light"
        color={config.color}
        onClick={() => handleEntityFileImport(entityType)}
        leftSection={<IconUpload size={16} />}
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
    </Card>
  );
};

export const EntityImportCompleteCard = ({ entityType, importResult, onReimport }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get the entity IDs from the store
  const getEntityIds = () => {
    if (entityType === "subjects") {
      return getExistingSubjects().map((s) => s.id);
    }
    if (entityType === "samples") {
      return getExistingSamples().map((s) => s.id);
    }
    if (entityType === "sites") {
      return getExistingSites().map((s) => s.id);
    }
    return [];
  };

  const entityIds = getEntityIds();

  return (
    <Box mt="md">
      <Paper p="md" radius="md" withBorder bg="green.0">
        <Stack spacing="md">
          <Group justify="space-between">
            <Group spacing="md">
              <IconCheck size={20} color="green" />
              <Text fw={600}>
                {importResult.imported} {entityType} imported successfully
              </Text>
            </Group>
            <Button
              leftSection={<IconArrowForwardUp size={16} />}
              variant="light"
              size="sm"
              color="blue"
              onClick={onReimport}
            >
              Re-import {entityType}
            </Button>
          </Group>

          <Button
            variant="light"
            color="blue"
            size="sm"
            mb={0}
            onClick={() => setIsExpanded(!isExpanded)}
            rightSection={
              <IconChevronDown
                size={16}
                style={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                }}
              />
            }
          >
            {isExpanded ? "Hide" : "Show"} {entityType} IDs
          </Button>

          <Collapse in={isExpanded} mt={0}>
            <Box
              p="xs"
              bg="white"
              style={{
                borderRadius: "4px",
                border: "1px solid var(--mantine-color-gray-2)",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <List size="sm" spacing="xs">
                {entityIds.map((id) => (
                  <List.Item key={id}>{id}</List.Item>
                ))}
              </List>
            </Box>
          </Collapse>
        </Stack>
      </Paper>
    </Box>
  );
};
