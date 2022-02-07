// Prupose: The front end logic for the Validate Dataset section

// open folder selection dialog so the user can choose which local dataset they would like to validate
document.querySelector("#validate-local-dataset-path").addEventListener("click", (evt) => {
    // open folder select dialog
    ipcRenderer.send("open-folder-dialog-validate-local-dataset")

    // listen for user's folder path
    ipcRenderer.on("selected-validate-local-dataset", (evtSender, folderPaths) => {
        // check if a folder was not selected
        if(!folderPaths.length) return 

        // get the folder path
        let folderPath = folderPaths[0]
        
        // get the clicked input
        let validationPathInput = evt.target 

        // set the input's placeholder value to the local dataset path
        validationPathInput.setAttribute("placeholder", folderPath)
    })
})