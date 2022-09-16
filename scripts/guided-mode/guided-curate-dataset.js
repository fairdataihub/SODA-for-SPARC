const updateDatasetUploadProgressTable = (progressObject) => {
  const datasetUploadTableBody = document.getElementById(
    "guided-tbody-dataset-upload"
  );
  //delete datasetUPloadTableBody children with class "upload-status-tr"
  const uploadStatusTRs =
    datasetUploadTableBody.querySelectorAll(".upload-status-tr");
  for (const uploadStatusTR of uploadStatusTRs) {
    datasetUploadTableBody.removeChild(uploadStatusTR);
  }
  //remove dtasetUploadTableBody children that don't have the id guided-upload-progress-bar-tr
  for (const child of datasetUploadTableBody.children) {
    if (!child.getAttribute("id") === "guided-upload-progress-bar-tr") {
      datasetUploadTableBody.removeChild(child);
    }
  }
  let uploadStatusElement = "";
  for (const [uploadStatusKey, uploadStatusValue] of Object.entries(
    progressObject
  ))
    uploadStatusElement += `
      <tr class="upload-status-tr">
        <td class="middle aligned progress-bar-table-left">
          <b>${uploadStatusKey}:</b>
        </td>
        <td class="middle aligned remove-left-border">${uploadStatusValue}</td>
      </tr>
    `;
  //insert adjustStatusElement at the end of datasetUploadTablebody
  datasetUploadTableBody.insertAdjacentHTML("beforeend", uploadStatusElement);
};

const guidedLockSideBar = () => {
  const sidebar = document.getElementById("sidebarCollapse");
  if (!sidebar.classList.contains("active")) {
    sidebar.click();
  }

  sidebar.disabled = true;
};

guidedUnLockSideBar = () => {
  const sidebar = document.getElementById("sidebarCollapse");
  if (sidebar.classList.contains("active")) {
    sidebar.click();
  }

  sidebar.disabled = false;
};

const guidedSetCurationTeamUI = (boolSharedWithCurationTeam) => {
  const textSharedWithCurationTeamStatus = document.getElementById(
    "guided-dataset-shared-with-curation-team-status"
  );
  if (boolSharedWithCurationTeam) {
    textSharedWithCurationTeamStatus.innerHTML =
      "Shared with the SPARC Curation Team";
    $("#guided-button-share-dataset-with-curation-team").hide();
    $("#guided-button-unshare-dataset-with-curation-team").show();
  } else {
    textSharedWithCurationTeamStatus.innerHTML =
      "Not shared with the SPARC Curation Team";
    $("#guided-button-share-dataset-with-curation-team").show();
    $("#guided-button-unshare-dataset-with-curation-team").hide();
  }
};

const guidedModifyCurationTeamAccess = async (action) => {
  if (action === "share") {
    const guidedShareWithCurationTeamButton = document.getElementById(
      "guided-button-share-dataset-with-curation-team"
    );
    guidedShareWithCurationTeamButton.disabled = true;
    guidedShareWithCurationTeamButton.classList.add("loading");
    const { value: confirmShareWithCurationTeam } = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      focusCancel: true,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "This will inform the Curation Team that your dataset is ready to be reviewed. It is then advised not to make changes to the dataset until the Curation Team contacts you. Would you like to continue?",
    });
    if (confirmShareWithCurationTeam) {
      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "manager",
          },
          {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: sodaJSONObj["digital-metadata"]["name"],
              scope: "team",
              name: "SPARC Data Curation Team",
            },
          }
        );
        guidedSetCurationTeamUI(true);
        swal.fire({
          width: "550px",
          icon: "success",
          title: "Dataset successfully shared with the Curation Team",
          html: `It is now advised that you do not make changes to the dataset until
          the Curation Team follows up with you.`,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          confirmButtonText: "OK",
          focusConfirm: true,
        });
      } catch (error) {
        notyf.open({
          duration: "5000",
          type: "error",
          message: "Error sharing dataset with the Curation Team",
        });
      }
    }
    guidedShareWithCurationTeamButton.disabled = false;
    guidedShareWithCurationTeamButton.classList.remove("loading");
  }
  if (action === "unshare") {
    const guidedUnshareWithCurationTeamButton = document.getElementById(
      "guided-button-unshare-dataset-with-curation-team"
    );
    guidedUnshareWithCurationTeamButton.disabled = true;
    guidedUnshareWithCurationTeamButton.classList.add("loading");

    const { value: confirmUnshareWithCurationTeam } = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      focusCancel: true,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "Are you sure you would like to remove the SPARC Data Curation Team as a manager of this dataset?",
    });
    if (confirmUnshareWithCurationTeam) {
      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "remove current permissions",
          },
          {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: sodaJSONObj["digital-metadata"]["name"],
              scope: "team",
              name: "SPARC Data Curation Team",
            },
          }
        );
        guidedSetCurationTeamUI(false);
        swal.fire({
          width: "550px",
          icon: "success",
          title: "Dataset successfully unshared with the Curation Team",
          html: `You are now free to make any necessary modifications to your dataset. Once you are
          ready to reshare with the Curation Team, please revisit this page.`,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          confirmButtonText: "OK",
          focusConfirm: true,
        });
      } catch (error) {
        notyf.open({
          duration: "5000",
          type: "error",
          message: "Error removing Curation Team access",
        });
      }
    }
    guidedUnshareWithCurationTeamButton.disabled = false;
    guidedUnshareWithCurationTeamButton.classList.remove("loading");
  }
};

const guidedSaveAndExit = async (exitPoint) => {
  if (exitPoint === "main-nav" || exitPoint === "sub-nav") {
    const { value: returnToGuidedHomeScreen } = await Swal.fire({
      title: "Are you sure?",
      text: `Exiting Guided Mode will discard any changes you have made on the
      current page. You will be taken back to the homescreen, where you will be able
      to continue the current dataset you are curating which will be located under datasets
      in progress.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Exit guided mode",
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    });
    if (returnToGuidedHomeScreen) {
      guidedUnLockSideBar();
      saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
      traverseToTab("guided-dataset-starting-point-tab");
      hideSubNavAndShowMainNav("back");
      $("#guided-button-dataset-intro-back").click();
      $("#guided-button-dataset-intro-back").click();
    }
  } else if (exitPoint === "intro") {
    const { value: returnToGuidedHomeScreen } = await Swal.fire({
      title: "Are you sure?",
      text: `Transitioning from guided mode to free form mode will cause you to lose
        the progress you have made on the current page. You will still be able to continue
        curating your current dataset by selecting its card on the guided mode homepage.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Exit guided mode",
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    });
    if (returnToGuidedHomeScreen) {
      guidedUnLockSideBar();
      const guidedIntroPage = document.getElementById("guided-intro-page");
      const guidedDatasetNameSubtitlePage = document.getElementById(
        "guided-new-dataset-info"
      );

      if (!guidedIntroPage.classList.contains("hidden")) {
        //click past the intro page
        $("#guided-button-dataset-intro-back").click();
      } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
        //click past the dataset name/subtitle page and intro page
        $("#guided-button-dataset-intro-back").click();
        $("#guided-button-dataset-intro-back").click();
      }
    }
  }
};

//Initialize description tagify variables as null
//to make them accessible to functions outside of $(document).ready
let guidedDatasetKeywordsTagify = null;
let guidedStudyTechniquesTagify = null;
let guidedStudyApproachTagify = null;
let guidedStudyOrganSystemsTagify = null;
let guidedOtherFundingsourcesTagify = null;

//main nav variables initialized to first page of guided mode
let CURRENT_PAGE;

/////////////////////////////////////////////////////////
/////////////       Util functions      /////////////////
/////////////////////////////////////////////////////////
const pulseNextButton = () => {
  $("#guided-next-button").addClass("pulse-blue");
};
const unPulseNextButton = () => {
  $("#guided-next-button").removeClass("pulse-blue");
};
const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};
const disableProgressButton = () => {
  $("#guided-next-button").prop("disabled", true);
};
const disableElementById = (id) => {
  elementToDisable = document.getElementById(id);
  elementToDisable.style.opacity = "0.5";
  elementToDisable.style.pointerEvents = "none";
};
const enableElementById = (id) => {
  elementToEnable = document.getElementById(id);
  elementToEnable.style.opacity = "1";
  elementToEnable.style.pointerEvents = "auto";
};
const switchElementVisibility = (elementIdToHide, elementIdToShow) => {
  elementToHide = document.getElementById(elementIdToHide);
  elementToShow = document.getElementById(elementIdToShow);
  elementToHide.classList.add("hidden");
  elementToShow.classList.remove("hidden");
};
const hideSubNavAndShowMainNav = (navButtonToClick) => {
  $("#guided-sub-page-navigation-footer-div").hide();
  $("#guided-footer-div").css("display", "flex");
  //show the buttons incase they were hidden
  $("#guided-next-button").show();
  $("#guided-back-button").show();
  if (navButtonToClick) {
    if (navButtonToClick === "next") {
      $("#guided-next-button").click();
    }
    if (navButtonToClick === "back") {
      $("#guided-back-button").click();
    }
  }
};

const showMainNav = () => {
  $("#guided-footer-div").css("display", "flex");
};

const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};

const getOpenSubPageInPage = (pageID) => {
  const subPageContainer = document.getElementById(pageID);
  const openPage = subPageContainer.querySelector(".sub-page:not(.hidden)");
  return openPage.id;
};

const openSubPageNavigation = (pageBeingNavigatedTo) => {
  //Get the id of the page that's currently open and might need a refresh
  const openSubPageID = getOpenSubPageInPage(pageBeingNavigatedTo);
  //Refresh data on the open sub-page
  setActiveSubPage(openSubPageID);
  //Hide the footer div while user is in sub-page navigation
  $("#guided-footer-div").hide();
  //Show the sub-page navigation footer
  $("#guided-sub-page-navigation-footer-div").css("display", "flex");
};

const guidedTransitionFromHome = () => {
  //Hide the home screen
  document.getElementById("guided-home").classList.add("hidden");
  //Hide the header and footer for the dataset name/subtitle page
  $("#guided-header-div").hide();
  $("#guided-footer-div").hide();

  //Show the guided mode starting container
  document
    .getElementById("guided-mode-starting-container")
    .classList.remove("hidden");

  //hide the name+subtitle page and show the intro page
  switchElementVisibility("guided-new-dataset-info", "guided-intro-page");
  //Reset name, subtitle, and subtitle char count
  document.getElementById("guided-dataset-name-input").value = "";
  document.getElementById("guided-dataset-subtitle-input").value = "";
  document.getElementById(
    "guided-subtitle-char-count"
  ).innerHTML = `255 characters remaining`;

  guidedLockSideBar();

  //Show the intro footer
  document.getElementById("guided-footer-intro").classList.remove("hidden");
};

const guidedTransitionToHome = () => {
  guidedPrepareHomeScreen();
  document.getElementById("guided-home").classList.remove("hidden");
  $("#guided-header-div").hide();
  $("#guided-footer-div").hide();
  document
    .getElementById("guided-mode-starting-container")
    .classList.add("hidden");

  //get element with id "sidebarCollapse"
  const sidebar = document.getElementById("sidebarCollapse");
  if (sidebar.classList.contains("active")) {
    sidebar.click();
  }
};

const guidedTransitionFromDatasetNameSubtitlePage = () => {
  //Hide dataset name and subtitle parent tab
  document
    .getElementById("guided-mode-starting-container")
    .classList.add("hidden");
  //hide the intro footer
  document.getElementById("guided-footer-intro").classList.add("hidden");

  //Show the dataset structure page
  $("#prepare-dataset-parent-tab").css("display", "flex");
  $("#guided-header-div").css("display", "flex");
  $("#guided-footer-div").css("display", "flex");

  //Manually click the proper dataset structure button since the radio button is not controlled
  //by the next button/traverseToTab function
  if (sodaJSONObj["button-config"]["dataset-already-structured"]) {
    if (sodaJSONObj["button-config"]["dataset-already-structured"] == "yes") {
      //click element with id guided-button-import-existing-dataset-structure
      document
        .getElementById("guided-button-import-existing-dataset-structure")
        .click();
    }
    if (sodaJSONObj["button-config"]["dataset-already-structured"] == "no") {
      //click element with id guided-button-create-new-dataset-structure
      document
        .getElementById("guided-button-guided-dataset-structuring")
        .click();
    }
  }
  //Set the current page to the guided curation page
  CURRENT_PAGE = $("#guided-dataset-starting-point-tab");

  //reset sub-page navigation (Set the first sub-page to be the active sub-page
  //for all pages with sub-pages)
  const subPageCapsuleContainers = Array.from(
    document.querySelectorAll(".guided--capsule-container-sub-page")
  );
  for (const pageCapsule of subPageCapsuleContainers) {
    const firstSubPage = pageCapsule.querySelector(".guided--capsule-sub-page");
    setActiveSubPage(firstSubPage.id.replace("-capsule", ""));
  }
};

const saveGuidedProgress = (guidedProgressFileName) => {
  //Destination: HOMEDIR/SODA/Guided-Progress
  sodaJSONObj["last-modified"] = new Date();

  //If the user is past the intro/name+subtitle page, save the current page to be resumed later
  if (CURRENT_PAGE) {
    sodaJSONObj["page-before-exit"] = CURRENT_PAGE.attr("id");
  }

  try {
    //create Guided-Progress folder if one does not exist
    fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  } catch (error) {
    log.error(error);
    console.log(error);
  }
  var guidedFilePath = path.join(
    guidedProgressFilePath,
    guidedProgressFileName + ".json"
  );

  // delete sodaJSONObj["dataset-structure"] value that was added only for the Preview tree view
  if ("files" in sodaJSONObj["dataset-structure"]) {
    sodaJSONObj["dataset-structure"]["files"] = {};
  }

  //Add datasetStructureJSONObj to the sodaJSONObj and use to load the
  //datasetStructureJsonObj when progress resumed
  sodaJSONObj["saved-datset-structure-json-obj"] = datasetStructureJSONObj;
  sodaJSONObj["subjects-table-data"] = subjectsTableData;
  sodaJSONObj["samples-table-data"] = samplesTableData;

  fs.writeFileSync(guidedFilePath, JSON.stringify(sodaJSONObj, null, 2));
};
const readDirAsync = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (error, result) => {
      if (error) {
        throw new Error(error);
      } else {
        resolve(result);
      }
    });
  });
};
const readFileAsync = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (error, result) => {
      if (error) {
        throw new Error(error);
      } else {
        resolve(JSON.parse(result));
      }
    });
  });
};
const getAllProgressFileData = async (progressFiles) => {
  return Promise.all(
    progressFiles.map((progressFile) => {
      let progressFilePath = path.join(guidedProgressFilePath, progressFile);
      return readFileAsync(progressFilePath);
    })
  );
};
const getProgressFileData = async (progressFile) => {
  let progressFilePath = path.join(
    guidedProgressFilePath,
    progressFile + ".json"
  );
  return readFileAsync(progressFilePath);
};
const deleteProgressCard = async (progressCardDeleteButton) => {
  const progressCard = progressCardDeleteButton.parentElement.parentElement;
  const progressCardNameToDelete = progressCard.querySelector(
    ".progress-file-name"
  ).textContent;

  const result = await Swal.fire({
    title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
    text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
    icon: "warning",
    heightAuto: false,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Delete progress file",
    cancelButtonText: "Cancel",
    focusCancel: true,
  });
  if (result.isConfirmed) {
    //Get the path of the progress file to delete
    const progressFilePathToDelete = path.join(
      guidedProgressFilePath,
      progressCardNameToDelete + ".json"
    );
    //delete the progress file
    fs.unlinkSync(progressFilePathToDelete, (err) => {
      console.log(err);
    });

    //remove the progress card from the DOM
    progressCard.remove();
  }
};
const generateProgressCardElement = (progressFileJSONObj) => {
  let progressFileImage =
    progressFileJSONObj["digital-metadata"]["banner-image-path"] || "";

  if (progressFileImage === "") {
    progressFileImage = `
      <img
        src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
        alt="Dataset banner image placeholder"
        style="height: 80px; width: 80px"
      />
    `;
  } else {
    progressFileImage = `
      <img
        src='${progressFileImage}'
        alt="Dataset banner image"
        style="height: 80px; width: 80px"
      />
    `;
  }
  const progressFileName =
    progressFileJSONObj["digital-metadata"]["name"] || "";
  const progressFileSubtitle =
    progressFileJSONObj["digital-metadata"]["subtitle"] ||
    "No designated subtitle";
  const progressFileOwnerName =
    progressFileJSONObj["digital-metadata"]["pi-owner"]["name"] ||
    "Not designated yet";
  const progressFileLastModified = new Date(
    progressFileJSONObj["last-modified"]
  ).toLocaleString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  return `
    <div class="guided--dataset-card">
      ${progressFileImage /* banner image */}     
        
      <div class="guided--dataset-card-body">
        <div class="guided--dataset-card-row">
          <h1
            class="guided--text-dataset-card progress-file-name progress-card-popover"
            data-content="Dataset name: ${progressFileName}"
            rel="popover"
            data-placement="bottom"
            data-trigger="hover"
          >${progressFileName}</h1>
        </div>
        <div class="guided--dataset-card-row">
          <h1 
            class="guided--text-dataset-card progress-card-popover"
            data-content="Dataset subtitle: ${progressFileSubtitle}"
            rel="popover"
            data-placement="bottom"
            data-trigger="hover"
            style="font-weight: 400;"
          >
              ${
                progressFileSubtitle.length > 70
                  ? `${progressFileSubtitle.substring(0, 70)}...`
                  : progressFileSubtitle
              }
          </h1>
        </div>
        <div class="guided--dataset-card-row">
          <h2 class="guided--text-dataset-card-sub" style="width: auto;">
            <i
              class="fas fa-clock-o progress-card-popover"
              data-content="Last modified: ${progressFileLastModified}"
              rel="popover"
              data-placement="bottom"
              data-trigger="hover"
            ></i>
          </h2>
          <h1 class="guided--text-dataset-card ml-sm-1">${progressFileLastModified}</h1>
        </div>
      </div>
      <div class="guided--container-dataset-card-center">
        ${
          progressFileJSONObj["previous-guided-upload-dataset-name"]
            ? `
                <button
                  class="ui positive button guided--button-footer"
                  style="
                    background-color: var(--color-light-green) !important;
                    width: 160px !important;
                    margin: 4px;
                    margin-bottom: 15px;
                  "
                  onClick="openEditGuidedDatasetSwal('${progressFileName}')"
                >
                  Edit dataset
                </button>
              `
            : `
                <button
                  class="ui positive button guided--button-footer"
                  style="
                    background-color: var(--color-light-green) !important;
                    width: 160px !important;
                    margin: 4px;
                    margin-bottom: 15px;
                  "
                  onClick="guidedResumeProgress($(this))"
                >
                  Continue curating
                </button>
              `
        }
        <h2 class="guided--text-dataset-card" style="width: auto; text-decoration: underline; cursor: pointer;" onclick="deleteProgressCard(this)">
          <i
            class="fas fa-trash mr-sm-1"
          ></i>
          Delete progress file
        </h2>
      </div>
    </div>
  `;
};
const renderProgressCards = (progressFileJSONdata) => {
  //sort progressFileJSONdata by date to place newest cards on top
  progressFileJSONdata.sort((a, b) => {
    return new Date(b["last-modified"]) - new Date(a["last-modified"]);
  });

  //sort progressFileJSONdata into two rows one with property "previous-guided-upload-dataset-name"
  //and one without property "previous-guided-upload-dataset-name"
  const progressDataAlreadyUploadedToPennsieve = progressFileJSONdata.filter(
    (progressFileJSONobj) => {
      return progressFileJSONobj["previous-guided-upload-dataset-name"];
    }
  );
  const progressDataNotYetUploadedToPennsieve = progressFileJSONdata.filter(
    (progressFileJSONobj) => {
      return !progressFileJSONobj["previous-guided-upload-dataset-name"];
    }
  );
  //Add the progress cards that have already been uploaded to Pennsieve
  //to their container (datasets that have the sodaJSONObj["previous-guided-upload-dataset-name"] property)
  document.getElementById("guided-div-update-uploaded-cards").innerHTML =
    progressDataAlreadyUploadedToPennsieve.length > 0
      ? progressDataAlreadyUploadedToPennsieve
          .map((progressFile) => generateProgressCardElement(progressFile))
          .join("\n")
      : `
          <h2 class="guided--text-sub-step">
            No local datasets have been uploaded to Pennsieve yet.
          </h2>
          <p class="guided--text-input-instructions m-0 text-center">
            <b>Click "Datasets in progress" to view local datasets in progress.</b>
          </p>
        `;

  //Add the progress cards that have not yet been uploaded to Pennsieve
  //to their container (datasets that do not have the sodaJSONObj["previous-guided-upload-dataset-name"] property)
  document.getElementById("guided-div-resume-progress-cards").innerHTML =
    progressDataNotYetUploadedToPennsieve.length > 0
      ? progressDataNotYetUploadedToPennsieve
          .map((progressFile) => generateProgressCardElement(progressFile))
          .join("\n")
      : `
          <h2 class="guided--text-sub-step">
            All local datasets have been previously uploaded to Pennsieve.
          </h2>
          <p class="guided--text-input-instructions m-0 text-center">
            <b>Click "Datasets uploaded to Pennsieve" to view local datasets that have already been uploaded to Pennsieve.</b>
          </p>
        `;

  $(".progress-card-popover").popover();
};

const renderManifestCards = () => {
  const guidedManifestData = sodaJSONObj["guided-manifest-files"];
  const highLevelFoldersWithManifestData = Object.keys(guidedManifestData);

  const manifestCards = highLevelFoldersWithManifestData
    .map((highLevelFolder) => {
      return generateManifestEditCard(highLevelFolder);
    })
    .join("\n");

  document.getElementById("guided-container-manifest-file-cards").innerHTML =
    manifestCards;
};

const generateManifestEditCard = (highLevelFolderName) => {
  return `
    <div class="guided--dataset-card">        
      <div class="guided--dataset-card-body shrink">
        <div class="guided--dataset-card-row">
          <h1 class="guided--text-dataset-card">
            <span class="manifest-folder-name">${highLevelFolderName}</span>
          </h1>
        </div>
      </div>
      <div class="guided--container-dataset-card-center">
        <button
          class="ui primary button guided--button-footer"
          style="
            background-color: var(--color-light-green) !important;
            width: 280px !important;
            margin: 4px;
          "
          onClick="guidedOpenManifestEditSwal('${highLevelFolderName}')"
        >
          View/Edit ${highLevelFolderName} manifest file
        </button>
      </div>
    </div>
  `;
};

const guidedOpenManifestEditSwal = async (highLevelFolderName) => {
  const existingManifestData =
    sodaJSONObj["guided-manifest-files"][highLevelFolderName];

  let manifestFileHeaders = existingManifestData["headers"];
  let manifestFileData = existingManifestData["data"];

  let guidedManifestTable;

  const { value: saveManifestFiles } = await Swal.fire({
    title:
      "<span style='font-size: 18px !important;'>Edit the manifest file below: </span> <br><span style='font-size: 13px; font-weight: 500'> Tip: Double click on a cell to edit it.<span>",
    html: "<div id='guided-div-manifest-edit'></div>",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: true,
    confirmButtonText: "Confirm",
    showCancelButton: true,
    width: "90%",
    // height: "80%",
    customClass: "swal-large",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
      const manifestSpreadsheetContainer = document.getElementById(
        "guided-div-manifest-edit"
      );
      guidedManifestTable = jspreadsheet(manifestSpreadsheetContainer, {
        tableOverflow: true,
        data: manifestFileData,
        columns: manifestFileHeaders.map((header) => {
          return {
            type: "text",
            title: header,
            width: 200,
          };
        }),
      });
    },
  });

  if (saveManifestFiles) {
    const savedHeaders = guidedManifestTable.getHeaders().split(",");
    const savedData = guidedManifestTable.getData();

    sodaJSONObj["guided-manifest-files"][highLevelFolderName] = {
      headers: savedHeaders,
      data: savedData,
    };

    //Save the sodaJSONObj with the new manifest file
    saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
    //Rerender the manifest cards
    renderManifestCards();
  }
};

document
  .getElementById("guided-button-auto-generate-manifest-files")
  .addEventListener("click", async () => {
    const manifestData = sodaJSONObj["guided-manifest-files"];

    //If no manifest file exists, generate the manifest file data
    if (Object.keys(manifestData).length === 0) {
      const manifestFilesCardsContainer = document.getElementById(
        "guided-container-manifest-file-cards"
      );

      manifestFilesCardsContainer.innerHTML = `loading`;
      try {
        //Delete any manifest files that already exist in the sodaJSONObj
        //because new manifest files will be generated after the user leaves this page
        for (const [highLevelFolder, folderData] of Object.entries(
          sodaJSONObj["saved-datset-structure-json-obj"]["folders"]
        )) {
          delete sodaJSONObj["saved-datset-structure-json-obj"]["folders"][
            highLevelFolder
          ]["files"]["manifest.xlsx"];
        }
        // Generate the manifest file data for each high level folder
        // Data will be returned as an object with a key for each high level folder
        // and the value for each key will be an array of arrays with the first array
        // being the headers, and the rest of the arrays being the manifest data.
        const res = await client.post(
          `/curate_datasets/guided_generate_high_level_folder_manifest_data`,
          {
            dataset_structure_obj:
              sodaJSONObj["saved-datset-structure-json-obj"],
          },
          { timeout: 0 }
        );
        const manifestRes = res.data;
        //loop through each of the high level folders and store their manifest headers and data
        //into the sodaJSONObj

        for (const [highLevelFolderName, manifestFileData] of Object.entries(
          manifestRes
        )) {
          //Only save manifest files for hlf that returned more than the headers
          //(meaning manifest file data was generated in the response)
          if (manifestFileData.length > 1) {
            //Remove the first element from the array and set it as the headers
            const manifestHeader = manifestFileData.shift();
            const manifestData = manifestFileData;

            sodaJSONObj["guided-manifest-files"][highLevelFolderName] = {
              headers: manifestHeader,
              data: manifestData,
            };
            datasetStructureJSONObj["folders"][highLevelFolderName]["files"][
              "manifest.xlsx"
            ] = {
              name: "manifest.xlsx",
              size: 0,
              type: "temp",
            };
          }
        }
        //Save the sodaJSONObj with the new manifest files
        saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
      } catch (err) {
        userError(err);
      }
    }

    //Rerender the manifest cards
    renderManifestCards();
  });

const setActiveCapsule = (targetPageID) => {
  $(".guided--capsule").removeClass("active");
  let targetCapsuleID = targetPageID.replace("-tab", "-capsule");
  let targetCapsule = $(`#${targetCapsuleID}`);
  //check if targetCapsule parent has the class guided--capsule-container-branch
  if (targetCapsule.parent().hasClass("guided--capsule-container-branch")) {
    $(".guided--capsule-container-branch").hide();
    targetCapsule.parent().css("display", "flex");
  }
  targetCapsule.addClass("active");
};
setActiveProgressionTab = (targetPageID) => {
  $(".guided--progression-tab").removeClass("selected-tab");
  let targetPageParentID = $(`#${targetPageID}`).parent().attr("id");
  let targetProgressionTabID = targetPageParentID.replace(
    "parent-tab",
    "progression-tab"
  );
  let targetProgressionTab = $(`#${targetProgressionTabID}`);
  targetProgressionTab.addClass("selected-tab");
};
const handlePageBranching = (selectedCardElement) => {
  //hide capsule containers for page branches that are not selected
  const capsuleContainerID = selectedCardElement
    .attr("id")
    .replace("card", "branch-capsule-container");
  $(".guided--capsule-container-branch").hide();
  $(`#${capsuleContainerID}`).css("display", "flex");

  //handle skip pages following card
  if (selectedCardElement.data("branch-pages-group-class")) {
    const branchPagesGroupClass = selectedCardElement.attr(
      "data-branch-pages-group-class"
    );
    $(`.${branchPagesGroupClass}`).attr("data-skip-page", "true");
    const pageBranchToRemoveSkip = selectedCardElement
      .attr("id")
      .replace("card", "branch-page");
    $(`.${pageBranchToRemoveSkip}`).attr("data-skip-page", "false");
  }

  selectedCardElement.siblings().removeClass("checked");
  selectedCardElement.siblings().addClass("non-selected");
  selectedCardElement.removeClass("non-selected");
  selectedCardElement.addClass("checked");

  const tabPanelId = selectedCardElement.attr("id").replace("card", "panel");
  const tabPanel = $(`#${tabPanelId}`);
  //checks to see if clicked card has a panel, if so, hides siblings and smooth scrolls to it
  if (tabPanel.length != 0) {
    tabPanel.siblings().hide();
    tabPanel.css("display", "flex");
    tabPanel[0].scrollIntoView({
      behavior: "smooth",
    });
  }
};

const guidedResetProgressVariables = () => {
  sodaJSONObj = {};
  datasetStructureJSONObj = {};
  subjectsTableData = [];
  samplesTableData = [];
};

const guidedPrepareHomeScreen = async () => {
  //Wipe out existing progress if it exists
  guidedResetProgressVariables();
  //Check if Guided-Progress folder exists. If not, create it.
  if (!fs.existsSync(guidedProgressFilePath)) {
    fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  }

  //Refresh Home page UI
  $("#guided-button-start-new-curate").css("display", "flex");
  $("#continue-curating-existing").css("display", "flex");

  resetGuidedRadioButtons("guided-div-dataset-cards-radio-buttons");

  const datasetCardsRadioButtonsContainer = document.getElementById(
    "guided-div-dataset-cards-radio-buttons"
  );

  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);
  //render progress resumption cards from progress file array on first page of guided mode
  if (guidedSavedProgressFiles.length != 0) {
    // $("#guided-continue-curation-header").text(
    //   "Or continue curating a previously started dataset below."
    // );
    datasetCardsRadioButtonsContainer.classList.remove("hidden");
    const progressFileData = await getAllProgressFileData(
      guidedSavedProgressFiles
    );
    renderProgressCards(progressFileData);
    document.getElementById("guided-button-view-datasets-in-progress").click();
  } else {
    $("#guided-continue-curation-header").text("");
    datasetCardsRadioButtonsContainer.classList.add("hidden");
  }
  //empty new-dataset-lottie-container div
  document.getElementById("new-dataset-lottie-container").innerHTML = "";
  lottie.loadAnimation({
    container: document.querySelector("#new-dataset-lottie-container"),
    animationData: newDataset,
    renderer: "svg",
    loop: true,
    autoplay: true,
  });

  guidedUnLockSideBar();
};

function guidedShowTreePreview(new_dataset_name, targetElement) {
  var guidedJsTreePreviewData = create_child_node(
    datasetStructureJSONObj,
    new_dataset_name,
    "folder",
    "",
    true,
    false,
    false,
    "",
    "preview"
  );
  $(targetElement).jstree(true).settings.core.data = guidedJsTreePreviewData;
  $(targetElement).jstree(true).refresh();
  //Open Jstree element with passed in folder node name
  const openFolder = (folderName) => {
    var tree = $("#jstree").jstree(true);
    var node = tree.get_node(folderName);
    tree.open_node(node);
  };
}

