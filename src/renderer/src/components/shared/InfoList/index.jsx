import { Box, Text, List } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const LIST_CONFIGS = {
  "dataset-entities": {
    title: "The experimental data you should select includes:",
    getItems: (selectedEntities) =>
      [
        selectedEntities.includes("subjects") && "Files that describe or belong to your subjects.",
        selectedEntities.includes("samples") && "Files associated with your samples.",
        selectedEntities.includes("sites") &&
          "Files that contain data pertaining to data collected from separate anatomical locations.",
      ].filter(Boolean),
  },
  "selected-folders": {
    title: "Selected folders:",
    getItems: () => [],
  },
};

const InfoList = ({ id }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const config = LIST_CONFIGS[id];

  if (!config) return null;

  const items = config.getItems(selectedEntities);
  if (items.length === 0) return null;

  return (
    <Box>
      <Text fw={500} mb="xs">
        {config.title}
      </Text>

      <List spacing="xs" size="sm">
        {items.map((item, index) => (
          <List.Item key={index}>{item}</List.Item>
        ))}
      </List>
    </Box>
  );
};

export default InfoList;
