import { useVirtualizer } from "@tanstack/react-virtual";
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
import {
  isFolderOpen,
  openFolder,
  closeFolder,
} from "../../../stores/slices/fileExplorerStateSlice";

import { useDebouncedValue } from "@mantine/hooks";
import { naturalSort } from "../utils/util-functions";
import SelectedEntityPreviewer from "../SelectedEntityPreviewer";

const getAssociatedEntities = (relativePath, currentEntityType) => {
  const datasetEntityObj = useGlobalStore.getState().datasetEntityObj;
  if (!datasetEntityObj) return [];

  if (!currentEntityType) {
    return [];
  }

  const entityTypes = [currentEntityType];
  const associatedEntities = [];

  for (const entityType of entityTypes) {
    const entities = datasetEntityObj[entityType] || {};
    for (const [entityId, paths] of Object.entries(entities)) {
      if (paths?.[relativePath]) {
        associatedEntities.push({ entityId, entityType });
      }
    }
  }

  return associatedEntities;
};
// Get badge color based on entity type
const getBadgeColor = (entityId) => {
  console.log("Determining badge color for entityId:", entityId);
  if (entityId.startsWith("sub-")) return "indigo";
  if (entityId.startsWith("sam-")) return "green";
  if (entityId.startsWith("site-")) return "orange";
  if (entityId.startsWith("perf-")) return "red";

  // Entity type based colors
  if (entityId === "Code") return "blue";
  if (entityId === "Experimental") return "green";
  if (entityId === "Protocol") return "gray";
  if (entityId === "Docs") return "cyan";
};

