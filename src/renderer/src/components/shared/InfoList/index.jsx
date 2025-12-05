import { Box, Text, List } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const LIST_CONFIGS = {
  "dataset-entities": {
    title: "The experimental data you should select includes:",
    getItems: (selectedEntities) =>
      [
        selectedEntities.includes("subjects") &&
          "Files that were collected from or describe the subjects in your dataset.",
        selectedEntities.includes("samples") &&
          "Files that were collected from or describe the samples in your dataset.",
        selectedEntities.includes("sites") &&
          "Files that were collected from or describe the anatomical or extraction sites of your samples.",
        selectedEntities.includes("performances") &&
          "Files that were collected from or describe the performances or experimental sessions of your subjects.",
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
