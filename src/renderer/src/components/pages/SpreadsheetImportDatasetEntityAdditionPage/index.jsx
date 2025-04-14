import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconUser,
  IconFlask,
  IconUpload,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCheck,
  IconArrowRight,
  IconDownload,
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
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import useGlobalStore from "../../../stores/globalStore";
import {
  importSubjectsFromExcel,
  importSamplesFromExcel,
} from "../../../services/excelImportService";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const [activeStep, setActiveStep] = useState(0);
  const [importResults, setImportResults] = useState({
    subjects: null,
    samples: null,
  });

  const datasetContainsSubjects = selectedEntities?.includes("subjects");
  const datasetContainsSamples = selectedEntities?.includes("samples");

  // Handle template downloads with error logging
  const handleDownloadTemplate = (templateName) => {
    try {
      window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", `${templateName}.xlsx`);
    } catch (error) {
      console.error(`Error sending IPC message for ${templateName} template:`, error);
    }
  };

  // File import handlers
  const handleSubjectFileImport = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      try {
        const result = await importSubjectsFromExcel(file);
        setImportResults((prev) => ({ ...prev, subjects: result }));

        if (result.success) {
          window.notyf.open({
            type: "success",
            message: result.message,
            duration: 5000,
          });

          // If samples are next, proceed to that step
          if (datasetContainsSamples) {
            setActiveStep(1);
          }
        } else {
          window.notyf.open({
            type: "error",
            message: result.message,
            duration: 5000,
          });
        }
      } catch (error) {
        window.notyf.open({
          type: "error",
          message: `Error importing subjects: ${error.message}`,
          duration: 5000,
        });
      }
    }
  };

  const handleSampleFileImport = async (files) => {
    if (files && files.length > 0) {
      const file = files[0];

      try {
        const result = await importSamplesFromExcel(file);
        setImportResults((prev) => ({ ...prev, samples: result }));

        if (result.success) {
          window.notyf.open({
            type: "success",
            message: result.message,
            duration: 5000,
          });
        } else {
          window.notyf.open({
            type: "error",
            message: result.message,
            duration: 5000,
          });
        }
      } catch (error) {
        window.notyf.open({
          type: "error",
          message: `Error importing samples: ${error.message}`,
          duration: 5000,
        });
      }
    }
  };

  const handleFileRejection = (files) => {
    window.notyf.open({
      type: "error",
      message: "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
      duration: 5000,
    });
  };

  // Register IPC event listeners
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

  // Build steps array based on selected entities
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
        <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm">
          {steps.map((step, index) => (
            <Stepper.Step
              key={index}
              label={step.title}
              icon={step.icon}
              completedIcon={<IconCheck size={18} />}
            >
              <Paper shadow="xs" p="md" withBorder>
                <Stack spacing="lg">
                  {index === 0 && datasetContainsSubjects && (
                    <Stack spacing="md">
                      <Title order={4}>Import Subjects</Title>
                      <Divider />

                      <Grid>
                        <Grid.Col span={6}>
                          <Stack spacing="md">
                            <List type="ordered" spacing="xs">
                              <List.Item>Download the template spreadsheet</List.Item>
                              <List.Item>Fill in your subject data</List.Item>
                              <List.Item>Upload the completed file</List.Item>
                            </List>

                            <Button
                              leftIcon={<IconDownload size={16} />}
                              variant="light"
                              onClick={() => handleDownloadTemplate("subjects")}
                            >
                              Download subjects.xlsx template
                            </Button>
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <Stack spacing="md">
                            <Dropzone
                              onDrop={handleSubjectFileImport}
                              onReject={handleFileRejection}
                              maxSize={5 * 1024 * 1024} // 5MB
                              accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                              h={120}
                            >
                              <Stack align="center" spacing="xs" style={{ pointerEvents: "none" }}>
                                <Dropzone.Accept>
                                  <IconCheck size={24} color="green" />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                  <IconAlertCircle size={24} color="red" />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                  <IconFileSpreadsheet size={24} color="blue" />
                                </Dropzone.Idle>
                                <Text size="sm" ta="center">
                                  Drop your subjects.xlsx file here
                                </Text>
                                <Text size="xs" c="dimmed" ta="center">
                                  Or click to browse your files
                                </Text>
                              </Stack>
                            </Dropzone>

                            {importResults.subjects && (
                              <Box mt="md">
                                <Text fw={500} c={importResults.subjects.success ? "green" : "red"}>
                                  {importResults.subjects.message}
                                </Text>
                                {importResults.subjects.imported > 0 && (
                                  <Text size="sm">
                                    Successfully imported {importResults.subjects.imported}{" "}
                                    subjects.
                                  </Text>
                                )}
                              </Box>
                            )}
                          </Stack>
                        </Grid.Col>
                      </Grid>

                      {datasetContainsSamples && (
                        <Group position="right" mt="md">
                          <Button
                            rightIcon={<IconArrowRight size={16} />}
                            onClick={() => setActiveStep(1)}
                            disabled={!importResults.subjects?.success}
                          >
                            Continue to Samples
                          </Button>
                        </Group>
                      )}
                    </Stack>
                  )}

                  {datasetContainsSamples && index === (datasetContainsSubjects ? 1 : 0) && (
                    <Stack spacing="md">
                      <Title order={4}>Import Samples</Title>
                      <Divider />

                      <Grid>
                        <Grid.Col span={6}>
                          <Stack spacing="md">
                            <List type="ordered" spacing="xs">
                              <List.Item>Download the template spreadsheet</List.Item>
                              <List.Item>Fill in your sample data</List.Item>
                              <List.Item>Upload the completed file</List.Item>
                            </List>

                            <Button
                              leftIcon={<IconDownload size={16} />}
                              variant="light"
                              onClick={() => handleDownloadTemplate("samples")}
                            >
                              Download samples.xlsx template
                            </Button>
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={6}>
                          <Stack spacing="md">
                            <Dropzone
                              onDrop={handleSampleFileImport}
                              onReject={handleFileRejection}
                              maxSize={5 * 1024 * 1024} // 5MB
                              accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                              h={120}
                            >
                              <Stack align="center" spacing="xs" style={{ pointerEvents: "none" }}>
                                <Dropzone.Accept>
                                  <IconCheck size={24} color="green" />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                  <IconAlertCircle size={24} color="red" />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                  <IconFileSpreadsheet size={24} color="green" />
                                </Dropzone.Idle>
                                <Text size="sm" ta="center">
                                  Drop your samples.xlsx file here
                                </Text>
                                <Text size="xs" c="dimmed" ta="center">
                                  Or click to browse your files
                                </Text>
                              </Stack>
                            </Dropzone>

                            {importResults.samples && (
                              <Box mt="md">
                                <Text fw={500} c={importResults.samples.success ? "green" : "red"}>
                                  {importResults.samples.message}
                                </Text>
                                {importResults.samples.imported > 0 && (
                                  <Text size="sm">
                                    Successfully imported {importResults.samples.imported} samples.
                                  </Text>
                                )}
                              </Box>
                            )}
                          </Stack>
                        </Grid.Col>
                      </Grid>

                      {datasetContainsSubjects && (
                        <Group position="left" mt="md">
                          <Button variant="outline" onClick={() => setActiveStep(0)}>
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
