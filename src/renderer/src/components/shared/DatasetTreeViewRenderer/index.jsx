import { StrictMode, useState } from "react";
import { Collapse, Text, Stack, UnstyledButton, TextInput, Flex } from "@mantine/core";
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

// Constants
const FOLDER_ICON_COLOR = "#ADD8E6";
const FOLDER_ICON_SIZE = 18;
const FILE_ICON_SIZE = 15;

// File extension to icon map
const fileIconMap = {
  csv: <IconFileTypeCsv size={FILE_ICON_SIZE} />,
  xls: <IconFileTypeXls size={FILE_ICON_SIZE} />,
  xlsx: <IconFileTypeXls size={FILE_ICON_SIZE} />,
  txt: <IconFileTypeTxt size={FILE_ICON_SIZE} />,
  doc: <IconFileTypeDoc size={FILE_ICON_SIZE} />,
  docx: <IconFileTypeDocx size={FILE_ICON_SIZE} />,
  pdf: <IconFileTypePdf size={FILE_ICON_SIZE} />,
  png: <IconFileTypePng size={FILE_ICON_SIZE} />,
  jpg: <IconFileTypeJpg size={FILE_ICON_SIZE} />,
  jpeg: <IconFileTypeJpg size={FILE_ICON_SIZE} />,
  xml: <IconFileTypeXml size={FILE_ICON_SIZE} />,
  zip: <IconFileTypeZip size={FILE_ICON_SIZE} />,
  rar: <IconFileTypeZip size={FILE_ICON_SIZE} />,
  jp2: <IconPhoto size={FILE_ICON_SIZE} />,
};

// Retrieve icon based on file extension
const getFileTypeIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return fileIconMap[extension] || <IconFile size={FILE_ICON_SIZE} />;
};

// FileItem component
const FileItem = ({ name, content, onFileClick, getFileBackgroundColor }) => {
  const handleClick = () => {
    if (onFileClick) {
      onFileClick(name, content);
    } else {
      console.log("File clicked:", name, content); // Default action if no handler is provided
    }
  };

  const handleFileBackgroundColor = (content) => {
    if (getFileBackgroundColor) {
      return getFileBackgroundColor(content.relativePath);
    }
    return "transparent";
  };

  return (
    <Flex
      align="center"
      gap="sm"
      bg={handleFileBackgroundColor(content)}
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
            size={FOLDER_ICON_SIZE}
            color={FOLDER_ICON_COLOR}
            onClick={toggleFolder}
          />
        ) : (
          <IconFolder size={FOLDER_ICON_SIZE} color={FOLDER_ICON_COLOR} onClick={toggleFolder} />
        )}
        <UnstyledButton
          ref={ref}
          style={{
            backgroundColor: hovered ? "gray" : "transparent",
            borderRadius: "4px",
          }}
          onClick={() => {
            if (onFolderClick) {
              onFolderClick(name, content);
            } else {
              toggleFolder(); // Default action if no handler is provided
            }
          }}
        >
          <Text size="lg">{name}</Text>
        </UnstyledButton>
      </Flex>
      <Collapse in={isOpen}>
        {content.filteredFolders?.map(([folderName, folderContent]) => (
          <FolderItem
            key={folderName}
            name={folderName}
            content={folderContent}
            onFolderClick={onFolderClick}
            onFileClick={onFileClick}
            getFileBackgroundColor={getFileBackgroundColor}
          />
        ))}
        {content.filteredFiles?.map(([fileName, fileContent]) => (
          <FileItem
            key={fileName}
            name={fileName}
            content={fileContent}
            onFileClick={onFileClick}
            getFileBackgroundColor={getFileBackgroundColor}
          />
        ))}
      </Collapse>
    </Stack>
  );
};

const filterStructure = (structure, searchFilter) => {
  console.log("Filtering structure:");
  console.log(JSON.stringify(structure, null, 2));
  const lowercaseFilter = searchFilter.toLowerCase();

  const checkIfFolderContainsSearchFilter = (folderObj) => {
    if (folderObj["relativePath"].toLowerCase().includes(lowercaseFilter)) {
      return true;
    }
    for (const folderName of Object.keys(folderObj["folders"])) {
      if (checkIfFolderContainsSearchFilter(folderContent)) {
        return true;
      }
    }
    for (const fileName of Object.keys(folderObj["files"])) {
      if (fileName.toLowerCase().includes(lowercaseFilter)) {
        return true;
      }
    }
    return false;
  };

  for (const folder in structure["folders"]) {
    console.log("Checking folder:", folder);
    console.log(checkIfFolderContainsSearchFilter(structure["folders"][folder]));
  }
};
const DatasetTreeView = ({
  onFolderClick,
  onFileClick,
  getFileBackgroundColor,
  highLevelFolder,
}) => {
  const datasetStructureJSONObj = useGlobalStore((state) => state.datasetStructureJSONObj);
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  const handleSearchChange = (event) => setDatasetstructureSearchFilter(event.target.value);

  if (!datasetStructureJSONObj) {
    // If dataset structure is not available, return null
    return null;
  }

  let filteredStructure = filterStructure(datasetStructureJSONObj, datasetStructureSearchFilter);
  console.log("Filtered structure:", filteredStructure);

  if (highLevelFolder && filteredStructure) {
    console.log(filteredStructure);
    console.log(highLevelFolder);
    filteredStructure = filteredStructure["folders"][highLevelFolder];
  }

  return (
    <Stack gap={1}>
      <TextInput
        label="Search files and folders:"
        placeholder="Search files and folders..."
        value={datasetStructureSearchFilter}
        onChange={handleSearchChange}
        leftSection={<IconSearch stroke={1.5} />}
      />
      {filteredStructure?.filteredFolders?.map(([folderName, folderContent]) => (
        <FolderItem
          key={folderName}
          name={folderName}
          content={folderContent}
          onFolderClick={onFolderClick}
          onFileClick={onFileClick}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
      {filteredStructure?.filteredFiles?.map(([fileName, fileContent]) => (
        <FileItem
          key={fileName}
          name={fileName}
          content={fileContent}
          onFileClick={onFileClick}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
    </Stack>
  );
};

export default DatasetTreeView;
