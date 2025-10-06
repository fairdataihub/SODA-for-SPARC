import { Group, Text, Box } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import StateDisplayContainer from "../../containers/StateDisplayContainer";

const DataImporter = ({ dataImporterId }) => {
  return (
    <FullWidthContainer>
      <Box w="100%" m={0} p={0} id={dataImporterId}>
        <Dropzone
          onDrop={(event) => {
            event.preventDefault();
          }}
          onReject={(event) => {
            event.preventDefault();
            console.error("Rejected files:", files);
          }}
          onClick={(event) => event.preventDefault()}
          mb="lg"
        >
          <Group justify="center" gap="xl" mih={140} style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconUpload size={52} color="var(--mantine-color-primary-6)" stroke={1.5} />
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
      {dataImporterId === "gm-data-importer-dropzone" && (
        <DatasetTreeViewRenderer
          allowStructureEditing={true}
          hideSearchBar={true}
          entityType={null}
          fileExplorerId="guided-unstructured-data-import-tab"
        />
      )}
      {dataImporterId === "ffm-data-importer-dropzone" && (
        <StateDisplayContainer id="ffm-data-importer-dropzone" />
      )}
    </FullWidthContainer>
  );
};

export default DataImporter;
