const { ipcMain, dialog, BrowserWindow } = require("electron");

ipcMain.on("warning-no-internet-connection", (event) => {
  const options = {
    type: "warning",
    title: "No internect connection",
    message:
      "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Pennsieve and especially none of the features located under the 'Manage Datasets' section.",
  };
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send("warning-no-internet-connection-showed");
  });
});

ipcMain.on("warning-publish-dataset", (event) => {
  const options = {
    type: "warning",
    title: "Publishing dataset",
    message:
      "Your dataset will be submitted for review to the Publishers within your organization. While under review, the dataset will become locked until it has either been approved or rejected for publication. Would you like to continue?",
    buttons: ["Yes", "No"],
  };
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send("warning-publish-dataset-selection", index);
  });
});

ipcMain.on("warning-publish-dataset-again", (event) => {
  const options = {
    type: "warning",
    title: "Publishing new version of dataset",
    message:
      "This dataset has already been published. This action will submit the dataset again for review to the Publishers. While under review, the dataset will become locked until it has either been approved or rejected for publication. If accepted a new version of your dataset will be published. Would you like to continue?",
    buttons: ["Yes", "No"],
  };
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send("warning-publish-dataset-again-selection", index);
  });
});
