import { Box, Text, List } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";

const LIST_CONFIGS = {
  "experimental-data-entity-selection-list": {
    title: "The experimental data you should select includes files pertaining to:",
    getItems: (selectedEntities) =>
      [
        selectedEntities.includes("subjects") &&
          "Subjects: data about the individual subjects in your study, such as measurements or observations.",
        selectedEntities.includes("samples") &&
          "Samples: data from physical samples collected from subjects, like tissue or fluid.",
        (selectedEntities.includes("subjectSites") || selectedEntities.includes("sampleSites")) &&
          "Sites: data from distinct location within a subject or sample, such as electrode placements.",
        selectedEntities.includes("performances") &&
          "Performances: data from experimental subjects taken over multiple sessions or timepoints while using the same experimental protocol (e.g., sequential imaging sessions). ",
      ].filter(Boolean),
  },
  "entity-addition-method-entity-explanation-list": {
    title: "The entities you will need to provided IDs for are:",
    getItems: (selectedEntities) =>
      [
        selectedEntities.includes("subjects") &&
          "Subjects: Each individual (human or animal) participating in your study.",
        selectedEntities.includes("samples") &&
          "Samples: Each physical specimen collected from subjects, such as tissue or fluid samples.",
        selectedEntities.includes("derivedSamples") &&
          "Derived Samples: Additional samples created from samples that were collected directly from subjects.",
        selectedEntities.includes("subjectSites") &&
          "Subject Sites: Each specific anatomical location or extraction point on subjects.",
        selectedEntities.includes("sampleSites") &&
          "Sample Sites: Each specific anatomical location or extraction point on samples.",
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

      <List spacing="xs">
        {items.map((item, index) => (
          <List.Item key={index}>{item}</List.Item>
        ))}
      </List>
    </Box>
  );
};

export default InfoList;
