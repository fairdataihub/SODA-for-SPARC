import { useState, useEffect } from "react";
import {
  Collapse,
  Text,
  Stack,
  UnstyledButton,
  TextInput,
  Flex,
  Button,
  Paper,
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
} from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import { setDatasetstructureSearchFilter } from "../../../stores/slices/datasetTreeViewSlice";

const ICON_SETTINGS = {
  folderColor: "#ADD8E6",
  folderSize: 18,
  fileSize: 15,
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
const FileItem = ({ name, content, onFileClick, getFileBackgroundColor }) => (
  <Flex
    align="center"
    gap="sm"
    bg={getFileBackgroundColor?.(content.relativePath) || "transparent"}
    onClick={() => onFileClick?.(name, content)}
    ml="sm"
  >
    {getFileTypeIcon(name)}
    <Text>{name}</Text>
  </Flex>
);

const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  getFolderBackgroundColor,
  getFileBackgroundColor,
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

  return (
    <Stack gap={1} ml="sm">
      <Flex align="center" gap="sm">
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
          bg={getFileBackgroundColor?.(content.relativePath) || "transparent"}
          onClick={toggleFolder} // Only toggles open/close, not selecting
        >
          <Text size="lg">{name}</Text>
        </UnstyledButton>
        <Button.Group>
          <Button
            size="compact-xs"
            variant="default"
            onClick={() => onFolderClick && onFolderClick(name, content, true)}
          >
            Select folder and children
          </Button>
          <Button
            size="compact-xs"
            variant="default"
            onClick={() => onFolderClick && onFolderClick(name, content, true)}
          >
            Select folder
          </Button>
          <Button
            size="compact-xs"
            variant="default"
            onClick={() => onFolderClick && onFolderClick(name, content, true)}
          >
            Select children
          </Button>
        </Button.Group>
      </Flex>
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
                getFolderBackgroundColor={getFolderBackgroundColor}
                getFileBackgroundColor={getFileBackgroundColor}
                datasetStructureSearchFilter={datasetStructureSearchFilter}
              />
            ))}
            {Object.keys(content?.files || {}).map((fileName) => (
              <FileItem
                key={fileName}
                name={fileName}
                content={content.files[fileName]}
                onFileClick={onFileClick}
                getFileBackgroundColor={getFileBackgroundColor}
              />
            ))}
          </>
        )}
      </Collapse>
    </Stack>
  );
};

const DatasetTreeViewRenderer = ({
  onFolderClick,
  onFileClick,
  getFolderBackgroundColor,
  getFileBackgroundColor,
}) => {
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
      <Flex justify="space-between" mb="md">
        <Button variant="light">Select All</Button>
        <Button color="red" variant="light">
          Delete All
        </Button>
      </Flex>
      <Stack gap={1} style={{ maxHeight: 400, overflowY: "auto" }}>
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
                getFolderBackgroundColor={getFolderBackgroundColor}
                getFileBackgroundColor={getFileBackgroundColor}
                datasetStructureSearchFilter={datasetStructureSearchFilter}
              />
            ))}
            {Object.keys(renderDatasetStructureJSONObj?.files || {}).map((fileName) => (
              <FileItem
                key={fileName}
                name={fileName}
                content={renderDatasetStructureJSONObj.files[fileName]}
                onFileClick={onFileClick}
                getFileBackgroundColor={getFileBackgroundColor}
              />
            ))}
          </>
        )}
      </Stack>
    </Paper>
  );
};

export default DatasetTreeViewRenderer;
