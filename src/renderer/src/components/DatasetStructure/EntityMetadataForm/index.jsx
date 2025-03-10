import React from "react";
import { Box, Title } from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore"; // Fix import path

// This function needs to work with the flattened entity structure
const getTitleForEntity = (selectedEntity) => {
  // First, check if there's a selected entity at all
  if (!selectedEntity) return "No entity selected";

  const { entityType, entityId, parentId, grandParentId } = selectedEntity;

  // Handle each entity type
  switch (entityType) {
    case "subject":
      return `Subject: ${entityId}`;

    case "sample":
      return `Sample: ${entityId}${parentId ? ` (from subject ${parentId})` : ""}`;

    case "site":
      if (grandParentId) {
        // Site belongs to a sample
        return `Site: ${entityId}${parentId ? ` (from sample ${parentId})` : ""}`;
      } else {
        // Site belongs to a subject
        return `Site: ${entityId}${parentId ? ` (from subject ${parentId})` : ""}`;
      }

    case "performance":
      if (grandParentId) {
        // Performance belongs to a sample
        return `Performance: ${entityId}${parentId ? ` (from sample ${parentId})` : ""}`;
      } else {
        // Performance belongs to a subject
        return `Performance: ${entityId}${parentId ? ` (from subject ${parentId})` : ""}`;
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
        </Box>
      )}
    </Box>
  );
};

export default EntityMetadataForm;
