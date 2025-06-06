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

const resetSubmissionChecklistText = () => {
  let subtitleText = $(`#prepublishing-checklist-icon-subtitle`).parent().siblings()[0];
  let tagsText = $(`#prepublishing-checklist-icon-tags`).parent().siblings()[0];
  let desctiptionText = $(`#prepublishing-checklist-icon-readme`).parent().siblings()[0];
  let bannerText = $(`#prepublishing-checklist-icon-banner`).parent().siblings()[0];
  let licenseText = $(`#prepublishing-checklist-icon-license`).parent().siblings()[0];
  let orcidText = $(`#prepublishing-checklist-icon-ORCID`).parent().siblings()[0];

  subtitleText.innerText = "Checking subtitle";
  tagsText.innerText = "Checking tags";
  desctiptionText.innerText = "Checking description";
  bannerText.innerText = "Checking banner image";
  licenseText.innerText = "Checking license";
  orcidText.innerText = "Checking ORCID ID";

  let elements = [subtitleText, tagsText, desctiptionText, bannerText, licenseText, orcidText];

  elements.forEach((element) => {
    element.classList.remove("green-hollow-button");
    element.classList.add("text-left");
    element.classList.add("no-pointer");
  });
};

/**
 *
 * @param {string} currentDataset - The currently selected dataset - name
 * @returns statuses - A status object that details the state of each pre-publishing checklist item for the given dataset and user
 */
window.getPrepublishingChecklistStatuses = async (currentDataset) => {
  // check that a dataset name or id is provided
  if (!currentDataset || currentDataset === "") {
    throw new Error(
      "Error: Must provide a valid dataset to log status of submission checklist items from."
    );
  }

  // construct the statuses object
  const statuses = {};

  let dataset;
  try {
    dataset = await api.getDataset(currentDataset);
  } catch (error) {
    clientError(error);
  }

  // get the description - aka subtitle (unfortunate naming), tags, banner image URL, collaborators, and license
  let { description, tags, license } = dataset["content"];
  description = description.trim();

  // set the subtitle's status
  statuses.subtitle = description && description.length ? true : false;

  let readme = await api.getDatasetReadme(window.defaultBfAccount, currentDataset);
  readme = readme.trim();

  // set the readme's status
  statuses.readme = readme && readme.length >= 1 ? true : false;

  // set tags's status
  statuses.tags = tags && tags.length ? true : false;

  let bannerImageURL = await api.getDatasetBannerImageURL(window.defaultBfAccount, currentDataset);

  // set the banner image's url status
  statuses.bannerImageURL = bannerImageURL !== "No banner image" ? true : false;

  // set the license's status
  statuses.license = license && license.length ? true : false;

  // declare the orcidId
  let orcidId;

  // get the user's information
  let user = await api.getUserInformation();

  // get the orcid object out of the user information
  let orcidObject = user.orcid;

  // check if the owner has an orcid id
  if (orcidObject) {
    orcidId = orcidObject.orcid;
  } else {
    orcidId = undefined;
  }

  // the user has an ORCID iD if the property is defined and non-empty
  statuses.ORCID = orcidId && orcidId.length ? true : false;

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
  resetSubmissionChecklistText();
  document.getElementById("pre-publishing-continue-btn").disabled = true;
  $("#pre-publishing-continue-btn").disabled = true;
  let currentDataset = window.defaultBfDataset;
  let curationModeID = "";
  // resetPrePublishingChecklist(curationMode);

  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
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
    currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
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

// check if the user is the dataset owner and transition to the prepublishing checklist question if so
// TODO: Dorian handle the freeform withdraw button and remove it
window.beginPrepublishingFlow = async (curationMode) => {
  let currentDataset = window.defaultBfDataset;
  let currentAccount = window.defaultBfAccount;

  let curationModeID = "";
  let embargoDetails;
  if (curationMode === "guided") {
    curationModeID = "guided--";
    currentAccount = window.sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = window.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    let get_publishing_status = await client.get(
      `/disseminate_datasets/datasets/${currentDataset}/publishing_status`,
      {
        params: {
          selected_account: currentAccount,
        },
      }
    );
    let res = get_publishing_status.data;

    // Don't send true until pre-publishing checklist is complete
    embargoDetails = await window.submitReviewDatasetCheck(res, "guided");
    if (embargoDetails[0] === false) {
      Swal.close();
      return false;
    }
  }
  if (curationMode === "freeform" || curationMode === undefined) {
    resetSubmissionChecklistText();

    Swal.fire({
      title: "Determining your dataset permissions",
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
  }
  let role;
  try {
    // check if the user is the dataset owner
    const { userRole, userCanModifyPennsieveMetadata } =
      await api.getDatasetAccessDetails(currentDataset);
    role = userRole;
  } catch (error) {
    // tell the user something went wrong getting access to their dataset permissions
    await Swal.fire({
      title: "Failed to determine if you are the dataset owner",
      text: userErrorMessage(error),
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // log the error information then continue execution -- this is because they may not want to ignore files when they publish
    clientError(error);
    window.logGeneralOperationsForAnalytics(
      "Error",
      window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      window.AnalyticsGranularity.ALL_LEVELS,
      ["Determine User's Dataset Role"]
    );

    return false;
  }

  window.logGeneralOperationsForAnalytics(
    "Success",
    window.DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    window.AnalyticsGranularity.ACTION,
    ["Determine User's Dataset Role"]
  );

  // check if the user is the owner
  if (role !== "owner") {
    await Swal.fire({
      title: "Only the dataset owner can submit a dataset to the Curation Team.",
      icon: "error",
      confirmButtonText: "Ok",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    return false;
  }

  // Close the swal pop up for freeform mode
  Swal.close();

  // wait for the Review status to be filled
  if ($(`#${curationModeID}para-review-dataset-info-disseminate`).text() === "") {
    await window.wait(1000);
  }

  // transition to the next question if not in guided mode
  // load the next question's data
  if (curationMode !== "guided") {
    let reviewDatasetInfo = $("#para-review-dataset-info-disseminate").text();
    let datasetHasBeenPublished = await window.resetffmPrepublishingUI();

    $("#begin-prepublishing-btn").addClass("hidden");
    $("#submit_prepublishing_review-question-2").removeClass("show");
    $("#submit_prepublishing_review-question-3").addClass("show");
    document.getElementById("pre-publishing-continue-btn").disabled = true;
    $("#pre-publishing-continue-btn").disabled = true;

    if (!datasetHasBeenPublished) {
      window.smoothScrollToElement("prepublishing-checklist");

      let success = await window.showPrePublishingStatus(true, "freeform");
      if (!success) {
        await Swal.fire({
          title: "Cannot continue this submission",
          text: `Please try again shortly.`,
          icon: "error",
          allowEscapeKey: true,
          allowOutsideClick: true,
          confirmButtonText: "Ok",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          timerProgressBar: false,
        });
        $("#submit_prepublishing_review-question-3").removeClass("show");
        $("#submit_prepublishing_review-question-1").removeClass("prev");
        $("#submit_prepublishing_review-question-2").addClass("show");
        $("#begin-prepublishing-btn").removeClass("hidden");
        return;
      }
    }
  } else {
    //Curation mode is guided mode
    let status = await window.showPrePublishingStatus(true, "guided");
    return [status, embargoDetails];
  }
};

const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
