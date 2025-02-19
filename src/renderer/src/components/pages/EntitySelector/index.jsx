import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityListContainer from "../../containers/EntityListContainer";
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
  NumberInput,
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

const upperCaseFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const EntitySelectorPage = ({
  pageName,
  entityType,
  entityTypeStringSingular,
  entityTypeStringPlural,
  entityTypePrefix,
}) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  console.log("datasetEntityObj", datasetEntityObj);
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

  const handleImportEntitiesFromLocalFoldersClick = () => {
    window.electron.ipcRenderer.send(
      "open-create-dataset-structure-spreadsheet-path-selection-dialog",
      {
        entityTypeStringSingular,
        entityTypePrefix,
      }
    );
  };

  const renderEntityList = (width) => {
    return entityList.length > 0 ? (
      <Box w={width}>
        {naturalSort(entityList).map((entityName) => (
          <Group
            key={entityName}
            justify="space-between"
            py={4}
            style={{ borderBottom: "1px solid #eaeaea" }}
          >
            <Text>{entityName}</Text>
            <Group gap="xs">
              {/*
              <ActionIcon color="blue">
                <IconEdit size={16} />
              </ActionIcon>*/}
              <ActionIcon
                color="red"
                onClick={() => {
                  removeEntityFromEntityList(entityType, entityName);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
        ))}
      </Box>
    ) : (
      <Text align="center" c="dimmed" px="sm" py="xs">
        No {entityTypeStringPlural} added yet.
      </Text>
    );
  };
  return (
    <GuidedModePage pageHeader={pageName}>
      <GuidedModeSection>
        <Text>
          Every {entityTypeStringSingular} in your dataset must be assigned an unique{" "}
          {entityTypeStringSingular} ID. {upperCaseFirstLetter(entityTypeStringSingular)} IDs can be
          added via the two following methods:
        </Text>

        <Text>
          <b>1. Manual Entry (Recommended if less than 10 {entityTypeStringPlural}):</b> Enter{" "}
          {entityTypeStringSingular} IDs manually by typing them out individually.
        </Text>

        <Text>
          <b>2. Spreadsheet Entry (Recommended for more than 10 {entityTypeStringPlural}):</b>{" "}
          Generate a spreadsheet template to input {entityTypeStringSingular} IDs into and then
          import them in bulk.
        </Text>

        <Text>
          {" "}
          Choose the method you would like to add your {entityTypeStringSingular} IDs below and then
          enter them in.{" "}
        </Text>
        {/*
        <Text>
          <b>
            3. Extract from Folder Names (Recommended for more than 10 {entityTypeStringPlural}):
          </b>{" "}
          Automatically create {entityTypeStringSingular} IDs by extracting them from folder names.
          This method is useful if your data is organized in a way that the folder names contain the
          {entityTypeStringSingular} IDs.
        </Text>*/}
      </GuidedModeSection>
      <GuidedModeSection>
        <Group>
          <Tabs color="indigo" variant="default" value={activeTab} onChange={setActiveTab} w="100%">
            <Tabs.List mb="md" justify="center" grow={1}>
              <Tabs.Tab value="instructions" style={{ display: "none" }}>
                Instructions
              </Tabs.Tab>
              <Tabs.Tab value="manual">Manual Entry</Tabs.Tab>
              <Tabs.Tab value="spreadsheet" disabled>
                Spreadsheet entry
              </Tabs.Tab>
              {/*<Tabs.Tab value="folderSelect">Extract from folder names</Tabs.Tab>*/}
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
                      `${entityTypeStringPlural} IDs can only contain letters, numbers, and hyphens.`
                    }
                  />
                  <Button onClick={handleAddEntity}>Add {entityTypeStringSingular}</Button>
                </Group>
              </Stack>

              <EntityListContainer title={`${entityTypeStringSingular} IDs`}>
                {renderEntityList()}
              </EntityListContainer>
            </Tabs.Panel>

            <Tabs.Panel value="spreadsheet">
              <Group spacing="xs" align="start" flex={1}>
                <EntityListContainer title={`${entityTypeStringSingular} IDs`}>
                  {renderEntityList("300px")}
                </EntityListContainer>
                <Stack flex={1}>
                  <InstructionalTextSection
                    textSectionKey={`${entityTypePrefix}-`}
                    entityTypeStringSingular={entityTypeStringSingular}
                  />
                  <Text>In this section, you will</Text>
                  <TextInput
                    label="Enter the name of the folder containing the files"
                    placeholder="Enter folder name"
                    value={newEntityName}
                    onChange={(event) => setNewEntityName(event.currentTarget.value)}
                    w="100%"
                  />
                  <NumberInput
                    label="Input label"
                    description="Input description"
                    placeholder="Input placeholder"
                  />
                  <Button onClick={handleImportEntitiesFromLocalFoldersClick} mt="lg">
                    asdf
                  </Button>
                </Stack>
              </Group>
            </Tabs.Panel>

            <Tabs.Panel value="folderSelect">
              <Group spacing="xs" align="start" width="100%">
                <EntityListContainer title={`${entityTypeStringSingular} IDs`}>
                  {renderEntityList("300px")}
                </EntityListContainer>

                <DatasetTreeViewRenderer
                  folderActions={{
                    "on-folder-click": async (folderName, folderContents, folderIsSelected) => {
                      const childFolderNames = Object.keys(folderContents.folders);
                      console.log("childFolderNames", childFolderNames);
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
                        `${potentialEntities.length} ${entityTypeStringSingular} IDs detected`,
                        `The following ${entityTypeStringPlural} have been detected in the selected folder. If you select 'Import ${entityTypeStringPlural}', these ${entityTypeStringPlural} will be added to the list of ${entityTypeStringPlural} for this dataset. Do you want to proceed?`,
                        `Import ${entityTypeStringSingular} IDs`,
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
