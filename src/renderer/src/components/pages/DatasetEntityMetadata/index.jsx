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

// New action for updating entity metadata in the store
const updateEntityMetadata = (entityData, entityType, parentEntityData, metadataUpdates) => {
  // Get the current state
  const state = useGlobalStore.getState();
  const datasetEntityArray = [...state.datasetEntityArray];

  // Find the subject
  const subjectId =
    parentEntityData?.subjectId || (entityType === "subject" ? entityData.subjectId : null);
  if (!subjectId) return;

  const subjectIndex = datasetEntityArray.findIndex((subject) => subject.subjectId === subjectId);
  if (subjectIndex === -1) return;

  // Clone the subject to avoid direct state mutations
  const subject = { ...datasetEntityArray[subjectIndex] };

  // Update metadata based on entity type
  switch (entityType) {
    case "subject":
      // Update subject metadata
      datasetEntityArray[subjectIndex] = {
        ...subject,
        ...metadataUpdates,
      };
      break;

    case "sample":
      // Find and update sample metadata
      if (!subject.samples) return;
      const sampleIndex = subject.samples.findIndex(
        (sample) => sample.sampleId === entityData.sampleId
      );
      if (sampleIndex === -1) return;

      subject.samples = [...subject.samples];
      subject.samples[sampleIndex] = {
        ...subject.samples[sampleIndex],
        ...metadataUpdates,
      };
      datasetEntityArray[subjectIndex] = subject;
      break;

    case "site":
      // Check if site is a subject site or sample site
      if (parentEntityData.sample) {
        // Sample site
        if (!subject.samples) return;
        const sampleIndex = subject.samples.findIndex(
          (sample) => sample.sampleId === parentEntityData.sample.sampleId
        );
        if (sampleIndex === -1) return;

        subject.samples = [...subject.samples];
        const sample = { ...subject.samples[sampleIndex] };

        if (!sample.sites) return;
        const siteIndex = sample.sites.findIndex((site) => site.siteId === entityData.siteId);
        if (siteIndex === -1) return;

        sample.sites = [...sample.sites];
        sample.sites[siteIndex] = {
          ...sample.sites[siteIndex],
          ...metadataUpdates,
        };

        subject.samples[sampleIndex] = sample;
        datasetEntityArray[subjectIndex] = subject;
      } else {
        // Subject site
        if (!subject.subjectSites) return;
        const siteIndex = subject.subjectSites.findIndex(
          (site) => site.siteId === entityData.siteId
        );
        if (siteIndex === -1) return;

        subject.subjectSites = [...subject.subjectSites];
        subject.subjectSites[siteIndex] = {
          ...subject.subjectSites[siteIndex],
          ...metadataUpdates,
        };
        datasetEntityArray[subjectIndex] = subject;
      }
      break;

    case "performance":
      // Check if performance is a subject performance or sample performance
      if (parentEntityData.sample) {
        // Sample performance
        if (!subject.samples) return;
        const sampleIndex = subject.samples.findIndex(
          (sample) => sample.sampleId === parentEntityData.sample.sampleId
        );
        if (sampleIndex === -1) return;

        subject.samples = [...subject.samples];
        const sample = { ...subject.samples[sampleIndex] };

        if (!sample.performances) return;
        const perfIndex = sample.performances.findIndex(
          (perf) => perf.performanceId === entityData.performanceId
        );
        if (perfIndex === -1) return;

        sample.performances = [...sample.performances];
        sample.performances[perfIndex] = {
          ...sample.performances[perfIndex],
          ...metadataUpdates,
        };

        subject.samples[sampleIndex] = sample;
        datasetEntityArray[subjectIndex] = subject;
      } else {
        // Subject performance
        if (!subject.subjectPerformances) return;
        const perfIndex = subject.subjectPerformances.findIndex(
          (perf) => perf.performanceId === entityData.performanceId
        );
        if (perfIndex === -1) return;

        subject.subjectPerformances = [...subject.subjectPerformances];
        subject.subjectPerformances[perfIndex] = {
          ...subject.subjectPerformances[perfIndex],
          ...metadataUpdates,
        };
        datasetEntityArray[subjectIndex] = subject;
      }
      break;

    default:
      return;
  }

  // Update the state in the store
  useGlobalStore.setState({ datasetEntityArray });
};

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

  const { entityData, entityType, parentEntityData } = selectedHierarchyEntity;

  // Generate the appropriate title based on entity type
  const getTitleForEntity = () => {
    switch (entityType) {
      case "subject":
        return `Subject: ${entityData.subjectId}`;
      case "sample":
        return `Sample: ${entityData.sampleId}`;
      case "site":
        return `Site: ${entityData.siteId}`;
      case "performance":
        return `Performance: ${entityData.performanceId}`;
      default:
        return "Unknown Entity";
    }
  };

  const getMetadataValue = (key) => {
    return entityData[key] || "";
  };

  const handleChange = (field, value) => {
    const metadataUpdates = { [field]: value };
    updateEntityMetadata(entityData, entityType, parentEntityData, metadataUpdates);
  };

  const getEntityIcon = () => {
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

  const getBadgeColor = () => {
    switch (entityType) {
      case "subject":
        return "blue";
      case "sample":
        return "green";
      case "site":
        return "red";
      case "performance":
        return "grape";
      default:
        return "gray";
    }
  };

  // Render the appropriate form fields based on entity type
  const renderEntitySpecificFields = () => {
    switch (entityType) {
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
          <Badge color={getBadgeColor()}>{entityType}</Badge>
        </Group>

        <Divider my="xs" />

        {/* Entity-specific form fields */}
        {renderEntitySpecificFields()}

        {/* Notes field for all entity types */}
        <Textarea
          label="Notes"
          description="Additional information about this entity"
          placeholder="Enter any additional notes here"
          minRows={3}
          value={getMetadataValue("notes")}
          onChange={(e) => handleChange("notes", e.target.value)}
        />
      </Stack>
    </Paper>
  );
};

const DatasetEntityMetadata = ({
  pageName = "Dataset Entity Metadata",
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
}) => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  const datasetEntityArray = useGlobalStore((state) => state.datasetEntityArray);

  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Stack>
          <Text>
            Enter metadata for your dataset entities. First, select an entity from the hierarchy on
            the left, then fill out the metadata form for that entity.
          </Text>
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection>
        <Grid gutter="lg">
          <Grid.Col span={4} style={{ position: "sticky", top: "20px" }}>
            <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
              <Text fw={600} mb="md">
                Entity Hierarchy
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
