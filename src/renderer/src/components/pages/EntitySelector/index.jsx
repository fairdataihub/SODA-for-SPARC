import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import DropDownNote from "../../utils/ui/DropDownNote";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import {
  TextInput,
  Textarea,
  ActionIcon,
  Text,
  Tabs,
  Stack,
  Group,
  Button,
  ScrollArea,
  Box,
} from "@mantine/core";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../../shared/DatasetTreeViewRenderer";
import InstructionalTextSection from "../../common/InstructionalTextSection";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { naturalSort } from "../../shared/utils/util-functions";
import { swalFileListDoubleAction } from "../../../scripts/utils/swal-utils";

const EntitySelectorPage = ({
  pageName,
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
  entityTypePrefix,
}) => {
  const { datasetEntityObj } = useGlobalStore((state) => ({
    datasetEntityObj: state.datasetEntityObj,
  }));
  const [newEntityName, setNewEntityName] = useState("");
  const [activeTab, setActiveTab] = useState("instructions");

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

  const renderEntityList = (width) => (
    <ScrollArea h={700} type="auto">
      <Box>
        {entityList.length > 0 ? (
          <Stack w={width}>
            {entityList.map((entityName) => (
              <Group
                key={entityName}
                justify="space-between"
                px="sm"
                py="xs"
                style={{ borderBottom: "1px solid #eaeaea" }}
              >
                <Text>{entityName}</Text>
                <Group gap="xs">
                  <ActionIcon color="blue">
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" onClick={() => handleRemoveEntity(entityName)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text align="center" c="dimmed" px="sm" py="xs">
            No {entityTypeStringPlural} added yet.
          </Text>
        )}
      </Box>
    </ScrollArea>
  );
  return (
    <GuidedModePage pageHeader={pageName}>
      <InstructionalTextSection textSectionKey={entityTypePrefix} />
      <GuidedModeSection>
        <Group>
          <Tabs color="indigo" variant="default" value={activeTab} onChange={setActiveTab} w="100%">
            <Tabs.List mb="md" justify="center" grow={1}>
              <Tabs.Tab value="instructions" style={{ display: "none" }}>
                Instructions
              </Tabs.Tab>
              <Tabs.Tab value="manual">manual</Tabs.Tab>
              <Tabs.Tab value="spreadsheet">spreadsheet</Tabs.Tab>
              <Tabs.Tab value="folderSelect">Extract from folder names</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="instructions">
              <Text align="center" c="dimmed" pt="md">
                Select a tab above to begin specifying {entityTypeStringPlural}.
              </Text>
            </Tabs.Panel>
            <Tabs.Panel value="manual">
              <Stack spacing="xs" mb="md">
                <Group spacing="xs" align="start" width="100%">
                  <TextInput
                    flex={1}
                    placeholder={`Enter ${entityTypeStringSingular} name`}
                    value={newEntityName}
                    onChange={(event) => setNewEntityName(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.which === 13) {
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

              {renderEntityList()}
            </Tabs.Panel>

            <Tabs.Panel value="spreadsheet">
              <Group spacing="xs" align="start" width="100%">
                {renderEntityList("300px")}
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
              <Group spacing="xs" align="start" width="100%">
                {renderEntityList("300px")}

                <DatasetTreeViewRenderer
                  folderActions={{
                    "on-folder-click": async (folderName, folderContents, folderIsSelected) => {
                      const childFolderNames = Object.keys(folderContents.folders);
                      const potentialEntities = naturalSort(childFolderNames).map(
                        (childFolderName) => {
                          const formattedName =
                            entityTypePrefix && !childFolderName.startsWith(entityTypePrefix)
                              ? `${entityTypePrefix}${childFolderName}`
                              : childFolderName;
                          return formattedName;
                        }
                      );

                      const continueWithEntityIdImport = await swalFileListDoubleAction(
                        potentialEntities,
                        `Confirm ${entityTypeStringPlural} Import`,
                        `The following ${entityTypeStringPlural} have been detected in the selected folder. If you proceed, they will be added to your list of ${entityTypeStringPlural}:`,
                        `Import Selected ${entityTypeStringPlural}`,
                        `Cancel Import`,
                        ""
                      );

                      if (continueWithEntityIdImport) {
                        for (const entityName of potentialEntities) {
                          addEntityToEntityList(entityType, entityName);
                        }
                      }
                    },
                    "folder-click-hover-text": `Import ${entityTypeStringSingular} IDs from folders in this folder`,
                  }}
                />
              </Group>
            </Tabs.Panel>
          </Tabs>
        </Group>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default EntitySelectorPage;