const formatEntityId = (entityId) => {
  let displayText = entityId;

  // Limit very long entity names to maintain UI layout
  // Show enough characters to be identifiable but prevent overflow
  if (displayText.length > 20) {
    displayText = displayText.substring(0, 18) + "...";
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

let globalFileItemRenderCount = 0;

// File item component - represents a single file in the dataset tree
const FileItem = ({
  fileName,
  relativePath,
  fileIsSelected,
  entitiesAssociatedWithFile = [],
  onFileClick,
  allowStructureEditing,
  indent,
}) => {
  globalFileItemRenderCount++;
  const { hovered, ref } = useHover();
  const contextMenuItemData = useGlobalStore((state) => state.contextMenuItemData);
  const contextMenuIsOpened = useGlobalStore((state) => state.contextMenuIsOpened);

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
    openContextMenu({ x: e.clientX, y: e.clientY }, "file", fileName, relativePath); // UO update last param from structuredClone(metadata)
  };

  const isHoveredOrSelected =
    hovered || (contextMenuIsOpened && contextMenuItemData?.relativePath === relativePath);

  const getFileColor = () => {
    if (fileIsSelected) return "var(--color-transparent-soda-green)";
    if (isHoveredOrSelected) return "rgba(0, 0, 0, 0.05)";
    return undefined;
  };

  useEffect(() => {
    if (globalFileItemRenderCount % 100 === 0) {
      console.log(`FileItem rendered ${globalFileItemRenderCount} times`);
    }
  });

  return (
    <Group
      ref={ref}
      gap="xs"
      justify="flex-start"
      bg={getFileColor()}
      onContextMenu={handleFileContextMenuOpen}
      pl="xs"
      py="1px"
      style={{ flexWrap: "nowrap" }}
      h="24px"
      ml={`${indent * 10 + 5}px`}
    >
      {onFileClick && (
        <Tooltip label="Select this file" zIndex={2999}>
          <Checkbox
            readOnly
            checked={fileIsSelected}
            onClick={(e) => {
              e.stopPropagation();
              onFileClick?.(fileName, relativePath, fileIsSelected);
            }}
          />
        </Tooltip>
      )}
      {getIconForFile(fileName)}
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
        {fileName}
      </Text>

      {/* Render association badges */}
      {entitiesAssociatedWithFile.length > 0 && (
        <Group gap="xs" wrap="nowrap" style={{ marginLeft: "auto", overflow: "hidden" }}>
          {entitiesAssociatedWithFile.slice(0, 3).map((entity, index) => (
            <Tooltip
              key={index}
              label={`${entity.entityId} (${entity.entityType})`}
              position="top"
              withArrow
            >
              <Badge
                color={getBadgeColor(entity.entityId)}
                variant="light"
                size="xs"
                style={{
                  whiteSpace: "nowrap",
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatEntityId(entity.entityId)}
              </Badge>
            </Tooltip>
          ))}
          {entitiesAssociatedWithFile.length > 3 && (
            <Tooltip
              label={`${entitiesAssociatedWithFile.length - 3} more entities`}
              position="top"
              withArrow
            >
              <Badge color="gray" variant="outline" size="xs">
                +{entitiesAssociatedWithFile.length - 3}
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
  isFileSelected,
  allowStructureEditing,
  allowFolderSelection,
  folderClickHoverText,
  entityType,
  checked,
  indent,
}) => {
  const contextMenuItemData = useGlobalStore((state) => state.contextMenuItemData);
  const contextMenuIsOpened = useGlobalStore((state) => state.contextMenuIsOpened);

  const { hovered, ref } = useHover();

  // Get associated entities for this folder, filtering by entityType
  const associations = getAssociatedEntities(content.relativePath, entityType);

  // Use global openFolders state
  const folderPath = content.relativePath;
  const isOpen = isFolderOpen(folderPath);

  useEffect(() => {
    if (datasetStructureSearchFilter && !isOpen) {
      openFolder(folderPath);
    }
  }, [datasetStructureSearchFilter, isOpen, folderPath]);

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

    // Only return true if ALL files are selected (complete folder selection)
    return selectedCount === totalFiles;
  };

  // Handler for when folder checkbox is clicked
  const handleFolderCheckboxClick = () => {
    if (!onFileClick || !isFileSelected || typeof isFileSelected !== "function") {
      console.error("Missing required props for folder checkbox click handler");
      return;
    }

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

  const folderRelativePathEqualsContextMenuItemRelativePath =
    contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath;

  // Helper function for determining background color
  const getBackgroundColor = () => {
    if (
      hovered ||
      (contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath)
    ) {
      return "rgba(0, 0, 0, 0.05)";
    }
    return undefined;
  };

  const handleFolderClick = () => {
    console.log(`Folder ${isOpen ? "closed" : "opened"}: ${folderPath}`);
    if (isOpen) {
      closeFolder(folderPath);
    } else {
      openFolder(folderPath);
    }
  };

  return (
    <Group
      gap={3}
      justify="flex-start"
      onContextMenu={handleFolderContextMenuOpen}
      ref={ref}
      bg={getBackgroundColor()}
      py="1px"
      style={{ flexWrap: "nowrap" }}
      onClick={handleFolderClick}
      h="24px"
      ml={`${indent * 10}px`}
    >
      {isOpen ? (
        <IconFolderOpen size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
      ) : (
        <IconFolder size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
      )}
      {!folderIsPassThrough && onFileClick && typeof isFileSelected === "function" && (
        <Tooltip
          label={checked ? "Deselect all files in this folder" : "Select all files in this folder"}
          zIndex={2999}
        >
          <Checkbox
            readOnly
            checked={checked}
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
        style={{
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background-color 0.2s ease-in-out",
          flexGrow: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        c={folderIsPassThrough ? "silver" : "black"}
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
  );
};

// Main component - renders the entire dataset tree structure
const DatasetTreeViewRenderer = ({
  fileExplorerId,
  folderActions,
  fileActions,
  allowStructureEditing,
  itemSelectInstructions,
  hideSearchBar,
  mutuallyExclusiveSelection,
  entityType,
  allowFolderSelection = false, // Add new prop with default false
}) => {
  const activeFileExplorer = useGlobalStore((state) => state.activeFileExplorer);
  const datasetRenderArray = useGlobalStore((state) => state.datasetRenderArray);

  const parentRef = useRef(null);

  const count = datasetRenderArray ? datasetRenderArray.length : 0;
  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 26, // 24px height + 2px total margin
    overscan: 70,
  });
  console.log("datasetRenderArray:", datasetRenderArray);
  const datasetRenderArrayIsLoading = useGlobalStore((state) => state.datasetRenderArrayIsLoading);
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

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    console.log(
      `Virtualizer update: total=${datasetRenderArray?.length ?? 0}, virtualized=${
        virtualItems.length
      }`
    );
    console.log(virtualItems);
  }, [datasetRenderArray, rowVirtualizer.getVirtualItems()]);

  if (activeFileExplorer !== fileExplorerId) {
    return <Text>Inactive file explorer {fileExplorerId ? fileExplorerId : "NONE"}</Text>;
  }
  const renderObjIsEmpty =
    !datasetRenderArray || (Array.isArray(datasetRenderArray) && datasetRenderArray.length === 0);
  console.log("renderObjIsEmpty:", renderObjIsEmpty);

  if (renderObjIsEmpty) {
    return (
      <Paper padding="md" shadow="sm" radius="md" mih={80} p="sm" flex={1} w="100%" withBorder>
        {itemSelectInstructions && (
          <SodaGreenPaper>
            <Text>{itemSelectInstructions}</Text>
          </SodaGreenPaper>
        )}
        <SelectedEntityPreviewer />
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
    if (fileActions && typeof fileActions["is-file-selected"] === "function") {
      const isSelected = fileActions["is-file-selected"](fileName, fileContents);
      // Pass the mutuallyExclusiveSelection parameter
      fileActions["on-file-click"](fileName, fileContents, isSelected, mutuallyExclusiveSelection);
    }
  };

  return (
    <Paper padding="md" shadow="sm" radius="md" p="sm" flex={1} w="100%" withBorder>
      <Text>{`Total files in DOM: ${
        rowVirtualizer.getVirtualItems().length
      } out of ${count} files open`}</Text>
      {itemSelectInstructions && (
        <Stack gap="xs">
          <Text size="lg" fw={500}>
            Select files
          </Text>
          <Text>{itemSelectInstructions}</Text>
        </Stack>
      )}
      <SelectedEntityPreviewer />
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
      <div
        ref={parentRef}
        style={{
          maxHeight: 600,
          overflowY: "auto",
          position: "relative",
        }}
      >
        {datasetRenderArrayIsLoading ? (
          <Center w="100%">
            <Loader size="md" m="xs" />
          </Center>
        ) : (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = datasetRenderArray[virtualRow.index];
              console.log("item:", item);
              if (!item) return null;

              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.itemType === "folder" ? (
                    <FolderItem
                      key={item.itemIndex}
                      name={item.folderName}
                      content={item.itemContent}
                      onFolderClick={
                        allowFolderSelection ? folderActions?.["on-folder-click"] : null
                      }
                      onFileClick={fileActions?.["on-file-click"] ? handleFileItemClick : null}
                      folderClickHoverText={
                        folderActions?.["folder-click-hover-text"] ||
                        "Select this folder and its contents"
                      }
                      datasetStructureSearchFilter={datasetStructureSearchFilter}
                      isFileSelected={fileActions?.["is-file-selected"]}
                      allowStructureEditing={allowStructureEditing}
                      allowFolderSelection={allowFolderSelection}
                      entityType={entityType}
                      indent={item.itemIndent}
                    />
                  ) : (
                    <FileItem
                      /*{
                        fileName,
                        relativePath,
                        fileIsSelected,
                        entitiesAssociatedWithFile = [],
                        onFileClick,
                        allowStructureEditing,
                        indent,
                      }*/
                      key={item.itemIndex}
                      fileName={item.fileName}
                      relativePath={item.relativePath}
                      fileIsSelected={item.fileIsSelected}
                      entitiesAssociatedWithFile={item.entitiesAssociatedWithFile}
                      onFileClick={fileActions?.["on-file-click"] ? handleFileItemClick : null}
                      allowStructureEditing={allowStructureEditing}
                      indent={item.itemIndent}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ContextMenu />
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
