import { useState } from "react";
import { Collapse, Text, Stack, UnstyledButton } from "@mantine/core";
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconPhoto,
  IconFileTypeBmp,
  IconFileTypeCsv,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypePng,
  IconFileTypeSvg,
  IconFileTypeTxt,
  IconFileTypeXls,
  IconFileTypeXml,
  IconFileTypeZip,
} from "@tabler/icons-react";
// Constants
const folderColor = "#ADD8E6";
const folderIconSize = 18;
const fileIconSize = 15;
// File extension to icon map
const fileIconMap = {
  csv: <IconFileTypeCsv size={fileIconSize} />,
  xls: <IconFileTypeXls size={fileIconSize} />,
  xlsx: <IconFileTypeXls size={fileIconSize} />,
  txt: <IconFileTypeTxt size={fileIconSize} />,
  doc: <IconFileTypeDoc size={fileIconSize} />,
  docx: <IconFileTypeDocx size={fileIconSize} />,
  pdf: <IconFileTypePdf size={fileIconSize} />,
  png: <IconFileTypePng size={fileIconSize} />,
  jpg: <IconFileTypeJpg size={fileIconSize} />,
  jpeg: <IconFileTypeJpg size={fileIconSize} />,
  bmp: <IconFileTypeBmp size={fileIconSize} />,
  svg: <IconFileTypeSvg size={fileIconSize} />,
  gif: <IconPhoto size={fileIconSize} />,
  webp: <IconPhoto size={fileIconSize} />,
  tiff: <IconPhoto size={fileIconSize} />,
  heic: <IconPhoto size={fileIconSize} />,
  heif: <IconPhoto size={fileIconSize} />,
  avif: <IconPhoto size={fileIconSize} />,
  jp2: <IconPhoto size={fileIconSize} />,
  jxr: <IconPhoto size={fileIconSize} />,
  wdp: <IconPhoto size={fileIconSize} />,
  xml: <IconFileTypeXml size={fileIconSize} />,
  zip: <IconFileTypeZip size={fileIconSize} />,
  rar: <IconFileTypeZip size={fileIconSize} />,
};
const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  return fileIconMap[extension] || <IconFile size={fileIconSize} />;
};
const FileView = ({ name }) => (
  <div style={{ paddingLeft: 10, display: "flex", alignItems: "center", gap: 5 }}>
    {getFileIcon(name)}
    <Text>{name}</Text>
  </div>
);
const FolderView = ({ name, content }) => {
  const [folderIsOpen, setFolderIsOpen] = useState(false);
  const toggleFolder = () => {
    setFolderIsOpen((prev) => !prev);
  };
  return (
    <Stack gap={1}>
      <UnstyledButton
        onClick={toggleFolder}
        style={{ display: "flex", alignItems: "center", gap: 3 }}
      >
        {folderIsOpen ? (
          <IconFolderOpen size={folderIconSize} color={folderColor} />
        ) : (
          <IconFolder size={folderIconSize} color={folderColor} />
        )}
        <Text size="lg">{name}</Text>
      </UnstyledButton>
      <Collapse in={folderIsOpen} ml="sm">
        {Object.keys(content.folders || {}).map((folderName) => (
          <FolderView key={folderName} name={folderName} content={content.folders[folderName]} />
        ))}
        {Object.keys(content.files || {}).map((fileName) => (
          <FileView key={fileName} name={fileName} />
        ))}
      </Collapse>
    </Stack>
  );
};
// Main component
const DatasetTreeViewRenderer = ({ datasetStructure }) => {
  if (!datasetStructure?.["folders"] || !datasetStructure?.["files"]) return null;
  return (
    <Stack gap={1}>
      {Object.keys(datasetStructure.files || {}).map((fileName) => (
        <FileView key={fileName} name={fileName} />
      ))}
      {Object.keys(datasetStructure.folders || {}).map((folderName) => (
        <FolderView
          key={folderName}
          name={folderName}
          content={datasetStructure.folders[folderName]}
        />
      ))}
    </Stack>
  );
};

export default DatasetTreeViewRenderer;
