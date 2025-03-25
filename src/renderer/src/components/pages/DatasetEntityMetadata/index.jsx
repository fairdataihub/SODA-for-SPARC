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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import useGlobalStore from "../../../stores/globalStore";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import SelectedHierarchyEntityPreviewer from "../../shared/SelectedHierarchyEntityPreviewer";
import {
  updateExistingEntityMetadata,
  getEntityMetadataValue, // Now using the correct function name directly
  updateTemporaryMetadata,
  clearTemporaryMetadata,
  setActiveFormType,
} from "../../../stores/slices/datasetEntityStructureSlice";
import { setSelectedHierarchyEntity } from "../../../stores/slices/datasetContentSelectorSlice";
import { addSubject, addSampleToSubject } from "../../../stores/slices/datasetEntityStructureSlice";
import { shallow } from "zustand/shallow";

// Component for entity metadata form
const EntityMetadataForm = () => {
  // Cache of previous values to prevent redundant updates
  const previousValueRef = useRef({});

  // Subscribe to each piece of state individually for more granular control
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

  console.log(
    "Rendering EntityMetadataForm with selectedHierarchyEntity:",
    selectedHierarchyEntity
  );

  // Simple mapping of entity types to their prefixes
  const entityPrefixes = {
    subject: "sub-",
    sample: "sam-",
    site: "site-",
    performance: "perf-",
  };

  // Define getMetadataValue hook with improved dependencies
  const getMetadataValue = useCallback(
    (key) => {
      let value = "";

      if (selectedHierarchyEntity) {
        // Existing entity - get from the entity
        value = getEntityMetadataValue(selectedHierarchyEntity, key);
        console.log(`Getting metadata for key "${key}" from existing entity:`, value);
      } else if (activeFormType) {
        // New entity - get from temporary metadata
        value = getEntityMetadataValue(null, key, activeFormType);
        console.log(`Getting metadata for key "${key}" from temporary entity:`, value);
      }

      // Strip prefixes from ID fields when displaying in the form
      if (selectedHierarchyEntity && value && key.endsWith(" id")) {
        const entityType = selectedHierarchyEntity.type;
        const prefix = entityPrefixes[entityType];

        if (prefix && value.startsWith(prefix)) {
          const strippedValue = value.substring(prefix.length);
          console.log(`Stripping prefix "${prefix}" from ${value} -> ${strippedValue}`);
          return strippedValue;
        }
      }

      return value;
    },
    [selectedHierarchyEntity, activeFormType]
  );

  // Super simple change handler - for all fields
  const handleChange = (field, value) => {
    console.log(`------------------------------------`);
    console.log(`handleChange called for field: "${field}", value: "${value}"`);
    console.log(
      `selectedHierarchyEntity before update:`,
      JSON.stringify(selectedHierarchyEntity?.metadata)
    );

    // Get the entity type we're working with
    const entityType = selectedHierarchyEntity?.type || activeFormType;
    console.log(`Entity type: ${entityType}`);

    // Special handling for ID fields to ensure proper prefix
    let finalValue = value;

    if (field.endsWith(" id")) {
      const prefix = entityPrefixes[entityType];

      // Add prefix if not already present
      if (prefix && !value.startsWith(prefix)) {
        finalValue = `${prefix}${value}`;
        console.log(`Adding prefix "${prefix}" -> "${finalValue}"`);
      } else {
        console.log(`Value already has prefix or no prefix needed: "${finalValue}"`);
      }

      // For existing entities, check if this is actually a change
      if (selectedHierarchyEntity) {
        // Create a unique key for this specific field/entity
        const cacheKey = `${selectedHierarchyEntity.id}-${field}`;

        // If we already processed this exact value, skip the update
        if (previousValueRef.current[cacheKey] === finalValue) {
          console.log(
            `Skipping redundant update! Previous: "${previousValueRef.current[cacheKey]}", Current: "${finalValue}"`
          );
          return;
        }

        // Cache the new value for future comparisons
        previousValueRef.current[cacheKey] = finalValue;
        console.log(`Caching value "${finalValue}" for key "${cacheKey}"`);
      }
    }

    // Actually update the metadata based on if we're editing or creating
    if (selectedHierarchyEntity) {
      console.log(`Updating existing ${entityType} with ID ${selectedHierarchyEntity.id}`);
      console.log(`Field: "${field}", Value: "${finalValue}"`);
      updateExistingEntityMetadata(selectedHierarchyEntity, { [field]: finalValue });

      // Add a small delay and check the entity state again to verify update
      setTimeout(() => {
        const currentState = useGlobalStore.getState();
        const updatedEntity = currentState.selectedHierarchyEntity;
        console.log(`Entity metadata after update:`, JSON.stringify(updatedEntity?.metadata));
      }, 100);
    } else {
      console.log(`Updating temporary ${activeFormType} metadata`);
      console.log(`Field: "${field}", Value: "${finalValue}"`);
      updateTemporaryMetadata(activeFormType, { [field]: finalValue });
    }
    console.log(`------------------------------------`);
  };

  // Now it's safe to return early for the empty state after all hooks are defined
  if (!selectedHierarchyEntity && !activeFormType) {
    return (
      <Box p="xl">
        <Text size="xl" c="gray">
          Select an entity from the hierarchy on the left to edit its metadata.
        </Text>
      </Box>
    );
  }

  // Cancel handler - reset states and return to entity selection view
  const handleCancel = () => {
    if (selectedHierarchyEntity) {
      setSelectedHierarchyEntity(null); // Clear selection to return to entity list
    } else if (activeFormType) {
      clearTemporaryMetadata(activeFormType); // Clear temporary metadata
      setActiveFormType(null); // Clear the active form type
    }
  };

  // Save handler - process the form data to add/update an entity
  const handleSave = () => {
    if (selectedHierarchyEntity) {
      if (activeFormType === "subject") {
        // Make sure the subject ID is not changed
        const newSubjectId = getMetadataValue("subject id");
        console.log("newSubjectId:", newSubjectId);
      }
      setSelectedHierarchyEntity(null);
    } else {
      // For new entities, create the entity with the temporary metadata
      if (activeFormType === "subject") {
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.subject || {};
        console.log("Creating new subject with temporary metadata:", tempMetadata);

        if (!tempMetadata["subject id"]) {
          window.notyf.open({
            duration: "4000",
            type: "error",
            message: "You must assign this subject an ID.",
          });
          return;
        }
        try {
          // Pass the full metadata object to addSubject
          addSubject(tempMetadata["subject id"], tempMetadata);
        } catch (error) {
          window.notyf.open({ duration: "4000", type: "error", message: error.message });
          return;
        }
        clearTemporaryMetadata("subject");
      } else if (activeFormType === "sample") {
        const tempMetadata = useGlobalStore.getState().temporaryEntityMetadata?.sample || {};
        console.log("Adding new sample with metadata:", tempMetadata);
        addSampleToSubject(entityBeingAddedParentSubject, tempMetadata["sample id"], tempMetadata);
        clearTemporaryMetadata("sample");
      }
      // Reset activeFormType to return to entity selection view
      setActiveFormType(null);
    }
  };

  // Get the appropriate icon - use activeFormType instead of selectedHierarchyEntity.type
  const getEntityIcon = () => {
    // Determine which type to use - either from selected entity or active form type
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

  // Render the appropriate form fields based on entity type
  const renderEntitySpecificFields = () => {
    // Use activeFormType if selectedHierarchyEntity is null
    const entityType = selectedHierarchyEntity?.type || activeFormType;

    switch (entityType) {
      case "subject":
        return (
          <Stack spacing="md">
            <TextInput
              label="Subject Identifier"
              description="The subject identifier (prefix 'sub-' will be added automatically)"
              placeholder="Enter subject ID without 'sub-'"
              value={getMetadataValue("subject id")}
              onChange={(e) => handleChange("subject id", e.target.value)}
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
              description="The sample identifier (prefix 'sam-' will be added automatically)"
              placeholder="Enter sample ID without 'sam-'"
              value={getMetadataValue("sample id")}
              onChange={(e) => handleChange("sample id", e.target.value)}
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
            <TextInput
              label="Site Identifier"
              description="The site identifier (prefix 'site-' will be added automatically)"
              placeholder="Enter site ID without 'site-'"
              value={getMetadataValue("site id")}
              onChange={(e) => handleChange("site id", e.target.value)}
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
              description="The performance identifier (prefix 'perf-' will be added automatically)"
              placeholder="Enter performance ID without 'perf-'"
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

  // Update rendering to ensure we always show current values
  return (
    <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
      <Stack spacing="lg">
        <Group position="apart">
          <Group>
            {getEntityIcon()}
            <Title order={4}>
              {selectedHierarchyEntity
                ? `Edit ${selectedHierarchyEntity.type}: ${selectedHierarchyEntity.id}`
                : `Add new ${activeFormType}`}
            </Title>
          </Group>
        </Group>

        <Divider />

        {renderEntitySpecificFields()}

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
    </Paper>
  );
};

const DatasetEntityMetadata = () => {
  return (
    <GuidedModePage pageHeader="Dataset entity metadata">
      <GuidedModeSection>
        <Stack>
          <Text>
            Provide metadata for each entity in your dataset by selecting entities on the left and
            entering their metadata in the form on the right.
          </Text>
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
              <Text size="lg" fw={500} mb="md">
                Select an Entity
              </Text>
              <EntityHierarchyRenderer
                allowEntityStructureEditing={true}
                allowEntitySelection={true}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            <EntityMetadataForm />
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityMetadata;
