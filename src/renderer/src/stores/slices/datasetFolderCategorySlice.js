import { produce } from "immer";

const initialState = {
  unstructuredDataFolders: {}, // Maps folder paths to boolean (true if unstructured)
  unstructuredDataParentPath: "dataset_root/unstructured-data", // Default path for unstructured data
  folderCategories: {}, // Custom categories for folders
};

const createDatasetFolderCategorySlice = (set, get) => ({
  ...initialState,

  // Toggle a folder as unstructured data
  toggleFolderAsUnstructuredData: (folderPath) =>
    set(
      produce((state) => {
        if (state.unstructuredDataFolders[folderPath]) {
          delete state.unstructuredDataFolders[folderPath];
        } else {
          state.unstructuredDataFolders[folderPath] = true;
        }
      })
    ),

  // Check if a folder is marked as unstructured data
  isFolderUnstructuredData: (folderPath) => {
    return get().unstructuredDataFolders[folderPath] || false;
  },

  // Set parent path for unstructured data
  setUnstructuredDataParentPath: (path) =>
    set(
      produce((state) => {
        state.unstructuredDataParentPath = path;
      })
    ),

  // Move a folder to the unstructured-data folder
  moveToUnstructuredData: (folderPath, datasetStructureObj) =>
    set(
      produce((state) => {
        // Mark as unstructured data
        state.unstructuredDataFolders[folderPath] = true;

        // Logic to move the folder in the dataset structure would go here
        // This would require modifications to the dataset structure object
        // and would need to be coordinated with the dataset structure slice
      })
    ),

  // Create a new subfolder in the unstructured-data folder
  createUnstructuredSubfolder: (folderName) =>
    set(
      produce((state) => {
        // Implementation would depend on how we're managing the dataset structure
        // This would create a new subfolder in the unstructured-data folder
      })
    ),

  // Reset the folder categorization state
  resetFolderCategories: () =>
    set(
      produce((state) => {
        state.unstructuredDataFolders = {};
        state.folderCategories = {};
      })
    ),
});

export default createDatasetFolderCategorySlice;
