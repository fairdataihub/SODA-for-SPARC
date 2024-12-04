import { useState, useEffect } from "react";
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
} from "@mantine/core";

import { useHover } from "@mantine/hooks";
import {
  IconFolder,
  IconFolderFilled,
  IconFolderOpen,
  IconFile,
  IconFileTypeCsv,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypePng,
  IconFileTypeTxt,
  IconFileTypeXls,
  IconFileTypeXml,
  IconFileTypeZip,
  IconPhoto,
  IconSearch,
  IconSelect,
  IconFileDownload,
} from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import { setDatasetstructureSearchFilter } from "../../../stores/slices/datasetTreeViewSlice";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 16,
  fileSize: 14,
};

const FILE_ICON_MAP = {
  csv: <IconFileTypeCsv size={ICON_SETTINGS.fileSize} />,
  xls: <IconFileTypeXls size={ICON_SETTINGS.fileSize} />,
  xlsx: <IconFileTypeXls size={ICON_SETTINGS.fileSize} />,
  txt: <IconFileTypeTxt size={ICON_SETTINGS.fileSize} />,
  doc: <IconFileTypeDoc size={ICON_SETTINGS.fileSize} />,
  docx: <IconFileTypeDocx size={ICON_SETTINGS.fileSize} />,
  pdf: <IconFileTypePdf size={ICON_SETTINGS.fileSize} />,
  png: <IconFileTypePng size={ICON_SETTINGS.fileSize} />,
  jpg: <IconFileTypeJpg size={ICON_SETTINGS.fileSize} />,
  jpeg: <IconFileTypeJpg size={ICON_SETTINGS.fileSize} />,
  xml: <IconFileTypeXml size={ICON_SETTINGS.fileSize} />,
  zip: <IconFileTypeZip size={ICON_SETTINGS.fileSize} />,
  rar: <IconFileTypeZip size={ICON_SETTINGS.fileSize} />,
  jp2: <IconPhoto size={ICON_SETTINGS.fileSize} />,
};

const naturalSort = (arr) =>
  arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

const getFileTypeIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return FILE_ICON_MAP[extension] || <IconFile size={ICON_SETTINGS.fileSize} />;
};

const FileItem = ({ name, content, onFileClick, getEntityForRelativePath }) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  console.log("datasetEntityObj", datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  const activeEntity = useGlobalStore((state) => state.activeEntity);

  const filesEntity = getEntityForRelativePath
    ? getEntityForRelativePath(datasetEntityObj, entityType, content.relativePath)
    : null;

  return (
    <Group
      gap="sm"
      justify="flex-start"
      bg={
        !filesEntity
          ? "transparent"
          : filesEntity === activeEntity
            ? "rgb(227, 242, 253)"
            : "lightgray"
      }
      onClick={() => onFileClick && onFileClick(name, content)}
      onContextMenu={(e) => {
        e.preventDefault();
        console.log("add context menu here");
      }}
      ml="sm"
    >
      {getFileTypeIcon(name)}
      <Text size="sm">{content.relativePath}</Text>
    </Group>
  );
};

const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  getEntityForRelativePath,
  datasetStructureSearchFilter,
}) => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const entityType = useGlobalStore((state) => state.entityType);
  const activeEntity = useGlobalStore((state) => state.activeEntity);
  const foldersEntity = getEntityForRelativePath
    ? getEntityForRelativePath(datasetEntityObj, entityType, content.relativePath)
    : null;

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
  const folderHasFolders = Object.keys(content.folders || {}).length > 0;

  const isViewOnly = !onFileClick || !onFolderClick || !getEntityForRelativePath;

  return (
    <Stack gap={1} ml="xs">
      <Group gap={3} justify="flex-start" ref={ref}>
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
        {!isViewOnly && (
          <Tooltip label="Select folder" zIndex={2999}>
            <Checkbox
              readOnly
              onClick={() => onFolderClick(name, content, "folder-select")}
              checked={foldersEntity}
              color={foldersEntity === activeEntity ? "blue" : "gray"}
            />
          </Tooltip>
        )}
        <Text size="md" px={5} onClick={toggleFolder}>
          {name}
        </Text>
        <Space w="lg" />
        {!isViewOnly && (
          <>
            {folderHasFiles && (
              <Tooltip label="Select all files in this folder" zIndex={2999}>
                <IconFileDownload
                  size={20}
                  onClick={() => onFolderClick(name, content, "folder-files-select")}
                />
              </Tooltip>
            )}
            <Tooltip label="Select this folder and ALL contents" zIndex={2999}>
              <IconSelect
                size={20}
                onClick={() => onFolderClick(name, content, "folder-recursive-select")}
              />
            </Tooltip>
          </>
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
                getEntityForRelativePath={getEntityForRelativePath}
              />
            ))}
            {naturalSort(Object.keys(content?.folders || {})).map((folderName) => (
              <FolderItem
                key={folderName}
                name={folderName}
                content={content.folders[folderName]}
                onFolderClick={onFolderClick}
                onFileClick={onFileClick}
                getEntityForRelativePath={getEntityForRelativePath}
                datasetStructureSearchFilter={datasetStructureSearchFilter}
              />
            ))}
          </>
        )}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({ onFolderClick, onFileClick, getEntityForRelativePath }) => {
  const { renderDatasetStructureJSONObj, datasetStructureSearchFilter } = useGlobalStore(
    (state) => ({
      renderDatasetStructureJSONObj: state.renderDatasetStructureJSONObj,
      datasetStructureSearchFilter: state.datasetStructureSearchFilter,
    })
  );

  const renderObjIsEmpty =
    !renderDatasetStructureJSONObj ||
    (Object.keys(renderDatasetStructureJSONObj?.folders).length === 0 &&
      Object.keys(renderDatasetStructureJSONObj?.files).length === 0);

  const handleSearchChange = (event) => {
    setDatasetstructureSearchFilter(event.target.value);
  };

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
                  onFileClick={onFileClick}
                  getEntityForRelativePath={getEntityForRelativePath}
                />
              )
            )}
            {naturalSort(Object.keys(renderDatasetStructureJSONObj?.folders || {})).map(
              (folderName) => (
                <FolderItem
                  key={folderName}
                  name={folderName}
                  content={renderDatasetStructureJSONObj.folders[folderName]}
                  onFolderClick={onFolderClick}
                  onFileClick={onFileClick}
                  getEntityForRelativePath={getEntityForRelativePath}
                  datasetStructureSearchFilter={datasetStructureSearchFilter}
                />
              )
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
