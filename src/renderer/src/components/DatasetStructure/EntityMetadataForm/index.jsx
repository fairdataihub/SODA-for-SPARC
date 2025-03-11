import React from "react";
import { Box, Title, Text } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { getEntityMetadataValue } from "../../../stores/slices/datasetEntityStructureSlice";

// This function needs to work with the flattened entity structure with explicit parent references
const getTitleForEntity = (selectedEntity) => {
  // First, check if there's a selected entity at all
  if (!selectedEntity) return "No entity selected";

  const { entityType, entityId, parentSubject, parentSample } = selectedEntity;

  // Handle each entity type
  switch (entityType) {
    case "subject":
      return `Subject: ${entityId}`;

    case "sample":
      return `Sample: ${entityId}${parentSubject ? ` (from subject ${parentSubject})` : ""}`;

    case "site":
      if (parentSample) {
        // Site belongs to a sample
        return `Site: ${entityId}${parentSample ? ` (from sample ${parentSample})` : ""}`;
      } else {
        // Site belongs to a subject
        return `Site: ${entityId}${parentSubject ? ` (from subject ${parentSubject})` : ""}`;
      }

    case "performance":
      if (parentSample) {
        // Performance belongs to a sample
        return `Performance: ${entityId}${parentSample ? ` (from sample ${parentSample})` : ""}`;
      } else {
        // Performance belongs to a subject
        return `Performance: ${entityId}${parentSubject ? ` (from subject ${parentSubject})` : ""}`;
      }

    default:
      return entityId ? `Unknown entity: ${entityId}` : "Unknown entity";
  }
};

const EntityMetadataForm = () => {
  const selectedHierarchyEntity = useGlobalStore((state) => state.selectedHierarchyEntity);
  console.log("Selected entity:", selectedHierarchyEntity);

  return (
    <Box>
      <Title order={4}>{getTitleForEntity(selectedHierarchyEntity)}</Title>
      {/* Form elements would go here */}
      {/* Only render form elements if an entity is selected */}
      {selectedHierarchyEntity && (
        <Box mt="md">
          {/* Your form fields would go here */}
          <Text>Entity ID: {selectedHierarchyEntity.entityId}</Text>
          {/* Example of using metadata value */}
          <Text>
            Experimental Group:{" "}
            {getEntityMetadataValue(selectedHierarchyEntity, "experimentalGroup", "N/A")}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default EntityMetadataForm;
