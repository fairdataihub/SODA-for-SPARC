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
import { updateEntityMetadata } from "../../../stores/slices/datasetEntityStructureSlice";

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

  // Generate the appropriate title based on entity type
  const getTitleForEntity = () => {
    const { id, type, parentSubject, parentSample } = selectedHierarchyEntity;

    switch (type) {
      case "subject":
        return `Subject: ${id}`;
      case "sample":
        return `Sample: ${id}${parentSubject ? ` (from subject ${parentSubject})` : ""}`;
      case "site":
        if (parentSample) {
          return `Site: ${id} (from sample ${parentSample})`;
        } else if (parentSubject) {
          return `Site: ${id} (from subject ${parentSubject})`;
        }
        return `Site: ${id}`;
      case "performance":
        if (parentSample) {
          return `Performance: ${id} (from sample ${parentSample})`;
        } else if (parentSubject) {
          return `Performance: ${id} (from subject ${parentSubject})`;
        }
        return `Performance: ${id}`;
      default:
        return `Unknown entity: ${id}`;
    }
  };

  // Handle metadata changes
  const handleChange = (field, value) => {
    updateEntityMetadata(selectedHierarchyEntity, { [field]: value });
  };

  const getEntityIcon = () => {
    const { type } = selectedHierarchyEntity;

    switch (type) {
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
    const { type, id, metadata } = selectedHierarchyEntity;
    console.log("Rendering form for entity:", selectedHierarchyEntity);
    console.log("Entity id:", id);
    console.log("Entity metadata:", metadata);

    switch (type) {
      case "subject":
        return (
          <Stack spacing="md">
            <TextInput
              label="Experimental Group"
              description="The experimental group this entity belongs to"
              placeholder="e.g., Control, Treatment A"
              value={metadata?.experimentalGroup || ""}
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
              value={metadata?.sex || ""}
              onChange={(value) => handleChange("sex", value)}
            />
            <TextInput
              label="Age"
              description="Subject's age"
              placeholder="e.g., 12 weeks"
              value={metadata?.age || ""}
              onChange={(e) => handleChange("age", e.target.value)}
            />
            <NumberInput
              label="Weight"
              description="Subject's weight"
              placeholder="e.g., 250"
              suffix=" g"
              value={metadata?.weight || ""}
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
              value={metadata?.experimentalGroup || ""}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Sample Type"
              description="The type of biological sample"
              placeholder="e.g., Blood, Tissue"
              value={metadata?.sampleType || ""}
              onChange={(e) => handleChange("sampleType", e.target.value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location this sample was taken from"
              placeholder="e.g., Dorsal root ganglion"
              value={metadata?.anatomicalLocation || ""}
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
              value={metadata?.experimentalGroup || ""}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location of this site"
              placeholder="e.g., Dorsal root ganglion"
              value={metadata?.anatomicalLocation || ""}
              onChange={(e) => handleChange("anatomicalLocation", e.target.value)}
            />
            <TextInput
              label="Coordinates"
              description="Stereotaxic or other coordinates"
              placeholder="e.g., X:1.2, Y:3.4, Z:5.6"
              value={metadata?.coordinates || ""}
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
              value={metadata?.experimentalGroup || ""}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Equipment"
              description="Equipment used for this recording/performance"
              placeholder="e.g., Multichannel electrode array"
              value={metadata?.equipment || ""}
              onChange={(e) => handleChange("equipment", e.target.value)}
            />
            <TextInput
              label="Date"
              description="Date of the recording/performance"
              placeholder="YYYY-MM-DD"
              value={metadata?.date || ""}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </Stack>
        );
      default:
        return (
          <Box p="md" bg="gray.0">
            <Text c="dimmed">Unknown entity type: {type}</Text>
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
        {renderEntitySpecificFields()}
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
