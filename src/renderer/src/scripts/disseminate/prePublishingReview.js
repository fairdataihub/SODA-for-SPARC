/*
******************************************************
******************************************************
Submit for pre-publishing review Workflow scripts 

Note: Some frontend elements of the workflow are in the renderer.js file as well. They are can be found under postCurationListChange() function.

******************************************************
******************************************************
*/
import client from "../client";
import api from "../others/api/api";
import Swal from "sweetalert2";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Fetches and evaluates the pre-publishing checklist statuses for a dataset.
 *
 * @param {string} currentDataset - The currently selected dataset name or ID.
 * @returns {Object} statuses - A status object detailing the state of each checklist item.
 */
window.getPrepublishingChecklistStatuses = async (currentDataset) => {
  if (!currentDataset || currentDataset.trim() === "") {
    throw new Error("Must provide a valid dataset to check pre-publishing statuses.");
  }

  const statuses = {
    subtitle: false,
    tags: false,
    license: false,
    readme: false,
    bannerImageURL: false,
    ORCID: false,
  };

  console.log("[Prepublishing Checklist] Starting check for dataset:", currentDataset);

  // Dataset metadata
  try {
    const dataset = await api.getDataset(currentDataset);
    const { description = "", tags = [], license = "" } = dataset.content || {};
    statuses.subtitle = description.trim().length > 0;
    statuses.tags = tags.length > 0;
    statuses.license = license.trim().length > 0;
  } catch (error) {
    clientError(error);
    console.log("[Prepublishing Checklist] Metadata check failed.");
  }
  console.log("[Prepublishing Checklist] Metadata results:", {
    subtitle: statuses.subtitle,
    tags: statuses.tags,
    license: statuses.license,
  });

  // Readme
  try {
    const readme = await api.getDatasetReadme(currentDataset);
    statuses.readme = readme.trim().length > 0;
  } catch (error) {
    clientError(error);
    console.log("[Prepublishing Checklist] Readme check failed.");
  }
  console.log("[Prepublishing Checklist] Readme result:", statuses.readme);

  // Banner image
  try {
    const bannerImageURL = await api.getDatasetBannerImageURL(currentDataset);
    statuses.bannerImageURL = bannerImageURL !== "No banner image";
  } catch (error) {
    clientError(error);
    console.log("[Prepublishing Checklist] Banner image check failed.");
  }
  console.log("[Prepublishing Checklist] Banner image result:", statuses.bannerImageURL);

  // ORCID
  try {
    const user = await api.getUserInformation();
    statuses.ORCID = (user?.orcid?.orcid || "").trim().length > 0;
  } catch (error) {
    clientError(error);
    console.log("[Prepublishing Checklist] ORCID check failed.");
  }
  console.log("[Prepublishing Checklist] ORCID result:", statuses.ORCID);

  console.log("[Prepublishing Checklist] Final statuses:", statuses);
  return statuses;
};

// once the user clicks the Begin Submission button check if they are the data set owner'
// show the next section - which has the pre-publishing checklist - if so
// Function returns true if the dataset has been published, false otherwise
window.resetffmPrepublishingUI = async () => {
  // hide the begin publishing button
  $("#begin-prepublishing-btn").addClass("hidden");
  // resetPrePublishingChecklist();

  // check what the pre-publishing status is
  if (
    document
      .getElementById("para-review-dataset-info-disseminate")
      .innerText.includes("Dataset is currently under review")
  ) {
    // show email curation team message to withdraw dataset
    $("#unshare-dataset-with-curation-team-message").removeClass("hidden");
    $(".pre-publishing-continue-container").hide();
    $("#prepublishing-checklist-container").hide();

    return true;
  }

  // show the pre-publishing checklist and the continue button
  $("#prepublishing-checklist-container").show();
  $(".pre-publishing-continue-container").show();
  $("#unshare-dataset-with-curation-team-message").addClass("hidden");
  return false;
};

