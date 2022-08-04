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

ipcMain.on("open-file-dialog-local-destination-curate", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-local-destination-datasetCurate",
      files.filePaths
    );
  }
});

ipcMain.on(
  "open-file-dialog-local-destination-curate-generate",
  async (event) => {
    let mainWindow = BrowserWindow.getFocusedWindow();

    let files = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select a directory"
    });

    if (files) {
      mainWindow.webContents.send(
        "selected-local-destination-datasetCurate-generate",
        files.filePaths
      );
    }
  }
);

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

ipcMain.on("open-file-dialog-metadata-curate", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Select a metadata file"
  });

  if (files) {
    mainWindow.webContents.send("selected-metadataCurate", files.filePaths);
  }
});

ipcMain.on("open-destination-generate-submission-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-submission-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-destination-generate-dd-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-dd-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-destination-generate-subjects-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-subjects-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-destination-generate-samples-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-samples-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-destination-generate-changes-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-changes-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-destination-generate-readme-locally", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
    title: "Select a directory"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-destination-generate-readme-locally",
      files.filePaths
    );
  }
});

ipcMain.on("open-file-dialog-submission", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls", "csv"] }],
    title: "Select a submission file"
  });

  if (files) {
    mainWindow.webContents.send("selected-submission", files.filePaths);
  }
});

ipcMain.on("open-file-dialog-description", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls", "csv"] }],
    title: "Select a dataset description file"
  });

  if (files) {
    mainWindow.webContents.send("selected-description", files.filePaths);
  }
});

ipcMain.on("open-file-dialog-subjects", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select a subjects file"
  });

  if (files) {
    mainWindow.webContents.send("selected-subjects", files.filePaths);
  }
});

ipcMain.on("open-file-dialog-samples", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select a samples file"
  });

  if (files) {
    mainWindow.webContents.send("selected-samples", files.filePaths);
  }
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-subjects", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select an existing subjects file"
  });

  if (files) {
    mainWindow.webContents.send("selected-existing-subjects", files.filePaths);
  }
});
// import existing samples
ipcMain.on("open-file-dialog-existing-samples", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select an existing samples file"
  });

  if (files) {
    mainWindow.webContents.send("selected-existing-samples", files.filePaths);
  }
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-DD", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select an existing dataset description file"
  });

  if (files) {
    mainWindow.webContents.send("selected-existing-DD", files.filePaths);
  }
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-submission", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Excel", extensions: ["xlsx", "xls"] }],
    title: "Select an existing submission file"
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-existing-submission",
      files.filePaths
    );
  }
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-changes", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Text", extensions: ["txt"] }],
    title: "Select an existing changes file"
  });

  if (files) {
    mainWindow.webContents.send("selected-existing-changes", files.filePaths);
  }
});

// import existing subjects.xlsx to continue working on
ipcMain.on("open-file-dialog-existing-readme", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Text", extensions: ["txt"] }],
    title: "Select an existing readme file"
  });

  if (files) {
    mainWindow.webContents.send("selected-existing-readme", files.filePaths);
  }
});

////// milestone document
ipcMain.on("open-file-dialog-milestone-doc", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "DOCX", extensions: ["docx"] }],
    title: "Select milestone document",
  });

  if (files) {
    mainWindow.webContents.send("selected-milestonedoc", files.filePaths);
  }
});

ipcMain.on("open-file-dialog-milestone-doc-reupload", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "DOCX", extensions: ["docx"] }],
    title: "Select the milestone document to reupload",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-milestonedocreupload",
      files.filePaths
    );
  }
});

ipcMain.on("open-file-dialog-newdataset", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a dataset",
  });

  if (files) {
    mainWindow.webContents.send("selected-new-dataset", files.filePaths);
  }
});

ipcMain.handle("open-file-dialog-data-deliverables", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let dddFile = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "DOCX", extensions: ["docx"] }],
    title: "Select a data deliverables document",
  });

  if (dddFile) {
    return dddFile.filePaths;
  }

  return [];
});

