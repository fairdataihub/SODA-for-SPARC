import { useState } from "react";
import { Collapse, Text, Stack, UnstyledButton } from "@mantine/core";
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
} from "@tabler/icons-react";
import { getEntityForRelativePath } from "../../../stores/slices/manifestEntitySelectorSlice";

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
};

const getFileTypeIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return fileIconMap[extension] || <IconFile size={FILE_ICON_SIZE} />;
};

// FileItem component
const FileItem = ({ name, content, onFileClick, getFileBackgroundColor }) => {
  const filesRelativePath = content.relativePath;
  const filesEntity = getEntityForRelativePath("subjects", filesRelativePath);

  const fileBackgroundColor = getFileBackgroundColor(filesRelativePath);
  return (
    <div
      style={{
        paddingLeft: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
        backgroundColor: fileBackgroundColor,
      }}
      onClick={() => onFileClick(name, content)}
    >
      {getFileTypeIcon(name)}
      <Text>{name}</Text>
    </div>
  );
};

// FolderItem component
const FolderItem = ({
  name,
  content,
  onFolderClick,
  onFileClick,
  getFolderBackgroundColor,
  getFileBackgroundColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hovered, ref } = useHover();

  const toggleFolder = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Stack gap={1}>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
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
            padding: "2px 5px",
            borderRadius: "4px",
          }}
          onClick={() => onFolderClick(name, content)}
        >
          <Text size="lg">{name}</Text>
        </UnstyledButton>
      </div>
      <Collapse in={isOpen} ml="xs">
        {Object.keys(content.folders || {}).map((folderName) => (
          <FolderItem
            key={folderName}
            name={folderName}
            content={content.folders[folderName]}
            onFolderClick={onFolderClick}
            onFileClick={onFileClick}
          />
        ))}
        {Object.keys(content.files || {}).map((fileName) => (
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

// Main component
const DatasetTreeView = ({
  datasetStructure,
  onFolderClick,
  onFileClick,
  getFolderBackgroundColor,
  getFileBackgroundColor,
}) =>
  !datasetStructure?.folders && !datasetStructure?.files ? null : (
    <Stack gap={1}>
      {Object.keys(datasetStructure.files || {}).map((fileName) => (
        <FileItem
          key={fileName}
          name={fileName}
          content={datasetStructure.files[fileName]}
          onFileClick={onFileClick}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
      {Object.keys(datasetStructure.folders || {}).map((folderName) => (
        <FolderItem
          key={folderName}
          name={folderName}
          content={datasetStructure.folders[folderName]}
          onFolderClick={onFolderClick}
          onFileClick={onFileClick}
          getFolderBackgroundColor={getFolderBackgroundColor}
          getFileBackgroundColor={getFileBackgroundColor}
        />
      ))}
    </Stack>
  );

export default DatasetTreeView;
