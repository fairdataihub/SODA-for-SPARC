import React, { useState } from "react";
import {
  Text,
  Button,
  TextInput,
  ScrollArea,
  Stack,
  Group,
  ActionIcon,
  Box,
  Tabs,
} from "@mantine/core";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const DatasetEntityManager = ({
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
  entityTypePrefix,
}) => {
  const ENTITY_PREFIXES = ["sub-", "sam-", "perf-"];

  const handleEntityClick = (entity) => setActiveEntity(entity);

  const handleFileClick = (entityType, activeEntity, datasetEntityObj, fileContents) => {
    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      fileContents.relativePath,
      "toggle"
    );
  };

  const handleFolderClick = (
    entityType,
    activeEntity,
    datasetEntityObj,
    folderContents,
    folderWasSelectedBeforeClick
  ) => {
    const action = folderWasSelectedBeforeClick ? "remove" : "add";

    modifyDatasetEntityForRelativeFilePath(
      entityType,
      activeEntity,
      folderContents.relativePath,
      action
    );

    Object.values(folderContents.files).forEach((file) => {
      modifyDatasetEntityForRelativeFilePath(entityType, activeEntity, file.relativePath, action);
    });

    Object.values(folderContents.folders).forEach((subFolder) => {
      handleFolderClick(
        entityType,
        activeEntity,
        datasetEntityObj,
        subFolder,
        folderWasSelectedBeforeClick
      );
    });
  };

  const renderEntityList = (entityType, activeEntity, datasetEntityObj) => {
    if (!datasetEntityObj?.[entityType]) return null;

    return Object.keys(datasetEntityObj[entityType]).map((entity) => {
      const entityItemsCount = datasetEntityObj[entityType][entity].length || 0;
      console.log("entity", entity);
      console.log("activeEntity", activeEntity);
      const isActive = entity === activeEntity;
      console.log("isActive", isActive);

      // Check if search icon should be shown for specific entities
      const showSearchIcon = ENTITY_PREFIXES.some((prefix) => entity.startsWith(prefix));

      return (
        <Box
          key={entity}
          onClick={() => handleEntityClick(entity)}
          p="xs"
          style={{
            width: "100%",
            backgroundColor: isActive ? "#e3f2fd" : "transparent",
            color: isActive ? "#0d47a1" : "#333",
            border: "none",
            borderLeft: `3px solid ${isActive ? "#2196f3" : "transparent"}`,
            cursor: "pointer",
            transition: "background-color 0.2s ease, border-color 0.2s ease",
          }}
        >
          <Group justify="space-between" align="center">
            <Text size="sm">{entity}</Text>
            <Group spacing="xs" align="center">
              <Text size="xs" fw={200}>
                {entityItemsCount}
              </Text>

              {showSearchIcon && (
                <Tooltip label="Search dataset for this entity" zIndex={2999}>
                  <IconSearch
                    size={14}
                    onClick={(event) => {
                      event.stopPropagation(); // Prevent triggering parent `onClick` event
                      if (entity !== activeEntity) {
                        handleEntityClick(entity);
                      }
                      const entityName = entity.substring(entity.indexOf("-") + 1);
                      setDatasetStructureSearchFilter(entityName);
                    }}
                  />
                </Tooltip>
              )}
            </Group>
          </Group>
        </Box>
      );
    });
  };

  return (
    <FullWidthContainer>
      <Tabs color="indigo" variant="pills" defaultValue="gallery">
        <Tabs.List mb="md">
          <Tabs.Tab value="manual">manual</Tabs.Tab>
          <Tabs.Tab value="spreadsheet">spreadsheet</Tabs.Tab>
          <Tabs.Tab value="folderSelect">folderSelect</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="manual">
          <Stack spacing="xs" mb="md">
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
        </Tabs.Panel>

        <Tabs.Panel value="spreadsheet">
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
        </Tabs.Panel>

        <Tabs.Panel value="folderSelect">
          <DatasetTreeViewRenderer
            folderActions={{
              "on-folder-click": (folderName, folderContents, folderIsSelected) => {
                console.log("folderName", folderName);
                console.log("folderContents", folderContents);
                console.log("folderIsSelected", folderIsSelected);
              },
              "is-folder-selected": (folderName, folderContents) => {
                /*
                console.log("folderName", folderName);
                console.log("folderContents", folderContents);
                */
              },
            }}
          />
        </Tabs.Panel>
      </Tabs>
    </FullWidthContainer>
  );
};

export default DatasetEntityManager;
