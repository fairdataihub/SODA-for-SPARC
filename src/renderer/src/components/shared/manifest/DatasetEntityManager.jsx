import React, { useState } from "react";
import { Text, Button, TextInput, ScrollArea, Stack, Group, ActionIcon, Box } from "@mantine/core";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import FullWidthContainer from "../../containers/FullWidthContainer";

const DatasetEntityManager = ({ entityType, entityTypeStringSingular, entityTypeStringPlural }) => {
  const { datasetEntityObj } = useGlobalStore();
  const [newEntityName, setNewEntityName] = useState("");

  const entityList = Object.keys(datasetEntityObj?.[entityType] || {});

  const handleAddEntity = () => {
    if (newEntityName.trim()) {
      addEntityToEntityList(entityType, newEntityName.trim());
      setNewEntityName("");
    }
  };

  const handleRemoveEntity = (entityName) => {
    removeEntityFromEntityList(entityType, entityName);
  };

  const isAddDisabled = !newEntityName.trim();

  const items =
    entityList.length > 0 ? (
      entityList.map((entityName) => (
        <Group
          key={entityName}
          justify="space-between"
          px="sm"
          py="xs"
          style={{ borderBottom: "1px solid #eaeaea" }}
        >
          <Text>{entityName}</Text>
          <Group>
            <ActionIcon color="blue">
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon color="red" onClick={() => handleRemoveEntity(entityName)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
      ))
    ) : (
      <Text align="center" c="dimmed" px="sm" py="xs">
        No {entityTypeStringPlural} added yet.
      </Text>
    );

  return (
    <Box w="500">
      {/* Add Entity */}
      <Stack spacing="xs" mb="md">
        <Group spacing="xs" align="start" w="100%">
          <TextInput
            placeholder={`Enter new ${entityTypeStringSingular} name`}
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.currentTarget.value)}
            error={!newEntityName.trim() && "Name cannot be empty"}
          />
          <Button onClick={handleAddEntity} leftIcon={<IconPlus />}>
            Add {entityTypeStringSingular}
          </Button>
        </Group>
      </Stack>

      {/* Entity List */}
      <ScrollArea h={300} type="auto">
        <Box>{items}</Box>
      </ScrollArea>
    </Box>
  );
};

export default DatasetEntityManager;
