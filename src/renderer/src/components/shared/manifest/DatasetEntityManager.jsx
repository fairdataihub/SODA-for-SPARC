import React, { useState } from "react";
import { Text, Button, TextInput, ScrollArea, Stack, Group, ActionIcon, Box } from "@mantine/core";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import FullWidthContainer from "../../containers/FullWidthContainer";

const DatasetEntityManager = ({
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
  entityTypePrefix,
}) => {
  const { datasetEntityObj } = useGlobalStore();
  const [newEntityName, setNewEntityName] = useState("");

  const isNewEntityNameValid = window.evaluateStringAgainstSdsRequirements?.(
    newEntityName,
    "string-adheres-to-identifier-conventions"
  );

  const entityList = Object.keys(datasetEntityObj?.[entityType] || {});

  const handleAddEntity = () => {
    const trimmedName = newEntityName.trim();
    if (trimmedName) {
      const formattedName =
        entityTypePrefix && !trimmedName.startsWith(entityTypePrefix)
          ? `${entityTypePrefix}${trimmedName}`
          : trimmedName;
      addEntityToEntityList(entityType, formattedName);
      setNewEntityName("");
    }
  };

  const handleRemoveEntity = (entityName) => {
    removeEntityFromEntityList(entityType, entityName);
  };

  const handleImportEntitiesFromLocalFoldersClick = () => {
    window.electron.ipcRenderer.send("open-entity-id-import-selector");
  };
  const renderEntityList = () =>
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
    <FullWidthContainer>
      <Stack spacing="xs" mb="md">
        <Group spacing="xs" align="start" width="100%">
          <Button
            size="xs"
            color="blue"
            variant="outline"
            onClick={handleImportEntitiesFromLocalFoldersClick}
          >
            Import {entityTypeStringSingular} IDs from local folders/files
          </Button>
        </Group>
        <Group spacing="xs" align="start" width="100%">
          <TextInput
            flex={1}
            placeholder={`Enter new ${entityTypeStringSingular} name`}
            value={newEntityName}
            onChange={(event) => setNewEntityName(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddEntity();
              }
            }}
            error={
              !isNewEntityNameValid &&
              `${entityTypeStringSingular} does not adhere to identifier conventions.`
            }
          />
          <Button onClick={handleAddEntity} leftIcon={<IconPlus />}>
            Add {entityTypeStringSingular}
          </Button>
        </Group>
      </Stack>

      <ScrollArea height={300} type="auto">
        <Box>{renderEntityList()}</Box>
      </ScrollArea>
    </FullWidthContainer>
  );
};

export default DatasetEntityManager;