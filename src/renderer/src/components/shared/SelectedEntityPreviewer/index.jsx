import useGlobalStore from "../../../stores/globalStore";
import { Box, Text, Paper, Group, Stack } from "@mantine/core";
import { getEntityDataById } from "../../../stores/slices/datasetEntityStructureSlice";
const SelectedEntityPreviewer = () => {
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  if (!activeEntity) {
    return null;
  }
  const activeEntityData = getEntityDataById(activeEntity);
  console.log("activeEntityData", activeEntityData);
  if (!activeEntityData) {
    return null;
  }

  const differentiableEntityFields = [
    "subject_id",
    "experimental group",
    "sex",
    "age category",
    "sample_id",
    "sample type",
    "site_id",
    "performanceId",
    "protocolUrl",
    "startDateTime",
    "endDateTime",
  ];

  // Get relevant field values from metadata only
  const getRelevantFieldsFromMetadata = () => {
    const relevantFields = {};

    // Only look in metadata for the fields
    differentiableEntityFields.forEach((fieldName) => {
      if (activeEntityData?.["metadata"]?.[fieldName] !== undefined) {
        relevantFields[fieldName] = activeEntityData["metadata"][fieldName];
      }
    });

    return relevantFields;
  };

  const relevantFields = getRelevantFieldsFromMetadata();
  const hasRelevantFields = Object.keys(relevantFields).length > 0;
  const uppercaseFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  if (!hasRelevantFields) {
    return null;
  }

  return (
    <Paper px="md" pb="md" withBorder mt="xs">
      <Text fw={600} mb={5} mt="sm">
        Overview of {activeEntity}:
      </Text>
      <Stack gap={3}>
        {Object.entries(relevantFields).map(([key, value]) => (
          <Group key={key}>
            <Text fw={600} miw={100}>
              {uppercaseFirstLetter(key)}:
            </Text>
            <Text>{typeof value === "object" ? JSON.stringify(value) : value}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
};

export default SelectedEntityPreviewer;