// take the user to the Pennsieve account to sign up for an ORCID Id
window.orcidSignIn = async (ev, curationMode) => {
  let curationModeID = "";
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
  }

  if (curationMode === "freeform") {
    if (ev.classList.contains("no-pointer")) {
      return;
    }

    // tell the main process to open a Modal window with the webcontents of the user's Pennsieve profile so they can add an ORCID iD
    window.electron.ipcRenderer.send(
      "orcid",
      "https://orcid.org/oauth/authorize?client_id=APP-DRQCE0GUWKTRCWY2&response_type=code&scope=/authenticate&redirect_uri=https://app.pennsieve.io/orcid-redirect"
    );

    // handle the reply from the asynhronous message to sign the user into Pennsieve
    window.electron.ipcRenderer.on("orcid-reply", async (event, accessCode) => {
      if (!accessCode || accessCode === "") {
        return;
      }

      // show a loading sweet alert
      Swal.fire({
        title: "Connecting your ORCID iD to Pennsieve.",
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      window.log.info("Connecting orcid to Pennsieve account.");

      try {
        await client.post(
          `/user/orcid`,
          { access_code: accessCode },
          {
            params: {
              pennsieve_account: window.defaultBfAccount,
            },
          }
        );
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);
        Swal.fire({
          title: "An issue occurred with connecting your ORCID iD to Pennsieve.",
          html: emessage,
          icon: "error",
          allowEscapeKey: true,
          allowOutsideClick: true,
          confirmButtonText: "Ok",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
        });
        window.logGeneralOperationsForAnalytics(
          "Error",
          window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
          window.AnalyticsGranularity.ALL_LEVELS,
          ["Integrate ORCID iD"]
        );

        return;
      }

      // show a success message
      await Swal.fire({
        title: "ORCID iD integrated with Pennsieve",
        icon: "success",
        allowEscapeKey: true,
        allowOutsideClick: true,
        confirmButtonText: "Ok",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
      });

      // track success
      window.electron.ipcRenderer.send(
        "track-event",
        "Success",
        window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Integrate ORCID iD",
        window.defaultBfDatasetId
      );

      // mark the orcid item green
      setPrepublishingChecklistItemIconByStatus(
        `${curationModeID}prepublishing-checklist-icon-ORCID`,
        true
      );
    });
  }
};

