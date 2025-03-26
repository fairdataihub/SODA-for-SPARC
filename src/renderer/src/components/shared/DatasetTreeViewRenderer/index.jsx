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

// Format entity ID for display by removing standard prefixes and managing length
// to ensure badges remain readable while showing meaningful information
const formatEntityId = (entityId) => {
  console.log("formatEntityId", entityId);
  // Strip common prefixes for cleaner display
  let displayText = entityId;
  const prefixes = ["sub-", "sam-", "site-", "perf-"];

  for (const prefix of prefixes) {
    if (displayText.startsWith(prefix)) {
      displayText = displayText.substring(prefix.length);
      break;
    }
  }

  // Limit very long entity names to maintain UI layout
  // Show enough characters to be identifiable but prevent overflow
  if (displayText.length > 20) {
    displayText = displayText.substring(0, 18) + "...";
  }
  console.log("displayText", displayText);
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

// File item component - represents a single file in the dataset tree
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

      {/* Entity association badges - show which entities this file belongs to */}
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
                style={{
                  whiteSpace: "nowrap",
                  maxWidth: "100px", // Prevent oversized badges from disrupting layout
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatEntityId(assoc.entityId)}
              </Badge>
            </Tooltip>
          ))}
          {/* "More" indicator for when a file has many associations */}
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

// Recursively collects all file objects within a folder structure
// Used to determine collective selection state for folder checkboxes
const collectAllFilesRecursively = (content) => {
  if (!content) return [];

  let allFiles = [];

  // Add files in current folder
  if (content.files) {
    Object.keys(content.files).forEach((fileName) => {
      allFiles.push({
        name: fileName,
        content: content.files[fileName],
      });
    });
  }

  // Recursively collect files from subfolders
  if (content.folders) {
    Object.keys(content.folders).forEach((folderName) => {
      const subfolderFiles = collectAllFilesRecursively(content.folders[folderName]);
      allFiles = [...allFiles, ...subfolderFiles];
    });
  }

  return allFiles;
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
  allowFolderSelection,
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

  // Determines if all files in this folder and its subfolders are selected
  // Used to drive the folder checkbox state (checked, unchecked)
  const areAllFilesSelected = () => {
    if (!isFileSelected || typeof isFileSelected !== "function") return false;

    const allFiles = collectAllFilesRecursively(content);
    if (allFiles.length === 0) return false;

    // Diagnostic information to help trace selection states
    const totalFiles = allFiles.length;
    const selectedFiles = allFiles.filter((file) => isFileSelected(file.name, file.content));
    const selectedCount = selectedFiles.length;

    console.debug(
      `Folder ${name} selection: ${selectedCount}/${totalFiles} files selected`,
      `(includes ${Object.keys(content.folders || {}).length} subfolders)`
    );

    // Only return true if ALL files are selected (complete folder selection)
    return selectedCount === totalFiles;
  };

  // Calculate if folder checkbox should be checked
  const folderCheckboxStatus = areAllFilesSelected();

  // Handler for when folder checkbox is clicked
  const handleFolderCheckboxClick = () => {
    if (!onFileClick || !isFileSelected || typeof isFileSelected !== "function") return;

    const allFiles = collectAllFilesRecursively(content);
    const currentlyAllSelected = areAllFilesSelected();

    // Toggle all files to the opposite of current state
    allFiles.forEach((file) => {
      try {
        const fileIsSelected = isFileSelected(file.name, file.content);
        // Only toggle if needed (all selected -> deselect all, or not all selected -> select all)
        if (currentlyAllSelected === fileIsSelected) {
          onFileClick(file.name, file.content, fileIsSelected);
        }
      } catch (err) {
        console.error("Error checking file selection status:", err);
      }
    });
  };

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
        {!folderIsPassThrough && onFileClick && typeof isFileSelected === "function" && (
          <Tooltip label="Select all files in this folder" zIndex={2999}>
            <Checkbox
              readOnly
              checked={folderCheckboxStatus}
              onClick={(e) => {
                e.stopPropagation();
                handleFolderCheckboxClick();
              }}
            />
          </Tooltip>
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

        {/* Entity association badges for folder */}
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
                  style={{
                    whiteSpace: "nowrap",
                    maxWidth: "100px", // Constrain badge width for layout consistency
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
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
            allowFolderSelection={allowFolderSelection}
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

// Main component - renders the entire dataset tree structure
const DatasetTreeViewRenderer = ({
  folderActions,
  fileActions,
  allowStructureEditing,
  itemSelectInstructions,
  hideSearchBar,
  mutuallyExclusiveSelection,
  entityType,
  allowFolderSelection = false, // Add new prop with default false
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
    if (fileActions && typeof fileActions["is-file-selected"] === "function") {
      const isSelected = fileActions["is-file-selected"](fileName, fileContents);
      // Pass the mutuallyExclusiveSelection parameter
      fileActions["on-file-click"](fileName, fileContents, isSelected, mutuallyExclusiveSelection);
    }
  };

  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      {itemSelectInstructions && (
        <Stack gap="xs">
          <Text size="lg" fw={500}>
            Select files
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
                  onFolderClick={allowFolderSelection ? folderActions?.["on-folder-click"] : null}
                  onFileClick={fileActions?.["on-file-click"] ? handleFileItemClick : null}
                  folderClickHoverText={
                    folderActions?.["folder-click-hover-text"] ||
                    "Select this folder and its contents"
                  }
                  datasetStructureSearchFilter={datasetStructureSearchFilter}
                  isFolderSelected={folderActions?.["is-folder-selected"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowStructureEditing={allowStructureEditing}
                  allowFolderSelection={allowFolderSelection}
                  entityType={entityType}
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