const guidedUpdateFolderStructure = (highLevelFolder, subjectsOrSamples) => {
  //add high level folder if it does not exist
  if (!datasetStructureJSONObj["folders"][highLevelFolder]) {
    datasetStructureJSONObj["folders"][highLevelFolder] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  }
  //Add pools to the datsetStructuresJSONObj if they don't exist
  const pools = Object.keys(sodaJSONObj.getPools());
  for (const pool of pools) {
    if (!datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool]) {
      datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool] = {
        folders: {},
        files: {},
        type: "",
        action: [],
      };
    }
  }
  if (subjectsOrSamples === "subjects") {
    //Add subjects to datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] =
      sodaJSONObj.getAllSubjects();
    for (subject of subjectsInPools) {
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          subject.poolName
        ]["folders"][subject.subjectName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          subject.poolName
        ]["folders"][subject.subjectName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    for (subject of subjectsOutsidePools) {
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          subject.subjectName
        ]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          subject.subjectName
        ] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Add samples to datsetStructuresJSONObj if they don't exist
    const [samplesInPools, samplesOutsidePools] =
      sodaJSONObj.getAllSamplesFromSubjects();
    for (sample of samplesInPools) {
      /**
       * Check to see if the sample's pool is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's subject is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]["folders"][sample.subjectName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]["folders"][sample.subjectName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's folder is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]["folders"][sample.subjectName]["folders"][sample.sampleName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]["folders"][sample.subjectName]["folders"][sample.sampleName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    for (sample of samplesOutsidePools) {
      /**
       * Check to see if the sample's subject is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.subjectName
        ]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.subjectName
        ] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's folder is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.subjectName
        ]["folders"][sample.sampleName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.subjectName
        ]["folders"][sample.sampleName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  }
};

const cleanUpEmptyGuidedStructureFolders = async (
  highLevelFolder,
  subjectsOrSamples,
  boolCleanUpAllGuidedStructureFolders
) => {
  if (subjectsOrSamples === "subjects") {
    //Remove subjects from datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] =
      sodaJSONObj.getAllSubjects();

    if (boolCleanUpAllGuidedStructureFolders === true) {
      //Delete folders for pools
      for (const subject of subjectsInPools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.poolName
          ]["folders"][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.poolName
          ]["folders"][subject.subjectName];
        }
      }

      //Delete all folders for subjects outside of pools
      for (const subject of subjectsOutsidePools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.subjectName
          ];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.subjectName
          ];
        }
      }

      //Delete all pools with empty folders
      const pools = sodaJSONObj.getPools();
      for (const pool of Object.keys(pools)) {
        const poolFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
        if (
          Object.keys(poolFolderContents.folders).length === 0 &&
          Object.keys(poolFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            pool
          ];
        }
      }

      //Delete the high level folder if no folders or files were added
      const highLevelFolderContents =
        datasetStructureJSONObj["folders"][highLevelFolder];
      if (
        Object.keys(highLevelFolderContents.folders).length === 0 &&
        Object.keys(highLevelFolderContents.files).length === 0
      ) {
        delete datasetStructureJSONObj["folders"][highLevelFolder];
      }

      return true;
    } else {
      const subjectsWithEmptyFolders = [];

      //loop through subjectsInPools and add subjects with empty folders to subjectsWithEmptyFolders
      for (const subject of subjectsInPools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.poolName
          ]["folders"][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          subjectsWithEmptyFolders.push(subject);
        }
      }

      //loop through subjectsOutsidePools and add subjects with empty folders to subjectsWithEmptyFolders
      for (const subject of subjectsOutsidePools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.subjectName
          ];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          subjectsWithEmptyFolders.push(subject);
        }
      }

      if (subjectsWithEmptyFolders.length > 0) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          icon: "warning",
          title: "Missing data",
          html: `${highLevelFolder} data was not added to the following subjects:<br /><br />
            <ul>
              ${subjectsWithEmptyFolders
                .map(
                  (subject) =>
                    `<li class="text-left">${subject.subjectName}</li>`
                )
                .join("")}
            </ul>`,
          reverseButtons: true,
          showCancelButton: true,
          cancelButtonColor: "#6e7881",
          cancelButtonText: `Finish adding ${highLevelFolder} data to subjects`,
          confirmButtonText: `Continue without adding ${highLevelFolder} data to all subjects`,
        });
        if (result.isConfirmed) {
          for (subject of subjectsWithEmptyFolders) {
            if (subject.poolName) {
              delete datasetStructureJSONObj["folders"][highLevelFolder][
                "folders"
              ][subject.poolName]["folders"][subject.subjectName];
            } else {
              delete datasetStructureJSONObj["folders"][highLevelFolder][
                "folders"
              ][subject.subjectName];
            }
          }
          //Delete all pools with empty folders
          const pools = sodaJSONObj.getPools();
          for (const pool of Object.keys(pools)) {
            const poolFolderContents =
              datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                pool
              ];
            if (
              Object.keys(poolFolderContents.folders).length === 0 &&
              Object.keys(poolFolderContents.files).length === 0
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder][
                "folders"
              ][pool];
            }
          }
          return true;
        }
      } else {
        //Delete all pools with empty folders
        const pools = sodaJSONObj.getPools();
        for (const pool of Object.keys(pools)) {
          const poolFolderContents =
            datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
              pool
            ];
          if (
            Object.keys(poolFolderContents.folders).length === 0 &&
            Object.keys(poolFolderContents.files).length === 0
          ) {
            delete datasetStructureJSONObj["folders"][highLevelFolder][
              "folders"
            ][pool];
          }
        }
        return true;
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Get samples to check if their folders are
    const [samplesInPools, samplesOutsidePools] =
      sodaJSONObj.getAllSamplesFromSubjects();

    if (boolCleanUpAllGuidedStructureFolders === true) {
      //delete all folders for samples in pools
      for (const sample of samplesInPools) {
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.poolName
        ]["folders"][sample.subjectName]["folders"][sample.sampleName];
      }
      //delete all folders for samples outside of pools
      for (const sample of samplesOutsidePools) {
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
          sample.subjectName
        ]["folders"][sample.sampleName];
      }

      return true;
    } else {
      const samplesWithEmptyFolders = [];

      //loop through samplesInPools and add samples with empty folders to samplesWithEmptyFolders
      for (const sample of samplesInPools) {
        const sampleFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            sample.poolName
          ]["folders"][sample.subjectName]["folders"][sample.sampleName];
        if (
          Object.keys(sampleFolderContents.folders).length === 0 &&
          Object.keys(sampleFolderContents.files).length === 0
        ) {
          samplesWithEmptyFolders.push(sample);
        }
      }
      //loop through samplesOutsidePools and add samples with empty folders to samplesWithEmptyFolders
      for (const sample of samplesOutsidePools) {
        const sampleFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            sample.subjectName
          ]["folders"][sample.sampleName];
        if (
          Object.keys(sampleFolderContents.folders).length === 0 &&
          Object.keys(sampleFolderContents.files).length === 0
        ) {
          samplesWithEmptyFolders.push(sample);
        }
      }

      if (samplesWithEmptyFolders.length > 0) {
        let result = await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
          title: "Missing data",
          html: `${highLevelFolder} data was not added to the following samples:<br /><br />
            <ul>
              ${samplesWithEmptyFolders
                .map(
                  (sample) =>
                    `<li class="text-left">${sample.subjectName}/${sample.sampleName}</li>`
                )
                .join("")}
            </ul>`,
          icon: "warning",
          reverseButtons: true,
          showCancelButton: true,
          cancelButtonColor: "#6e7881",
          cancelButtonText: `Finish adding ${highLevelFolder} data to samples`,
          confirmButtonText: `Continue without adding ${highLevelFolder} data to all samples`,
        });
        //If the user indicates they do not have any subjects, skip to source folder
        if (result.isConfirmed) {
          //delete empty samples from the datasetStructureJSONObj
          for (sample of samplesWithEmptyFolders) {
            if (sample.poolName) {
              delete datasetStructureJSONObj["folders"][highLevelFolder][
                "folders"
              ][sample.poolName]["folders"][sample.subjectName]["folders"][
                sample.sampleName
              ];
            } else {
              delete datasetStructureJSONObj["folders"][highLevelFolder][
                "folders"
              ][sample.subjectName]["folders"][sample.sampleName];
            }
          }
          return true;
        }
      } else {
        return true;
      }
    }
  }
};

const resetGuidedRadioButtons = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(
    ".guided--radio-button"
  );
  for (const guidedRadioButton of guidedRadioButtons) {
    guidedRadioButton.classList.remove("selected");
    guidedRadioButton.classList.remove("not-selected");
    guidedRadioButton.classList.add("basic");

    //get the data-next-element attribute
    const elementButtonControls =
      guidedRadioButton.getAttribute("data-next-element");
    if (elementButtonControls) {
      const elementToHide = document.getElementById(elementButtonControls);
      elementToHide.classList.add("hidden");
    }
  }
};
const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(
    ".guided--radio-button"
  );
  for (const guidedRadioButton of guidedRadioButtons) {
    //Get the button config value from the UI
    const buttonConfigValue = guidedRadioButton.getAttribute(
      "data-button-config-value"
    );
    if (buttonConfigValue) {
      const buttonConfigValueState = guidedRadioButton.getAttribute(
        "data-button-config-value-state"
      );
      if (
        sodaJSONObj["button-config"][buttonConfigValue] ===
        buttonConfigValueState
      ) {
        //click the button
        guidedRadioButton.click();
      }
    }
  }
};

const guidedLoadDescriptionDatasetInformation = () => {
  const descriptionMetadata =
    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "dataset-information"
    ];

  guidedDatasetKeywordsTagify.removeAllTags();

  if (descriptionMetadata) {
    //check the checkbox for the study type where name is dataset-relation
    const studyType = descriptionMetadata["type"];
    const studyTypeRadioButton = document.querySelector(
      `input[name='dataset-relation'][value='${studyType}']`
    );
    if (studyTypeRadioButton) {
      studyTypeRadioButton.checked = true;
    }
    guidedDatasetKeywordsTagify.addTags(descriptionMetadata["keywords"]);
  } else {
    //reset the study type checkboxes
    const studyTypeRadioButtons = document.querySelectorAll(
      "input[name='dataset-relation']"
    );
    for (const studyTypeRadioButton of studyTypeRadioButtons) {
      studyTypeRadioButton.checked = false;
    }
  }
};

const guidedLoadDescriptionStudyInformation = () => {
  const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
  const studyDataCollectionInput = document.getElementById(
    "guided-ds-study-data-collection"
  );
  const studyPrimaryConclusionInput = document.getElementById(
    "guided-ds-study-primary-conclusion"
  );
  const studyCollectionTitleInput = document.getElementById(
    "guided-ds-study-collection-title"
  );

  //reset dataset descript tags
  guidedStudyOrganSystemsTagify.removeAllTags();
  guidedStudyApproachTagify.removeAllTags();
  guidedStudyTechniquesTagify.removeAllTags();

  const studyInformationMetadata =
    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "study-information"
    ];

  if (studyInformationMetadata) {
    studyPurposeInput.value = studyInformationMetadata["study purpose"];
    studyDataCollectionInput.value =
      studyInformationMetadata["study data collection"];
    studyPrimaryConclusionInput.value =
      studyInformationMetadata["study primary conclusion"];
    studyCollectionTitleInput.value =
      studyInformationMetadata["study collection title"];

    guidedStudyOrganSystemsTagify.addTags(
      studyInformationMetadata["study organ system"]
    );
    guidedStudyApproachTagify.addTags(
      studyInformationMetadata["study approach"]
    );
    guidedStudyTechniquesTagify.addTags(
      studyInformationMetadata["study technique"]
    );
  } else {
    //reset the inputs
    studyPurposeInput.value = "";
    studyDataCollectionInput.value = "";
    studyPrimaryConclusionInput.value = "";
    studyCollectionTitleInput.value = "";
    guidedStudyOrganSystemsTagify.removeAllTags();
    guidedStudyApproachTagify.removeAllTags();
    guidedStudyTechniquesTagify.removeAllTags();
  }
};

const guidedLoadDescriptionContributorInformation = () => {
  const acknowledgementsInput = document.getElementById(
    "guided-ds-acknowledgements"
  );
  const contributorInformationMetadata =
    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "contributor-information"
    ];

  guidedOtherFundingsourcesTagify.removeAllTags();

  if (contributorInformationMetadata) {
    acknowledgementsInput.value =
      contributorInformationMetadata["acknowledgment"];
    guidedOtherFundingsourcesTagify.addTags(
      contributorInformationMetadata["funding"]
    );
  } else {
    acknowledgementsInput.value = "";
    guidedOtherFundingsourcesTagify.removeAllTags();
  }
};

const guidedResetUserTeamPermissionsDropdowns = () => {
  $("#guided_bf_list_users_and_teams").val("Select individuals or teams");
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
  $("#select-permission-list-users-and-teams").val("Select role");
};

//Main function that prepares individual pages based on the state of the sodaJSONObj
//The general flow is to check if there is values for the keys relevant to the page
//If the keys exist, extract the data from the sodaJSONObj and populate the page
//If the keys do not exist, reset the page (inputs, tables etc.) to the default state
const traverseToTab = async (targetPageID) => {
  let itemsContainer = document.getElementById("items-guided-container");
  if (itemsContainer.classList.contains("border-styling")) {
    itemsContainer.classList.remove("border-styling");
  }
  try {
    //reset the radio buttons for the page being navigated to
    resetGuidedRadioButtons(targetPageID);
    //update the radio buttons using the button config from sodaJSONObj
    updateGuidedRadioButtonsFromJSON(targetPageID);
    //refresh selectPickers if page has them

    if (targetPageID === "guided-designate-pi-owner-tab") {
      $("#guided_bf_list_users_pi").selectpicker("refresh");

      const PiOwnerUUID = sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"];

      if (PiOwnerUUID) {
        $("#guided_bf_list_users_pi").val(
          sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"]
        );
        $("#guided_bf_list_users_pi").selectpicker("refresh");
      }
    }

    if (
      targetPageID === "guided-dataset-generation-confirmation-tab" ||
      targetPageID === "guided-dataset-generation-tab" ||
      targetPageID === "guided-dataset-dissemination-tab"
    ) {
      $("#guided-next-button").css("visibility", "hidden");
    } else {
      $("#guided-next-button").css("visibility", "visible");
    }

    if (
      targetPageID === "guided-dataset-dissemination-tab" ||
      targetPageID === "guided-dataset-generation-tab"
    ) {
      $("#guided-back-button").css("visibility", "hidden");
    } else {
      $("#guided-back-button").css("visibility", "visible");
    }

    if (targetPageID === "guided-subjects-folder-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-primary-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-source-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-derivative-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }

    if (targetPageID === "guided-protocol-folder-tab") {
      //Append the guided-file-explorer element to the derivative folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-protocol-data")
      );
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
    }

    if (targetPageID === "guided-code-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const codeFolder = datasetStructureJSONObj["folders"]["code"];
      if (!codeFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["code"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-code-data")
      );
      updateFolderStructureUI(highLevelFolderPageData.code);

      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
    }

    if (targetPageID === "guided-protocol-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const protocolFolder = datasetStructureJSONObj["folders"]["protocol"];
      if (!protocolFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["protocol"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-protocol-data")
      );
      updateFolderStructureUI(highLevelFolderPageData.protocol);

      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
    }

    if (targetPageID === "guided-docs-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const docsFolder = datasetStructureJSONObj["folders"]["docs"];
      if (!docsFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["docs"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-docs-data")
      );
      updateFolderStructureUI(highLevelFolderPageData.docs);
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
    }

    if (targetPageID === "guided-folder-structure-preview-tab") {
      const folderStructurePreview = document.getElementById(
        "guided-folder-structure-review"
      );
      $(folderStructurePreview).jstree({
        core: {
          check_callback: true,
          data: {},
        },
        plugins: ["types"],
        types: {
          folder: {
            icon: "fas fa-folder fa-fw",
          },
          "folder open": {
            icon: "fas fa-folder-open fa-fw",
          },
          "folder closed": {
            icon: "fas fa-folder fa-fw",
          },
          "file xlsx": {
            icon: "./assets/img/excel-file.png",
          },
          "file xls": {
            icon: "./assets/img/excel-file.png",
          },
          "file png": {
            icon: "./assets/img/png-file.png",
          },
          "file PNG": {
            icon: "./assets/img/png-file.png",
          },
          "file pdf": {
            icon: "./assets/img/pdf-file.png",
          },
          "file txt": {
            icon: "./assets/img/txt-file.png",
          },
          "file csv": {
            icon: "./assets/img/csv-file.png",
          },
          "file CSV": {
            icon: "./assets/img/csv-file.png",
          },
          "file DOC": {
            icon: "./assets/img/doc-file.png",
          },
          "file DOCX": {
            icon: "./assets/img/doc-file.png",
          },
          "file docx": {
            icon: "./assets/img/doc-file.png",
          },
          "file doc": {
            icon: "./assets/img/doc-file.png",
          },
          "file jpeg": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file JPEG": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file other": {
            icon: "./assets/img/other-file.png",
          },
        },
      });
      $(folderStructurePreview).on("open_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder open");
      });
      $(folderStructurePreview).on("close_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder closed");
      });
      guidedShowTreePreview(
        sodaJSONObj["digital-metadata"]["name"],
        folderStructurePreview
      );
    }

    if (targetPageID === "guided-manifest-file-generation-tab") {
    }

    if (targetPageID === "guided-airtable-award-tab") {
      const sparcAwardImportedFromAirtable =
        sodaJSONObj["dataset-metadata"]["shared-metadata"][
          "imported-sparc-award"
        ];
      const sparcAward =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];

      //If a sparc award has been imported from Airtable, show the imported award
      //If not, reset the HTML
      if (sparcAwardImportedFromAirtable) {
        guidedSetImportedSPARCAward(sparcAwardImportedFromAirtable);
      } else {
        //hide the imported div
        document
          .getElementById("guided-div-imported-SPARC-award")
          .classList.add("hidden");
        document.getElementById(
          "guided-button-import-airtable-award"
        ).innerHTML = "Import award information from Airtable";
      }

      const sparcAwardInput = document.getElementById(
        "guided-input-sparc-award"
      );
      //If a sparc award exists, set the sparc award input
      //If not, reset the input
      if (sparcAward) {
        sparcAwardInput.value = sparcAward;
      } else {
        sparcAwardInput.value = "";
      }
    }

    if (targetPageID === "guided-create-submission-metadata-tab") {
      let submission_metadata =
        sodaJSONObj["dataset-metadata"]["submission-metadata"];

      let dataDeliverableLottieContainer = document.getElementById(
        "data-deliverable-lottie-container"
      );
      let dataDeliverableParaText = document.getElementById(
        "guided-data-deliverable-para-text"
      );

      if (Object.keys(submission_metadata).length > 0) {
        if (submission_metadata["filepath"]) {
          dataDeliverableLottieContainer.innerHTML = "";
          lottie.loadAnimation({
            container: dataDeliverableLottieContainer,
            animationData: successCheck,
            renderer: "svg",
            loop: false,
            autoplay: true,
          });
          dataDeliverableParaText.innerHTML = submission_metadata["filepath"];
        } else {
          //reset the code metadata lotties and para text
          dataDeliverableLottieContainer.innerHTML = "";
          lottie.loadAnimation({
            container: dataDeliverableLottieContainer,
            animationData: dragDrop,
            renderer: "svg",
            loop: true,
            autoplay: true,
          });
          dataDeliverableParaText.innerHTML = "";
        }
      } else {
        //reset the code metadata lotties and para text
        dataDeliverableLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: dataDeliverableLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        dataDeliverableParaText.innerHTML = "";
      }

      const sparcAward =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const sparcAwardInputManual = document.getElementById(
        "guided-submission-sparc-award-manual"
      );
      //If a sparc award exists, set the sparc award manual input
      //If not, reset the input
      if (sparcAward) {
        sparcAwardInputManual.value = sparcAward;
      } else {
        //If no sparc award exists, reset the inputs
        sparcAwardInputManual.value = "";
      }

      const milestones =
        sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
      guidedSubmissionTagsTagifyManual.removeAllTags();

      //If milestones exist, add the tags to the milestone tagify element
      if (milestones) {
        guidedSubmissionTagsTagifyManual.addTags(milestones);
      }

      const completionDate =
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "completion-date"
        ];
      const completionDateInputManual = document.getElementById(
        "guided-submission-completion-date-manual"
      );
      //If completion date exists, set the completion date input
      //If not, reset the input
      completionDateInputManual.innerHTML = `
        <option value="Select a completion date">Select a completion date</option>
        <option value="Enter my own date">Enter my own date</option>
        <option value="N/A">N/A</option>
      `;
      if (completionDate) {
        completionDateInputManual.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
        //select the completion date that was added
        completionDateInputManual.value = completionDate;
      }

      //Open the page and leave the sub-page hydration to the sub-page function
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-contributors-tab") {
      const sparcAward =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const contributors =
        sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

      //If contributors already existin in the sodaJSONObj, then show the contributors field
      //and render a card for each contributor
      if (contributors) {
        switchElementVisibility(
          "guided-div-contributors-imported-from-airtable",
          "guided-div-contributor-field-set"
        );

        renderContributorFields(contributors);
      } else {
        // check if airtableconfig has non empty api-key and key-name properties
        const airTableKeyData = parseJson(airtableConfigPath);

        if (
          sparcAward &&
          airTableKeyData["api-key"] &&
          airTableKeyData["api-key"] &&
          airTableKeyData["key-name"] !== "" &&
          airTableKeyData["api-key"] !== ""
        ) {
          try {
            //Show contributor fields and hide contributor information fields
            loadContributorInfofromAirtable(sparcAward, "guided");
            switchElementVisibility(
              "guided-div-contributor-field-set",
              "guided-div-contributors-imported-from-airtable"
            );
          } catch (error) {
            console.log(error);
            //reset if error fetching contributors from Airtable
            switchElementVisibility(
              "guided-div-contributors-imported-from-airtable",
              "guided-div-contributor-field-set"
            );

            document.getElementById("contributors-container").innerHTML = "";
            //add an empty contributor information fieldset
            addContributorField();
          }
        } else {
          //hide AirTable contributor table and show contributor information fields
          switchElementVisibility(
            "guided-div-contributors-imported-from-airtable",
            "guided-div-contributor-field-set"
          );

          document.getElementById("contributors-container").innerHTML = "";
          //add an empty contributor information fieldset
          addContributorField();
        }
      }
    }
    if (targetPageID === "guided-protocols-tab") {
      const protocols =
        sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
      if (protocols) {
        renderProtocolFields(protocols);
      } else {
        document.getElementById("protocols-container").innerHTML =
          generateProtocolField("", "");
      }
      $("#guided-section-enter-protocols-manually").click();
    }
    if (targetPageID === "guided-create-description-metadata-tab") {
      guidedLoadDescriptionDatasetInformation();
      guidedLoadDescriptionStudyInformation();
      guidedLoadDescriptionContributorInformation();
      renderAdditionalLinksTable();
      document.getElementById("SPARC-award-other-funding-label").innerHTML =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      /*
      //set study purpose, data collection, and primary conclusion from sodaJSONObj
      const studyPurpose = sodaJSONObj["digital-metadata"]["study-purpose"];
      const dataCollection = sodaJSONObj["digital-metadata"]["data-collection"];
      const primaryConclusion =
        sodaJSONObj["digital-metadata"]["primary-conclusion"];

      if (studyPurpose) {
        const studyPurposeInput = document.getElementById(
          "guided-ds-study-purpose"
        );
        studyPurposeInput.value = studyPurpose;
        studyPurposeInput.disabled = true;
      }
      if (dataCollection) {
        const dataCollectionInput = document.getElementById(
          "guided-ds-study-data-collection"
        );
        dataCollectionInput.value = dataCollection;
        dataCollectionInput.disabled = true;
      }
      if (primaryConclusion) {
        const primaryConclusionInput = document.getElementById(
          "guided-ds-study-primary-conclusion"
        );
        primaryConclusionInput.value = primaryConclusion;
        primaryConclusionInput.disabled = true;
      }*/
    }

    if (targetPageID === "guided-samples-folder-tab") {
      renderSamplesTables();
    }
    if (targetPageID === "guided-pennsieve-intro-tab") {
      const confirmPennsieveAccountDiv = document.getElementById(
        "guided-confirm-pennsieve-account"
      );
      const selectPennsieveAccountDiv = document.getElementById(
        "guided-select-pennsieve-account"
      );
      if (!defaultBfAccount) {
        confirmPennsieveAccountDiv.classList.add("hidden");
        selectPennsieveAccountDiv.classList.remove("hidden");
      } else {
        confirmPennsieveAccountDiv.classList.remove("hidden");
        selectPennsieveAccountDiv.classList.add("hidden");

        const pennsieveIntroText = document.getElementById(
          "guided-pennsive-intro-bf-account"
        );
        const pennsieveIntroAccountDetailsText = document.getElementById(
          "guided-pennsive-intro-account-details"
        );
        pennsieveIntroText.innerHTML = defaultBfAccount;
        (async () => {
          try {
            let bf_account_details_req = await client.get(
              `/manage_datasets/bf_account_details`,
              {
                params: {
                  selected_account: defaultBfAccount,
                },
              }
            );
            let accountDetailsRes = bf_account_details_req.data.account_details;
            pennsieveIntroAccountDetailsText.innerHTML = accountDetailsRes;
          } catch (error) {
            currentAccountDetailsText.innerHTML =
              "Error loading account details";
            console.log(error);
          }
        })();
      }
    }
    if (targetPageID === "guided-banner-image-tab") {
      if (sodaJSONObj["digital-metadata"]["banner-image-path"]) {
        guidedShowBannerImagePreview(
          sodaJSONObj["digital-metadata"]["banner-image-path"]
        );
      } else {
        //reset the banner image page
        $("#guided-button-add-banner-image").html("Add banner image");
        $("#guided-banner-image-preview-container").hide();
      }
    }
    if (targetPageID === "guided-designate-permissions-tab") {
      renderPermissionsTable();
      guidedResetUserTeamPermissionsDropdowns();
    }
    if (targetPageID === "guided-add-description-tab") {
      const studyPurposeInput = document.getElementById(
        "guided-pennsieve-study-purpose"
      );
      const studyDataCollectionInput = document.getElementById(
        "guided-pennsieve-study-data-collection"
      );
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-pennsieve-study-primary-conclusion"
      );

      const studyInformationFromDescriptionMetadata =
        sodaJSONObj["dataset-metadata"]["description-metadata"][
          "study-information"
        ];

      const descriptionMetadata =
        sodaJSONObj["digital-metadata"]["description"];

      if (Object.keys(descriptionMetadata).length > 0) {
        studyPurposeInput.value = descriptionMetadata["study-purpose"];
        studyDataCollectionInput.value = descriptionMetadata["data-collection"];
        studyPrimaryConclusionInput.value =
          descriptionMetadata["primary-conclusion"];
      } else if (studyInformationFromDescriptionMetadata) {
        studyPurposeInput.value =
          studyInformationFromDescriptionMetadata["study purpose"];
        studyDataCollectionInput.value =
          studyInformationFromDescriptionMetadata["study data collection"];
        studyPrimaryConclusionInput.value =
          studyInformationFromDescriptionMetadata["study primary conclusion"];
      } else {
        studyPurposeInput.value = "";
        studyDataCollectionInput.value = "";
        studyPrimaryConclusionInput.value = "";
      }
    }

    if (targetPageID === "guided-add-tags-tab") {
      const descriptionMetadata =
        sodaJSONObj["dataset-metadata"]["description-metadata"][
          "dataset-information"
        ];
      const datasetTags = sodaJSONObj["digital-metadata"]["dataset-tags"];

      guidedDatasetTagsTagify.removeAllTags();

      //Try to add tags from a previous session if they exist
      //If not, try to populate the keywords entered during description metadata addition
      if (datasetTags) {
        guidedDatasetTagsTagify.addTags(datasetTags);
      } else if (descriptionMetadata) {
        if (descriptionMetadata["keywords"]) {
          guidedDatasetTagsTagify.addTags(descriptionMetadata["keywords"]);
        }
      }
    }

    if (targetPageID === "guided-assign-license-tab") {
      const licenseCheckbox = document.getElementById(
        "guided-license-checkbox"
      );
      if (sodaJSONObj["digital-metadata"]["license"]) {
        licenseCheckbox.checked = true;
      } else {
        licenseCheckbox.checked = false;
      }
    }
    if (targetPageID === "guided-dataset-generate-location-tab") {
      const currentAccountText = document.getElementById("guided-bf-account");
      const currentAccountDetailsText = document.getElementById(
        "guided-account-details"
      );
      if (defaultBfAccount) {
        currentAccountText.innerHTML = defaultBfAccount;
        (async () => {
          try {
            let bf_account_details_req = await client.get(
              `/manage_datasets/bf_account_details`,
              {
                params: {
                  selected_account: defaultBfAccount,
                },
              }
            );
            let accountDetailsRes = bf_account_details_req.data.account_details;
            currentAccountDetailsText.innerHTML = accountDetailsRes;
          } catch (error) {
            currentAccountDetailsText.innerHTML =
              "Error loading account details";
            console.log(error);
          }
        })();
      } else {
        currentAccountText.innerHTML = "None";
        currentAccountDetailsText.innerHTML = "None";
      }
    }

    if (targetPageID === "guided-dataset-generate-destination-tab") {
      const datasetName = sodaJSONObj["digital-metadata"]["name"];

      const confirmDatasetGenerationNameinput = document.getElementById(
        "guided-input-dataset-name"
      );

      confirmDatasetGenerationNameinput.value = datasetName;
    }

    if (targetPageID === "guided-dataset-generation-confirmation-tab") {
      //Reset the dataset upload UI
      const pennsieveMetadataUploadTable = document.getElementById(
        "guided-tbody-pennsieve-metadata-upload"
      );
      const pennsieveMetadataUploadTableRows =
        pennsieveMetadataUploadTable.children;
      for (const row of pennsieveMetadataUploadTableRows) {
        if (row.classList.contains("permissions-upload-tr")) {
          //delete the row to reset permissions UI
          row.remove();
        } else {
          row.classList.add("hidden");
        }
      }
      document
        .getElementById("guided-div-pennsieve-metadata-upload-status-table")
        .classList.add("hidden");

      const datasetMetadataUploadTable = document.getElementById(
        "guided-tbody-dataset-metadata-upload"
      );
      const datasetMetadataUploadTableRows =
        datasetMetadataUploadTable.children;
      for (const row of datasetMetadataUploadTableRows) {
        row.classList.add("hidden");
      }
      document
        .getElementById("guided-div-dataset-metadata-upload-status-table")
        .classList.add("hidden");

      document
        .getElementById("guided-div-dataset-upload-progress-bar")
        .classList.add("hidden");

      //reset the progress bar to 0
      setGuidedProgressBarValue(0);
      updateDatasetUploadProgressTable({
        "Upload status": `Preparing dataset for upload`,
      });

      const datsetName = sodaJSONObj["digital-metadata"]["name"];
      const datsetSubtitle = sodaJSONObj["digital-metadata"]["subtitle"];
      const datasetPiOwner =
        sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
      const datasetUserPermissions =
        sodaJSONObj["digital-metadata"]["user-permissions"];
      const datasetTeamPermissions =
        sodaJSONObj["digital-metadata"]["team-permissions"];
      const datasetTags = sodaJSONObj["digital-metadata"]["dataset-tags"];
      const datasetLicense = sodaJSONObj["digital-metadata"]["license"];

      const datasetNameReviewText = document.getElementById(
        "guided-review-dataset-name"
      );

      const datasetSubtitleReviewText = document.getElementById(
        "guided-review-dataset-subtitle"
      );
      const datasetPiOwnerReviewText = document.getElementById(
        "guided-review-dataset-pi-owner"
      );
      const datasetUserPermissionsReviewText = document.getElementById(
        "guided-review-dataset-user-permissions"
      );
      const datasetTeamPermissionsReviewText = document.getElementById(
        "guided-review-dataset-team-permissions"
      );
      const datasetTagsReviewText = document.getElementById(
        "guided-review-dataset-tags"
      );
      const datasetLicenseReviewText = document.getElementById(
        "guided-review-dataset-license"
      );

      datasetNameReviewText.innerHTML = datsetName;
      datasetSubtitleReviewText.innerHTML = datsetSubtitle;
      datasetPiOwnerReviewText.innerHTML = datasetPiOwner;

      if (datasetUserPermissions.length > 0) {
        const datasetUserPermissionsString = datasetUserPermissions
          .map((permission) => permission.userString)
          .join("<br>");
        datasetUserPermissionsReviewText.innerHTML =
          datasetUserPermissionsString;
      } else {
        datasetUserPermissionsReviewText.innerHTML =
          "No additional user permissions added";
      }

      if (datasetTeamPermissions.length > 0) {
        const datasetTeamPermissionsString = datasetTeamPermissions
          .map((permission) => permission.teamString)
          .join("<br>");
        datasetTeamPermissionsReviewText.innerHTML =
          datasetTeamPermissionsString;
      } else {
        datasetTeamPermissionsReviewText.innerHTML =
          "No additional team permissions added";
      }

      datasetTagsReviewText.innerHTML = datasetTags.join(", ");
      datasetLicenseReviewText.innerHTML = datasetLicense;

      const folderStructurePreview = document.getElementById(
        "guided-folder-structure-review-generate"
      );
      $(folderStructurePreview).jstree({
        core: {
          check_callback: true,
          data: {},
        },
        plugins: ["types"],
        types: {
          folder: {
            icon: "fas fa-folder fa-fw",
          },
          "folder open": {
            icon: "fas fa-folder-open fa-fw",
          },
          "folder closed": {
            icon: "fas fa-folder fa-fw",
          },
          "file xlsx": {
            icon: "./assets/img/excel-file.png",
          },
          "file xls": {
            icon: "./assets/img/excel-file.png",
          },
          "file png": {
            icon: "./assets/img/png-file.png",
          },
          "file PNG": {
            icon: "./assets/img/png-file.png",
          },
          "file pdf": {
            icon: "./assets/img/pdf-file.png",
          },
          "file txt": {
            icon: "./assets/img/txt-file.png",
          },
          "file csv": {
            icon: "./assets/img/csv-file.png",
          },
          "file CSV": {
            icon: "./assets/img/csv-file.png",
          },
          "file DOC": {
            icon: "./assets/img/doc-file.png",
          },
          "file DOCX": {
            icon: "./assets/img/doc-file.png",
          },
          "file docx": {
            icon: "./assets/img/doc-file.png",
          },
          "file doc": {
            icon: "./assets/img/doc-file.png",
          },
          "file jpeg": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file JPEG": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file other": {
            icon: "./assets/img/other-file.png",
          },
        },
      });
      $(folderStructurePreview).on("open_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder open");
      });
      $(folderStructurePreview).on("close_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder closed");
      });
      guidedShowTreePreview(
        sodaJSONObj["digital-metadata"]["name"],
        folderStructurePreview
      );
    }

    if (targetPageID === "guided-create-subjects-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById("guided-accordian-custom-fields").innerHTML = "";
      document.getElementById("guided-bootbox-subject-id").value = "";

      //Add protocol titles to the protocol dropdown
      const protocols =
        sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

      document.getElementById(
        "guided-bootbox-subject-protocol-title"
      ).innerHTML = `
        <option value="">No protocols associated with this sample</option>
        ${protocols
          .map((protocol) => {
            return `
              <option
                value="${protocol.description}"
                data-protocol-link="${protocol.link}"
              >
                ${protocol.description}
              </option>
            `;
          })
          .join("\n")}))
      `;

      document.getElementById(
        "guided-bootbox-subject-protocol-location"
      ).innerHTML = `
        <option value="">No protocols associated with this sample</option>
        ${protocols
          .map((protocol) => {
            return `
              <option
                value="${protocol.link}"
                data-protocol-description="${protocol.description}"
              >
                ${protocol.link}
              </option>
            `;
          })
          .join("\n")}))
      `;
      renderSubjectsMetadataAsideItems();
      const subjectsMetadataBlackArrowLottieContainer = document.getElementById(
        "subjects-metadata-black-arrow-lottie-container"
      );
      subjectsMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: subjectsMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      switchElementVisibility(
        "guided-form-add-a-subject",
        "guided-form-add-a-subject-intro"
      );
    }

    if (targetPageID === "guided-create-samples-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById(
        "guided-accordian-custom-fields-samples"
      ).innerHTML = "";
      document.getElementById("guided-bootbox-subject-id-samples").value = "";
      document.getElementById("guided-bootbox-sample-id").value = "";
      renderSamplesMetadataAsideItems();
      const samplesMetadataBlackArrowLottieContainer = document.getElementById(
        "samples-metadata-black-arrow-lottie-container"
      );
      samplesMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: samplesMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      switchElementVisibility(
        "guided-form-add-a-sample",
        "guided-form-add-a-sample-intro"
      );
    }
    if (targetPageID === "guided-add-code-metadata-tab") {
      const codeMetadata = sodaJSONObj["dataset-metadata"]["code-metadata"];

      const codeDescriptionLottieContainer = document.getElementById(
        "code-description-lottie-container"
      );
      const codeDescriptionParaText = document.getElementById(
        "guided-code-description-para-text"
      );

      if (codeMetadata["code_description"]) {
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: successCheck,
          renderer: "svg",
          loop: false,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = codeMetadata["code_description"];
      } else {
        //reset the code metadata lotties and para text
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = "";
      }
    }
    if (targetPageID === "guided-create-readme-metadata-tab") {
      const readMeTextArea = document.getElementById(
        "guided-textarea-create-readme"
      );

      const readMe = sodaJSONObj["dataset-metadata"]["README"];

      if (readMe) {
        readMeTextArea.value = readMe;
      } else {
        readMeTextArea.value = "";
      }
    }

    if (targetPageID === "guided-dataset-generation-tab") {
      document
        .getElementById("guided-dataset-upload-complete-message")
        .classList.add("hidden");
    }

    if (targetPageID === "guided-dataset-dissemination-tab") {
      const pennsieveDatasetID =
        sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

      if (pennsieveDatasetID) {
        const pennsieveDatasetLink = document.getElementById(
          "guided-pennsieve-dataset-link"
        );

        const pennsieveCopy = document.getElementById(
          "guided-pennsieve-copy-dataset-link"
        );

        const copyIcon = document.getElementById("guided-pennsieve-copy-icon");

        let datasetLink = `https://app.pennsieve.io/N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0/datasets/${pennsieveDatasetID}/overview`;
        let linkIcon = `<i class="fas fa-link" style="margin-right: 0.4rem; margin-left: 0.4rem"></i>`;

        pennsieveDatasetLink.innerHTML = linkIcon + datasetLink;
        pennsieveDatasetLink.href = datasetLink;

        pennsieveCopy.addEventListener("click", function () {
          Clipboard.writeText(datasetLink);
          copyIcon.classList.remove("fa-copy");
          copyIcon.classList.add("fa-check");

          notyf.open({
            duration: "2000",
            type: "success",
            message: "Link copied!",
          });
        });
      }

      /*
      Celebration Lottie
      const transparentFullWidthHeightElement = document.createElement("div");
      transparentFullWidthHeightElement.style.height = "700px";
      transparentFullWidthHeightElement.style.width = "800px";
      document
        .getElementById("guided-dataset-dissemination-tab")
        .appendChild(transparentFullWidthHeightElement);
      */

      document.getElementById("guided-pennsieve-dataset-name").innerHTML =
        sodaJSONObj["digital-metadata"]["name"];
      let bf_get_permissions = await client.get(
        `/manage_datasets/bf_dataset_permissions`,
        {
          params: {
            selected_account: defaultBfAccount,
            selected_dataset: sodaJSONObj["digital-metadata"]["name"],
          },
        }
      );
      let datasetPermissions = bf_get_permissions.data.permissions;

      let sharedWithSPARCCurationTeam = false;

      for (const permission of datasetPermissions) {
        if (permission.includes("SPARC Data Curation Team")) {
          sharedWithSPARCCurationTeam = true;
        }
      }

      guidedSetCurationTeamUI(sharedWithSPARCCurationTeam);
    }

    let currentParentTab = CURRENT_PAGE.parent();
    let targetPage = $(`#${targetPageID}`);
    let targetPageParentTab = targetPage.parent();

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveCapsule(targetPageID);
    setActiveProgressionTab(targetPageID);

    const guidedBody = document.getElementById("guided-body");

    //Check to see if target element has the same parent as current sub step
    if (currentParentTab.attr("id") === targetPageParentTab.attr("id")) {
      CURRENT_PAGE.hide();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      CURRENT_PAGE.hide();
      currentParentTab.hide();
      targetPageParentTab.show();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const setActiveSubPage = (pageIdToActivate) => {
  const pageElementToActivate = document.getElementById(pageIdToActivate);

  //create a switch statement for pageIdToActivate to load data from sodaJSONObj
  //depending on page being opened
  switch (pageIdToActivate) {
    case "guided-specify-subjects-page": {
      const [subjectsInPools, subjectsOutsidePools] =
        sodaJSONObj.getAllSubjects();
      //Combine sample data from subjects in and out of pools
      let subjects = [...subjectsInPools, ...subjectsOutsidePools];
      const subjectElementRows = subjects
        .map((subject) => {
          return generateSubjectRowElement(subject.subjectName);
        })
        .join("\n");
      document.getElementById("subject-specification-table-body").innerHTML =
        subjectElementRows;
      //remove the add subject help text
      document
        .getElementById("guided-add-subject-instructions")
        .classList.add("hidden");
      break;
    }

    case "guided-organize-subjects-into-pools-page": {
      const pools = sodaJSONObj.getPools();

      const poolElementRows = Object.keys(pools)
        .map((pool) => {
          return generatePoolRowElement(pool);
        })
        .join("\n");
      document.getElementById("pools-specification-table-body").innerHTML =
        poolElementRows;

      for (const poolName of Object.keys(pools)) {
        const newPoolSubjectsSelectElement = document.querySelector(
          `select[name="${poolName}-subjects-selection-dropdown"]`
        );
        //create a select2 dropdown for the pool subjects
        $(newPoolSubjectsSelectElement).select2({
          placeholder: "Select subjects",
          tags: true,
          width: "100%",
          closeOnSelect: false,
          createTag: function () {
            // Disable tagging
            return null;
          },
        });
        //update the newPoolSubjectsElement with the subjects in the pool
        updatePoolDropdown($(newPoolSubjectsSelectElement), poolName);
        $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
          updatePoolDropdown($(e.currentTarget), poolName);
        });
        $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
          const subjectToRemove = e.params.data.id;
          sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
        });
        $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
          const selectedSubject = e.params.data.id;
          sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
        });
      }
      break;
    }

    case "guided-specify-samples-page": {
      const [subjectsInPools, subjectsOutsidePools] =
        sodaJSONObj.getAllSubjects();
      //Combine sample data from subjects in and out of pools
      let subjects = [...subjectsInPools, ...subjectsOutsidePools];

      //Create the HTML for the subjects
      const subjectSampleAdditionTables = subjects
        .map((subject) => {
          return renderSubjectSampleAdditionTable(subject);
        })
        .join("\n");

      //Add the subject sample addition elements to the DOM
      const subjectSampleAdditionTableContainer = document.getElementById(
        "guided-div-add-samples-tables"
      );

      subjectSampleAdditionTableContainer.innerHTML =
        subjectSampleAdditionTables;
      break;
    }

    case "guided-primary-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to primary subject data organization page
      if (
        document.getElementById("guided-primary-samples-organization-page")
          .dataset.skipSubPage === "true"
      ) {
        setActiveSubPage("guided-primary-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("primary");
      guidedUpdateFolderStructure("primary", "samples");

      $("#guided-file-explorer-elements").appendTo(
        $("#guided-primary-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-primary-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const primarySamplesFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "primary-samples-file-explorer-black-arrow-lottie-container"
        );
      primarySamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: primarySamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-primary-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("primary");
      guidedUpdateFolderStructure("primary", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-primary-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-primary-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const primarySubjectsFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "primary-subjects-file-explorer-black-arrow-lottie-container"
        );
      primarySubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: primarySubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-source-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to source subject data organization page
      if (
        document.getElementById("guided-source-samples-organization-page")
          .dataset.skipSubPage === "true"
      ) {
        setActiveSubPage("guided-source-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("source");
      guidedUpdateFolderStructure("source", "samples");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-source-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-source-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const sourceSamplesFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "source-samples-file-explorer-black-arrow-lottie-container"
        );
      sourceSamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: sourceSamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-source-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("source");
      guidedUpdateFolderStructure("source", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-source-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-source-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const sourceSubjectsFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "source-subjects-file-explorer-black-arrow-lottie-container"
        );
      sourceSubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: sourceSubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-derivative-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to derivative subject data organization page
      if (
        document.getElementById("guided-derivative-samples-organization-page")
          .dataset.skipSubPage === "true"
      ) {
        setActiveSubPage("guided-derivative-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("derivative");
      guidedUpdateFolderStructure("derivative", "samples");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-derivative-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-derivative-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const derivativeSamplesFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "derivative-samples-file-explorer-black-arrow-lottie-container"
        );
      derivativeSamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: derivativeSamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-derivative-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("derivative");
      guidedUpdateFolderStructure("derivative", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-derivative-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document
        .getElementById("guided-file-explorer-elements")
        .classList.add("hidden");
      document
        .getElementById("guided-derivative-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const derivativeSubjectsFileExplorerBlackArrowLottieContainer =
        document.getElementById(
          "derivative-subjects-file-explorer-black-arrow-lottie-container"
        );
      derivativeSubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: derivativeSubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-data-derivative-import-page": {
      const importedMilestones =
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "temp-imported-milestones"
        ];

      if (importedMilestones) {
        renderMilestoneSelectionTable(importedMilestones);
        const tempSelectedMilestones =
          sodaJSONObj["dataset-metadata"]["submission-metadata"][
            "temp-selected-milestones"
          ];
        if (tempSelectedMilestones) {
          //Check the checkboxes for previously selected milestones
          const milestoneDescriptionsToCheck = tempSelectedMilestones.map(
            (milestone) => {
              return milestone["description"];
            }
          );
          for (const milestone of milestoneDescriptionsToCheck) {
            //find the checkbox with name milestone and value of milestone
            const milestoneCheckbox = document.querySelector(
              `input[name="milestone"][value="${milestone}"]`
            );
            if (milestoneCheckbox) {
              milestoneCheckbox.checked = true;
            }
          }
        }
        unHideAndSmoothScrollToElement("guided-div-data-deliverables-import");
      } else {
        document
          .getElementById("guided-div-data-deliverables-import")
          .classList.add("hidden");
      }
      break;
    }

    case "guided-completion-date-selection-page": {
      const selectedMilestoneData =
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "temp-selected-milestones"
        ];

      // get a unique set of completionDates from checkedMilestoneData
      const uniqueCompletionDates = Array.from(
        new Set(
          selectedMilestoneData.map((milestone) => milestone.completionDate)
        )
      );

      if (uniqueCompletionDates.length === 1) {
        //save the completion date into sodaJSONObj
        const uniqueCompletionDate = uniqueCompletionDates[0];
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "completion-date"
        ] = uniqueCompletionDate;

        document.getElementById("guided-completion-date-container").innerHTML =
          createCompletionDateRadioElement(
            "completion-date",
            uniqueCompletionDate
          );
        //check the completion date
        document.querySelector(
          `input[name="completion-date"][value="${uniqueCompletionDate}"]`
        ).checked = true;
      }

      if (uniqueCompletionDates.length > 1) {
        //filter value 'N/A' from uniqueCompletionDates
        const filteredUniqueCompletionDates = uniqueCompletionDates.filter(
          (date) => date !== "N/A"
        );

        //create a radio button for each unique date
        const completionDateCheckMarks = filteredUniqueCompletionDates
          .map((completionDate) => {
            return createCompletionDateRadioElement(
              "completion-date",
              completionDate
            );
          })
          .join("\n");
        document.getElementById("guided-completion-date-container").innerHTML =
          completionDateCheckMarks;

        //If a completion date has already been selected, select it's radio button
        const selectedCompletionDate =
          sodaJSONObj["dataset-metadata"]["submission-metadata"][
            "completion-date"
          ];
        if (selectedCompletionDate) {
          const selectedCompletionDateRadioElement = document.querySelector(
            `input[name="completion-date"][value="${selectedCompletionDate}"]`
          );
          if (selectedCompletionDateRadioElement) {
            selectedCompletionDateRadioElement.checked = true;
          }
        }
      }
      break;
    }

    case "guided-submission-metadata-page": {
      const sparcAward =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const selectedMilestones =
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "temp-selected-milestones"
        ];

      const completionDate =
        sodaJSONObj["dataset-metadata"]["submission-metadata"][
          "completion-date"
        ];

      const sparcAwardInput = document.getElementById(
        "guided-submission-sparc-award"
      );
      const completionDateInput = document.getElementById(
        "guided-submission-completion-date"
      );

      guidedSubmissionTagsTagify.removeAllTags();

      sparcAwardInput.value = sparcAward;

      const uniqueMilestones = Array.from(
        new Set(selectedMilestones.map((milestone) => milestone.milestone))
      );
      guidedSubmissionTagsTagify.addTags(uniqueMilestones);

      completionDateInput.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
      //select the completion date that was added
      completionDateInput.value = completionDate;

      break;
    }
  }

  //Show target page and hide its siblings
  pageElementToActivate.classList.remove("hidden");
  const pageElementSiblings = pageElementToActivate.parentElement.children;
  //filter pageElementSiblings to only contain elements with class "sub-page"
  const pageElementSiblingsToHide = Array.from(pageElementSiblings).filter(
    (pageElementSibling) => {
      return (
        pageElementSibling.classList.contains("sub-page") &&
        pageElementSibling.id !== pageIdToActivate
      );
    }
  );
  //hide all pageElementSiblingsToHide
  pageElementSiblingsToHide.forEach((pageElementSibling) => {
    pageElementSibling.classList.add("hidden");
  });

  //Set page's capsule to active and remove active from sibling capsules
  const pageCapsuleToActivate = document.getElementById(
    `${pageIdToActivate}-capsule`
  );
  pageCapsuleToActivate.classList.add("active");
  const siblingCapsules = pageCapsuleToActivate.parentElement.children;
  for (const siblingCapsule of siblingCapsules) {
    if (siblingCapsule.id !== `${pageIdToActivate}-capsule`) {
      siblingCapsule.classList.remove("active");
    }
  }
};

