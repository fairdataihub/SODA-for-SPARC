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
    console.log("[DataImporter] handleDrop called");
    console.log("[DataImporter] Dropped files:", files);
    // Try to extract folder paths from dropped files (Electron only)
    const parentFolders = files
      .map((file) => {
        if (file.path) {
          return file.path.substring(0, file.path.lastIndexOf("\\"));
        }
        return null;
      })
      .filter(Boolean);
    const uniqueFolders = Array.from(new Set(parentFolders));
    // If only one unique parent folder and more than one file, treat as folder drop
    if (uniqueFolders.length === 1 && files.length > 1 && window.electron?.ipcRenderer) {
      console.log("[DataImporter] Detected folder drop:", uniqueFolders[0]);
      window.electron.ipcRenderer.send("selected-folders-organize-datasets", {
        filePaths: uniqueFolders,
        importRelativePath: relativeFolderPathToImportDataInto,
      });
      return;
    }
    // If multiple top-level folders (from multi-folder drop), filter out subfolders
    if (uniqueFolders.length > 1) {
      const topLevelFolders = uniqueFolders.filter(
        (folder) =>
          !uniqueFolders.some((other) => other !== folder && folder.startsWith(other + "\\"))
      );
      if (topLevelFolders.length > 0 && window.electron?.ipcRenderer) {
        console.log("[DataImporter] Top-level dropped folders:", topLevelFolders);
        window.electron.ipcRenderer.send("selected-folders-organize-datasets", {
          filePaths: topLevelFolders,
          importRelativePath: relativeFolderPathToImportDataInto,
        });
        return;
      }
    }
    // Otherwise, treat as file drop (fallback)
    if (files && files.length > 0) {
      files.forEach((file, idx) => {
        console.log(`[DataImporter] File #${idx}:`, file);
        if (file.webkitRelativePath) {
          console.log(`[DataImporter] webkitRelativePath: ${file.webkitRelativePath}`);
        }
      });
    } else {
      console.log("[DataImporter] No files detected in drop event.");
    }
    const syntheticDropEvent = createSyntheticDropEvent(files);
    if (window.drop) {
      console.log("[DataImporter] window.drop is defined, calling it...");
      await window.drop(syntheticDropEvent);
      console.log("[DataImporter] window.drop finished.");
    } else {
      console.warn("[DataImporter] window.drop is NOT defined!");
    }
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
