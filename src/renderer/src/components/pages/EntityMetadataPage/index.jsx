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
  Space,
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
import { OptionalFieldsNotice } from "./utils";
import DropDownNote from "../../utils/ui/DropDownNote";
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

  const currentSelectedHierarchyEntityParentSubject = useGlobalStore(
    (state) => state.currentSelectedHierarchyEntityParentSubject
  );
  const currentSelectedHierarchyEntityParentSample = useGlobalStore(
    (state) => state.currentSelectedHierarchyEntityParentSample
  );
  const activeFormType = useGlobalStore((state) => state.activeFormType);
  const temporaryEntityMetadata = useGlobalStore((state) => state.temporaryEntityMetadata || {});
  const entityBeingAddedParentSubject = useGlobalStore(
    (state) => state.entityBeingAddedParentSubject
  );
  const entityBeingAddedParentSample = useGlobalStore(
    (state) => state.entityBeingAddedParentSample
  );
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);
  // Define standard prefixes for entity IDs
  const entityPrefixes = {
    subject: "sub-",
    sample: "sam-",
    site: "site-",
    performance: "perf-",
  };

  // Only clear temporary metadata when switching to add mode (not when editing)
  useEffect(() => {
    for (const entityType of ["subject", "sample", "site"]) {
      clearTemporaryMetadata(entityType);
    }
  }, [selectedHierarchyEntity, activeFormType]);

  /**
   * Retrieves formatted metadata value for display in the form
   * Handles special cases like ID prefixes (removing prefixes for edit fields)
   *
   * @param {string} key - Metadata field key to retrieve
   * @returns {string} Formatted value for display
   */
  const getMetadataValue = useCallback(
    (key, defaultValue) => {
      let value = defaultValue;
      // If editing, always show selected entity's value
      if (selectedHierarchyEntity) {
        value = getEntityMetadataValue(selectedHierarchyEntity, key, null, defaultValue);
        if (key === "sex") {
          console.log("Value above:", value);
        }
      } else if (activeFormType) {
        // If adding, show temporary metadata (which is cleared on add mode switch)
        value = getEntityMetadataValue(null, key, activeFormType, defaultValue);
        if (key === "sex") {
          console.log("Value below:", value);
        }
      }
      // Special handling: Strip prefixes from ID fields for display
      if (selectedHierarchyEntity && value && key.endsWith("_id")) {
        const entityType = selectedHierarchyEntity.type;
        const prefix = entityPrefixes[entityType];
        if (prefix && value.startsWith(prefix)) {
          return value.substring(prefix.length);
        }
      }

      if (key === "sex") {
        console.log("Returning value for sex:", value);
        console.log("Type of value:", typeof value);
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
          Click the "Add Subject" button to the left to begin structuring your dataset's entities.
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
        if (!tempMetadata["subject_id"]) {
          window.notyf.open({
            duration: "4000",
            type: "error",
            message: "You must assign this subject an ID.",
          });
          return;
        }

        try {
          addSubject(tempMetadata["subject_id"], tempMetadata);
        } catch (error) {
          window.notyf.open({ duration: "4000", type: "error", message: error.message });
          return;
        }

        clearTemporaryMetadata("subject");
      } else if (activeFormType === "sample") {
        // Create sample entity
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.sample || {};
        addSampleToSubject(entityBeingAddedParentSubject, tempMetadata["sample_id"], tempMetadata);
        clearTemporaryMetadata("sample");
      } else if (activeFormType === "site") {
        // Create site entity
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.site || {};

        // Validate required fields
        if (!tempMetadata["site_id"]) {
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
              tempMetadata["site_id"],
              tempMetadata
            );
          } else if (entityBeingAddedParentSubject) {
            // Site belongs directly to subject
            addSiteToSubject(entityBeingAddedParentSubject, tempMetadata["site_id"], tempMetadata);
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
              required
              value={getMetadataValue("subject_id", "")}
              onChange={(e) => handleChange("subject_id", e.target.value)}
              error={
                getMetadataValue("subject_id", "") &&
                !window.evaluateStringAgainstSdsRequirements(
                  getMetadataValue("subject_id", ""),
                  "string-adheres-to-identifier-conventions"
                )
                  ? "Subject IDs can only contain letters, numbers, and hyphens."
                  : undefined
              }
              leftSection={
                <Text size="sm" c="dimmed" ml="sm">
                  {entityPrefixes["subject"]}
                </Text>
              }
              leftSectionWidth={50}
              readOnly={!!selectedHierarchyEntity}
              disabled={!!selectedHierarchyEntity}
            />
            <OptionalFieldsNotice />

            <Select
              label="Sex"
              description="Subject's biological sex"
              placeholder="Select sex"
              data={["Male", "Female", "Unknown"]}
              value={getMetadataValue("sex", null)}
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
              value={getMetadataValue("age_category", null)}
              onChange={(value) => handleChange("age_category", value)}
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
                  value={getMetadataValue("age_numeric_value", "")}
                  onChange={(value) => handleChange("age_numeric_value", value)}
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
                  value={getMetadataValue("age_unit", null)}
                  onChange={(value) => handleChange("age_unit", value)}
                  defaultValue={"Select unit"}
                />
              </Box>
            </Group>
            <TextInput
              label="Species"
              description="The species of the subject"
              placeholder="e.g., Homo sapiens, Mus musculus"
              value={getMetadataValue("species", "")}
              onChange={(e) => handleChange("species", e.target.value)}
            />
            <TextInput
              label="Strain"
              description="The strain of the subject"
              placeholder="e.g., C57BL/6J"
              value={getMetadataValue("strain", "")}
              onChange={(e) => handleChange("strain", e.target.value)}
            />
            <TextInput
              label="RRID for strain"
              description="Research Resource Identifier for the strain"
              placeholder="e.g., RRID:IMSR_JAX:000664"
              value={getMetadataValue("rrid_for_strain", "")}
              onChange={(e) => handleChange("rrid_for_strain", e.target.value)}
            />
            <TextInput
              label="Subject Experimental Group"
              description="The experimental group this subject belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("subject_experimental_group", "")}
              onChange={(e) => handleChange("subject_experimental_group", e.target.value)}
            />
            {showFullMetadataFormFields && (
              <>
                <TextInput
                  label="Also in dataset"
                  description="Other datasets that include this subject"
                  placeholder="e.g., dataset-1, dataset-2"
                  value={getMetadataValue("also_in_dataset", "")}
                  onChange={(e) => handleChange("also_in_dataset", e.target.value)}
                />
                <TextInput
                  label="Member of"
                  description="Group memberships for this subject"
                  placeholder="e.g., group-1, cohort-A"
                  value={getMetadataValue("member_of", "")}
                  onChange={(e) => handleChange("member_of", e.target.value)}
                />
                <Select
                  label="Metadata only"
                  description="Whether this subject has metadata only"
                  placeholder="Select option"
                  data={["yes", "no"]}
                  value={getMetadataValue("metadata_only", null)}
                  onChange={(value) => handleChange("metadata_only", value)}
                />
                <TextInput
                  label="Laboratory internal id"
                  description="The internal ID used by the laboratory for this subject"
                  placeholder="e.g., LAB-123"
                  value={getMetadataValue("laboratory_internal_id", "")}
                  onChange={(e) => handleChange("laboratory_internal_id", e.target.value)}
                />
                <DateInput
                  value={
                    getMetadataValue("date_of_birth", null)
                      ? new Date(getMetadataValue("date_of_birth", null))
                      : null
                  }
                  onChange={(date) => handleChange("date_of_birth", date)}
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
                    The min and max age range for the subject during the experiment
                  </Text>
                  <Group grow align="flex-start">
                    <NumberInput
                      label="Minimum"
                      placeholder="Min age"
                      value={getMetadataValue("age_range_min_numeric_value", "")}
                      onChange={(value) => handleChange("age_range_min_numeric_value", value)}
                      min={0}
                    />

                    <NumberInput
                      label="Maximum"
                      placeholder="Max age"
                      value={getMetadataValue("age_range_max_numeric_value", "")}
                      onChange={(value) => handleChange("age_range_max_numeric_value", value)}
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
                      value={getMetadataValue("age_range_unit", null)}
                      onChange={(value) => handleChange("age_range_unit", value)}
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
                      value={getMetadataValue("body_mass_numeric_value", "")}
                      onChange={(value) => handleChange("body_mass_numeric_value", value)}
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
                      value={getMetadataValue("body_mass_unit", null)}
                      onChange={(value) => handleChange("body_mass_unit", value)}
                    />
                  </Group>
                </Box>
                {/* Genotype Input */}
                <TextInput
                  label="Genotype"
                  description="The genetic background of the subject"
                  placeholder="e.g., C57BL/6J"
                  value={getMetadataValue("genotype", "")}
                  onChange={(e) => handleChange("genotype", e.target.value)}
                />
                {/* Phenotype Input */}
                <TextInput
                  label="Phenotype"
                  description="The observable characteristics of the subject"
                  placeholder="e.g., Blue eyes"
                  value={getMetadataValue("phenotype", "")}
                  onChange={(e) => handleChange("phenotype", e.target.value)}
                />
                {/* Handedness Input */}
                <Select
                  label="Handedness"
                  description="The subject's handedness (if applicable)"
                  placeholder="Select handedness"
                  data={["Right", "Left"]}
                  value={getMetadataValue("handedness", null)}
                  onChange={(value) => handleChange("handedness", value)}
                />
                {/* Reference Atlas Input */}
                <TextInput
                  label="Reference Atlas"
                  description="The reference atlas used for this subject"
                  placeholder="e.g., Allen Brain Atlas"
                  value={getMetadataValue("reference_atlas", "")}
                  onChange={(e) => handleChange("reference_atlas", e.target.value)}
                />
                <TextInput
                  label="Experimental log file path"
                  description="Path to the experimental log file for this subject"
                  placeholder="e.g., /path/to/log.txt"
                  value={getMetadataValue("experimental_log_file_path", "")}
                  onChange={(e) => handleChange("experimental_log_file_path", e.target.value)}
                />
                <DateInput
                  value={
                    getMetadataValue("experiment_date", null)
                      ? new Date(getMetadataValue("experiment_date", null))
                      : null
                  }
                  onChange={(date) => handleChange("experiment_date", date)}
                  label="Experiment Date"
                  placeholder="MM/DD/YYYY"
                  valueFormat="MM/DD/YYYY"
                  icon={<IconCalendar size={16} />}
                  clearable
                  description="Date of the experiment for this subject"
                />
                <TextInput
                  label="Disease or Disorder"
                  description="Any known disease or disorder affecting the subject"
                  placeholder="e.g., Diabetes"
                  value={getMetadataValue("disease_or_disorder", "")}
                  onChange={(e) => handleChange("disease_or_disorder", e.target.value)}
                />
                {/* Intervention Input */}
                <TextInput
                  label="Intervention"
                  description="Any intervention applied to the subject"
                  placeholder="e.g., Drug treatment"
                  value={getMetadataValue("intervention", "")}
                  onChange={(e) => handleChange("intervention", e.target.value)}
                />
                {/* Disease Model Input */}
                <TextInput
                  label="Disease Model"
                  description="The disease model used for this subject"
                  placeholder="e.g., Alzheimer's model"
                  value={getMetadataValue("disease_model", "")}
                  onChange={(e) => handleChange("disease_model", e.target.value)}
                />
                <TextInput
                  label="Protocol Title"
                  description="Title of the protocol used for this subject"
                  placeholder="e.g., Protocol 1"
                  value={getMetadataValue("protocol_title", "")}
                  onChange={(e) => handleChange("protocol_title", e.target.value)}
                />
                <TextInput
                  label="Protocol URL or DOI"
                  description="URL or DOI of the protocol used for this subject"
                  placeholder="e.g., https://doi.org/10.1234/abcd"
                  value={getMetadataValue("protocol_url_or_doi", "")}
                  onChange={(e) => handleChange("protocol_url_or_doi", e.target.value)}
                />
              </>
            )}
          </Stack>
        );
      case "sample":
        return (
          <Stack spacing="md">
            {currentSelectedHierarchyEntityParentSubject && (
              <TextInput
                label="Subject this sample belongs to"
                disabled
                value={currentSelectedHierarchyEntityParentSubject}
              />
            )}
            <TextInput
              label="Sample Identifier"
              required
              description="Enter a unique identifier for this biological sample."
              placeholder="Enter sample ID"
              value={getMetadataValue("sample_id", "")}
              onChange={(e) => handleChange("sample_id", e.target.value)}
              error={
                getMetadataValue("sample_id", "") &&
                !window.evaluateStringAgainstSdsRequirements(
                  getMetadataValue("sample_id", ""),
                  "string-adheres-to-identifier-conventions"
                )
                  ? "Sample IDs can only contain letters, numbers, and hyphens."
                  : undefined
              }
              leftSection={
                <Text size="sm" c="dimmed" ml="sm">
                  {entityPrefixes["sample"]}
                </Text>
              }
              leftSectionWidth={50}
              readOnly={!!selectedHierarchyEntity}
              disabled={!!selectedHierarchyEntity}
            />
            <OptionalFieldsNotice />
            <TextInput
              label="Sample Experimental Group"
              description="The experimental group this sample belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("sample_experimental_group", "")}
              onChange={(e) => handleChange("sample_experimental_group", e.target.value)}
            />
            <Select
              key={`sample_type-${
                selectedHierarchyEntity ? selectedHierarchyEntity.id : activeFormType
              }`}
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
              value={getMetadataValue("sample_type", null)}
              onChange={(value) => handleChange("sample_type", value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location this sample was taken from"
              placeholder="e.g., Dorsal root ganglion"
              value={getMetadataValue("sample_anatomical_location", "")}
              onChange={(e) => handleChange("sample_anatomical_location", e.target.value)}
            />
            {showFullMetadataFormFields && (
              <>
                <Select
                  key={`was_derived_from-${
                    selectedHierarchyEntity ? selectedHierarchyEntity.id : activeFormType
                  }`}
                  label="Was derived from"
                  description="The entity this sample was derived from"
                  placeholder="Select entity"
                  data={getExistingSamples()
                    .map((sample) => sample.id)
                    .filter((id) => id !== `sam-${getMetadataValue("sample_id", "")}`)}
                  value={getMetadataValue("was_derived_from", "")}
                  onChange={(value) => handleChange("was_derived_from", value)}
                />
                {/* Also in dataset TextInput */}
                <TextInput
                  label="Also in dataset"
                  description="Other datasets that include this sample"
                  placeholder="e.g., dataset-1, dataset-2"
                  value={getMetadataValue("also_in_dataset", "")}
                  onChange={(e) => handleChange("also_in_dataset", e.target.value)}
                />
                <TextInput
                  label="Member of"
                  description="Group or cohort the sample is a member of"
                  placeholder="e.g., group-1, cohort-A"
                  value={getMetadataValue("member_of", "")}
                  onChange={(e) => handleChange("member_of", e.target.value)}
                />
                <Select
                  key={`metadata_only-${
                    selectedHierarchyEntity ? selectedHierarchyEntity.id : activeFormType
                  }`}
                  label="Metadata only"
                  description="Whether this sample is metadata only"
                  placeholder="Select option"
                  data={["yes", "no"]}
                  value={getMetadataValue("metadata_only", null)}
                  onChange={(value) => handleChange("metadata_only", value)}
                />
                <TextInput
                  label="Laboratory internal id"
                  description="The internal ID used by the laboratory for this sample"
                  placeholder="e.g., LAB-123"
                  value={getMetadataValue("laboratory_internal_id", "")}
                  onChange={(e) => handleChange("laboratory_internal_id", e.target.value)}
                />
                <DateInput
                  value={
                    getMetadataValue("date_of_derivation", null)
                      ? new Date(getMetadataValue("date_of_derivation", null))
                      : null
                  }
                  onChange={(date) => handleChange("date_of_derivation", date)}
                  label="Date of Derivation"
                  placeholder="MM/DD/YYYY"
                  valueFormat="MM/DD/YYYY"
                  icon={<IconCalendar size={16} />}
                  clearable
                  description="Date when the sample was derived"
                />
                <TextInput
                  label="Experimental log file path"
                  description="Path to the experimental log file for this sample"
                  placeholder="e.g., /path/to/log.txt"
                  value={getMetadataValue("experimental_log_file_path", "")}
                  onChange={(e) => handleChange("experimental_log_file_path", e.target.value)}
                />
                <TextInput
                  label="Reference Atlas"
                  description="Reference atlas used in the experiment"
                  placeholder="e.g., Allen Brain Atlas"
                  value={getMetadataValue("reference_atlas", "")}
                  onChange={(e) => handleChange("reference_atlas", e.target.value)}
                />
                <TextInput
                  label="Pathology"
                  description="Pathology associated with the sample"
                  placeholder="e.g., Tumor"
                  value={getMetadataValue("pathology", "")}
                  onChange={(e) => handleChange("pathology", e.target.value)}
                />
                <TextInput
                  label="Laterality"
                  description="Laterality of the sample (e.g., left, right, bilateral)"
                  placeholder="e.g., left"
                  value={getMetadataValue("laterality", "")}
                  onChange={(e) => handleChange("laterality", e.target.value)}
                />
                <TextInput
                  label="Cell Type"
                  description="Cell type of the sample"
                  placeholder="e.g., Neuron"
                  value={getMetadataValue("cell_type", "")}
                  onChange={(e) => handleChange("cell_type", e.target.value)}
                />
                <TextInput
                  label="Plane of Section"
                  description="Plane of section of the sample"
                  placeholder="e.g., sagittal"
                  value={getMetadataValue("plane_of_section", "")}
                  onChange={(e) => handleChange("plane_of_section", e.target.value)}
                />
                <TextInput
                  label="Protocol Title"
                  description="Title of the protocol used in the experiment"
                  placeholder="e.g., Protocol 1"
                  value={getMetadataValue("protocol_title", "")}
                  onChange={(e) => handleChange("protocol_title", e.target.value)}
                />
                <TextInput
                  label="Protocol URL or DOI"
                  description="URL or DOI of the protocol used in the experiment"
                  placeholder="e.g., https://doi.org/10.1234/abcd"
                  value={getMetadataValue("protocol_url_or_doi", "")}
                  onChange={(e) => handleChange("protocol_url_or_doi", e.target.value)}
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
                {currentSelectedHierarchyEntityParentSubject && (
                  <TextInput
                    label="Subject this site belongs to"
                    disabled
                    value={currentSelectedHierarchyEntityParentSubject}
                  />
                )}
                {currentSelectedHierarchyEntityParentSample && (
                  <TextInput
                    label="Sample this site belongs to"
                    disabled
                    value={currentSelectedHierarchyEntityParentSample}
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
              required
              value={getMetadataValue("site_id")}
              onChange={(e) => handleChange("site_id", e.target.value)}
              error={
                getMetadataValue("site_id") &&
                !window.evaluateStringAgainstSdsRequirements(
                  getMetadataValue("site_id"),
                  "string-adheres-to-identifier-conventions"
                )
                  ? "Site IDs can only contain letters, numbers, and hyphens."
                  : undefined
              }
              leftSection={
                <Text size="sm" c="dimmed" ml="sm">
                  {entityPrefixes["site"]}
                </Text>
              }
              leftSectionWidth={50}
              readOnly={!!selectedHierarchyEntity}
              disabled={!!selectedHierarchyEntity}
            />
            <OptionalFieldsNotice />
            <TextInput
              label="Site type"
              placeholder="e.g., tissue, cell culture"
              value={getMetadataValue("site_type")}
              onChange={(e) => handleChange("site_type", e.target.value)}
            />
            <TextInput
              label="Laboratory Internal ID"
              placeholder="e.g., 12345"
              value={getMetadataValue("laboratory_internal_id")}
              onChange={(e) => handleChange("laboratory_internal_id", e.target.value)}
            />
            <TextInput
              label="Coordinate System"
              placeholder="e.g., microns, pixels"
              value={getMetadataValue("coordinate_system")}
              onChange={(e) => handleChange("coordinate_system", e.target.value)}
            />
            <TextInput
              label="Coordinate System Position"
              placeholder="e.g., x,y,z"
              value={getMetadataValue("coordinate_system_position")}
              onChange={(e) => handleChange("coordinate_system_position", e.target.value)}
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
        <Group justify="space-between">
          <Group>
            {getEntityIcon()}
            <Title order={4}>
              {selectedHierarchyEntity
                ? `Editing ${selectedHierarchyEntity.type}: ${selectedHierarchyEntity.id}`
                : `Add new ${activeFormType}`}
            </Title>
          </Group>

          <Button color="blue" onClick={handleSave}>
            {selectedHierarchyEntity ? "Save Changes" : `Add ${activeFormType}`}
          </Button>
        </Group>

        <Divider />

        {/* Dynamic form fields based on entity type */}
        {renderEntitySpecificFields()}

        {/* Action buttons */}
        <Group position="right" mt="md">
          <Button variant="outline" color="gray" onClick={handleCancel}>
            Cancel
          </Button>

          <Button color="blue" onClick={handleSave}>
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
  const showFullMetadataFormFields = useGlobalStore((state) => state.showFullMetadataFormFields);
  const generateSelectTextByEntityType = (entityType) => {
    switch (entityType) {
      case "subjects":
        return "Select a subject";
      case "samples":
        return "Select a sample";
      case "sites":
        return "Select a site";
      default:
        return "Select an entity";
    }
  };

  return (
    <GuidedModePage
      pageHeader={
        !showFullMetadataFormFields ? `Dataset Entity Metadata` : `${entityType} Metadata`
      }
    >
      <GuidedModeSection>
        <Text>
          {showFullMetadataFormFields
            ? `Tell us more about the ${entityType} you collected data from in the interface below. `
            : "Use the interface below to describe the entities in your experimental data."}
        </Text>
        {!showFullMetadataFormFields && <DropDownNote id="dataset-entity-management-page" />}
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          {/* Entity selection panel */}
          <Grid.Col span={5} style={{ position: "sticky", top: "20px" }}>
            <EntityListContainer title={generateSelectTextByEntityType(entityType)}>
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