const guidedIncreaseCurateProgressBar = (percentToIncrease) => {
  $("#guided-progress-bar-new-curate").attr(
    "value",
    parseInt($("#guided-progress-bar-new-curate").attr("value")) +
      percentToIncrease
  );
};
const setGuidedProgressBarValue = (value) => {
  $("#guided-progress-bar-new-curate").attr("value", value);
};
function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const isNumberBetween = (number, minVal, maxVal) => {
  return (
    !isNaN(parseFloat(number)) &&
    isFinite(number) &&
    number >= minVal &&
    number <= maxVal
  );
};
function subSamInputIsValid(subSamInput) {
  const subSamInputPattern = /^[a-z]+-[0-9A-Za-z-]+$/;
  return subSamInputPattern.test(subSamInput);
}
const generateAlertElement = (alertType, warningMessageText) => {
  return `
      <div style="margin-left:.5rem; margin-right:.5rem"class="alert alert-${alertType} guided--alert" role="alert">
        ${warningMessageText}
      </div>
    `;
};
const generateAlertMessage = (elementToWarn) => {
  const alertMessage = elementToWarn.data("alert-message");
  const alertType = elementToWarn.data("alert-type");
  if (!elementToWarn.next().hasClass("alert")) {
    elementToWarn.after(generateAlertElement(alertType, alertMessage));
  }
  enableProgressButton();
};
const removeAlertMessageIfExists = (elementToCheck) => {
  const alertMessageToRemove = elementToCheck.next();
  if (alertMessageToRemove.hasClass("alert")) {
    elementToCheck.next().remove();
  }
};
const validateInput = (inputElementToValidate) => {
  let inputIsValid = false;

  const inputID = inputElementToValidate.attr("id");
  if (inputID === "guided-dataset-name-input") {
    let name = inputElementToValidate.val().trim();
    if (name !== "") {
      if (!check_forbidden_characters_bf(name)) {
        removeAlertMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-dataset-subtitle-input") {
    let subtitle = inputElementToValidate.val().trim();
    if (subtitle !== "") {
      if (subtitle.length < 257) {
        removeAlertMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-number-of-subjects-input") {
    let numSubjects = inputElementToValidate.val().trim();
    if (numSubjects !== "") {
      if (isNumberBetween(numSubjects, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-same-amount-samples-form").css("display", "flex");
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-same-amount-samples-form").hide();
      }
    } else {
      $("#guided-same-amount-samples-form").hide();
    }
  }
  if (inputID === "guided-number-of-samples-input") {
    let numSamples = inputElementToValidate.val().trim();
    if (numSamples !== "") {
      if (isNumberBetween(numSamples, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-button-generate-subjects-table").show();

        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-button-generate-subjects-table").hide();
      }
    } else {
      $("#guided-button-generate-subjects-table").hide();
    }
  }
  if (inputID === "guided-number-of-samples-input") {
    let numSamples = inputElementToValidate.val().trim();
    if (numSamples !== "") {
      if (isNumberBetween(numSamples, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-button-generate-subjects-table").show();

        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-button-generate-subjects-table").hide();
      }
    } else {
      $("#guided-button-generate-subjects-table").hide();
    }
  }
  return inputIsValid;
};

/////////////////////////////////////////////////////////
//////////       GUIDED FORM VALIDATORS       ///////////
/////////////////////////////////////////////////////////

const isPageValid = (pageID) => {
  if (pageID === "guided-designate-pi-owner-tab") {
    const designateSelfButton = document.getElementById(
      "guided-button-designate-self-PI"
    );
    const designateOtherButton = document.getElementById(
      "guided-button-designate-other-PI"
    );

    if (designateSelfButton.classList.contains("selected")) {
      return true;
    }
    if (designateOtherButton.classList.contains("selected")) {
      if (
        $("#guided_bf_list_users_pi option:selected").text().trim() !==
        "Select PI"
      ) {
        return true;
      }
    }
    //return false if neither button is selected
    return false;
  }
  if (pageID === "guided-assign-license-tab") {
    const licenseCheckbox = document.getElementById("guided-license-checkbox");
    if (licenseCheckbox.checked) {
      return true;
    }
    return false;
  }
};

const openEditGuidedDatasetSwal = async (datasetName) => {
  swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    icon: "info",
    title:
      "Editing a dataset curated via guided mode is handled via Free-Form mode.",
    html: `\nTo edit <b>${datasetName}</b>, go to Free-Form mode, select the dataset component that you would like
    to modify, select ${datasetName} from the dataset selection drop-down, and edit the data in Free-Form mode.`,
    confirmButtonText: "OK",
  });
};

const patchPreviousGuidedModeVersions = () => {
  //temp patch contributor affiliations if they are still a string (they were added in the previous version)
  const contributors =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  if (contributors) {
    for (contributor of sodaJSONObj["dataset-metadata"]["description-metadata"][
      "contributors"
    ]) {
      //if contributor is in old format (string), convert to new format (array)
      if (!Array.isArray(contributor.conAffliation)) {
        contributor.conAffliation = [contributor.conAffliation];
      }
    }
  }

  //temp patch subjectsTableData to add "RRID for strain" field
  if (subjectsTableData.length > 0) {
    //check if subjectsTableData has "RRID for strain" field
    if (!subjectsTableData[0].includes("RRID for strain")) {
      //insert "RRID for strain" string as the 6th element of subjectsTableData[0]
      subjectsTableData[0].splice(6, 0, "RRID for strain");
      //Insert empty string as the 6th element for each subject in subjectsTableData
      //besides the first element, which is the header row
      for (let i = 1; i < subjectsTableData.length; i++) {
        subjectsTableData[i].splice(6, 0, "");
      }
    }
  }

  //Update manifest files key from old key ("manifest-files") to new key ("guided-manifest-files")
  if (sodaJSONObj["manifest-files"]) {
    sodaJSONObj["guided-manifest-files"] = {};
    delete sodaJSONObj["manifest-files"];
  }
};

//Loads UI when continue curation button is pressed
const guidedResumeProgress = async (resumeProgressButton) => {
  const datasetNameToResume = resumeProgressButton
    .parent()
    .siblings()
    .find($(".progress-file-name"))
    .html();
  const datasetResumeJsonObj = await getProgressFileData(datasetNameToResume);
  sodaJSONObj = datasetResumeJsonObj;

  attachGuidedMethodsToSodaJSONObj();

  datasetStructureJSONObj = sodaJSONObj["saved-datset-structure-json-obj"];
  subjectsTableData = sodaJSONObj["subjects-table-data"];
  samplesTableData = sodaJSONObj["samples-table-data"];

  patchPreviousGuidedModeVersions();

  guidedTransitionFromHome();
  //Set the dataset name and subtitle input values using the
  //previously saved dataset name and subtitle
  document.getElementById("guided-dataset-name-input").value =
    datasetResumeJsonObj["digital-metadata"]["name"];
  document.getElementById("guided-dataset-subtitle-input").value =
    datasetResumeJsonObj["digital-metadata"]["subtitle"];

  guidedTransitionFromDatasetNameSubtitlePage();

  //Return the user to the last page they exited on
  const pageBeforeExit = datasetResumeJsonObj["page-before-exit"];
  if (pageBeforeExit) {
    //Hide the sub-page navigation and show the main page navigation footer
    //If the user traverses to a page that requires the sub-page navigation,
    //the sub-page will be shown during traverseToTab() function
    $("#guided-sub-page-navigation-footer-div").hide();
    $("#guided-footer-div").css("display", "flex");
    //If the last page the exited was the upload page, take them to the review page
    pageBeforeExit === "guided-dataset-generation-tab"
      ? traverseToTab("guided-dataset-generation-confirmation-tab")
      : traverseToTab(pageBeforeExit);
  }
  guidedLockSideBar();
};

//Add  spinner to element
const guidedUploadStatusIcon = (elementID, status) => {
  let statusElement = document.getElementById(`${elementID}`);
  statusElement.innerHTML = ``;
  let spinner = `
    <div class="spinner-border" role="status" style="
      height: 24px;
      width: 24px;
    "></div>`;

  if (status === "loading") {
    statusElement.innerHTML = spinner;
  }
  if (status === "success") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: successCheck,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
  if (status === "error") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: errorMark,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
};

//dataset description (first page) functions
guidedCreateSodaJSONObj = () => {
  sodaJSONObj = {};

  sodaJSONObj["guided-options"] = {};
  sodaJSONObj["bf-account-selected"] = {};
  sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  sodaJSONObj["generate-dataset"] = {};
  sodaJSONObj["guided-manifest-files"] = {};
  sodaJSONObj["metadata-files"] = {};
  sodaJSONObj["starting-point"] = {};
  sodaJSONObj["dataset-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["shared-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["protocol-data"] = [];
  sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"] = {};
  sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"] =
    {};
  sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["subjects"] =
    {};
  sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["samples"] =
    {};
  sodaJSONObj["dataset-metadata"]["subject-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["sample-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["submission-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["description-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["code-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    [];
  sodaJSONObj["dataset-metadata"]["README"] = "";
  sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
  sodaJSONObj["digital-metadata"] = {};
  sodaJSONObj["digital-metadata"]["description"] = {};
  sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  sodaJSONObj["digital-metadata"]["user-permissions"] = [];
  sodaJSONObj["digital-metadata"]["team-permissions"] = [];
  sodaJSONObj["completed-tabs"] = [];
  sodaJSONObj["last-modified"] = "";
  sodaJSONObj["button-config"] = {};
  sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = false;
  datasetStructureJSONObj = { folders: {}, files: {} };
};
const attachGuidedMethodsToSodaJSONObj = () => {
  sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };
  sodaJSONObj.addSubject = function (subjectName) {
    //check if subject with the same name already exists
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        subjectName
      ] ||
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subjectName
      ]
    ) {
      throw new Error("Subject names must be unique.");
    }
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
      subjectName
    ] = {};
  };
  sodaJSONObj.renameSubject = function (prevSubjectName, newSubjectName) {
    //check if subject with the same name already exists
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        newSubjectName
      ] ||
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        newSubjectName
      ]
    ) {
      throw new Error("Subject names must be unique.");
    }
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    //Check subjectsInPools for a subject matching previousSubjectName
    //if found, rename the subject
    for (const subjectData of subjectsInPools) {
      if (subjectData.subjectName === prevSubjectName) {
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          subjectData.poolName
        ][newSubjectName] =
          this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subjectData.poolName
          ][prevSubjectName];

        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "pools"
        ][subjectData.poolName][prevSubjectName];
        return;
      }
    }

    //Check subjectsOutsidePools for a subject matching previousSubjectName
    //if found, rename the subject
    for (const subjectData of subjectsOutsidePools) {
      if (subjectData.subjectName === prevSubjectName) {
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
          newSubjectName
        ] =
          this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            prevSubjectName
          ];
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "subjects"
        ][prevSubjectName];
        return;
      }
    }
  };
  sodaJSONObj.deleteSubject = function (subjectName) {
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    //Check subjectsInPools for a subject matching subjectName
    //if found, delete from pool
    for (const subjectData of subjectsInPools) {
      if (subjectData.subjectName === subjectName) {
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "pools"
        ][subjectData.poolName][subjectName];
      }
    }
    //Check subjectsOutsidePools for a subject matching subjectName
    //if found, delete subject
    for (const subjectData of subjectsOutsidePools) {
      if (subjectData.subjectName === subjectName) {
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "subjects"
        ][subjectName];
      }
    }

    //remove the subject's subject metadata
    subjectsTableData = subjectsTableData.filter((subject) => {
      return subject[0] !== subjectName;
    });
  };
  sodaJSONObj.getSubjectsOutsidePools = function () {
    let subjectsNotInPools = Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    );
    return /*subjectsInPools.concat(*/ subjectsNotInPools /*)*/;
  };
  sodaJSONObj.getSubjectsInPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
  sodaJSONObj.moveSubjectIntoPool = function (subjectName, poolName) {
    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      poolName
    ][subjectName] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subjectName
      ];
    delete this["dataset-metadata"]["pool-subject-sample-structure"][
      "subjects"
    ][subjectName];
  };
  sodaJSONObj.moveSubjectOutOfPool = function (subjectName, poolName) {
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
      subjectName
    ] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ][subjectName];
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      poolName
    ][subjectName];
  };
  sodaJSONObj.addPool = function (poolName) {
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ]
    ) {
      throw new Error("Pool names must be unique.");
    }

    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      poolName
    ] = {};
  };
  sodaJSONObj.renamePool = function (prevPoolName, newPoolName) {
    //check if name already exists
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        newPoolName
      ]
    ) {
      throw new Error("Pool names must be unique.");
    }
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        prevPoolName
      ]
    ) {
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        newPoolName
      ] =
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          prevPoolName
        ];
      delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        prevPoolName
      ];
    }
  };
  sodaJSONObj.deletePool = function (poolName) {
    //empty the subjects in the pool back into subjects
    let pool =
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ];
    for (let subject in pool) {
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subject
      ] = pool[subject];
    }
    //delete the pool after copying the subjects back into subjects
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      poolName
    ];
    //renderPoolTable();
  };
  sodaJSONObj.getPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
  sodaJSONObj.getPoolSubjects = function (poolName) {
    return Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ]
    );
  };

  sodaJSONObj.getAllSamplesFromSubjects = function () {
    let samplesInPools = [];
    let samplesOutsidePools = [];

    //get all the samples in subjects in pools
    for (const [poolName, poolData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(poolData)) {
        for (sampleName of Object.keys(subjectData)) {
          samplesInPools.push({
            sampleName: sampleName,
            subjectName: subjectName,
            poolName: poolName,
          });
        }
      }
    }

    //get all the samples in subjects not in pools
    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      for (sampleName of Object.keys(subjectData)) {
        samplesOutsidePools.push({
          sampleName: sampleName,
          subjectName: subjectName,
        });
      }
    }
    return [samplesInPools, samplesOutsidePools];
  };

  sodaJSONObj.addSampleToSubject = function (
    sampleName,
    subjectPoolName,
    subjectName
  ) {
    const [samplesInPools, samplesOutsidePools] =
      sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    //Check samples already added and throw an error if a sample with the sample name already exists.
    for (const sample of samples) {
      if (sample.sampleName === sampleName) {
        throw new Error(
          `Sample names must be unique. \n${sampleName} already exists in ${sample.subjectName}`
        );
      }
    }

    if (subjectPoolName) {
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        subjectPoolName
      ][subjectName][sampleName] = {};
    } else {
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subjectName
      ][sampleName] = {};
    }
  };
  sodaJSONObj.renameSample = function (
    sampleToRename,
    newSampleName,
    subjectPoolName,
    subjectName
  ) {
    if (subjectPoolName) {
      const sampleDataToRename =
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          subjectPoolName
        ][subjectName][sampleToRename];

      //try to add the sample to the subject
      //this will throw if the sample name is already taken
      this.addSampleToSubject(newSampleName, subjectPoolName, subjectName);

      //Add previous sample data to the new sample
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        subjectPoolName
      ][subjectName][newSampleName] = sampleDataToRename;

      //remove the old sample
      delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        subjectPoolName
      ][subjectName][sampleToRename];
    } else {
      const sampleDataToRename =
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
          subjectName
        ][sampleToRename];

      //try to add the sample to the subject
      //this will throw if the sample name is already taken
      this.addSampleToSubject(newSampleName, subjectPoolName, subjectName);

      //Add previous sample data to the new sample
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subjectName
      ][newSampleName] = sampleDataToRename;

      //remove the old sample
      delete this["dataset-metadata"]["pool-subject-sample-structure"][
        "subjects"
      ][subjectName][sampleToRename];
    }
  };
  sodaJSONObj.deleteSample = function (
    sampleName,
    subjectPoolName,
    subjectName
  ) {
    if (subjectPoolName) {
      delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        subjectPoolName
      ][subjectName][sampleName];
    } else {
      delete this["dataset-metadata"]["pool-subject-sample-structure"][
        "subjects"
      ][subjectName][sampleName];
    }

    //remove the sample's sample metadata
    samplesTableData = samplesTableData.filter((sample) => {
      return sample[0] !== subjectName || sample[1] !== sampleName;
    });
  };
  sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };

  sodaJSONObj.updatePrimaryDatasetStructure = function () {
    //Add pool keys to primary dataset structure
    for (const pool of Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      if (datasetStructureJSONObj["folders"]["primary"]["folders"][pool]) {
        datasetStructureJSONObj["folders"]["primary"]["folders"][pool] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    //Add sample keys to primary dataset structure
    for (const sample of Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["samples"]
    )) {
      if (datasetStructureJSONObj["folders"]["primary"]["folders"][sample]) {
        datasetStructureJSONObj["folders"]["primary"]["folders"][sample] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  };
};

/********** Folder structure utility **********/
const highLevelFolderPageData = {
  primary: {
    headerText:
      "Virtually structure your primary folder in the interface below.",
    contentsText:
      "Your primary should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "primary/",
    backPageId: "guided-primary-folder-tab",
  },
  source: {
    headerText:
      "Virtually structure your source folder in the interface below.",
    contentsText:
      "Your source folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "source/",
    backPageId: "guided-source-folder-tab",
  },
  derivative: {
    headerText:
      "Virtually structure your derivative folder in the interface below.",
    contentsText:
      "Your derivative folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "derivative/",
    backPageId: "guided-derivative-folder-tab",
  },
  code: {
    headerText:
      "Provide the code data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).<br />`,
    pathSuffix: "code/",
    backPageId: "guided-code-folder-tab",
  },
  protocol: {
    headerText:
      "Provide the protocol data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).`,
    pathSuffix: "protocol/",
    backPageId: "guided-protocol-folder-tab",
  },
  docs: {
    headerText:
      "Provide docs data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).`,
    pathSuffix: "docs/",
    backPageId: "guided-docs-folder-tab",
  },
};
const generateHighLevelFolderSubFolderPageData = (
  sampleOrSubject,
  highLevelFolderName,
  pathSuffix
) => {
  const customPageData = {
    pathSuffix: `${highLevelFolderName}/${pathSuffix}`,
    backPageId: `guided-${sampleOrSubject}-folder-tab`,
  };
  return customPageData;
};

const updateFolderStructureUI = (pageDataObj) => {
  //If the pageDataObj has header and contents, set element text and hide
  //If not, remove the elements from the screen
  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  const structureFolderHeaderElement = document.getElementById(
    "structure-folder-header"
  );
  const structureFolderContentsElement = document.getElementById(
    "structure-folder-contents"
  );

  // fileExplorer.style.webkitAnimation = "none";
  fileExplorer.classList.remove("file-explorer-transition");

  if (pageDataObj.headerText) {
    structureFolderHeaderElement.innerHTML = pageDataObj.headerText;
    structureFolderHeaderElement.classList.remove("hidden");
  } else {
    structureFolderHeaderElement.classList.add("hidden");
  }
  if (pageDataObj.contentsText) {
    structureFolderContentsElement.innerHTML = pageDataObj.contentsText;
    structureFolderContentsElement.classList.remove("hidden");
  } else {
    structureFolderContentsElement.classList.add("hidden");
  }

  // if (fileExplorer.classList.contains("file-explorer-transition")) {
  // }
  // fileExplorer.style.webkitAnimation = "";
  setTimeout(function () {
    fileExplorer.classList.add("file-explorer-transition");
  }, 200);

  $("#guided-input-global-path").val(
    `My_dataset_folder/${pageDataObj.pathSuffix}`
  );
  var filtered = getGlobalPath(organizeDSglobalPath);
  organizeDSglobalPath.value =
    filtered.slice(0, filtered.length).join("/") + "/";

  var myPath = datasetStructureJSONObj;
  for (var item of filtered.slice(1, filtered.length)) {
    myPath = myPath["folders"][item];
  }
  // construct UI with files and folders
  //var appendString = loadFileFolder(myPath);

  /// empty the div

  // reconstruct div with new elements

  //where folder section items will be created
  listItems(myPath, "#items", 500, (reset = true));
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
};
//Description metadata functions
const editAdditionalLink = (clickedEditLinkButton) => {
  const tr = clickedEditLinkButton.parentNode.parentNode;
};

const deleteAdditionalLink = (clickedDeleteLinkButton) => {
  const tr = clickedDeleteLinkButton.parentNode.parentNode;
  const linkNameToDelete = tr.querySelector(".link-name-cell").innerHTML.trim();
  const additionalLinks =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  //filter additional links to remove the one to be deleted
  const filteredAdditionalLinks = additionalLinks.filter((link) => {
    return link.link != linkNameToDelete;
  });
  sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    filteredAdditionalLinks;
  //update the UI
  renderAdditionalLinksTable();
};
const generateadditionalLinkRowElement = (link, linkType, linkRelation) => {
  return `
    <tr>
      <td class="middle aligned collapsing link-name-cell">
        ${link}
      </td>
      <td class="middle aligned collapsing">
        ${linkType}
      </td>
      <td class="middle aligned collapsing">
        ${linkRelation}
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="deleteAdditionalLink(this)"
        >   
          Delete link
        </button>
      </td>
    </tr>
  `;
};

const generateContributorField = (
  contributorLastName,
  contributorFirstName,
  contributorORCID,
  contributorAffiliations,
  contributorRoles
) => {
  const initialContributorAffiliationString = contributorAffiliations
    ? contributorAffiliations.join(",")
    : "";
  const initialContributorRoleString = contributorRoles
    ? contributorRoles.join(",")
    : "";
  return `
      <div
        class="guided--section mt-lg neumorphic guided-contributor-field-container"
        style="width: 100%; position: relative;"
        data-contributor-first-name="${
          contributorFirstName ? contributorFirstName : ""
        }"
        data-contributor-last-name="${
          contributorLastName ? contributorLastName : ""
        }"
      >
        <i 
          class="fas fa-times fa-2x"
          style="
            position: absolute;
            top: 10px;
            right: 15px;
            color: black;
            cursor: pointer;
          "
          onclick="removeContributorField(this)"
        >
        </i>
        <h2 class="guided--text-sub-step">
          Enter 
          <span class="contributor-first-name">${
            contributorFirstName ? contributorFirstName : "contributor's"
          }</span>'s
          contributor details
        </h2>
        <div class="space-between w-100">
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">Last name: </label>
            <input
              class="
                guided--input
                guided-last-name-input
              "
              type="text"
              placeholder="Enter last name here"
              onkeyup="validateInput($(this))"
              value="${contributorLastName ? contributorLastName : ""}"
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">First name: </label>
            <input
              class="
                guided--input
                guided-first-name-input
              "
              type="text"
              placeholder="Enter first name here"
              onkeyup="validateInput($(this))"
              value="${contributorFirstName ? contributorFirstName : ""}"
            />
          </div>
        </div>
        <label class="guided--form-label mt-md required">ORCID: </label>
        <input
          class="
            guided--input
            guided-orcid-input
          "
          type="text"
          placeholder="Enter ORCID here"
          onkeyup="validateInput($(this))"
          value="${contributorORCID ? contributorORCID : ""}"
        />
        <label class="guided--form-label mt-md required">Affiliation(s): </label>
        <input class="guided-contributor-affiliation-input"
          contenteditable="true"
          data-initial-contributor-affiliation="${initialContributorAffiliationString}"
        />
        <label class="guided--form-label mt-md required">Role(s): </label>
        <input class="guided-contributor-role-input"
          contenteditable="true"
          data-initial-contributor-roles="${initialContributorRoleString}"
        />
      </div>
    `;
};

const removeContributorField = (contributorDeleteButton) => {
  const contributorField = contributorDeleteButton.parentElement;
  const contributorFirstName = contributorField.dataset.contributorFirstName;
  const contributorLastName = contributorField.dataset.contributorLastName;

  const contributorsBeforeDelete =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  //If the contributor has data-first-name and data-last-name, then it is a contributor that
  //already been added. Delete it from the contributors array.
  if (contributorFirstName && contributorLastName) {
    const filteredContributors = contributorsBeforeDelete.filter(
      (contributor) => {
        //remove contributors with matching first and last name
        return !(
          contributor.contributorFirstName == contributorFirstName &&
          contributor.contributorLastName == contributorLastName
        );
      }
    );

    sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
      filteredContributors;
  }

  contributorField.remove();
};

const addContributorField = () => {
  const contributorsContainer = document.getElementById(
    "contributors-container"
  );
  //create a new div to hold contributor fields
  const newContributorField = document.createElement("div");
  newContributorField.classList.add("guided--section");
  newContributorField.classList.add("mt-lg");
  newContributorField.classList.add("neumorphic");
  newContributorField.classList.add("guided-contributor-field-container");
  newContributorField.style.width = "100%";
  newContributorField.style.position = "relative";

  newContributorField.innerHTML = `
    <i 
      class="fas fa-times fa-2x"
      style="
        position: absolute;
        top: 10px;
        right: 15px;
        color: black;
        cursor: pointer;
      "
      onclick="removeContributorField(this)"
    >
    </i>
    <h2 class="guided--text-sub-step">
      Enter contributor details
    </h2>
    <div class="space-between w-100">
      <div class="guided--flex-center mt-sm" style="width: 45%">
        <label class="guided--form-label required">Last name: </label>
        <input
          class="guided--input guided-last-name-input"
          type="text"
          placeholder="Enter last name here"
          onkeyup="validateInput($(this))"
        />
      </div>
      <div class="guided--flex-center mt-sm" style="width: 45%">
        <label class="guided--form-label required">First name: </label>
        <input
          class="guided--input guided-first-name-input"
          type="text"
          placeholder="Enter first name here"
          onkeyup="validateInput($(this))"
        />
      </div>
    </div>
    <label class="guided--form-label required mt-md">ORCID: </label>
    <input
      class="guided--input guided-orcid-input"
      type="text"
      placeholder="Enter ORCID here"
      onkeyup="validateInput($(this))"
    />
    <label class="guided--form-label required mt-md">Affiliation(s): </label>
    <input class="guided-contributor-affiliation-input"
          contenteditable="true"
    />
  
    <label class="guided--form-label required mt-md">Role(s): </label>
    <input class="guided-contributor-role-input"
      contenteditable="true"
      placeholder='Type here to view and add contributor roles from the list of standard roles'
    />
  `;

  contributorsContainer.appendChild(newContributorField);

  //select the last contributor role input (the one that was just added)
  const newlyAddedContributorField = contributorsContainer.lastChild;

  //Create Affiliation(s) tagify for each contributor
  const contributorAffiliationInput = newlyAddedContributorField.querySelector(
    ".guided-contributor-affiliation-input"
  );
  const affiliationTagify = new Tagify(contributorAffiliationInput, {
    duplicate: false,
  });

  createDragSort(affiliationTagify);

  const newContributorRoleElement = newlyAddedContributorField.querySelector(
    ".guided-contributor-role-input"
  );
  //Add a new tagify for the contributor role field for the new contributor field
  const tagify = new Tagify(newContributorRoleElement, {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
      position: "auto",
    },
  });
  //scroll to the new element

  createDragSort(tagify);
  smoothScrollToElement(newlyAddedContributorField);
};

const addProtocolField = () => {
  const protocolsContainer = document.getElementById("protocols-container");
  const newProtocolField = generateProtocolField("", "");
  protocolsContainer.insertAdjacentHTML("beforeend", newProtocolField);
  //scroll to the new element
  scrollToBottomOfGuidedBody();
};

const removeProtocolField = (protocolDeleteButton) => {
  const protocolField = protocolDeleteButton.parentElement;
  const protocolURL = protocolField.dataset.protocolUrl;
  const protocolDescription = protocolField.dataset.protocolDescription;

  const protocolsBeforeDelete =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  //If the protocol has data-protocol-url and data-protocol-description, then it is a protocol that
  //already been added. Delete it from the protocols array.
  if (protocolURL && protocolDescription) {
    const filteredProtocols = protocolsBeforeDelete.filter((protocol) => {
      //remove protocols with matching protocol url and protocol description
      return !(
        protocol.link == protocolURL &&
        protocol.description == protocolDescription
      );
    });

    sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] =
      filteredProtocols;
  }

  protocolField.remove();
};

const generateProtocolField = (protocolUrl, protocolDescription) => {
  return `
    <div
      class="guided--section mt-lg neumorphic guided-protocol-field-container"
      data-protocol-url="${protocolUrl}"
      data-protocol-description="${protocolDescription}"
      style="position: relative; width: 100%;"
    >
      <i
        class="fas fa-times fa-2x"
        style="
          position: absolute;
          top: 10px;
          right: 15px;
          color: black;
          cursor: pointer;
        "
        onclick="removeProtocolField(this)"
      >
      </i>
      <h2 class="guided--text-sub-step">Enter protocol details</h2>
      <label class="guided--form-label mt-lg required">Protocol link: </label>

      <input
        class="guided--input guided-protocol-url-input"
        type="text"
        placeholder="Enter protocol link here"
        value="${protocolUrl}"
        onkeyup="validateInput($(this))"
      />
      <p class="guided--text-input-instructions mb-0">
        Enter the DOI of the protocol if it is already published. Else, enter its protocols.io URL.<br>
      </p>
      <label class="guided--form-label mt-lg required">Protocol description:</label>
      <textarea
        class="guided--input guided--text-area guided-protocol-description-input"
        type="text"
        placeholder="Enter protocol description here"
        style="height: 7.5em; padding-bottom: 20px"
        onkeyup="validateInput($(this))"
      >${protocolDescription ? protocolDescription.trim() : ""}</textarea
      >
      <p class="guided--text-input-instructions mb-0">
        Enter a description of the protocol used to generate your dataset.
      </p>
    </div>
  `;
};

const renderProtocolFields = (protocolsArray) => {
  const protocolsContainer = document.getElementById("protocols-container");
  let protocolElements = protocolsArray
    .map((protocol) => {
      return generateProtocolField(protocol["link"], protocol["description"]);
    })
    .join("\n");
  protocolsContainer.innerHTML = protocolElements;
};

