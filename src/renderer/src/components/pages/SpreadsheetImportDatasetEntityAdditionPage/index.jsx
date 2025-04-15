import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconUser,
  IconFlask,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCheck,
  IconArrowRight,
  IconDownload,
  IconUpload,
  IconCircleArrowRight,
} from "@tabler/icons-react";
import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Box,
  Title,
  Divider,
  Stepper,
  List,
  Card,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import useGlobalStore from "../../../stores/globalStore";
import { importEntitiesFromExcel, entityConfigs, saveEntities } from "./excelImport";
import { setActiveImportStep } from "../../../stores/slices/datasetEntityStructureSlice";
import { swalFileListDoubleAction } from "../../../scripts/utils/swal-utils";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const activeStep = useGlobalStore((state) => state.activeImportStep);
  const [importResults, setImportResults] = useState({
    subjects: null,
    samples: null,
  });

  const datasetContainsSubjects = selectedEntities?.includes("subjects");
  const datasetContainsSamples = selectedEntities?.includes("samples");
  const datasetContainsSites = selectedEntities?.includes("sites");
  const datasetContainsPerformances = selectedEntities?.includes("performances");

  /**
   * Generic entity import handler
   * @param {File[]} files - Dropped files
   * @param {string} entityType - Type of entity to import (e.g., 'subjects', 'samples')
   */
  const handleEntityFileImport = async (files, entityType) => {
    if (!files?.length) return;

    const config = entityConfigs[entityType];
    if (!config) {
      window.notyf.error(`Unsupported entity type: ${entityType}`);
      return;
    }

    try {
      // Step 1: Process file and get formatted entities
      const result = await importEntitiesFromExcel(files[0], entityType);

      if (!result.success) {
        window.notyf.error(result.message);
        return;
      }

      // Step 2: Show confirmation with processed entities
      const entityList = result.entities.map((entity) => config.formatDisplayId(entity));

      const confirmed = await swalFileListDoubleAction(
        entityList,
        `Confirm ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Import`,
        `The following ${entityList.length} ${entityType} will be imported:`,
        "Import",
        "Cancel"
      );

      if (!confirmed) {
        window.notyf.info(`${entityType} import cancelled`);
        return;
      }

      // Step 3: Save the entities to the data store
      const saveResult = saveEntities(result.entities, entityType);
      setImportResults((prev) => ({ ...prev, [entityType]: saveResult }));

      if (saveResult.success) {
        window.notyf.success(saveResult.message);

        // Automatic navigation to next step (if applicable)
        // This is specific to subjects & samples
        if (entityType === "subjects" && datasetContainsSamples) {
          setActiveImportStep(1);
        }
      } else {
        window.notyf.error(saveResult.message);
      }
    } catch (error) {
      window.notyf.error(`Error importing ${entityType}: ${error.message}`);
    }
  };

  // Update the handlers to use the generic function
  const handleSubjectFileImport = (files) => handleEntityFileImport(files, "subjects");
  const handleSampleFileImport = (files) => handleEntityFileImport(files, "samples");

  // Download template
  const handleDownloadTemplate = (entityType) => {
    const config = entityConfigs[entityType];
    if (!config) {
      console.error(`No template available for entity type: ${entityType}`);
      return;
    }

    try {
      window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", config.templateFileName);
    } catch (error) {
      console.error(`Error sending IPC message for ${entityType} template:`, error);
    }
  };

  const handleFileRejection = (files) => {
    window.notyf.open({
      type: "error",
      message: "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
      duration: 5000,
    });
  };

  useEffect(() => {
    const handleFolderSelected = (event, path, filename) => {
      console.log("Selected folder:", path);
      console.log("Template to download:", filename);
    };

    const handleDownloadError = (event, error) => {
      console.error("Template download error:", error);
    };

    window.electron.ipcRenderer.on("selected-metadata-download-folder", handleFolderSelected);
    window.electron.ipcRenderer.on("metadata-download-error", handleDownloadError);

    return () => {
      window.electron.ipcRenderer.removeListener(
        "selected-metadata-download-folder",
        handleFolderSelected
      );
      window.electron.ipcRenderer.removeListener("metadata-download-error", handleDownloadError);
    };
  }, []);

  const steps = [];
  if (datasetContainsSubjects) {
    steps.push({ title: "Import Subjects", icon: <IconUser size={18} /> });
  }
  if (datasetContainsSamples) {
    steps.push({ title: "Import Samples", icon: <IconFlask size={18} color="#74b816" /> });
  }

  return (
    <GuidedModePage pageHeader="Import Dataset Entities from Excel">
      <GuidedModeSection>
        <Stepper
          active={activeStep}
          onStepClick={(index) => setActiveImportStep(index)}
          breakpoint="sm"
          mb="lg"
        >
          {steps.map((step, index) => (
            <Stepper.Step
              key={index}
              label={step.title}
              icon={step.icon}
              completedIcon={<IconCheck size={18} />}
            >
              <Paper shadow="xs" p="xl" withBorder>
                <Stack spacing="xl">
                  {index === 0 && datasetContainsSubjects && (
                    <Stack spacing="lg">
                      <Title order={4} mb={0}>
                        Import Subjects
                      </Title>
                      <Divider />

                      <Grid gutter={32}>
                        <Grid.Col span={6}>
                          <Card shadow="sm" p="md" radius="md" withBorder>
                            <Card.Section withBorder inheritPadding py="xs" bg="blue.0">
                              <Group position="apart">
                                <Text fw={600}>Step 1: Download Template</Text>
                                <IconDownload size={18} color="blue" />
                              </Group>
                            </Card.Section>

                            <Box mt="md" mb="lg">
                              <List type="ordered" spacing="sm" withPadding>
                                <List.Item>Download the subjects template spreadsheet</List.Item>
                                <List.Item>Fill in your subject IDs and metadata</List.Item>
                                <List.Item>Save the file when complete</List.Item>
                              </List>
                            </Box>

                            <Button
                              fullWidth
                              leftIcon={<IconDownload size={16} />}
                              variant="light"
                              onClick={() => handleDownloadTemplate("subjects")}
                            >
                              Download subjects.xlsx
                            </Button>
                          </Card>
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <Card shadow="sm" p="md" radius="md" withBorder>
                            <Card.Section withBorder inheritPadding py="xs" bg="green.0">
                              <Group position="apart">
                                <Text fw={600}>Step 2: Import Completed File</Text>
                                <IconUpload size={18} color="green" />
                              </Group>
                            </Card.Section>

                            <Box mt="md">
                              <Dropzone
                                onDrop={handleSubjectFileImport}
                                onReject={handleFileRejection}
                                maxSize={5 * 1024 * 1024}
                                accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                                h={140}
                                mt="md"
                              >
                                <Stack
                                  align="center"
                                  spacing="sm"
                                  style={{ pointerEvents: "none" }}
                                >
                                  <Dropzone.Accept>
                                    <IconCheck size={32} color="green" />
                                  </Dropzone.Accept>
                                  <Dropzone.Reject>
                                    <IconAlertCircle size={32} color="red" />
                                  </Dropzone.Reject>
                                  <Dropzone.Idle>
                                    <IconFileSpreadsheet size={32} color="blue" />
                                  </Dropzone.Idle>
                                  <Text size="md" ta="center" fw={500}>
                                    Drop your subjects.xlsx file here
                                  </Text>
                                  <Text size="xs" c="dimmed" ta="center">
                                    Or click to browse your files
                                  </Text>
                                </Stack>
                              </Dropzone>

                              {importResults.subjects && (
                                <Box
                                  mt="md"
                                  p="xs"
                                  bg={importResults.subjects.success ? "green.0" : "red.0"}
                                  style={{ borderRadius: "4px" }}
                                >
                                  <Text
                                    fw={500}
                                    c={importResults.subjects.success ? "green.8" : "red.8"}
                                  >
                                    {importResults.subjects.message}
                                  </Text>
                                  {importResults.subjects.imported > 0 && (
                                    <Text
                                      size="sm"
                                      c={importResults.subjects.success ? "green.8" : "red.8"}
                                    >
                                      Successfully imported {importResults.subjects.imported}{" "}
                                      subjects.
                                    </Text>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Card>
                        </Grid.Col>
                      </Grid>

                      {datasetContainsSamples && (
                        <Group position="right" mt="md">
                          <Button
                            rightIcon={<IconCircleArrowRight size={16} />}
                            onClick={() => setActiveImportStep(1)}
                            disabled={!importResults.subjects?.success}
                          >
                            Continue to Samples
                          </Button>
                        </Group>
                      )}
                    </Stack>
                  )}

                  {datasetContainsSamples && index === (datasetContainsSubjects ? 1 : 0) && (
                    <Stack spacing="lg">
                      <Title order={4} mb={0}>
                        Import Samples
                      </Title>
                      <Divider />

                      <Grid gutter={32}>
                        <Grid.Col span={6}>
                          <Card shadow="sm" p="md" radius="md" withBorder>
                            <Card.Section withBorder inheritPadding py="xs" bg="blue.0">
                              <Group position="apart">
                                <Text fw={600}>Step 1: Download Template</Text>
                                <IconDownload size={18} color="blue" />
                              </Group>
                            </Card.Section>

                            <Box mt="md" mb="lg">
                              <List type="ordered" spacing="sm" withPadding>
                                <List.Item>Download the samples template spreadsheet</List.Item>
                                <List.Item>Fill in your sample IDs and metadata</List.Item>
                                <List.Item>Save the file when complete</List.Item>
                              </List>
                            </Box>

                            <Button
                              fullWidth
                              leftIcon={<IconDownload size={16} />}
                              variant="light"
                              onClick={() => handleDownloadTemplate("samples")}
                            >
                              Download samples.xlsx
                            </Button>
                          </Card>
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <Card shadow="sm" p="md" radius="md" withBorder>
                            <Card.Section withBorder inheritPadding py="xs" bg="green.0">
                              <Group position="apart">
                                <Text fw={600}>Step 2: Import Completed File</Text>
                                <IconUpload size={18} color="green" />
                              </Group>
                            </Card.Section>

                            <Box mt="md">
                              <Dropzone
                                onDrop={handleSampleFileImport}
                                onReject={handleFileRejection}
                                maxSize={5 * 1024 * 1024}
                                accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                                h={140}
                                mt="md"
                              >
                                <Stack
                                  align="center"
                                  spacing="sm"
                                  style={{ pointerEvents: "none" }}
                                >
                                  <Dropzone.Accept>
                                    <IconCheck size={32} color="green" />
                                  </Dropzone.Accept>
                                  <Dropzone.Reject>
                                    <IconAlertCircle size={32} color="red" />
                                  </Dropzone.Reject>
                                  <Dropzone.Idle>
                                    <IconFileSpreadsheet size={32} color="green" />
                                  </Dropzone.Idle>
                                  <Text size="md" ta="center" fw={500}>
                                    Drop your samples.xlsx file here
                                  </Text>
                                  <Text size="xs" c="dimmed" ta="center">
                                    Or click to browse your files
                                  </Text>
                                </Stack>
                              </Dropzone>

                              {importResults.samples && (
                                <Box
                                  mt="md"
                                  p="xs"
                                  bg={importResults.samples.success ? "green.0" : "red.0"}
                                  style={{ borderRadius: "4px" }}
                                >
                                  <Text
                                    fw={500}
                                    c={importResults.samples.success ? "green.8" : "red.8"}
                                  >
                                    {importResults.samples.message}
                                  </Text>
                                  {importResults.samples.imported > 0 && (
                                    <Text
                                      size="sm"
                                      c={importResults.samples.success ? "green.8" : "red.8"}
                                    >
                                      Successfully imported {importResults.samples.imported}{" "}
                                      samples.
                                    </Text>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Card>
                        </Grid.Col>
                      </Grid>

                      {datasetContainsSubjects && (
                        <Group position="apart" mt="md">
                          <Button variant="outline" onClick={() => setActiveImportStep(0)}>
                            Back to Subjects
                          </Button>
                        </Group>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Stepper.Step>
          ))}
        </Stepper>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SpreadsheetImportDatasetEntityAdditionPage;
