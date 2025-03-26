import useGlobalStore from "../../../stores/globalStore";
import { Box, Text, Paper, Stack, Group, Badge } from "@mantine/core";

const SelectedHierarchyEntityPreviewer = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);

  if (!selectedHierarchyEntity) {
    return null;
  }

  const entityType = selectedHierarchyEntity.type; // Either "subject", "sample", "site", or "performance"
  const entityMetadata = selectedHierarchyEntity.metadata || {};

  // Map entity types to colors
  const entityTypeColors = {
    subject: "blue",
    sample: "green",
    site: "red",
    performance: "violet",
  };

  const differentiableEntityFields = {
    subject: ["subject id", "experimental group", "sex", "age category"],
    sample: ["sample id", "subject id", "experimental group", "sample type"],
    site: ["site id"],
    performance: ["performance id"],
  };

  // Get relevant field values from metadata only
  const getRelevantFieldsFromMetadata = () => {
    if (!entityType || !differentiableEntityFields[entityType]) {
      return {};
    }

    const relevantFields = {};
    differentiableEntityFields[entityType].forEach((fieldName) => {
      if (entityMetadata && entityMetadata[fieldName] !== undefined) {
        relevantFields[fieldName] = entityMetadata[fieldName];
      }
    });

    return relevantFields;
  };

  const relevantFields = getRelevantFieldsFromMetadata();
  const hasRelevantFields = Object.keys(relevantFields).length > 0;
  const formatFieldName = (str) =>
    str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  return (
    <Paper p="sm">
      <Stack gap="sm">
        {hasRelevantFields ? (
          <Box>
            {Object.entries(relevantFields).map(([key, value]) => (
              <Group key={key} py="xs" position="apart" style={{ borderBottom: "1px solid #eee" }}>
                <Text fw={500} size="sm" c="dimmed">
                  {formatFieldName(key)}:
                </Text>
                <Text size="sm">{typeof value === "object" ? JSON.stringify(value) : value}</Text>
              </Group>
            ))}
          </Box>
        ) : (
          <Box py="sm">
            <Text c="dimmed" size="sm" ta="center">
              No metadata available
            </Text>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default SelectedHierarchyEntityPreviewer;
