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

  // set the banner image's url status
  statuses.bannerImageURL = bannerImageURL && bannerImageURL.length ? true : false;

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
        title: "Unable to integrate your ORCID iD with Pennsieve",
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
  let currentDataset = defaultBfDataset;
  let curationModeID = "";
  // resetPrePublishingChecklist(curationMode);

  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    console.log("is guided mode here as well");
    // Reset the language for the pre-publishing checklist items
    $("#guided--prepublishing-checklist-container").removeClass("hidden");
    smoothScrollToElement(`guided--prepublishing-continue-btn`, "end", "nearest");
  }
  console.log(currentDataset);

  if (currentDataset === "Select dataset") {
    return;
  }

  if (
    $(`#${curationModeID}para-review-dataset-info-disseminate`).text() !==
    "Dataset is not under review currently"
  ) {
    console.log("returning here");
    return;
  }

  // spinners that fit into the checklist icon slots until statuses have been verified for the items
  $(`.${curationModeID}icon-wrapper`).attr(
    "class",
    `ui mini active inline loader ${curationModeID}icon-wrapper`
  );
  $(`.${curationModeID}icon-wrapper`).children().css("visibility", "hidden");

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
        title: "Cannot get pre-publication checklist statuses",
        text: `Without the statuses you will not be able to publish your dataset. Please try again. `,
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
      console.log("changing to red icon");
      icon.classList.remove("check");
      icon.classList.add("cross");
      icon.style.color = "red";
    });

    return;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
    AnalyticsGranularity.ACTION,
    ["Fetch Pre-publishing Checklist Statuses"]
  );

  console.log(statuses);

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

  // hide the spinner and show the checklist item icons
  $(`.${curationModeID}icon-wrapper`).attr("class", `${curationModeID}icon-wrapper`);
  $(`.${curationModeID}icon-wrapper`).children().css("visibility", "visible");
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
// This function checks all elements with icon wrapper i class
// half belong to guided mode and the other half belongs to free form mode
const allPrepublishingChecklistItemsCompleted = (curationMode) => {
  let curationModeID = "";
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
  }
  // get the icons for the checklist elements
  let prePublishingChecklistItems = $(`.${curationModeID}icon-wrapper i`);
  console.log(prePublishingChecklistItems);

  // filter out the completed items - by classname
  let incompleteChecklistItems = Array.from(prePublishingChecklistItems).filter((checklistItem) => {
    return checklistItem.className === "close icon";
  });

  // if there are any incomplete checklist items then not all items are complete
  return incompleteChecklistItems.length ? false : true;
};

// once the user clicks the Begin Submission button check if they are the data set owner'
// show the next section - which has the pre-publishing checklist - if so
const transitionToPrepublishingQuestionThree = async () => {
  // hide the begin publishing button
  $("#begin-prepublishing-btn").hide();
  // resetPrePublishingChecklist();

  // hide the excluded files container
  // because the Submit button transitions back to question three after showing this container
  // it needs to be hidden
  $("#excluded-files-container").hide();

  // check what the pre-publishing status is
  if (
    $("#para-review-dataset-info-disseminate").text() ===
    "Dataset is currently under review by your Publishing Team"
  ) {
    console.log("showing withdraw button");
    // show the withdraw button
    $("#prepublishing-withdraw-btn-container").show();
    $("#prepublishing-withdraw-btn-container button").show();
    $(".pre-publishing-continue-container").hide();
    $("#prepublishing-checklist-container").hide();

    return;
  }

  console.log("showing checklist container");
  // show the pre-publishing checklist and the continue button
  $("#prepublishing-checklist-container").show();
  $(".pre-publishing-continue-container").show();
  $("#prepublishing-withdraw-btn-container").hide();
  $("#prepublishing-withdraw-btn-container button").hide();
};

// user clicks on the 'Continue' button and navigates to the file tree wherein they can decide which
// files will be excluded from the dataset upon publishing
const transitionToPrePublishingSubmit = async () => {
  // check that the user completed all pre-publishing checklist items for the given dataset
  if (!allPrepublishingChecklistItemsCompleted()) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot continue this pre-publication review submission",
      text: "You need to complete all pre-publishing checklist items before you can continue to the next step of the pre-publication review flow.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    // halt execution
    return false;
  }

  // hide the continue button
  $(".pre-publishing-continue-container").hide();

  // show the submit button
  $("#prepublishing-submit-btn-container").show();

  // show the excluded files section
  $("#excluded-files-container").show();

  return true;
};

