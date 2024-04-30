/**
 * Purpose: This script is used to verify the status of the previously uploaded dataset in the Upload Dataset feature.
 * How it works: It checks the Pennsieve upload manifest periodically to track the statuses of each file in the dataset.
 * NOTE: For a list of possible statuses, see the Pennsieve API documentation link: https://docs.pennsieve.io/docs/uploading-files-programmatically
 */
import api from "../others/api/api";

/**
 * Returns the paths for files that have been FINALIZED or FAILED in the target Pennsieve manifest.
 * @returns {Promise<{completeFilesList: [], failedFilesPathsList: []}>}
 */
const getVerifiedFilesFromManifest = async (targetPennsieveManifestId) => {
  let finalizedFiles = [];
  let failedFilesPathsList = [];
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
    if (file["status"] === "FAILED") {
      failedFilesPathsList.append(file["path"]);
    }

    if (file["status"] === "FINALIZED") {
      finalizedFiles.append(file);
    }
  }
};

window.monitorUploadFileVerificationProgress = async () => {
  let manifestId = window.pennsieveManifestId;
  let verifiedFilesCount = 0;

  while (verifiedFilesCount < window.totalFilesCount) {
    let verifiedFiles = await getVerifiedFilesFromManifest(manifestId);
    let completeFilesList = verifiedFiles["completeFilesList"];
    let failedFilesPathsList = verifiedFiles["failedFilesPathsList"];
    verifiedFilesCount = completeFilesList.length + failedFilesPathsList.length;

    // update the UI with the verified files count
    document.getElementById("verify-dataset-upload-files-count").innerText =
      `verifiedFilesCount / window.totalFilesCount Files`;

    // wait 1 minute before checking again so we are not spamming the Pennsieve API for large datasets + to give files time to process
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
};
