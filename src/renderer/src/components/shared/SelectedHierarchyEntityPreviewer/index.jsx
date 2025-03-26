import useGlobalStore from "../../../stores/globalStore";
import { Box, Text, Paper, Stack } from "@mantine/core";

const SelectedHierarchyEntityPreviewer = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  console.log("selectedHierarchyEntity", selectedHierarchyEntity);

  if (!selectedHierarchyEntity) {
    console.log("No selectedHierarchyEntity found");
    return null;
  }

  const entityType = selectedHierarchyEntity.type; // Either "subject", "sample", "site", or "performance"
  const entityMetadata = selectedHierarchyEntity.metadata || {};

  const differentiableEntityFields = {
    subject: ["subject id", "experimental group", "sex", "age category"],
    sample: ["sample id", "subject id", "experimental group", "sample type"],
    site: ["site id"],
    performance: ["performanceId"],
  };

  // Get relevant field values from metadata only
  const getRelevantFieldsFromMetadata = () => {
    if (!entityType || !differentiableEntityFields[entityType]) {
      // If no entity type or unknown type, return empty object
      return {};
    }

    const relevantFields = {};

    // Only look in metadata for the fields
    differentiableEntityFields[entityType].forEach((fieldName) => {
      if (entityMetadata && entityMetadata[fieldName] !== undefined) {
        relevantFields[fieldName] = entityMetadata[fieldName];
      }
    });

    return relevantFields;
  };

  const relevantFields = getRelevantFieldsFromMetadata();
  const hasRelevantFields = Object.keys(relevantFields).length > 0;
  const uppercaseFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Box>
      <Paper p="md" withBorder>
        {hasRelevantFields ? (
          <Stack gap={3}>
            {Object.entries(relevantFields).map(([key, value]) => (
              <Box key={key}>
                <Text fw={600} td="underline">
                  {uppercaseFirstLetter(key)}:
                </Text>
                <Text>{typeof value === "object" ? JSON.stringify(value) : value}</Text>
              </Box>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No relevant metadata found for this entity type</Text>
        )}
      </Paper>
    </Box>
  );
};

export default SelectedHierarchyEntityPreviewer;
