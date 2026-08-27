import { Group, Text, Box } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";
import StateDisplayContainer from "../../containers/StateDisplayContainer";
import classes from "./dataImporter.module.css";
import useGlobalStore from "../../../stores/globalStore";

const DataImporter = ({ dataImporterId }) => {
  const datasetStructuringMode = useGlobalStore((state) => state.datasetStructuringMode);
  return (
    <FullWidthContainer className={classes["di"]}>
      <Box w="100%" m={0} p={0} id={dataImporterId} className={classes["di"]}>
        <Dropzone
          onDrop={(files) => {
            window.log.info("Dropped files:", files);
          }}
          onReject={(files) => {
            window.log.error("Rejected files:", JSON.stringify(files));
          }}
          onClick={(event) => event.preventDefault()}
          mb="lg"
          className={classes["di"]}
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
                {dataImporterId === "ffm-data-importer-dropzone"
                  ? "Drag and drop the folder containing your dataset, or click to select it"
                  : "Drag and drop files or folders or click to import"}
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                {dataImporterId === "ffm-data-importer-dropzone"
                  ? "Select the dataset folder to upload to Pennsieve."
                  : datasetStructuringMode === "entity-buckets"
                    ? "Import data for the selected entity."
                    : "Import all folders you would like to include in the dataset."}
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
