import React, { useState } from "react";
import { Text, Box, Group, Button, TextInput, ScrollArea, Stack } from "@mantine/core";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
  setActiveEntity,
} from "../../../stores/slices/datasetEntitySelectorSlice";

const DatasetEntityManager = ({ entityType }) => {
  const { datasetEntityObj, activeEntity } = useGlobalStore();
  const [newEntityName, setNewEntityName] = useState("");
  console.log("datasetEntityObj", datasetEntityObj);

  const entityList = Object.keys(datasetEntityObj?.[entityType] || {});

  const handleAddEntity = () => {
    if (newEntityName.trim()) {
      addEntityToEntityList(entityType, newEntityName);
      setNewEntityName("");
    }
  };

  const handleRemoveEntity = (entityName) => {
    removeEntityFromEntityList(entityType, entityName);
  };

  return (
    <Box>
      <Text size="lg" weight={500} mb="md">
        Manage Entities for {entityType}
      </Text>

      <Stack spacing="md">
        {/* Add Entity */}
        <TextInput
          placeholder="Enter new entity name"
          value={newEntityName}
          onChange={(event) => setNewEntityName(event.currentTarget.value)}
          rightSection={
            <Button size="xs" onClick={handleAddEntity}>
              <IconPlus size={16} />
            </Button>
          }
        />

        {/* Entity List */}
        <ScrollArea h={250} type="auto">
          {entityList.map((entityName) => (
            <Group key={entityName} position="apart" mb="xs">
              <Text>{entityName}</Text>
              <Group spacing="xs">
                <Button size="xs" onClick={() => handleSetActiveEntity(entityName)}>
                  Set Active
                </Button>
                <Button size="xs" color="red" onClick={() => handleRemoveEntity(entityName)}>
                  <IconTrash size={16} />
                </Button>
              </Group>
            </Group>
          ))}
        </ScrollArea>
      </Stack>
    </Box>
  );
};

export default DatasetEntityManager;
