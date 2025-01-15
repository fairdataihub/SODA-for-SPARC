import { Group, Text, rem } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import DatasetTreeViewRenderer from "../DatasetTreeViewRenderer";

const DataImporter = () => {
  // Handles preventing default drop action
  const allowDrop = (event) => event.preventDefault();

  // Handles the file drop logic
  const handleDrop = async (files) => {
    const syntheticDropEvent = createSyntheticDropEvent(files);
    await window.drop(syntheticDropEvent);
  };

  // Creates a synthetic drop event for window.drop
  const createSyntheticDropEvent = (files) => ({
    preventDefault: () => {},
    dataTransfer: { files },
  });

  // Opens the dataset dialog on click
  const handleClick = async (event) => {
    event.preventDefault();
    window.electron.ipcRenderer.send("open-folders-organize-datasets-dialog", {
      importRelativePath: "primary/",
    });
  };

  return (
    <FullWidthContainer>
      <Dropzone
        onDrop={handleDrop}
        onClick={handleClick}
        onReject={(files) => console.log("Rejected files:", files)}
        onDragOver={allowDrop}
      >
        <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <IconUpload style={iconStyle("blue")} stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX style={iconStyle("red")} stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFile style={iconStyle("dimmed")} stroke={1.5} />
          </Dropzone.Idle>

          <Text size="xl" inline>
            Drag experimental data here or click to import from your computer
          </Text>
        </Group>
      </Dropzone>
      <DatasetTreeViewRenderer allowStructureEditing={true} />
    </FullWidthContainer>
  );
};

// Helper function to generate consistent icon styles
const iconStyle = (color) => ({
  width: rem(52),
  height: rem(52),
  color: `var(--mantine-color-${color}-6)`,
});

export default DataImporter;
