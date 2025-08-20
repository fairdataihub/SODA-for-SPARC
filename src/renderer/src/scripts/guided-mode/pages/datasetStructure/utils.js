import {
  generateTreeViewRenderArray,
  setPathToRender,
} from "../../../../stores/slices/datasetTreeViewSlice";
import { newEmptyFolderObj } from "../../../utils/datasetStructure";

const getDatasetStructureJsonFolderContentsAtNestedArrayPath = (folderPathArray) => {
  let currentFolder = window.datasetStructureJSONObj;
  folderPathArray.forEach((folder) => {
    // Continue to recursively create folders if they don't exist
    if (!currentFolder["folders"][folder]) {
      currentFolder["folders"][folder] = newEmptyFolderObj();
    }
    currentFolder = currentFolder["folders"][folder];
  });
  return currentFolder;
};

export const guidedUpdateFolderStructureUI = (folderPathSeperatedBySlashes) => {
  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  // Remove transition class to reset animation or styles
  fileExplorer.classList.remove("file-explorer-transition");
  // Update the global path input value with the new path
  $("#guided-input-global-path").val(`dataset_root/${folderPathSeperatedBySlashes}`);
  window.organizeDSglobalPath = $("#guided-input-global-path")[0];

  // Filter and format the path using the global path function
  const filtered = window.getGlobalPath(window.organizeDSglobalPath);
  window.organizeDSglobalPath.value = `${filtered.join("/")}/`;
  // Prepare the path array for nested JSON retrieval
  const arrayPathToNestedJsonToRender = filtered.slice(1);
  // Retrieve content at the nested path in the dataset structure
  const datasetContent = getDatasetStructureJsonFolderContentsAtNestedArrayPath(
    arrayPathToNestedJsonToRender
  );
  // Update the UI with the files and folders retrieved
  window.listItems(datasetContent, "#items", 500, true);
  // Set up click behavior for folder items in the list
  window.getInFolder(
    ".single-item",
    "#items",
    window.organizeDSglobalPath,
    window.datasetStructureJSONObj
  );
  setPathToRender(arrayPathToNestedJsonToRender);
  // Refresh the tree view to match the current folder structure
  generateTreeViewRenderArray(window.datasetStructureJSONObj);
};
