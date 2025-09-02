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
  IconFileSpreadsheet,
} from "@tabler/icons-react";

import useGlobalStore from "../../../stores/globalStore";
import ContextMenu from "./ContextMenu";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import {
  setDatasetStructureSearchFilter,
  openContextMenu,
  reRenderTreeView,
} from "../../../stores/slices/datasetTreeViewSlice";
import {
  isFolderOpen,
  openFolder,
  closeFolder,
} from "../../../stores/slices/fileExplorerStateSlice";

import { useDebouncedValue } from "@mantine/hooks";
import { naturalSort } from "../utils/util-functions";
import SelectedEntityPreviewer from "../SelectedEntityPreviewer";

// Get badge color based on entity type
const getBadgeColor = (entityId) => {
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

const EntityBadges = ({ entities }) => {
  if (!entities || entities.length === 0) return null;

  if (entities.length <= 3) {
    // Show individual colored badges with tooltips
    return (
      <Group gap="xs" wrap="nowrap" style={{ marginLeft: "auto", overflow: "hidden" }}>
        {entities.map((entityId, index) => (
          <Tooltip key={index} label={entityId} position="top" withArrow>
            <Badge
              color={getBadgeColor(entityId)}
              variant="light"
              size="xs"
              style={{
                whiteSpace: "nowrap",
                maxWidth: "100px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {formatEntityId(entityId)}
            </Badge>
          </Tooltip>
        ))}
      </Group>
    );
  }

  // If more than 3, show a single badge with tooltip listing all entities
  return (
    <Tooltip
      label={entities.join(", ")}
      multiline
      width={250}
      position="top"
      withArrow
      zIndex={2999}
    >
      <Badge
        color="gray"
        variant="outline"
        size="xs"
        style={{
          whiteSpace: "nowrap",
          marginLeft: "auto",
        }}
      >
        {entities.length} entities
      </Badge>
    </Tooltip>
  );
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
  xlsx: <IconFileSpreadsheet size={ICON_SETTINGS.fileSize} />,
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
  entitiesAssociatedWithFile = [], // now array of strings
  onFileClick,
  allowStructureEditing,
  indent,
}) => {
  globalFileItemRenderCount++;
  const { hovered, ref } = useHover();
  const contextMenuRelativePath = useGlobalStore((state) => state.contextMenuRelativePath);
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
    hovered || (contextMenuIsOpened && contextMenuRelativePath === relativePath);

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
      my="1px"
      style={{ flexWrap: "nowrap" }}
      h="23px"
      ml={`${indent * 10 + 5}px`}
    >
      {onFileClick && (
        <Tooltip label="Select this file" zIndex={2999}>
          <Checkbox
            readOnly
            checked={fileIsSelected}
            onClick={(e) => {
              e.stopPropagation();
              onFileClick?.(relativePath, fileIsSelected);
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

      <EntityBadges entities={entitiesAssociatedWithFile} />
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
  folderName,
  relativePath,
  folderIsSelected,
  entitiesAssociatedWithFolder = [], // now array of strings
  onFolderClick,
  allowStructureEditing,
  indent,
  datasetStructureSearchFilter,
}) => {
  const contextMenuRelativePath = useGlobalStore((state) => state.contextMenuRelativePath);
  const contextMenuIsOpened = useGlobalStore((state) => state.contextMenuIsOpened);

  const { hovered, ref } = useHover();

  const isOpen = isFolderOpen(relativePath);

  useEffect(() => {
    if (datasetStructureSearchFilter && !isOpen) {
      openFolder(relativePath);
    }
  }, [datasetStructureSearchFilter, isOpen, relativePath]);

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
    openContextMenu({ x: e.clientX, y: e.clientY }, "folder", folderName, relativePath);
  };

  const folderIsPassThrough = content.passThrough;

  // Helper function for determining background color
  const getBackgroundColor = () => {
    if (hovered || (contextMenuIsOpened && contextMenuRelativePath === content.relativePath)) {
      return "rgba(0, 0, 0, 0.05)";
    }
    return undefined;
  };

  const handleFolderClick = () => {
    if (isOpen) {
      closeFolder(relativePath);
    } else {
      openFolder(relativePath);
    }
  };

  return (
    <Group
      gap={3}
      justify="flex-start"
      onContextMenu={handleFolderContextMenuOpen}
      ref={ref}
      bg={getBackgroundColor()}
      my="1px"
      style={{ flexWrap: "nowrap" }}
      onClick={handleFolderClick}
      h="23px"
      ml={`${indent * 10}px`}
    >
      {isOpen ? (
        <IconFolderOpen size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
      ) : (
        <IconFolder size={ICON_SETTINGS.folderSize} color={ICON_SETTINGS.folderColor} />
      )}
      {!folderIsPassThrough && typeof onFolderClick === "function" && (
        <Tooltip
          label={
            folderIsSelected
              ? "Deselect all files in this folder"
              : "Select all files in this folder"
          }
          zIndex={2999}
        >
          <Checkbox
            readOnly
            checked={folderIsSelected}
            onClick={(e) => {
              e.stopPropagation();
              onFolderClick?.(relativePath, folderIsSelected);
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
        {folderName}
      </Text>
      <EntityBadges entities={entitiesAssociatedWithFolder} />
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
}) => {
  const activeFileExplorer = useGlobalStore((state) => state.activeFileExplorer);
  const datasetRenderArray = useGlobalStore((state) => state.datasetRenderArray);

  const parentRef = useRef(null);

  const count = datasetRenderArray ? datasetRenderArray.length : 0;
  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 25, // 24px height + 2px total margin
    overscan: 70,
  });
  const datasetRenderArrayIsLoading = useGlobalStore((state) => state.datasetRenderArrayIsLoading);
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  const externallySetSearchFilterValue = useGlobalStore(
    (state) => state.externallySetSearchFilterValue
  );

  const [inputSearchFilter, setInputSearchFilter] = useState(datasetStructureSearchFilter);
  const [debouncedSearchFilter] = useDebouncedValue(inputSearchFilter, 500); // 500ms debounce

  // Only update store and trigger re-render when debounced value changes
  useEffect(() => {
    setDatasetStructureSearchFilter(debouncedSearchFilter);
    reRenderTreeView();
  }, [debouncedSearchFilter]);

  const handleSearchChange = (event) => {
    setInputSearchFilter(event.target.value);
  };

  // Update local state when the store changes
  useEffect(() => {
    setInputSearchFilter(externallySetSearchFilterValue);
  }, [externallySetSearchFilterValue]);

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
  }, [datasetRenderArray, rowVirtualizer.getVirtualItems()]);

  if (activeFileExplorer !== fileExplorerId) {
    return <Text>Inactive file explorer {fileExplorerId ? fileExplorerId : "NONE"}</Text>;
  }
  const renderObjIsEmpty =
    !datasetRenderArray || (Array.isArray(datasetRenderArray) && datasetRenderArray.length === 0);

  const handleFileItemClick = (relativePath, fileIsSelected) => {
    if (fileActions && typeof fileActions["on-file-click"] === "function") {
      fileActions["on-file-click"](relativePath, fileIsSelected, mutuallyExclusiveSelection);
    }
  };

  const handleFolderItemClick = (relativePath, folderIsSelected) => {
    if (folderActions && typeof folderActions["on-folder-click"] === "function") {
      folderActions["on-folder-click"](relativePath, folderIsSelected, mutuallyExclusiveSelection);
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
        {renderObjIsEmpty ? (
          <Center mt="md">
            <Text size="sm" c="gray">
              {debouncedSearchFilter.length > 0
                ? "No files or folders found matching the search criteria."
                : "No folders or files to display."}
            </Text>
          </Center>
        ) : datasetRenderArrayIsLoading ? (
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
              if (!item) return null;

              const renderItem = () => {
                switch (item.itemType) {
                  case "folder":
                    return (
                      <FolderItem
                        key={item.itemIndex}
                        folderName={item.folderName}
                        relativePath={item.relativePath}
                        folderIsSelected={item.folderIsSelected}
                        entitiesAssociatedWithFolder={item.entitiesAssociatedWithFolder}
                        onFolderClick={
                          folderActions?.["on-folder-click"] ? handleFolderItemClick : null
                        }
                        datasetStructureSearchFilter={datasetStructureSearchFilter}
                        allowStructureEditing={allowStructureEditing}
                        indent={item.itemIndent}
                      />
                    );
                  case "metadataFile":
                    return (
                      <FileItem
                        key={item.itemIndex}
                        fileName={item.fileName}
                        relativePath={item.relativePath}
                        fileIsSelected={item.fileIsSelected}
                        entitiesAssociatedWithFile={item.entitiesAssociatedWithFile}
                        onFileClick={fileActions?.["on-file-click"] ? handleFileItemClick : null}
                        allowStructureEditing={allowStructureEditing}
                        indent={item.itemIndent}
                        // Add extra props/styles for metadata files here
                      />
                    );
                  case "file":
                    return (
                      <FileItem
                        key={item.itemIndex}
                        fileName={item.fileName}
                        relativePath={item.relativePath}
                        fileIsSelected={item.fileIsSelected}
                        entitiesAssociatedWithFile={item.entitiesAssociatedWithFile}
                        onFileClick={fileActions?.["on-file-click"] ? handleFileItemClick : null}
                        allowStructureEditing={allowStructureEditing}
                        indent={item.itemIndent}
                      />
                    );
                  default:
                    console.error("Unknown item type:", item.itemType);
                    return null;
                }
              };

              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderItem()}
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
