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

// Map file extensions to icons
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

// Retrieve appropriate icon for a file based on its extension
const getFileTypeIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return FILE_ICON_MAP[extension] || <IconFile size={ICON_SETTINGS.fileSize} />;
};

// FileItem component
const FileItem = ({ name, content, onFileClick, getFileBackgroundColor }) => {
  const handleClick = () => onFileClick?.(name, content);

  return (
    <Flex
      align="center"
      gap="sm"
      bg={getFileBackgroundColor?.(content.relativePath) || "transparent"}
      onClick={handleClick}
      ml="sm"
    >
      {getFileTypeIcon(name)}
      <Text>{name}</Text>
    </Flex>
  );
};

// FolderItem component
const FolderItem = ({ name, content, onFolderClick, onFileClick, getFileBackgroundColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  const toggleFolder = () => setIsOpen((prev) => !prev);

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
          style={{
            backgroundColor: hovered ? "gray" : "transparent",
            borderRadius: "4px",
          }}
          onClick={() => onFolderClick?.(name, content) || toggleFolder()}
        >
          <Text size="lg">{name}</Text>
        </UnstyledButton>
      </Flex>
      <Collapse in={isOpen}>
        {Object.keys(content?.folders || {}).map((folderName) => (
          <FolderItem
            key={folderName}
            name={folderName}
            content={content.folders[folderName]}
            onFolderClick={onFolderClick}
            onFileClick={onFileClick}
            getFileBackgroundColor={getFileBackgroundColor}
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
      </Collapse>
    </Stack>
  );
};

// Helper functions for search filtering
const folderObjIsIncludedInSearchFilter = (folderObj, searchFilter) => {
  const relativePath = folderObj["relativePath"].toLowerCase();
  if (relativePath.includes(searchFilter)) return true;

  for (const subFolder of Object.keys(folderObj?.folders || {})) {
    if (folderObjIsIncludedInSearchFilter(folderObj.folders[subFolder], searchFilter)) {
      return true;
    }
  }

  return Object.keys(folderObj?.files || {}).some((fileName) =>
    fileName.toLowerCase().includes(searchFilter)
  );
};

const filterStructure = (structure, searchFilter) => {
  const filteredStructure = JSON.parse(JSON.stringify(structure));
  const lowerCaseSearchFilter = searchFilter.toLowerCase();

  const recursivePrune = (folderObj) => {
    for (const subFolder of Object.keys(folderObj?.folders || {})) {
      if (!folderObjIsIncludedInSearchFilter(folderObj.folders[subFolder], lowerCaseSearchFilter)) {
        delete folderObj.folders[subFolder];
      } else {
        recursivePrune(folderObj.folders[subFolder]);
      }
    }

    for (const fileName of Object.keys(folderObj?.files || {})) {
      if (
        !folderObj?.files[fileName]["relativePath"].toLowerCase().includes(lowerCaseSearchFilter)
      ) {
        delete folderObj.files[fileName];
      }
    }
  };

  recursivePrune(filteredStructure);
  return filteredStructure;
};

// Main DatasetTreeView component
const DatasetTreeView = ({
  onFolderClick,
  onFileClick,
  getFileBackgroundColor,
  highLevelFolder,
}) => {
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  ).toLowerCase();

  const handleSearchChange = (event) => setDatasetstructureSearchFilter(event.target.value);

  if (!datasetStructureJSONObj) {
    console.log("No dataset structure available");
    return "No dataset structure available";
  }

  const filteredStructure = filterStructure(
    JSON.parse(JSON.stringify(datasetStructureJSONObj)),
    datasetStructureSearchFilter
  );

  console.log("Filtered structure:", JSON.stringify(filteredStructure, null, 2));

  return (
    <Stack gap={1}>
      <TextInput
        label="Search files and folders:"
        placeholder="Search files and folders..."
        value={datasetStructureSearchFilter}
        onChange={handleSearchChange}
        leftSection={<IconSearch stroke={1.5} />}
      />
      {Object.keys(filteredStructure?.folders || {}).map((folderName) => (
        <FolderItem
          key={folderName}
          name={folderName}
          content={filteredStructure.folders[folderName]}
          onFolderClick={onFolderClick}
          onFileClick={onFileClick}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
      {Object.keys(highLevelFolder?.files || {}).map((fileName) => (
        <FileItem
          key={fileName}
          name={fileName}
          content={highLevelFolder.files[fileName]}
          onFileClick={onFileClick}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
    </Stack>
  );
};

export default DatasetTreeView;
