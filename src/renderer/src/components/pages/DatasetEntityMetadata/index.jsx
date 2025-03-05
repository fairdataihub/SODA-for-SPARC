import { useMemo, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import {
  IconInfoCircle,
  IconDeviceFloppy,
  IconUser,
  IconFlask,
  IconPin,
  IconClipboard,
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
  Switch,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import EntityHierarchyRenderer from "../../shared/EntityHierarchyRenderer";
import { modifyDatasetEntityForRelativeFilePath } from "../../../stores/slices/datasetEntitySelectorSlice";

// Component for entity metadata form
const EntityMetadataForm = ({ title, entityData, entityType, parentEntityData }) => {
  const [formData, setFormData] = useState({
    experimentalGroup: entityData.experimentalGroup || "",
    sex: entityData.sex || "",
    age: entityData.age || "",
    weight: entityData.weight || "",
    sampleType: entityData.sampleType || "",
    anatomicalLocation: entityData.anatomicalLocation || "",
    equipment: entityData.equipment || "",
    notes: entityData.notes || "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // In a real implementation, this would update the store
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
              value={formData.experimentalGroup}
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
              value={formData.sex}
              onChange={(value) => handleChange("sex", value)}
            />
            <TextInput
              label="Age"
              description="Subject's age"
              placeholder="e.g., 12 weeks"
              value={formData.age}
              onChange={(e) => handleChange("age", e.target.value)}
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
              value={formData.experimentalGroup}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Sample Type"
              description="The type of biological sample"
              placeholder="e.g., Blood, Tissue"
              value={formData.sampleType}
              onChange={(e) => handleChange("sampleType", e.target.value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location this sample was taken from"
              placeholder="e.g., Dorsal root ganglion"
              value={formData.anatomicalLocation}
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
              value={formData.experimentalGroup}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Anatomical Location"
              description="The anatomical location of this site"
              placeholder="e.g., Dorsal root ganglion"
              value={formData.anatomicalLocation}
              onChange={(e) => handleChange("anatomicalLocation", e.target.value)}
            />
            <TextInput
              label="Coordinates"
              description="Stereotaxic or other coordinates"
              placeholder="e.g., X:1.2, Y:3.4, Z:5.6"
              value={formData.coordinates}
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
              value={formData.experimentalGroup}
              onChange={(e) => handleChange("experimentalGroup", e.target.value)}
            />
            <TextInput
              label="Equipment"
              description="Equipment used for this recording/performance"
              placeholder="e.g., Multichannel electrode array"
              value={formData.equipment}
              onChange={(e) => handleChange("equipment", e.target.value)}
            />
            <TextInput
              label="Date"
              description="Date of the recording/performance"
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Paper shadow="sm" radius="md" p="md" withBorder mb="md">
      <Stack spacing="lg">
        <Group position="apart">
          <Group>
            {getEntityIcon()}
            <Title order={4}>{title}</Title>
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
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
        />
      </Stack>
    </Paper>
  );
};

// Renders the appropriate metadata form based on the entity type
const EntityMetadataContainer = ({ selectedHierarchyEntity }) => {
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

  switch (entityType) {
    case "subject":
      return (
        <EntityMetadataForm
          title={`Subject: ${entityData.subjectId}`}
          entityData={entityData}
          entityType="subject"
          parentEntityData={null}
        />
      );

    // Other cases remain unchanged
    case "sample":
      return (
        <EntityMetadataForm
          title={`Sample: ${entityData.sampleId}`}
          entityData={entityData}
          entityType="sample"
          parentEntityData={parentEntityData}
        />
      );

    case "site":
      const siteParentType = parentEntityData.sample ? "sample" : "subject";
      const siteParentId = parentEntityData.sample
        ? parentEntityData.sample.sampleId
        : parentEntityData.subjectId;

      return (
        <EntityMetadataForm
          title={`Site: ${entityData.siteId}`}
          entityData={entityData}
          entityType="site"
          parentEntityData={parentEntityData}
        />
      );

    case "performance":
      const perfParentType = parentEntityData.sample ? "sample" : "subject";
      const perfParentId = parentEntityData.sample
        ? parentEntityData.sample.sampleId
        : parentEntityData.subjectId;

      return (
        <EntityMetadataForm
          title={`Performance: ${entityData.performanceId}`}
          entityData={entityData}
          entityType="performance"
          parentEntityData={parentEntityData}
        />
      );

    default:
      return (
        <Box p="xl">
          <Text size="xl" c="gray" align="center">
            Unknown entity type: {entityType}
          </Text>
        </Box>
      );
  }
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
            <EntityMetadataContainer selectedHierarchyEntity={selectedHierarchyEntity} />
          </Grid.Col>
        </Grid>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetEntityMetadata;
