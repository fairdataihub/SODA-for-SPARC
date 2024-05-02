/**
 * Purpose: This script is used to verify the status of the previously uploaded dataset in the Upload Dataset feature.
 * How it works: It checks the Pennsieve upload manifest periodically to track the statuses of each file in the dataset.
 * NOTE: For a list of possible statuses, see the Pennsieve API documentation link: https://docs.pennsieve.io/docs/uploading-files-programmatically
 */
import api from "../others/api/api";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let failedFilesPathsList = [];

document.querySelector("#verify-file-status-download-list").addEventListener("click", async () => {
  const savePath = await window.electron.ipcRenderer.invoke(
    "open-folder-path-select",
    "Select a folder to save your failed files list"
  );

  if (!savePath) {
    // If no path selected, exit the function
    return;
  }

  const csvData = failedFilesPathsList.join("\n");

  const csvFilePath = `${savePath}/failed_files_list.csv`;

  // make a csv with the csvData and save it to the csvFilePath
  window.fs.writeFileSync(csvFilePath, csvData);

  // open the file in the default CSV viewer
  window.electron.ipcRenderer.send("open-file-at-path", csvFilePath);
});

document.querySelector("#verify-file-status-retry-upload").addEventListener("click", async () => {
  $("#Question-validate-dataset-upload-2").hide();
  $("#Question-validate-dataset-upload-3").hide();

  // move to the previous page and show the generate dataset upload page 
  window.nextPrev(-1);

  // hide question 1 of generate dataset
  $("#Question-preview-dataset-details").hide()
  $("#Question-generate-dataset-generate-div").hide()

  document.querySelector("#button-retry").click()
})

/**
 * Returns the paths for files that have been FINALIZED or FAILED in the target Pennsieve manifest.
 * @returns {Promise<{completeFilesList: [], failedFilesPathsList: []}>}
 */
const getVerifiedFilesFromManifest = async (targetPennsieveManifestId) => {
  let finalizedFiles = [];
  failedFilesPathsList = [];

  let continuationToken = "";
  let filesBatchResponse = await api.getPennsieveUploadManifestFiles(
    targetPennsieveManifestId,
    1000,
    continuationToken
  );
  console.log(filesBatchResponse);
  let files = filesBatchResponse["files"];
  continuationToken = filesBatchResponse["continuation_token"];
  processFilesPage(files, finalizedFiles, failedFilesPathsList);
  while (continuationToken !== "") {
    filesBatchResponse = await api.getPennsieveUploadManifestFiles(
      targetPennsieveManifestId,
      1000,
      continuationToken
    );
    files = filesBatchResponse["files"];
    continuationToken = filesBatchResponse["continuation_token"];
    processFilesPage(files, finalizedFiles, failedFilesPathsList);
  }

  return { finalizedFiles, failedFilesPathsList };
};

const processFilesPage = (filePage, finalizedFiles, failedFilesPathsList) => {
  for (const file of filePage) {
    if (file["status"] === "Failed") {
      failedFilesPathsList.push(`${file["file_path"]}/${file["file_name"]}`);
    }

    if (
      file["status"] === "Imported" ||
      file["status"] === "Finalized" ||
      file["status"] === "Verified"
    ) {
      finalizedFiles.push(`${file["file_path"]}/${file["file_name"]}`);
    }
  }
};

window.monitorUploadFileVerificationProgress = async () => {
  let manifestId = window.pennsieveManifestId;
  let verifiedFilesCount = 0;
  failedFilesPathsList = [];
  let finalizedFiles = [];

  // initalize the UI with the total files count
  document.getElementById("verify-dataset-upload-files-count").innerText =
    `${verifiedFilesCount} / ${window.totalFilesCount} Files`;

  // loop until all files are verified
  while (true) {
    document.getElementById("verify-dataset-upload-files-progress-para").innerText =
      "Fetching file statuses...";
    let verifiedFiles = await getVerifiedFilesFromManifest(manifestId);
    finalizedFiles = verifiedFiles["finalizedFiles"];
    failedFilesPathsList = verifiedFiles["failedFilesPathsList"];
    let updatedVerifiedFilesCount = finalizedFiles.length + failedFilesPathsList.length;

    if (updatedVerifiedFilesCount > verifiedFilesCount) {
      // update the UI with the verified files count
      verifiedFilesCount = updatedVerifiedFilesCount;
      document.getElementById("verify-dataset-upload-files-count").innerText =
        `${verifiedFilesCount} / ${window.totalFilesCount} Files`;
      document.getElementById("verify-dataset-upload-files-progress-para").innerText =
        "Processed fetched file statuses.";
    } else {
      document.getElementById("verify-dataset-upload-files-progress-para").innerText =
        "Processed fetched file statuses. No updates found.";
    }

    if (verifiedFilesCount === window.totalFilesCount) {
      break;
    }

    // allow the prior status to be read
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // wait 55 seconds before checking again so we are not spamming the Pennsieve API for large datasets + to give files time to process
    document.getElementById("verify-dataset-upload-files-progress-para").innerText =
      "Waiting to fetch file statuses...";
    await new Promise((resolve) => setTimeout(resolve, 55000));
  }

  // all file statuses fetched
  document.getElementById("verify-dataset-upload-files-progress-para").innerText = "";

  if (failedFilesPathsList.length) {
    $("#Question-validate-dataset-upload-2").show();
    populateFailedFilePaths(
      document.getElementById("validate-dataset-failed-table"),
      failedFilesPathsList
    );
    return;
  }

  // TODO: Show success Lottie and show exit buttons
  $("#Question-validate-dataset-upload-3").show();
  $("#success-validated-files-lottie").addClass("is-shown");
};

const populateFailedFilePaths = (targetTableElement, failedFilesPathsList) => {
  let tableBody = targetTableElement.getElementsByTagName("tbody")[0];
  for (const failedFilePath of failedFilesPathsList) {
    let row = tableBody.insertRow(-1);
    let cell = row.insertCell(0);
    let newText = document.createTextNode(failedFilePath);
    // left align the text in the cell
    cell.style.textAlign = "left";
    cell.style.color = "black";
    cell.appendChild(newText);
  }
};


