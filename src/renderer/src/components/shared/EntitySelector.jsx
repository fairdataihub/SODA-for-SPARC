import React from "react";
import { Box, Text, Group, Button, Stack, Divider } from "@mantine/core";
import { IconEye, IconFolderPlus } from "@tabler/icons-react";
import useGlobalStore from "../../stores/globalStore";
import { setEntityFilter } from "../../stores/slices/datasetTreeViewSlice";
import { setActiveEntity } from "../../stores/slices/datasetEntitySelectorSlice";

/**
 * EntitySelector Component
 *
 * Displays a list of entities of a specific type and allows filtering the file view by entity
 */
const EntitySelector = ({ entityType }) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const entityFilterActive = useGlobalStore((state) => state.entityFilterActive);
  const entityFilterName = useGlobalStore((state) => state.entityFilterName);

  const entities =
    datasetEntityObj && datasetEntityObj[entityType]
      ? Object.keys(datasetEntityObj[entityType])
      : [];

  const handleEntitySelect = (entityName) => {
    setActiveEntity(entityName);
  };

  const handleViewFiles = (entityName) => {
    setEntityFilter(entityType, entityName, true);
  };

  if (entities.length === 0) {
    return (
      <Box p="md" style={{ textAlign: "center" }}>
        <Text color="dimmed">No {entityType} entities available</Text>
      </Box>
    );
  }

  return (
    <Stack spacing="xs">
      {entities.map((entityName) => (
        <Box
          key={entityName}
          p="sm"
          style={{
            borderRadius: "4px",
            border: "1px solid #e9ecef",
            backgroundColor: activeEntity === entityName ? "#e7f5ff" : "white",
          }}
        >
          <Group position="apart">
            <Text weight={500}>{entityName}</Text>
            <Button
              variant={entityFilterActive && entityFilterName === entityName ? "filled" : "subtle"}
              size="xs"
              leftIcon={<IconEye size={14} />}
              onClick={() => handleViewFiles(entityName)}
            >
              {entityFilterActive && entityFilterName === entityName ? "Viewing" : "View Files"}
            </Button>
          </Group>

          <Divider my="xs" />

          <Group position="apart">
            <Text size="sm" color="dimmed">
              {Object.keys(datasetEntityObj[entityType][entityName] || {}).length} files
            </Text>
            <Button
              variant="outline"
              size="xs"
              leftIcon={<IconFolderPlus size={14} />}
              onClick={() => handleEntitySelect(entityName)}
            >
              Manage
            </Button>
          </Group>
        </Box>
      ))}
    </Stack>
  );
};

export default EntitySelector;
