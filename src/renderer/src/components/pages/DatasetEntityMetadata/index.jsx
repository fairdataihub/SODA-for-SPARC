import { useMemo, useCallback, useRef, useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconInfoCircle,
  IconDeviceFloppy,
  IconUser,
  IconFlask,
  IconPin,
  IconClipboard,
  IconCheck,
  IconX,
  IconUpload,
  IconFileSpreadsheet,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Box,
  Tooltip,
  Badge,
  Title,
  Divider,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Notification,
  Accordion,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import useGlobalStore from "../../../stores/globalStore";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import {
  updateExistingEntityMetadata,
  getEntityMetadataValue,
  updateTemporaryMetadata,
  clearTemporaryMetadata,
  setActiveFormType,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice";
import {
  addSubject,
  addSampleToSubject,
  addSiteToSubject,
  addSiteToSample,
} from "../../../stores/slices/datasetEntityStructureSlice";
import SodaPaper from "../../utils/ui/SodaPaper";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";

/**
 * EntityMetadataForm Component
 *
 * Provides a form interface for creating and editing dataset entities (subjects, samples, sites, performances).
 * Handles form field rendering, value retrieval, ID prefix management, and entity persistence.
 */
const EntityMetadataForm = () => {
  // Cache to prevent redundant updates
  const previousValueRef = useRef({});

  // Subscribe to global store state with individual selectors for optimal re-renders
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const activeFormType = useGlobalStore((state) => state.activeFormType);
  const temporaryEntityMetadata = useGlobalStore((state) => state.temporaryEntityMetadata || {});
  const entityBeingAddedParentSubject = useGlobalStore(
    (state) => state.entityBeingAddedParentSubject
  );
  const entityBeingAddedParentSample = useGlobalStore(
    (state) => state.entityBeingAddedParentSample
  );
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetContainsSubjects = selectedEntities && selectedEntities.includes("subjects");
  const datasetContainsSamples = selectedEntities && selectedEntities.includes("samples");

  // Define standard prefixes for entity IDs
  const entityPrefixes = {
    subject: "sub-",
    sample: "sam-",
    site: "site-",
    performance: "perf-",
  };

  /**
   * Retrieves formatted metadata value for display in the form
   * Handles special cases like ID prefixes (removing prefixes for edit fields)
   *
   * @param {string} key - Metadata field key to retrieve
   * @returns {string} Formatted value for display
   */
  const getMetadataValue = useCallback(
    (key) => {
      let value = "";

      // Source value from appropriate location based on context
      if (selectedHierarchyEntity) {
        // Get from existing entity
        value = getEntityMetadataValue(selectedHierarchyEntity, key);
      } else if (activeFormType) {
        // Get from temporary storage for new entities
        value = getEntityMetadataValue(null, key, activeFormType);
      }

      // Special handling: Strip prefixes from ID fields for display
      if (selectedHierarchyEntity && value && key.endsWith(" id")) {
        const entityType = selectedHierarchyEntity.type;
        const prefix = entityPrefixes[entityType];

        if (prefix && value.startsWith(prefix)) {
          return value.substring(prefix.length);
        }
      }

      return value;
    },
    [selectedHierarchyEntity, activeFormType]
  );

  /**
   * Processes field value changes and updates the appropriate state
   * Handles ID prefix formatting and prevents redundant updates
   *
   * @param {string} field - The field name being changed
   * @param {string} value - The new field value
   */
  const handleChange = (field, value) => {
    const entityType = selectedHierarchyEntity?.type || activeFormType;
    let finalValue = value;

    /*
    // Apply special handling for ID fields
    if (field.endsWith(" id")) {
      const prefix = entityPrefixes[entityType];

      // Ensure correct prefix format
      if (prefix && !value.startsWith(prefix)) {
        finalValue = `${prefix}${value}`;
      }

      // Prevent redundant updates by checking against previous values
      if (selectedHierarchyEntity) {
        const cacheKey = `${selectedHierarchyEntity.id}-${field}`;

        // Skip if this exact update was already processed
        if (previousValueRef.current[cacheKey] === finalValue) {
          return;
        }

        // Cache this value for future comparison
        previousValueRef.current[cacheKey] = finalValue;
      }
    }*/

    // Update the appropriate state based on context
    if (selectedHierarchyEntity) {
      // Update existing entity
      updateExistingEntityMetadata(selectedHierarchyEntity, { [field]: finalValue });
    } else {
      // Update temporary storage for new entity
      updateTemporaryMetadata(activeFormType, { [field]: finalValue });
    }
  };

  if (datasetEntityArray.length === 0 && !activeFormType) {
    return (
      <Box mx="md">
        <Text size="lg" c="gray">
          Click the "Add Subject" button to the left to begin structuring and adding metadata to
          your dataset's entities.
        </Text>
      </Box>
    );
  }

  // Show a message when no entity is selected or being created
  if (!selectedHierarchyEntity && !activeFormType) {
    return (
      <Box mx="md">
        <Text size="lg" c="gray">
          Select an entity from the hierarchy on the left to edit its metadata or click "Add
          Subject" to add another subject.
        </Text>
      </Box>
    );
  }

  /**
   * Cancels current editing/creation and returns to entity selection view
   * Clears temporary data when creating new entities
   */
  const handleCancel = () => {
    if (selectedHierarchyEntity) {
      setSelectedHierarchyEntity(null);
    } else if (activeFormType) {
      clearTemporaryMetadata(activeFormType);
      setActiveFormType(null);
    }
  };

  /**
   * Handles saving entity data
   * Creates new entities or completes editing of existing ones
   */
  const handleSave = () => {
    if (selectedHierarchyEntity) {
      // Complete editing existing entity
      setSelectedHierarchyEntity(null);
    } else {
      // Create appropriate entity type from temporary data
      if (activeFormType === "subject") {
        // Create subject entity
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.subject || {};

        // Validate required fields
        if (!tempMetadata["subject id"]) {
          window.notyf.open({
            duration: "4000",
            type: "error",
            message: "You must assign this subject an ID.",
          });
          return;
        }

        try {
          addSubject(tempMetadata["subject id"], tempMetadata);
        } catch (error) {
          window.notyf.open({ duration: "4000", type: "error", message: error.message });
          return;
        }

        clearTemporaryMetadata("subject");
      } else if (activeFormType === "sample") {
        // Create sample entity
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.sample || {};
        addSampleToSubject(entityBeingAddedParentSubject, tempMetadata["sample id"], tempMetadata);
        clearTemporaryMetadata("sample");
      } else if (activeFormType === "site") {
        // Create site entity
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.site || {};

        // Validate required fields
        if (!tempMetadata["site id"]) {
          window.notyf.open({
            duration: "4000",
            type: "error",
            message: "You must assign this site an ID.",
          });
          return;
        }

        try {
          // Create site on either subject or sample based on context
          if (entityBeingAddedParentSample) {
            // Site belongs to sample
            addSiteToSample(
              entityBeingAddedParentSubject,
              entityBeingAddedParentSample,
              tempMetadata["site id"],
              tempMetadata
            );
          } else if (entityBeingAddedParentSubject) {
            // Site belongs directly to subject
            addSiteToSubject(entityBeingAddedParentSubject, tempMetadata["site id"], tempMetadata);
          }
        } catch (error) {
          window.notyf.open({ duration: "4000", type: "error", message: error.message });
          return;
        }

        clearTemporaryMetadata("site");
      }

      // Return to entity selection view
      setActiveFormType(null);
    }
  };

  /**
   * Returns the appropriate icon component for the current entity type
   * @returns {JSX.Element} Icon component for entity type
   */
  const getEntityIcon = () => {
    const entityType = selectedHierarchyEntity?.type || activeFormType;

    switch (entityType) {
      case "subject":
        return <IconUser size={20} />;
      case "sample":
        return <IconFlask size={20} color="#74b816" />;
      case "site":
        return <IconPin size={20} color="red" />;
      case "performance":
        return <IconClipboard size={20} color="#ae3ec9" />;
      default:
        return null;
    }
  };

  /**
   * Renders form fields specific to the current entity type
   * Builds the appropriate input controls based on entity schema
   *
   * @returns {JSX.Element} Form fields for the current entity
   */
  const renderEntitySpecificFields = () => {
    const entityType = selectedHierarchyEntity?.type || activeFormType;

    switch (entityType) {
      case "subject":
        return (
          <Stack spacing="md">
            <TextInput
              label="Subject Identifier"
              description="Enter a unique identifier for this subject."
              placeholder="Enter subject ID"
              value={getMetadataValue("subject id")}
              onChange={(e) => handleChange("subject id", e.target.value)}
              leftSection={
                <Text size="sm" c="dimmed" mx="sm">
                  {entityPrefixes["subject"]}
                </Text>
              }
              leftSectionWidth={50}
            />
            <TextInput
              label="Subject Experimental Group"
              description="The experimental group this subject belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimental group")}
              onChange={(e) => handleChange("experimental group", e.target.value)}
            />

            <Group grow justify="space-between">
              <Box>
                <Text size="sm" fw={500} mb={3}>
                  Age Value
                </Text>
                <Text size="xs" c="dimmed" mb={5}>
                  Numeric age value
                </Text>
                <NumberInput
                  placeholder="e.g., 12"
                  value={getMetadataValue("ageValue")}
                  onChange={(value) => handleChange("ageValue", value)}
                  min={0}
                  defaultValue={0}
                />
              </Box>

              <Box>
                <Text size="sm" fw={500} mb={3}>
                  Age Unit
                </Text>
                <Text size="xs" c="dimmed" mb={5}>
                  Time unit for age
                </Text>
                <Select
                  placeholder="Select unit"
                  data={[
                    { value: "hours", label: "Hours" },
                    { value: "days", label: "Days" },
                    { value: "weeks", label: "Weeks" },
                    { value: "months", label: "Months" },
                    { value: "years", label: "Years" },
                  ]}
                  value={getMetadataValue("ageUnit")}
                  onChange={(value) => handleChange("ageUnit", value)}
                  defaultValue={"Select unit"}
                />
              </Box>
            </Group>
            <Select
              label="Sex"
              description="Subject's biological sex"
              placeholder="Select sex"
              data={["Male", "Female", "Unknown"]}
              value={getMetadataValue("sex")}
              onChange={(value) => handleChange("sex", value)}
            />
            <Select
              label="Age category"
              description="The age category of the subject at the time of the experiment"
              placeholder="Select age category"
              data={[
                "zygote stage",
                "cleavage stage",
                "2 cell stage",
                "4 cell stage",
                "8 cell stage",
                "blastula stage",
                "gastrula stage",
                "neurula stage",
                "pharyngula stage",
                "organogenesis stage",
                "late embryonic stage",
                "embryo stage",
                "perinatal stage",
                "neonate stage",
                "infant stage",
                "nursing stage",
                "juvenile stage",
                "sexually immature stage",
                "post-juvenile adult stage",
                "prime adult stage",
                "late adult stage",
                "death stage",
                "nauplius stage",
                "trochophore stage",
                "veliger stage",
                "zoea stage",
                "larval stage (25)",
                "pupal stage",
                "copepodite stage 1",
                "copepodite stage 2",
                "copepodite stage 3",
                "copepodite stage 4",
                "copepodite stage 5",
                "copepodite stage 6",
                "copepodite stage",
                "crustacean post-larval stage (1)",
                "glaucothoe stage",
                "cysticercus stage",
                "post-embryonic stage",
                "fully formed stage",
              ]}
              value={getMetadataValue("age category")}
              onChange={(value) => handleChange("age category", value)}
            />
          </Stack>
        );
      case "sample":
        return (
          <Stack spacing="md">
            <TextInput
              label="Subject this sample belongs to"
              disabled
              value={entityBeingAddedParentSubject}
            />
            <TextInput
              label="Sample Identifier"
              description="Enter a unique identifier for this biological sample."
              placeholder="Enter sample ID"
              value={getMetadataValue("sample id")}
              onChange={(e) => handleChange("sample id", e.target.value)}
              leftSection={
                <Text size="sm" c="dimmed" mx="sm">
                  {entityPrefixes["sample"]}
                </Text>
              }
              leftSectionWidth={50}
            />

            <TextInput
              label="Sample Experimental Group"
              description="The experimental group this sample belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimental group")}
              onChange={(e) => handleChange("experimental group", e.target.value)}
            />
            <Select
              label="Sample Type"
              placeholder="Select sample type"
              data={[
                "Tissue",
                "Whole Organ",
                "Primary Cell",
                "Immortalized Cell Line",
                "In Vitro Differentiated Cell",
                "Induced Pluripotent Stem Cell",
                "Stem Cell",
                "Other",
              ]}
              value={getMetadataValue("sample type")}
              onChange={(value) => handleChange("sample type", value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location this sample was taken from"
              placeholder="e.g., Dorsal root ganglion"
              value={getMetadataValue("anatomicalLocation")}
              onChange={(e) => handleChange("anatomicalLocation", e.target.value)}
            />
          </Stack>
        );
      case "site":
        return (
          <Stack spacing="md">
            {/* Display parent information based on what's available */}
            {selectedHierarchyEntity ? (
              // When editing an existing site
              <>
                {selectedHierarchyEntity.parentSubject && (
                  <TextInput
                    label="Subject this site belongs to"
                    disabled
                    value={selectedHierarchyEntity.parentSubject}
                  />
                )}
                {selectedHierarchyEntity.parentSample && (
                  <TextInput
                    label="Sample this site belongs to"
                    disabled
                    value={selectedHierarchyEntity.parentSample}
                  />
                )}
              </>
            ) : (
              // When creating a new site
              <>
                {entityBeingAddedParentSubject && (
                  <TextInput
                    label="Subject this site belongs to"
                    disabled
                    value={entityBeingAddedParentSubject}
                  />
                )}
                {entityBeingAddedParentSample && (
                  <TextInput
                    label="Sample this site belongs to"
                    disabled
                    value={entityBeingAddedParentSample}
                  />
                )}
              </>
            )}

            <TextInput
              label="Site Identifier"
              description="Enter a unique identifier for this site."
              placeholder="Enter site ID"
              value={getMetadataValue("site id")}
              onChange={(e) => handleChange("site id", e.target.value)}
              leftSection={
                <Text size="sm" c="dimmed" mx="sm">
                  {entityPrefixes["site"]}
                </Text>
              }
              leftSectionWidth={50}
            />
            <TextInput
              label="Site type"
              placeholder="e.g., Recording site, Injection site"
              value={getMetadataValue("siteType")}
              onChange={(e) => handleChange("siteType", e.target.value)}
            />
            <TextInput
              label="Laboratory Internal ID"
              placeholder="e.g., 12345"
              value={getMetadataValue("laboratory-internal-id")}
              onChange={(e) => handleChange("laboratory-internal-id", e.target.value)}
            />
            <TextInput
              label="Coordinates"
              description="point, line, volume, etc."
              placeholder="e.g., X:1.2, Y:3.4, Z:5.6"
              value={getMetadataValue("coordinates")}
              onChange={(e) => handleChange("coordinates", e.target.value)}
            />
          </Stack>
        );
      case "performance":
        return (
          <Stack spacing="md">
            <TextInput
              label="Performance Identifier"
              description="Enter a unique identifier for this experimental session."
              placeholder="Enter performance ID"
              value={getMetadataValue("performance id")}
              onChange={(e) => handleChange("performance id", e.target.value)}
            />
            <TextInput
              label="Experimental Group"
              description="The experimental group this performance belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimentalGroup")}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Equipment"
              description="Equipment used for this recording/performance"
              placeholder="e.g., Multichannel electrode array"
              value={getMetadataValue("equipment")}
              onChange={(e) => handleChange("equipment", e.target.value)}
            />
            <TextInput
              label="Date"
              description="Date of the recording/performance"
              placeholder="YYYY-MM-DD"
              value={getMetadataValue("date")}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </Stack>
        );
      default:
        return (
          <Box p="md" bg="gray.0">
            <Text c="dimmed">Unknown entity type: {entityType}</Text>
          </Box>
        );
    }
  };

  // Main component render
  return (
    <SodaPaper>
      <Stack spacing="lg">
        {/* Header section with entity type and title */}
        <Group position="apart">
          <Group>
            {getEntityIcon()}
            <Title order={4}>
              {selectedHierarchyEntity
                ? `Editing ${selectedHierarchyEntity.type}: ${selectedHierarchyEntity.id}`
                : `Add new ${activeFormType}`}
            </Title>
          </Group>
        </Group>

        <Divider />

        {/* Dynamic form fields based on entity type */}
        {renderEntitySpecificFields()}

        {/* Action buttons */}
        <Group position="right" mt="md">
          <Button
            variant="outline"
            color="gray"
            onClick={handleCancel}
            leftIcon={<IconX size={16} />}
          >
            Cancel
          </Button>

          <Button color="blue" onClick={handleSave} leftIcon={<IconDeviceFloppy size={16} />}>
            {selectedHierarchyEntity ? "Save Changes" : `Add ${activeFormType}`}
          </Button>
        </Group>
      </Stack>
    </SodaPaper>
  );
};

