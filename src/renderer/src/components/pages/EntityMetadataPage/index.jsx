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
import { IconCalendar } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import useGlobalStore from "../../../stores/globalStore";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import EntityListContainer from "../../containers/EntityListContainer";
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
import { getExistingSamples } from "../../../stores/slices/datasetEntityStructureSlice";
import InstructionsTowardsLeftContainer from "../../utils/ui/InstructionsTowardsLeftContainer";

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
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);
  console.log("showFullMetadataFormFields", showFullMetadataFormFields);

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
      <InstructionsTowardsLeftContainer>
        <Text fw={500}>
          Click the "Add Subject" button to the left to begin structuring and your dataset's
          entities.
        </Text>
      </InstructionsTowardsLeftContainer>
    );
  }

  // Show a message when no entity is selected or being created
  if (!selectedHierarchyEntity && !activeFormType) {
    return (
      <InstructionsTowardsLeftContainer>
        <Text fw={500}>
          {showFullMetadataFormFields
            ? "Select a sample from the list on the left to edit its metadata."
            : "Select an entity from the hierarchy on the left to edit its metadata or click an entity addition button to add a new entity."}
        </Text>
      </InstructionsTowardsLeftContainer>
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
            />{" "}
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
                  value={getMetadataValue("age")}
                  onChange={(value) => handleChange("age", value)}
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
                  value={getMetadataValue("age unit")}
                  onChange={(value) => handleChange("age unit", value)}
                  defaultValue={"Select unit"}
                />
              </Box>
            </Group>
            <TextInput
              label="Species"
              description="The species of the subject"
              placeholder="e.g., Homo sapiens, Mus musculus"
              value={getMetadataValue("species")}
              onChange={(e) => handleChange("species", e.target.value)}
            />
            <TextInput
              label="Strain"
              description="The strain of the subject"
              placeholder="e.g., C57BL/6J"
              value={getMetadataValue("strain")}
              onChange={(e) => handleChange("strain", e.target.value)}
            />
            <TextInput
              label="RRID for strain"
              description="Research Resource Identifier for the strain"
              placeholder="e.g., RRID:IMSR_JAX:000664"
              value={getMetadataValue("RRID for strain")}
              onChange={(e) => handleChange("RRID for strain", e.target.value)}
            />
            <TextInput
              label="Subject Experimental Group"
              description="The experimental group this subject belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("subject experimental group")}
              onChange={(e) => handleChange("subject experimental group", e.target.value)}
            />
            {showFullMetadataFormFields && (
              <>
                <TextInput
                  label="Also in dataset"
                  description="Other datasets that include this subject"
                  placeholder="e.g., dataset-1, dataset-2"
                  value={getMetadataValue("also in dataset")}
                  onChange={(e) => handleChange("also in dataset", e.target.value)}
                />
                <TextInput
                  label="Member of"
                  description="Group memberships for this subject"
                  placeholder="e.g., group-1, cohort-A"
                  value={getMetadataValue("member of")}
                  onChange={(e) => handleChange("member of", e.target.value)}
                />
                <Select
                  label="Metadata only"
                  description="Whether this subject has metadata only"
                  placeholder="Select option"
                  data={["yes", "no"]}
                  value={getMetadataValue("metadata only")}
                  onChange={(value) => handleChange("metadata only", value)}
                />
                <TextInput
                  label="Laboratory internal id"
                  description="The internal ID used by the laboratory for this subject"
                  placeholder="e.g., LAB-123"
                  value={getMetadataValue("laboratory internal id")}
                  onChange={(e) => handleChange("laboratory internal id", e.target.value)}
                />
                <DateInput
                  value={
                    getMetadataValue("date of birth")
                      ? new Date(getMetadataValue("date of birth"))
                      : null
                  }
                  onChange={(date) => handleChange("date of birth", date)}
                  label="Date of Birth"
                  placeholder="MM/DD/YYYY"
                  valueFormat="MM/DD/YYYY"
                  icon={<IconCalendar size={16} />}
                  clearable
                  description="The subject's date of birth, if known"
                />

                {/* Age Range Input */}
                <Box>
                  <Text size="sm" fw={500} mb={3}>
                    Age Range
                  </Text>
                  <Text size="xs" c="dimmed" mb={5}>
                    Specify the minimum and maximum age range for the subject
                  </Text>
                  <Group grow align="flex-start">
                    <NumberInput
                      label="Minimum"
                      placeholder="Min age"
                      value={getMetadataValue("age range (min)")}
                      onChange={(value) => handleChange("age range (min)", value)}
                      min={0}
                    />

                    <NumberInput
                      label="Maximum"
                      placeholder="Max age"
                      value={getMetadataValue("age range (max)")}
                      onChange={(value) => handleChange("age range (max)", value)}
                      min={0}
                    />

                    <Select
                      label="Select unit"
                      placeholder="Select unit"
                      data={[
                        { value: "hours", label: "Hours" },
                        { value: "days", label: "Days" },
                        { value: "weeks", label: "Weeks" },
                        { value: "months", label: "Months" },
                        { value: "years", label: "Years" },
                      ]}
                      value={getMetadataValue("age range unit")}
                      onChange={(value) => handleChange("age range unit", value)}
                    />
                  </Group>
                </Box>

                {/* Body Mass Input */}
                <Box>
                  <Text size="sm" fw={500} mb={3}>
                    Body Mass
                  </Text>
                  <Text size="xs" c="dimmed" mb={5}>
                    The subject's body mass measurement
                  </Text>
                  <Group grow>
                    <NumberInput
                      label="Mass value"
                      placeholder="Enter mass"
                      value={getMetadataValue("body mass")}
                      onChange={(value) => handleChange("body mass", value)}
                      min={0}
                      precision={3}
                    />
                    <Select
                      label="Mass unit"
                      placeholder="Select unit"
                      data={[
                        { value: "mg", label: "milligrams (mg)" },
                        { value: "g", label: "grams (g)" },
                        { value: "kg", label: "kilograms (kg)" },
                        { value: "lb", label: "pounds (lb)" },
                      ]}
                      value={getMetadataValue("body mass unit")}
                      onChange={(value) => handleChange("body mass unit", value)}
                    />
                  </Group>
                </Box>
                {/* Genotype Input */}
                <TextInput
                  label="Genotype"
                  description="The genetic background of the subject"
                  placeholder="e.g., C57BL/6J"
                  value={getMetadataValue("genotype")}
                  onChange={(e) => handleChange("genotype", e.target.value)}
                />
                {/* Phenotype Input */}
                <TextInput
                  label="Phenotype"
                  description="The observable characteristics of the subject"
                  placeholder="e.g., Blue eyes"
                  value={getMetadataValue("phenotype")}
                  onChange={(e) => handleChange("phenotype", e.target.value)}
                />
                {/* Handedness Input */}
                <Select
                  label="Handedness"
                  description="The subject's handedness (if applicable)"
                  placeholder="Select handedness"
                  data={["Right", "Left"]}
                  value={getMetadataValue("handedness")}
                  onChange={(value) => handleChange("handedness", value)}
                />
                {/* Reference Atlas Input */}
                <TextInput
                  label="Reference Atlas"
                  description="The reference atlas used for this subject"
                  placeholder="e.g., Allen Brain Atlas"
                  value={getMetadataValue("reference atlas")}
                  onChange={(e) => handleChange("reference atlas", e.target.value)}
                />
                {/* Experimental log file path Input */}
                <TextInput
                  label="Experimental Log File Path"
                  description="Path to the experimental log file for this subject"
                  placeholder="e.g., /path/to/log.txt"
                  value={getMetadataValue("experimental log file path")}
                  onChange={(e) => handleChange("experimental log file path", e.target.value)}
                />
                {/* Experiment Date Input */}
                <DateInput
                  value={
                    getMetadataValue("experiment date")
                      ? new Date(getMetadataValue("experiment date"))
                      : null
                  }
                  onChange={(date) => handleChange("experiment date", date)}
                  label="Experiment Date"
                  placeholder="MM/DD/YYYY"
                  valueFormat="MM/DD/YYYY"
                  icon={<IconCalendar size={16} />}
                  clearable
                  description="Date of the experiment for this subject"
                />
                {/* Disease or disorder Input */}
                <TextInput
                  label="Disease or Disorder"
                  description="Any known disease or disorder affecting the subject"
                  placeholder="e.g., Diabetes"
                  value={getMetadataValue("disease or disorder")}
                  onChange={(e) => handleChange("disease or disorder", e.target.value)}
                />
                {/* Intervention Input */}
                <TextInput
                  label="Intervention"
                  description="Any intervention applied to the subject"
                  placeholder="e.g., Drug treatment"
                  value={getMetadataValue("intervention")}
                  onChange={(e) => handleChange("intervention", e.target.value)}
                />
                {/* Disease Model Input */}
                <TextInput
                  label="Disease Model"
                  description="The disease model used for this subject"
                  placeholder="e.g., Alzheimer's model"
                  value={getMetadataValue("disease model")}
                  onChange={(e) => handleChange("disease model", e.target.value)}
                />
                {/* Protocol Title Input */}
                <TextInput
                  label="Protocol Title"
                  description="Title of the protocol used for this subject"
                  placeholder="e.g., Protocol 1"
                  value={getMetadataValue("protocol title")}
                  onChange={(e) => handleChange("protocol title", e.target.value)}
                />
                {/* Protocol URL or DOI Input */}
                <TextInput
                  label="Protocol URL or DOI"
                  description="URL or DOI of the protocol used for this subject"
                  placeholder="e.g., https://doi.org/10.1234/abcd"
                  value={getMetadataValue("protocol url or doi")}
                  onChange={(e) => handleChange("protocol url or doi", e.target.value)}
                />
              </>
            )}
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
              value={getMetadataValue("sample anatomical location")}
              onChange={(e) => handleChange("sample anatomical location", e.target.value)}
            />
            {showFullMetadataFormFields && (
              <>
                {/* was derived from Select */}
                <Select
                  label="Was derived from"
                  description="The entity this sample was derived from"
                  placeholder="Select entity"
                  data={getExistingSamples()
                    .map((sample) => sample.id)
                    .filter((id) => id !== `sam-${getMetadataValue("sample id")}`)}
                  value={getMetadataValue("was derived from")}
                  onChange={(value) => handleChange("was derived from", value)}
                />
                {/* Also in dataset TextInput */}
                <TextInput
                  label="Also in dataset"
                  description="Other datasets that include this sample"
                  placeholder="e.g., dataset-1, dataset-2"
                  value={getMetadataValue("also in dataset")}
                  onChange={(e) => handleChange("also in dataset", e.target.value)}
                />
              </>
            )}
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
 * EntityMetadataPage Page Component
 *
 * Main page for dataset entity metadata management.
 * Provides entity selection and metadata editing interface.
 */
const EntityMetadataPage = ({ entityType }) => {
  console.log("entityType", entityType);
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);

  return (
    <GuidedModePage pageHeader="Dataset entity metadata">
      <GuidedModeSection>
        <Text>
          {showFullMetadataFormFields
            ? `Tell us more about the ${entityType} you collected data from in the interface below. If your ${entityType} have
            a lot of overlapping metadata, you can use the copy metadata button to copy metadata between ${entityType}.`
            : "Use the interface below to describe the structure of the data that was collected during your study."}
        </Text>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          {/* Entity selection panel */}
          <Grid.Col span={5} style={{ position: "sticky", top: "20px" }}>
            <EntityListContainer title={`Select a ${entityType}`}>
              <EntityHierarchyRenderer
                allowEntityStructureEditing={true}
                allowEntitySelection={true}
                onlyRenderEntityType={entityType}
              />
            </EntityListContainer>
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

export default EntityMetadataPage;
