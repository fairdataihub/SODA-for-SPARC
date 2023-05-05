/*
******************************************************
******************************************************
Submit for pre-publishing review Workflow scripts 

Note: Some frontend elements of the workflow are in the renderer.js file as well. They are can be found under postCurationListChange() function.

******************************************************
******************************************************
*/

/**
 *
 * @param {string} currentDataset - The currently selected dataset - name
 * @returns statuses - A status object that details the state of each pre-publishing checklist item for the given dataset and user
 */
const getPrepublishingChecklistStatuses = async (currentDataset) => {
  // check that a dataset name or id is provided
  if (!currentDataset || currentDataset === "") {
    throw new Error(
      "Error: Must provide a valid dataset to log status of pre-publishing checklist items from."
    );
  }

  // construct the statuses object
  const statuses = {};

  let dataset = await api.getDataset(currentDataset);

  // get the description - aka subtitle (unfortunate naming), tags, banner image URL, collaborators, and license
  const { description, tags, license } = dataset["content"];

  // set the subtitle's status
  statuses.subtitle = description && description.length ? true : false;

  let readme = await api.getDatasetReadme(defaultBfAccount, currentDataset);

  // set the readme's status
  statuses.readme = readme && readme.length >= 1 ? true : false;

  // set tags's status
  statuses.tags = tags && tags.length ? true : false;

  let bannerImageURL = await api.getDatasetBannerImageURL(defaultBfAccount, currentDataset);
  console.log(bannerImageURL)

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

// take the user to the Pennsieve account to sign up for an ORCID Id
const orcidSignIn = async (curationMode) => {
  let curationModeID = "";
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
  }

  // tell the main process to open a Modal window with the webcontents of the user's Pennsieve profile so they can add an ORCID iD
  ipcRenderer.send(
    "orcid",
    "https://orcid.org/oauth/authorize?client_id=APP-DRQCE0GUWKTRCWY2&response_type=code&scope=/authenticate&redirect_uri=https://app.pennsieve.io/orcid-redirect"
  );

  // handle the reply from the asynhronous message to sign the user into Pennsieve
  ipcRenderer.on("orcid-reply", async (event, accessCode) => {
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

    log.info("Connecting orcid to Pennsieve account.");

    try {
      await client.post(
        `/user/orcid`,
        { access_code: accessCode },
        {
          params: {
            pennsieve_account: defaultBfAccount,
          },
        }
      );
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);
      Swal.fire({
        title: "An issue occurred with connecting your ORCID iD to Pennsieve.",
        text: emessage,
        icon: "error",
        allowEscapeKey: true,
        allowOutsideClick: true,
        confirmButtonText: "Ok",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
      });
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
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
    ipcRenderer.send(
      "track-event",
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Integrate ORCID iD",
      defaultBfDatasetId
    );

    // mark the orcid item green
    setPrepublishingChecklistItemIconByStatus(
      `${curationModeID}prepublishing-checklist-icon-ORCID`,
      true
    );
  });
};

// TODO: Dorian -> finish this function to reset the text of the checklist items
// const resetPrePublishingChecklist = (curationMode) => {
//   let curationModeID = "";
//   if (curationMode === "guided") {
//     curationModeID = "guided--";
//   }
//   let checkListItems = $(".prepublishing-item-button");
//   for (let i = 0; i < checkListItems.length; i++) {
//     let item = checkListItems[i];
//     console.log(item);
//     let itemText = item.innerText;
//     if (!itemText.includes("Orcid") && !itemText.includes("Add")) {
//       let resetText = itemText.replace(" added", "");
//       //Lowercase the first letter of the string
//       resetText = resetText.charAt(0).toLowerCase() + resetText.slice(1);
//       item.innerText = "Add " + resetText;
//       console.log(item.innerText);
//     }
//     else if(itemText.includes("Orcid") && !itemText.includes("Link")){
//       let resetText = itemText.replace(" linked", "");
//       item.innerText = "Link " + resetText;
//       console.log(item.innerText);
//     }
//   }
// }

//  This function is the first step to the prepublishing workflow for both guided and freeform mode
//  Function fetches the status of each item needed to publish a dataset from the backend and updates the UI accordingly.
//  inPrePublishing: boolean - True when the function is ran in the pre-publishing submission flow; false otherwise
const showPrePublishingStatus = async (inPrePublishing = false, curationMode = "") => {
  console.log("Showing pre-publishing statuses")
  let currentDataset = defaultBfDataset;
  let curationModeID = "";
  // resetPrePublishingChecklist(curationMode);

  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    console.log("is guided mode here as well");
  }

  if (
    currentDataset === "Select dataset" ||
    $(`#${curationModeID}para-review-dataset-info-disseminate`).text() !==
      "Dataset is not under review currently"
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
    statuses = await getPrepublishingChecklistStatuses(currentDataset);
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
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Fetch Pre-publishing Checklist Statuses"]
    );

    // set the status icons to red crosses
    Array.from(document.querySelectorAll(`.${curationModeID}icon-wrapper i`)).forEach((icon) => {
      icon.classList.remove("check");
      icon.classList.add("cross");
      icon.style.color = "red";
    });

    return;
  }

  console.log(statuses);
  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ACTION,
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
    let checklistItemCheck = allPrepublishingChecklistItemsCompleted("guided");
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
        orcidSignIn("guided");
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
};

