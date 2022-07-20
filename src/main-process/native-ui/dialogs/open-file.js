const { ipcMain, dialog, BrowserWindow } = require("electron");

ipcMain.on("open-file-dialog-dataset", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-dataset", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-newdataset-curate", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-new-datasetCurate", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-local-destination-curate", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-local-destination-datasetCurate", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-local-destination-curate-generate", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-local-destination-datasetCurate-generate",
          files
        );
      }
    }
  );
});

/////
ipcMain.on("open-file-dialog-uploadorganization", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "CSV", extensions: ["csv"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-uploadorganization", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-metadata-curate", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-metadataCurate", files);
      }
    }
  );
});

ipcMain.on("open-destination-generate-submission-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-destination-generate-submission-locally",
          files
        );
      }
    }
  );
});

ipcMain.on("open-destination-generate-dd-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-destination-generate-dd-locally", files);
      }
    }
  );
});

ipcMain.on("open-destination-generate-subjects-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-destination-generate-subjects-locally",
          files
        );
      }
    }
  );
});

ipcMain.on("open-destination-generate-samples-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-destination-generate-samples-locally",
          files
        );
      }
    }
  );
});

ipcMain.on("open-destination-generate-changes-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-destination-generate-changes-locally",
          files
        );
      }
    }
  );
});

ipcMain.on("open-destination-generate-readme-locally", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-destination-generate-readme-locally",
          files
        );
      }
    }
  );
});

ipcMain.on("open-file-dialog-submission", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls", "csv"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-submission", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-description", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls", "csv"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-description", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-subjects", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-subjects", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-samples", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-samples", files);
      }
    }
  );
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-subjects", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-subjects", files);
      }
    }
  );
});
// import existing samples
ipcMain.on("open-file-dialog-existing-samples", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-samples", files);
      }
    }
  );
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-DD", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-DD", files);
      }
    }
  );
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-submission", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Text", extensions: ["xlsx", "xls"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-submission", files);
      }
    }
  );
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-changes", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Text", extensions: ["txt"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-changes", files);
      }
    }
  );
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-readme", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "Text", extensions: ["txt"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-existing-readme", files);
      }
    }
  );
});

////// milestone document
ipcMain.on("open-file-dialog-milestone-doc", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "DOCX", extensions: ["docx"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-milestonedoc", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-milestone-doc-reupload", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile"],
      filters: [{ name: "DOCX", extensions: ["docx"] }],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-milestonedocreupload", files);
      }
    }
  );
});

ipcMain.on("open-file-dialog-newdataset", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-new-dataset", files);
      }
    }
  );
});

ipcMain.handle("open-file-dialog-submit-dataset", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let datasetDirectory = await dialog.showOpenDialog(
    mainWindow,
    {
      properties: ["openDirectory"],
    }
  )

  if (datasetDirectory) {
    return datasetDirectory.filePaths
  } 

  return []
})


// Pennsieve metadata
ipcMain.handle("open-file-dialog-import-banner-image", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Image", extensions: ["jpg", "png", "jpeg", "tiff", "tif"] },
    ],
  });

  if (!files) {
    return []
  }

  return files.filePaths
});


/// Validate import local dataset
ipcMain.on("open-file-dialog-validate-local-ds", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-validate-local-dataset", files);
      }
    }
  );
});

// Metadata template download
ipcMain.on("open-folder-dialog-save-metadata", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-metadata-download-folder", files, filename);
      }
    }
  );
});

// Generate submission file
ipcMain.on("open-folder-dialog-save-submission", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-metadata-submission", files, filename);
      }
    }
  );
});

// Generate ds description file
ipcMain.on("open-folder-dialog-save-ds-description", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-metadata-ds-description", files, filename);
      }
    }
  );
});

// Generate subjects file
ipcMain.on("open-folder-dialog-save-subjects", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-generate-metadata-subjects",
          files,
          filename
        );
      }
    }
  );
});

// Generate samples file
ipcMain.on("open-folder-dialog-save-samples", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-generate-metadata-samples",
          files,
          filename
        );
      }
    }
  );
});

// Generate changes file
ipcMain.on("open-folder-dialog-save-changes", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send(
          "selected-generate-metadata-changes",
          files,
          filename
        );
      }
    }
  );
});

// Generate readme file
ipcMain.on("open-folder-dialog-save-readme", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-generate-metadata-readme", files, filename);
      }
    }
  );
});

// open primary folder
ipcMain.on("open-file-dialog-local-primary-folder", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      title: "Select primary folder",
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-local-primary-folder", files);
      }
    }
  );
});
ipcMain.on("open-file-dialog-local-primary-folder-samples", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      title: "Select primary folder",
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-local-primary-folder-samples", files);
      }
    }
  );
});

//// DDD download
ipcMain.on("open-folder-dialog-save-DDD", (event, filename) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-DDD-download-folder", files, filename);
      }
    }
  );
});

///////////////// ORGANIZE DATASETS *NEW* /////////////////////////////
ipcMain.on("open-file-organization-dialog", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    },
    (file) => {
      if (file) {
        event.sender.send("selected-file-organization", file);
      }
    }
  );
});

ipcMain.on("open-files-organize-datasets-dialog", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openFile", "multiSelections"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-files-organize-datasets", files);
      }
    }
  );
});

ipcMain.on("open-folders-organize-datasets-dialog", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      properties: ["openDirectory", "multiSelections"],
    },
    (folders) => {
      if (folders) {
        event.sender.send("selected-folders-organize-datasets", folders);
      }
    }
  );
});

// Generate manifest file locally
ipcMain.on("open-folder-dialog-save-manifest-local", async (event, arg) => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
  });
  event.sender.send("selected-manifest-folder", result);
});

/*
This section is for Prepare metadata -> Create manifest
*/

// Browse for local dataset
ipcMain.on("open-file-dialog-local-dataset-manifest-purpose", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      title: "Select dataset folder",
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-local-dataset-manifest-purpose", files);
      }
    }
  );
});

// Prepare Datasets
ipcMain.on("open-folder-dialog-validate-local-dataset", (event) => {
  dialog.showOpenDialog(
    BrowserWindow.getFocusedWindow(),
    {
      title: "Select a local dataset",
      properties: ["openDirectory"],
    },
    (files) => {
      if (files) {
        event.sender.send("selected-validate-local-dataset", files);
      }
    }
  );
});

//Selecting destination for Log folder
ipcMain.on("open-file-dialog-log-destination", async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
  });
  event.sender.send("selected-log-folder", result);
});
