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
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconFolder, IconFolderOpen, IconFile, IconSearch } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import ContextMenu from "./ContextMenu";
import {
  setDatasetStructureSearchFilter,
  openContextMenu,
  setFolderMoveMode,
  moveFolderToNewLocation,
} from "../../../stores/slices/datasetTreeViewSlice";
import {
  moveFoldersToTargetLocation,
  moveFilesToTargetLocation,
} from "../../../stores/utils/folderAndFileActions";
import { useDebouncedValue } from "@mantine/hooks";
import { naturalSort } from "../utils/util-functions";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};

const FileItem = ({ name, content, onFileClick, isFileSelected, allowStructureEditing }) => {
  const { hovered, ref } = useHover();
  const { contextMenuItemData, contextMenuIsOpened } = useGlobalStore((state) => ({
    contextMenuItemData: state.contextMenuItemData,
    contextMenuIsOpened: state.contextMenuIsOpened,
  }));

  const fileIsSelected = isFileSelected ? isFileSelected(name, content) : false;

  if (fileIsSelected) {
    console.log("File is selected", name);
  }

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

  return (
    <Group
      ref={ref}
      gap="sm"
      justify="flex-start"
      bg={
        fileIsSelected
          ? "var(--color-transparent-soda-green)"
          : isHoveredOrSelected
            ? "rgba(0, 0, 0, 0.05)"
            : undefined
      }
      onClick={() => onFileClick?.(name, content)}
      onContextMenu={handleFileContextMenuOpen}
      ml="sm"
    >
      <IconFile size={ICON_SETTINGS.fileSize} />
      <Text
        size="sm"
        style={{
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background-color 0.2s ease-in-out",
        }}
      >
        {name}
      </Text>
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
}) => {
  const { folderMoveModeIsActive, contextMenuItemData, contextMenuIsOpened, contextMenuItemType } =
    useGlobalStore((state) => ({
      folderMoveModeIsActive: state.folderMoveModeIsActive,
      contextMenuItemData: state.contextMenuItemData,
      contextMenuIsOpened: state.contextMenuIsOpened,
      contextMenuItemType: state.contextMenuItemType,
    }));

  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

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
  const folderIsPassThrough = content.passThrough;

  // Check if the folder is selected
  const folderIsSelected = isFolderSelected ? isFolderSelected(name, content) : false;
  console.log("Folder is selected", folderIsSelected);

  const folderRelativePathEqualsContextMenuItemRelativePath =
    contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath;

  if (folderIsEmpty) return null;

  return (
    <Stack gap={1} ml="xs">
      <Group
        gap={3}
        justify="flex-start"
        onContextMenu={handleFolderContextMenuOpen}
        ref={ref}
        bg={
          folderIsSelected
            ? "var(--color-transparent-soda-green)"
            : hovered || folderRelativePathEqualsContextMenuItemRelativePath
              ? "rgba(0, 0, 0, 0.05)"
              : undefined
        }
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
            {onFolderClick && !folderMoveModeIsActive && (
              <Tooltip label={folderClickHoverText || "Select this folder"} zIndex={2999}>
                <Checkbox
                  readOnly
                  checked={folderIsSelected}
                  onClick={() => onFolderClick?.(name, content, folderIsSelected)}
                />
              </Tooltip>
            )}
            {folderMoveModeIsActive && (
              <Tooltip label="Move data to this folder" zIndex={2999}>
                <Checkbox
                  readOnly
                  disabled={content.relativePath.includes(contextMenuItemData.relativePath)}
                  onClick={() => {
                    contextMenuItemType === "folder"
                      ? moveFoldersToTargetLocation(
                          [contextMenuItemData.relativePath],
                          content.relativePath
                        )
                      : moveFilesToTargetLocation(
                          [contextMenuItemData.relativePath],
                          content.relativePath
                        );
                    setFolderMoveMode(false);
                  }}
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
          }}
          c={folderIsEmpty ? "gray" : folderIsPassThrough ? "silver" : "black"}
        >
          {content.relativePath}
        </Text>
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
          />
        ))}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({ folderActions, fileActions, allowStructureEditing }) => {
  const {
    renderDatasetStructureJSONObj,
    renderDatasetStructureJSONObjIsLoading,
    datasetStructureSearchFilter,
    folderMoveModeIsActive,
    contextMenuItemType,
    contextMenuItemName,
    externallySetSearchFilterValue,
    datasetEntityObj,
  } = useGlobalStore((state) => ({
    renderDatasetStructureJSONObj: state.renderDatasetStructureJSONObj,
    renderDatasetStructureJSONObjIsLoading: state.renderDatasetStructureJSONObjIsLoading,
    datasetStructureSearchFilter: state.datasetStructureSearchFilter,
    folderMoveModeIsActive: state.folderMoveModeIsActive,
    contextMenuItemType: state.contextMenuItemType,
    contextMenuItemName: state.contextMenuItemName,
    externallySetSearchFilterValue: state.externallySetSearchFilterValue,
    datasetEntityObj: state.datasetEntityObj,
  }));

  console.log("datasetEntityObj: ", datasetEntityObj);

  const [inputSearchFilter, setInputSearchFilter] = useState(datasetStructureSearchFilter);
  console.log("inputSearchFilter::", inputSearchFilter);
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
      <Paper padding="md" shadow="sm" radius="md" mih={200} p="sm" flex={1}>
        <TextInput
          label="Search files and folders:"
          placeholder="Search files and folders..."
          value={inputSearchFilter}
          onChange={handleSearchChange}
          leftSection={<IconSearch stroke={1.5} />}
          mb="sm"
        />
        <Center mt="md">
          <Text size="sm" c="gray">
            No files or folders found matching the search criteria.
          </Text>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper padding="md" shadow="sm" radius="md" mih={200} p="sm" flex={1}>
      <TextInput
        label="Search files and folders:"
        placeholder="Search files and folders..."
        value={inputSearchFilter}
        onChange={handleSearchChange}
        leftSection={<IconSearch stroke={1.5} />}
        mb="sm"
      />
      {folderMoveModeIsActive && (
        <Group justify="space-between" bg="aliceblue" p="xs">
          <Text size="lg" fw={500}>
            Select a folder to move the {contextMenuItemType} '{contextMenuItemName}' to:
          </Text>
          <Button size="xs" color="red" variant="outline" onClick={() => setFolderMoveMode(false)}>
            Cancel data move operation
          </Button>
        </Group>
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
                    folderActions?.["folder-click-hover-text"] || "Select this folder"
                  }
                  datasetStructureSearchFilter={datasetStructureSearchFilter}
                  isFolderSelected={folderActions?.["is-folder-selected"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowStructureEditing={allowStructureEditing}
                />
              )
            )}
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.files || {})).map(
              (fileName) => (
                <FileItem
                  key={fileName}
                  name={fileName}
                  content={renderDatasetStructureJSONObj.files[fileName]}
                  onFileClick={fileActions?.["on-file-click"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowStructureEditing={allowStructureEditing}
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
