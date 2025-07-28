export function setGuidedProgressBarValue(destination, value) {
  const progressBar = document.querySelector(`#guided-progress-bar-${destination}-generation`);
  if (progressBar) {
    progressBar.setAttribute("value", value);
  } else {
    console.error(`Could not find progress bar for ${destination}`);
  }
}

export const updateDatasetUploadProgressTable = (destination, progressObject) => {
  const datasetUploadTableBody = document.getElementById(
    `guided-tbody-${destination}-generation-status`
  );
  //delete datasetUPloadTableBody children with class "generation-status-tr"
  const uploadStatusTRs = datasetUploadTableBody.querySelectorAll(".generation-status-tr");
  for (const uploadStatusTR of uploadStatusTRs) {
    datasetUploadTableBody.removeChild(uploadStatusTR);
  }
  //remove dtasetUploadTableBody children that don't have the id guided-tr-progress-bar
  for (const child of datasetUploadTableBody.children) {
    if (!child.classList.contains("guided-tr-progress-bar")) {
      datasetUploadTableBody.removeChild(child);
    }
  }
  let uploadStatusElement = "";
  for (const [uploadStatusKey, uploadStatusValue] of Object.entries(progressObject))
    uploadStatusElement += `
      <tr class="generation-status-tr">
        <td class="middle aligned progress-bar-table-left">
          <b>${uploadStatusKey}:</b>
        </td>
        <td
          class="middle aligned remove-left-border" style="max-width: 500px; word-wrap: break-word;">${uploadStatusValue}</td>
      </tr>
    `;

  //insert adjustStatusElement at the end of datasetUploadTablebody
  datasetUploadTableBody.insertAdjacentHTML("beforeend", uploadStatusElement);
};