ipcMain.handle("open-file-dialog-submit-dataset", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let datasetDirectory = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a dataset",
  });

  if (datasetDirectory) {
    return datasetDirectory.filePaths;
  }

  return [];
});

// Pennsieve metadata
ipcMain.handle("open-file-dialog-import-banner-image", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Image", extensions: ["jpg", "png", "jpeg", "tiff", "tif"] },
    ],
    title: "Select a banner image",
  });

  if (!files) {
    return [];
  }

  return files.filePaths;
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
ipcMain.on("open-folder-dialog-save-metadata", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-metadata-download-folder",
      files.filePaths,
      filename
    );
  }
});

// Generate submission file
ipcMain.on("open-folder-dialog-save-submission", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-metadata-submission",
      files.filePaths,
      filename
    );
  }
});

// Generate ds description file
ipcMain.on(
  "open-folder-dialog-save-ds-description",
  async (event, filename) => {
    let mainWindow = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select a directory",
    });

    if (files) {
      mainWindow.webContents.send(
        "selected-metadata-ds-description",
        files.filePaths,
        filename
      );
    }
  }
);

// Generate subjects file
ipcMain.on("open-folder-dialog-save-subjects", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-generate-metadata-subjects",
      files.filePaths,
      filename
    );
  }
});

// Generate samples file
ipcMain.on("open-folder-dialog-save-samples", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-generate-metadata-samples",
      files.filePaths,
      filename
    );
  }
});

// Generate changes file
ipcMain.on("open-folder-dialog-save-changes", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-generate-metadata-changes",
      files.filePaths,
      filename
    );
  }
});

// Generate readme file
ipcMain.on("open-folder-dialog-save-readme", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-generate-metadata-readme",
      files.filePaths,
      filename
    );
  }
});

// open primary folder
ipcMain.on("open-file-dialog-local-primary-folder", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    title: "Select primary folder",
    properties: ["openDirectory"],
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-local-primary-folder",
      files.filePaths
    );
  }
});
ipcMain.on("open-file-dialog-local-primary-folder-samples", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    title: "Select primary folder",
    properties: ["openDirectory"],
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-local-primary-folder-samples",
      files.filePaths
    );
  }
});

//// DDD download
ipcMain.on("open-folder-dialog-save-DDD", async (event, filename) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-DDD-download-folder",
      files.filePaths,
      filename
    );
  }
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

ipcMain.on("open-files-organize-datasets-dialog", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    title: "Import a file(s)",
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-files-organize-datasets",
      files.filePaths
    );
  }
});

ipcMain.on("open-folders-organize-datasets-dialog", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let folders = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "multiSelections"],
    title: "Import a folder",
  });

  if (folders) {
    mainWindow.webContents.send(
      "selected-folders-organize-datasets",
      folders.filePaths
    );
  }
});

// Generate manifest file locally
ipcMain.on("open-folder-dialog-save-manifest-local", async (event, arg) => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select folder to save manifest",
  });

  mainWindow.webContents.send("selected-manifest-folder", result);
});

/*
This section is for Prepare metadata -> Create manifest
*/

// Browse for local dataset
ipcMain.on("open-file-dialog-local-dataset-manifest-purpose", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    title: "Select dataset folder",
    properties: ["openDirectory"],
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-local-dataset-manifest-purpose",
      files.filePaths
    );
  }
});

// Prepare Datasets
ipcMain.on("open-folder-dialog-validate-local-dataset", async (event) => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  let files = await dialog.showOpenDialog(mainWindow, {
    title: "Select a local dataset",
    properties: ["openDirectory"],
  });

  if (files) {
    mainWindow.webContents.send(
      "selected-validate-local-dataset",
      files.filePaths
    );
  }
});

//Selecting destination for Log folder
ipcMain.on("open-file-dialog-log-destination", async () => {
  let mainWindow = BrowserWindow.getFocusedWindow();

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select a directory",
  });

  mainWindow.webContents.send("selected-log-folder", result);
});
