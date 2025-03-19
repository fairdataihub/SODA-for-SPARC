import { useMemo, useCallback } from "react";
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
import SelectedHierarchyEntityPreviewer from "../../shared/SelectedHierarchyEntityPreviewer";
import {
  getEntityDataFromSelection,
  updateEntityMetadata,
  getEntityMetadataValue,
} from "../../../stores/slices/datasetEntityStructureSlice";

// Component for entity metadata form
const EntityMetadataForm = ({ selectedHierarchyEntity }) => {
  // Subscribe to datasetEntityArray changes for re-rendering
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  // Get the current entity data with all its metadata
  const currentEntityData = useMemo(() => {
    if (!selectedHierarchyEntity) return null;

    const { id, type, parentSubject } = selectedHierarchyEntity;

    if (type === "subject") {
      return datasetEntityArray.find((s) => s.id === id);
    } else if (type === "sample") {
      const subject = datasetEntityArray.find((s) => s.id === parentSubject);
      return subject?.samples?.find((s) => s.id === id);
    }
    // Handle other entity types...

    return null;
  }, [selectedHierarchyEntity, datasetEntityArray]);

  // Function to get metadata value, now using the subscribed data
  const getMetadataValue = useCallback(
    (key) => {
      return currentEntityData?.metadata && currentEntityData.metadata[key] !== undefined
        ? currentEntityData.metadata[key]
        : "";
    },
    [currentEntityData]
  );

  // Handle the case where no entity is selected
  if (!selectedHierarchyEntity) {
    return (
      <Box p="xl">
        <Text size="xl" c="gray">
          Select an entity from the hierarchy on the left to edit its metadata.
        </Text>
      </Box>
    );
  }

  console.log("Selected entity:", selectedHierarchyEntity);

  // Enhanced change handler that forces proper updates
  const handleChange = (field, value) => {
    console.log("Changing field:", field, "to value:", value);
    updateEntityMetadata(selectedHierarchyEntity, { [field]: value });
    // No need for the force update, React will re-render due to our subscription
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
    const { type, id } = selectedHierarchyEntity;
    console.log("Rendering form for entity:", selectedHierarchyEntity);
    console.log("Entity id:", id);

    switch (type) {
      case "subject":
        return (
          <Stack spacing="md">
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
            <Title order={4}>{selectedHierarchyEntity.id}</Title>
          </Group>
        </Group>

        <Divider />

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
