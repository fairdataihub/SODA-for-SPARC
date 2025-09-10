import { Card, Group, Text, Box, List, Button, Stack } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { IconCheck, IconAlertCircle, IconFileSpreadsheet } from "@tabler/icons-react";
import {
  handleDownloadTemplate,
  handleEntityFileImport,
  handleFileRejection,
  entityConfigs,
} from "./excelImport";

export const DownloadCard = ({ entityType, config }) => {
  const templateFileName = entityConfigs[entityType]?.templateFileName || `${entityType}.xlsx`;

  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs" bg={`${config.color}.0`}>
        <Group position="apart">
          <Text fw={600}>Step 1: Fill out the {entityType} template</Text>
        </Group>
      </Card.Section>

      <Box mt="md" mb="lg" h={130}>
        <List type="ordered" spacing="sm" withPadding>
          <List.Item>Download the {entityType}.xlsx template</List.Item>
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
        onClick={() => handleDownloadTemplate(entityType)}
      >
        Download {templateFileName}
      </Button>
    </Card>
  );
};

export const ImportCard = ({ entityType, config, importResult }) => (
  <Card shadow="sm" p="md" radius="md" withBorder>
    <Card.Section withBorder inheritPadding py="xs" bg={`${config.color}.0`}>
      <Group position="apart">
        <Text fw={600}>Step 2: Import Completed {entityType}.xlsx File</Text>
      </Group>
    </Card.Section>

    <Box mt="md" h={185}>
      <Dropzone
        onDrop={(files) => handleEntityFileImport(files, entityType)}
        onReject={handleFileRejection}
        maxSize={5 * 1024 * 1024}
        accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
        h={140}
        mt="md"
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
            Drop your {entityType}.xlsx file here
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