const renderContributorFields = (contributionMembersArray) => {
  //loop through curationMembers object
  let contributionMembersElements = contributionMembersArray
    .map((contributionMember) => {
      return generateContributorField(
        contributionMember["contributorLastName"],
        contributionMember["contributorFirstName"],
        contributionMember["conID"],
        contributionMember["conAffliation"],
        contributionMember["conRole"]
      );
    })
    .join("\n");

  const contributorsContainer = document.getElementById(
    "contributors-container"
  );
  contributorsContainer.innerHTML = contributionMembersElements;

  //Create Affiliation(s) tagify for each contributor
  const contributorAffiliationInputs = contributorsContainer.querySelectorAll(
    ".guided-contributor-affiliation-input"
  );
  contributorAffiliationInputs.forEach((contributorAffiliationInput) => {
    const tagify = new Tagify(contributorAffiliationInput, {
      duplicate: false,
    });
    createDragSort(tagify);
    if (contributorAffiliationInput.dataset.initialContributorAffiliation) {
      const initialAffiliations =
        contributorAffiliationInput.dataset.initialContributorAffiliation;
      const initialAffiliationsArray = initialAffiliations.split(",");
      for (const initialAffiliation of initialAffiliationsArray) {
        tagify.addTags([initialAffiliation]);
      }
    }
  });

  //create Role(s) tagify for each contributor
  const contributorRoleInputs = contributorsContainer.querySelectorAll(
    ".guided-contributor-role-input"
  );
  contributorRoleInputs.forEach((contributorRoleElement) => {
    const tagify = new Tagify(contributorRoleElement, {
      whitelist: [
        "PrincipleInvestigator",
        "Creator",
        "CoInvestigator",
        "DataCollector",
        "DataCurator",
        "DataManager",
        "Distributor",
        "Editor",
        "Producer",
        "ProjectLeader",
        "ProjectManager",
        "ProjectMember",
        "RelatedPerson",
        "Researcher",
        "ResearchGroup",
        "Sponsor",
        "Supervisor",
        "WorkPackageLeader",
        "Other",
      ],
      enforceWhitelist: true,
      dropdown: {
        enabled: 0,
        closeOnSelect: true,
        position: "auto",
      },
    });
    createDragSort(tagify);
    //if contributorRoleElement has data-initial-contributors, the create a tagify for each comma split contributor role
    if (contributorRoleElement.dataset.initialContributorRoles) {
      const initialContributors =
        contributorRoleElement.dataset.initialContributorRoles;
      const initialContributorsArray = initialContributors.split(",");
      for (const contirubtorRole of initialContributorsArray) {
        tagify.addTags([contirubtorRole]);
      }
    }
  });

  //show the contributor fields
  unHideAndSmoothScrollToElement("guided-div-contributor-field-set");
};
const renderAdditionalLinksTable = () => {
  const additionalLinksTableBody = document.getElementById(
    "additional-links-table-body"
  );
  const additionalLinkData =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  if (additionalLinkData.length != 0) {
    const additionalLinkElements = additionalLinkData
      .map((link) => {
        return generateadditionalLinkRowElement(
          link.link,
          link.type,
          link.relation
        );
      })
      .join("\n");
    additionalLinksTableBody.innerHTML = additionalLinkElements;
  } else {
    const emptyRowWarning = generateAlertElement(
      "warning",
      `You currently have no additional links. To add a link, click the "Add additional link" button below.`
    );
    warningRowElement = `<tr><td colspan="5">${emptyRowWarning}</td></tr>`;
    //add empty rowWarning to additionalLinksTableBody
    additionalLinksTableBody.innerHTML = warningRowElement;
  }
};
const openAddAdditionLinkSwal = async () => {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html: `
      <label>
        URL or DOI:
      </label>
      <input
        id="guided-other-link"
        class="swal2-input"
        placeholder="Enter a URL"
      />
      <label>
        Relation to the dataset:
      </label>
      <select id="guided-other-link-relation" class="swal2-input">
        <option value="Select">Select a relation</option>
        <option value="IsCitedBy">IsCitedBy</option>
        <option value="Cites">Cites</option>
        <option value="IsSupplementTo">IsSupplementTo</option>
        <option value="IsSupplementedBy">IsSupplementedBy</option>
        <option value="IsContinuedByContinues">IsContinuedByContinues</option>
        <option value="IsDescribedBy">IsDescribedBy</option>
        <option value="Describes">Describes</option>
        <option value="HasMetadata">HasMetadata</option>
        <option value="IsMetadataFor">IsMetadataFor</option>
        <option value="HasVersion">HasVersion</option>
        <option value="IsVersionOf">IsVersionOf</option>
        <option value="IsNewVersionOf">IsNewVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="HasPart">HasPart</option>
        <option value="IsPublishedIn">IsPublishedIn</option>
        <option value="IsReferencedBy">IsReferencedBy</option>
        <option value="References">References</option>
        <option value="IsDocumentedBy">IsDocumentedBy</option>
        <option value="Documents">Documents</option>
        <option value="IsCompiledBy">IsCompiledBy</option>
        <option value="Compiles">Compiles</option>
        <option value="IsVariantFormOf">IsVariantFormOf</option>
        <option value="IsOriginalFormOf">IsOriginalFormOf</option>
        <option value="IsIdenticalTo">IsIdenticalTo</option>
        <option value="IsReviewedBy">IsReviewedBy</option>
        <option value="Reviews">Reviews</option>
        <option value="IsDerivedFrom">IsDerivedFrom</option>
        <option value="IsSourceOf">IsSourceOf</option>
        <option value="IsRequiredBy">IsRequiredBy</option>
        <option value="Requires">Requires</option>
        <option value="IsObsoletedBy">IsObsoletedBy</option>
        <option value="Obsoletes">Obsoletes</option>
      </select>
      <label>
        Link description:
      </label>
      <textarea
        id="guided-other-description"
        class="swal2-textarea"
        placeholder="Enter a description"
      ></textarea>
    `,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#guided-other-link").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link.`);
      }
      if ($("#guided-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please select a link relation.`);
      }
      if ($("#guided-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      var duplicate = checkLinkDuplicate(
        link,
        document.getElementById("other-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate URL/DOI. The URL/DOI you entered is already added."
        );
      }
      return [
        $("#guided-other-link").val(),
        $("#guided-other-link-relation").val(),
        $("#guided-other-description").val(),
      ];
    },
  });
  if (values) {
    const link = values[0];
    const relation = values[1];
    let linkType;
    //check if link starts with "https://"
    if (link.startsWith("https://doi.org/")) {
      linkType = "DOI";
    } else {
      linkType = "URL";
    }
    const description = values[2];
    //add link to jsonObj
    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "additional-links"
    ].push({
      link: link,
      relation: relation,
      description: description,
      type: linkType,
    });
    renderAdditionalLinksTable();
  }
};
/*const addOtherLinkField = () => {
  const otherLinksContainer = document.getElementById("other-links-container");
  //create a new div to hold other link fields
  const newOtherLink = document.createElement("div");
  newOtherLink.classList.add("guided--section");
  newOtherLink.classList.add("mt-lg");
  newOtherLink.classList.add("neumorphic");
  newOtherLink.classList.add("guided-other-links-field-container");
  newOtherLink.style.position = "relative";

  newOtherLink.innerHTML = `
    <i
      class="fas fa-times fa-2x"
      style="
        position: absolute;
        top: 10px;
        right: 15px;
        color: black;
        cursor: pointer;
      "
      onclick="removeOtherLinkField(this)"
    >
    </i>
    <h2 class="guided--text-sub-step">Enter link information</h2>
    <label class="guided--form-label mt-lg">Link URL: </label>
    <input
      class="guided--input guided-other-link-url-input"
      type="text"
      placeholder="Enter link URL here"
      onkeyup="validateInput($(this))"
    />
    <label class="guided--form-label mt-lg"
      >Link description:</label
    >
    <textarea
      class="guided--input guided--text-area guided-other-link-description-input"
      type="text"
      placeholder="Enter link description here"
      style="height: 7.5em; padding-bottom: 20px"
      onkeyup="validateInput($(this))"
    ></textarea>
    <label class="guided--form-label mt-lg"
      >Dataset relation:</label
    >
    <div style="display: flex; width:100%; align-items: center;">
      <p class="guided--help-text m-0">
        Text to put here (A)?
      </p>
      <div class="form-group mx-2">
        <select class="form-control guided-other-link-relation-dropdown" style="background-color: white !important">
          <option value="Select">Select a relation</option>
          <option value="IsCitedBy">IsCitedBy</option>
          <option value="Cites">Cites</option>
          <option value="IsSupplementTo">IsSupplementTo</option>
          <option value="IsSupplementedBy">IsSupplementedBy</option>
          <option value="IsContinuedByContinues">IsContinuedByContinues</option>
          <option value="IsDescribedBy">IsDescribedBy</option>
          <option value="Describes">Describes</option>
          <option value="HasMetadata">HasMetadata</option>
          <option value="IsMetadataFor">IsMetadataFor</option>
          <option value="HasVersion">HasVersion</option>
          <option value="IsVersionOf">IsVersionOf</option>
          <option value="IsNewVersionOf">IsNewVersionOf</option>
          <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
          <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
          <option value="HasPart">HasPart</option>
          <option value="IsPublishedIn">IsPublishedIn</option>
          <option value="IsReferencedBy">IsReferencedBy</option>
          <option value="References">References</option>
          <option value="IsDocumentedBy">IsDocumentedBy</option>
          <option value="Documents">Documents</option>
          <option value="IsCompiledBy">IsCompiledBy</option>
          <option value="Compiles">Compiles</option>
          <option value="IsVariantFormOf">IsVariantFormOf</option>
          <option value="IsOriginalFormOf">IsOriginalFormOf</option>
          <option value="IsIdenticalTo">IsIdenticalTo</option>
          <option value="IsReviewedBy">IsReviewedBy</option>
          <option value="Reviews">Reviews</option>
          <option value="IsDerivedFrom">IsDerivedFrom</option>
          <option value="IsSourceOf">IsSourceOf</option>
          <option value="IsRequiredBy">IsRequiredBy</option>
          <option value="Requires">Requires</option>
          <option value="IsObsoletedBy">IsObsoletedBy</option>
          <option value="Obsoletes">Obsoletes</option>
        </select>
      </div>
          <p class="guided--help-text m-0">
        Text to put here (B)?
      </p>
    </div>
  `;
  otherLinksContainer.appendChild(newOtherLink);
  //select the last protocol field (the one that was just added)
  const newlyAddedOtherLinkField = otherLinksContainer.lastChild;
  smoothScrollToElement(newlyAddedOtherLinkField);
};

const removeOtherLinkField = (otherLinkDeleteButton) => {
  const otherLinkField = protocolDeleteButton.parentElement;
  otherLinkField.remove();
};*/

//SUBJECT TABLE FUNCTIONS
const returnToTableFromFolderStructure = (clickedBackButton) => {
  previousFolderStructurePage = clickedBackButton.attr("data-prev-page");
  traverseToTab(previousFolderStructurePage);
  $("#guided-footer-div").css("display", "flex");
  clickedBackButton.remove();
};

const returnToSubjectMetadataTableFromSubjectMetadataForm = () => {
  //Clear metadata form inputs
  clearAllSubjectFormFields(guidedSubjectsFormDiv);
};
const returnToSampleMetadataTableFromSampleMetadataForm = () => {
  //Clear metadata form inputs
  clearAllSubjectFormFields(guidedSamplesFormDiv);
  traverseToTab("guided-create-samples-metadata-tab");
  $("#guided-footer-div").css("display", "flex");
};

const renderSubjectSampleAdditionTable = (subject) => {
  return `
    <table
      class="ui celled striped table"
      style="margin-bottom: 10px; width: 800px"
      data-samples-subject-name="${subject.subjectName}"
      data-samples-subjects-pool-name="${
        subject.poolName ? subject.poolName : ""
      }"
    >
      <thead>
        <tr>
          <th class="text-center" colspan="2" style="position: relative">
            <div class="space-between w-100 hidden">
              <span class="samples-subjects-pool">${
                subject.poolName ? subject.poolName : ""
              }</span>
              <span class="samples-subject-name">${subject.subjectName}</span>
            </div>
          
            Enter a unique sample ID for each sample taken from subject ${
              subject.subjectName
            }
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="position: absolute; top: 10px; right: 20px;"
              onclick="addSampleSpecificationTableRow(this)"
            >
              Add sample
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${subject.samples
          .map((sample) => {
            return generateSampleRowElement(sample);
          })
          .join("\n")}
      </tbody>
    </table>
  `;
};

const guidedLoadSubjectMetadataIfExists = (subjectMetadataId) => {
  //loop through all subjectsTableData elements besides the first one
  for (let i = 0; i < subjectsTableData.length; i++) {
    //check through elements of tableData to find a subject ID match
    if (subjectsTableData[i][0] === subjectMetadataId) {
      //if the id matches, load the metadata into the form
      populateForms(subjectMetadataId, "", "guided");
      return;
    }
  }
};

const guidedLoadSampleMetadataIfExists = (
  sampleMetadataId,
  subjectMetadataId
) => {
  //loop through all samplesTableData elemenents besides the first one
  for (let i = 1; i < samplesTableData.length; i++) {
    if (
      samplesTableData[i][0] === subjectMetadataId &&
      samplesTableData[i][1] === sampleMetadataId
    ) {
      //if the id matches, load the metadata into the form
      populateFormsSamples(subjectMetadataId, sampleMetadataId, "", "guided");
      return;
    }
  }
};
const openModifySubjectMetadataPage = (subjectMetadataID) => {
  guidedLoadSubjectMetadataIfExists(subjectMetadataID);
};
const openModifySampleMetadataPage = (
  sampleMetadataID,
  sampleMetadataSubjectID,
  sampleMetadataPoolID
) => {
  //Get all samples from the dataset and add all other samples to the was derived from dropdown
  const [samplesInPools, samplesOutsidePools] =
    sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const samplesBesidesCurrSample = samples.filter(
    (sample) => sample.sampleName !== sampleMetadataID
  );
  document.getElementById("guided-bootbox-wasDerivedFromSample").innerHTML = `
 <option value="">Sample not derived from another sample</option>
 ${samplesBesidesCurrSample
   .map((sample) => {
     return `<option value="${sample.sampleName}">${sample.sampleName}</option>`;
   })
   .join("\n")}))
 `;

  //Add protocol titles to the protocol dropdown
  const protocols =
    sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  document.getElementById("guided-bootbox-sample-protocol-title").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.description}"
            data-protocol-link="${protocol.link}"
          >
            ${protocol.description}
          </option>
        `;
      })
      .join("\n")}))
  `;
  document.getElementById(
    "guided-bootbox-sample-protocol-location"
  ).innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.link}"
            data-protocol-description="${protocol.description}"
          >
            ${protocol.link}
          </option>
        `;
      })
      .join("\n")}))
  `;

  guidedLoadSampleMetadataIfExists(sampleMetadataID, sampleMetadataSubjectID);

  document.getElementById("guided-bootbox-sample-id").value = sampleMetadataID;
  document.getElementById("guided-bootbox-subject-id-samples").value =
    sampleMetadataSubjectID;
  document.getElementById("guided-bootbox-sample-pool-id").value =
    sampleMetadataPoolID;
};

const openCopySubjectMetadataPopup = async () => {
  //save current subject metadata entered in the form
  addSubject("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < subjectsTableData.length; i++) {
    const subjectID = subjectsTableData[i][0];
    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between" style="max-height: 500px; overflow-y: auto;">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subject would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subjects would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;
  swal
    .fire({
      width: 950,
      html: copyMetadataElement,
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      confirmButtonColor: "Copy",
      focusCancel: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        const selectedCopyFromSubject = $(
          "input[name='copy-from']:checked"
        ).val();
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSubjects = [];
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSubjects.push($(this).val());
        });
        let copyFromSubjectData = [];
        for (var i = 1; i < subjectsTableData.length; i++) {
          if (subjectsTableData[i][0] === selectedCopyFromSubject) {
            //copy all elements from matching array except the first two
            copyFromSubjectData = subjectsTableData[i].slice(2);
          }
        }
        for (subject of selectedCopyToSubjects) {
          //loop through all subjectsTableData elements besides the first one
          for (let i = 1; i < subjectsTableData.length; i++) {
            //check through elements of tableData to find a subject ID match
            if (subjectsTableData[i][0] === subject) {
              subjectsTableData[i] = [
                subjectsTableData[i][0],
                subjectsTableData[i][1],
                ...copyFromSubjectData,
              ];
            }
          }
        }
        const currentSubjectOpenInView = document.getElementById(
          "guided-bootbox-subject-id"
        ).value;
        if (currentSubjectOpenInView) {
          //If a subject was open in the UI, update it with the new metadata
          openModifySubjectMetadataPage(currentSubjectOpenInView);
        }

        saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
      }
    });
};

const openCopySampleMetadataPopup = async () => {
  addSample("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < samplesTableData.length; i++) {
    const sampleID = samplesTableData[i][1];

    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${sampleID}">
          <label>${sampleID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
        <input type="checkbox" name="copy-to" value="${sampleID}">
        <label>${sampleID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which sample would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which samples would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;

  swal
    .fire({
      width: 950,
      html: copyMetadataElement,
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      confirmButtonText: "Copy",
      focusCancel: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        const selectedCopyFromSample = $(
          "input[name='copy-from']:checked"
        ).val();
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSamples = []; //["sam2","sam3"]
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSamples.push($(this).val());
        });

        let copyFromSampleData = [];
        //Create a variable for the third entry ("was derived from") to make it easier to copy into the
        //middle of the array
        let wasDerivedFrom = "";

        //Add the data from the selected copy fro sample to cpoyFromSampleData array
        for (var i = 1; i < samplesTableData.length; i++) {
          if (samplesTableData[i][1] === selectedCopyFromSample) {
            //copy all elements from matching array except the first one
            wasDerivedFrom = samplesTableData[i][2];
            copyFromSampleData = samplesTableData[i].slice(4);
          }
        }
        for (sample of selectedCopyToSamples) {
          samplesTableData.forEach((sampleData, index) => {
            if (sampleData[1] === sample) {
              sampleData = [
                sampleData[0],
                sampleData[1],
                wasDerivedFrom,
                sampleData[3],
              ];
              sampleData = sampleData.concat(copyFromSampleData);
              samplesTableData[index] = sampleData;
            }
          });
        }
        const currentSampleOpenInView = document.getElementById(
          "guided-bootbox-sample-id"
        ).value;
        const currentSampleSubjectOpenInView = document.getElementById(
          "guided-bootbox-subject-id-samples"
        ).value;
        const currentSamplePoolOpenInView = document.getElementById(
          "guided-bootbox-sample-pool-id"
        ).value;

        //If a sample was open in the UI, update it with the new metadata
        if (currentSampleOpenInView) {
          openModifySampleMetadataPage(
            currentSampleOpenInView,
            currentSampleSubjectOpenInView,
            currentSamplePoolOpenInView
          );
        }
        saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
      }
    });
};

const specifySubject = (event, subjectNameInput) => {
  if (event.which == 13) {
    try {
      const subjectName = `sub-${subjectNameInput.val().trim()}`;
      const subjectNameElement = `
        <div class="space-between w-100">
          <span class="subject-id">${subjectName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer;"
            onclick="openSubjectRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const subjectIdCellToAddNameTo = subjectNameInput.parent();

      if (subjectName.length > 0) {
        if (!subSamInputIsValid(subjectName)) {
          generateAlertMessage(subjectNameInput);
          return;
        }
        //remove the add subject help text
        document
          .getElementById("guided-add-subject-instructions")
          .classList.add("hidden");
        removeAlertMessageIfExists(subjectNameInput);
        if (subjectNameInput.attr("data-prev-name")) {
          const subjectToRename = subjectNameInput.attr("data-prev-name");
          sodaJSONObj.renameSubject(subjectToRename, subjectName);
        } else {
          //case where subject name is valid and not being renamed:
          sodaJSONObj.addSubject(subjectName);
        }
        subjectIdCellToAddNameTo.html(subjectNameElement);
        addSubjectSpecificationTableRow();
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const specifySample = (event, sampleNameInput) => {
  if (event.which == 13) {
    try {
      const sampleName = `sam-${sampleNameInput.val().trim()}`;
      const sampleRenameElement = `
      <div class="space-between w-100">
        <span class="sample-id">${sampleName}</span>
        <i
          class="far fa-edit jump-back"
          style="cursor: pointer;"
          onclick="openSampleRenameInput($(this))"
        >
        </i>
      </div>
    `;
      const sampleIdCellToAddNameTo = sampleNameInput.parent();

      //get the pool of the subject that the sample is being added to
      const subjectSampleAdditionTable = sampleNameInput.closest("table");
      const subjectsPoolToAddSampleTo = subjectSampleAdditionTable
        .find(".samples-subjects-pool")
        .text();
      const subjectToAddSampleTo = subjectSampleAdditionTable
        .find(".samples-subject-name")
        .text();

      if (sampleName.length > 0) {
        if (!subSamInputIsValid(sampleName)) {
          //show alert message below pool name input if input is invalid and abort function
          generateAlertMessage(sampleNameInput);
          return;
        }
        removeAlertMessageIfExists(sampleNameInput);
        if (sampleNameInput.attr("data-prev-name")) {
          const sampleToRename = sampleNameInput.attr("data-prev-name");
          sodaJSONObj.renameSample(
            sampleToRename,
            sampleName,
            subjectsPoolToAddSampleTo,
            subjectToAddSampleTo
          );
        } else {
          //Add the new sample to sodaJSONObj
          sodaJSONObj.addSampleToSubject(
            sampleName,
            subjectsPoolToAddSampleTo,
            subjectToAddSampleTo
          );
        }
        sampleIdCellToAddNameTo.html(sampleRenameElement);
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const specifyPool = (event, poolNameInput) => {
  if (event.which == 13) {
    try {
      const poolName = `pool-${poolNameInput.val().trim()}`;
      const poolNameElement = `
        <div class="space-between" style="width: 250px;">
          <span class="pool-id">${poolName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer;"
            onclick="openPoolRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const poolSubjectSelectElement = `
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      `;
      const poolSubjectsDropdownCell = poolNameInput.parent().parent().next();
      const poolIdCellToAddNameTo = poolNameInput.parent();
      let poolsTable = $("#pools-table");
      if (poolName !== "pool-") {
        if (!subSamInputIsValid(poolName)) {
          notyf.open({
            duration: "3000",
            type: "error",
            message: "Pool IDs may not contain spaces or special characters",
          });
          return;
        }
        removeAlertMessageIfExists(poolsTable);
        if (poolNameInput.attr("data-prev-name")) {
          const poolFolderToRename = poolNameInput.attr("data-prev-name");

          sodaJSONObj.renamePool(poolFolderToRename, poolName);

          //refresh the UI to update the dropdowns to avoid having to update select2 dropdowns
          setActiveSubPage("guided-organize-subjects-into-pools-page");
          return;
        } else {
          //Add left border back to subject dropdown cell to separate pool name and subject dropdown
          poolSubjectsDropdownCell.removeClass("remove-left-border");

          //Add the new pool to sodaJSONObj
          sodaJSONObj.addPool(poolName);

          //Add the select2 base element
          poolSubjectsDropdownCell.html(poolSubjectSelectElement);

          //Get the newly created select2 element
          const newPoolSubjectsSelectElement = document.querySelector(
            `select[name="${poolName}-subjects-selection-dropdown"]`
          );

          //create a select2 dropdown for the pool subjects
          $(newPoolSubjectsSelectElement).select2({
            placeholder: "Select subjects",
            tags: true,
            width: "100%",
            closeOnSelect: false,
          });
          $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
            updatePoolDropdown($(e.currentTarget), poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
            const subjectToRemove = e.params.data.id;
            sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
            const selectedSubject = e.params.data.id;
            sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
          });
        }
        poolIdCellToAddNameTo.html(poolNameElement);
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const updatePoolDropdown = (poolDropDown, poolName) => {
  poolDropDown.empty().trigger("change");
  //add subjects in pool to dropdown and set as selected
  const poolsSubjects = sodaJSONObj.getPoolSubjects(poolName);
  for (const subject of poolsSubjects) {
    var newOption = new Option(subject, subject, true, true);
    poolDropDown.append(newOption).trigger("change");
  }

  //add subject options not in pool to dropdown and set as unselected
  const subjectsNotInPools = sodaJSONObj.getSubjectsOutsidePools();
  for (const subject of subjectsNotInPools) {
    var newOption = new Option(subject, subject, false, false);
    poolDropDown.append(newOption).trigger("change");
  }
};

//On edit button click, creates a new subject ID rename input box
const openSubjectRenameInput = (subjectNameEditButton) => {
  const subjectIdCellToRename = subjectNameEditButton.closest("td");
  const prevSubjectName = subjectIdCellToRename.find(".subject-id").text();
  const subjectRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sub-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-subject-id"
        placeholder="Enter a new subject ID and press enter"
        onkeyup="specifySubject(event, $(this))"
        data-input-set="guided-subjects-folder-tab"
        data-alert-message="Subject IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSubjectName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  subjectIdCellToRename.html(subjectRenameElement);
};
const openPoolRenameInput = (poolNameEditButton) => {
  const poolIdCellToRename = poolNameEditButton.closest("td");
  const prevPoolName = poolIdCellToRename.find(".pool-id").text();
  const poolRenameElement = `
    <div class="space-between" style="align-items: center; width: 250px;">
      <span style="margin-right: 5px;">pool-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-pool-id"
        placeholder="Enter new pool ID"
        onkeyup="specifyPool(event, $(this))"
        data-input-set="guided-pools-folder-tab"
        data-alert-message="Pool IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevPoolName}"
        style="width: 180px;"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  poolIdCellToRename.html(poolRenameElement);
};

//updates the indices for guided tables using class given to spans in index cells
const updateGuidedTableIndices = (tableIndexClass) => {
  const indiciesToUpdate = $(`.${tableIndexClass}`);
  indiciesToUpdate.each((index, indexElement) => {
    let newIndex = index + 1;
    indexElement.innerHTML = newIndex;
  });
};

const generateSubjectRowElement = (subjectName) => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <div class="space-between w-100">
            <span class="subject-id">${subjectName}</span>
            <i
              class="far fa-edit jump-back"
              style="cursor: pointer"
              onclick="openSubjectRenameInput($(this))"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSubject($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSubjectSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sub-</span>
          <input
            id="guided--subject-input"
            class="guided--input"
            type="text"
            name="guided-subject-id"
            placeholder="Enter subject ID and press enter"
            onkeyup="specifySubject(event, $(this))"
            data-input-set="guided-subjects-folder-tab"
            data-alert-message="Subject IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
        </div>
      </td>


      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSubject($(this))"
        ></i>
      </td>
      </tr>
  `;
};

const generatePoolRowElement = (poolName) => {
  return `
    <tr>
      <td class="middle aligned pool-cell collapsing">
        <div class="space-between" style="align-items: center; width: 250px">
          <div class="space-between" style="width: 250px">
            <span class="pool-id">${poolName}</span>
            <i
              class="far fa-edit jump-back"
              style="cursor: pointer"
              onclick="openPoolRenameInput($(this))"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned pool-subjects">
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deletePool($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSampleRowElement = (sampleName) => {
  return `
    <tr>
    <td class="middle aligned sample-id-cell">
      <div class="space-between w-100" style="align-items: center">
    <div class="space-between w-100">
      <span class="sample-id">${sampleName}</span>
      <i class="far fa-edit jump-back" style="cursor: pointer;" onclick="openSampleRenameInput($(this))">
      </i>
    </div>
  </div>
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i class="far fa-trash-alt" style="color: red; cursor: pointer" onclick="deleteSample($(this))"></i>
    </td>
  </tr>`;
};
const generateSampleSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned sample-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sam-</span>
          <input
            id="guided--sample-input"
            class="guided--input"
            type="text"
            name="guided-sample-id"
            placeholder="Enter sample ID and press enter"
            onkeyup="specifySample(event, $(this))"
            data-input-set="guided-samples-folder-tab"
            data-alert-message="Sample IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSample($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const confirmEnter = (button) => {
  let input_id = button.previousElementSibling.id;
  let sampleTable = false;
  let addSampleButton = "";
  let sampleTableContainers = "";
  if (input_id === "guided--sample-input") {
    //confirming the sample input, manually create another one
    addSampleButton =
      button.parentElement.parentElement.parentElement.parentElement
        .previousElementSibling.children[0].children[0].children[1];
    sampleTableContainers = document.getElementById(
      "guided-div-add-samples-tables"
    ).children;
    sampleTable = true;
    // addSampleSpecificationTableRow();
  }
  const ke = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  });

  let input_field = button.previousElementSibling;
  if (input_field.tagName === "INPUT") {
    input_field.dispatchEvent(ke);
  } else {
    //alert message is the previousElement
    input_field.parentNode.children[1].dispatchEvent(ke);
  }
  if (sampleTable) {
    //for adding a new sample row
    let clickSampleButton = true;
    for (let i = 0; i < sampleTableContainers.length; i++) {
      sampleEntries = sampleTableContainers[i].children[1];
      if (sampleEntries.children.length > 0) {
        //entries have been create so look at the last one if an input is there
        let lastEntryCount = sampleEntries.children.length - 1;
        let lastEntry = sampleEntries.children[lastEntryCount];
        let lastEntryTagType = lastEntry.children[0].children[0].children[1];
        if (lastEntryTagType === "INPUT") {
          //an input is already made (duplicates will have duplicate ids)
          clickSampleButton = false;
          break;
        }
      }
      if (clickSampleButton) {
        addSampleButton.click();
      }
    }
  }
};

const keydownListener = (event) => {
  if (event.key === "Enter") {
    enterKey = true;
  }
};

const onBlurEvent = (element) => {
  if (event.path[0].value != "") {
    if (enterKey === false) {
      confirmEnter(event.path[1].children[2]);
    }
  }
};

const endConfirmOnBlur = (element) => {
  window.removeEventListener("keydown", keydownListener);
  document.getElementById(element).removeEventListener("blur", onBlurEvent);
};

var enterKey = false;
const confirmOnBlur = (element) => {
  window.addEventListener("keydown", keydownListener);
  document.getElementById(element).addEventListener("blur", onBlurEvent);
};

const addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById(
    "subject-specification-table-body"
  );
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput =
    subjectSpecificationTableBody.querySelector(
      "input[name='guided-subject-id']"
    );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    // endConfirmOnBlur("guided--subject-input");
    //create a new table row on
    subjectSpecificationTableBody.innerHTML +=
      generateSubjectSpecificationRowElement();

    const newSubjectRow =
      subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector(
      "input[name='guided-subject-id']"
    );
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER TO ON FOCUS
    confirmOnBlur("guided--subject-input");

    document
      .getElementById("guided-add-subject-instructions")
      .classList.remove("hidden");
  }
};
const addSampleSpecificationTableRow = (clickedSubjectAddSampleButton) => {
  const addSampleTable = clickedSubjectAddSampleButton.closest("table");
  const addSampleTableBody = addSampleTable.querySelector("tbody");

  //check if subject specification table body has an input with the name guided-subject-id
  const sampleSpecificationTableInput = addSampleTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  //check for any

  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    //No need to create a new row
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row Input element
    addSampleTableBody.innerHTML += generateSampleSpecificationRowElement();
    const newSamplerow = addSampleTableBody.querySelector("tr:last-child");
    //Focus the new sample row element
    const newSampleInput = newSamplerow.querySelector(
      "input[name='guided-sample-id']"
    );
    window.addEventListener("keydown", keydownListener);
    newSampleInput.addEventListener("blur", onBlurEvent);
    newSampleInput.focus();
  }
};

const generateNewSampleRowTd = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">sam-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-sample-id"
          placeholder="Enter sample ID"
          onkeyup="specifySample(event, $(this))"
          data-alert-message="Sample IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 250px"
        />
      </div>
    </td>
    <td
      class="middle aligned samples-subject-dropdown-cell remove-left-border"
    ></td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="deleteSample($(this))"
      ></i>
    </td>
  `;
};
const addSampleTableRow = () => {
  const sampleSpecificationTableBody = document.getElementById(
    "samples-specification-table-body"
  );
  //check if sample specification table body has an input with the name guided-sample-id
  const sampleSpecificationTableInput =
    sampleSpecificationTableBody.querySelector(
      "input[name='guided-sample-id']"
    );
  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row on
    const newSamplesTableRow = sampleSpecificationTableBody.insertRow(-1);
    newSamplesTableRow.innerHTML = generateNewSampleRowTd();
    const newSampleRow =
      sampleSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSampleRow
    const newSampleInput = newSampleRow.querySelector(
      "input[name='guided-sample-id']"
    );
    smoothScrollToElement(newSampleRow);
    newSampleInput.focus();
  }
};

const generatePoolSpecificationRowElement = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">pool-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-pool-id"
          placeholder="Enter pool ID"
          onkeyup="specifyPool(event, $(this))"
          data-input-set="guided-subjects-folder-tab"
          data-alert-message="Pool IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 100%;"
        />
        <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
      </div>
    </td>
    <td class="middle aligned pool-subjects remove-left-border">
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="deletePool($(this))"
      ></i>
    </td>
  `;
};
const addPoolTableRow = () => {
  const poolsTableBody = document.getElementById(
    "pools-specification-table-body"
  );
  const poolSpecificationTableInput = poolsTableBody.querySelector(
    "input[name='guided-pool-id']"
  );

  const re = new RegExp("/^(d|w)+$/g");

  if (poolSpecificationTableInput) {
    //focus on the input that already exists
    //check if pool has input
    if (poolSpecificationTableInput.val != "") {
      confirmEnter(poolSpecificationTableInput);
      // addPoolTableRow();
      // let newPoolTableRow = poolsTableBody.insertRow(-1);
      // newPoolTableRow.innerHTML = generatePoolSpecificationRowElement();
    } else {
      poolSpecificationTableInput.focus();
    }
  } else {
    //insert a new table row container with js as select2 breaks when adding a new row
    //via template literals
    const newPoolTableRow = poolsTableBody.insertRow(-1);
    newPoolTableRow.innerHTML = generatePoolSpecificationRowElement();
  }
};

//Deletes the entered subject folder from dsJSONObj and updates UI
const deleteSubjectFolder = (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();
  //delete the table row element in the UI
  subjectIdCellToDelete.remove();
  //Update subject table row indices
  updateGuidedTableIndices("subject-table-index");
  //delete the subject folder from sodaJSONobj
  delete sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
    subjectIdToDelete
  ];
  //delete the subject folder from the dataset structure obj
  delete datasetStructureJSONObj["folders"]["primary"]["folders"][
    subjectIdToDelete
  ];
};
//deletes subject from jsonObj and UI
const deleteSubject = (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();

  //Check to see if a subject has been added to the element
  //if it has, delete the subject from the pool-sub-sam structure
  if (subjectIdToDelete) {
    sodaJSONObj.deleteSubject(subjectIdToDelete);
  }

  //delete the table row element in the UI
  subjectIdCellToDelete.remove();
  //remove the add subject help text
  document
    .getElementById("guided-add-subject-instructions")
    .classList.add("hidden");
};
const deletePool = (poolDeleteButton) => {
  const poolIdCellToDelete = poolDeleteButton.closest("tr");
  const poolIdToDelete = poolIdCellToDelete.find(".pool-id").text();
  //delete the table row element in the UI
  poolIdCellToDelete.remove();
  sodaJSONObj.deletePool(poolIdToDelete);
  removeAlertMessageIfExists($("#pools-table"));
};

const deleteSample = (sampleDeleteButton) => {
  const sampleIdCellToDelete = sampleDeleteButton.closest("tr");
  const sampleIdToDelete = sampleIdCellToDelete.find(".sample-id").text();

  //Check to see if a sample has been added to the element
  //if it has, delete the sample from the pool-sub-sam structure
  if (sampleIdToDelete) {
    const subjectSampleAdditionTable = sampleDeleteButton.closest("table");
    const samplesSubject = subjectSampleAdditionTable
      .find(".samples-subject-name")
      .text();
    const samplesSubjectsPool = subjectSampleAdditionTable
      .find(".samples-subjects-pool")
      .text();

    sodaJSONObj.deleteSample(
      sampleIdToDelete,
      samplesSubjectsPool,
      samplesSubject
    );
  }

  //delete the table row element in the UI
  sampleIdCellToDelete.remove();
};

//SAMPLE TABLE FUNCTIONS

$("#guided-button-generate-samples-table").on("click", () => {
  let numSubjectRowsToCreate = parseInt(
    $("#guided-number-of-samples-input").val()
  );
  let subjectsTableBody = document.getElementById("samples-table-body");

  $("#number-of-samples-prompt").hide();
  $("#samples-table").css("display", "flex");
});

const createSampleFolder = (event, sampleNameInput) => {
  if (event.which == 13) {
    try {
      const sampleName = sampleNameInput.val().trim();
      const sampleNameElement = `
        <div class="space-between">
          <span class="sample-id">${sampleName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer"
            onclick="openSampleRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const sampleIdCellToAddNameTo = sampleNameInput.parent();
      const sampleParentSubjectName = sampleNameInput
        .closest("tbody")
        .siblings()
        .find(".sample-table-name")
        .text()
        .trim();
      let sampleNameArray = [];
      //Add all existing sample names to anarray
      Object.keys(datasetStructureJSONObj["folders"]["primary"]["folders"]).map(
        (subjectName) => {
          let samplesInSubject = Object.keys(
            datasetStructureJSONObj["folders"]["primary"]["folders"][
              subjectName
            ]["folders"]
          );
          Array.prototype.push.apply(sampleNameArray, samplesInSubject);
        }
      );
      //Throw error if entered sample name is duplicate
      if (sampleNameArray.includes(sampleName)) {
        //Change input back to the previous name but throw an error to abort following logic
        if (sampleNameInput.attr("data-prev-name") === sampleName) {
          sampleIdCellToAddNameTo.html(sampleNameElement);
        }
        throw new Error("Sample name already exists");
      }

      if (sampleName.length > 0) {
        if (subSamInputIsValid(sampleName)) {
          removeAlertMessageIfExists(sampleNameInput);
          //Add sample to sodaJSONobj
          sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
            sampleParentSubjectName
          ].push(sampleName);

          sampleIdCellToAddNameTo.html(sampleNameElement);

          sampleTargetFolder = getRecursivePath(
            ["primary", sampleParentSubjectName],
            datasetStructureJSONObj
          ).folders;
          //Check to see if input has prev-name data attribute
          //Added when renaming sample
          if (sampleNameInput.attr("data-prev-name")) {
            //get the name of the sample being renamed
            const sampleFolderToRename = sampleNameInput.attr("data-prev-name");
            //Remove old sample in sodaJSONobj
            sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
              sampleParentSubjectName
            ] = sodaJSONObj["dataset-metadata"][
              "pool-subject-sample-structure"
            ][sampleParentSubjectName].filter((sample) => {
              return sample !== sampleFolderToRename;
            });

            //create a temp copy of the folder to be renamed
            copiedFolderToRename = sampleTargetFolder[sampleFolderToRename];
            //set the copied obj from the prev name to the new obj name
            sampleTargetFolder[sampleName] = copiedFolderToRename;
            //delete the temp copy of the folder that was renamed
            delete sampleTargetFolder[sampleFolderToRename];
          } else {
            //Create an empty folder for the new sample
            sampleTargetFolder[sampleName] = {
              folders: {},
              files: {},
              type: "",
              action: [],
            };
          }
        } else {
          generateAlertMessage(sampleNameInput);
        }
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};
const openSampleRenameInput = (subjectNameEditButton) => {
  const sampleIdCellToRename = subjectNameEditButton.closest("td");
  const prevSampleName = sampleIdCellToRename.find(".sample-id").text();
  const sampleRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sam-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-sample-id"
        placeholder="Enter new sample ID"
        onkeyup="specifySample(event, $(this))"
        data-input-set="guided-samples-folder-tab"
        data-alert-message="Sample IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSampleName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  sampleIdCellToRename.html(sampleRenameElement);
};

const generateSampleMetadataRowElement = (tableIndex, sampleName) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <span class="sample-metadata-table-index">${tableIndex}</span>
      </td>
      <td class="middle aligned sample-metadata-id-cell">
        <span class="sample-metadata-id">${sampleName}</span>
      </td>
      <td class="middle aligned collapsing text-center" style="min-width: 130px">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          style="
            background-color: var(--color-light-green) !important;
            margin-right: 5px;
          "
          onclick="openModifySampleMetadataPage($(this))"
        >
          Edit metadata
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          onclick="openCopySampleMetadataPopup($(this))"
        >
          Copy metadata
        </button>
      </td>
    </tr>
  `;
};

const addSampleFolder = (sampleAddButton) => {
  sampleAddButton
    .closest("thead")
    .siblings("tbody")
    .append(generateSampleRowElement("x"));
  updateGuidedTableIndices("sample-table-index");
};
const deleteSampleFolder = (sampleDeleteButton) => {
  const sampleIdCellToDelete = sampleDeleteButton.closest("tr");
  let samplesParentSubject = sampleDeleteButton
    .closest("tbody")
    .siblings()
    .find(".sample-table-name")
    .text()
    .trim();
  const sampleIdToDelete = sampleIdCellToDelete.find(".sample-id").text();
  //delte the sample from sodaJSONobj
  sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
    samplesParentSubject
  ] = sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
    samplesParentSubject
  ].filter((sample) => {
    return sample !== sampleIdToDelete;
  });
  //delete the table row element in the UI
  sampleIdCellToDelete.remove();
  //Update sample table row indices
  updateGuidedTableIndices("sample-table-index");
  //delete the sample folder from the dataset structure obj

  delete datasetStructureJSONObj["folders"]["primary"]["folders"][
    samplesParentSubject
  ]["folders"][sampleIdToDelete];
};

const removePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove
    .find(".permission-name-cell")
    .text();
  let permissionTypeToRemove = permissionElementToRemove
    .find(".permission-type-cell")
    .text();

  if (permissionEntityType === "owner") {
    notyf.open({
      duration: "6000",
      type: "error",
      message:
        "You can not modify the owner on this step. To do so, please return to the owner selection page",
    });
    return;
  }
  if (permissionEntityType === "loggedInUser") {
    notyf.open({
      duration: "6000",
      type: "error",
      message:
        "You can not deselect yourself as a manager, as you need manager permissions to upload a dataset",
    });
    return;
  }
  if (permissionEntityType === "user") {
    const currentUsers = sodaJSONObj["digital-metadata"]["user-permissions"];
    const filteredUsers = currentUsers.filter((user) => {
      return !(
        user.userString == permissionNameToRemove &&
        user.permission == permissionTypeToRemove &&
        !user.loggedInUser
      );
    });
    sodaJSONObj["digital-metadata"]["user-permissions"] = filteredUsers;
  }
  if (permissionEntityType === "team") {
    const currentTeams = sodaJSONObj["digital-metadata"]["team-permissions"];
    const filteredTeams = currentTeams.filter((team) => {
      return !(
        team.teamString == permissionNameToRemove &&
        team.permission == permissionTypeToRemove
      );
    });
    sodaJSONObj["digital-metadata"]["team-permissions"] = filteredTeams;
  }
  //rerender the permissions table to reflect changes to user/team permissions
  renderPermissionsTable();
};

