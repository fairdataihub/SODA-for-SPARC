import { useState, useEffect, useRef } from "react";
import {
  Collapse,
  Text,
  Stack,
  Group,
  Tooltip,
  Paper,
  Checkbox,
  TextInput,
  Space,
  Center,
  Button,
  Loader,
  Badge,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconSearch,
  IconBrandPython,
  IconFileText,
  IconFileTypeHtml,
  IconJson,
  IconFileTypeCsv,
  IconFileTypeJs,
  IconFileTypeCss,
  IconFileTypePdf,
  IconFileTypeZip,
  IconFileTypeSvg,
  IconFileTypeJpg,
  IconFileTypePng,
} from "@tabler/icons-react";

import useGlobalStore from "../../../stores/globalStore";
import ContextMenu from "./ContextMenu";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import {
  setDatasetStructureSearchFilter,
  openContextMenu,
} from "../../../stores/slices/datasetTreeViewSlice";

import { useDebouncedValue } from "@mantine/hooks";
import { naturalSort } from "../utils/util-functions";

const getAssociatedEntities = (relativePath, currentEntityType) => {
  console.log("getAssociatedEntities", relativePath, currentEntityType);
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
  if (!datasetEntityObj) return [];

  const entityTypes = currentEntityType ? [currentEntityType] : Object.keys(datasetEntityObj);
  const associatedEntities = [];

  for (const entityType of entityTypes) {
    const entities = datasetEntityObj[entityType] || {};
    for (const [entityId, paths] of Object.entries(entities)) {
      console.log("entityId", entityId);
      if (paths?.[relativePath]) {
        associatedEntities.push({ entityId, entityType });
      }
    }
  }
  if (associatedEntities.length > 0) {
    console.log("associatedEntities:", associatedEntities);
  }
  return associatedEntities;
};
// Get badge color based on entity type
const getBadgeColor = (entityId) => {
  if (entityId.startsWith("sub-")) return "indigo";
  if (entityId.startsWith("sam-")) return "green";
  if (entityId.startsWith("site-")) return "orange";
  if (entityId.startsWith("perf-")) return "red";
  console.log("eid:", entityId);

  // Entity type based colors
  if (entityId === "Code") return "blue";
  if (entityId === "Experimental data") return "green";
  if (entityId === "Other") return "gray";
};

// Format entity ID for display (remove prefixes, limit length)
const formatEntityId = (entityId) => {
  // Remove common prefixes
  let displayText = entityId;
  const prefixes = ["sub-", "sam-", "site-", "perf-"];

  for (const prefix of prefixes) {
    if (displayText.startsWith(prefix)) {
      displayText = displayText.substring(prefix.length);
      break;
    }
  }

  // Limit length if needed
  if (displayText.length > 10) {
    displayText = displayText.substring(0, 8) + "...";
  }

  return displayText;
};

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};

const fileIcons = {
  py: <IconBrandPython size={ICON_SETTINGS.fileSize} />,
  txt: <IconFileText size={ICON_SETTINGS.fileSize} />,
  html: <IconFileTypeHtml size={ICON_SETTINGS.fileSize} />,
  json: <IconJson size={ICON_SETTINGS.fileSize} />,
  csv: <IconFileTypeCsv size={ICON_SETTINGS.fileSize} />,
  js: <IconFileTypeJs size={ICON_SETTINGS.fileSize} />,
  css: <IconFileTypeCss size={ICON_SETTINGS.fileSize} />,
  pdf: <IconFileTypePdf size={ICON_SETTINGS.fileSize} />,
  zip: <IconFileTypeZip size={ICON_SETTINGS.fileSize} />,
  tar: <IconFileTypeZip size={ICON_SETTINGS.fileSize} />,
  svg: <IconFileTypeSvg size={ICON_SETTINGS.fileSize} />,
  jpg: <IconFileTypeJpg size={ICON_SETTINGS.fileSize} />,
  jpeg: <IconFileTypeJpg size={ICON_SETTINGS.fileSize} />,
  png: <IconFileTypePng size={ICON_SETTINGS.fileSize} />,
};

const getIconForFile = (fileName) => {
  const fileExtension = fileName.split(".").pop();
  return fileIcons[fileExtension] || <IconFile size={ICON_SETTINGS.fileSize} />;
};