/**
 * DatasetEntityMetadata Page Component
 *
 * Main page for dataset entity metadata management.
 * Provides entity selection and metadata editing interface.
 */
const DatasetEntityMetadata = () => {
  // Access selected entities to determine what to show
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const datasetContainsSubjects = selectedEntities?.includes("subjects");
  const datasetContainsSamples = selectedEntities?.includes("samples");

  // Only show import section if we have subjects or samples
  const showImportSection = datasetContainsSubjects || datasetContainsSamples;

  // Enhanced template download functions with logging
  const handleDownloadSubjectsTemplate = () => {
    console.log("Download subjects template button clicked");
    try {
      window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", "subjects.xlsx");
      console.log("IPC message sent for subjects.xlsx template download");
    } catch (error) {
      console.error("Error sending IPC message for subjects template:", error);
    }
  };

  const handleDownloadSamplesTemplate = () => {
    console.log("Download samples template button clicked");
    try {
      window.electron.ipcRenderer.send("open-folder-dialog-save-metadata", "samples.xlsx");
      console.log("IPC message sent for samples.xlsx template download");
    } catch (error) {
      console.error("Error sending IPC message for samples template:", error);
    }
  };

  // Add listeners for IPC responses
  useEffect(() => {
    // Log when component mounts
    console.log("DatasetEntityMetadata component mounted");

    // Add event listener for folder selection response
    const handleFolderSelected = (event, path, filename) => {
      console.log("Selected folder:", path);
      console.log("Template to download:", filename);
    };

    // Add event listener for any errors
    const handleDownloadError = (event, error) => {
      console.error("Template download error:", error);
    };

    // Register event listeners
    window.electron.ipcRenderer.on("selected-metadata-download-folder", handleFolderSelected);
    window.electron.ipcRenderer.on("metadata-download-error", handleDownloadError);

    // Make sure window.electron exists
    console.log("Electron IPC available:", !!window.electron?.ipcRenderer);

    // Cleanup listeners on unmount
    return () => {
      window.electron.ipcRenderer.removeListener(
        "selected-metadata-download-folder",
        handleFolderSelected
      );
      window.electron.ipcRenderer.removeListener("metadata-download-error", handleDownloadError);
    };
  }, []);

  // Add file import handling functions
  const handleSubjectFileImport = (files) => {
    console.log("Subject file import triggered");
    if (files && files.length > 0) {
      const file = files[0];
      console.log("Importing subject file:", file.name);

      // Validate file name
      if (!file.name.toLowerCase().includes("subject")) {
        window.notyf.open({
          type: "error",
          message: "Please upload a subjects.xlsx file",
          duration: 5000,
        });
        return;
      }

      // Handle the file import
      // TODO: Add actual file processing logic here
      window.notyf.open({
        type: "success",
        message: "Subject file imported successfully",
        duration: 3000,
      });
    }
  };

  const handleSampleFileImport = (files) => {
    console.log("Sample file import triggered");
    if (files && files.length > 0) {
      const file = files[0];
      console.log("Importing sample file:", file.name);

      // Validate file name
      if (!file.name.toLowerCase().includes("sample")) {
        window.notyf.open({
          type: "error",
          message: "Please upload a samples.xlsx file",
          duration: 5000,
        });
        return;
      }

      // Handle the file import
      // TODO: Add actual file processing logic here
      window.notyf.open({
        type: "success",
        message: "Sample file imported successfully",
        duration: 3000,
      });
    }
  };

  const handleFileRejection = (files) => {
    console.log("File rejected:", files);
    window.notyf.open({
      type: "error",
      message: "Invalid file format. Please upload an Excel file (.xlsx or .xls)",
      duration: 5000,
    });
  };

  return (
    <GuidedModePage pageHeader="Dataset entity metadata">
      <GuidedModeSection>
        <Stack>
          <Text>The SDS requires that you provide metadata for each entity in your dataset:</Text>
          <Stack spacing="xs">
            {selectedEntities?.includes("subjects") && (
              <Text>
                <strong>Subjects:</strong> An unique identifier and metadata such as age and sex for
                each participant in your study.
              </Text>
            )}
            {selectedEntities?.includes("samples") && (
              <Text>
                <strong>Samples:</strong> An unique identifier and metadata such as sample type and
                anatomical location it was extracted from for each sample that was collected from
                your subjects.
              </Text>
            )}
            {selectedEntities?.includes("sites") && (
              <Text>
                <strong>Sites:</strong> An unique identifier and metadata such as coordinates and
                site type for each anatomical location data was collected from.
              </Text>
            )}
          </Stack>
          <Text>
            <strong>For datasets with a large amount of subjects or samples:</strong> You can bulk
            import from Excel spreadsheets using the tools below.
          </Text>
        </Stack>
      </GuidedModeSection>

      {/* Conditionally render the import section */}
      {showImportSection && (
        <GuidedModeSection>
          <Accordion
            variant="contained"
            multiple={true}
            defaultValue={datasetContainsSubjects ? ["subjects"] : []}
          >
            {/* Subject Import Accordion Item */}
            {datasetContainsSubjects && (
              <Accordion.Item value="subjects">
                <Accordion.Control icon={<IconUser size={20} />}>
                  Bulk Import Subject Data from Excel
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    {/* Step 1: Fill out Template */}
                    <Grid.Col span={6}>
                      <Stack spacing="sm">
                        <Box>
                          <Text fw={600} mb={5}>
                            Step 1: Prepare your subjects.xlsx file
                          </Text>
                          <Text size="sm">
                            Download and fill out the spreadsheet with your subject IDs and any
                            other metadata relating to your subjects.
                          </Text>
                        </Box>
                        <Box mt="md" style={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            leftIcon={<IconUpload size={16} />}
                            variant="light"
                            onClick={() => {
                              console.log("Subject template button clicked");
                              handleDownloadSubjectsTemplate();
                            }}
                          >
                            Download subjects.xlsx file
                          </Button>
                        </Box>
                      </Stack>
                    </Grid.Col>

                    {/* Step 2: Upload Filled Template */}
                    <Grid.Col span={6}>
                      <Stack spacing="sm">
                        <Box>
                          <Text fw={600} mb={5}>
                            Step 2: Import the subjects.xlsx file
                          </Text>
                          <Text size="sm">
                            Once you've filled in your subject data, drop the file here to create
                            all your subjects at once.
                          </Text>
                        </Box>
                        <Dropzone
                          onDrop={handleSubjectFileImport}
                          onReject={handleFileRejection}
                          maxSize={5 * 1024 * 1024} // 5MB
                          accept={{
                            "application/vnd.ms-excel": [".xls"],
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                              ".xlsx",
                            ],
                          }}
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
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Sample Import Accordion Item */}
            {datasetContainsSamples && (
              <Accordion.Item value="samples">
                <Accordion.Control icon={<IconFlask size={20} color="#74b816" />}>
                  Bulk Import Sample Data from Excel
                </Accordion.Control>
                <Accordion.Panel>
                  <Grid>
                    {/* Step 1: Fill out Template */}
                    <Grid.Col span={6}>
                      <Stack spacing="sm">
                        <Box>
                          <Text fw={600} mb={5}>
                            Step 1: Prepare your samples.xlsx file
                          </Text>
                          <Text size="sm">
                            Fill out the spreadsheet with your sample IDs, parent subjects, and
                            sample types.
                            <br />
                            <br />
                            Need the template? Click below to download it.
                          </Text>
                        </Box>
                        <Box mt="md" style={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            leftIcon={<IconUpload size={16} />}
                            variant="light"
                            onClick={() => {
                              console.log("Sample template button clicked");
                              handleDownloadSamplesTemplate();
                            }}
                          >
                            Get samples.xlsx Template
                          </Button>
                        </Box>
                      </Stack>
                    </Grid.Col>

                    {/* Step 2: Upload Filled Template */}
                    <Grid.Col span={6}>
                      <Stack spacing="sm">
                        <Box>
                          <Text fw={600} mb={5}>
                            Step 2: Import the samples.xlsx file
                          </Text>
                          <Text size="sm">
                            Once you've filled in your sample data, drop the file here to create all
                            your samples at once.
                          </Text>
                        </Box>
                        <Dropzone
                          onDrop={handleSampleFileImport}
                          onReject={handleFileRejection}
                          maxSize={5 * 1024 * 1024} // 5MB
                          accept={{
                            "application/vnd.ms-excel": [".xls"],
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
                              ".xlsx",
                            ],
                          }}
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
                              Drop your samples.xlsx file here
                            </Text>
                            <Text size="xs" c="dimmed" ta="center">
                              Or click to browse your files
                            </Text>
                          </Stack>
                        </Dropzone>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>
        </GuidedModeSection>
      )}

      <GuidedModeSection>
        <Text fw={600} size="lg" mb="md">
          Entity Metadata Editor
        </Text>
        <Grid gutter="lg">
          {/* Entity selection panel */}
          <Grid.Col span={5} style={{ position: "sticky", top: "20px" }}>
            <SodaPaper>
              <Box mb="xs">
                <Text fw={500} size="md">
                  Entity Hierarchy
                </Text>
                <Text size="sm" c="dimmed">
                  Select an entity to edit or use the buttons to add new entities
                </Text>
              </Box>
              <EntityHierarchyRenderer
                allowEntityStructureEditing={true}
                allowEntitySelection={true}
              />
            </SodaPaper>
          </Grid.Col>

          {/* Metadata editing form */}
          <Grid.Col span={7}>
            <EntityMetadataForm />
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityMetadata;