//  This function is the first step to the prepublishing workflow for both guided and freeform mode
//  Function fetches the status of each item needed to publish a dataset from the backend and updates the UI accordingly.
//  inPrePublishing: boolean - True when the function is ran in the pre-publishing submission flow; false otherwise
window.showPrePublishingStatus = async (inPrePublishing = false, curationMode = "") => {
  document.getElementById("pre-publishing-continue-btn").disabled = true;
  $("#pre-publishing-continue-btn").disabled = true;
  let currentDataset = window.defaultBfDataset;
  let curationModeID = "";
  // resetPrePublishingChecklist(curationMode);

  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentDataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];
  }

  // wait until a value has been loaded into the status field
  while ($(`#${curationModeID}para-review-dataset-info-disseminate`).text().trim() == "None") {
    await window.wait(1000);
  }

  if (currentDataset === "Select dataset") {
    return false;
  }

  if (
    $(`#${curationModeID}para-review-dataset-info-disseminate`).text().trim() !=
      "Dataset is not under review currently" &&
    $(`#${curationModeID}para-review-dataset-info-disseminate`).text().trim() !=
      "Dataset has been rejected by your Publishing Team and may require revision"
  ) {
    return false;
  }

  if (curationMode != "guided") {
    // Spinners will not be shown in guided mode
    $(`.${curationModeID}icon-wrapper`).children().css("visibility", "hidden");
  }

  // spinners that fit into the checklist icon slots until statuses have been verified for the items
  $(`.${curationModeID}icon-wrapper`).attr(
    "class",
    `ui mini active inline loader ${curationModeID}icon-wrapper`
  );

  // run the validation checks on each pre-publishing checklist item
  let statuses;
  try {
    statuses = await window.getPrepublishingChecklistStatuses(currentDataset);
  } catch (error) {
    clientError(error);
    if (inPrePublishing) {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        confirmButtonText: "Ok",
        title: "Cannot get verify if dataset is ready to submit",
        text: `Without the statuses you will not be able to submit your dataset. Please try again. `,
        icon: "error",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Fetch Pre-publishing Checklist Statuses"]
    );

    // set the status icons to red crosses
    Array.from(document.querySelectorAll(`.${curationModeID}icon-wrapper i`)).forEach((icon) => {
      icon.classList.remove("check");
      icon.classList.add("cross");
      icon.style.color = "red";
    });

    return false;
  }

  window.logGeneralOperationsForAnalytics(
    "Success",
    window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    window.AnalyticsGranularity.ACTION,
    ["Fetch Pre-publishing Checklist Statuses"]
  );

  // mark each pre-publishing item red or green to indicate if the item was completed
  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-subtitle`,
    statuses.subtitle
  );

  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-readme`,
    statuses.readme
  );

  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-tags`,
    statuses.tags
  );

  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-banner`,
    statuses.bannerImageURL
  );

  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-license`,
    statuses.license
  );

  setPrepublishingChecklistItemIconByStatus(
    `${curationModeID}prepublishing-checklist-icon-ORCID`,
    statuses.ORCID
  );

  if (curationMode === "guided") {
    // Check the status of checklist items for the dataset and alert
    // the user if any of the items are not completed through a sweet alert
    let checklistItemCheck = window.allPrepublishingChecklistItemsCompleted("guided");
    let allItemsChecked = checklistItemCheck[0];
    let checklistItems = checklistItemCheck[1];
    if (!allItemsChecked) {
      let result = await Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        allowEscapeKey: false,
        confirmButtonText: checklistItems.includes("Link ORCID iD") ? "Link ORCID iD" : "Ok",
        showCancelButton: checklistItems.includes("Link ORCID iD") ? true : false,
        title: "Cannot submit dataset yet",
        html: `You must add all of the items below to your dataset before submitting your dataset for review: ${checklistItems
          .map((item) => item)
          .join(
            ", "
          )}. <br> Please try again after adding the missing items through free form mode. `,
        icon: "error",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
        preConfirm: () => {
          //If confirm button says OK, return false to prevent opening the ORCID page
          if (checklistItems.includes("Link ORCID iD")) {
            return "ORCID";
          }
        },
      });

      //If the user clicks the ORCID button, open the ORCID page
      if (result.isConfirmed && result.value === "ORCID") {
        window.orcidSignIn("guided");
      }
      return false;
    } else {
      Swal.close();
      return true;
    }
  }

  // hide the spinner and show the checklist item icons
  $(`.${curationModeID}icon-wrapper`).attr("class", `${curationModeID}icon-wrapper`);
  if (curationMode != "guided") {
    $(`.${curationModeID}icon-wrapper`).children().css("visibility", "visible");
  }

  document.getElementById("pre-publishing-continue-btn").disabled = false;
  $("#pre-publishing-continue-btn").disabled = false;

  return true;
};

// Inputs:
//  iconElementId : string - corresponds with the icons in the pre-publishing checklist
//  status: a boolean corresponding to the checklist item
// gets the pre-publishing checklist item element by id and gives it a check or an 'x' based off the value of the pre-publishing item's status
const setPrepublishingChecklistItemIconByStatus = (iconElementId, status) => {
  let addButton = $(`#${iconElementId}`).parent().siblings()[0];
  if (status) {
    // Change icon of iconElementId to a checkmark
    $(`#${iconElementId}`).attr("class", "check icon");
    $(`#${iconElementId}`).css("color", "green");
    addButton.classList.remove("green-hollow-button");
    addButton.classList.add("text-left");
    addButton.classList.add("no-pointer");
    if (iconElementId.includes("ORCID")) {
      addButton.innerText = "ORCID iD added";
    }
    if (iconElementId.includes("tags")) {
      addButton.innerText = "Tags added";
    }
    if (iconElementId.includes("banner")) {
      addButton.innerText = "Banner image added";
    }
    if (iconElementId.includes("license")) {
      addButton.innerText = "License added";
    }
    if (iconElementId.includes("readme")) {
      addButton.innerText = "Description added";
    }
    if (iconElementId.includes("subtitle")) {
      addButton.innerText = "Subtitle added";
    }
  } else {
    addButton.classList.add("green-hollow-button");
    addButton.classList.remove("text-left");
    addButton.classList.remove("no-pointer");
    if (iconElementId.includes("ORCID")) {
      addButton.innerText = "Link ORCID iD";
    }
    if (iconElementId.includes("tags")) {
      addButton.innerText = "Add tags";
    }
    if (iconElementId.includes("banner")) {
      addButton.innerText = "Add banner image";
    }
    if (iconElementId.includes("license")) {
      addButton.innerText = "Add license";
    }
    if (iconElementId.includes("readme")) {
      addButton.innerText = "Add description";
    }
    if (iconElementId.includes("subtitle")) {
      addButton.innerText = "Add subtitle";
    }
    $(`#${iconElementId}`).attr("class", "close icon");
    $(`#${iconElementId}`).css("color", "red");
  }
};

// reads the pre-publishing checklist items from the UI and returns true if all are completed and false otherwise
// This function checks elements with icon wrapper i class
// If curationMode is guided the return will include an array of the checklist items that are not completed to alert user
window.allPrepublishingChecklistItemsCompleted = (curationMode) => {
  let curationModeID = "";
  let prePublishingChecklistItemNames = [];
  if (curationMode === "guided") {
    curationModeID = "guided--";
  }

  // get the icons for the checklist elements
  let prePublishingChecklistItems = $(`.${curationModeID}icon-wrapper i`);

  // filter out the completed items - by classname
  let incompleteChecklistItems = Array.from(prePublishingChecklistItems).filter((checklistItem) => {
    if (checklistItem.className === "close icon") {
      prePublishingChecklistItemNames.push(checklistItem.dataset.checklistName);
    }
    return checklistItem.className === "close icon";
  });

  // if there are any incomplete checklist items then not all items are complete
  if (curationMode === "guided") {
    return [incompleteChecklistItems.length ? false : true, prePublishingChecklistItemNames];
  }
  return incompleteChecklistItems.length ? false : true;
};

