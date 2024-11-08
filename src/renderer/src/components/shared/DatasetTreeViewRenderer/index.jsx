import { useEffect, useState } from "react";
import { Collapse, Text, Stack, UnstyledButton, TextInput, Flex } from "@mantine/core";
import { useHover, useDebouncedValue } from "@mantine/hooks";
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
  getFileBackgroundColor,
  defaultOpenAllFolders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  useEffect(() => {
    if (defaultOpenAllFolders) {
      setIsOpen(true);
    }
  }, [defaultOpenAllFolders]);

  const toggleFolder = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Stack gap={1} ml="sm">
      <Flex align="center" gap="sm">
        {isOpen || defaultOpenAllFolders ? (
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
          style={{ backgroundColor: hovered ? "gray" : "transparent", borderRadius: "4px" }}
          onClick={() => {
            toggleFolder();
            if (onFolderClick) onFolderClick(name, content);
          }}
        >
          <Text size="lg">{name}</Text>
        </UnstyledButton>
      </Flex>
      <Collapse in={isOpen}>
        {isOpen && ( // Only map and render children when the folder is open
          <>
            {Object.keys(content?.folders || {}).map((folderName) => (
              <FolderItem
                key={folderName}
                name={folderName}
                content={content.folders[folderName]}
                onFolderClick={onFolderClick}
                onFileClick={onFileClick}
                getFileBackgroundColor={getFileBackgroundColor}
                defaultOpenAllFolders={defaultOpenAllFolders}
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

const folderObjIsIncludedInSearchFilter = (folderObj, searchFilter) => {
  const relativePath = folderObj["relativePath"].toLowerCase();

  // Check if the folder's relativePath matches the search filter
  if (relativePath.includes(searchFilter)) return true;

  // Recursively check subfolders
  return (
    Object.keys(folderObj?.folders || {}).some((subFolder) =>
      folderObjIsIncludedInSearchFilter(folderObj.folders[subFolder], searchFilter)
    ) ||
    // Check if any files' relativePaths match the search filter
    Object.keys(folderObj?.files || {}).some((fileName) =>
      folderObj?.files[fileName]["relativePath"].toLowerCase().includes(searchFilter)
    )
  );
};

const DatasetTreeViewRenderer = ({ onFolderClick, onFileClick, getFileBackgroundColor }) => {
  const renderDatasetStructureJSONObj = useGlobalStore(
    (state) => state.renderDatasetStructureJSONObj
  );
  const [localSearch, setLocalSearch] = useState(""); // Local state for immediate input
  const [debouncedSearch] = useDebouncedValue(localSearch, 200);

  // Sync debounced value with the store when it changes
  useEffect(() => {
    setDatasetstructureSearchFilter(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearchChange = (event) => {
    setLocalSearch(event.target.value); // Update local state on input change
  };

  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  console.log("Filtered structure:", JSON.stringify(renderDatasetStructureJSONObj, null, 2));

  return (
    <Stack gap={1}>
      <TextInput
        label="Search files and folders:"
        placeholder="Search files and folders..."
        value={localSearch}
        onChange={handleSearchChange}
        leftSection={<IconSearch stroke={1.5} />}
      />
      {renderDatasetStructureJSONObj && (
        <>
          {Object.keys(renderDatasetStructureJSONObj?.folders || {}).map((folderName) => (
            <FolderItem
              key={folderName}
              name={folderName}
              content={renderDatasetStructureJSONObj.folders[folderName]}
              onFolderClick={onFolderClick}
              onFileClick={onFileClick}
              getFileBackgroundColor={getFileBackgroundColor}
              defaultOpenAllFolders={localSearch !== ""}
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
  );
};

export default DatasetTreeViewRenderer;
