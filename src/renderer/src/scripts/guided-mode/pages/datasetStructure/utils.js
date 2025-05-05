import { setTreeViewDatasetStructure } from "../../../../stores/slices/datasetTreeViewSlice";

const getDatasetStructureJsonFolderContentsAtNestedArrayPath = (folderPathArray) => {
  let currentFolder = window.datasetStructureJSONObj;
  folderPathArray.forEach((folder) => {
    console.log("currentFolder[folders'][folder]", currentFolder["folders"][folder]);
    // Continue to recursively create folders if they don't exist
    if (!currentFolder["folders"][folder]) {
      currentFolder["folders"][folder] = newEmptyFolderObj();
    }
    currentFolder = currentFolder["folders"][folder];
  });
  return currentFolder;
};

export const guidedUpdateFolderStructureUI = (folderPathSeperatedBySlashes) => {
  console.log("Function called: guidedUpdateFolderStructureUI");
  console.log("Input - folder path (separated by slashes):", folderPathSeperatedBySlashes);

  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  console.log("File explorer element retrieved:", fileExplorer);

  // Remove transition class to reset animation or styles
  fileExplorer.classList.remove("file-explorer-transition");
  console.log("Removed 'file-explorer-transition' class from file explorer.");

  // Update the global path input value with the new path
  $("#guided-input-global-path").val(`dataset_root/${folderPathSeperatedBySlashes}`);
  console.log("Set global input path to:", `dataset_root/${folderPathSeperatedBySlashes}`);

  window.organizeDSglobalPath = $("#guided-input-global-path")[0];

  // Filter and format the path using the global path function
  const filtered = window.getGlobalPath(window.organizeDSglobalPath);
  console.log("Filtered path from getGlobalPath:", filtered);

  window.organizeDSglobalPath.value = `${filtered.join("/")}/`;
  console.log("Set window.organizeDSglobalPath.value to:", window.organizeDSglobalPath.value);

  // Prepare the path array for nested JSON retrieval
  const arrayPathToNestedJsonToRender = filtered.slice(1);
  console.log("Path array for JSON content retrieval:", arrayPathToNestedJsonToRender);

  // Retrieve content at the nested path in the dataset structure
  const datasetContent = getDatasetStructureJsonFolderContentsAtNestedArrayPath(
    arrayPathToNestedJsonToRender
  );
  console.log("Retrieved dataset content at nested path:", datasetContent);

  // Update the UI with the files and folders retrieved
  window.listItems(datasetContent, "#items", 500, true);
  console.log("Called window.listItems to update the UI.");

  // Set up click behavior for folder items in the list
  window.getInFolder(
    ".single-item",
    "#items",
    window.organizeDSglobalPath,
    window.datasetStructureJSONObj
  );
  console.log("arrayPathToNestedJsonToRender:", arrayPathToNestedJsonToRender);

  // Refresh the tree view to match the current folder structure
  setTreeViewDatasetStructure(window.datasetStructureJSONObj, arrayPathToNestedJsonToRender);
  console.log("Updated tree view structure based on current path.");
};
