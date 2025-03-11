import { useMemo } from "react";
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
import {
  getEntityDataFromSelection,
  updateEntityMetadata,
  getEntityMetadataValue,
} from "../../../stores/slices/datasetEntityStructureSlice";

// Component for entity metadata form
const EntityMetadataForm = ({ selectedHierarchyEntity }) => {
  // Handle the case where no entity is selected
  if (!selectedHierarchyEntity) {
    return (
      <Box p="xl">
        <Text size="xl" c="gray" align="center">
          Select an entity from the hierarchy on the left to edit its metadata.
        </Text>
      </Box>
    );
  }

  console.log("Selected entity:", selectedHierarchyEntity);

  // Get entity data using our helper function
  const entityData = getEntityDataFromSelection(selectedHierarchyEntity);
  console.log("Fetched entity data:", entityData);

  // Generate the appropriate title based on entity type with simplified parent references
  const getTitleForEntity = () => {
    const { entityType, entityId, parentSubjectId, parentSampleId } = selectedHierarchyEntity;

    // Handle each entity type
    switch (entityType) {
      case "subject":
        return `Subject: ${entityId}`;

      case "sample":
        return `Sample: ${entityId}${parentSubjectId ? ` (from subject ${parentSubjectId})` : ""}`;

      case "site":
        if (parentSampleId) {
          // Site belongs to a sample
          return `Site: ${entityId} (from sample ${parentSampleId})`;
        } else {
          // Site belongs to a subject
          return `Site: ${entityId} (from subject ${parentSubjectId})`;
        }

      case "performance":
        if (parentSampleId) {
          // Performance belongs to a sample
          return `Performance: ${entityId} (from sample ${parentSampleId})`;
        } else {
          // Performance belongs to a subject
          return `Performance: ${entityId} (from subject ${parentSubjectId})`;
        }

      default:
        return entityId ? `Unknown entity: ${entityId}` : "Unknown entity";
    }
  };

  // Get metadata value using our helper function
  const getMetadataValue = (key) => {
    return getEntityMetadataValue(selectedHierarchyEntity, key, "");
  };

  // Handle metadata changes using our helper function
  const handleChange = (field, value) => {
    updateEntityMetadata(selectedHierarchyEntity, { [field]: value });
  };

  const getEntityIcon = () => {
    // Add reference to selectedHierarchyEntity to access entityType
    const { entityType } = selectedHierarchyEntity;

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
    // Only render if we have entity data
    if (!entityData) {
      return (
        <Box p="md" bg="gray.0">
          <Text c="dimmed">Error: Could not find entity data</Text>
        </Box>
      );
    }

    switch (selectedHierarchyEntity.entityType) {
      case "subject":
        return (
          <Stack spacing="md">
            <TextInput
              label="Experimental Group"
              description="The experimental group this entity belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimentalGroup")}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <Select
              label="Sex"
              description="Subject's biological sex"
              placeholder="Select sex"
              data={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "unknown", label: "Unknown" },
              ]}
              value={getMetadataValue("sex")}
              onChange={(value) => handleChange("sex", value)}
            />
            <TextInput
              label="Age"
              description="Subject's age"
              placeholder="e.g., 12 weeks"
              value={getMetadataValue("age")}
              onChange={(e) => handleChange("age", e.target.value)}
            />
            <NumberInput
              label="Weight"
              description="Subject's weight"
              placeholder="e.g., 250"
              suffix=" g"
              value={getMetadataValue("weight")}
              onChange={(value) => handleChange("weight", value)}
            />
          </Stack>
        );
      case "sample":
        return (
          <Stack spacing="md">
            <TextInput
              label="Experimental Group"
              description="The experimental group this sample belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimentalGroup")}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Sample Type"
              description="The type of biological sample"
              placeholder="e.g., Blood, Tissue"
              value={getMetadataValue("sampleType")}
              onChange={(e) => handleChange("sampleType", e.target.value)}
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
            <TextInput
              label="Experimental Group"
              description="The experimental group this site belongs to"
              placeholder="e.g., Control, Treatment A"
              value={getMetadataValue("experimentalGroup")}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location of this site"
              placeholder="e.g., Dorsal root ganglion"
              value={getMetadataValue("anatomicalLocation")}
              onChange={(e) => handleChange("anatomicalLocation", e.target.value)}
            />
            <TextInput
              label="Coordinates"
              description="Stereotaxic or other coordinates"
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

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
      <Stack spacing="lg">
        <Group position="apart">
          <Group>
            {getEntityIcon()}
            <Title order={4}>{getTitleForEntity()}</Title>
          </Group>
        </Group>

        <Divider my="xs" />

        {/* Entity-specific form fields */}
        {entityData ? (
          renderEntitySpecificFields()
        ) : (
          <Text c="dimmed">Unable to find data for this entity</Text>
        )}
      </Stack>
    </Paper>
  );
};

const DatasetEntityMetadata = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
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
                allowEntityStructureEditing={false}
                allowEntitySelection={true}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={8}>
            <EntityMetadataForm selectedHierarchyEntity={selectedHierarchyEntity} />
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityMetadata;
