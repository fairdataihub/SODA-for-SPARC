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
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconFileDownload,
  IconSearch,
} from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import ContextMenu from "./ContextMenu";
import {
  setDatasetStructureSearchFilter,
  openContextMenu,
} from "../../../stores/slices/datasetTreeViewSlice";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};

const naturalSort = (arr) =>
  arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

const FileItem = ({ name, content, onFileClick, isFileSelected, allowFileEditing }) => {
  const handleFileContextMenuOpen = (e) => {
    e.preventDefault(); // Prevent the default context menu
    e.stopPropagation(); // Prevent event propagation
    console.log("allowFileEditing", allowFileEditing);
    if (!allowFileEditing) {
      return;
    }
    console.log("Position:", { x: e.clientX, y: e.clientY });
    console.log("Opening context menu for file:", name, content);
    openContextMenu({ x: e.clientX, y: e.clientY }, "file", name, content);
  };

  return (
    <Group
      gap="sm"
      justify="flex-start"
      bg={isFileSelected ? (isFileSelected(content) ? "#e3f2fd" : "transparent") : "transparent"}
      onClick={() => {
        console.log("File clicked:", name, content);
        onFileClick && onFileClick(name, content);
      }}
      onContextMenu={handleFileContextMenuOpen}
      ml="sm"
    >
      <IconFile size={ICON_SETTINGS.fileSize} />
      <Text size="sm">{name}</Text>
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
  allowFileEditing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  useEffect(() => {
    if (datasetStructureSearchFilter) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [datasetStructureSearchFilter]);

  const toggleFolder = () => {
    setIsOpen((prev) => !prev);
  };

  const isFolderEmpty =
    Object.keys(content.folders || {}).length === 0 &&
    Object.keys(content.files || {}).length === 0;

  const folderHasFiles = Object.keys(content.files || {}).length > 0;

  const handleFileContextMenuOpen = (e) => {
    e.preventDefault(); // Prevent the default context menu
    e.stopPropagation(); // Prevent event propagation
    console.log("allowFileEditing", allowFileEditing);
    if (!allowFileEditing) {
      return;
    }

    console.log("Opening context menu for file:", name, content);

    openContextMenu({ x: e.clientX, y: e.clientY }, "folder", name, content);
  };

  return (
    <Stack gap={1} ml="xs">
      <Group gap={3} justify="flex-start" ref={ref} onContextMenu={handleFileContextMenuOpen}>
        {isOpen ? (
          <IconFolderOpen
            size={ICON_SETTINGS.folderSize}
            color={ICON_SETTINGS.folderColor}
            onClick={toggleFolder}
          />
        ) : (
          <IconFolder
            size={ICON_SETTINGS.folderSize}
            color={ICON_SETTINGS.folderColor}
            onClick={toggleFolder}
          />
        )}
        {onFolderClick && (
          <Tooltip label="Select this folder" zIndex={2999}>
            <Checkbox
              readOnly
              checked={isFolderSelected(name, content)}
              onClick={() => {
                console.log("Folder checkbox clicked:", name, content);
                onFolderClick(name, content, isFolderSelected(name, content));
              }}
            />
          </Tooltip>
        )}

        <Text size="md" px={5} onClick={toggleFolder}>
          {name}
        </Text>
        <Space w="lg" />
        {onFileClick && folderHasFiles && (
          <Tooltip label="Select all files in this folder" zIndex={2999}>
            <IconFileDownload
              size={20}
              onClick={() => {
                console.log("Select all files in folder:", name, content);
                const allFilesAreSelected = Object.keys(content.files).every((fileName) =>
                  isFileSelected(content.files[fileName])
                );
                if (allFilesAreSelected) {
                  Object.keys(content.files).forEach((fileName) =>
                    onFileClick(fileName, content.files[fileName])
                  );
                } else {
                  Object.keys(content.files).forEach(
                    (fileName) =>
                      !isFileSelected(content.files[fileName]) &&
                      onFileClick(fileName, content.files[fileName])
                  );
                }
              }}
            />
          </Tooltip>
        )}
      </Group>
      <Collapse in={isOpen}>
        {isOpen && !isFolderEmpty && (
          <>
            {naturalSort(Object.keys(content?.files || {})).map((fileName) => (
              <FileItem
                key={fileName}
                name={fileName}
                content={content.files[fileName]}
                onFileClick={onFileClick}
                isFileSelected={isFileSelected}
                allowFileEditing={allowFileEditing}
              />
            ))}
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
                allowFileEditing={allowFileEditing}
              />
            ))}
          </>
        )}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({ folderActions, fileActions, allowFileEditing }) => {
  const { renderDatasetStructureJSONObj, datasetStructureSearchFilter } = useGlobalStore(
    (state) => ({
      renderDatasetStructureJSONObj: state.renderDatasetStructureJSONObj,
      datasetStructureSearchFilter: state.datasetStructureSearchFilter,
    })
  );

  const handleMenuClose = () => {
    console.log("Closing context menu");
    setMenuOpened(false);
  };

  const handleSearchChange = (event) => {
    setDatasetStructureSearchFilter(event.target.value);
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

  const renderObjIsEmpty =
    !renderDatasetStructureJSONObj ||
    (Object.keys(renderDatasetStructureJSONObj?.folders).length === 0 &&
      Object.keys(renderDatasetStructureJSONObj?.files).length === 0);

  return (
    <Paper padding="md" shadow="sm" radius="md" mih={200} p="sm">
      <TextInput
        label="Search files and folders:"
        placeholder="Search files and folders..."
        value={datasetStructureSearchFilter}
        onChange={handleSearchChange}
        leftSection={<IconSearch stroke={1.5} />}
        mb="sm"
      />
      {datasetStructureSearchFilter && (
        <Group gap={3} align="center">
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
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.files || {})).map(
              (fileName) => (
                <FileItem
                  key={fileName}
                  name={fileName}
                  content={renderDatasetStructureJSONObj.files[fileName]}
                  onFileClick={fileActions?.["on-file-click"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowFileEditing={allowFileEditing}
                />
              )
            )}
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.folders || {})).map(
              (folderName) => (
                <FolderItem
                  key={folderName}
                  name={folderName}
                  content={renderDatasetStructureJSONObj.folders[folderName]}
                  onFolderClick={folderActions?.["on-folder-click"]}
                  onFileClick={fileActions?.["on-file-click"]}
                  datasetStructureSearchFilter={datasetStructureSearchFilter}
                  isFolderSelected={folderActions?.["is-folder-selected"]}
                  isFileSelected={fileActions?.["is-file-selected"]}
                  allowFileEditing={allowFileEditing}
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
