import Swal from "sweetalert2";
import { swalShowError, swalShowLoading } from "../../../utils/swal-utils";
import { guidedGetCurrentUserWorkSpace } from "../../workspaces/workspaces";
import { guidedGenerateDatasetOnPennsieve } from "../../generateDataset/generate";
import api from "../../../others/api/api";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

document.getElementById("guided-generate-dataset-button").addEventListener("click", async () => {
  // Ensure that the current workspace is the workspace the user confirmed
  const currentWorkspace = guidedGetCurrentUserWorkSpace();
  const datasetWorkspace = window.sodaJSONObj["digital-metadata"]["dataset-workspace"];

  if (!currentWorkspace) {
    Swal.fire({
      width: 700,
      icon: "info",
      title: "You are not logged in to any workspace.",
      html: `
          Please select a workspace by clicking on the pencil icon to the right of the Dataset workspace field
          on this page.
        `,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `OK`,
      focusConfirm: true,
      allowOutsideClick: false,
    });
    return;
  }

  if (currentWorkspace != datasetWorkspace) {
    Swal.fire({
      width: 700,
      icon: "info",
      title: "You are not logged in to the workspace you confirmed earlier.",
      html: `
          You previously confirmed that the Dataset workspace is <b>${datasetWorkspace}</b>.
          <br />
          <br />
          <p class="text-left">
            If the workspace you would like to upload the dataset to is still <b>${datasetWorkspace}</b>,
            you can change the workspace by clicking the pencil icon to the right of the Dataset workspace field
            on this page.
          </p>
          <br />
          <br />
          <p class="text-left">
            If you would like to change the dataset workspace to <b>${currentWorkspace}</b>, you can do so by
            by clicking the Pennsieve metadata item in the left sidebar, selecting Pennsieve log in, and then
            change your workspace to <b>${currentWorkspace}</b>.
          </p>
        `,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: `OK`,
      focusConfirm: true,
      allowOutsideClick: false,
    });

    return;
  }

  //run pre flight checks and abort if any fail
  let supplementary_checks = await window.run_pre_flight_checks(
    "guided-mode-pre-generate-pennsieve-agent-check"
  );
  if (!supplementary_checks) {
    return;
  }

  // Check to make sure a dataset with the same name does not already exist on Pennsieve
  // (If uploading to a new dataset)

  const pennsieveGenerationTarget = window.sodaJSONObj["pennsieve-generation-target"];
  if (pennsieveGenerationTarget === "new") {
    const pennsieveDatasetID = window.sodaJSONObj?.["digital-metadata"]?.["pennsieve-dataset-id"];
    // If the dataset id already exists, we are uploading to an existing dataset so we don't need to check for duplicates
    if (!pennsieveDatasetID) {
      const datasetName = window.sodaJSONObj?.["generate-dataset"]?.["dataset-name"];
      Swal.fire({
        title: "Making sure a dataset with the same name does not already exist on Pennsieve",
        html: `
              <div class="guided--loading-div">
                <div class="lds-roller">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
            `,
        width: 800,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        allowOutsideClick: false,
        showConfirmButton: false,
        showCancelButton: false,
      });
      const datasetList = await api.getUsersDatasetList(false);
      const existingDatasetNames = datasetList.map((dataset) => dataset.name);
      const datasetAlreadyExists = existingDatasetNames.includes(datasetName);
      if (datasetAlreadyExists) {
        swalShowError(
          "Dataset name already exists",
          `A dataset with the name "${datasetName}" already exists on Pennsieve. Please return to the Pennsieve settings page and choose a new name.`
        );
        return;
      } else {
        // Close the loading Swal
        Swal.close();
      }
    }
  }

  // If all checks pass, progress to the next page
  await window.openPage("guided-dataset-generation-tab");
  // Generate the dataset on Pennsieve
  guidedGenerateDatasetOnPennsieve();
});