const createPermissionsTableRowElement = (entityType, name, permission) => {
  return `
    <tr data-entity-type=${entityType}>
      <td class="middle aligned permission-name-cell">${name}</td>
      <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="removePermission($(this))"
        ></i>
      </td>
    </tr>
  `;
};
const renderPermissionsTable = () => {
  let permissionsTableElements = [];
  const owner = sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
  const users = sodaJSONObj["digital-metadata"]["user-permissions"];
  const teams = sodaJSONObj["digital-metadata"]["team-permissions"];
  permissionsTableElements.push(
    createPermissionsTableRowElement("owner", owner, "owner")
  );
  for (user of users) {
    permissionsTableElements.push(
      createPermissionsTableRowElement(
        user.loggedInUser ? "loggedInUser" : "user",
        user["userString"],
        user["permission"]
      )
    );
  }
  for (team of teams) {
    permissionsTableElements.push(
      createPermissionsTableRowElement(
        "team",
        team["teamString"],
        team["permission"]
      )
    );
  }

  let permissionsTable = permissionsTableElements.join("\n");
  let permissionsTableBody = document.getElementById("permissions-table-body");
  permissionsTableBody.innerHTML = permissionsTable;
};

$("#guided-button-no-source-data").on("click", () => {
  //ask user to confirm they would like to delete source folder if it exists
  if (datasetStructureJSONObj["folders"]["source"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the source folder.",
      text: "Are you sure you would like to delete your source folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete source folder
        delete datasetStructureJSONObj["folders"]["source"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no source files
        $("#guided-button-has-source-data").click();
      }
    });
  }
});

/*********** Derivative page functions ***********/
$("#guided-button-has-derivative-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["derivative"] == undefined)
    datasetStructureJSONObj["folders"]["derivative"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  $("#guided-file-explorer-elements").appendTo(
    $("#guided-user-has-derivative-data")
  );
  updateFolderStructureUI(highLevelFolderPageData.derivative);
});
$("#guided-button-no-derivative-data").on("click", () => {
  //ask user to confirm they would like to delete derivative folder if it exists
  if (datasetStructureJSONObj["folders"]["derivative"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the derivative folder.",
      text: "Are you sure you would like to delete your derivative folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete derivative folder
        delete datasetStructureJSONObj["folders"]["derivative"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no derivative files
        $("#guided-button-has-derivative-data").click();
      }
    });
  }
});

const getTagsFromTagifyElement = (tagifyElement) => {
  return Array.from(tagifyElement.getTagElms()).map((tag) => {
    return tag.textContent;
  });
};

$("#guided-submission-completion-date").change(function () {
  const text = $("#guided-submission-completion-date").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate =
          new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById(
          "milestone_date_picker"
        ).value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#guided-submission-completion-date-manual").change(function () {
  const text = $("#guided-submission-completion-date-manual").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate =
          new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById(
          "milestone_date_picker"
        ).value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date-manual option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date-manual").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date-manual")
          .children()
          .last();
        $option.prop("selected", true);
      }
    });
  }
});
/////////////////////////////////////////////////////////
//////////       GUIDED OBJECT ACCESSORS       //////////
/////////////////////////////////////////////////////////
const setOrUpdateGuidedDatasetName = (newDatasetName) => {
  return new Promise((resolve, reject) => {
    const previousDatasetName = sodaJSONObj["digital-metadata"]["name"];
    //If updataing the dataset, update the old banner image path with a new one
    if (previousDatasetName) {
      //If previousDatasetName is equal to the newDatasetName, we don't need to update any progress files
      if (previousDatasetName === newDatasetName) {
        resolve("No changes made to dataset name");
      }

      //get names of existing progress saves
      const existingProgressNames = fs.readdirSync(guidedProgressFilePath);
      //Remove '.json' from each element in existingProgressNames
      existingProgressNames.forEach((element, index) => {
        existingProgressNames[index] = element.replace(".json", "");
      });
      //check if dataset name is already in use
      if (existingProgressNames.includes(newDatasetName)) {
        reject(
          "An existing progress file already exists with that name. Please choose a different name."
        );
      }

      //update old progress file with new dataset name
      const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
      fs.renameSync(oldProgressFilePath, newProgressFilePath);

      const bannerImagePathToUpdate =
        sodaJSONObj["digital-metadata"]["banner-image-path"];
      if (bannerImagePathToUpdate) {
        const newBannerImagePath = bannerImagePathToUpdate.replace(
          previousDatasetName,
          datasetName
        );
        //Rename the old banner image folder to the new dataset name
        fs.renameSync(bannerImagePathToUpdate, newBannerImagePath);
        //change the banner image path in the JSON obj
        sodaJSONObj["digital-metadata"]["banner-image-path"] =
          newBannerImagePath;
      }
      sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
      saveGuidedProgress(newDatasetName);
      resolve("Dataset name updated");
    } else {
      sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
      saveGuidedProgress(newDatasetName);
      resolve("Dataset name updated");
    }
  });
};

const getExistingPennsieveDatasetNames = async () => {
  // get the access token so the user can access the Pennsieve api
  let jwt = await get_access_token();
  const options = {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  };
  const datasetNamesResponse = await fetch(
    "https://api.pennsieve.io/datasets/",
    options
  );

  if (!datasetNamesResponse.ok) {
    const message = `An error has occurred: ${response.status}`;
    throw new Error(message);
  }

  const datasetNamesResponseJSON = await datasetNamesResponse.json();

  //return an array of existing dataset names
  return datasetNamesResponseJSON.map((dataset) => {
    return dataset.content.name;
  });
};
const getGuidedDatasetName = () => {
  return sodaJSONObj["digital-metadata"]["name"];
};

const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitle;
};
const getGuidedDatasetSubtitle = () => {
  return sodaJSONObj["digital-metadata"]["subtitle"];
};