// bold a metadata file once the user checks it
$("#items-pre-publication").on("click", function (evt) {
  let target = evt.target;

  if (target.nodeName && target.nodeName.toLowerCase() === "input") {
    // if target has a checked property and it is set to true
    if (target.checked) {
      // add a selected class to the label
      let label = target.nextSibling;
      label.classList.add("pre-publishing-file-viewer-file-selected");
    } else if (target.checked !== undefined && target.checked === false) {
      // remove the selected styling
      let label = target.nextSibling;
      label.classList.remove("pre-publishing-file-viewer-file-selected");
    }
  }
});

// bold a metadata file once the user checks it
$("#guided--items-pre-publication").on("click", function (evt) {
  let target = evt.target;

  if (target.nodeName && target.nodeName.toLowerCase() === "input") {
    // if target has a checked property and it is set to true
    if (target.checked) {
      // add a selected class to the label
      let label = target.nextSibling;
      label.classList.add("pre-publishing-file-viewer-file-selected");
    } else if (target.checked !== undefined && target.checked === false) {
      // remove the selected styling
      let label = target.nextSibling;
      label.classList.remove("pre-publishing-file-viewer-file-selected");
    }
  }
});

// transition to the final question and populate the file tree with the dataset's metadata files
const createPrepublishingChecklist = async (curationMode) => {
  console.log("within createPrepublishingChecklist");
  console.log(curationMode);
  // check that the user completed all pre-publishing checklist items for the given dataset
  let curationModeID = "";
  let currentDataset = defaultBfDataset;
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    curationModeID = "guided--";
  }
  if (!allPrepublishingChecklistItemsCompleted(curationMode)) {
    // alert the user they must complete all checklist items before beginning the prepublishing process
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: "Cannot continue this pre-publication review submission",
      text: "You need to complete all pre-publishing checklist items before you can continue to the next step of the pre-publication review flow.",
      icon: "error",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    return;
  }

  if (curationMode !== "guided") {
    // transition to the final section
    let elementClicked = document.getElementById("pre-publishing-continue-btn");
    console.log(elementClicked);
    transitionFreeFormMode(
      elementClicked,
      "submit_prepublishing_review-question-3",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );
  }

  // hide the continue button
  $(`.${curationModeID}pre-publishing-continue-container`).hide();

  // show the submit button
  $(`#${curationModeID}prepublishing-submit-btn-container`).show();

  // show the excluded files section
  $(`#${curationModeID}excluded-files-container`).show();

  // reset the file viewer so no duplicates appear
  removeChildren(document.querySelector(`#${curationModeID}items-pre-publication`));

  // show a spinner on the file tree
  $(`.${curationModeID}items-spinner`).show();

  let excludedFileObjects;
  try {
    // read in the excluded files
    excludedFileObjects = await api.getFilesExcludedFromPublishing(currentDataset);
  } catch (error) {
    clientError(error);
    // tell the user something went wrong getting access to their datasets ignored files
    await Swal.fire({
      title: "Failed to get information on any ignored files you may have",
      text: "If you have dataset files you already set to be ignored and would like to add more, please try publishing again later.",
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Get Excluded Files",
      defaultBfDatasetId
    );

    // continue as they may not want to set any "ignore files" anyways
    // hide the spinner for the file tree
    $(`.${curationModeID}items-spinner`).hide();
  }

  ipcRenderer.send(
    "track-event",
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Get Excluded Files",
    defaultBfDatasetId
  );

  let metadataFiles;
  try {
    // read in all of the metadata files for the dataset
    metadataFiles = await api.getDatasetMetadataFiles(currentDataset);
  } catch (error) {
    clientError(error);
    // tell the user something went wrong getting access to their datasets ignored files
    await Swal.fire({
      title: "Failed to get your dataset's files",
      text: "If you would like to select files from your dataset to be ignored in the publishing process, please try again later.",
      icon: "error",
      confirmButtonText: "Ok",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
    });

    // log the error information then continue execution -- this is because they may not want to ignore files when they publish
    ipcRenderer.send(
      "track-event",
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Get Metadata Files",
      defaultBfDatasetId
    );

    return;
  }

  ipcRenderer.send(
    "track-event",
    "Success",
    DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW + " - Get Metadata Files",
    defaultBfDatasetId
  );

  // place the metadata files in the file viewer - found in step 3 of the pre-publishing submission worfklow
  console.log("before populateFileViewer");
  populateFileViewer(
    metadataFiles,
    excludedFileObjects.map((fileObject) => fileObject.fileName),
    curationMode
  );

  // hide the spinner for the file tree
  $(`.${curationModeID}items-spinner`).hide();
};

