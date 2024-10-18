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

const DatasetTreeViewRenderer = ({ datasetStructure }) => {
  if (!datasetStructure) return null;
  const folderColor = "#ADD8E6";
  const folderIconSize = 18;
  const fileIconSize = 15;

  // File extension to icon map
  const fileIconMap = {
    // CSV and Excel files
    csv: <IconFileTypeCsv size={fileIconSize} />,
    xls: <IconFileTypeXls size={fileIconSize} />,
    xlsx: <IconFileTypeXls size={fileIconSize} />,

    // Text files
    txt: <IconFileTypeTxt size={fileIconSize} />,

    // Document files
    doc: <IconFileTypeDoc size={fileIconSize} />,
    docx: <IconFileTypeDocx size={fileIconSize} />,

    // PDF
    pdf: <IconFileTypePdf size={fileIconSize} />,

    // Image files
    png: <IconFileTypePng size={fileIconSize} />,
    jpg: <IconFileTypeJpg size={fileIconSize} />,
    jpeg: <IconFileTypeJpg size={fileIconSize} />,
    bmp: <IconFileTypeBmp size={fileIconSize} />,
    svg: <IconFileTypeSvg size={fileIconSize} />,

    // General image/photo formats
    gif: <IconPhoto size={fileIconSize} />,
    webp: <IconPhoto size={fileIconSize} />,
    tiff: <IconPhoto size={fileIconSize} />,
    heic: <IconPhoto size={fileIconSize} />,
    heif: <IconPhoto size={fileIconSize} />,
    avif: <IconPhoto size={fileIconSize} />,
    jp2: <IconPhoto size={fileIconSize} />,
    jxr: <IconPhoto size={fileIconSize} />,
    wdp: <IconPhoto size={fileIconSize} />,

    // XML
    xml: <IconFileTypeXml size={fileIconSize} />,

    // Compressed file types
    zip: <IconFileTypeZip size={fileIconSize} />,
    rar: <IconFileTypeZip size={fileIconSize} />,
  };

  // Map file extensions to icons, default to a generic file icon
  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    return fileIconMap[extension] || <IconFile size={fileIconSize} />;
  };

  const FolderView = ({ name, content }) => {
    const [folderIsOpen, setFolderIsOpen] = useState(false);

    const toggleFolder = () => {
      setFolderIsOpen((prev) => !prev);
    };

    const FileView = ({ name }) => {
      return (
        <div style={{ paddingLeft: 10, display: "flex", alignItems: "center", gap: 5 }}>
          {getFileIcon(name)}
          <Text>{name}</Text>
        </div>
      );
    };

    return (
      <Stack gap={1}>
        <UnstyledButton
          onClick={toggleFolder}
          style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}
        >
          {folderIsOpen ? (
            <IconFolderOpen size={folderIconSize} color={folderColor} />
          ) : (
            <IconFolder size={folderIconSize} color={folderColor} />
          )}
          <Text size="lg">{name}</Text>
        </UnstyledButton>
        <Collapse in={folderIsOpen}>
          <div style={{ paddingLeft: 10 }}>
            {Object.keys(content.folders || {}).map((folderName) => (
              <FolderView
                key={folderName}
                name={folderName}
                content={content.folders[folderName]}
              />
            ))}
            {Object.keys(content.files || {}).map((fileName) => (
              <FileView key={fileName} name={fileName} />
            ))}
          </div>
        </Collapse>
      </Stack>
    );
  };

  const rootFolders = Object.keys(datasetStructure.folders || {});
  const rootFiles = Object.keys(datasetStructure.files || {});

  return (
    <Stack gap={1}>
      {rootFolders.map((folderName) => (
        <FolderView
          key={folderName}
          name={folderName}
          content={datasetStructure.folders[folderName]}
        />
      ))}
      {rootFiles.map((fileName) => (
        <FileView key={fileName} name={fileName} />
      ))}
    </Stack>
  );
};

export default DatasetTreeViewRenderer;
