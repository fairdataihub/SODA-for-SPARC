export const handleOrganizeDsGenerateLocalManifestCopyButtonClick = async () => {
  // Step 1: Prompt the user to select a folder to save the dataset
  const savePath = await window.electron.ipcRenderer.invoke(
    "open-folder-path-select",
    "Select a folder to save the manifest files to"
  );

  // Step 2: Check if a save path was selected
  if (!savePath) {
    // If no path selected, exit the function
    return;
  }

  // Step 3: Define the base folder name for the manifest files
  let manifestFolderName = "SODA Manifest Files";

  // Step 4: Function to generate a unique folder path for the manifest files
  const generateManifestFolderSavePath = () => {
    // If the selected save path already contains a "SODA Manifest Files" directory, append a number to the folder name
    // Otherwise, return the selected save path as is

    // Step 4.1: Check if the "SODA Manifest Files" directory already exists at the selected save path
    if (window.fs.existsSync(window.path.join(savePath, manifestFolderName))) {
      let i = 1;

      // Step 4.2: If the directory with the original name already exists, increment the number until a unique name is found
      while (window.fs.existsSync(window.path.join(savePath, `${manifestFolderName} (${i})`))) {
        i++;
      }

      // Step 4.3: Return the path with the incremented folder name
      return window.path.join(savePath, `${manifestFolderName} (${i})`);
    } else {
      // Step 4.4: If the original directory does not exist, return the selected save path with the original folder name
      return window.path.join(savePath, manifestFolderName);
    }
  };

  // Step 5: Generate the unique folder path for the manifest files
  const manifestFolderSavePath = generateManifestFolderSavePath();

  // Step 6: Extract manifest file data from the sodaCopy object
  const manifestFileData = window.sodaCopy["manifest-files"];

  console.log("Manifest File Data:", manifestFileData);

  const manifestJSON = window.processManifestInfo(
    manifestFileData["headers"],
    manifestFileData["data"]
  );

  const jsonManifest = JSON.stringify(manifestJSON);

  const manifestPath = window.path.join(manifestFolderSavePath, "manifest.xlsx");

  window.fs.mkdirSync(manifestFolderSavePath, { recursive: true });

  // Create the manifest file
  window.convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);

  // Step 8: Display a success notification
  window.notyf.open({
    duration: "5000",
    type: "success",
    message: "Manifest files successfully generated",
  });
};
