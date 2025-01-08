
window.importCloudSyncDatasetHandler = async (ev) => {
  window.electron.ipcRenderer.send("open-file-dialog-cloud-sync-dataset");
}

window.electron.ipcRenderer.on("selected-destination-cloud-sync-dataset", async (event, path) => {
    console.log("Selected destination path for cloud sync dataset: ", path);
    if (path.length > 0) {
        // Get the path of the first index
        let folderPath = path[0];
    
        await window.handleLocalDatasetImport(folderPath);
    }

})

