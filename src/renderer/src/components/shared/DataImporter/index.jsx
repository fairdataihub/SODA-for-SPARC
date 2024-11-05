import { Group, Text, rem } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const DataImporter = () => {
  const allowDrop = (event) => {
    event.preventDefault();
  };

  const handleDrop = async (files) => {
    // Create a synthetic drop event with the dropped files (digestable by the window.drop function)
    const syntheticDropEvent = {
      preventDefault: () => {},
      dataTransfer: { files }, // Pass dropped files directly
    };

    // Call your existing window.drop function with the constructed event
    await window.drop(syntheticDropEvent);
  };

  const handleClick = async (event) => {
    event.preventDefault();
    window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog");
  };

  return (
    <FullWidthContainer>
      <Dropzone
        onDrop={handleDrop}
        onClick={handleClick}
        onReject={(files) => console.log("Rejected files:", files)}
        onDragOver={allowDrop}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconUpload
              style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-blue-6)" }}
              stroke={1.5}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX
              style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-red-6)" }}
              stroke={1.5}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto
              style={{ width: rem(52), height: rem(52), color: "var(--mantine-color-dimmed)" }}
              stroke={1.5}
            />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              Drag images here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach as many files as you like, each file should not exceed 5 MB
            </Text>
          </div>
        </Group>
      </Dropzone>
      <DatasetTreeViewRenderer highLevelFolder="primary" />
    </FullWidthContainer>
  );
};

export default DataImporter;