const FileItem = ({
  name,
  content,
  onFileClick,
  isFileSelected,
  allowStructureEditing,
  entityType,
}) => {
  const { hovered, ref } = useHover();
  const contextMenuItemData = useGlobalStore((state) => state.contextMenuItemData);
  const contextMenuIsOpened = useGlobalStore((state) => state.contextMenuIsOpened);

  // Get associated entities for this file, filtering by entityType
  const associations = getAssociatedEntities(content.relativePath, entityType);
  console.log("FileItem associations", associations);

  // Determine file selection status (true or false only, no null)
  const fileIsSelected = isFileSelected ? isFileSelected(name, content) : false;

  const handleFileContextMenuOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowStructureEditing) {
      window.notyf.open({
        duration: "2000",
        type: "info",
        message: "File editing is disabled in this interface.",
      });
      return;
    }
    openContextMenu({ x: e.clientX, y: e.clientY }, "file", name, structuredClone(content));
  };

  const isHoveredOrSelected =
    hovered || (contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath);

  const getFileColor = () => {
    if (fileIsSelected) return "var(--color-transparent-soda-green)";
    if (isHoveredOrSelected) return "rgba(0, 0, 0, 0.05)";
    return undefined;
  };

  return (
    <Group
      ref={ref}
      gap="xs"
      justify="flex-start"
      bg={getFileColor()}
      onContextMenu={handleFileContextMenuOpen}
      ml="sm"
      pl="xs"
      py="1px"
      style={{ flexWrap: "nowrap" }}
    >
      {/* Checkbox for selection appears first */}
      {onFileClick && (
        <Tooltip label="Select this file" zIndex={2999}>
          <Checkbox
            readOnly
            checked={fileIsSelected}
            onClick={(e) => {
              e.stopPropagation(); // Prevent any other click events
              onFileClick?.(name, content, fileIsSelected);
            }}
          />
        </Tooltip>
      )}
      {getIconForFile(name)}
      {/* File name text */}
      <Text
        size="sm"
        style={{
          borderRadius: "4px",
          cursor: "default",
          transition: "background-color 0.2s ease-in-out",
          flexGrow: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </Text>

      {/* Entity badges */}
      {associations.length > 0 && (
        <Group gap="xs" wrap="nowrap" style={{ marginLeft: "auto", overflow: "hidden" }}>
          {associations.slice(0, 3).map((assoc, index) => (
            <Tooltip
              key={index}
              label={`${assoc.entityId} (${assoc.entityType})`}
              position="top"
              withArrow
            >
              <Badge
                color={getBadgeColor(assoc.entityId)}
                variant="light"
                size="xs"
                style={{ whiteSpace: "nowrap" }}
              >
                {formatEntityId(assoc.entityId)}
              </Badge>
            </Tooltip>
          ))}
          {associations.length > 3 && (
            <Tooltip label={`${associations.length - 3} more entities`} position="top" withArrow>
              <Badge color="gray" variant="outline" size="xs">
                +{associations.length - 3}
              </Badge>
            </Tooltip>
          )}
        </Group>
      )}
    </Group>
  );
};

const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  datasetStructureSearchFilter,
  isFolderSelected,
  isFileSelected,
  allowStructureEditing,
  folderClickHoverText,
  entityType,
}) => {
  const contextMenuItemData = useGlobalStore((state) => state.contextMenuItemData);
  const contextMenuIsOpened = useGlobalStore((state) => state.contextMenuIsOpened);
  const contextMenuItemType = useGlobalStore((state) => state.contextMenuItemType);

  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  // Get associated entities for this folder, filtering by entityType
  const associations = getAssociatedEntities(content.relativePath, entityType);

  useEffect(() => {
    if (datasetStructureSearchFilter) setIsOpen(true);
  }, [datasetStructureSearchFilter]);

  const toggleFolder = () => setIsOpen((prev) => !prev);

  const handleFolderContextMenuOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!allowStructureEditing) {
      window.notyf.open({
        duration: "2000",
        type: "info",
        message: "Folder editing is disabled in this interface.",
      });
      return;
    }
    openContextMenu({ x: e.clientX, y: e.clientY }, "folder", name, structuredClone(content));
  };

  const folderIsEmpty =
    !content ||
    (Object.keys(content.folders).length === 0 && Object.keys(content.files).length === 0);

  if (folderIsEmpty) return null; // Don't render empty folders

  const folderIsPassThrough = content.passThrough;

  // Check if the folder is selected - simplified to just true/false
  const folderIsSelected = isFolderSelected ? isFolderSelected(name, content) : false;

  const folderRelativePathEqualsContextMenuItemRelativePath =
    contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath;

  // Helper function for determining background color
  const getBackgroundColor = () => {
    if (folderIsSelected) return "var(--color-transparent-soda-green)";

    if (
      hovered ||
      (contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath)
    ) {
      return "rgba(0, 0, 0, 0.05)";
    }
    return undefined;
  };

  return (
    <Stack gap={1} ml="xs">
      <Group
        gap={3}
        justify="flex-start"
        onContextMenu={handleFolderContextMenuOpen}
        ref={ref}
        bg={getBackgroundColor()}
        py="1px"
        style={{ flexWrap: "nowrap" }}
      >
        {folderIsEmpty || !isOpen ? (
          <IconFolder
            size={ICON_SETTINGS.folderSize}
            color={ICON_SETTINGS.folderColor}
            onClick={toggleFolder}
          />
        ) : (
          <IconFolderOpen
            size={ICON_SETTINGS.folderSize}
            color={ICON_SETTINGS.folderColor}
            onClick={toggleFolder}
          />
        )}
        {!folderIsPassThrough && (
          <>
            {onFolderClick && (
              <Tooltip label={folderClickHoverText || "Select this folder"} zIndex={2999}>
                <Checkbox
                  readOnly
                  checked={folderIsSelected}
                  onClick={() => onFolderClick?.(name, content, folderIsSelected)}
                />
              </Tooltip>
            )}
          </>
        )}
        <Text
          size="md"
          px={5}
          onClick={toggleFolder}
          style={{
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s ease-in-out",
            flexGrow: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          c={folderIsEmpty ? "gray" : folderIsPassThrough ? "silver" : "black"}
        >
          {name}
        </Text>

        {/* Entity badges */}
        {associations.length > 0 && (
          <Group
            gap="xs"
            wrap="nowrap"
            style={{ marginLeft: "auto", marginRight: 10, overflow: "hidden" }}
          >
            {associations.slice(0, 3).map((assoc, index) => (
              <Tooltip
                key={index}
                label={`${assoc.entityId} (${assoc.entityType})`}
                position="top"
                withArrow
              >
                <Badge
                  color={getBadgeColor(assoc.entityId)}
                  variant="light"
                  size="xs"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {formatEntityId(assoc.entityId)}
                </Badge>
              </Tooltip>
            ))}
            {associations.length > 3 && (
              <Tooltip label={`${associations.length - 3} more entities`} position="top" withArrow>
                <Badge color="gray" variant="outline" size="xs">
                  +{associations.length - 3}
                </Badge>
              </Tooltip>
            )}
          </Group>
        )}
      </Group>
      <Collapse in={isOpen}>
        {naturalSort(Object.keys(content?.folders || {})).map((folderName) => (
          <FolderItem
            key={folderName}
            name={folderName}
            content={content.folders[folderName]}
            onFolderClick={onFolderClick}
            onFileClick={onFileClick}
            datasetStructureSearchFilter={datasetStructureSearchFilter}
            isFolderSelected={isFolderSelected}
            isFileSelected={isFileSelected}
            allowStructureEditing={allowStructureEditing}
            folderClickHoverText={folderClickHoverText}
            entityType={entityType}
          />
        ))}
        {naturalSort(Object.keys(content?.files || {})).map((fileName) => (
          <FileItem
            key={fileName}
            name={fileName}
            content={content.files[fileName]}
            onFileClick={onFileClick}
            isFileSelected={isFileSelected}
            allowStructureEditing={allowStructureEditing}
            entityType={entityType}
          />
        ))}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({
  folderActions,
  fileActions,
  allowStructureEditing,
  itemSelectInstructions,
  hideSearchBar,
  mutuallyExclusiveSelection,
  entityType,
}) => {
  console.log("DatasetTreeViewRenderer entityType:", entityType);

  const renderDatasetStructureJSONObj = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObj
  );
  const renderDatasetStructureJSONObjIsLoading = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObjIsLoading
  );
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  const externallySetSearchFilterValue = useGlobalStore(
    (state) => state.externallySetSearchFilterValue
  );

  const [inputSearchFilter, setInputSearchFilter] = useState(datasetStructureSearchFilter);
  const [debouncedSearchFilter] = useDebouncedValue(inputSearchFilter, 300); // 300ms debounce

  useEffect(() => {
    setDatasetStructureSearchFilter(inputSearchFilter);
  }, [inputSearchFilter]);

  const handleSearchChange = (event) => {
    setInputSearchFilter(event.target.value);
  };

  // Update local state when the store changes
  useEffect(() => {
    setInputSearchFilter(externallySetSearchFilterValue);
  }, [externallySetSearchFilterValue]);

  const renderObjIsEmpty =
    !renderDatasetStructureJSONObj ||
    (Object.keys(renderDatasetStructureJSONObj?.folders).length === 0 &&
      Object.keys(renderDatasetStructureJSONObj?.files).length === 0);

  if (renderObjIsEmpty) {
    return (
      <Paper padding="md" shadow="sm" radius="md" mih={80} p="sm" flex={1} w="100%" withBorder>
        {itemSelectInstructions && (
          <SodaGreenPaper>
            <Text>{itemSelectInstructions}</Text>
          </SodaGreenPaper>
        )}
        {!hideSearchBar && (
          <TextInput
            placeholder="Search files and folders..."
            value={inputSearchFilter}
            onChange={handleSearchChange}
            leftSection={<IconSearch stroke={1.5} />}
            mt="md"
            mb="xs"
          />
        )}
        <Center mt="md">
          <Text size="sm" c="gray">
            {inputSearchFilter.length > 0
              ? "No files or folders found matching the search criteria."
              : "No folders or files to display."}
          </Text>
        </Center>
      </Paper>
    );
  }

  const handleFileItemClick = (fileName, fileContents) => {
    console.log("Internal file click", fileName); // Add this debug line
    const isSelected = fileActions["is-file-selected"](fileName, fileContents);
    // Now pass mutuallyExclusiveSelection as the last parameter
    fileActions["on-file-click"](fileName, fileContents, isSelected, mutuallyExclusiveSelection);
  };

  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      {itemSelectInstructions && (
        <Stack gap="xs">
          <Text size="lg" fw={500}>
            Select files {entityType ? `(${entityType})` : ""}:
          </Text>
          <Text>{itemSelectInstructions}</Text>
        </Stack>
      )}
      {!hideSearchBar && (
        <TextInput
          placeholder="Search files and folders..."
          value={inputSearchFilter}
          onChange={handleSearchChange}
          leftSection={<IconSearch stroke={1.5} />}
          mt="md"
          mb="xs"
        />
      )}
      <Stack gap={1} style={{ maxHeight: 700, overflowY: "auto" }} py={3}>
        {renderDatasetStructureJSONObjIsLoading ? (
          <Center w="100%">
            <Loader size="md" m="xs" />
          </Center>
        ) : (
          <>
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.folders || {})).map(
              (folderName) => (
                <FolderItem
                  key={folderName}
                  name={folderName}
                  content={renderDatasetStructureJSONObj.folders[folderName]}
                  onFolderClick={folderActions?.["on-folder-click"]}
                  onFileClick={fileActions?.["on-file-click"]}
                  folderClickHoverText={
                    folderActions?.["folder-click-hover-text"] ||
                    "Select this folder and its contents"
                  }
                  datasetStructureSearchFilter={datasetStructureSearchFilter}
                  isFolderSelected={folderActions?.["is-folder-selected"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowStructureEditing={allowStructureEditing}
                  entityType={entityType} // Pass to FolderItem
                />
              )
            )}
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.files || {})).map(
              (fileName) => (
                <FileItem
                  key={fileName}
                  name={fileName}
                  content={renderDatasetStructureJSONObj.files[fileName]}
                  onFileClick={handleFileItemClick}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowStructureEditing={allowStructureEditing}
                  entityType={entityType} // Pass to FileItem
                />
              )
            )}
          </>
        )}
      </Stack>
      <ContextMenu />
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
