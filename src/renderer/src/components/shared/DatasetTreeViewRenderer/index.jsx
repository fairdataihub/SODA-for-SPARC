import { useState, useEffect } from "react";
import {
  Collapse,
  Text,
  Stack,
  Group,
  Popover,
  UnstyledButton,
  TextInput,
  Flex,
  Button,
  Paper,
  Checkbox,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconPhoto,
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
  IconSearch,
  IconSelect,
} from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import { setDatasetstructureSearchFilter } from "../../../stores/slices/datasetTreeViewSlice";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 15,
  fileSize: 13,
};

// File extension icon mapping
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

// Function to get file type icon
const getFileTypeIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return FILE_ICON_MAP[extension] || <IconFile size={ICON_SETTINGS.fileSize} />;
};

// FileItem component
const FileItem = ({ name, content, onFileClick, getEntitySelectedStatus }) => {
  const fileIsSlected = getEntitySelectedStatus(content.relativePath);
  return (
    <Group
      gap="sm"
      justify="flex-start"
      bg={fileIsSlected ? "gray" : "transparent"}
      onClick={() => onFileClick && onFileClick(name, content)}
      ml="sm"
    >
      {getFileTypeIcon(name)}
      <Text size="sm">{name}</Text>
    </Group>
  );
};

const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  getEntitySelectedStatus,
  datasetStructureSearchFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  useEffect(() => {
    if (datasetStructureSearchFilter !== "") {
      setIsOpen(true);
    }
  }, [datasetStructureSearchFilter]);

  const toggleFolder = () => {
    setIsOpen((prev) => !prev);
  };

  const isFolderEmpty =
    Object.keys(content.folders || {}).length === 0 &&
    Object.keys(content.files || {}).length === 0;

  const folderIsSlected = getEntitySelectedStatus
    ? getEntitySelectedStatus(content.relativePath)
    : false;

  return (
    <Stack gap={1} ml="xs">
      <Group gap={4} justify="flex-start">
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
        <UnstyledButton
          ref={ref}
          style={{ borderRadius: "4px" }}
          px="2"
          bg={folderIsSlected ? "gray" : hovered ? "gray" : "transparent"}
          onClick={toggleFolder} // Only toggles open/close, not selecting
        >
          <Text size="md" px={1}>
            {name}
          </Text>
        </UnstyledButton>
        <Checkbox onClick={() => onFolderClick(name, content, false)} checked={folderIsSlected} />
        <IconSelect size={20} onClick={() => onFolderClick(name, content, true)} />
      </Group>
      <Collapse in={isOpen}>
        {isOpen && !isFolderEmpty && (
          <>
            {Object.keys(content?.folders || {}).map((folderName) => (
              <FolderItem
                key={folderName}
                name={folderName}
                content={content.folders[folderName]}
                onFolderClick={onFolderClick}
                onFileClick={onFileClick}
                getEntitySelectedStatus={getEntitySelectedStatus}
                datasetStructureSearchFilter={datasetStructureSearchFilter}
              />
            ))}
            {Object.keys(content?.files || {}).map((fileName) => (
              <FileItem
                key={fileName}
                name={fileName}
                content={content.files[fileName]}
                onFileClick={onFileClick}
                getEntitySelectedStatus={getEntitySelectedStatus}
              />
            ))}
          </>
        )}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({ onFolderClick, onFileClick, getEntitySelectedStatus }) => {
  console.log("onFolderClick", onFolderClick);
  console.log("onFileClick", onFileClick);
  console.log("getEntitySelectedStatus", getEntitySelectedStatus);
  const renderDatasetStructureJSONObj = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObj
  );

  const renderObjIsEmpty =
    !renderDatasetStructureJSONObj ||
    (Object.keys(renderDatasetStructureJSONObj?.folders).length === 0 &&
      Object.keys(renderDatasetStructureJSONObj?.files).length === 0);

  const handleSearchChange = (event) => {
    console.log("Search filter set:", event.target.value);
    setDatasetstructureSearchFilter(event.target.value);
  };

  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  return (
    <Paper padding="md" shadow="sm" radius="md" mih={200} my="md">
      <Stack gap={1} style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}>
        <TextInput
          label="Search files and folders:"
          placeholder="Search files and folders..."
          value={datasetStructureSearchFilter}
          onChange={handleSearchChange}
          leftSection={<IconSearch stroke={1.5} />}
        />
        {renderObjIsEmpty ? (
          <div>Search filter no results</div>
        ) : (
          <>
            {Object.keys(renderDatasetStructureJSONObj?.folders || {}).map((folderName) => (
              <FolderItem
                key={folderName}
                name={folderName}
                content={renderDatasetStructureJSONObj.folders[folderName]}
                onFolderClick={onFolderClick}
                onFileClick={onFileClick}
                getEntitySelectedStatus={getEntitySelectedStatus}
                datasetStructureSearchFilter={datasetStructureSearchFilter}
              />
            ))}
            {Object.keys(renderDatasetStructureJSONObj?.files || {}).map((fileName) => (
              <FileItem
                key={fileName}
                name={fileName}
                content={renderDatasetStructureJSONObj.files[fileName]}
                onFileClick={onFileClick}
                getEntitySelectedStatus={getEntitySelectedStatus}
              />
            ))}
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
