import React, { useState } from "react";
import { Collapse, Button, Group, Text } from "@mantine/core";

const DatasetTreeViewRenderer = ({ datasetStructure }) => {
  if (!datasetStructure) return null;

  const FolderView = ({ name, content }) => {
    const [opened, setOpened] = useState(false);

    const toggleFolder = () => {
      setOpened((prev) => !prev);
    };

    return (
      <div style={{ paddingLeft: 20 }}>
        <Button onClick={toggleFolder} variant="light" fullWidth style={{ marginTop: 5 }}>
          {opened ? "📂" : "📁"} {name}
        </Button>
        <Collapse in={opened}>
          {/* Recursively render subfolders and files */}
          <div style={{ paddingLeft: 20 }}>
            {Object.keys(content.folders || {}).map((folderName) => (
              <FolderView
                key={folderName}
                name={folderName}
                content={content.folders[folderName]}
              />
            ))}
            {Object.keys(content.files || {}).map((fileName) => (
              <Group key={fileName} spacing="xs" style={{ paddingLeft: 20 }}>
                <Text>📄 {fileName}</Text>
              </Group>
            ))}
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <div>
      {Object.keys(datasetStructure.folders).map((folderName) => (
        <FolderView
          key={folderName}
          name={folderName}
          content={datasetStructure.folders[folderName]}
        />
      ))}
    </div>
  );
};
export default DatasetTreeViewRenderer;
