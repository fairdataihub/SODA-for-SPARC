import Swal from "sweetalert2";
import useGlobalStore from "../../../stores/globalStore";
import { newEmptyFolderObj } from "../../../scripts/utils/datasetStructure";
import { reRenderTreeView } from "../../../stores/slices/datasetTreeViewSlice";

export const handleAddEmptyFolder = async (pathToRender) => {
  let entityBasedInputLabel = "Enter the folder name";
  if (pathToRender.length > 0) {
    if (pathToRender[1] === "subjects") {
      const subjectID = pathToRender[2];
      entityBasedInputLabel = `Enter the name of the new folder for subject "${subjectID}"`;
    } else if (pathToRender[1] === "samples") {
      const sampleID = pathToRender[2];
      entityBasedInputLabel = `Enter the name of the new folder for sample "${sampleID}"`;
    }
  }
  const { value: folderName } = await Swal.fire({
    title: "Add an empty folder for data import",
    input: "text",
    inputLabel: entityBasedInputLabel,
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: "Create",
    cancelButtonText: "Cancel",
    inputValidator: (value) => {
      if (!value) {
        return "Folder name is required";
      }
      if (value.trim().length === 0) {
        return "Folder name cannot be empty";
      }

      const isValid = window.evaluateStringAgainstSdsRequirements(
        value,
        "folder-or-file-name-is-valid"
      );
      if (!isValid) {
        return "Folder name can only contain letters, numbers, commas, periods, hyphens, underscores, and spaces";
      }
      return null;
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  if (!folderName) {
    return; // User cancelled
  }

  try {
    const datasetStructureJSONObj = window.datasetStructureJSONObj;
    if (!datasetStructureJSONObj) {
      window.notyf.open({
        type: "error",
        message: "Dataset structure not found",
        duration: 2000,
      });
      return;
    }

    // Navigate to the current path and create a new folder
    let currentLocation = datasetStructureJSONObj;
    for (const folderPath of pathToRender) {
      if (!currentLocation.folders[folderPath]) {
        currentLocation.folders[folderPath] = newEmptyFolderObj();
      }
      currentLocation = currentLocation.folders[folderPath];
    }

    // Check if folder already exists
    if (currentLocation.folders[folderName]) {
      window.notyf.open({
        type: "error",
        message: `Folder "${folderName}" already exists`,
        duration: 2000,
      });
      return;
    }

    // Create a new folder with the provided name
    currentLocation.folders[folderName] = newEmptyFolderObj();

    // Update the store and re-render
    useGlobalStore.setState({ datasetStructureJSONObj });
    reRenderTreeView();

    window.notyf.open({
      type: "success",
      message: `Created folder: ${folderName}`,
      duration: 2000,
    });
  } catch (error) {
    window.log.error("Error creating empty folder:", error instanceof Error ? error.message : JSON.stringify(error));
    window.notyf.open({
      type: "error",
      message: "Failed to create folder",
      duration: 2000,
    });
  }
};