// transition to the final question and populate the file tree with the dataset's metadata files
window.createPrepublishingChecklist = async (curationMode) => {
  let curationModeID = "";
  let currentDataset = window.defaultBfAccount;
  if (curationMode === "guided") {
    currentDataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];
    curationModeID = "guided--";
  }

  if (curationMode === "freeform") {
    document.getElementById("pre-publishing-continue-btn").disabled = true;
    $("#pre-publishing-continue-btn").disabled = true;
    $("#pre-publishing-continue-btn").addClass("loading");
  }

  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!window.allPrepublishingChecklistItemsCompleted(curationMode)) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot continue this submission",
      text: "You need to complete all submission checklist items before you can submit.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
    if (curationMode === "freeform") {
      document.getElementById("pre-publishing-continue-btn").disabled = false;
      $("#pre-publishing-continue-btn").removeClass("loading");
    }

    return false;
  }

  // hide the spinner for the file tree
  $(`.${curationModeID}items-spinner`).hide();

  if (curationMode === "freeform") {
    await window.disseminatePublish("freeform");
    document.getElementById("pre-publishing-continue-btn").disabled = false;
    $("#pre-publishing-continue-btn").disabled = false;
    $("#pre-publishing-continue-btn").removeClass("loading");
    window.resetffmPrepublishingUI();
  }
};

// Check if the user is the dataset owner and transition to the prepublishing checklist question if so
window.validateAndPrepareForCurationSubmission = async () => {
  console.log("[PrepublishingFlow] Starting guided prepublishing flow");

  let currentAccount = window.sodaJSONObj["ps-account-selected"]["account-name"];
  let currentDataset = window.sodaJSONObj["ps-dataset-selected"]["dataset-name"];

  console.log("[PrepublishingFlow] Using account:", currentAccount);
  console.log("[PrepublishingFlow] Using dataset:", currentDataset);

  try {
    console.log("[PrepublishingFlow] Fetching publishing status...");
    let getPublishingStatus = await client.get(
      `/disseminate_datasets/datasets/${currentDataset}/publishing_status`,
      { params: { selected_account: currentAccount } }
    );
    let res = getPublishingStatus.data;
    console.log("[PrepublishingFlow] Publishing status response:", res);

    console.log("[PrepublishingFlow] Running pre-publishing checklist validation...");
    let embargoDetails = await window.submitReviewDatasetCheck(res, "guided");
    console.log("[PrepublishingFlow] Embargo details:", embargoDetails);

    if (embargoDetails[0] === false) {
      console.warn("[PrepublishingFlow] Checklist incomplete. Aborting prepublishing flow.");
      Swal.close();
      return false;
    }

    console.log("[PrepublishingFlow] Fetching user dataset role...");
    let role = await api.getDatasetRole(currentDataset);
    console.log("[PrepublishingFlow] User role for dataset:", role);

    if (role !== "owner") {
      console.warn("[PrepublishingFlow] User is not the dataset owner. Showing error popup.");
      await Swal.fire({
        title: "Only the dataset owner can submit a dataset to the Curation Team.",
        icon: "error",
        confirmButtonText: "Ok",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      return false;
    }

    console.log("[PrepublishingFlow] User is the dataset owner. Proceeding with guided mode.");

    Swal.close();

    if ($("#guided--para-review-dataset-info-disseminate").text() === "") {
      console.log("[PrepublishingFlow] Waiting for review status to populate...");
      await window.wait(1000);
    }

    console.log("[PrepublishingFlow] Showing prepublishing status UI in guided mode...");
    let status = await window.showPrePublishingStatus(true, "guided");
    console.log("[PrepublishingFlow] Prepublishing status result:", status);

    console.log("[PrepublishingFlow] Guided prepublishing flow completed.");
    console.log("[PrepublishingFlow] Final status:", status);
    console.log("[PrepublishingFlow] Embargo details:", embargoDetails);
    return [status, embargoDetails];
  } catch (error) {
    console.error("[PrepublishingFlow] Error during prepublishing flow:", error);
    await Swal.fire({
      title: "Failed to determine if you are the dataset owner",
      text: userErrorMessage(error),
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    clientError(error);
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Determine User's Dataset Role"]
    );
    return false;
  }
};
