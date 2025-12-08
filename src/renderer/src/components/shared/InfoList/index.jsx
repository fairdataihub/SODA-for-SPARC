import { Box, Text, List } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const LIST_CONFIGS = {
  "dataset-entities": {
    title: "The experimental data you should select includes files pertaining to:",
    getItems: (selectedEntities) =>
      [
        selectedEntities.includes("subjects") &&
          "Subjects: data about the individual subjects in your study, such as measurements or observations.",
        selectedEntities.includes("samples") &&
          "Samples: data from physical samples collected from subjects, like tissue or fluid.",
        selectedEntities.includes("sites") &&
          "Sites: data describing the anatomical locations or extraction points of samples.",
        selectedEntities.includes("performances") &&
          "Performances: data from experimental sessions or tasks performed by subjects, including recorded outcomes.",
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
