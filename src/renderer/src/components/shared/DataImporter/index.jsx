import { Group, Text, Box } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const DataImporter = ({ relativeFolderPathToImportDataInto }) => {
  // Handles preventing default drop action
  const allowDrop = (event) => event.preventDefault();

  // Handles the file drop logic
  const handleDrop = async () => {};

  // Opens the dataset dialog on click
  const handleClick = async (event) => {};

  return (
    <FullWidthContainer>
      <Box w="100%" m={0} p={0} id="data-importer-dropzone">
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
                Drag and drop files or folders or click to import
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Import all folders you would like to include in the dataset.
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Box>
      <DatasetTreeViewRenderer
        allowStructureEditing={true}
        hideSearchBar={true}
        entityType={null}
      />
    </FullWidthContainer>
  );
};

export default DataImporter;
