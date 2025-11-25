import { Box, Text } from "@mantine/core";
import PropTypes from "prop-types";
import useGlobalStore from "../../../stores/globalStore";

// Simple, standardized configurations
const LIST_CONFIGS = {
  "dataset-entities": {
    title: "Your dataset contains:",
    getItems: (selectedEntities) => [
      "Subjects",
      selectedEntities.includes("samples") && "Samples",
      selectedEntities.includes("sites") && "Sites",
    ],
  },
  "selected-folders": {
    title: "Selected folders:",
    getItems: () => [], // Override this as needed
  },
};

/**
 * InfoList - A simple component for rendering standardized lists by ID
 * @param {Object} props - Component props
 * @param {string} props.id - The ID of the list configuration
 */
const InfoList = ({ id }) => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);

  const config = LIST_CONFIGS[id];

  if (!config) {
    console.warn(`InfoList: No configuration found for id "${id}"`);
    return null;
  }

  // Get items using the configuration function
  const items = config.getItems(selectedEntities);

  // Filter out null/undefined items
  const validItems = items.filter((item) => item != null);

  // Don't render anything if no valid items
  if (validItems.length === 0) {
    return null;
  }

  return (
    <Box mt="md">
      <Text size="sm" fw={500} mb="xs">
        {config.title}
      </Text>
      <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
        {validItems.map((item, index) => (
          <li key={index}>
            <Text size="sm">{item}</Text>
          </li>
        ))}
      </ul>
    </Box>
  );
};

InfoList.propTypes = {
  id: PropTypes.string.isRequired,
};

export default InfoList;
