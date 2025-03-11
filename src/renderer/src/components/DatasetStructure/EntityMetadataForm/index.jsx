import React from "react";
import { Box, Title, Text } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import { getEntityMetadataValue } from "../../../stores/slices/datasetEntityStructureSlice";

// This function needs to work with the simplified parent references
const getTitleForEntity = (selectedEntity) => {
  // First, check if there's a selected entity at all
  if (!selectedEntity) return "No entity selected";

  const { entityType, entityId, parentSubjectId, parentSampleId } = selectedEntity;

  // Handle each entity type
  switch (entityType) {
    case "subject":
      return `Subject: ${entityId}`;

    case "sample":
      return `Sample: ${entityId}${parentSubjectId ? ` (from subject ${parentSubjectId})` : ""}`;

    case "site":
      if (parentSampleId) {
        // Site belongs to a sample
        return `Site: ${entityId} (from sample ${parentSampleId})`;
      } else {
        // Site belongs to a subject
        return `Site: ${entityId} (from subject ${parentSubjectId})`;
      }

    case "performance":
      if (parentSampleId) {
        // Performance belongs to a sample
        return `Performance: ${entityId} (from sample ${parentSampleId})`;
      } else {
        // Performance belongs to a subject
        return `Performance: ${entityId} (from subject ${parentSubjectId})`;
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
