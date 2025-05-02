import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconUser,
  IconFlask,
  IconMapPin,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconUpload,
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
  List,
  Card,
} from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import useGlobalStore from "../../../stores/globalStore";
import { importEntitiesFromExcel, entityConfigs, saveEntities } from "./excelImport";
import { swalFileListDoubleAction, swalConfirmAction } from "../../../scripts/utils/swal-utils";
import {
  getExistingSubjects,
  getExistingSamples,
  getExistingSites,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { normalizeEntityId } from "../../../stores/slices/datasetEntityStructureSlice";
import { get } from "jquery";

const SpreadsheetImportDatasetEntityAdditionPage = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const [importResults, setImportResults] = useState({
    subjects: null,
    samples: null,
    sites: null,
  });

  // Check which entity types are enabled for this dataset
  const entityTypes = {
    subjects: selectedEntities?.includes("subjects"),
    samples: selectedEntities?.includes("samples"),
    sites: selectedEntities?.includes("sites"),
  };

  /**
   * Generic entity import handler
   */
  const handleEntityFileImport = async (files, entityType) => {
    if (!files?.length) return;

    const config = entityConfigs[entityType];
    if (!config) {
      window.notyf.error(`Unsupported entity type: ${entityType}`);
      return;
    }

    try {
      // Process file and get formatted entities
      const result = await importEntitiesFromExcel(files[0], entityType);

      if (!result.success) {
        window.notyf.error(result.message);
        return;
      }

      // Show confirmation with processed entities
      const entityList = result.entities.map((entity) => config.formatDisplayId(entity));

      const confirmed = await swalFileListDoubleAction(
        entityList,
        `Confirm ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Import`,
        `The following ${entityList.length} ${entityType} were detected in your spreadsheet and will be imported into SODA:`,
        "Import",
        "Cancel"
      );

      if (!confirmed) {
        window.notyf.info(`${entityType} import cancelled`);
        return;
      }

      // Save the entities to the data store
      const saveResult = saveEntities(result.entities, entityType);
      setImportResults((prev) => ({ ...prev, [entityType]: saveResult }));

      if (saveResult.success) {
        window.notyf.success(saveResult.message);
      } else {
        window.notyf.error(saveResult.message);
      }
    } catch (error) {
      window.notyf.error(`Error importing ${entityType}: ${error.message}`);
    }
  };

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

  const handleFileRejection = () => {
    window.notyf.error("Invalid file format. Please upload an Excel file (.xlsx or .xls)");
  };

  useEffect(() => {
    // Bind IPC event listeners for template downloads
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

  // Entity type config for display options with dependencies
  const entityTypeConfig = {
    subjects: {
      title: "Subject ID designation",
      singularString: "subject",
      icon: <IconUser size={24} />,
      color: "blue",
      description: "Assign unique IDs to each subject in your dataset using the template below.",
      dependsOn: [], // No dependencies - can always be imported first
      sequence: 1,
    },
    samples: {
      title: "Import Samples",
      singularString: "sample",
      icon: <IconFlask size={24} />,
      color: "green",
      description: "Import sample IDs and metadata from an Excel file",
      dependsOn: ["subjects"], // Depends on subjects being imported first
      sequence: 2,
    },
    sites: {
      title: "Import Sites",
      singularString: "site",
      icon: <IconMapPin size={24} />,
      color: "orange",
      description: "Import site IDs and metadata from an Excel file",
      dependsOn: ["subjects", "samples"], // Depends on both subjects and samples
      sequence: 3,
    },
  };

  // Enhanced dependency check that considers if an entity type should be shown
  const shouldShowEntityType = (entityType) => {
    const dependencies = entityTypeConfig[entityType].dependsOn;

    // If no dependencies, always show
    if (!dependencies || dependencies.length === 0) return true;

    // For each dependency, check if it's been successfully imported
    for (const dep of dependencies) {
      // If dependency isn't successfully imported, don't show this entity type
      if (!(importResults[dep]?.success && importResults[dep]?.imported > 0)) {
        return false;
      }
    }

    return true; // All dependencies are met
  };

  return (
    <GuidedModePage pageHeader="Designate entity IDs using spreadsheets">
      <GuidedModeSection>
        <Text mb="xl">
          Follow the instructions below to import the IDs and metadata for the entities in your
          dataset using spreadsheets.
        </Text>

        {/* Entity Import Sections - only show those whose dependencies are met */}
        {Object.keys(entityTypes)
          .filter((type) => entityTypes[type] && shouldShowEntityType(type))
          .sort((a, b) => entityTypeConfig[a].sequence - entityTypeConfig[b].sequence)
          .map((entityType) => (
            <Paper key={entityType} shadow="xs" p="lg" radius="md" withBorder mb="xl">
              <Stack>
                <Text size="lg" fw={600}>
                  {entityTypeConfig[entityType].title}
                </Text>
                {!importResults[entityType]?.success && (
                  <Text>{entityTypeConfig[entityType].description}</Text>
                )}
                <Divider />
                {!importResults[entityType]?.success ? (
                  // Show normal import UI for entities that can be imported
                  <Grid gutter={32} mt="sm">
                    {/* Download Template Card */}
                    <Grid.Col span={6}>
                      <Card shadow="sm" p="md" radius="md" withBorder>
                        <Card.Section
                          withBorder
                          inheritPadding
                          py="xs"
                          bg={`${entityTypeConfig[entityType].color}.0`}
                        >
                          <Group position="apart">
                            <Text fw={600}>Step 1: Fill out the {entityType} template</Text>
                          </Group>
                        </Card.Section>

                        <Box mt="md" mb="lg" h={130}>
                          <List type="ordered" spacing="sm" withPadding>
                            <List.Item>Download the {entityType}.xlsx template</List.Item>
                            <List.Item>
                              Assign every {entityTypeConfig[entityType].singularString} a unique ID
                              in the {entityTypeConfig[entityType].singularString} ID column in the
                              spreadsheet.
                            </List.Item>
                            <List.Item>Save the file and continue to step 2.</List.Item>
                          </List>
                        </Box>

                        <Button
                          fullWidth
                          leftIcon={<IconDownload size={16} />}
                          variant="light"
                          color={entityTypeConfig[entityType].color}
                          onClick={() => handleDownloadTemplate(entityType)}
                        >
                          Download{" "}
                          {entityConfigs[entityType]?.templateFileName || `${entityType}.xlsx`}
                        </Button>
                      </Card>
                    </Grid.Col>

                    {/* Import File Card */}
                    <Grid.Col span={6}>
                      <Card shadow="sm" p="md" radius="md" withBorder>
                        <Card.Section
                          withBorder
                          inheritPadding
                          py="xs"
                          bg={`${entityTypeConfig[entityType].color}.0`}
                        >
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
                                <IconCheck size={32} color={entityTypeConfig[entityType].color} />
                              </Dropzone.Accept>
                              <Dropzone.Reject>
                                <IconAlertCircle size={32} color="red" />
                              </Dropzone.Reject>
                              <Dropzone.Idle>
                                <IconFileSpreadsheet
                                  size={32}
                                  color={entityTypeConfig[entityType].color}
                                />
                              </Dropzone.Idle>
                              <Text size="md" ta="center" fw={500}>
                                Drop your {entityType}.xlsx file here
                              </Text>
                              <Text size="xs" c="dimmed" ta="center">
                                Or click to import from your computer
                              </Text>
                            </Stack>
                          </Dropzone>

                          {importResults[entityType] && !importResults[entityType].success && (
                            <Box mt="md" p="xs" bg="red.0" style={{ borderRadius: "4px" }}>
                              <Text fw={500} c="red.8">
                                {importResults[entityType].message}
                              </Text>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </Grid.Col>
                  </Grid>
                ) : (
                  // Simplified success UI
                  <Box mt="md">
                    <Paper p="md" radius="md" withBorder bg="green.0">
                      <Group position="apart" align="center">
                        <Group spacing="md">
                          <IconCheck size={20} color="green" />
                          <Text fw={600}>
                            {importResults[entityType].imported} {entityType} imported successfully
                          </Text>
                        </Group>

                        <Group spacing="xs">
                          <Button
                            compact
                            variant="light"
                            color="blue"
                            onClick={() =>
                              swalConfirmAction(
                                "warning",
                                "Replace imported data?",
                                `This will remove the existing ${importResults[entityType].imported} ${entityType} and let you import new ones.`,
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
                      </Group>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </Paper>
          ))}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SpreadsheetImportDatasetEntityAdditionPage;
