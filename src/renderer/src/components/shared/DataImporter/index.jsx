import { Group, Text } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const DataImporter = ({ dataType, relativeFolderPathToImportDataInto }) => {
  // Handles preventing default drop action
  const allowDrop = (event) => event.preventDefault();

  // Creates a synthetic drop event for window.drop
  const createSyntheticDropEvent = (files) => ({
    preventDefault: () => {},
    dataTransfer: { files },
  });

  // Handles the file drop logic
  const handleDrop = async (files) => {
    console.log("Dropped files:", files);
    const syntheticDropEvent = createSyntheticDropEvent(files);
    await window.drop(syntheticDropEvent);
  };

  // Opens the dataset dialog on click
  const handleClick = async (event) => {
    event.preventDefault();
    console.log("relativeFolderPathToImportDataInto", relativeFolderPathToImportDataInto);
    window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog", {
      importRelativePath: relativeFolderPathToImportDataInto,
    });
  };

  return (
    <FullWidthContainer>
      <Dropzone
        onDrop={handleDrop}
        onClick={handleClick}
        onReject={(files) => console.log("Rejected files:", files)}
        onDragOver={allowDrop}
        mb="lg"
      >
        <Group justify="center" gap="xl" mih={140} style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFile size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              {dataType
                ? `Drag ${dataType} data here or click to import`
                : "Drag and drop files or folders or click to import"}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Import all folders you would like to include in the dataset.
            </Text>
          </div>
        </Group>
      </Dropzone>
      <DatasetTreeViewRenderer
        allowStructureEditing={true}
        hideSearchBar={true}
        entityType={null}
      />
    </FullWidthContainer>
  );
};

export default DataImporter;
