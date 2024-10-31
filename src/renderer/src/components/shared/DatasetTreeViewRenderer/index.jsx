import { useState } from "react";
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
const FileItem = ({ name, content, onFileClick, getFileBackgroundColor }) => (
  <Flex
    align="center"
    gap="sm"
    bg={getFileBackgroundColor(content.relativePath)}
    onClick={() => onFileClick(name, content)}
  >
    {getFileTypeIcon(name)}
    <Text>{name}</Text>
  </Flex>
);

// FolderItem component
const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  getFileBackgroundColor,
  searchFilter,
}) => {
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
          onClick={() => onFolderClick(name, content)}
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
            searchFilter={searchFilter}
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

// Recursive function to filter folders and files, marking parent folders if a child matches
const filterStructure = (structure, searchFilter) => {
  const lowerCaseFilter = searchFilter.toLowerCase();

  const folders = Object.entries(structure.folders || {}).reduce((acc, [name, content]) => {
    const filteredContent = filterStructure(content, searchFilter);
    if (filteredContent || name.toLowerCase().includes(lowerCaseFilter)) {
      acc[name] = { ...content, ...filteredContent };
    }
    return acc;
  }, {});

  const files = Object.entries(structure.files || {}).filter(([name]) =>
    name.toLowerCase().includes(lowerCaseFilter)
  );

  if (Object.keys(folders).length || files.length) {
    return { filteredFolders: Object.entries(folders), filteredFiles: files };
  }
  return null;
};

// Main component
const DatasetTreeView = ({
  datasetStructure,
  onFolderClick,
  onFileClick,
  getFileBackgroundColor,
}) => {
  const datasetStructureSearchFilter = useGlobalStore(
    (state) => state.datasetStructureSearchFilter
  );

  const handleSearchChange = (event) => setDatasetstructureSearchFilter(event.target.value);

  const filteredStructure = filterStructure(datasetStructure, datasetStructureSearchFilter);

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
          searchFilter={datasetStructureSearchFilter}
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