// check if the user is the dataset owner and transition to the prepublishing checklist question if so
const beginPrepublishingFlow = async (curationMode) => {
  let currentDataset = defaultBfDataset;

  let curationModeID = "";
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
    currentDataset = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
  }

  Swal.fire({
    title: "Determining your dataset permissions",
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

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
      title: "Only the dataset owner can submit a dataset for pre-publishing review.",
      icon: "error",
      confirmButtonText: "Ok",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    return false;
  }

  // close the loading popup
  Swal.close();

  // wait for the Review status to be filled
  if ($(`#${curationModeID}para-review-dataset-info-disseminate`).text() === "") {
    await wait(1000);
  }

  // transition to the next question if not in guided mode
  // load the next question's data
  if (curationMode !== "guided") {
    let elementClicked = document.getElementById("begin-prepublishing-btn");
    console.log(elementClicked);
    transitionFreeFormMode(
      elementClicked,
      "submit_prepublishing_review-question-2",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );
    await showPrePublishingStatus(true);
  } else {
    //Curation mode is guided mode
    console.log("is guided mode");
    await showPrePublishingStatus(true, "guided");
    return true;
  }
};

// TODO: Adapt this function to be used in Guided mode
// Takes an array of file names and places the files inside of the file viewer found in step 3 of the pre-publicaiton submission process
const populateFileViewer = (metadataFiles, excludedFiles, curationMode) => {
  let curationModeID = "";
  if (curationMode === "guided") {
    // This is done to ensure the right element ID is called
    // Guided mode elements have 'guided--' prepended to their ID
    curationModeID = "guided--";
  }

  console.log(excludedFiles);

  // get the file viewer element
  let fileViewer = document.querySelector(`#${curationModeID}items-pre-publication`);

  // // traverse the given files
  metadataFiles.forEach((file) => {
    // create a top level container
    let div = document.createElement("div");
    div.classList.add(`${curationModeID}pre-publishing-metadata-file-container`);

    // create the checkbox
    let input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("name", `${file}`);
    input.classList.add(`pre-publishing-metadata-file-input`);
    // check if the user already has this file marked as ecluded
    if (excludedFiles.includes(file)) {
      input.checked = true;
    }

    // create the label
    let label = document.createElement("label");
    label.setAttribute("for", `${file}`);
    label.textContent = `${file}`;
    label.classList.add(`pre-publishing-metadata-file-label`);
    if (excludedFiles.includes(file)) {
      label.classList.add(`pre-publishing-file-viewer-file-selected`);
    }

    // add the input and label to the container
    div.appendChild(input);
    div.appendChild(label);

    // add the struture to the file viewer
    fileViewer.appendChild(div);
  });
};

// TODO: Dorian -> Adapt this function to be used in Guided Mode
// Check if there are excluded files in the excluded files list found in step 3 of the pre-publication submission workflow
const excludedFilesInPublicationFlow = (curationMode) => {
  let curationModeID = "";
  if (curationMode === "guided") {
    curationModeID = "guided--";
  }
  // get the checked UI elements in step 3 of the pre-publication submission flow
  let excludedFilesList = document.querySelectorAll(
    `#${curationModeID}items-pre-publication input[type='checkbox']:checked`
  );

  //return true if the list has children and false otherwise
  return excludedFilesList.length >= 1 ? true : false;
};

// retrieves the file path and name from the list of excluded files found in step 3 of the pre-publication submission workflow
// Output:
//  [{fileName: string}]
// TODO: Dorian -> Adapt this function to be used in Guided Mode
const getExcludedFilesFromPublicationFlow = (curationMode) => {
  // get the list items
  let curationModeID = "";
  if (curationMode === "guided") {
    curationModeID = "guided--";
  }

  let excludedFilesListItems = document.querySelectorAll(
    `#${curationModeID}items-pre-publication input[type='checkbox']:checked`
  );

  // iterate through each item
  let fileNames = Array.from(excludedFilesListItems).map((listItem) => {
    // get the Span element's text from the current list item
    let fileName = listItem.nextSibling.textContent;

    // return the filename in an object
    return { fileName };
  });

  // return the file names list
  return fileNames;
};

const removeChildren = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
};
