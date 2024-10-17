import { useState } from "react";
import { Collapse, Button, Group, Text, Stack, UnstyledButton } from "@mantine/core";
import { IconFolder, IconFolderOpen } from "@tabler/icons-react";

const DatasetTreeViewRenderer = ({ datasetStructure }) => {
  if (!datasetStructure) return null;

  const FolderView = ({ name, content }) => {
    const [folderIsOpen, setFolderIsOpen] = useState(false);

    const toggleFolder = () => {
      setFolderIsOpen((prev) => !prev);
    };
    const FileView = ({ name }) => {
      return (
        <div style={{ paddingLeft: 1 }}>
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
          {folderIsOpen ? <IconFolderOpen /> : <IconFolder />}
          <Text>{name}</Text>
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
