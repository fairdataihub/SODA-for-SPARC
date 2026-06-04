import { Card, Group, Text, Box, List, Button, Stack, Paper } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconCheck, IconAlertCircle, IconFileSpreadsheet } from "@tabler/icons-react";
import { useRef, useEffect, useCallback } from "react";
import {
  handleDownloadTemplate,
  handleEntityFileImport,
  handleFileRejection,
  entityConfigs,
  handleEntityFileImportWithPath,
} from "./excelImport";

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
  const dropzoneRef = useRef(null);

  // Get real dependencies (filter out "entity-structure")
  const realDeps = config.dependsOn?.filter((dep) => dep !== "entity-structure") || [];
  const depsText = realDeps.map((d) => `${d} metadata`).join(", ");

  useEffect(() => {
    const dropzoneElement = dropzoneRef.current;
    if (!dropzoneElement) {
      console.log("[ImportCard] Dropzone element not found");
      return;
    }

    const handleDrop = (event) => {
      console.log("[ImportCard] Drop event triggered");
      event.preventDefault();
      event.stopPropagation();
      const filePath = event.dataTransfer.files[0]?.path;
      console.log("[ImportCard] File dropped with path:", filePath);
      if (filePath) {
        handleEntityFileImportWithPath(filePath, entityType);
      }
    };

    const handleDragOver = (event) => {
      console.log("[ImportCard] Drag over event");
      event.preventDefault();
      event.stopPropagation();
    };

    console.log("[ImportCard] Setting up drop/dragover listeners");
    dropzoneElement.addEventListener("drop", handleDrop);
    dropzoneElement.addEventListener("dragover", handleDragOver);

    return () => {
      console.log("[ImportCard] Cleaning up drop/dragover listeners");
      dropzoneElement.removeEventListener("drop", handleDrop);
      dropzoneElement.removeEventListener("dragover", handleDragOver);
    };
  }, [entityType, handleEntityFileImportWithPath]);

  const handleClickImport = useCallback(async () => {
    console.log("[ImportCard] Click import triggered for", entityType);
    try {
      console.log("[ImportCard] Opening file dialog");
      const filePath = await window.electron.ipcRenderer.invoke("open-file-dialog-import-metadata");
      console.log("[ImportCard] File dialog returned path:", filePath);
      if (filePath) {
        handleEntityFileImportWithPath(filePath, entityType);
      } else {
        console.log("[ImportCard] No file path selected");
      }
    } catch (error) {
      console.error("[ImportCard] Error opening file dialog:", error);
    }
  }, [entityType, handleEntityFileImportWithPath]);

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

      <Box mt="md" h={185} ref={dropzoneRef}>
        <Dropzone
          onDrop={() => {}}
          onReject={handleFileRejection}
          maxSize={5 * 1024 * 1024}
          accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
          h={140}
          mt="md"
          onClick={handleClickImport}
        >
          <Stack align="center" spacing="sm" style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconCheck size={32} color={config.color} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconAlertCircle size={32} color="red" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileSpreadsheet size={32} color="var(--color-light-green)" />
            </Dropzone.Idle>
            <Text size="md" ta="center" fw={500}>
              Drop your {config["metadataFileName"] || `${entityType}.xlsx`} file here
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Or click to import from your computer
            </Text>
          </Stack>
        </Dropzone>

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
