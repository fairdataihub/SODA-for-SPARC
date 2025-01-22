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

  const fileRelativePathEqualsContextMenuItemRelativePath =
    contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath;

  const fileIsSelected = isFileSelected?.(content);

  if (fileIsSelected) {
    console.log("File is selected");
    console.log(content.relativePath);
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

  return (
    <Group
      ref={ref}
      gap="sm"
      justify="flex-start"
      bg={
        hovered || fileRelativePathEqualsContextMenuItemRelativePath
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
  const {
    folderMoveModeIsActive,
    contextMenuItemType,
    contextMenuItemData,
    contextMenuIsOpened,
    contextMenuItemName,
  } = useGlobalStore((state) => ({
    folderMoveModeIsActive: state.folderMoveModeIsActive,
    contextMenuItemType: state.contextMenuItemType,
    contextMenuItemData: state.contextMenuItemData,
    contextMenuIsOpened: state.contextMenuIsOpened,
    contextMenuItemName: state.contextMenuItemName,
  }));

  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  useEffect(() => {
    setIsOpen(!!datasetStructureSearchFilter);
  }, [datasetStructureSearchFilter]);

  const toggleFolder = () => setIsOpen((prev) => !prev);

  const handleFileContextMenuOpen = (e) => {
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
  const folderOnlyHasFolders =
    Object.keys(content.folders).length > 0 && Object.keys(content.files).length === 0;
  const folderOnlyHasFiles =
    Object.keys(content.folders).length === 0 && Object.keys(content.files).length > 0;
  const folderRelativePathEqualsContextMenuItemRelativePath =
    contextMenuIsOpened && contextMenuItemData?.relativePath === content.relativePath;

  return (
    <Stack gap={1} ml="xs">
      <Group
        gap={3}
        justify="flex-start"
        onContextMenu={handleFileContextMenuOpen}
        ref={ref}
        bg={
          hovered || folderRelativePathEqualsContextMenuItemRelativePath
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
                  checked={isFolderSelected?.(name, content) || false}
                  onClick={() => onFolderClick?.(name, content, isFolderSelected?.(name, content))}
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
          {name}
        </Text>
      </Group>
      <Collapse in={isOpen}>
        {isOpen && (
          <>
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
          </>
        )}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({ folderActions, fileActions, allowStructureEditing }) => {
  const {
    renderDatasetStructureJSONObj,
    datasetStructureSearchFilter,
    folderMoveModeIsActive,
    contextMenuItemType,
    contextMenuItemData,
    contextMenuIsOpened,
    contextMenuItemName,
  } = useGlobalStore((state) => ({
    renderDatasetStructureJSONObj: state.renderDatasetStructureJSONObj,
    datasetStructureSearchFilter: state.datasetStructureSearchFilter,
    folderMoveModeIsActive: state.folderMoveModeIsActive,
    folderMoveModeIsActive: state.folderMoveModeIsActive,
    contextMenuItemType: state.contextMenuItemType,
    contextMenuItemData: state.contextMenuItemData,
    contextMenuIsOpened: state.contextMenuIsOpened,
    contextMenuItemName: state.contextMenuItemName,
  }));

  const searchDebounceTime = 300; // Set the debounce time for the search filter (in milliseconds)

  const [inputSearchFilter, setInputSearchFilter] = useState(datasetStructureSearchFilter); // Local state for input
  const searchTimeoutRef = useRef(null);

  // Debounce the search filter change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setInputSearchFilter(value); // Update the input immediately

    // Clear the previous timeout if there is one
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to update the global state
    searchTimeoutRef.current = setTimeout(() => {
      setDatasetStructureSearchFilter(value); // Update the global state after the debounce delay
    }, searchDebounceTime);
  };

  useEffect(() => {
    return () => {
      // Cleanup the timeout on component unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleMenuClose = () => {
    console.log("Closing context menu");
    setMenuOpened(false);
  };

  const handleAllFilesSelectClick = () => {
    Object.keys(renderDatasetStructureJSONObj.files).forEach((fileName) =>
      fileActions["on-file-click"](fileName, renderDatasetStructureJSONObj.files[fileName])
    );
  };

  const handleAllFoldersSelectClick = () => {
    Object.keys(renderDatasetStructureJSONObj.folders).forEach((folderName) =>
      folderActions["on-folder-click"](
        folderName,
        renderDatasetStructureJSONObj.folders[folderName]
      )
    );
  };

  const handleDeleteAllItemsClick = () => {
    console.log('Deleting all items containing "' + inputSearchFilter + '" in their name');
  };

  const renderObjIsEmpty =
    !renderDatasetStructureJSONObj ||
    (Object.keys(renderDatasetStructureJSONObj?.folders).length === 0 &&
      Object.keys(renderDatasetStructureJSONObj?.files).length === 0);

  const searchDebounceIsActive = datasetStructureSearchFilter !== inputSearchFilter;

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
      {/*datasetStructureSearchFilter && !renderObjIsEmpty && !folderMoveModeIsActive && (
        <Group gap={3} align="center" bg="aliceblue" p="xs">
          {fileActions && (
            <Button size="xs" color="blue" variant="outline" onClick={handleAllFilesSelectClick}>
              Select all files in search results
            </Button>
          )}
          {folderActions && (
            <Button size="xs" color="blue" variant="outline" onClick={handleAllFoldersSelectClick}>
              Select all folders in search results
            </Button>
          )}
          {allowStructureEditing && (
            <Button size="xs" color="red" variant="outline" onClick={handleDeleteAllItemsClick}>
              Delete all files and folders containing {datasetStructureSearchFilter} in their name
            </Button>
          )}
        </Group>
      )*/}
      {folderMoveModeIsActive && (
        /* make A ui that allows the user to cancel the move operation */
        <Group justify="space-between" bg="aliceblue" p="xs">
          <Text size="lg" fw={500}>
            Select a folder to move the {contextMenuItemType} '{contextMenuItemName}' to:
          </Text>
          <Button
            size="xs"
            color="red"
            variant="outline"
            onClick={() => {
              setFolderMoveMode(false);
            }}
          >
            Cancel data move operation
          </Button>
        </Group>
      )}
      <Stack gap={1} style={{ maxHeight: 700, overflowY: "auto" }} py={3}>
        {renderObjIsEmpty ? (
          <Center mt="md">
            {datasetStructureSearchFilter ? (
              <Text size="sm" c="gray">
                No files or folders found matching the search criteria.
              </Text>
            ) : (
              <Text c="gray">Import experimental data above</Text>
            )}
          </Center>
        ) : (
          <>
            {searchDebounceIsActive ? (
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
          </>
        )}
      </Stack>
      <ContextMenu />
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