// Inputs:
//  iconElementId : string - corresponds with the icons in the pre-publishing checklist
//  status: a boolean corresponding to the checklist item
// gets the pre-publishing checklist item element by id and gives it a check or an 'x' based off the value of the pre-publishing item's status
const setPrepublishingChecklistItemIconByStatus = (iconElementId, status) => {
  if (status) {
    // Change icon of iconElementId to a checkmark
    $(`#${iconElementId}`).attr("class", "check icon");
    $(`#${iconElementId}`).css("color", "green");

    // // Change text of iconElementId to let user know that the item has been linked
    // let itemButton = $(`#${iconElementId}`).parent().siblings()[0];
    // let itemButtonText = itemButton.innerText;
    // if(itemButtonText.includes("Link")) {
    //   let updatedButtonText = itemButtonText.replace("Link", "") + " linked";
    //   itemButton.innerText = updatedButtonText;
    // }
    // if(itemButtonText.includes("Add")) {
    //   let updatedButtonText = itemButtonText.replace("Add", "") + " added";
    //   updatedButtonText = updatedButtonText.slice(1);
    //   // Capitalize the first letter updatedButtonText
    //   console.log("before updating text " + updatedButtonText)
    //   let asdf = updatedButtonText.charAt(0).toUpperCase() + updatedButtonText.slice(1);
    //   console.log(asdf);
    //   itemButton.innerText = asdf;
    // }
  } else {
    $(`#${iconElementId}`).attr("class", "close icon");
    $(`#${iconElementId}`).css("color", "red");
  }
};

// reads the pre-publishing checklist items from the UI and returns true if all are completed and false otherwise
// This function checks elements with icon wrapper i class
// If curationMode is guided the return will include an array of the checklist items that are not completed to alert user
const allPrepublishingChecklistItemsCompleted = (curationMode) => {
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

// once the user clicks the Begin Submission button check if they are the data set owner'
// show the next section - which has the pre-publishing checklist - if so
// Function returns true if the dataset has been published, false otherwise
const resetffmPrepublishingUI = async () => {
  // hide the begin publishing button
  $("#begin-prepublishing-btn").addClass("hidden");
  // resetPrePublishingChecklist();

  // check what the pre-publishing status is
  if (
    document
      .getElementById("para-review-dataset-info-disseminate")
      .innerText.includes("Dataset is currently under review")
  ) {
    console.log("here");
    // show the withdraw button
    // TODO: Dorian -> Remove withdraw button and show message instead
    $("#prepublishing-withdraw-btn-container").show();
    $("#prepublishing-withdraw-btn-container button").show();
    $(".pre-publishing-continue-container").hide();
    $("#prepublishing-checklist-container").hide();

    return true;
  }

  console.log("here2");
  // show the pre-publishing checklist and the continue button
  $("#prepublishing-checklist-container").show();
  $(".pre-publishing-continue-container").show();
  $("#prepublishing-withdraw-btn-container").hide();
  $("#prepublishing-withdraw-btn-container button").hide();
  return false;
};

// transition to the final question and populate the file tree with the dataset's metadata files
const createPrepublishingChecklist = async (curationMode) => {
  let curationModeID = "";
  let currentDataset = defaultBfDataset;
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    curationModeID = "guided--";
  }

  if (curationMode === "freeform") {
    document.getElementById("pre-publishing-continue-btn").disabled = true;
    $("#pre-publishing-continue-btn").addClass("loading");
  }

  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted(curationMode)) {
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
    await disseminatePublish("freeform");
    document.getElementById("pre-publishing-continue-btn").disabled = false;
    $("#pre-publishing-continue-btn").removeClass("loading");
    resetffmPrepublishingUI();
  }
};

// check if the user is the dataset owner and transition to the prepublishing checklist question if so
// TODO: Dorian handle the freeform withdraw button and remove it
const beginPrepublishingFlow = async (curationMode) => {
  let currentDataset = defaultBfDataset;
  let currentAccount = defaultBfAccount;

  let curationModeID = "";
  let embargoDetails;
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentAccount = sodaJSONObj["bf-account-selected"]["account-name"];
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    let get_publishing_status = await client.get(
      `/disseminate_datasets/datasets/${currentDataset}/publishing_status`,
      {
        params: {
          selected_account: currentAccount,
        },
      }
    );
    let res = get_publishing_status.data;
    console.log(res);

    // Don't send true until pre-publishing checklist is complete
    embargoDetails = await submitReviewDatasetCheck(res, "guided");
    if (embargoDetails[0] === false) {
      Swal.close();
      return false;
    }
  }
  if (curationMode === "freeform") {
    console.log("within ffm");

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

  // check if the user is the dataset owner
  let role;
  try {
    role = await api.getDatasetRole(currentDataset);
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
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Determine User's Dataset Role"]
    );

    return false;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ACTION,
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
    console.log("is blank");
    await wait(1000);
  }

  // transition to the next question if not in guided mode
  // load the next question's data
  if (curationMode !== "guided") {
    let reviewDatasetInfo = $("#para-review-dataset-info-disseminate").text();
    let datasetHasBeenPublished = await resetffmPrepublishingUI();
    console.log("datasetHasBeenPublished: " + datasetHasBeenPublished);

    $("#begin-prepublishing-btn").addClass("hidden");
    $("#submit_prepublishing_review-question-2").removeClass("show");
    $("#submit_prepublishing_review-question-3").addClass("show");

    if (!datasetHasBeenPublished) {
      smoothScrollToElement("prepublishing-checklist");

      await showPrePublishingStatus(true, "freeform");
    }
  } else {
    //Curation mode is guided mode
    console.log("is guided mode");

    console.log(embargoDetails);

    let status = await showPrePublishingStatus(true, "guided");
    console.log(status);
    return [status, embargoDetails];
  }
};

const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
