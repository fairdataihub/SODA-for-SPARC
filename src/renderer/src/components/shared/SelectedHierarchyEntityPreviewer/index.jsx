import useGlobalStore from "../../../stores/globalStore";
import { Box, Text, Paper, Code } from "@mantine/core";

const SelectedHierarchyEntityPreviewer = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);

  if (!selectedHierarchyEntity) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed">No entity selected</Text>
      </Paper>
    );
  }

  return (
    <Box my="md">
      <Text fw={600} mb="xs">
        Selected Entity Details:
      </Text>
      <Code block>{JSON.stringify(selectedHierarchyEntity, null, 2)}</Code>
    </Box>
  );
};

export default SelectedHierarchyEntityPreviewer;