const guidedShowBannerImagePreview = (imagePath) => {
  const bannerImagePreviewelement = document.getElementById(
    "guided-banner-image-preview"
  );

  // bannerImagePreviewelement.innerHTML = '';
  if (bannerImagePreviewelement.childElementCount > 0) {
    bannerImagePreviewelement.removeChild(bannerImagePreviewelement.firstChild);
  }

  let date = new Date();
  let guidedbannerImageElem = document.createElement("img");
  //imagePath + cachebreakeer at the end to update image every time
  guidedbannerImageElem.src = imagePath + "?" + date.getMilliseconds();
  guidedbannerImageElem.alt = "Preview of banner image";
  guidedbannerImageElem.style = "max-height: 300px";

  bannerImagePreviewelement.appendChild(guidedbannerImageElem);

  // bannerImagePreviewelement.innerHTML = guidedBannerImageElement;
  $("#guided-banner-image-preview-container").show();
  $("#guided-button-add-banner-image").html("Edit banner image");
};
const setGuidedBannerImage = (croppedImagePath) => {
  sodaJSONObj["digital-metadata"]["banner-image-path"] = croppedImagePath;
  guidedShowBannerImagePreview(croppedImagePath);
};

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] =
    newPiOwnerObj.userString;
  sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;

  //Remove any old permissions the owner may have had
  const currentUsers = sodaJSONObj["digital-metadata"]["user-permissions"];
  const filteredUsers = currentUsers.filter((user) => {
    return !(user.UUID == newPiOwnerObj.UUID);
  });
  sodaJSONObj["digital-metadata"]["user-permissions"] = filteredUsers;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
  //If an existing user with the same ID already exists, update the existing user's position
  for (userPermission of sodaJSONObj["digital-metadata"]["user-permissions"]) {
    if (
      userPermission["userString"] == newUserPermissionObj.userString &&
      userPermission["UUID"] == newUserPermissionObj.UUID
    ) {
      userPermission["permission"] = newUserPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  sodaJSONObj["digital-metadata"]["user-permissions"].push(
    newUserPermissionObj
  );
  renderPermissionsTable();
};
const guidedRemoveUserPermission = (userParentElement) => {};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
  //If an existing team with the same ID already exists, update the existing team's position
  for (teamPermission of sodaJSONObj["digital-metadata"]["team-permissions"]) {
    if (
      teamPermission["teamString"] == newTeamPermissionObj.teamString &&
      teamPermission["UUID"] == newTeamPermissionObj.UUID
    ) {
      teamPermission["permission"] = newTeamPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  sodaJSONObj["digital-metadata"]["team-permissions"].push(
    newTeamPermissionObj
  );
  renderPermissionsTable();
};
const guidedRemoveTeamPermission = (teamParentElement) => {};

const setGuidedLicense = (newLicense) => {
  sodaJSONObj["digital-metadata"]["license"] = "Creative Commons Attribution";
};

const renderSamplesHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(
    `guided-${highLevelFolderName}-samples-aside`
  );
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectsWithSamples = subjects.filter((subject) => {
    return subject.samples.length > 0;
  });

  let asideElementTemplateLiteral = ``;

  //create an array of objects that groups subjectsWithSamples by poolName property
  const subjectsWithSamplesInPools = subjectsWithSamples.reduce(
    (acc, subject) => {
      if (subject.poolName) {
        if (acc[subject.poolName]) {
          acc[subject.poolName].push(subject);
        } else {
          acc[subject.poolName] = [subject];
        }
      }
      return acc;
    },
    {}
  );
  //loop through the pools and create an aside element for each sample in the pools subjects
  for (const [poolName, subjects] of Object.entries(
    subjectsWithSamplesInPools
  )) {
    asideElementTemplateLiteral += `
    ${subjects
      .map((subject) => {
        return `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
            <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
              <label class="guided--form-label centered" style="color: black;">
                ${subject.subjectName}
              </label>
              </div>
                ${subject.samples
                  .map((sample) => {
                    return `
                    <a 
                      class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                      data-path-suffix="${subject.poolName}/${subject.subjectName}/${sample}"
                      style="padding-left: 1rem; direction: ltr"
                    >${sample}</a>
                  `;
                  })
                  .join("\n")}
            </div>`;
      })
      .join("\n")}`;
  }

  //filter out subjects that are not in a pool
  const subjectsWithSamplesOutsidePools = subjectsWithSamples.filter(
    (subject) => {
      return !subject.poolName;
    }
  );
  //loop through the subjects and create an aside element for each
  for (const subject of subjectsWithSamplesOutsidePools) {
    asideElementTemplateLiteral += `
      <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
      <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
        <label class="guided--form-label centered" style="color: black;">
          ${subject.subjectName}
        </label>
      </div>
        ${subject.samples
          .map((sample) => {
            return `  
              <a
                class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                style="direction: ltr; padding-left: 1rem;"
                data-path-suffix="${subject.subjectName}/${sample}"
              >${sample}</a>
`;
          })
          .join("\n")}
    `;
  }

  //Add the samples to the DOM
  asideElement.innerHTML = asideElementTemplateLiteral;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );

  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-samples-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          `guided-${highLevelFolderName}-samples-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      const samplePageData = generateHighLevelFolderSubFolderPageData(
        "sample",
        highLevelFolderName,
        pathSuffix
      );

      if (
        sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] == false
      ) {
        $("#items").html(`
          <div
            class="single-item ds-selectable"
            id="guided-sample-data-folder"
            onmouseover="hoverForFullName(this)"
            onmouseleave="hideFullName()"
          >
            <h1 oncontextmenu="folderContextMenu(this)" class="myFol empty"></h1>
            <div class="folder_desc">Sample data folder</div>
          </div>
          <div
            class="single-item ds-selectable"
            id="guided-sample-data-file"
            onmouseover="hoverForFullName(this)"
            onmouseleave="hideFullName()"
          >
            <h1
              class="myFile xlsx"
              oncontextmenu="fileContextMenu(this)"
              style="margin-bottom: 10px"
            ></h1>
            <div class="folder_desc">Sample data file.xlsx</div>
          </div>
        `);
        //right click the second child in #items jqeury
        introJs()
          .setOptions({
            steps: [
              {
                element: document.querySelector(
                  ".primary-selection-aside-item"
                ),
                intro:
                  "Select the different samples here to specify data files for each of them.",
              },
              {
                element: document.querySelector("#guided-button-back"),
                intro:
                  "To view the folders above the folder you are currently in, click the up button.",
              },
              {
                element: document.querySelector("#guided-new-folder"),
                intro:
                  "To include a new empty folder, click the 'New folder' button. You can then specify data to be included into it.",
              },
              {
                element: document.querySelector("#guided-import-folder"),
                intro:
                  "To import a folder from your computer, click the 'Import folder' button.",
              },
              {
                element: document.querySelector("#guided-imoprt-file"),
                intro:
                  "To import a data file from your computer, click the 'Import file' button.",
              },
              {
                element: document.getElementById("items"),
                intro: `Folders inside your dataset are represented by the folder icon.<br /><br />
                  To view the contents of a folder, double click the folder.<br /><br />
                  Right clicking a folder will bring up a context menu which allows you to rename, move, or delete the folder.`,
              },
              {
                element: document.getElementById("items"),
                intro: `Files inside your dataset are represented with an icon relative to the file type.<br /><br />
                  Right clicking a file will bring up a context menu which allows you to rename, move, or delete the file.`,
              },
            ],
            exitOnEsc: false,
            exitOnOverlayClick: false,
            disableInteraction: false,
          })
          .onbeforeexit(function () {
            sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = true;
            //reUpdate the file explorer
            updateFolderStructureUI(samplePageData);
          })
          .start();
      } else {
        //render folder section in #items
        //create an animation effect to the items box here
        // $("#items")
        updateFolderStructureUI(samplePageData);
      }
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(
    `guided-${highLevelFolderName}-subjects-aside`
  );
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${
              subject.poolName ? subject.poolName + "/" : ""
            }${subject.subjectName}"
          >${subject.subjectName}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-subjects-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          `guided-${highLevelFolderName}-subjects-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      const samplePageData = generateHighLevelFolderSubFolderPageData(
        "subject",
        highLevelFolderName,
        pathSuffix
      );
      updateFolderStructureUI(samplePageData);
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsMetadataAsideItems = () => {
  const asideElement = document.getElementById(
    `guided-subjects-metadata-aside`
  );
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();

  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectMetadataCopyButton = document.getElementById(
    "guided-button-subject-metadata-copy"
  );
  if (subjects.length > 1) {
    subjectMetadataCopyButton.classList.remove("hidden");
  } else {
    subjectMetadataCopyButton.classList.add("hidden");
  }

  const subjectsFormEntries = guidedSubjectsFormDiv.querySelectorAll(
    ".subjects-form-entry"
  );
  //Create an array of subjectFormEntries name attribute
  const subjectsFormNames = [...subjectsFormEntries].map((entry) => {
    return entry.name;
  });

  if (subjectsTableData.length == 0) {
    //Get items with class "subjects-form-entry" from subjectsForDiv

    subjectsTableData[0] = subjectsFormNames;
    for (const subject of subjects) {
      const subjectDataArray = [];
      subjectDataArray.push(subject.subjectName);
      subjectDataArray.push(subject.poolName ? subject.poolName : "");

      for (let i = 0; i < subjectsFormNames.length - 2; i++) {
        subjectDataArray.push("");
      }
      subjectsTableData.push(subjectDataArray);
    }
  } else {
    //Add subjects that have not yet been added to the table to the table
    for (const subject of subjects) {
      let subjectAlreadyInTable = false;
      for (let i = 0; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] == subject.subjectName) {
          subjectAlreadyInTable = true;
        }
      }
      if (!subjectAlreadyInTable) {
        const subjectDataArray = [];
        subjectDataArray.push(subject.subjectName);
        subjectDataArray.push(subject.poolName ? subject.poolName : "");
        for (let i = 0; i < subjectsTableData[0].length - 2; i++) {
          subjectDataArray.push("");
        }
        subjectsTableData.push(subjectDataArray);
      }
    }

    //If custom fields have been added to the subjectsTableData, create a field for each custom field
    //added
    for (let i = 0; i < subjectsTableData[0].length; i++) {
      if (!subjectsFormNames.includes(subjectsTableData[0][i])) {
        addCustomHeader("subjects", subjectsTableData[0][i], "guided");
      }
    }
  }

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="subjects-metadata-aside-item selection-aside-item"
            data-pool-id="${subject.poolName ? subject.poolName : ""}"
          ><span class="subject-metadata-id">${subject.subjectName}</span></a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each subject item
  const selectionAsideItems = document.querySelectorAll(
    `a.subjects-metadata-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById(
        "guided-form-add-a-subject-intro"
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          "guided-form-add-a-subject-intro",
          "guided-form-add-a-subject"
        );
      }
      //Save the subject metadata from the previous subject being worked on
      previousSubject = document.getElementById(
        "guided-bootbox-subject-id"
      ).value;
      //check to see if previousSubject is empty
      if (previousSubject) {
        addSubject("guided");
      }

      clearAllSubjectFormFields(guidedSubjectsFormDiv);

      //call openModifySubjectMetadataPage function on clicked item
      openModifySubjectMetadataPage(e.target.innerText);

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      document.getElementById("guided-bootbox-subject-id").value =
        e.target.innerText;
      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-subject-pool-id").value =
        e.target.getAttribute("data-pool-id");

      saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
    });
    //add hover event that changes the background color
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};
const renderSamplesMetadataAsideItems = () => {
  const asideElement = document.getElementById(`guided-samples-metadata-aside`);
  asideElement.innerHTML = "";

  const [samplesInPools, samplesOutsidePools] =
    sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];

  const sampleMetadataCopyButton = document.getElementById(
    "guided-button-sample-metadata-copy"
  );
  if (samples.length > 1) {
    sampleMetadataCopyButton.classList.remove("hidden");
  } else {
    sampleMetadataCopyButton.classList.add("hidden");
  }

  const samplesFormEntries = guidedSamplesFormDiv.querySelectorAll(
    ".samples-form-entry"
  );

  //Create an array of samplesFormEntries name attribute
  const samplesFormNames = [...samplesFormEntries].map((entry) => {
    return entry.name;
  });

  if (samplesTableData.length == 0) {
    //Get items with class "samples-form-entry" from samplesForDiv
    samplesTableData[0] = samplesFormNames;
    for (const sample of samples) {
      const sampleDataArray = [];
      sampleDataArray.push(sample.subjectName);
      sampleDataArray.push(sample.sampleName);
      //Push an empty string for was derived from
      sampleDataArray.push("");
      sampleDataArray.push(sample.poolName ? sample.poolName : "");
      for (let i = 0; i < samplesFormNames.length - 4; i++) {
        sampleDataArray.push("");
      }
      samplesTableData.push(sampleDataArray);
    }
  } else {
    //Add samples that have not yet been added to the table to the table
    for (const sample of samples) {
      let sampleAlreadyInTable = false;
      for (let i = 0; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] == sample.sampleName) {
          sampleAlreadyInTable = true;
        }
      }
      if (!sampleAlreadyInTable) {
        const sampleDataArray = [];
        sampleDataArray.push(sample.subjectName);
        sampleDataArray.push(sample.sampleName);
        //Push an empty string for was derived from
        sampleDataArray.push("");
        sampleDataArray.push(sample.poolName ? sample.poolName : "");
        for (let i = 0; i < samplesTableData[0].length - 4; i++) {
          sampleDataArray.push("");
        }
        samplesTableData.push(sampleDataArray);
      }
    }
  }

  //If custom fields have been added to the samplesTableData, create a field for each custom field
  //added
  for (let i = 0; i < samplesTableData[0].length; i++) {
    if (!samplesFormNames.includes(samplesTableData[0][i])) {
      addCustomHeader("samples", samplesTableData[0][i], "guided");
    }
  }

  //Create the HTML for the samples
  const sampleItems = samples
    .map((sample) => {
      return `
        <a
          class="samples-metadata-aside-item selection-aside-item"
          data-samples-subject-name="${sample.subjectName}"
          data-samples-pool-id="${sample.poolName ? sample.poolName : ""}"
        >
          <span class="sample-metadata-id">
            ${sample.sampleName}
          </span>
        </a>
        `;
    })
    .join("\n");

  //Add the samples to the DOM
  asideElement.innerHTML = sampleItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.samples-metadata-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById(
        "guided-form-add-a-sample-intro"
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          "guided-form-add-a-sample-intro",
          "guided-form-add-a-sample"
        );
      }

      previousSample = document.getElementById(
        "guided-bootbox-sample-id"
      ).value;

      //check to see if previousSample is empty
      if (previousSample) {
        addSample("guided");
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //Get sample's subject and pool from rendered HTML
      const samplesSubject = e.target.getAttribute("data-samples-subject-name");
      const samplesPool = e.target.getAttribute("data-samples-pool-id");

      //Set the subject id field based of clicked elements data-subject-id attribute
      document.getElementById("guided-bootbox-subject-id-samples").value =
        samplesSubject;

      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-sample-pool-id").value =
        samplesPool;

      //clear all sample form fields
      clearAllSubjectFormFields(guidedSamplesFormDiv);

      //call openModifySampleMetadataPage function on clicked item
      openModifySampleMetadataPage(
        e.target.innerText,
        samplesSubject,
        samplesPool
      );

      saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
    });

    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

$(document).ready(async () => {
  $("#guided-button-start-new-curate").on("click", () => {
    guidedTransitionFromHome();
  });

  $("#guided-button-dataset-intro-back").on("click", () => {
    const guidedIntroPage = document.getElementById("guided-intro-page");
    const guidedDatasetNameSubtitlePage = document.getElementById(
      "guided-new-dataset-info"
    );
    if (!guidedIntroPage.classList.contains("hidden")) {
      //remove text from dataset name and subtitle inputs
      document.getElementById("guided-dataset-name-input").value = "";
      document.getElementById("guided-dataset-subtitle-input").value = "";

      switchElementVisibility("guided-mode-starting-container", "guided-home");
      //hide the intro footer
      document.getElementById("guided-footer-intro").classList.add("hidden");
      guidedPrepareHomeScreen();
    } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
      switchElementVisibility("guided-new-dataset-info", "guided-intro-page");
    }
  });
  $("#guided-button-dataset-intro-next").on("click", async function () {
    const guidedIntroPage = document.getElementById("guided-intro-page");
    const guidedDatasetNameSubtitlePage = document.getElementById(
      "guided-new-dataset-info"
    );

    if (!guidedIntroPage.classList.contains("hidden")) {
      switchElementVisibility("guided-intro-page", "guided-new-dataset-info");
    } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
      let errorArray = [];

      try {
        $(this).addClass("loading");

        let datasetNameInput = document
          .getElementById("guided-dataset-name-input")
          .value.trim();
        let datasetSubtitleInput = document
          .getElementById("guided-dataset-subtitle-input")
          .value.trim();
        if (!datasetNameInput) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset name.",
          });
        }
        if (!datasetSubtitleInput) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset subtitle.",
          });
        }
        if (errorArray.length > 0) {
          throw errorArray;
        }

        if (Object.keys(sodaJSONObj).length === 0) {
          //get names of existing progress saves
          const existingProgressNames = fs.readdirSync(guidedProgressFilePath);
          //Remove '.json' from each element in existingProgressNames
          existingProgressNames.forEach((element, index) => {
            existingProgressNames[index] = element.replace(".json", "");
          });
          //check if dataset name is already in use
          if (existingProgressNames.includes(datasetNameInput)) {
            errorArray.push({
              type: "notyf",
              message:
                "An existing progress file already exists with that name. Please choose a different name.",
            });
            throw errorArray;
          }

          guidedCreateSodaJSONObj();
          attachGuidedMethodsToSodaJSONObj();

          await setOrUpdateGuidedDatasetName(datasetNameInput);
          setGuidedDatasetSubtitle(datasetSubtitleInput);
          saveGuidedProgress(datasetNameInput);
        } else {
          //updating current progress file
          try {
            await setOrUpdateGuidedDatasetName(datasetNameInput);
          } catch (error) {
            errorArray.push({
              type: "notyf",
              message: error,
            });
            throw errorArray;
          }
          setGuidedDatasetSubtitle(datasetSubtitleInput);
          saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
        }
        $(this).removeClass("loading");

        resetGuidedRadioButtons("guided-dataset-starting-point-tab");
        guidedTransitionFromDatasetNameSubtitlePage();
      } catch (error) {
        errorArray.map((error) => {
          if (error.type === "notyf") {
            notyf.open({
              duration: "4000",
              type: "error",
              message: error.message,
            });
          }
        });
        $(this).removeClass("loading");
      }
      $(this).removeClass("loading");
    }
  });
  $("#guided-modify-dataset-name-subtitle").on("click", async () => {
    let errorArray = [];
    try {
      const datasetName = getGuidedDatasetName();
      const datasetSubtitle = getGuidedDatasetSubtitle();

      if (
        datasetName === datasetNameInputValue &&
        datasetSubtitle === datasetSubtitleInputValue
      ) {
        //If not changes were made to the name or subtitle, exit the page
        guidedTransitionFromDatasetNameSubtitlePage();
        return;
      }

      if (datasetName != datasetNameInputValue) {
        //check if dataset name is already in use
        const existingProgressFileNames = fs.readdirSync(
          guidedProgressFilePath
        );
        //Get the name of the progress files without the file type
        const existingProgressDatasetNames = existingProgressFileNames.map(
          (fileName) => {
            return fileName.split(".")[0];
          }
        );
        if (existingProgressDatasetNames.includes(datasetNameInputValue)) {
          const result = await Swal.fire({
            title: "An existing progress file with this name already exists",
            text: "Would you like to overwrite it? This will replace existing data saved under the old progress file with your current progress.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, overwrite existing file",
            cancelButtonText: "No, cancel",
          });
          if (result.isConfirmed) {
            setOrUpdateGuidedDatasetName(datasetNameInputValue);
            setGuidedDatasetSubtitle(datasetSubtitleInputValue);
            saveGuidedProgress(datasetNameInputValue);
          }
        } else {
          setOrUpdateGuidedDatasetName(datasetNameInputValue);

          setGuidedDatasetSubtitle(datasetSubtitleInputValue);
          saveGuidedProgress(datasetNameInputValue);
        }
      } else {
        setGuidedDatasetSubtitle(datasetSubtitleInputValue);
        saveGuidedProgress(datasetNameInputValue);
      }
      //transition out of dataset name/subtitle page
      guidedTransitionFromDatasetNameSubtitlePage();
    } catch (error) {
      errorArray.map((error) => {
        if (error.type === "notyf") {
          notyf.open({
            duration: "4000",
            type: "error",
            message: error.message,
          });
        }
        errorArray = [];
      });
    }
  });

  //WHEN STRUCTURING FOLDER GUIDED
  $("#guided-button-import-existing-dataset-structure").on("click", () => {
    //Hide proper capsules and apply proper skip pages
    $("#guided-curate-new-dataset-branch-capsule-container").hide();
    $("#guided-curate-existing-local-dataset-branch-capsule-container").css(
      "display",
      "flex"
    );
    $(".guided-curate-existing-local-dataset-branch-page").attr(
      "data-skip-page",
      "false"
    );
    $(".guided-curate-new-dataset-branch-page").attr("data-skip-page", "true");
  });
  //WHEN IMPORTING LOCAL STRUCTURE
  $("#guided-button-guided-dataset-structuring").on("click", () => {
    //Hide proper capsules and apply proper skip pages
    $("#guided-curate-existing-local-dataset-branch-capsule-container").hide();
    $("#guided-curate-new-dataset-branch-capsule-container").css(
      "display",
      "flex"
    );

    $(".guided-curate-new-dataset-branch-page").attr("data-skip-page", "false");
    $(".guided-curate-existing-local-dataset-branch-page").attr(
      "data-skip-page",
      "true"
    );
  });
  $("#guided-structure-new-dataset").on("click", () => {
    $("#guided-next-button").click();
  });
  $("#guided-import-existing-dataset").on("click", () => {
    $("#guided-next-button").click();
  });

  $("#guided-button-add-permission-user-or-team").on("click", function () {
    try {
      //get the selected permission element
      const newPermissionElement = $(
        "#guided_bf_list_users_and_teams option:selected"
      );
      const newPermissionRoleElement = $(
        "#select-permission-list-users-and-teams"
      );

      //throw error if no user/team or role is selected
      if (newPermissionElement.val().trim() === "Select individuals or teams") {
        throw "Please select a user or team to designate a permission to";
      }
      if (newPermissionRoleElement.val().trim() === "Select role") {
        throw "Please select a role for the user or team";
      }
      if (
        newPermissionElement.val().trim() ===
        sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"]
      ) {
        throw `${newPermissionElement
          .text()
          .trim()} is designated as the PI owner.
        To designate them as a ${newPermissionRoleElement
          .val()
          .trim()}, go back and remove them as the PI owner.`;
      }

      if (newPermissionElement[0].getAttribute("permission-type") == "user") {
        //if the selected element is a user, add the user to the user permissions array
        userString = newPermissionElement.text().trim();
        userName = userString.split("(")[0].trim();
        UUID = newPermissionElement.val().trim();
        userPermission = newPermissionRoleElement.val().trim();
        const newUserPermissionObj = {
          userString: userString,
          userName: userName,
          UUID: UUID,
          permission: userPermission,
        };
        guidedAddUserPermission(newUserPermissionObj);
      }
      if (newPermissionElement[0].getAttribute("permission-type") == "team") {
        //if the selected element is a team, add the team to the team permissions array
        const newTeamPermissionObj = {
          teamString: newPermissionElement.text().trim(),
          UUID: newPermissionElement.val().trim(),
          permission: newPermissionRoleElement.val().trim(),
        };
        guidedAddTeamPermission(newTeamPermissionObj);
      }
      $(this)[0].scrollIntoView({
        behavior: "smooth",
      });
      guidedResetUserTeamPermissionsDropdowns();
    } catch (error) {
      notyf.open({
        duration: "4000",
        type: "error",
        message: error,
      });
    }
  });
  $("#guided-button-add-permission-user").on("click", function () {
    const newUserPermission = {
      userString: $("#guided_bf_list_users option:selected").text().trim(),
      UUID: $("#guided_bf_list_users").val().trim(),
      permission: $("#select-permission-list-users-and-teams").val(),
    };
    removeAlertMessageIfExists($("#guided-designated-user-permissions-info"));
    guidedAddUserPermission(newUserPermission);
  });

  $("#guided-button-add-permission-team").on("click", function () {
    const newTeamPermissionObj = {
      teamString: $("#guided_bf_list_teams").val().trim(),
      permission: $("#select-permission-list-4").val(),
    };
    removeAlertMessageIfExists($("#guided-designated-team-permissions-info"));
    guidedAddTeamPermission(newTeamPermissionObj);
  });

  $(".guided--radio-button").on("click", function () {
    const selectedButton = $(this);
    const notSelectedButton = $(this).siblings(".guided--radio-button");

    notSelectedButton.removeClass("selected");
    notSelectedButton.addClass("not-selected basic");

    //If button has prevent-radio-handler data attribute, other buttons, will be deselected
    //but all other radio button functions will be halted
    if (selectedButton.data("prevent-radio-handler") === true) {
      return;
    }

    selectedButton.removeClass("not-selected basic");
    selectedButton.addClass("selected");

    //Hide all child containers of non-selected buttons
    notSelectedButton.each(function () {
      if ($(this).data("next-element")) {
        nextQuestionID = $(this).data("next-element");
        $(`#${nextQuestionID}`).addClass("hidden");
      }
    });

    //Display and scroll to selected element container if data-next-element exists
    if (selectedButton.data("next-element")) {
      nextQuestionID = selectedButton.data("next-element");
      nextQuestionElement = $(`#${nextQuestionID}`);
      nextQuestionElement.removeClass("hidden");
      //slow scroll to the next question
      //temp fix to prevent scrolling error
      const elementsToNotScrollTo = [
        "guided-add-samples-table",
        "guided-add-pools-table",
        "guided-div-add-subjects-table",
        "guided-div-resume-progress-cards",
        "guided-div-update-uploaded-cards",
      ];
      if (!elementsToNotScrollTo.includes(nextQuestionID)) {
        nextQuestionElement[0].scrollIntoView({
          behavior: "smooth",
        });
      }
    }
    //Store the button's config value in sodaJSONObj
    if (selectedButton.data("button-config-value")) {
      buttonConfigValue = selectedButton.data("button-config-value");
      buttonConfigValueState = selectedButton.data("button-config-value-state");
      sodaJSONObj["button-config"][buttonConfigValue] = buttonConfigValueState;
    }
  });

  $("#guided-button-samples-not-same").on("click", () => {
    $("#guided-button-generate-subjects-table").show();
  });
  $("#guided-button-samples-same").on("click", () => {
    $("#guided-button-generate-subjects-table").hide();
  });

  /////////////////////////////////////////////////////////
  //////////       GUIDED jsTree FUNCTIONS       //////////
  /////////////////////////////////////////////////////////

  var guidedJstreePreview = document.getElementById(
    "guided-div-dataset-tree-preview"
  );

  $(guidedJstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });

  $(guidedJstreePreview).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });
  $(guidedJstreePreview).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });

  /////////////////////////////////////////////////////////
  /////////  PENNSIEVE METADATA BUTTON HANDLERS   /////////
  /////////////////////////////////////////////////////////

  $("#guided-dataset-subtitle-input").on("keyup", () => {
    const guidedDatasetSubtitleCharCount = document.getElementById(
      "guided-subtitle-char-count"
    );
    countCharacters(
      document.getElementById("guided-dataset-subtitle-input"),
      guidedDatasetSubtitleCharCount
    );
  });

  //card click hanndler that displays the card's panel using the card's id prefix
  //e.g. clicking a card with id "foo-bar-card" will display the panel with the id "foo-bar-panel"
  $(".guided--card-container > div").on("click", function () {
    handlePageBranching($(this));
  });

  document
    .getElementById("guided-bootbox-sample-protocol-title")
    .addEventListener("change", function () {
      const newDescriptionAssociatedLink = $(this)
        .find(":selected")
        .data("protocol-link");
      document.getElementById("guided-bootbox-sample-protocol-location").value =
        newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
    });
  document
    .getElementById("guided-bootbox-sample-protocol-location")
    .addEventListener("change", function () {
      const newDescriptionAssociatedDescription = $(this)
        .find(":selected")
        .data("protocol-description");
      document.getElementById("guided-bootbox-sample-protocol-title").value =
        newDescriptionAssociatedDescription
          ? newDescriptionAssociatedDescription
          : "";
    });

  document
    .getElementById("guided-bootbox-subject-protocol-title")
    .addEventListener("change", function () {
      const newDescriptionAssociatedLink = $(this)
        .find(":selected")
        .data("protocol-link");
      document.getElementById(
        "guided-bootbox-subject-protocol-location"
      ).value = newDescriptionAssociatedLink
        ? newDescriptionAssociatedLink
        : "";
    });
  document
    .getElementById("guided-bootbox-subject-protocol-location")
    .addEventListener("change", function () {
      const newDescriptionAssociatedDescription = $(this)
        .find(":selected")
        .data("protocol-description");
      document.getElementById("guided-bootbox-subject-protocol-title").value =
        newDescriptionAssociatedDescription
          ? newDescriptionAssociatedDescription
          : "";
    });

  // function for importing a banner image if one already exists
  $("#guided-button-add-banner-image").click(async () => {
    $("#guided-banner-image-modal").modal("show");
  });

  // Action when user click on "Import image" button for banner image
  $("#guided-button-import-banner-image").click(async () => {
    $("#guided-para-dataset-banner-image-status").html("");
    let filePaths = await ipcRenderer.invoke(
      "open-file-dialog-import-banner-image"
    );
    guidedHandleSelectedBannerImage(filePaths);
  });
  /////////////////////////////////////////////////////////
  //////////    GUIDED IPC RENDERER LISTENERS    //////////
  /////////////////////////////////////////////////////////

  const guidedHandleSelectedBannerImage = async (path) => {
    if (path.length > 0) {
      let original_image_path = path[0];
      let image_path = original_image_path;
      let destination_image_path = require("path").join(
        homeDirectory,
        "SODA",
        "banner-image-conversion"
      );
      let converted_image_file = require("path").join(
        destination_image_path,
        "converted-tiff.jpg"
      );
      let conversion_success = true;
      imageExtension = path[0].split(".").pop();

      if (imageExtension.toLowerCase() == "tiff") {
        Swal.fire({
          title: "Image conversion in progress!",
          html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Jimp.read(original_image_path)
          .then(async (file) => {
            if (!fs.existsSync(destination_image_path)) {
              fs.mkdirSync(destination_image_path, { recursive: true });
            }

            try {
              if (fs.existsSync(converted_image_file)) {
                fs.unlinkSync(converted_image_file);
              }
            } catch (err) {
              conversion_success = false;
              console.error(err);
            }

            return file.write(converted_image_file, async () => {
              if (fs.existsSync(converted_image_file)) {
                let stats = fs.statSync(converted_image_file);
                let fileSizeInBytes = stats.size;
                let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                if (fileSizeInMegabytes > 5) {
                  fs.unlinkSync(converted_image_file);

                  await Jimp.read(original_image_path)
                    .then((file) => {
                      return file
                        .resize(1024, 1024)
                        .write(converted_image_file, () => {
                          document.getElementById(
                            "div-img-container-holder"
                          ).style.display = "none";
                          document.getElementById(
                            "div-img-container"
                          ).style.display = "block";

                          $("#para-path-image").html(image_path);
                          guidedBfViewImportedImage.src = converted_image_file;
                          myCropper.destroy();
                          myCropper = new Cropper(
                            guidedBfViewImportedImage,
                            guidedCropOptions
                          );
                          $("#save-banner-image").css("visibility", "visible");
                          $("body").removeClass("waiting");
                        });
                    })
                    .catch((err) => {
                      conversion_success = false;
                      console.error(err);
                    });
                  if (fs.existsSync(converted_image_file)) {
                    let stats = fs.statSync(converted_image_file);
                    let fileSizeInBytes = stats.size;
                    let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                    if (fileSizeInMegabytes > 5) {
                      conversion_success = false;
                      // SHOW ERROR
                    }
                  }
                }
                image_path = converted_image_file;
                imageExtension = "jpg";
                $("#para-path-image").html(image_path);
                guidedBfViewImportedImage.src = image_path;
                myCropper.destroy();
                myCropper = new Cropper(
                  guidedBfViewImportedImage,
                  guidedCropOptions
                );
                $("#save-banner-image").css("visibility", "visible");
              }
            });
          })
          .catch((err) => {
            conversion_success = false;
            console.error(err);
            Swal.fire({
              icon: "error",
              text: "Something went wrong",
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          });
        if (conversion_success == false) {
          $("body").removeClass("waiting");
          return;
        } else {
          Swal.close();
        }
      } else {
        document.getElementById(
          "guided-div-img-container-holder"
        ).style.display = "none";
        document.getElementById("guided-div-img-container").style.display =
          "block";

        $("#guided-para-path-image").html(image_path);
        guidedBfViewImportedImage.src = image_path;
        myCropper.destroy();
        myCropper = new Cropper(guidedBfViewImportedImage, guidedCropOptions);

        $("#guided-save-banner-image").css("visibility", "visible");
      }
    }
  };

  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
  });

  //FETCH FUNCTIONS//
  //fetch
  const guidedUpdateUploadStatus = (uploadContainerElement, status) => {
    if (status === "uploading") {
      uploadContainerElement.classList.add("uploading");
      uploadContainerElement.classList.remove("uploaded");
      uploadContainerElement.classList.remove("error");
    } else if (status === "uploaded") {
      uploadContainerElement.classList.add("uploaded");
      uploadContainerElement.classList.remove("uploading");
      uploadContainerElement.classList.remove("error");
    } else if (status === "error") {
      uploadContainerElement.classList.add("error");
      uploadContainerElement.classList.remove("uploading");
      uploadContainerElement.classList.remove("uploaded");
    }
  };

  const guidedCreateDataset = async (bfAccount, datasetName) => {
    document
      .getElementById("guided-dataset-name-upload-tr")
      .classList.remove("hidden");
    const datasetNameUploadText = document.getElementById(
      "guided-dataset-name-upload-text"
    );
    datasetNameUploadText.innerHTML = "Creating dataset...";

    guidedUploadStatusIcon("guided-dataset-name-upload-status", "loading");

    try {
      let bf_new_dataset = await client.post(
        `/manage_datasets/datasets`,
        {
          input_dataset_name: datasetName,
        },
        {
          params: {
            selected_account: bfAccount,
          },
        }
      );
      let res = bf_new_dataset.data.id;
      datasetNameUploadText.innerHTML = `Successfully created dataset with name: ${datasetName}`;
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        res,
        datasetName
      );
      guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
      refreshDatasetList();
      addNewDatasetToList(datasetName);
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);

      datasetNameUploadText.innerHTML = "Failed to create a new dataset.";

      if (emessage == "Dataset name already exists") {
        datasetNameUploadText.innerHTML = `A dataset with the name <b>${datasetName}</b> already exists on Pennsieve.<br />
          Please rename your dataset and try again.`;
        document.getElementById(
          "guided-dataset-name-upload-status"
        ).innerHTML = `
          <button
            class="ui positive button guided--button"
            id="guided-button-rename-dataset"
            style="
              margin: 5px !important;
              background-color: var(--color-light-green) !important;
              width: 140px !important;
            "
          >
            Rename dataset
          </button>
        `;
        //add an on-click handler to the added button
        $("#guided-button-rename-dataset").on("click", () => {
          openGuidedDatasetRenameSwal();
        });
      }
      Swal.fire({
        title: `Failed to create a new dataset.`,
        text: emessage,
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      throw emessage;
    }
  };

  const guidedAddDatasetSubtitle = async (
    bfAccount,
    datasetName,
    datasetSubtitle
  ) => {
    document
      .getElementById("guided-dataset-subtitle-upload-tr")
      .classList.remove("hidden");
    const datasetSubtitleUploadText = document.getElementById(
      "guided-dataset-subtitle-upload-text"
    );
    datasetSubtitleUploadText.innerHTML = "Adding dataset subtitle...";
    guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "loading");

    try {
      await client.put(
        `/manage_datasets/bf_dataset_subtitle`,
        {
          input_subtitle: datasetSubtitle,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetSubtitleUploadText.innerHTML = `Successfully added dataset subtitle: ${datasetSubtitle}`;
      guidedUploadStatusIcon(
        "guided-dataset-subtitle-upload-status",
        "success"
      );
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetSubtitleUploadText.innerHTML = "Failed to add a dataset subtitle.";
      guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "error");
    }
  };

  const guidedAddDatasetDescription = async (
    bfAccount,
    datasetName,
    studyPurpose,
    dataCollection,
    dataConclusion
  ) => {
    document
      .getElementById("guided-dataset-description-upload-tr")
      .classList.remove("hidden");
    const datasetDescriptionUploadText = document.getElementById(
      "guided-dataset-description-upload-text"
    );
    datasetDescriptionUploadText.innerHTML = "Adding dataset description...";
    guidedUploadStatusIcon(
      "guided-dataset-description-upload-status",
      "loading"
    );

    let descriptionArray = [];

    descriptionArray.push("**Study Purpose:** " + studyPurpose + "\n\n");
    descriptionArray.push("**Data Collection:** " + dataCollection + "\n\n");
    descriptionArray.push("**Data Conclusion:** " + dataConclusion + "\n\n");

    const description = descriptionArray.join("");

    try {
      let res = await client.put(
        `/manage_datasets/datasets/${datasetName}/readme`,
        { updated_readme: description },
        { params: { selected_account: bfAccount } }
      );

      datasetDescriptionUploadText.innerHTML = `Successfully added dataset description!`;
      guidedUploadStatusIcon(
        "guided-dataset-description-upload-status",
        "success"
      );
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetDescriptionUploadText.innerHTML =
        "Failed to add a dataset description.";
      guidedUploadStatusIcon(
        "guided-dataset-description-upload-status",
        "error"
      );
    }
  };
  const guidedAddDatasetBannerImage = async (
    bfAccount,
    datasetName,
    bannerImagePath
  ) => {
    document

      .getElementById("guided-dataset-banner-image-upload-tr")
      .classList.remove("hidden");
    const datasetBannerImageUploadText = document.getElementById(
      "guided-dataset-banner-image-upload-text"
    );
    datasetBannerImageUploadText.innerHTML = "Adding dataset banner image...";
    guidedUploadStatusIcon(
      "guided-dataset-banner-image-upload-status",
      "loading"
    );

    try {
      await client.put(
        `/manage_datasets/bf_banner_image`,
        {
          input_banner_image_path: bannerImagePath,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetBannerImageUploadText.innerHTML = `Successfully added dataset banner image!`;
      guidedUploadStatusIcon(
        "guided-dataset-banner-image-upload-status",
        "success"
      );
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetBannerImageUploadText.innerHTML =
        "Failed to add a dataset banner image.";
      guidedUploadStatusIcon(
        "guided-dataset-banner-image-upload-status",
        "error"
      );
    }
  };
  const guidedAddDatasetLicense = async (
    bfAccount,
    datasetName,
    datasetLicense
  ) => {
    document

      .getElementById("guided-dataset-license-upload-tr")
      .classList.remove("hidden");
    const datasetLicenseUploadText = document.getElementById(
      "guided-dataset-license-upload-text"
    );
    datasetLicenseUploadText.innerHTML = "Adding dataset license...";
    guidedUploadStatusIcon("guided-dataset-license-upload-status", "loading");

    try {
      await client.put(
        `/manage_datasets/bf_license`,
        {
          input_license: datasetLicense,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetLicenseUploadText.innerHTML = `Successfully added dataset license: ${datasetLicense}`;
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetLicenseUploadText.innerHTML = "Failed to add a dataset license.";
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "error");
    }
  };

  const guidedAddPiOwner = async (bfAccount, datasetName, piOwnerObj) => {
    let loggedInUserIsNotPiOwner;
    for (user of sodaJSONObj["digital-metadata"]["user-permissions"]) {
      if (user.loggedInUser) {
        //if logged in user has a user permission, then someone else is set as pi owner
        loggedInUserIsNotPiOwner = true;
      }
    }

    document
      .getElementById("guided-dataset-pi-owner-upload-tr")
      .classList.remove("hidden");
    const datasetPiOwnerUploadText = document.getElementById(
      "guided-dataset-pi-owner-upload-text"
    );
    datasetPiOwnerUploadText.innerHTML = "Adding PI owner...";
    guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "loading");

    if (loggedInUserIsNotPiOwner) {
      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "owner",
          },
          {
            params: {
              selected_account: bfAccount,
              selected_dataset: datasetName,
              scope: "user",
              name: piOwnerObj["UUID"],
            },
          }
        );
        datasetPiOwnerUploadText.innerHTML = `Successfully added PI: ${piOwnerObj["name"]}`;
        guidedUploadStatusIcon(
          "guided-dataset-pi-owner-upload-status",
          "success"
        );
      } catch (error) {
        console.error(error);
        let emessage = userErrorMessage(error);
        datasetPiOwnerUploadText.innerHTML = "Failed to add a PI owner.";
        guidedUploadStatusIcon(
          "guided-dataset-pi-owner-upload-status",
          "error"
        );
      }
    } else {
      datasetPiOwnerUploadText.innerHTML = `Successfully added PI: ${piOwnerObj["name"]}`;
      guidedUploadStatusIcon(
        "guided-dataset-pi-owner-upload-status",
        "success"
      );
    }
  };

  const guidedAddDatasetTags = async (bfAccount, datasetName, tags) => {
    document
      .getElementById("guided-dataset-tags-upload-tr")
      .classList.remove("hidden");
    const datasetTagsUploadText = document.getElementById(
      "guided-dataset-tags-upload-text"
    );
    datasetTagsUploadText.innerHTML = "Adding dataset tags...";
    guidedUploadStatusIcon("guided-dataset-tags-upload-status", "loading");

    try {
      await client.put(
        `/manage_datasets/datasets/${datasetName}/tags`,
        { tags },
        {
          params: {
            selected_account: bfAccount,
          },
        }
      );

      datasetTagsUploadText.innerHTML = `Successfully added dataset tags: ${tags.join(
        ", "
      )}`;
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetTagsUploadText.innerHTML = "Failed to add dataset tags.";
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "error");
    }
  };
  const guidedGrantUserPermission = async (
    bfAccount,
    datasetName,
    userName,
    userUUID,
    selectedRole
  ) => {
    log.info("Adding a permission for a user on a dataset");

    const userPermissionUploadElement = `
        <tr id="guided-dataset-${userUUID}-permissions-upload-tr" class="permissions-upload-tr">
          <td class="middle aligned" id="guided-dataset-${userUUID}-permissions-upload-text">
            Granting ${userName} ${selectedRole} permissions...
          </td>
          <td class="middle aligned text-center collapsing border-left-0 p-0">
            <div
              class="guided--container-upload-status"
              id="guided-dataset-${userUUID}-permissions-upload-status"
            ></div>
          </td>
        </tr>
      `;

    //apend the upload element to the end of the table body
    document
      .getElementById("guided-tbody-pennsieve-metadata-upload")
      .insertAdjacentHTML("beforeend", userPermissionUploadElement);

    const userPermissionUploadStatusText = document.getElementById(
      `guided-dataset-${userUUID}-permissions-upload-text`
    );

    guidedUploadStatusIcon(
      `guided-dataset-${userUUID}-permissions-upload-status`,
      "loading"
    );

    try {
      let bf_add_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
            scope: "user",
            name: userUUID,
          },
        }
      );
      guidedUploadStatusIcon(
        `guided-dataset-${userUUID}-permissions-upload-status`,
        "success"
      );
      userPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to user: ${userName}`;
      log.info(`${selectedRole} permissions granted to ${userName}`);
    } catch (error) {
      guidedUploadStatusIcon(
        `guided-dataset-${userUUID}-permissions-upload-status`,
        "error"
      );
      userPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${userName}`;
      log.error(error);
      console.error(error);
      let emessage = userError(error);
      throw error;
    }
  };

  const guidedAddUserPermissions = async (
    bfAccount,
    datasetName,
    userPermissionsArray
  ) => {
    //filter user permissions with loggedInUser key
    const promises = userPermissionsArray.map((userPermission) => {
      return guidedGrantUserPermission(
        bfAccount,
        datasetName,
        userPermission.userName,
        userPermission.UUID,
        userPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
  };

  const guidedGrantTeamPermission = async (
    bfAccount,
    datasetName,
    teamUUID,
    teamString,
    selectedRole
  ) => {
    const teamPermissionUploadElement = `
      <tr id="guided-dataset-${teamString}-permissions-upload-tr" class="permissions-upload-tr">
        <td class="middle aligned" id="guided-dataset-${teamString}-permissions-upload-text">
          Granting ${teamString} ${selectedRole} permissions.
        </td>
        <td class="middle aligned text-center collapsing border-left-0 p-0">
          <div
            class="guided--container-upload-status"
            id="guided-dataset-${teamString}-permissions-upload-status"
          ></div>
        </td>
      </tr>
    `;

    //apend the upload element to the end of the table body
    document
      .getElementById("guided-tbody-pennsieve-metadata-upload")
      .insertAdjacentHTML("beforeend", teamPermissionUploadElement);

    const teamPermissionUploadStatusText = document.getElementById(
      `guided-dataset-${teamString}-permissions-upload-text`
    );
    guidedUploadStatusIcon(
      `guided-dataset-${teamString}-permissions-upload-status`,
      "loading"
    );

    try {
      let bf_add_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
            scope: "team",
            name: teamUUID,
          },
        }
      );
      guidedUploadStatusIcon(
        `guided-dataset-${teamString}-permissions-upload-status`,
        "success"
      );
      teamPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to team: ${teamString}`;
      log.info(`${selectedRole} permissions granted to ${teamString}`);
    } catch (error) {
      guidedUploadStatusIcon(
        `guided-dataset-${teamString}-permissions-upload-status`,
        "error"
      );
      teamPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${teamString}`;
      log.error(error);
      console.error(error);
      let emessage = userError(error);
      throw error;
    }
  };

  const guidedAddTeamPermissions = async (
    bfAccount,
    datasetName,
    teamPermissionsArray
  ) => {
    const promises = teamPermissionsArray.map((teamPermission) => {
      return guidedGrantTeamPermission(
        bfAccount,
        datasetName,
        teamPermission.UUID,
        teamPermission.teamString,
        teamPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
  };

  $("#guided-button-preview-folder-structure").on("click", () => {
    Swal.fire({
      title: "Dataset folder structure preview",
      width: 800,
      html: `<div id="guided-folder-structure-preview" style="display: block; width: 100%;"></div>`,
    });
    var folderStructurePreview = document.getElementById(
      "guided-folder-structure-preview"
    );

    $(folderStructurePreview).jstree({
      core: {
        check_callback: true,
        data: {},
      },
      plugins: ["types"],
      types: {
        folder: {
          icon: "fas fa-folder fa-fw",
        },
        "folder open": {
          icon: "fas fa-folder-open fa-fw",
        },
        "folder closed": {
          icon: "fas fa-folder fa-fw",
        },
        "file xlsx": {
          icon: "./assets/img/excel-file.png",
        },
        "file xls": {
          icon: "./assets/img/excel-file.png",
        },
        "file png": {
          icon: "./assets/img/png-file.png",
        },
        "file PNG": {
          icon: "./assets/img/png-file.png",
        },
        "file pdf": {
          icon: "./assets/img/pdf-file.png",
        },
        "file txt": {
          icon: "./assets/img/txt-file.png",
        },
        "file csv": {
          icon: "./assets/img/csv-file.png",
        },
        "file CSV": {
          icon: "./assets/img/csv-file.png",
        },
        "file DOC": {
          icon: "./assets/img/doc-file.png",
        },
        "file DOCX": {
          icon: "./assets/img/doc-file.png",
        },
        "file docx": {
          icon: "./assets/img/doc-file.png",
        },
        "file doc": {
          icon: "./assets/img/doc-file.png",
        },
        "file jpeg": {
          icon: "./assets/img/jpeg-file.png",
        },
        "file JPEG": {
          icon: "./assets/img/jpeg-file.png",
        },
        "file other": {
          icon: "./assets/img/other-file.png",
        },
      },
    });
    $(folderStructurePreview).on("open_node.jstree", function (event, data) {
      data.instance.set_type(data.node, "folder open");
    });
    $(folderStructurePreview).on("close_node.jstree", function (event, data) {
      data.instance.set_type(data.node, "folder closed");
    });
    guidedShowTreePreview(
      sodaJSONObj["digital-metadata"]["name"],
      folderStructurePreview
    );

    const folderPage = CURRENT_PAGE.attr("id");
    if (folderPage === "guided-subjects-folder-tab") {
      //open jsTree to correct folder
      $(folderStructurePreview)
        .jstree(true)
        .open_node($(folderStructurePreview).jstree(true).get_node("#"));
    }
  });

  //const add_dataset_permission = async();

  //********************************************************************************************************

  const guidedUploadSubjectsMetadata = async (
    bfAccount,
    datasetName,
    subjectsTableData
  ) => {
    document
      .getElementById("guided-subjects-metadata-upload-tr")
      .classList.remove("hidden");
    const subjectsMetadataUploadText = document.getElementById(
      "guided-subjects-metadata-upload-text"
    );
    subjectsMetadataUploadText.innerHTML = "Uploading subjects metadata...";
    guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "loading");

    try {
      await client.post(
        `/prepare_metadata/subjects_file`,
        {
          filepath: "",
          selected_account: bfAccount,
          selected_dataset: datasetName,
          subjects_header_row: subjectsTableData,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon(
        "guided-subjects-metadata-upload-status",
        "success"
      );
      subjectsMetadataUploadText.innerHTML = `Subjects metadata successfully uploaded`;
    } catch (error) {
      guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "error");
      subjectsMetadataUploadText.innerHTML = `Failed to upload subjects metadata`;
      clientError(error);
    }
  };
  const guidedUploadSamplesMetadata = async (
    bfAccount,
    datasetName,
    samplesTableData
  ) => {
    document
      .getElementById("guided-samples-metadata-upload-tr")
      .classList.remove("hidden");
    const samplesMetadataUploadText = document.getElementById(
      "guided-samples-metadata-upload-text"
    );
    samplesMetadataUploadText.innerHTML = "Uploading samples metadata...";
    guidedUploadStatusIcon("guided-samples-metadata-upload-status", "loading");
    try {
      await client.post(
        `/prepare_metadata/samples_file`,
        {
          filepath: "",
          selected_account: bfAccount,
          selected_dataset: datasetName,
          samples_str: samplesTableData,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon(
        "guided-samples-metadata-upload-status",
        "success"
      );
      samplesMetadataUploadText.innerHTML = `Samples metadata successfully uploaded`;
    } catch (error) {
      guidedUploadStatusIcon("guided-samples-metadata-upload-status", "error");
      samplesMetadataUploadText.innerHTML = `Failed to upload samples metadata`;
      clientError(error);
    }
  };
  const guidedUploadSubmissionMetadata = async (
    bfAccount,
    datasetName,
    submissionMetadataJSON
  ) => {
    document
      .getElementById("guided-submission-metadata-upload-tr")
      .classList.remove("hidden");
    const submissionMetadataUploadText = document.getElementById(
      "guided-submission-metadata-upload-text"
    );
    submissionMetadataUploadText.innerHTML = "Uploading submission metadata...";
    guidedUploadStatusIcon(
      "guided-submission-metadata-upload-status",
      "loading"
    );

    try {
      await client.post(
        `/prepare_metadata/submission_file`,
        {
          submission_file_rows: submissionMetadataJSON,
          filepath: "",
          upload_boolean: true,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      guidedUploadStatusIcon(
        "guided-submission-metadata-upload-status",
        "success"
      );
      submissionMetadataUploadText.innerHTML = `Submission metadata successfully uploaded`;
    } catch (error) {
      guidedUploadStatusIcon(
        "guided-submission-metadata-upload-status",
        "error"
      );
      submissionMetadataUploadText.innerHTML = `Failed to upload submission metadata`;
      clientError(error);
    }
  };

  const guidedUploadDatasetDescriptionMetadata = async (
    bfAccount,
    datasetName,
    datasetInformation,
    studyInformation,
    contributorInformation,
    additionalLinks
  ) => {
    document
      .getElementById("guided-dataset-description-metadata-upload-tr")
      .classList.remove("hidden");
    const datasetDescriptionMetadataUploadText = document.getElementById(
      "guided-dataset-description-metadata-upload-text"
    );
    datasetDescriptionMetadataUploadText.innerHTML =
      "Uploading dataset description metadata...";
    guidedUploadStatusIcon(
      "guided-dataset-description-metadata-upload-status",
      "loading"
    );

    try {
      await client.post(
        `/prepare_metadata/dataset_description_file`,
        {
          selected_account: bfAccount,
          selected_dataset: datasetName,
          filepath: "",
          dataset_str: datasetInformation,
          study_str: studyInformation,
          contributor_str: contributorInformation,
          related_info_str: additionalLinks,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon(
        "guided-dataset-description-metadata-upload-status",
        "success"
      );
      datasetDescriptionMetadataUploadText.innerHTML =
        "Dataset description metadata successfully uploaded";
    } catch (error) {
      guidedUploadStatusIcon(
        "guided-dataset-description-metadata-upload-status",
        "error"
      );
      datasetDescriptionMetadataUploadText.innerHTML = `Failed to upload dataset description metadata`;
      clientError(error);
    }
  };

  const guidedUploadREADMEorCHANGESMetadata = async (
    bfAccount,
    datasetName,
    readmeORchanges, //lowercase file type
    readmeOrChangesMetadata
  ) => {
    document
      .getElementById(`guided-${readmeORchanges}-metadata-upload-tr`)
      .classList.remove("hidden");
    const datasetDescriptionMetadataUploadText = document.getElementById(
      `guided-${readmeORchanges}-metadata-upload-text`
    );
    datasetDescriptionMetadataUploadText.innerHTML = `Uploading ${readmeORchanges.toUpperCase()} metadata...`;
    guidedUploadStatusIcon(
      `guided-${readmeORchanges}-metadata-upload-status`,
      "loading"
    );
    try {
      await client.post(
        "/prepare_metadata/readme_changes_file",
        {
          text: readmeOrChangesMetadata,
        },
        {
          params: {
            file_type: `${readmeORchanges.toUpperCase()}.txt`,
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      guidedUploadStatusIcon(
        `guided-${readmeORchanges}-metadata-upload-status`,
        "success"
      );
      datasetDescriptionMetadataUploadText.innerHTML = `${readmeORchanges.toUpperCase()} metadata successfully uploaded`;
    } catch (error) {
      guidedUploadStatusIcon(
        `guided-${readmeORchanges}-metadata-upload-status`,
        "error"
      );
      datasetDescriptionMetadataUploadText.innerHTML = `Failed to upload ${readmeORchanges.toUpperCase()} metadata`;
      clientError(error);
    }
  };

  const guidedPennsieveDatasetUpload = async () => {
    const guidedBfAccount = defaultBfAccount;
    const guidedDatasetName = sodaJSONObj["digital-metadata"]["name"];
    const guidedDatasetSubtitle = sodaJSONObj["digital-metadata"]["subtitle"];
    const guidedUsers = sodaJSONObj["digital-metadata"]["user-permissions"];
    const guidedPIOwner = sodaJSONObj["digital-metadata"]["pi-owner"];
    const guidedTeams = sodaJSONObj["digital-metadata"]["team-permissions"];
    let guidedPennsieveStudyPurpose =
      sodaJSONObj["digital-metadata"]["description"]["study-purpose"];
    let guidedPennsieveDataCollection =
      sodaJSONObj["digital-metadata"]["description"]["data-collection"];
    let guidedPennsievePrimaryConclusion =
      sodaJSONObj["digital-metadata"]["description"]["primary-conclusion"];
    const guidedReadMe = sodaJSONObj["dataset-metadata"]["README"];
    const guidedTags = sodaJSONObj["digital-metadata"]["dataset-tags"];
    const guidedLicense = sodaJSONObj["digital-metadata"]["license"];
    const guidedBannerImagePath =
      sodaJSONObj["digital-metadata"]["banner-image-path"];

    //Subjects Metadata Variables
    const guidedSubjectsMetadata = sodaJSONObj["subjects-table-data"];

    //Samples Metadata variables
    const guidedSamplesMetadata = sodaJSONObj["samples-table-data"];

    //Submission Metadata variables
    const guidedSparcAward =
      sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    const guidedMilestones =
      sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
    const guidedCompletionDate =
      sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];
    let guidedSubmissionMetadataJSON = [];
    guidedSubmissionMetadataJSON.push({
      award: guidedSparcAward,
      date: guidedCompletionDate,
      milestone: guidedMilestones[0],
    });
    for (let i = 1; i < guidedMilestones.length; i++) {
      guidedSubmissionMetadataJSON.push({
        award: "",
        date: "",
        milestone: guidedMilestones[i],
      });
    }

    //Dataset Description Metadata variables
    const guidedDatasetInformation =
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "dataset-information"
      ];

    const guidedStudyInformation =
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "study-information"
      ];

    let guidedContributorInformation = {
      ...sodaJSONObj["dataset-metadata"]["description-metadata"][
        "contributor-information"
      ],
    };

    //add the SPARC award as the first element in the funding source array if it's not already in the funding array
    if (!guidedContributorInformation["funding"].includes(guidedSparcAward)) {
      guidedContributorInformation["funding"].unshift(guidedSparcAward);
    }

    //Add contributors from sodaJSONObj to guidedContributorInformation in the "contributors" key
    let contributors =
      sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

    guidedContributorInformation["contributors"] = contributors.map(
      (contributor) => {
        return {
          conAffliation: contributor["conAffliation"].join(", "),
          conID: contributor["conID"],
          conName: contributor["conName"],
          conRole: contributor["conRole"].join(", "),
          contributorFirstName: contributor["contributorFirstName"],
          contributorLastName: contributor["contributorLastName"],
        };
      }
    );

    const guidedAdditionalLinks =
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "additional-links"
      ];

    //README and CHANGES Metadata variables
    const guidedReadMeMetadata = sodaJSONObj["dataset-metadata"]["README"];
    const guidedChangesMetadata = sodaJSONObj["dataset-metadata"]["CHANGES"];

    try {
      // get apps base path
      const basepath = app.getAppPath();
      const resourcesPath = process.resourcesPath;

      // set the templates path
      try {
        await client.put("prepare_metadata/template_paths", {
          basepath: basepath,
          resourcesPath: resourcesPath,
        });
      } catch (error) {
        clientError(error);
        ipcRenderer.send("track-event", "Error", "Setting Templates Path");
        return;
      }
      //Run ple flight checks to ensure SODA is prepared to upload to Pennsieve
      let supplementary_checks = await run_pre_flight_checks(false);

      // set the templates path
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }

      //Display the Pennsieve metadata upload table
      unHideAndSmoothScrollToElement(
        "guided-div-pennsieve-metadata-upload-status-table"
      );

      let datasetUploadResponse = await guidedCreateDataset(
        guidedBfAccount,
        guidedDatasetName
      );

      try {
        //upload dataset subtitle
        let datasetSubtitleUploadResponse = await guidedAddDatasetSubtitle(
          guidedBfAccount,
          guidedDatasetName,
          guidedDatasetSubtitle
        );
      } catch (error) {
        clientError(error);
      }

      let datasetDescriptionResponse = await guidedAddDatasetDescription(
        guidedBfAccount,
        guidedDatasetName,
        guidedPennsieveStudyPurpose,
        guidedPennsieveDataCollection,
        guidedPennsievePrimaryConclusion
      );

      let datasetBannerImageResponse = await guidedAddDatasetBannerImage(
        guidedBfAccount,
        guidedDatasetName,
        guidedBannerImagePath
      );

      let datasetLicenseResponse = await guidedAddDatasetLicense(
        guidedBfAccount,
        guidedDatasetName,
        guidedLicense
      );

      let datasetTagsResponse = await guidedAddDatasetTags(
        guidedBfAccount,
        guidedDatasetName,
        guidedTags
      );

      let datasetPIOwnwerResponse = await guidedAddPiOwner(
        guidedBfAccount,
        guidedDatasetName,
        guidedPIOwner
      );

      let datasetUsersResponse = await guidedAddUserPermissions(
        guidedBfAccount,
        guidedDatasetName,
        guidedUsers
      );
      let datasetTeamsResponse = await guidedAddTeamPermissions(
        guidedBfAccount,
        guidedDatasetName,
        guidedTeams
      );

      //Display the Dataset metadata upload table
      unHideAndSmoothScrollToElement(
        "guided-div-dataset-metadata-upload-status-table"
      );

      if (guidedSubjectsMetadata.length > 0) {
        await guidedUploadSubjectsMetadata(
          guidedBfAccount,
          guidedDatasetName,
          guidedSubjectsMetadata
        );
      }
      if (guidedSamplesMetadata.length > 0) {
        await guidedUploadSamplesMetadata(
          guidedBfAccount,
          guidedDatasetName,
          guidedSamplesMetadata
        );
      }

      let submissionMetadataRes = await guidedUploadSubmissionMetadata(
        guidedBfAccount,
        guidedDatasetName,
        guidedSubmissionMetadataJSON
      );

      let descriptionMetadataRes = await guidedUploadDatasetDescriptionMetadata(
        guidedBfAccount,
        guidedDatasetName,
        guidedDatasetInformation,
        guidedStudyInformation,
        guidedContributorInformation,
        guidedAdditionalLinks
      );

      let readMeMetadataRes = await guidedUploadREADMEorCHANGESMetadata(
        guidedBfAccount,
        guidedDatasetName,
        "readme",
        guidedReadMeMetadata
      );

      if (guidedChangesMetadata.length > 0) {
        let changesMetadataRes = await guidedUploadREADMEorCHANGESMetadata(
          guidedBfAccount,
          guidedDatasetName,
          "changes",
          guidedChangesMetadata
        );
      }

      //Display the main dataset upload progress bar
      unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

      //Upload the dataset files
      const mainCurationResponse = await guided_main_curate();
    } catch (e) {
      console.log(e);
    }
  };
  const openGuidedDatasetRenameSwal = async () => {
    const currentDatasetUploadName = sodaJSONObj["digital-metadata"]["name"];

    const { value: newDatasetName } = await Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      title: "Rename your dataset",
      html: `<b>Current dataset name:</b> ${currentDatasetUploadName}<br /><br />Enter a new name for your dataset below:`,
      input: "text",
      inputPlaceholder: "Enter a new name for your dataset",
      inputAttributes: {
        autocapitalize: "off",
      },
      inputValue: currentDatasetUploadName,
      showCancelButton: true,
      confirmButtonText: "Rename",
      confirmButtonColor: "#3085d6 !important",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      preConfirm: (inputValue) => {
        if (inputValue === "") {
          Swal.showValidationMessage("Please enter a name for your dataset!");
          return false;
        }
        if (inputValue === currentDatasetUploadName) {
          Swal.showValidationMessage(
            "Please enter a new name for your dataset!"
          );
          return false;
        }
      },
    });
    if (newDatasetName) {
      sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
      guidedPennsieveDatasetUpload();
    }
  };

  const guided_initiate_generate = async () => {
    // Initiate curation by calling Python function
    let manifest_files_requested = false;
    let main_curate_status = "Solving";
    let main_total_generate_dataset_size;

    // track the amount of files that have been uploaded/generated
    let uploadedFiles = 0;
    let uploadedFilesSize = 0;
    let foldersUploaded = 0;
    let previousUploadedFileSize = 0;
    let increaseInFileSize = 0;
    let generated_dataset_id = undefined;

    let dataset_name;
    let dataset_destination;

    if (sodaJSONObj["generate-dataset"]["destination"] == "bf") {
      sodaJSONObj["generate-dataset"]["generate-option"] = "new";
      //Replace files and folders since guided mode always uploads to an existing Pennsieve dataset
      sodaJSONObj["generate-dataset"]["if-existing"] = "replace";
      sodaJSONObj["generate-dataset"]["if-existing-files"] = "replace";
      dataset_name = sodaJSONObj["digital-metadata"]["name"];
      sodaJSONObj["bf-dataset-selected"] = {};
      sodaJSONObj["bf-dataset-selected"]["dataset-name"] = dataset_name;
      sodaJSONObj["bf-account-selected"]["account-name"] = defaultBfAccount;
      dataset_destination = "Pennsieve";
    }

    // if uploading to Pennsieve start a tracking session for the dataset upload
    if (dataset_destination == "Pennsieve") {
      // create a dataset upload session
      datasetUploadSession.startSession();
    }

    // clear the Pennsieve Queue (added to Renderer side for Mac users that are unable to clear the queue on the Python side)
    clearQueue();

    client
      .post(
        `/curate_datasets/curation`,
        {
          soda_json_structure: sodaJSONObj,
        },
        { timeout: 0 }
      )
      .then(async (curationRes) => {
        main_total_generate_dataset_size =
          curationRes["main_total_generate_dataset_size"];
        uploadedFiles = curationRes["main_curation_uploaded_files"];
        $("#sidebarCollapse").prop("disabled", false);
        log.info("Completed curate function");

        // log relevant curation details about the dataset generation/Upload to Google Analytics
        logCurationSuccessToAnalytics(
          manifest_files_requested,
          main_total_generate_dataset_size,
          dataset_name,
          dataset_destination,
          uploadedFiles,
          true
        );

        try {
          let responseObject = await client.get(
            `manage_datasets/bf_dataset_account`,
            {
              params: {
                selected_account: defaultBfAccount,
              },
            }
          );
          datasetList = [];
          datasetList = responseObject.data.datasets;
        } catch (error) {
          clientError(error);
        }
      })
      .catch(async (error) => {
        clientError(error);

        try {
          let responseObject = await client.get(
            `manage_datasets/bf_dataset_account`,
            {
              params: {
                selected_account: defaultBfAccount,
              },
            }
          );
          datasetList = [];
          datasetList = responseObject.data.datasets;
        } catch (error) {
          clientError(error);
        }

        // wait to see if the uploaded files or size will grow once the client has time to ask for the updated information
        // if they stay zero that means nothing was uploaded
        if (uploadedFiles === 0 || uploadedFilesSize === 0) {
          await wait(2000);
        }

        // log the curation errors to Google Analytics
        logCurationErrorsToAnalytics(
          uploadedFiles,
          uploadedFilesSize,
          dataset_destination,
          main_total_generate_dataset_size,
          increaseInFileSize,
          datasetUploadSession,
          true
        );
      });

    const guidedUpdateUploadStatus = async () => {
      let mainCurationProgressResponse;
      try {
        mainCurationProgressResponse = await client.get(
          `/curate_datasets/curation/progress`
        );
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);
        console.error(error);
        //Clear the interval to stop the generation of new sweet alerts after intitial error
        clearInterval(timerProgress);
        return;
      }

      let { data } = mainCurationProgressResponse;

      main_curate_status = data["main_curate_status"];
      const start_generate = data["start_generate"];
      const main_curate_progress_message = data["main_curate_progress_message"];
      main_total_generate_dataset_size =
        data["main_total_generate_dataset_size"];
      const main_generated_dataset_size = data["main_generated_dataset_size"];
      const elapsed_time_formatted = data["elapsed_time_formatted"];

      if (start_generate === 1) {
        $("#guided-progress-bar-new-curate").css("display", "block");
        //Case when the dataset upload is complete
        if (main_curate_progress_message.includes("Success: COMPLETED!")) {
          setGuidedProgressBarValue(100);
        } else {
          const percentOfDatasetUploaded =
            (main_generated_dataset_size / main_total_generate_dataset_size) *
            100;
          setGuidedProgressBarValue(percentOfDatasetUploaded);

          let totalSizePrint;
          if (main_total_generate_dataset_size < displaySize) {
            totalSizePrint = main_total_generate_dataset_size.toFixed(2) + " B";
          } else if (
            main_total_generate_dataset_size <
            displaySize * displaySize
          ) {
            totalSizePrint =
              (main_total_generate_dataset_size / displaySize).toFixed(2) +
              " KB";
          } else if (
            main_total_generate_dataset_size <
            displaySize * displaySize * displaySize
          ) {
            totalSizePrint =
              (
                main_total_generate_dataset_size /
                displaySize /
                displaySize
              ).toFixed(2) + " MB";
          } else {
            totalSizePrint =
              (
                main_total_generate_dataset_size /
                displaySize /
                displaySize /
                displaySize
              ).toFixed(2) + " GB";
          }
          updateDatasetUploadProgressTable({
            "Upload status": `${main_curate_progress_message}`,
            "Percent uploaded": `${percentOfDatasetUploaded.toFixed(2)}%`,
            "Elapsed time": `${elapsed_time_formatted}`,
          });
        }
      } else {
        updateDatasetUploadProgressTable({
          "Upload status": `${main_curate_progress_message}`,
          "Elapsed time": `${elapsed_time_formatted}`,
        });
      }
      //If the curate function is complete, clear the interval
      if (main_curate_status === "Done") {
        $("#sidebarCollapse").prop("disabled", false);
        log.info("Done curate track");
        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
        updateDatasetUploadProgressTable({
          "Upload status": "Dataset successfully uploaded to Pennsieve!",
        });

        let allDatasets = await client.get(
          `manage_datasets/bf_dataset_account`,
          {
            params: {
              selected_account: defaultBfAccount,
            },
          }
        );
        const uploadedDataset = allDatasets.data.datasets.find(
          (dataset) => dataset.name === sodaJSONObj["digital-metadata"]["name"]
        );
        const uploadedDatasetID = uploadedDataset.id;

        //Save a copy of the sodaJSONObj on this upload to compare it while prepping other uploads
        sodaJSONObj["previous-guided-upload-dataset-name"] =
          sodaJSONObj["digital-metadata"]["name"];
        sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] =
          uploadedDatasetID;
        saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);

        //Display the click next text
        document
          .getElementById("guided-dataset-upload-complete-message")
          .classList.remove("hidden");

        scrollToBottomOfGuidedBody();

        //Show the next button
        $("#guided-next-button").css("visibility", "visible");

        /*const { value: goToShareWithCurationTeamPage } = await swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          icon: "success",
          title: "Dataset successfully uploaded to Pennsieve!",
          html: `<a href="https://app.pennsieve.io/N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0/datasets/${uploadedDatasetID}}/overview" target="_blank">Click here to view dataset on Pennsieve</a>
          <br /><br />
          `,
          confirmButtonText: "Next",
          allowOutsideClick: false,
        });
        if (goToShareWithCurationTeamPage) {
          traverseToTab("guided-dataset-dissemination-tab");
        } else {
          guidedUnLockSideBar();
          //exit to the home page
          traverseToTab("guided-dataset-starting-point-tab");
          hideSubNavAndShowMainNav("back");
          $("#guided-button-dataset-intro-back").click();
          $("#guided-button-dataset-intro-back").click();
        }*/
      }
    };
    // Progress tracking function for main curate
    var timerProgress = setInterval(guidedUpdateUploadStatus, 1000);

    // when generating a new dataset we need to add its ID to the ID -> Name mapping
    // we need to do this only once
    let loggedDatasetNameToIdMapping = false;

    // if uploading to Pennsieve set an interval that gets the amount of files that have been uploaded
    // and their aggregate size; starts for local dataset generation as well. Provides easy way to track amount of
    // files copied and their aggregate size.
    // IMP: This handles tracking a session that tracking a session that had a successful Pennsieve upload.
    //      therefore it is unnecessary to have logs for Session ID tracking in the "api_main_curate" success block
    // IMP: Two reasons this exists:
    //    1. Pennsieve Agent can freeze. This prevents us from logging. So we log a Pennsieve dataset upload session as it happens.
    //    2. Local dataset generation and Pennsieve dataset generation can fail. Having access to how many files and their aggregate size for logging at error time is valuable data.
    const checkForBucketUpload = async () => {
      // ask the server for the amount of files uploaded in the current session
      // nothing to log for uploads where a user is solely deleting files in this section

      let mainCurationDetailsResponse;
      try {
        mainCurationDetailsResponse = await client.get(
          `/curate_datasets/curation/upload_details`
        );
      } catch (error) {
        clientError(error);
        clearInterval(timerCheckForBucketUpload);
        return;
      }

      let { data } = mainCurationDetailsResponse;

      // check if the amount of successfully uploaded files has increased
      if (
        data["main_curation_uploaded_files"] > 0 &&
        data["uploaded_folder_counter"] > foldersUploaded
      ) {
        previousUploadedFileSize = uploadedFilesSize;
        uploadedFiles = data["main_curation_uploaded_files"];
        uploadedFilesSize = data["current_size_of_uploaded_files"];
        foldersUploaded = data["uploaded_folder_counter"];

        // log the increase in the file size
        increaseInFileSize = uploadedFilesSize - previousUploadedFileSize;

        // log the aggregate file count and size values when uploading to Pennsieve
        if (
          dataset_destination === "bf" ||
          dataset_destination === "Pennsieve"
        ) {
          // use the session id as the label -- this will help with aggregating the number of files uploaded per session
          ipcRenderer.send(
            "track-event",
            "Success",
            "Guided Mode - Generate - Dataset - Number of Files",
            `${datasetUploadSession.id}`,
            uploadedFiles
          );

          // use the session id as the label -- this will help with aggregating the size of the given upload session
          ipcRenderer.send(
            "track-event",
            "Success",
            "Guided Mode - Generate - Dataset - Size",
            `${datasetUploadSession.id}`,
            increaseInFileSize
          );
        }
      }

      //stop the inteval when the upload is complete
      if (main_curate_status === "Done") {
        clearInterval(timerCheckForBucketUpload);
      }
    };

    let timerCheckForBucketUpload = setInterval(checkForBucketUpload, 1000);
  };

  const guided_main_curate = async () => {
    // if the user chose to auto-generate manifest files, create the excel files in local storage
    // and add the paths to the manifest files in the datasetStructure object
    if (
      sodaJSONObj["button-config"]["manifest-files-generated-automatically"] ===
      "yes"
    ) {
      /**
       * If the user has selected to auto-generate manifest files,
       * grab the manifest data for each high level folder, create an excel file
       * using the manifest data, and add the excel file to the datasetStructureJSONObj
       */

      // First, empty the guided_manifest_files so we can add the new manifest files
      fs.emptyDirSync(guidedManifestFilePath);

      const guidedManifestData = sodaJSONObj["guided-manifest-files"];

      for (const [highLevelFolder, manifestData] of Object.entries(
        guidedManifestData
      )) {
        let manifestJSON = processManifestInfo(
          guidedManifestData[highLevelFolder]["headers"],
          guidedManifestData[highLevelFolder]["data"]
        );
        jsonManifest = JSON.stringify(manifestJSON);

        const manifestPath = path.join(
          guidedManifestFilePath,
          highLevelFolder,
          "manifest.xlsx"
        );

        fs.mkdirSync(path.join(guidedManifestFilePath, highLevelFolder), {
          recursive: true,
        });

        convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);

        datasetStructureJSONObj["folders"][highLevelFolder]["files"][
          "manifest.xlsx"
        ] = {
          action: ["new"],
          path: manifestPath,
          type: "local",
        };
      }
    }
    updateJSONStructureDSstructure();

    let emptyFilesFoldersResponse;
    try {
      emptyFilesFoldersResponse = await client.post(
        `/curate_datasets/empty_files_and_folders`,
        {
          soda_json_structure: sodaJSONObj,
        },
        { timeout: 0 }
      );
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      updateDatasetUploadProgressTable({
        "Error preparing dataset for upload": `${emessage}`,
      });

      $("#sidebarCollapse").prop("disabled", false);
      return;
    }

    let { data } = emptyFilesFoldersResponse;

    //bring duplicate outside
    error_files = data["empty_files"];
    error_folders = data["empty_folders"];

    let errorMessage = "";

    if (error_files.length > 0) {
      const error_message_files =
        backend_to_frontend_warning_message(error_files);
      errorMessage += error_message_files;
    }

    if (error_folders.length > 0) {
      const error_message_folders =
        backend_to_frontend_warning_message(error_folders);
      errorMessage += error_message_folders;
    }

    if (errorMessage) {
      errorMessage += "Would you like to continue?";
      errorMessage = "<div style='text-align: left'>" + errorMessage + "</div>";
      Swal.fire({
        icon: "warning",
        html: errorMessage,
        showCancelButton: true,
        cancelButtonText: "No, I want to review my files",
        focusCancel: true,
        confirmButtonText: "Yes, Continue",
        backdrop: "rgba(0,0,0, 0.4)",
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          guided_initiate_generate();
        } else {
          $("#sidebarCollapse").prop("disabled", false);
          updateDatasetUploadProgressTable({
            "Upload status": `Error uploading dataset to Pennsieve`,
          });
        }
      });
    } else {
      guided_initiate_generate();
    }
  };

  $("#guided-add-subject-button").on("click", () => {
    $("#guided-subjects-intro").hide();
    $("#guided-add-subject-div").show();
  });

  const getCheckedContributors = () => {
    const checkedContributors = document.querySelectorAll(
      "input[name='contributor']:checked"
    );
    const checkedContributorsArray = Array.from(checkedContributors);
    checkedContributorData = checkedContributorsArray.map(
      (checkedContributor) => {
        const tableRow =
          checkedContributor.parentElement.parentElement.parentElement;
        const contributorLastName = tableRow.children[1].innerHTML.trim();
        const contributorFirstName = tableRow.children[2].innerHTML.trim();
        return {
          contributorFirstName: contributorFirstName,
          contributorLastName: contributorLastName,
        };
      }
    );
    return checkedContributorData;
  };

  $("#guided-button-edit-protocol-fields").on("click", () => {
    enableElementById("protocols-container");
    enableElementById("guided-button-add-protocol");
    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-protocol-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-protocol-fields"
    ).style.display = "flex";
    unPulseNextButton();
  });
  $("#guided-button-save-other-link-fields").on("click", () => {
    let allInputsValid = true;
    //get all contributor fields
    const otherLinkFields = document.querySelectorAll(
      ".guided-other-links-field-container"
    );
    //check if contributorFields is empty
    if (otherLinkFields.length === 0) {
      notyf.error("Please add at least one other link");
      //Add a contributor field to help the user out a lil
      //addContributorField();
      return;
    }

    //loop through contributor fields and get values
    const otherLinkFieldsArray = Array.from(otherLinkFields);
    ///////////////////////////////////////////////////////////////////////////////
    otherLinkFieldsArray.forEach((otherLinkField) => {
      const linkUrl = otherLinkField.querySelector(
        ".guided-other-link-url-input"
      );
      const linkDescription = otherLinkField.querySelector(
        ".guided-other-link-description-input"
      );
      const linkRelation = otherLinkField.querySelector(
        ".guided-other-link-relation-dropdown"
      );

      const textInputs = [linkUrl, linkDescription];

      //check if all text inputs are valid
      textInputs.forEach((textInput) => {
        if (textInput.value === "") {
          textInput.style.setProperty("border-color", "red", "important");
          allInputsValid = false;
        } else {
          textInput.style.setProperty(
            "border-color",
            "hsl(0, 0%, 88%)",
            "important"
          );
        }
      });
      if (linkRelation.value === "Select") {
        linkRelation.style.setProperty("border-color", "red", "important");
        allInputsValid = false;
      } else {
        linkRelation.style.setProperty(
          "border-color",
          "hsl(0, 0%, 88%)",
          "important"
        );
      }
      const contributorInputObj = {
        linkUrl: linkUrl.value,
        linkDescription: linkDescription.value,
        linkRelation: linkRelation.value,
      };
    });
    ///////////////////////////////////////////////////////////////////////////////
    if (!allInputsValid) {
      notyf.error("Please fill out all link fields");
      return;
    }

    //set opacity and remove pointer events for table and show edit button
    disableElementById("other-links-container");
    disableElementById("guided-button-add-other-link");

    //switch button from save to edit
    document.getElementById(
      "guided-button-save-other-link-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-other-link-fields"
    ).style.display = "flex";
    pulseNextButton();
  });
  $("#guided-button-add-additional-link").on("click", async () => {
    openAddAdditionLinkSwal();
  });
  $("#guided-button-edit-other-link-fields").on("click", () => {
    enableElementById("other-links-container");
    enableElementById("guided-button-add-other-link");
    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-other-link-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-other-link-fields"
    ).style.display = "flex";
    unPulseNextButton();
  });

  function guidedGenerateRCFilesHelper(type) {
    var textValue = $(`#guided-textarea-create-${type}`).val().trim();
    if (textValue === "") {
      Swal.fire({
        title: "Incomplete information",
        text: "Plase fill in the textarea.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
        showCancelButton: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      return "empty";
    }
  }
  async function guidedSaveRCFile(type) {
    var result = guidedGenerateRCFilesHelper(type);
    if (result === "empty") {
      return;
    }
    var { value: continueProgress } = await Swal.fire({
      title: `Any existing ${type.toUpperCase()}.txt file in the specified location will be replaced.`,
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
    let data = $(`#guided-textarea-create-${type}`).val().trim();
    let destinationPath;
    if (type === "changes") {
      destinationPath = path.join(
        $("#guided-dataset-path").text().trim(),
        "CHANGES.xlsx"
      );
    } else {
      destinationPath = path.join(
        $("#guided-dataset-path").text().trim(),
        "README.xlsx"
      );
    }
    fs.writeFile(destinationPath, data, (err) => {
      if (err) {
        console.log(err);
        log.error(err);
        var emessage = userError(error);
        Swal.fire({
          title: `Failed to generate the existing ${type}.txt file`,
          html: emessage,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "error",
          didOpen: () => {
            Swal.hideLoading();
          },
        });
      } else {
        if (type === "changes") {
          var newName = path.join(path.dirname(destinationPath), "CHANGES.txt");
        } else {
          var newName = path.join(path.dirname(destinationPath), "README.txt");
        }
        fs.rename(destinationPath, newName, async (err) => {
          if (err) {
            console.log(err);
            log.error(err);
            Swal.fire({
              title: `Failed to generate the ${type}.txt file`,
              html: err,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              icon: "error",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
          } else {
            Swal.fire({
              title: `The ${type.toUpperCase()}.txt file has been successfully generated at the specified location.`,
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
          }
        });
      }
    });
  }
  $("#guided-generate-subjects-file").on("click", () => {
    addSubject("guided");
    clearAllSubjectFormFields(guidedSubjectsFormDiv);
  });
  $("#guided-generate-samples-file").on("click", () => {
    addSample("guided");
    returnToSampleMetadataTableFromSampleMetadataForm();
  });
  $("#guided-generate-submission-file").on("click", () => {
    guidedSaveSubmissionFile();
  });
  $("#guided-generate-readme-file").on("click", () => {
    guidedSaveRCFile("readme");
  });
  $("#guided-generate-changes-file").on("click", () => {
    guidedSaveRCFile("changes");
  });

  const guidedSaveDescriptionDatasetInformation = () => {
    const title = sodaJSONObj["digital-metadata"]["name"];
    const subtitle = sodaJSONObj["digital-metadata"]["subtitle"];
    let studyType = null;
    const selectedStudyTypeRadioButton = document.querySelector(
      "input[name='dataset-relation']:checked"
    );
    if (!selectedStudyTypeRadioButton) {
      throw "Please select a study type";
    } else {
      studyType = selectedStudyTypeRadioButton.value;
    }

    //get the keywords from the keywords textarea
    const keywordArray = getTagsFromTagifyElement(guidedDatasetKeywordsTagify);
    if (keywordArray.length < 3) {
      throw "Please enter at least 3 keywords";
    }

    //Get the count of all subjects in and outside of pools
    const [subjectsInPools, subjectsOutsidePools] =
      sodaJSONObj.getAllSubjects();
    const numSubjects = [...subjectsInPools, ...subjectsOutsidePools].length;

    //Get the count of all samples
    const [samplesInPools, samplesOutsidePools] =
      sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    const numSamples = [...samplesInPools, ...samplesOutsidePools].length;

    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "dataset-information"
    ] = {
      name: title,
      description: subtitle,
      type: studyType,
      keywords: keywordArray,
      "number of samples": numSamples,
      "number of subjects": numSubjects,
    };
  };

  const guidedSaveDescriptionStudyInformation = () => {
    const studyOrganSystemTags = getTagsFromTagifyElement(
      guidedStudyOrganSystemsTagify
    );
    const studyApproachTags = getTagsFromTagifyElement(
      guidedStudyApproachTagify
    );
    const studyTechniqueTags = getTagsFromTagifyElement(
      guidedStudyTechniquesTagify
    );

    const studyPurposeInput = document.getElementById(
      "guided-ds-study-purpose"
    );
    const studyDataCollectionInput = document.getElementById(
      "guided-ds-study-data-collection"
    );
    const studyPrimaryConclusionInput = document.getElementById(
      "guided-ds-study-primary-conclusion"
    );
    const studyCollectionTitleInput = document.getElementById(
      "guided-ds-study-collection-title"
    );
    //Initialize the study information variables
    let studyPurpose = null;
    let studyDataCollection = null;
    let studyPrimaryConclusion = null;
    let studyCollectionTitle = null;
    //Throw an error if any study information variables are not filled out
    if (!studyPurposeInput.value.trim()) {
      throw "Please add a study purpose";
    } else {
      studyPurpose = studyPurposeInput.value.trim();
    }
    if (!studyDataCollectionInput.value.trim()) {
      throw "Please add a study data collection";
    } else {
      studyDataCollection = studyDataCollectionInput.value.trim();
    }
    if (!studyPrimaryConclusionInput.value.trim()) {
      throw "Please add a study primary conclusion";
    } else {
      studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim();
    }

    studyCollectionTitle = studyCollectionTitleInput.value.trim();

    //After validation, add the study information to the JSON object
    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "study-information"
    ] = {
      "study organ system": studyOrganSystemTags,
      "study approach": studyApproachTags,
      "study technique": studyTechniqueTags,
      "study purpose": studyPurpose,
      "study data collection": studyDataCollection,
      "study primary conclusion": studyPrimaryConclusion,
      "study collection title": studyCollectionTitle,
    };
  };
  const guidedSaveDescriptionContributorInformation = () => {
    const acknowledgementsInput = document.getElementById(
      "guided-ds-acknowledgements"
    );
    const acknowledgements = acknowledgementsInput.value.trim();

    // Get tags from other funding tagify
    const otherFunding = getTagsFromTagifyElement(
      guidedOtherFundingsourcesTagify
    );

    sodaJSONObj["dataset-metadata"]["description-metadata"][
      "contributor-information"
    ] = {
      funding: otherFunding,
      acknowledgment: acknowledgements,
    };
  };

  const guidedCombineLinkSections = () => {
    var protocolLinks = getGuidedProtocolSection();
    var otherLinks = getGuidedAdditionalLinkSection();
    protocolLinks.push.apply(protocolLinks, otherLinks);
    return protocolLinks;
  };

  const guidedSaveParticipantInformation = () => {
    let numSubjects = $("#guided-ds-samples-no").val();
    let numSamples = $("#guided-ds-samples-no").val();
    if (numSubjects.length == 0 || numSamples.length == 0) {
      /*Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: "Please fill in all of the required participant information fields.",
        title: "Incomplete information",
      });*/
    } else {
      sodaJSONObj["dataset-metadata"]["description-metadata"]["numSubjects"] =
        numSubjects;
      sodaJSONObj["dataset-metadata"]["description-metadata"]["numSamples"] =
        numSamples;
    }
  };

  $("#guided-generate-dataset-button").on("click", async function () {
    // If no agent is installed, download the latest agent from Github and link to their docs for installation instrucations if needed.
    const [agent_installed_response, agent_version_response] =
      await check_agent_installed();
    if (!agent_installed_response) {
      Swal.fire({
        icon: "error",
        title: "Pennsieve Agent error!",
        html: agent_version_response,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Download now",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            let [browser_download_url, latest_agent_version] =
              await get_latest_agent_version();
            shell.openExternal(browser_download_url);
            shell.openExternal(
              "https://docs.pennsieve.io/docs/the-pennsieve-agent"
            );
          } catch (e) {
            await Swal.fire({
              icon: "error",
              text: "We are unable to get the latest version of the Pennsieve Agent. Please try again later. If this issue persists please contact the SODA team at help@fairdataihub.org",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              confirmButtonText: "Ok",
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            });
          }
        }
      });
      return;
    }
    traverseToTab("guided-dataset-generation-tab");
    guidedPennsieveDatasetUpload();
  });

  const guidedSaveBannerImage = async () => {
    $("#guided-para-dataset-banner-image-status").html("Please wait...");
    //Save cropped image locally and check size
    let imageFolder = path.join(homeDirectory, "SODA", "guided-banner-images");
    let imageType = "";

    if (!fs.existsSync(imageFolder)) {
      fs.mkdirSync(imageFolder, { recursive: true });
    }

    if (imageExtension == "png") {
      imageType = "image/png";
    } else {
      imageType = "image/jpeg";
    }
    let datasetName = sodaJSONObj["digital-metadata"]["name"];
    let imagePath = path.join(imageFolder, `${datasetName}.` + imageExtension);
    let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

    imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
      let image_file_size = fs.statSync(imagePath)["size"];
      if (image_file_size < 5 * 1024 * 1024) {
        $("#guided-para-dataset-banner-image-status").html("");
        setGuidedBannerImage(imagePath);
        $("#guided-banner-image-modal").modal("hide");
        $("#guided-button-add-banner-image").text("Edit banner image");
      } else {
        //image needs to be scaled
        $("#guided-para-dataset-banner-image-status").html("");
        let scaledImagePath = await scaleBannerImage(imagePath);
        setGuidedBannerImage(scaledImagePath);
        $("#guided-banner-image-modal").modal("hide");
        $("#guided-button-add-banner-image").text("Edit banner image");
      }
    });
  };
  /**************************************/
  $("#guided-save-banner-image").click(async (event) => {
    $("#guided-para-dataset-banner-image-status").html("");
    if (guidedBfViewImportedImage.src.length > 0) {
      if (guidedFormBannerHeight.value > 511) {
        Swal.fire({
          icon: "warning",
          text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (guidedFormBannerHeight.value < 1024) {
            Swal.fire({
              icon: "warning",
              text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${guidedFormBannerHeight.value} px. Would you like to continue?`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              focusCancel: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                guidedSaveBannerImage();
              }
            });
          } else if (guidedFormBannerHeight.value > 2048) {
            Swal.fire({
              icon: "warning",
              text: `Your cropped image is ${formBannerHeight.value} px and is bigger than the 2048px standard. Would you like to scale this image down to fit the entire cropped image?`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              focusCancel: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                guidedSaveBannerImage();
              }
            });
          } else {
            guidedSaveBannerImage();
          }
        });
      } else {
        $("#guided-para-dataset-banner-image-status").html(
          "<span style='color: red;'> " +
            "Dimensions of cropped area must be at least 512 px" +
            "</span>"
        );
      }
    } else {
      $("#guided-para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Please import an image first" +
          "</span>"
      );
    }
  });

  //next button click handler
  $("#guided-next-button").on("click", async function () {
    //Get the ID of the current page to handle actions on page leave (next button pressed)
    pageBeingLeftID = CURRENT_PAGE.attr("id");
    //remove blue pulse
    $(this).removeClass("pulse-blue");
    //add a bootstrap loader to the next button
    $(this).addClass("loading");
    let errorArray = [];

    try {
      if (pageBeingLeftID === "guided-dataset-starting-point-tab") {
        const buttonNoGuidedCurateSelected = document
          .getElementById("guided-button-guided-dataset-structuring")
          .classList.contains("selected");
        const buttonYesImportExistingSelected = document
          .getElementById("guided-button-import-existing-dataset-structure")
          .classList.contains("selected");

        if (!buttonNoGuidedCurateSelected && !buttonYesImportExistingSelected) {
          errorArray.push({
            type: "notyf",
            message: "Please select a dataset start location",
          });
          throw errorArray;
        }

        if (buttonNoGuidedCurateSelected) {
          sodaJSONObj["guided-options"]["dataset-start-location"] =
            "guided-curate";
          sodaJSONObj["starting-point"]["type"] = "new";
        }

        if (buttonYesImportExistingSelected) {
          sodaJSONObj["guided-options"]["dataset-start-location"] =
            "import-existing";
          sodaJSONObj["starting-point"]["type"] = "local";
        }
      }

      if (pageBeingLeftID === "guided-source-folder-tab") {
        if (
          !$("#guided-button-has-source-data").hasClass("selected") &&
          !$("#guided-button-no-source-data").hasClass("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains source data",
          });
          throw errorArray;
        }
      }
      if (pageBeingLeftID === "guided-derivative-folder-tab") {
        if (
          //check if divs with the buttons with IDs guided-button-has-derivative-data and guided-button-no-derivative-data have the class selected
          !document
            .getElementById("guided-button-has-derivative-data")
            .classList.contains("selected") &&
          !document
            .getElementById("guided-button-no-derivative-data")
            .classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains derivative data",
          });
          throw errorArray;
        }
      }

      if (pageBeingLeftID === "guided-code-folder-tab") {
        const guidedButtonUserHasCodeData = document.getElementById(
          "guided-button-has-code-data"
        );
        const guidedButtonUserNoCodeData = document.getElementById(
          "guided-button-no-code-data"
        );

        const codeFolder = datasetStructureJSONObj["folders"]["code"];

        if (
          !guidedButtonUserHasCodeData.classList.contains("selected") &&
          !guidedButtonUserNoCodeData.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains code data",
          });
          throw errorArray;
        }
        if (guidedButtonUserHasCodeData.classList.contains("selected")) {
          if (
            Object.keys(codeFolder.folders).length === 0 &&
            Object.keys(codeFolder.files).length === 0
          ) {
            errorArray.push({
              type: "notyf",
              message:
                "Please add code data or indicate that you do not have code data",
            });
            throw errorArray;
          }
        }
        if (guidedButtonUserNoCodeData.classList.contains("selected")) {
          if (
            Object.keys(codeFolder.folders).length === 0 &&
            Object.keys(codeFolder.files).length === 0
          ) {
            delete datasetStructureJSONObj["folders"]["code"];
          } else {
            const { value: deleteCodeFolderWithData } = await Swal.fire({
              title: "Delete code folder?",
              text: "You indicated that your dataset does not contain code data, however, you previously added code data to your dataset. Do you want to delete the code folder?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "No, keep it!",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
            if (deleteCodeFolderWithData) {
              delete datasetStructureJSONObj["folders"]["code"];
            } else {
              guidedButtonUserHasCodeData.click();
            }
          }
        }
      }

      if (pageBeingLeftID === "guided-protocol-folder-tab") {
        const guidedButtonUserHasProtocolData = document.getElementById(
          "guided-button-has-protocol-data"
        );
        const guidedButtonUserNoProtocolData = document.getElementById(
          "guided-button-no-protocol-data"
        );

        const protocolFolder = datasetStructureJSONObj["folders"]["protocol"];

        if (
          !guidedButtonUserHasProtocolData.classList.contains("selected") &&
          !guidedButtonUserNoProtocolData.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains protocol data",
          });
          throw errorArray;
        }
        if (guidedButtonUserHasProtocolData.classList.contains("selected")) {
          if (
            Object.keys(protocolFolder.folders).length === 0 &&
            Object.keys(protocolFolder.files).length === 0
          ) {
            errorArray.push({
              type: "notyf",
              message:
                "Please add docs protocol or indicate that you do not have protocol data",
            });
            throw errorArray;
          }
        }
        if (guidedButtonUserNoProtocolData.classList.contains("selected")) {
          if (
            Object.keys(protocolFolder.folders).length === 0 &&
            Object.keys(protocolFolder.files).length === 0
          ) {
            delete datasetStructureJSONObj["folders"]["protocol"];
          } else {
            const { value: deleteCodeFolderWithData } = await Swal.fire({
              title: "Delete protocol folder?",
              text: "You indicated that your dataset does not contain protocol data, however, you previously added protocol data to your dataset. Do you want to delete the protocol folder?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "No, keep it!",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
            if (deleteCodeFolderWithData) {
              delete datasetStructureJSONObj["folders"]["protocol"];
            } else {
              guidedButtonUserHasProtocolData.click();
            }
          }
        }
      }

      if (pageBeingLeftID === "guided-docs-folder-tab") {
        const guidedButtonUserHasDocsData = document.getElementById(
          "guided-button-has-docs-data"
        );
        const guidedButtonUserNoDocsData = document.getElementById(
          "guided-button-no-docs-data"
        );

        const docsFolder = datasetStructureJSONObj["folders"]["docs"];

        if (
          !guidedButtonUserHasDocsData.classList.contains("selected") &&
          !guidedButtonUserNoDocsData.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains docs data",
          });
          throw errorArray;
        }
        if (guidedButtonUserHasDocsData.classList.contains("selected")) {
          if (
            Object.keys(docsFolder.folders).length === 0 &&
            Object.keys(docsFolder.files).length === 0
          ) {
            errorArray.push({
              type: "notyf",
              message:
                "Please add docs data or indicate that you do not have docs data",
            });
            throw errorArray;
          }
        }
        if (guidedButtonUserNoDocsData.classList.contains("selected")) {
          if (
            Object.keys(docsFolder.folders).length === 0 &&
            Object.keys(docsFolder.files).length === 0
          ) {
            delete datasetStructureJSONObj["folders"]["docs"];
          } else {
            const { value: deleteDocsFolderWithData } = await Swal.fire({
              title: "Delete docs folder?",
              text: "You indicated that your dataset does not contain docs data, however, you previously added docs data to your dataset. Do you want to delete the docs folder?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              cancelButtonText: "No, keep it!",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
            if (deleteDocsFolderWithData) {
              delete datasetStructureJSONObj["folders"]["docs"];
            } else {
              guidedButtonUserHasDocsData.click();
            }
          }
        }
      }
      if (pageBeingLeftID === "guided-folder-importation-tab") {
        if (
          !$("#guided-input-destination-getting-started-locally").val() ||
          $("#guided-input-destination-getting-started-locally").val() ===
            "Browse here"
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please select the location of your local datset",
          });
          throw errorArray;
        }
      }
      if (pageBeingLeftID === "guided-create-subjects-metadata-tab") {
        //Save the subject metadata from the subject currently being modified
        addSubject("guided");

        const subjectsAsideItemsCount = document.querySelectorAll(
          ".subjects-metadata-aside-item"
        ).length;
        const subjectsInTableDataCount = subjectsTableData.length - 1;
        if (subjectsAsideItemsCount !== subjectsInTableDataCount) {
          let result = await Swal.fire({
            heightAuto: false,
            backdrop: "rgba(0,0,0,0.4)",
            title: "Continue without adding subject metadata to all subjects?",
            text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add subject metadata for all subjects.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Finish adding metadata to all subjects",
            cancelButtonText:
              "Continue without adding metadata to all subjects",
          });
          if (result.isConfirmed) {
            throw new Error(
              "Returning to subject metadata addition page to complete all fields"
            );
          }
        }
      }
      if (pageBeingLeftID === "guided-create-samples-metadata-tab") {
        //Save the sample metadata from the sample currently being modified
        addSample("guided");

        const samplesAsideItemsCount = document.querySelectorAll(
          ".samples-metadata-aside-item"
        ).length;
        const samplesInTableDataCount = samplesTableData.length - 1;
        if (samplesAsideItemsCount !== samplesInTableDataCount) {
          let result = await Swal.fire({
            heightAuto: false,
            backdrop: "rgba(0,0,0,0.4)",
            title: "Continue without adding sample metadata to all samples?",
            text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add sample metadata for all samples.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Finish adding metadata to all samples",
            cancelButtonText: "Continue without adding metadata to all samples",
          });
          if (result.isConfirmed) {
            throw new Error(
              "Returning to sample metadata addition page to complete all fields"
            );
          }
        }
      }
      if (pageBeingLeftID === "guided-add-code-metadata-tab") {
        const requiredCodeDescriptionFilePath =
          sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
        /*if (!requiredCodeDescriptionFilePath) {
          errorArray.push({
            type: "notyf",
            message: "Please import a code_description file",
          });
          throw errorArray;
        }*/
      }
      if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
        const confirmAccountbutton = document.getElementById(
          "guided-confirm-pennsieve-account-button"
        );
        if (!confirmAccountbutton.classList.contains("selected")) {
          if (!defaultBfAccount) {
            errorArray.push({
              type: "notyf",
              message: "Please sign in to Pennsieve before continuing",
            });
            throw errorArray;
          } else {
            errorArray.push({
              type: "notyf",
              message: "Please confirm your account before continuing",
            });
            throw errorArray;
          }
        }
      }
      if (pageBeingLeftID === "guided-banner-image-tab") {
        if (sodaJSONObj["digital-metadata"]["banner-image-path"] == undefined) {
          errorArray.push({
            type: "notyf",
            message: "Please add a banner image",
          });
          throw errorArray;
        }
      }
      if (pageBeingLeftID === "guided-designate-pi-owner-tab") {
        const designateSelfButton = document.getElementById(
          "guided-button-designate-self-PI"
        );
        const designateOtherButton = document.getElementById(
          "guided-button-designate-other-PI"
        );
        if (
          !designateSelfButton.classList.contains("selected") &&
          !designateOtherButton.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please designate a PI",
          });
          throw errorArray;
        }

        //Get the user information of the user that is currently curating
        //If they designate themself as the PI, set them as the PI
        //If they designate someone else as the PI, set them as a manager
        const user = await api.getUserInformation();

        const loggedInUserString = `${user["firstName"]} ${user["lastName"]} (${user["email"]})`;
        const loggedInUserUUID = user["id"];
        const loggedInUserName = `${user["firstName"]} ${user["lastName"]}`;

        if (designateSelfButton.classList.contains("selected")) {
          const loggedInUserPiObj = {
            userString: loggedInUserString,
            UUID: loggedInUserUUID,
            name: loggedInUserName,
          };
          setGuidedDatasetPiOwner(loggedInUserPiObj);
        }

        if (designateOtherButton.classList.contains("selected")) {
          let PiOwnerString = $("#guided_bf_list_users_pi option:selected")
            .text()
            .trim();

          if (
            !$("#guided_bf_list_users_pi").val() ||
            PiOwnerString === "Select PI"
          ) {
            errorArray.push({
              type: "notyf",
              message: "Please select a PI from the dropdown",
            });
            throw errorArray;
          }

          // get the text before the email address from the selected dropdown
          let PiName = PiOwnerString.split("(")[0];
          if (PiName === "") {
            PiName = PiOwnerString;
          }
          let PiUUID = $("#guided_bf_list_users_pi").val().trim();

          const newPiOwner = {
            userString: PiOwnerString,
            UUID: PiUUID,
            name: PiName,
          };

          if (PiUUID === loggedInUserUUID) {
            setGuidedDatasetPiOwner(newPiOwner);
          } else {
            setGuidedDatasetPiOwner(newPiOwner);

            //set the logged in user as a manager
            const loggedInUserManagerObj = {
              userString: loggedInUserString,
              userName: loggedInUserName,
              UUID: loggedInUserUUID,
              permission: "manager",
              loggedInUser: true,
            };

            guidedAddUserPermission(loggedInUserManagerObj);
          }
        }
      }

      if (pageBeingLeftID === "guided-add-description-tab") {
        const studyPurposeInput = document.getElementById(
          "guided-pennsieve-study-purpose"
        );
        const studyDataCollectionInput = document.getElementById(
          "guided-pennsieve-study-data-collection"
        );
        const studyPrimaryConclusionInput = document.getElementById(
          "guided-pennsieve-study-primary-conclusion"
        );

        if (studyPurposeInput.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter your study's purpose",
          });
        }

        if (studyDataCollectionInput.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please your study's data collection method",
          });
        }

        if (studyPrimaryConclusionInput.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter your study's primary conclusion",
          });
        }
        if (errorArray.length > 0) {
          throw errorArray;
        } else {
          sodaJSONObj["digital-metadata"]["description"] = {
            "study-purpose": studyPurposeInput.value.trim(),
            "data-collection": studyDataCollectionInput.value.trim(),
            "primary-conclusion": studyPrimaryConclusionInput.value.trim(),
          };
        }
      }
      if (pageBeingLeftID === "guided-add-tags-tab") {
        let datasetTags = getTagsFromTagifyElement(guidedDatasetTagsTagify);
        //remove duplicates from datasetTags
        datasetTags = [...new Set(datasetTags)];
        sodaJSONObj["digital-metadata"]["dataset-tags"] = datasetTags;
      }

      if (pageBeingLeftID === "guided-assign-license-tab") {
        if (isPageValid(pageBeingLeftID)) {
          setGuidedLicense("Creative Commons Attribution (CC-BY)");
        } else {
          errorArray.push({
            type: "notyf",
            message:
              "Please accept the application of the CC-BY license to your dataset.",
          });
          throw errorArray;
        }
      }
      if (pageBeingLeftID === "guided-dataset-generate-location-tab") {
        const buttonGenerateLocally = document.getElementById(
          "guided-button-generate-dataset-locally"
        );
        const buttonGenerateOnPennsieve = document.getElementById(
          "guided-button-generate-dataset-on-pennsieve"
        );

        // If the user did not select if they would like to import a SPARC award,
        // throw an error
        if (
          !buttonGenerateLocally.classList.contains("selected") &&
          !buttonGenerateOnPennsieve.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message:
              "Please indicate where you would like to genrate your dataset",
          });
          throw errorArray;
        }

        if (buttonGenerateOnPennsieve.classList.contains("selected")) {
          const accountName = document.getElementById("guided-bf-account");
          if (
            accountName.innerHTML.trim() === "None" ||
            accountName.innerHTML.trim() === ""
          ) {
            errorArray.push({
              type: "notyf",
              message:
                "Please select a Pennsieve account to generate your dataset on",
            });
            throw errorArray;
          }
          sodaJSONObj["generate-dataset"]["destination"] = "bf";
        }
      }
      if (pageBeingLeftID === "guided-dataset-generate-destination-tab") {
        const buttonGenerateOnExistingPennsieveDataset =
          document.getElementById("guided-button-pennsieve-generate-existing");
        const buttonGenerateOnNewPennsieveDataset = document.getElementById(
          "guided-button-pennsieve-generate-new"
        );

        // If the user did not select if they would like to import a SPARC award,
        // throw an error
        if (
          !buttonGenerateOnExistingPennsieveDataset.classList.contains(
            "selected"
          ) &&
          !buttonGenerateOnNewPennsieveDataset.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message:
              "Please indicate if you would like to generate on a new or existing Pennsieve dataset",
          });
          throw errorArray;
        }

        if (
          buttonGenerateOnExistingPennsieveDataset.classList.contains(
            "selected"
          )
        ) {
          sodaJSONObj["generate-dataset"]["destination"] = "local";
        }

        if (
          buttonGenerateOnNewPennsieveDataset.classList.contains("selected")
        ) {
          confirmDatasetGenerationNameinput = document.getElementById(
            "guided-input-dataset-name"
          );
          if (confirmDatasetGenerationNameinput.value.trim() === "") {
            errorArray.push({
              type: "notyf",
              message: "Please enter a name for your new Pennsieve dataset",
            });
            throw errorArray;
          }
          sodaJSONObj["digital-metadata"]["name"] =
            confirmDatasetGenerationNameinput.value.trim();
          sodaJSONObj["generate-dataset"]["destination"] = "bf";
        }
      }

      if (pageBeingLeftID === "guided-folder-structure-preview-tab") {
        //if folders and files in datasetStruture json obj are empty, warn the user
        if (
          Object.keys(datasetStructureJSONObj["folders"]).length === 0 &&
          Object.keys(datasetStructureJSONObj["files"]).length === 0
        ) {
          const { value: continueProgress } = await Swal.fire({
            title: `No folders or files have been added to your dataset.`,
            html: `You can go back and add folders and files to your dataset, however, if
          you choose to generate your dataset on the final step, no folders or files will be
          added to your target destination.`,
            allowEscapeKey: false,
            allowOutsideClick: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showConfirmButton: true,
            showCancelButton: true,
            cancelButtonText: "Go back to add folders and files",
            cancelButtonWidth: "200px",
            confirmButtonText: "Continue without adding folders and files",
            reverseSwalButtons: true,
          });
          if (!continueProgress) {
            $(this).removeClass("loading");
            return;
          }
        }
      }
      if (pageBeingLeftID === "guided-manifest-file-generation-tab") {
        const buttonYesAutoGenerateManifestFiles = document.getElementById(
          "guided-button-auto-generate-manifest-files"
        );
        const buttonNoImportManifestFiles = document.getElementById(
          "guided-button-import-manifest-files"
        );

        if (
          !buttonYesAutoGenerateManifestFiles.classList.contains("selected") &&
          !buttonNoImportManifestFiles.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message:
              "Please indicate how you would like to prepare your manifest files",
          });
          throw errorArray;
        }
        if (buttonYesAutoGenerateManifestFiles.classList.contains("selected")) {
        }
      }

      if (pageBeingLeftID === "guided-airtable-award-tab") {
        const buttonYesImportSparcAward = document.getElementById(
          "guided-button-import-sparc-award"
        );
        const buttonNoEnterSparcAwardManually = document.getElementById(
          "guided-button-enter-sparc-award-manually"
        );

        // If the user did not select if they would like to import a SPARC award,
        // throw an error
        if (
          !buttonYesImportSparcAward.classList.contains("selected") &&
          !buttonNoEnterSparcAwardManually.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message:
              "Please indicate if you would like to import a SPARC award",
          });
          throw errorArray;
        }

        if (buttonYesImportSparcAward.classList.contains("selected")) {
          const sparcAwardImportedFromAirtable =
            sodaJSONObj["dataset-metadata"]["shared-metadata"][
              "imported-sparc-award"
            ];
          if (!sparcAwardImportedFromAirtable) {
            errorArray.push({
              type: "notyf",
              message:
                "Please import a SPARC award of select no to enter a SPARC award manually",
            });
            throw errorArray;
          }
          //Set the sparc award to the imported sparc award's value
          sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
            sparcAwardImportedFromAirtable;
        }

        if (buttonNoEnterSparcAwardManually.classList.contains("selected")) {
          const sparcAwardInput = document.getElementById(
            "guided-input-sparc-award"
          );
          if (sparcAwardInput.value.trim() === "") {
            errorArray.push({
              type: "notyf",
              message: "Please enter a SPARC award",
            });
            throw errorArray;
          }

          sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
            sparcAwardInput.value.trim();
          //Delete the imported SPARC award as the user entered the award manually.
          delete sodaJSONObj["dataset-metadata"]["shared-metadata"][
            "imported-sparc-award"
          ];
        }
      }
      if (pageBeingLeftID === "guided-contributors-tab") {
        ////////////////////////////////////////////////////////////////////////////////
        const contributorFieldSetDiv = document.getElementById(
          "guided-div-contributor-field-set"
        );
        const airTableContributorImportDiv = document.getElementById(
          "guided-div-contributors-imported-from-airtable"
        );
        //case when user adds contributors manually
        if (!contributorFieldSetDiv.classList.contains("hidden")) {
          let allInputsValid = true;
          let contributors = [];
          //get all contributor fields
          const contributorFields = document.querySelectorAll(
            ".guided-contributor-field-container"
          );
          //check if contributorFields is empty
          if (contributorFields.length === 0) {
            errorArray.push({
              type: "notyf",
              message: "Please add at least one contributor",
            });
            throw errorArray;
          }

          //loop through contributor fields and get values
          const contributorFieldsArray = Array.from(contributorFields);

          contributorFieldsArray.forEach((contributorField) => {
            const contributorLastNameInput = contributorField.querySelector(
              ".guided-last-name-input"
            );
            const contributorFirstNameInput = contributorField.querySelector(
              ".guided-first-name-input"
            );
            const contributorORCIDInput = contributorField.querySelector(
              ".guided-orcid-input"
            );

            //get the contributor affiliation tags
            const contributorAffiliationTagify = contributorField.querySelector(
              ".guided-contributor-affiliation-input"
            );
            const contributorAffiliationTagifyChildren = Array.from(
              contributorAffiliationTagify.children
            );
            //remove the span element from the array so only tag elements are left
            contributorAffiliationTagifyChildren.pop();
            //get the titles of the tagify tags
            const contributorAffiliations =
              contributorAffiliationTagifyChildren.map((child) => {
                return child.title;
              });

            //get the contributor role tags
            const contributorRoleTagify = contributorField.querySelector(
              ".guided-contributor-role-input"
            );
            //get the children of contributorRoleTagify in an array
            const contributorRoleTagifyChildren = Array.from(
              contributorRoleTagify.children
            );
            //remove the span element from the array so only tag elements are left
            contributorRoleTagifyChildren.pop();
            //get the titles of the tagify tags
            const contributorRoles = contributorRoleTagifyChildren.map(
              (child) => {
                return child.title;
              }
            );
            //Validate all of the contributor fields
            const textInputs = [
              contributorLastNameInput,
              contributorFirstNameInput,
              contributorORCIDInput,
            ];
            //check if all text inputs are valid
            textInputs.forEach((textInput) => {
              if (textInput.value === "") {
                textInput.style.setProperty("border-color", "red", "important");
                allInputsValid = false;
              } else {
                textInput.style.setProperty(
                  "border-color",
                  "hsl(0, 0%, 88%)",
                  "important"
                );
              }
            });

            //Check if user added at least one affiliation
            if (contributorAffiliations.length === 0) {
              contributorAffiliationTagify.style.setProperty(
                "border-color",
                "red",
                "important"
              );
              allInputsValid = false;
            } else {
              //remove the red border from the contributor affiliation tagify
              contributorAffiliationTagify.style.setProperty(
                "border-color",
                "hsl(0, 0%, 88%)",
                "important"
              );
            }

            //Check if user added at least one contributor
            if (contributorRoles.length === 0) {
              contributorRoleTagify.style.setProperty(
                "border-color",
                "red",
                "important"
              );
              allInputsValid = false;
            } else {
              //remove the red border from the contributor role tagify
              contributorRoleTagify.style.setProperty(
                "border-color",
                "hsl(0, 0%, 88%)",
                "important"
              );
            }

            const contributorInputObj = {
              contributorLastName: contributorLastNameInput.value,
              contributorFirstName: contributorFirstNameInput.value,
              conName: `${contributorLastNameInput.value}, ${contributorFirstNameInput.value}`,
              conID: contributorORCIDInput.value,
              conAffliation: contributorAffiliations,
              conRole: contributorRoles,
            };
            contributors.push(contributorInputObj);
          });
          ///////////////////////////////////////////////////////////////////////////////
          if (!allInputsValid) {
            errorArray.push({
              type: "notyf",
              message: "Please fill out all contributor information fields",
            });
            throw errorArray;
          }
          sodaJSONObj["dataset-metadata"]["description-metadata"][
            "contributors"
          ] = contributors;
        } else {
          //case when user selects contributors from airTable
          if (!airTableContributorImportDiv.classList.contains("hidden")) {
            const checkedContributors = getCheckedContributors();
            //if checkedMilestoneData is empty, create notyf
            if (checkedContributors.length === 0) {
              errorArray.push({
                type: "notyf",
                message: "Please select at least one contributor",
              });
              throw errorArray;
            }

            const airKeyContent = parseJson(airtableConfigPath);
            const airKeyInput = airKeyContent["api-key"];
            const base = Airtable.base("appiYd1Tz9Sv857GZ");
            const sparcAward =
              sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
            // Create a filter string to select every entry with first and last names that match the checked contributors
            let contributorInfoFilterString = "OR(";
            for (const contributor of checkedContributors) {
              contributorInfoFilterString += `AND({First_name} = "${contributor["contributorFirstName"]}", {Last_name} = "${contributor["contributorLastName"]}", {SPARC_Award_#} = "${sparcAward}"),`;
            }
            //replace last comma with closing bracket
            contributorInfoFilterString =
              contributorInfoFilterString.slice(0, -1) + ")";
            try {
              const contributorInfoResult = await base("sparc_members")
                .select({
                  filterByFormula: contributorInfoFilterString,
                })
                .all();

              const contributorInfo = contributorInfoResult.map(
                (contributor) => {
                  return {
                    contributorLastName: contributor.fields["Last_name"],
                    contributorFirstName: contributor.fields["First_name"],
                    conName: `${contributor.fields["Last_name"]}, ${contributor.fields["First_name"]}`,
                    conID: contributor.fields["ORCID"],
                    conAffliation: [contributor.fields["Institution"]],
                    conRole: contributor.fields["NIH_Project_Role"],
                  };
                }
              );
              sodaJSONObj["dataset-metadata"]["description-metadata"][
                "contributors"
              ] = contributorInfo;

              renderContributorFields(contributorInfo);

              airTableContributorImportDiv.classList.add("hidden");
              contributorFieldSetDiv.classList.remove("hidden");

              $(this).removeClass("loading");
            } catch (error) {
              //If there's an error getting the data from Airtable, create an empty contributor
              airTableContributorImportDiv.classList.add("hidden");
              contributorFieldSetDiv.classList.remove("hidden");
              document.getElementById("contributors-container").innerHTML = "";
              //add an empty contributor information fieldset
              addContributorField();
              notyf.error(
                "Unable to import contributor information from airtable"
              );
              $(this).removeClass("loading");
              return;
            }
            return;
          }
        }
      }
      if (pageBeingLeftID === "guided-protocols-tab") {
        const buttonYesImportProtocols = document.getElementById(
          "guided-button-import-protocols-io"
        );
        const buttonNoEnterProtocolsManually = document.getElementById(
          "guided-section-enter-protocols-manually"
        );
        if (
          !buttonYesImportProtocols.classList.contains("selected") &&
          !buttonNoEnterProtocolsManually.classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if you would like to import protocols",
          });
          throw errorArray;
        }

        const protocolFields = document.querySelectorAll(
          ".guided-protocol-field-container"
        );

        //Initializa allprotocolFieldsValid as true
        //If any protocol fields are found invalid, allProtocolFieldsValid will be set to valid
        //and an error will be thrown when next button is clicked.
        let allProtocolFieldsValid = true;
        let validURL = false;
        let singleInstance = false;
        let protocols = [];

        //loop through protocol fields and get protocol values
        const protocolFieldsArray = Array.from(protocolFields);
        protocolFieldsArray.forEach((protocolField) => {
          const protocolUrlInput = protocolField.querySelector(
            ".guided-protocol-url-input"
          );
          const protocolDescriptionInput = protocolField.querySelector(
            ".guided-protocol-description-input"
          );
          //Validate all of the protocol fields
          let protocolLink = "";
          const textInputs = [protocolUrlInput, protocolDescriptionInput];
          //check if all text inputs are valid
          textInputs.forEach((textInput) => {
            if (
              doiRegex.declared({ exact: true }).test(textInputs[0].value) ===
              true
            ) {
              protocolLink = "DOI";
              validURL = true;
            } else {
              //check if Url
              if (validator.isURL(textInputs[0].value) == true) {
                protocolLink = "URL";
                validURL = true;
              } else {
                textInputs[0].style.setProperty(
                  "border-color",
                  "red",
                  "important"
                );
                validURL = false;
              }
            }
            if (textInput.value === "") {
              textInput.style.setProperty("border-color", "red", "important");
              allProtocolFieldsValid = false;
            } else {
              textInput.style.setProperty(
                "border-color",
                "hsl(0, 0%, 88%)",
                "important"
              );
            }
          });
          if (!validURL) {
            singleInstance = true;
            textInputs[0].style.setProperty("border-color", "red", "important");
          }
          const protocolObj = {
            link: protocolUrlInput.value,
            type: protocolLink,
            relation: "isProtocolFor",
            description: protocolDescriptionInput.value,
          };
          protocols.push(protocolObj);
        });

        if (singleInstance) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a valid URL or DOI",
          });
          throw errorArray;
        }

        if (!allProtocolFieldsValid) {
          errorArray.push({
            type: "notyf",
            message: "Please fill out all protocol information fields",
          });
          throw errorArray;
        }
        if (protocols.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please add at least one protocol",
          });
          throw errorArray;
        }
        sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] =
          protocols;
      }

      if (pageBeingLeftID === "guided-create-description-metadata-tab") {
        try {
          guidedSaveDescriptionDatasetInformation();
          guidedSaveDescriptionStudyInformation();
          guidedSaveDescriptionContributorInformation();
        } catch (error) {
          console.log(error);
          errorArray.push({
            type: "notyf",
            message: error,
          });
          throw errorArray;
        }
      }

      if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
        const readMeTextArea = document.getElementById(
          "guided-textarea-create-readme"
        );
        if (readMeTextArea.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a README for your dataset",
          });
          throw errorArray;
        } else {
          const readMe = readMeTextArea.value.trim();
          sodaJSONObj["dataset-metadata"]["README"] = readMe;
        }
      }

      //Mark page as completed in JSONObj so we know what pages to load when loading local saves
      //(if it hasn't already been marked complete)
      if (!sodaJSONObj["completed-tabs"].includes(pageBeingLeftID)) {
        sodaJSONObj["completed-tabs"].push(pageBeingLeftID);
      }
      //Save progress onto local storage with the dataset name as the key
      saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);

      const getNextPageNotSkipped = (startingPage) => {
        //Check if param element's following element is undefined
        //(usually the case when the element is the last element in it's container)
        if (startingPage.next().attr("id") != undefined) {
          //if not, check if it has the data-attribute skip-page
          //if so, recurse back until a page without the skip-page attribute is found
          let nextPage = startingPage.next();
          if (
            nextPage.attr("data-skip-page") &&
            nextPage.attr("data-skip-page") == "true"
          ) {
            return getNextPageNotSkipped(nextPage);
          } else {
            //element is valid and not to be skipped
            return nextPage;
          }
        } else {
          //previous element was the last element in the container.
          //go to the next page-set and return the first page to be transitioned to.
          nextPage = startingPage
            .parent()
            .next()
            .children(".guided--panel")
            .first();
          if (
            nextPage.attr("data-skip-page") &&
            nextPage.attr("data-skip-page") == "true"
          ) {
            return getNextPageNotSkipped(nextPage);
          } else {
            //element is valid and not to be skipped
            return nextPage;
          }
          return nextPage;
        }
      };

      //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
      //if more tabs in parent tab, go to next tab and update capsule
      let targetPage = getNextPageNotSkipped(CURRENT_PAGE);
      let targetPageID = targetPage.attr("id");

      traverseToTab(targetPageID);
    } catch (error) {
      console.log(error);
      //check to see if the type of error is array
      errorArray.map((error) => {
        if (error.type === "notyf") {
          notyf.open({
            duration: "4000",
            type: "error",
            message: error.message,
          });
        }
      });
    }
    $(this).removeClass("loading");
  });

  //back button click handler
  $("#guided-back-button").on("click", () => {
    pageBeingLeftID = CURRENT_PAGE.attr("id");

    if (pageBeingLeftID === "guided-dataset-starting-point-tab") {
      //Hide dataset name and subtitle parent tab
      document
        .getElementById("guided-mode-starting-container")
        .classList.remove("hidden");

      switchElementVisibility("guided-intro-page", "guided-new-dataset-info");

      //show the intro footer
      document.getElementById("guided-footer-intro").classList.remove("hidden");

      //Show the dataset structure page
      $("#prepare-dataset-parent-tab").hide();
      $("#guided-header-div").hide();
      $("#guided-footer-div").hide();

      //Set the dataset name and subtitle with the values from jsonObj
      const datasetName = getGuidedDatasetName();
      const datasetSubtitle = getGuidedDatasetSubtitle();
      const datasetNameInputElement = document.getElementById(
        "guided-dataset-name-input"
      );
      const datasetSubtitleInputElement = document.getElementById(
        "guided-dataset-subtitle-input"
      );
      const datasetSubtitleCharacterCountText = document.getElementById(
        "guided-subtitle-char-count"
      );
      datasetNameInputElement.value = datasetName;
      datasetSubtitleInputElement.value = datasetSubtitle;
      datasetSubtitleCharacterCountText.innerHTML = `${
        255 - datasetSubtitle.length
      } characters remaining`;

      CURRENT_PAGE = null;

      return;
    }

    if (pageBeingLeftID === "guided-dataset-generation-confirmation-tab") {
      $("#guided-next-button").show();
    }

    const getPrevPageNotSkipped = (startingPage) => {
      //Check if param element's following element is undefined
      //(usually the case when the element is the last element in it's container)
      if (!startingPage.prev().hasClass("guided--capsule-container")) {
        //if not, check if it has the data-attribute skip-page
        //if so, recurse back until a page without the skip-page attribute is found
        let prevPage = startingPage.prev();
        if (
          prevPage.attr("data-skip-page") &&
          prevPage.attr("data-skip-page") == "true"
        ) {
          return getPrevPageNotSkipped(prevPage);
        } else {
          //element is valid and not to be skipped
          return prevPage;
        }
      } else {
        //previous element was the last element in the container.
        //go to the next page-set and return the first page to be transitioned to.
        prevPage = startingPage
          .parent()
          .prev()
          .children(".guided--panel")
          .last();
        if (
          prevPage.attr("data-skip-page") &&
          prevPage.attr("data-skip-page") == "true"
        ) {
          return getPrevPageNotSkipped(prevPage);
        } else {
          //element is valid and not to be skipped
          return prevPage;
        }
      }
    };
    let targetPage = getPrevPageNotSkipped(CURRENT_PAGE);
    let targetPageID = targetPage.attr("id");
    traverseToTab(targetPageID);
  });

  //sub page next button click handler
  $("#guided-button-sub-page-continue").on("click", async () => {
    //Get the id of the parent page that's currently open
    const currentParentPageID = CURRENT_PAGE.attr("id");
    //Get the id of the sub-page that's currently open
    const openSubPageID = getOpenSubPageInPage(currentParentPageID);

    switch (currentParentPageID) {
      case "guided-subjects-folder-tab": {
        switch (openSubPageID) {
          case "guided-specify-subjects-page": {
            const buttonYesSubjects = document.getElementById(
              "guided-button-add-subjects-table"
            );
            const buttonNoSubjects = document.getElementById(
              "guided-button-no-subjects"
            );
            if (
              !buttonYesSubjects.classList.contains("selected") &&
              !buttonNoSubjects.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if your dataset contains subjects.",
              });
              return;
            }
            if (buttonYesSubjects.classList.contains("selected")) {
              //Get the count of all subjects in and outside of pools
              const [subjectsInPools, subjectsOutsidePools] =
                sodaJSONObj.getAllSubjects();
              const subjectsCount = [
                ...subjectsInPools,
                ...subjectsOutsidePools,
              ].length;

              //Check to see if any subjects were added, and if not, disallow the user
              //from progressing until they add at least one subject or select that they do not
              if (subjectsCount === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one subject or indicate that your dataset does not contain subjects.",
                });
                return;
              }

              $(".guided-subject-sample-data-addition-page").attr(
                "data-skip-page",
                "false"
              );
              setActiveSubPage("guided-organize-subjects-into-pools-page");
            }
            if (buttonNoSubjects.classList.contains("selected")) {
              $(".guided-subject-sample-data-addition-page").attr(
                "data-skip-page",
                "true"
              );
              hideSubNavAndShowMainNav("next");
            }

            break;
          }

          case "guided-organize-subjects-into-pools-page": {
            const buttonYesPools = document.getElementById(
              "guided-button-organize-subjects-into-pools"
            );
            const buttonNoPools = document.getElementById(
              "guided-button-no-pools"
            );
            if (
              !buttonYesPools.classList.contains("selected") &&
              !buttonNoPools.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you would like to organize your subjects into pools.",
              });
              return;
            }

            if (buttonYesPools.classList.contains("selected")) {
              const pools =
                sodaJSONObj["dataset-metadata"][
                  "pool-subject-sample-structure"
                ]["pools"];

              //Check to see if any pools were added, and if not, disallow the user
              //from progressing until they add at least one pool or select that they do not
              //have any pools
              if (Object.keys(pools).length === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one pool or indicate that your dataset does not contain pools.",
                });
                return;
              }
              //delete empty pools
              for (const pool of Object.keys(pools)) {
                if (
                  Object.keys(
                    sodaJSONObj["dataset-metadata"][
                      "pool-subject-sample-structure"
                    ]["pools"][pool]
                  ).length === 0
                ) {
                  delete sodaJSONObj["dataset-metadata"][
                    "pool-subject-sample-structure"
                  ]["pools"][pool];
                }
              }
            }

            setActiveSubPage("guided-specify-samples-page");
            break;
          }

          case "guided-specify-samples-page": {
            const buttonYesSamples = document.getElementById(
              "guided-button-add-samples-tables"
            );
            const buttonNoSamples = document.getElementById(
              "guided-button-no-samples"
            );
            if (
              !buttonYesSamples.classList.contains("selected") &&
              !buttonNoSamples.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if your dataset's subjects have samples.",
              });
              return;
            }
            if (buttonYesSamples.classList.contains("selected")) {
              const [samplesInPools, samplesOutsidePools] =
                sodaJSONObj.getAllSamplesFromSubjects();
              //Combine sample data from samples in and out of pools
              const samplesCount = [...samplesInPools, ...samplesOutsidePools]
                .length;
              //Check to see if any samples were added, and if not, disallow the user
              //from progressing until they add at least one sample or select that they do not
              //have any samples
              if (samplesCount === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one sample or indicate that your dataset does not contain samples.",
                });
                return;
              }

              document
                .getElementById("guided-primary-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              document
                .getElementById("guided-source-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              document
                .getElementById("guided-derivative-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              hideSubNavAndShowMainNav("next");
            }

            if (buttonNoSamples.classList.contains("selected")) {
              //add skip-sub-page attribute to element
              document
                .getElementById("guided-primary-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");
              document
                .getElementById("guided-source-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");
              document
                .getElementById("guided-derivative-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");

              hideSubNavAndShowMainNav("next");
            }

            break;
          }
        }
        break;
      }

      case "guided-primary-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-primary-samples-organization-page": {
            const buttonYesPrimarySampleData = document.getElementById(
              "guided-button-add-sample-primary-data"
            );
            const buttonNoPrimarySampleData = document.getElementById(
              "guided-button-no-sample-primary-data"
            );
            if (
              !buttonYesPrimarySampleData.classList.contains("selected") &&
              !buttonNoPrimarySampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have primary data to add to your samples.",
              });
              return;
            }
            if (buttonYesPrimarySampleData.classList.contains("selected")) {
              const continueWithoutAddingPrimaryDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders(
                  "primary",
                  "samples",
                  false
                );
              if (continueWithoutAddingPrimaryDataToAllSamples) {
                setActiveSubPage("guided-primary-subjects-organization-page");
              }
            }
            if (buttonNoPrimarySampleData.classList.contains("selected")) {
              const continueAfterDeletingAllPrimarySampleFolders =
                await cleanUpEmptyGuidedStructureFolders(
                  "primary",
                  "samples",
                  true
                );
              if (continueAfterDeletingAllPrimarySampleFolders) {
                setActiveSubPage("guided-primary-subjects-organization-page");
              }
            }
            break;
          }

          case "guided-primary-subjects-organization-page": {
            const buttonYesPrimarySubjectData = document.getElementById(
              "guided-button-add-subject-primary-data"
            );
            const buttonNoPrimarySubjectData = document.getElementById(
              "guided-button-no-subject-primary-data"
            );
            if (
              !buttonYesPrimarySubjectData.classList.contains("selected") &&
              !buttonNoPrimarySubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have primary data to add to your subjects.",
              });
              return;
            }
            if (buttonYesPrimarySubjectData.classList.contains("selected")) {
              const continueWithoutAddingPrimaryDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "primary",
                  "subjects",
                  false
                );
              if (continueWithoutAddingPrimaryDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoPrimarySubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllPrimaryPoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "primary",
                  "subjects",
                  true
                );
              if (continueAfterDeletingAllPrimaryPoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }

            break;
          }
        }
        break;
      }

      case "guided-source-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-source-samples-organization-page": {
            const buttonYesSourceSampleData = document.getElementById(
              "guided-button-add-sample-source-data"
            );
            const buttonNoSourceSampleData = document.getElementById(
              "guided-button-no-sample-source-data"
            );
            if (
              !buttonYesSourceSampleData.classList.contains("selected") &&
              !buttonNoSourceSampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have source data to add to your samples.",
              });
              return;
            }
            if (buttonYesSourceSampleData.classList.contains("selected")) {
              const continueWithoutAddingSourceDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders(
                  "source",
                  "samples",
                  false
                );
              if (continueWithoutAddingSourceDataToAllSamples) {
                setActiveSubPage("guided-source-subjects-organization-page");
              }
            }
            if (buttonNoSourceSampleData.classList.contains("selected")) {
              const continueAfterDeletingAllSourceSampleFolders =
                await cleanUpEmptyGuidedStructureFolders(
                  "source",
                  "samples",
                  true
                );
              if (continueAfterDeletingAllSourceSampleFolders) {
                setActiveSubPage("guided-source-subjects-organization-page");
              }
            }
            break;
          }

          case "guided-source-subjects-organization-page": {
            const buttonYesSourceSubjectData = document.getElementById(
              "guided-button-add-subject-source-data"
            );
            const buttonNoSourceSubjectData = document.getElementById(
              "guided-button-no-subject-source-data"
            );
            if (
              !buttonYesSourceSubjectData.classList.contains("selected") &&
              !buttonNoSourceSubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have source data to add to your subjects.",
              });
              return;
            }
            if (buttonYesSourceSubjectData.classList.contains("selected")) {
              const continueWithoutAddingSourceDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "source",
                  "subjects",
                  false
                );
              if (continueWithoutAddingSourceDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoSourceSubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllSourcePoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "source",
                  "subjects",
                  true
                );
              if (continueAfterDeletingAllSourcePoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            break;
          }
        }
        break;
      }

      case "guided-derivative-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-derivative-samples-organization-page": {
            const buttonYesDerivativeSampleData = document.getElementById(
              "guided-button-add-sample-derivative-data"
            );
            const buttonNoDerivativeSampleData = document.getElementById(
              "guided-button-no-sample-derivative-data"
            );
            if (
              !buttonYesDerivativeSampleData.classList.contains("selected") &&
              !buttonNoDerivativeSampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have derivative data to add to your samples.",
              });
              return;
            }
            if (buttonYesDerivativeSampleData.classList.contains("selected")) {
              const continueWithoutAddingDerivativeDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders(
                  "derivative",
                  "samples",
                  false
                );
              if (continueWithoutAddingDerivativeDataToAllSamples) {
                setActiveSubPage(
                  "guided-derivative-subjects-organization-page"
                );
              }
            }
            if (buttonNoDerivativeSampleData.classList.contains("selected")) {
              const continueAfterDeletingAllDerivativeSampleFolders =
                await cleanUpEmptyGuidedStructureFolders(
                  "derivative",
                  "samples",
                  true
                );
              if (continueAfterDeletingAllDerivativeSampleFolders) {
                setActiveSubPage(
                  "guided-derivative-subjects-organization-page"
                );
              }
            }
            break;
          }

          case "guided-derivative-subjects-organization-page": {
            const buttonYesDerivativeSubjectData = document.getElementById(
              "guided-button-add-subject-derivative-data"
            );
            const buttonNoDerivativeSubjectData = document.getElementById(
              "guided-button-no-subject-derivative-data"
            );
            if (
              !buttonYesDerivativeSubjectData.classList.contains("selected") &&
              !buttonNoDerivativeSubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message:
                  "Please indicate if you have derivative data to add to your subjects.",
              });
              return;
            }
            if (buttonYesDerivativeSubjectData.classList.contains("selected")) {
              const continueWithoutAddingDerivativeDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "derivative",
                  "subjects",
                  false
                );
              if (continueWithoutAddingDerivativeDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoDerivativeSubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllDerivativePoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders(
                  "derivative",
                  "subjects",
                  true
                );
              if (continueAfterDeletingAllDerivativePoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            break;
          }
        }
        break;
      }

      case "guided-create-submission-metadata-tab": {
        const buttonYesImportDataDerivatives = document.getElementById(
          "guided-button-import-data-deliverables"
        );
        const buttonNoEnterSubmissionDataManually = document.getElementById(
          "guided-button-enter-submission-metadata-manually"
        );
        if (
          !buttonYesImportDataDerivatives.classList.contains("selected") &&
          !buttonNoEnterSubmissionDataManually.classList.contains("selected")
        ) {
          notyf.open({
            duration: "5000",
            type: "error",
            message:
              "Please indicate if you would like to import milestone data.",
          });
          break;
        }

        if (buttonYesImportDataDerivatives.classList.contains("selected")) {
          switch (openSubPageID) {
            case "guided-data-derivative-import-page": {
              if (
                buttonYesImportDataDerivatives.classList.contains("selected")
              ) {
                const checkedMilestoneData = getCheckedMilestones();
                //if user does not select any milestones, show error message
                if (checkedMilestoneData.length === 0) {
                  notyf.error("Please select at least one milestone");
                  return;
                }

                sodaJSONObj["dataset-metadata"]["submission-metadata"][
                  "temp-selected-milestones"
                ] = checkedMilestoneData;
                setActiveSubPage("guided-completion-date-selection-page");
              }
              if (
                buttonNoEnterSubmissionDataManually.classList.contains(
                  "selected"
                )
              ) {
                //skip to submission metadata page where user can enter milestones
                //and completion date manually
                setActiveSubPage("guided-submission-metadata-page");
              }
              break;
            }
            case "guided-completion-date-selection-page": {
              const selectedCompletionDate = document.querySelector(
                "input[name='completion-date']:checked"
              );
              if (!selectedCompletionDate) {
                notyf.error("Please select a completion date");
                return;
              }

              const completionDate = selectedCompletionDate.value;
              sodaJSONObj["dataset-metadata"]["submission-metadata"][
                "completion-date"
              ] = completionDate;
              setActiveSubPage("guided-submission-metadata-page");
              break;
            }
            case "guided-submission-metadata-page": {
              const award = $("#guided-submission-sparc-award").val();
              const date = $("#guided-submission-completion-date").val();
              const milestones = getTagsFromTagifyElement(
                guidedSubmissionTagsTagify
              );
              //validate submission metadata
              if (award === "") {
                notyf.error(
                  "Please add a SPARC award number to your submission metadata"
                );
                return;
              }
              if (date === "Enter my own date") {
                notyf.error(
                  "Please add a completion date to your submission metadata"
                );
                return;
              }
              if (milestones.length === 0) {
                notyf.error(
                  "Please add at least one milestone to your submission metadata"
                );
                return;
              }
              // save the award string to JSONObj to be shared with other award inputs
              sodaJSONObj["dataset-metadata"]["shared-metadata"][
                "sparc-award"
              ] = award;
              //Save the data and milestones to the sodaJSONObj
              sodaJSONObj["dataset-metadata"]["submission-metadata"][
                "milestones"
              ] = milestones;
              sodaJSONObj["dataset-metadata"]["submission-metadata"][
                "completion-date"
              ] = date;
              sodaJSONObj["dataset-metadata"]["submission-metadata"][
                "submission-data-entry"
              ] = "import";

              hideSubNavAndShowMainNav("next");
              break;
            }
          }
        }
        if (
          buttonNoEnterSubmissionDataManually.classList.contains("selected")
        ) {
          const award = $("#guided-submission-sparc-award-manual").val();
          const date = $("#guided-submission-completion-date-manual").val();
          const milestones = getTagsFromTagifyElement(
            guidedSubmissionTagsTagifyManual
          );
          //validate manually entered submission metadata
          if (award === "") {
            notyf.error(
              "Please add a SPARC award number to your submission metadata"
            );
            return;
          }
          if (date === "Enter my own date") {
            notyf.error(
              "Please add a completion date to your submission metadata"
            );
            return;
          }
          if (milestones.length === 0) {
            notyf.error(
              "Please add at least one milestone to your submission metadata"
            );
            return;
          }
          // save the award string to JSONObj to be shared with other award inputs
          sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
            award;
          //Save the data and milestones to the sodaJSONObj
          sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] =
            milestones;
          sodaJSONObj["dataset-metadata"]["submission-metadata"][
            "completion-date"
          ] = date;
          sodaJSONObj["dataset-metadata"]["submission-metadata"][
            "submission-data-entry"
          ] = "manual";

          hideSubNavAndShowMainNav("next");
        }
        break;
        break;
      }
    }
    //Save progress onto local storage with the dataset name as the key
    saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);
  });

  //sub page back button click handler
  $("#guided-button-sub-page-back").on("click", () => {
    //Get the id of the parent page that's currently open
    currentParentPageID = CURRENT_PAGE.attr("id");
    //Get the id of the sub-page that's currently open
    const openSubPageID = getOpenSubPageInPage(currentParentPageID);

    switch (currentParentPageID) {
      case "guided-subjects-folder-tab": {
        switch (openSubPageID) {
          case "guided-specify-subjects-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-organize-subjects-into-pools-page": {
            setActiveSubPage("guided-specify-subjects-page");
            break;
          }

          case "guided-specify-samples-page": {
            setActiveSubPage("guided-organize-subjects-into-pools-page");
            break;
          }
        }
        break;
      }

      case "guided-primary-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-primary-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-primary-subjects-organization-page": {
            if (
              document.getElementById(
                "guided-primary-samples-organization-page"
              ).dataset.skipSubPage === "true"
            ) {
              hideSubNavAndShowMainNav("back");
              break;
            }
            setActiveSubPage("guided-primary-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-source-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-source-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-source-subjects-organization-page": {
            setActiveSubPage("guided-source-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-derivative-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-derivative-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-derivative-subjects-organization-page": {
            setActiveSubPage("guided-derivative-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-create-submission-metadata-tab": {
        const buttonYesImportDataDerivatives = document.getElementById(
          "guided-button-import-data-deliverables"
        );
        const buttonNoEnterSubmissionDataManually = document.getElementById(
          "guided-button-enter-submission-metadata-manually"
        );
        if (buttonYesImportDataDerivatives.classList.contains("selected")) {
          switch (openSubPageID) {
            case "guided-data-derivative-import-page": {
              hideSubNavAndShowMainNav("back");
              break;
            }
            case "guided-completion-date-selection-page": {
              setActiveSubPage("guided-data-derivative-import-page");
              break;
            }
            case "guided-submission-metadata-page": {
              if (
                document
                  .getElementById("guided-button-import-data-deliverables")
                  .classList.contains("selected")
              ) {
                setActiveSubPage("guided-completion-date-selection-page");
              }

              if (
                document
                  .getElementById(
                    "guided-button-enter-submission-metadata-manually"
                  )
                  .classList.contains("selected")
              ) {
                setActiveSubPage("guided-data-derivative-import-page");
              }
              break;
            }
          }
        }
        if (
          buttonNoEnterSubmissionDataManually.classList.contains("selected")
        ) {
          hideSubNavAndShowMainNav("back");
        }
        break;
      }
    }
  });

  //tagify initializations
  const guidedOtherFundingSourcesInput = document.getElementById(
    "guided-ds-other-funding"
  );
  guidedOtherFundingsourcesTagify = new Tagify(guidedOtherFundingSourcesInput, {
    duplicates: false,
  });
  createDragSort(guidedOtherFundingsourcesTagify);
  const guidedStudyOrganSystemsInput = document.getElementById(
    "guided-ds-study-organ-system"
  );
  guidedStudyOrganSystemsTagify = new Tagify(guidedStudyOrganSystemsInput, {
    whitelist: [
      "autonomic ganglion",
      "brain",
      "colon",
      "heart",
      "intestine",
      "kidney",
      "large intestine",
      "liver",
      "lower urinary tract",
      "lung",
      "nervous system",
      "pancreas",
      "peripheral nervous system",
      "small intestine",
      "spinal cord",
      "spleen",
      "stomach",
      "sympathetic nervous system",
      "urinary bladder",
    ],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
    },
  });
  createDragSort(guidedStudyOrganSystemsTagify);

  const guidedDatasetKeyWordsInput = document.getElementById(
    "guided-ds-dataset-keywords"
  );
  guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeyWordsInput, {
    duplicates: false,
  });
  createDragSort(guidedDatasetKeywordsTagify);

  const guidedStudyApproachInput = document.getElementById(
    "guided-ds-study-approach"
  );
  guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, {
    duplicates: false,
  });
  createDragSort(guidedStudyApproachTagify);

  const guidedStudyTechniquesInput = document.getElementById(
    "guided-ds-study-technique"
  );
  guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, {
    duplicates: false,
  });
  createDragSort(guidedStudyTechniquesTagify);

  /// back button Curate
  $("#guided-button-back").on("click", function () {
    var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount !== 1) {
      var filtered = getGlobalPath(organizeDSglobalPath);
      if (filtered.length === 1) {
        organizeDSglobalPath.value = filtered[0] + "/";
      } else {
        organizeDSglobalPath.value =
          filtered.slice(0, filtered.length - 1).join("/") + "/";
      }
      var myPath = datasetStructureJSONObj;
      for (var item of filtered.slice(1, filtered.length - 1)) {
        myPath = myPath["folders"][item];
      }
      // construct UI with files and folders
      $("#items").empty();
      already_created_elem = [];
      let items = loadFileFolder(myPath); //array -
      let total_item_count = items[1].length + items[0].length;
      //we have some items to display
      listItems(myPath, "#items", 500, (reset = true));
      organizeLandingUIEffect();
      // reconstruct div with new elements
      getInFolder(
        ".single-item",
        "#items",
        organizeDSglobalPath,
        datasetStructureJSONObj
      );
    }
  });
  $("#guided-new-folder").on("click", () => {
    event.preventDefault();
    var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount !== 1) {
      var newFolderName = "New Folder";
      Swal.fire({
        title: "Add new folder...",
        text: "Enter a name below:",
        heightAuto: false,
        input: "text",
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: "Cancel",
        confirmButtonText: "Add folder",
        reverseButtons: reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        didOpen: () => {
          $(".swal2-input").attr("id", "add-new-folder-input");
          $(".swal2-confirm").attr("id", "add-new-folder-button");
          $("#add-new-folder-input").keyup(function () {
            var val = $("#add-new-folder-input").val();
            for (var char of nonAllowedCharacters) {
              if (val.includes(char)) {
                Swal.showValidationMessage(
                  `The folder name cannot contains the following characters ${nonAllowedCharacters}, please enter a different name!`
                );
                $("#add-new-folder-button").attr("disabled", true);
                return;
              }
              $("#add-new-folder-button").attr("disabled", false);
            }
          });
        },
        didDestroy: () => {
          $(".swal2-confirm").attr("id", "");
          $(".swal2-input").attr("id", "");
        },
      }).then((result) => {
        if (result.value) {
          if (result.value !== null && result.value !== "") {
            newFolderName = result.value.trim();
            // check for duplicate or files with the same name
            var duplicate = false;
            var itemDivElements = document.getElementById("items").children;
            for (var i = 0; i < itemDivElements.length; i++) {
              if (newFolderName === itemDivElements[i].innerText) {
                duplicate = true;
                break;
              }
            }
            if (duplicate) {
              Swal.fire({
                icon: "error",
                text: "Duplicate folder name: " + newFolderName,
                confirmButtonText: "OK",
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });

              logCurationForAnalytics(
                "Error",
                PrepareDatasetsAnalyticsPrefix.CURATE,
                AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                ["Step 3", "Add", "Folder"],
                determineDatasetLocation()
              );
            } else {
              // var appendString = "";
              // appendString =
              //   appendString +
              //   '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
              //   newFolderName +
              //   "</div></div>";
              // $(appendString).appendTo("#items");

              /// update datasetStructureJSONObj
              var currentPath = organizeDSglobalPath.value;
              var jsonPathArray = currentPath.split("/");
              var filtered = jsonPathArray.slice(1).filter(function (el) {
                return el != "";
              });

              var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
              // update Json object with new folder created
              var renamedNewFolder = newFolderName;
              myPath["folders"][renamedNewFolder] = {
                folders: {},
                files: {},
                type: "virtual",
                action: ["new"],
              };

              listItems(myPath, "#items", 500, (reset = true));
              getInFolder(
                ".single-item",
                "#items",
                organizeDSglobalPath,
                datasetStructureJSONObj
              );

              // log that the folder was successfully added
              logCurationForAnalytics(
                "Success",
                PrepareDatasetsAnalyticsPrefix.CURATE,
                AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                ["Step 3", "Add", "Folder"],
                determineDatasetLocation()
              );

              hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
              hideMenu(
                "high-level-folder",
                menuFolder,
                menuHighLevelFolders,
                menuFile
              );
            }
          }
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
        confirmButtonText: "OK",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
  });
  $("#guided-imoprt-file").on("click", () => {
    ipcRenderer.send("open-files-organize-datasets-dialog");
  });
  $("#guided-import-folder").on("click", () => {
    ipcRenderer.send("open-folders-organize-datasets-dialog");
  });
});
