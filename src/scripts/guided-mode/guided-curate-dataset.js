const { parseJSON } = require("jquery");

//Temp variables used for data storage until put into sodaJSONObj on next button press
let guidedUserPermissions = [];
let guidedTeamPermissions = [];

//main nav variables initialized to first page of guided mode
let CURRENT_PAGE = $("#guided-dataset-starting-point-tab");

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
  if (navButtonToClick) {
    if (navButtonToClick === "next") {
      $("#guided-next-button").click();
    }
    if (navButtonToClick === "back") {
      $("#guided-back-button").click();
    }
  }
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

const guidedGetSubjects = () => {
  return Object.keys(
    sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]
  );
};
const guidedGetSubjectSamples = (subject) => {
  return sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
    subject
  ];
};
const guidedGetSamplesSubject = (sample) => {
  for (const subject of guidedGetSubjects()) {
    if (guidedGetSubjectSamples(subject).includes(sample)) {
      return subject;
    }
  }
};

const guidedTransitionFromHome = () => {
  //Hide the home screen
  document.getElementById("guided-home").classList.add("hidden");
  //Hide the header and footer for the dataset name/subtitle page
  $("#guided-header-div").hide();
  $("#guided-footer-div").hide();
  //Show the dataset name/subtitle page
  document
    .getElementById("guided-name-subtitle-parent-tab")
    .classList.remove("hidden");
  //Swith the start curating/modify existing buttons if they were switched
  $("#guided-create-new-dataset").show();
  $("#guided-modify-dataset-name-subtitle").hide();

  //Close the sidebar
  const sidebar = document.getElementById("sidebarCollapse");
  if (!sidebar.classList.contains("active")) {
    sidebar.click();
  }
};
const guidedTransitionToHome = () => {
  guidedPrepareHomeScreen();
  document.getElementById("guided-home").classList.remove("hidden");
  $("#guided-header-div").hide();
  $("#guided-footer-div").hide();
  document
    .getElementById("guided-name-subtitle-parent-tab")
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
    .getElementById("guided-name-subtitle-parent-tab")
    .classList.add("hidden");
  //Show the dataset structure page
  $("#prepare-dataset-parent-tab").css("display", "flex");
  $("#guided-header-div").css("display", "flex");
  $("#guided-footer-div").css("display", "flex");
};

const saveGuidedProgress = (guidedProgressFileName) => {
  //create a Guided-Progress folder if one does not yet exist
  //Destination: HOMEDIR/SODA/Guided-Progress
  sodaJSONObj["last-modified"] = new Date().toLocaleDateString();
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
  // delete manifest files added for treeview
  for (var highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in
        sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
      sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ]["forTreeview"] === true
    ) {
      delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
        "manifest.xlsx"
      ];
    }
  }
  //Add datasetStructureJSONObj to the sodaJSONObj and use to load the
  //datasetStructureJsonObj when progress resumed
  sodaJSONObj["saved-datset-structure-json-obj"] = datasetStructureJSONObj;
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
  console.log(progressFilePath);
  return readFileAsync(progressFilePath);
};
const deleteProgressCard = async (progressCardDeleteButton) => {
  const progressCard = progressCardDeleteButton.parentElement;
  const progressCardNameToDelete = progressCard.querySelector(
    ".progress-file-name"
  ).textContent;

  const result = await Swal.fire({
    title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
    text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
    icon: "warning",
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
const renderProgressCards = (progressFileJSONdata) => {
  //sort progressFileJSONdata by date to place newest cards on top
  progressFileJSONdata.sort((a, b) => {
    return new Date(b["last-modified"]) - new Date(a["last-modified"]);
  });
  let cardContainer = document.getElementById("resume-curation-container");
  const progressCards = progressFileJSONdata.map((progressFile) => {
    console.log(progressFile);
    let progressFileImage =
      progressFile["digital-metadata"]["banner-image-path"] || "";

    if (progressFileImage === "") {
      progressFileImage = `
          <img
            src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
            alt="Dataset banner image placeholder"
            style="height: 60px; width: 60px"
          />
        `;
    } else {
      progressFileImage = `
          <img
            src='${progressFileImage}'
            alt="Dataset banner image"
            style="height: 60px; width: 60px"
          />
        `;
    }
    const progressFileName = progressFile["digital-metadata"]["name"] || "";
    const progressFileSubtitle =
      progressFile["digital-metadata"]["subtitle"] || "No designated subtitle";
    let progressFileOwnerName =
      progressFile["digital-metadata"]["pi-owner"]["name"];
    const progressFileLastModified = progressFile["last-modified"];

    return `
      <div class="guided--dataset-card">
        <i
          class="fas fa-times fa-2x"
          style="
            position: absolute;
            top: 10px;
            right: 15px;
            color: black;
            cursor: pointer;
          "
          onclick="deleteProgressCard(this)"
        ></i>
        <div class="guided--container-dataset-card-center">  
        ${progressFileImage}     
          <div class="guided--dataset-card-title">
            <h1 class="guided--text-dataset-card progress-file-name">${progressFileName}</h1>
            <h2 class="guided--text-dataset-card-sub">
              ${progressFileSubtitle}
            </h2>
          </div>
        </div>
        <div class="guided--dataset-card-body">
          <div class="guided--dataset-card-item">
            <h1 class="guided--text-dataset-card">${progressFileOwnerName}</h1>
            <h2 class="guided--text-dataset-card-sub">Owner</h2>
          </div>
          <div class="guided--dataset-card-item">
            <h1 class="guided--text-dataset-card">0 GB</h1>
            <h2 class="guided--text-dataset-card-sub">Size</h2>
          </div>
          <div class="guided--dataset-card-item">
            <h1 class="guided--text-dataset-card">
              ${progressFileLastModified}
            </h1>
            <h2 class="guided--text-dataset-card-sub">Last modified</h2>
          </div>
          <div class="guided--dataset-card-item">
            <h1 class="guided--text-dataset-card">In progress</h1>
            <h2 class="guided--text-dataset-card-sub"> 
              Curation status
            </h2>
          </div>
        </div>
        <div class="guided--container-dataset-card-center">
          <button
            class="ui positive button guided--button-footer"
            style="
              background-color: var(--color-light-green) !important;
              width: 160px !important;
              margin: 10px;
            "
            onClick="guidedResumeProgress($(this))"
          >
            Continue curation
          </button>
        </div>
      </div>`;
  });
  cardContainer.innerHTML = progressCards.join("\n");
};
const setActiveCapsule = (targetPageID) => {
  $(".guided--capsule").removeClass("active");
  let targetCapsuleID = targetPageID.replace("-tab", "-capsule");
  console.log(targetCapsuleID);
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
  console.log(targetPageParentID);
  let targetProgressionTabID = targetPageParentID.replace(
    "parent-tab",
    "progression-tab"
  );
  console.log(targetProgressionTabID);
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
    console.log(pageBranchToRemoveSkip);
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
    fs.mkdirSync(guidedProgressFilePath);
  }

  //Refresh Home page UI
  $("#guided-button-start-new-curate").css("display", "flex");
  $("#continue-curating-existing").css("display", "flex");

  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);
  //render progress resumption cards from progress file array on first page of guided mode
  if (guidedSavedProgressFiles.length != 0) {
    $("#guided-continue-curation-header").text(
      "Or continue curating a previously started dataset below."
    );
    const progressFileData = await getAllProgressFileData(
      guidedSavedProgressFiles
    );
    renderProgressCards(progressFileData);
  } else {
    $("#guided-continue-curation-header").text(
      "After creating your dataset, your progress will be saved and resumable below."
    );
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
        console.log(subjectsWithEmptyFolders);
        let result = await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
          icon: "warning",
          title: "Continue?",
          text: `${highLevelFolder} data was not added to all of your subjects. Continuing will delete all dataset folders for subjects that do not contain samples with data. You will be able to come back and add additional subject data at a later time.`,
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
          title: "Continue?",
          text: `${highLevelFolder} data was not added to all of your samples.\n\nContinuing will delete all dataset folders for samples that do not contain sample data.\n\nYou will be able to come back and add additional sample data at a later time.`,
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

const traverseToTab = (targetPageID) => {
  try {
    //refresh selectPickers if page has them
    if (
      targetPageID === "guided-designate-pi-owner-tab" ||
      "guided-designate-permissions-tab"
    ) {
      //Refresh select pickers so items can be selected
      $(".selectpicker").selectpicker("refresh");
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
    if (targetPageID === "guided-code-folder-tab") {
      //Append the guided-file-explorer element to the code folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-code-data")
      );
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
    }
    if (targetPageID === "guided-docs-folder-tab") {
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-user-has-docs-data")
      );
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document
        .getElementById("guided-file-explorer-elements")
        .classList.remove("hidden");
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

    if (targetPageID === "guided-folder-structure-preview-tab") {
      var folderStructurePreview = document.getElementById(
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
        console.log(event);
        console.log(data);
        data.instance.set_type(data.node, "folder closed");
      });
      guidedShowTreePreview(
        sodaJSONObj["digital-metadata"]["name"],
        folderStructurePreview
      );
    }

    if (targetPageID === "guided-samples-folder-tab") {
      renderSamplesTables();
    }
    if (targetPageID === "guided-banner-image-tab") {
      if (sodaJSONObj["digital-metadata"]["banner-image-path"]) {
        guidedShowBannerImagePreview(
          sodaJSONObj["digital-metadata"]["banner-image-path"]
        );
      }
    }
    if (targetPageID === "guided-designate-permissions-tab") {
      renderPermissionsTable();
    }
    if (targetPageID === "guided-add-tags-tab") {
      //clear dataset tags
      guidedDatasetTagsTagify.removeAllTags();
      //Add tags from jsonObj if they exist
      const datasetTags = sodaJSONObj["digital-metadata"]["dataset-tags"];
      if (sodaJSONObj["digital-metadata"]["dataset-tags"]) {
        guidedDatasetTagsTagify.addTags(datasetTags);
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
    if (targetPageID === "guided-contributors-tab") {
      const sparcAward =
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      // check if airtableconfig has non empty api-key and key-name properties
      const airTableKeyData = parseJson(airtableConfigPath);
      let airTableKeyDataValid = null;
      if (
        airTableKeyData["api-key"] &&
        airTableKeyData["key-name"] &&
        airTableKeyData["key-name"] !== "" &&
        airTableKeyData["api-key"] !== ""
      ) {
        airTableKeyDataValid = true;
      } else {
        airTableKeyDataValid = false;
      }
      //if an AirTable account and sparc award already exist, show the table
      //if not, show the prompt to import award/contributor data
      if (airTableKeyDataValid && sparcAward) {
        //Show contributor fields and hide contributor information fields
        document
          .getElementById("guided-div-contributors-imported-from-airtable")
          .classList.remove("hidden");
        document
          .getElementById("guided-div-contributor-field-set")
          .classList.add("hidden");
        loadContributorInfofromAirtable(sparcAward, "guided");
      } else {
        //hide AirTable contributor table and show contributor information fields
        document
          .getElementById("guided-div-contributors-imported-from-airtable")
          .classList.add("hidden");
        document
          .getElementById("guided-div-contributor-field-set")
          .classList.remove("hidden");
        //Add an empty contributor information fieldset if contributors container is empty
        if (
          document.getElementById("contributors-container").innerHTML === ""
        ) {
          //add an empty contributor information fieldset
          addContributorField();
        }
      }
    }

    if (targetPageID === "guided-create-subjects-metadata-tab") {
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
    }

    if (targetPageID === "guided-create-samples-metadata-tab") {
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
    }
    if (targetPageID === "guided-add-code-metadata-tab") {
      const codeDescriptionLottieContainer = document.getElementById(
        "code-description-lottie-container"
      );
      codeDescriptionLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeDescriptionLottieContainer,
        animationData: dragDrop,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      const codeParametersLottieContainer = document.getElementById(
        "code-parameters-lottie-container"
      );
      codeParametersLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: codeParametersLottieContainer,
        animationData: dragDrop,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
    }
    if (targetPageID === "guided-create-description-metadata-tab") {
      renderAdditionalLinksTable();

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
      }
    }

    let currentParentTab = CURRENT_PAGE.parent();
    let targetPage = $(`#${targetPageID}`);
    let targetPageParentTab = targetPage.parent();

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveCapsule(targetPageID);
    setActiveProgressionTab(targetPageID);

    //Check to see if target element has the same parent as current sub step
    if (currentParentTab.attr("id") === targetPageParentTab.attr("id")) {
      CURRENT_PAGE.hide();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
    } else {
      CURRENT_PAGE.hide();
      currentParentTab.hide();
      targetPageParentTab.show();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
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
      console.log("foo");
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

      console.log(subjects);

      //Create the HTML for the subjects
      const subjectSampleAdditionTables = subjects
        .map((subject) => {
          return renderSubjectSampleAdditionTable(subject);
        })
        .join("\n");
      console.log(subjectSampleAdditionTables);

      //Add the subject sample addition elements to the DOM
      const subjectSampleAdditionTableContainer = document.getElementById(
        "guided-div-add-samples-tables"
      );

      subjectSampleAdditionTableContainer.innerHTML =
        subjectSampleAdditionTables;
      break;
    }

    case "guided-primary-samples-organization-page": {
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
  }

  //Show target page and hide its siblings
  pageElementToActivate.classList.remove("hidden");
  const pageElementSiblings = pageElementToActivate.parentElement.children;
  //filter pageelementSiblings to only contain elements with class "sub-page"
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
      <div class="alert alert-${alertType} guided--alert" role="alert">
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

//populates user inputs from the completed-tabs array, and returns the last page
//that the user completed
const populateGuidedModePages = (loadedJSONObj) => {
  let completedTabs = loadedJSONObj["completed-tabs"];
  //variable that keeps track if last completed page. Once this function is finished populating the UI,
  //the last completed page is rendered and next button clicked
  let lastCompletedTab = "none";

  if (completedTabs.includes("guided-dataset-starting-point-tab")) {
    let datasetName = loadedJSONObj["digital-metadata"]["name"];
    let datasetSubtitle = loadedJSONObj["digital-metadata"]["subtitle"];

    $("#guided-dataset-name-input").val(datasetName);
    $("#guided-dataset-subtitle-input").val(datasetSubtitle);

    let startingPoint = loadedJSONObj["starting-point"]["type"];
    if (startingPoint == "new") {
      //this will break when no/yes cards are changed
      handlePageBranching($("#guided-curate-new-dataset-card"));
      lastCompletedTab = "guided-dataset-starting-point-tab";
    }
    if (startingPoint == "local") {
      handlePageBranching($("#guided-curate-existing-local-dataset-card"));
      lastCompletedTab = "guided-dataset-starting-point-tab";
    } else {
      lastCompletedTab = "guided-dataset-starting-point-tab";
    }
  }
  if (completedTabs.includes("guided-banner-image-addition-tab")) {
    // CURRENTLY NO UI UPDATES ON THIS TAB
    console.log("contains banner image");
    lastCompletedTab = "guided-banner-image-addition-tab";
  }
  if (completedTabs.includes("guided-subjects-folder-tab")) {
    lastCompletedTab = "guided-subjects-folder-tab";
  }
  if (completedTabs.includes("guided-samples-folder-tab")) {
    lastCompletedTab = "guided-samples-folder-tab";
  }
  if (completedTabs.includes("guided-source-folder-tab")) {
    lastCompletedTab = "guided-source-folder-tab";
  }
  if (completedTabs.includes("guided-derivative-folder-tab")) {
    lastCompletedTab = "guided-derivative-folder-tab";
  }
  if (completedTabs.includes("guided-code-folder-tab")) {
    lastCompletedTab = "guided-code-folder-tab";
  }
  if (completedTabs.includes("guided-docs-folder-tab")) {
    lastCompletedTab = "guided-docs-folder-tab";
  }

  if (completedTabs.includes("guided-folder-importation-tab")) {
    let datasetLocation = loadedJSONObj["starting-point"]["local-path"];
    $(".guidedDatasetPath").text(datasetLocation);
    lastCompletedTab = "guided-folder-importation-tab";
  }
  if (completedTabs.includes("guided-designate-pi-owner-tab")) {
    let PIOwner = loadedJSONObj["digital-metadata"]["pi-owner"]["userString"];
    $(".guidedDatasetOwner").text(PIOwner);
    lastCompletedTab = "guided-designate-pi-owner-tab";
  }
  if (completedTabs.includes("guided-designate-permissions-tab")) {
    // CURRENTLY NO UI UPDATES ON THIS TAB   TODO LATER

    lastCompletedTab = "guided-designate-permissions-tab";
  }
  if (completedTabs.includes("guided-add-description-tab")) {
    let studyPurpose = loadedJSONObj["digital-metadata"]["study-purpose"];
    let dataCollection = loadedJSONObj["digital-metadata"]["data-collection"];
    let primaryConclusion =
      loadedJSONObj["digital-metadata"]["primary-conclusion"];
    let datasetTags = loadedJSONObj["digital-metadata"]["dataset-tags"];
    $("#guided-ds-description-study-purpose").val(studyPurpose);
    $("#guided-ds-description-data-collection").val(dataCollection);
    $("#guided-ds-description-primary-conclusion").val(primaryConclusion);
    guidedDatasetTagsTagify.addTags(datasetTags);

    lastCompletedTab = "guided-add-description-tab";
  }
  if (completedTabs.includes("guided-assign-license-tab")) {
    // CURRENTLY NO UI UPDATES ON THIS TAB   TODO LATER
    let datasetLicense = loadedJSONObj["digital-metadata"]["license"];
    $(".guidedBfLicense").text(datasetLicense);

    lastCompletedTab = "guided-assign-license-tab";
  }

  $("#guided_create_new_bf_dataset_btn").click();
  console.log(lastCompletedTab);
  traverseToTab(lastCompletedTab);
  //Refresh select pickers so items can be selected
  $(".selectpicker").selectpicker("refresh");
  $("#guided-next-button").click();
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
  datasetStructureJSONObj = sodaJSONObj["saved-datset-structure-json-obj"];
  populateGuidedModePages(sodaJSONObj);
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

//FOLDER STRUCTURE UTIL FUNCTIONS
const openSubjectFolder = (clickedStructureButton) => {
  let subjectID = clickedStructureButton
    .closest("tr")
    .find(".subject-id")
    .text();
  $("#structure-folder-header").text(
    `Virtually structure ${subjectID}'s subject folder in the interface below.`
  );
  $("#structure-folder-contents").text(
    `${subjectID}'s folder should contain lorem ipsum foo bar random instructional
    text will go here`
  );
  $("#structure-return-destination-text").text("subjects table");
  $("#guided-input-global-path").val(`My_dataset_folder/primary/${subjectID}/`);
  $("#folder-structure-button-row-top").append(`
    <button
      class="ui secondary basic button small"
      onclick="returnToTableFromFolderStructure($(this))"
      data-prev-page="guided-subjects-folder-tab"
    >
      <i class="fas fa-arrow-left" style="margin-right: 10px"></i
      >Back to subjects table
    </button>
  `);
  traverseToTab("guided-structure-folder-tab");
  $("#guided-footer-div").hide();
  //Manually override active capsule to make it seem like they're still on the subjects tab
  setActiveCapsule("guided-subjects-folder-tab");

  var filtered = getGlobalPath(organizeDSglobalPath);
  organizeDSglobalPath.value =
    filtered.slice(0, filtered.length).join("/") + "/";
  var myPath = datasetStructureJSONObj;
  for (var item of filtered.slice(1, filtered.length)) {
    console.log(item);
    myPath = myPath["folders"][item];
  }
  // construct UI with files and folders
  var appendString = loadFileFolder(myPath);

  /// empty the div
  $("#items").empty();
  $("#items").html(appendString);

  // reconstruct div with new elements
  listItems(myPath, "#items");
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
};

//TODO CLEAN UP
const guidedAddHighLevelFolderToDatasetStructureObj = (highLevelFolderName) => {
  datasetStructureJSONObj["folders"][highLevelFolderName] = {
    folders: {},
    files: {},
    type: "",
    action: [],
  };
};

//dataset description (first page) functions
guidedCreateSodaJSONObj = () => {
  sodaJSONObj = {
    addSubject: function (subjectName) {
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
    },
    renameSubject: function (prevSubjectName, newSubjectName) {
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
        console.log(subjectData);
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
            this["dataset-metadata"]["pool-subject-sample-structure"][
              "subjects"
            ][prevSubjectName];
          delete this["dataset-metadata"]["pool-subject-sample-structure"][
            "subjects"
          ][prevSubjectName];
          return;
        }
      }
    },
    deleteSubject: function (subjectName) {
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
    },
    getSubjectsOutsidePools: function () {
      let subjectsNotInPools = Object.keys(
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
      );
      return /*subjectsInPools.concat(*/ subjectsNotInPools /*)*/;
    },
    getSubjectsInPools: function () {
      return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
    },
    moveSubjectIntoPool: function (subjectName, poolName) {
      console.log(subjectName);
      console.log(poolName);
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ][subjectName] =
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
          subjectName
        ];
      delete this["dataset-metadata"]["pool-subject-sample-structure"][
        "subjects"
      ][subjectName];
    },
    moveSubjectOutOfPool: function (subjectName, poolName) {
      console.log(subjectName);
      console.log(poolName);
      console.log(
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
          subjectName
        ]
      );
      console.log(
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          poolName
        ][subjectName]
      );
      console.log(
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          poolName
        ][subjectName]
      );
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
        subjectName
      ] =
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          poolName
        ][subjectName];
      delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        poolName
      ][subjectName];
    },
    addPool: function (poolName) {
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
    },
    renamePool: function (prevPoolName, newPoolName) {
      console.log(prevPoolName, newPoolName);
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
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "pools"
        ][prevPoolName];
      }
    },
    deletePool: function (poolName) {
      console.log(poolName);
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
    },
    getPools: function () {
      return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
    },
    getPoolSubjects: function (poolName) {
      return Object.keys(
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          poolName
        ]
      );
    },
    addSample: function (sampleName) {
      if (
        this["dataset-metadata"]["pool-subject-sample-structure"]["samples"][
          sampleName
        ]
      ) {
        throw new Error("Sample IDs must be unique for each subject.");
      } else {
        this["dataset-metadata"]["pool-subject-sample-structure"]["samples"][
          sampleName
        ] = {};
      }
    },
    addSampleToSubject: function (sampleName, subjectPoolName, subjectName) {
      console.log(sampleName, subjectPoolName, subjectName);
      if (subjectPoolName) {
        if (
          this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subjectPoolName
          ][subjectName][sampleName]
        ) {
          throw new Error("Sample IDs must be unique for each subject.");
        }
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
          subjectPoolName
        ][subjectName][sampleName] = {};
      } else {
        if (
          this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            subjectName
          ][sampleName]
        ) {
          throw new Error("Sample IDs must be unique for each subject.");
        }
        this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
          subjectName
        ][sampleName] = {};
      }
    },
    renameSample: function (
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
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "pools"
        ][subjectPoolName][subjectName][sampleToRename];
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
    },
    deleteSample: function (sampleName, subjectPoolName, subjectName) {
      if (subjectPoolName) {
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "pools"
        ][subjectPoolName][subjectName][sampleName];
      } else {
        delete this["dataset-metadata"]["pool-subject-sample-structure"][
          "subjects"
        ][subjectName][sampleName];
      }
    },
    getAllSubjects: function () {
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
    },
    getAllSamplesFromSubjects: function () {
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
      console.log(samplesInPools, samplesOutsidePools);

      return [samplesInPools, samplesOutsidePools];
    },
    updatePrimaryDatasetStructure: function () {
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
    },
  };

  sodaJSONObj["guided-options"] = {};
  sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  sodaJSONObj["generate-dataset"] = {};
  sodaJSONObj["manifest-files"] = {};
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
  sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    [];
  sodaJSONObj["dataset-metadata"]["readMe-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["changes-metadata"] = {};
  sodaJSONObj["digital-metadata"] = {};
  sodaJSONObj["digital-metadata"]["user-permissions"] = [];
  sodaJSONObj["digital-metadata"]["team-permissions"] = [];
  sodaJSONObj["completed-tabs"] = [];
  sodaJSONObj["last-modified"] = "";
  datasetStructureJSONObj = { folders: {}, files: {} };
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
    headerText: "Virtually structure your code folder in the interface below.",
    contentsText:
      "Your code folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "code/",
    backPageId: "guided-code-folder-tab",
  },
  docs: {
    headerText: "Virtually structure your docs folder in the interface below.",
    contentsText:
      "Your docs folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "docs/",
    backPageId: "guided-docs-folder-tab",
  },
  protocol: {
    headerText:
      "Virtually structure your protocol folder in the interface below.",
    contentsText:
      "Your protocol folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "protocol/",
    backPageId: "guided-protocol-folder-tab",
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
  console.log(pageDataObj);
  const structureFolderHeaderElement = document.getElementById(
    "structure-folder-header"
  );
  const structureFolderContentsElement = document.getElementById(
    "structure-folder-contents"
  );
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

  $("#guided-input-global-path").val(
    `My_dataset_folder/${pageDataObj.pathSuffix}`
  );
  console.log(organizeDSglobalPath);
  var filtered = getGlobalPath(organizeDSglobalPath);
  organizeDSglobalPath.value =
    filtered.slice(0, filtered.length).join("/") + "/";

  var myPath = datasetStructureJSONObj;
  for (var item of filtered.slice(1, filtered.length)) {
    myPath = myPath["folders"][item];
  }
  // construct UI with files and folders
  //var appendString = loadFileFolder(myPath);
  //console.log(appendString);

  /// empty the div

  // reconstruct div with new elements

  listItems(myPath, "#items", 500, (reset = true));
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
  console.log("loading done");
};
//Description metadata functions
const generateadditionalLinkRowElement = (link, linkType, linkRelation) => {
  return `
    <tr>
      <td class="middle aligned collapsing">
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
          class="btn btn-primary btn-sm"
          style="
            margin-right: 5px;
          "
          onclick="editLink($(this))"
        >
          Edit link
        </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="deleteLink($(this))"
        >   
          Delete link
        </button>
      </td>
    </tr>
  `;
};

const deleteAdditionalLink = (deleteLinkRowButton) => {};
const generateContributorField = (
  contributorLastName,
  contributorFirstName,
  contributorORCID,
  contributorAffiliation,
  contributorRole
) => {
  return `
      <div class="guided--section mt-lg neumorphic guided-contributor-field-container" style="position: relative">
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
            <label class="guided--form-label">Last name: </label>
            <input
              class="
                guided--input
                guided-last-name-input
              "
              type="text"
              placeholder="Enter last name here"
              onkeyup="validateInput($(this))"
              value="${contributorLastName ? contributorLastName : ""}"
              ${contributorFirstName ? "readonly" : ""}
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label">First name: </label>
            <input
              class="
                guided--input
                guided-first-name-input
              "
              type="text"
              placeholder="Enter first name here"
              onkeyup="validateInput($(this))"
              value="${contributorFirstName ? contributorFirstName : ""}"
              ${contributorFirstName ? "readonly" : ""}
            />
          </div>
        </div>
        <div class="space-between w-100 mb-md">
          <div class="guided--flex-center mt-md" style="width: 45%">
            <label class="guided--form-label">ORCID: </label>
            <input
              class="
                guided--input
                guided-orcid-input
              "
              type="text"
              placeholder="Enter ORCID here"
              onkeyup="validateInput($(this))"
              value="${contributorORCID ? contributorORCID : ""}"
              ${contributorORCID ? "readonly" : ""}
            />
          </div>
          <div class="guided--flex-center mt-md" style="width: 45%">
            <label class="guided--form-label">Affiliation: </label>
            <input
              class="
                guided--input
                guided-affiliation-input
              "
              type="text"
              placeholder="Enter affiliation here"
              onkeyup="validateInput($(this))"
              value="${contributorAffiliation ? contributorAffiliation : ""}"
              ${contributorAffiliation ? "readonly" : ""}
            />
          </div>
        </div>
        <label class="guided--form-label">Role(s): </label>
        <input class="guided-contributor-role-input"
          contenteditable="true"
          placeholder='Type here to view and add contributor roles'
        />
      </div>
    `;
};
const removeContributorField = (contributorDeleteButton) => {
  const contributorField = contributorDeleteButton.parentElement;
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
        <label class="guided--form-label">Last name: </label>
        <input
          class="guided--input guided-last-name-input"
          type="text"
          placeholder="Enter last name here"
          onkeyup="validateInput($(this))"
        />
      </div>
      <div class="guided--flex-center mt-sm" style="width: 45%">
        <label class="guided--form-label">First name: </label>
        <input
          class="guided--input guided-first-name-input"
          type="text"
          placeholder="Enter first name here"
          onkeyup="validateInput($(this))"
        />
      </div>
    </div>
    <div class="space-between w-100 mb-md">
      <div class="guided--flex-center mt-md" style="width: 45%">
        <label class="guided--form-label">ORCID: </label>
        <input
          class="guided--input guided-orcid-input"
          type="text"
          placeholder="Enter ORCID here"
          onkeyup="validateInput($(this))"
        />
      </div>
      <div class="guided--flex-center mt-md" style="width: 45%">
        <label class="guided--form-label">Affiliation: </label>
        <input
          class="guided--input guided-affiliation-input"
          type="text"
          placeholder="Enter affiliation here"
          onkeyup="validateInput($(this))"
        />
      </div>
    </div>
    <label class="guided--form-label">Role(s): </label>
    <input class="guided-contributor-role-input"
      contenteditable="true"
      placeholder='Type here to view and add contributor roles'
    />
  `;
  contributorsContainer.appendChild(newContributorField);

  //select the last contributor role input (the one that was just added)
  const newlyAddedContributorField = contributorsContainer.lastChild;
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
      enabled: 1,
      closeOnSelect: true,
      position: "auto",
    },
  });
  //scroll to the new element
  smoothScrollToElement(newlyAddedContributorField);
};

const addProtocolField = () => {
  const protocolsContainer = document.getElementById("protocols-container");
  //create a new div to hold contributor fields
  const newProtocolField = document.createElement("div");
  newProtocolField.classList.add("guided--section");
  newProtocolField.classList.add("mt-lg");
  newProtocolField.classList.add("neumorphic");
  newProtocolField.classList.add("guided-protocol-field-container");
  newProtocolField.style.position = "relative";

  newProtocolField.innerHTML = `
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
    <label class="guided--form-label mt-lg">Protocol URL: </label>
    <input
      class="guided--input guided-protocol-url-input"
      type="text"
      placeholder="Enter protocol URL here"
      onkeyup="validateInput($(this))"
    />
    <label class="guided--form-label mt-lg"
      >Protocol description:</label
    >
    <textarea
      class="guided--input guided--text-area guided-protocol-description-input"
      type="text"
      placeholder="Enter protocol description here"
      style="height: 7.5em; padding-bottom: 20px"
      onkeyup="validateInput($(this))"
    >The protocol used to generate this dataset</textarea>
  `;
  protocolsContainer.appendChild(newProtocolField);
  //select the last protocol field (the one that was just added)
  const newlyAddedProtocolField = protocolsContainer.lastChild;
  smoothScrollToElement(newlyAddedProtocolField);
};

const removeProtocolField = (protocolDeleteButton) => {
  const protocolField = protocolDeleteButton.parentElement;
  protocolField.remove();
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
        console.log(link);
        return generateadditionalLinkRowElement(
          link.link,
          link.linkType,
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
      <label
        >URL or DOI:
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
    let linkType = null;
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
      linkType: linkType,
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
    >
      <thead>
        <tr>
          <th class="text-center" colspan="2">
            <div class="space-between w-100">
              <span class="samples-subjects-pool">${
                subject.poolName ? subject.poolName : ""
              }</span>
              <span class="samples-subject-name">${subject.subjectName}</span>
              <button
              type="button"
              class="btn btn-primary btn-sm"
              onclick="addSampleSpecificationTableRow(this)"
            >
              Add sample
            </button>
            </div>
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

const renderSubjectsMetadataTable = (subjects) => {
  let subjectMetadataRows = subjects
    .map((subject, index) => {
      let tableIndex = index + 1;
      return `
      <tr>
        <td class="middle aligned collapsing text-center">
          <span class="subject-metadata-table-index">${tableIndex}</span>
        </td>
        <td class="middle aligned subject-metadata-id-cell">
          <span class="subject-metadata-id">${subject}</span>
        </td>
        <td class="middle aligned collapsing text-center" style="min-width: 130px">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            style="background-color: var(--color-light-green) !important; margin-right: 5px"
            onclick="openModifySubjectMetadataPage($(this))"
          >
            Edit metadata
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            onclick="openCopySubjectMetadataPopup($(this))"
          >
            Copy metadata
          </button>
        </td>
      </tr>
    `;
    })
    .join("\n");
  let subjectsMetadataContainer = document.getElementById(
    "subjects-metadata-table-container"
  );
  //subjectsMetadataContainer.innerHTML = subjectMetadataRows;
};
const guidedLoadSubjectMetadataIfExists = (subjectMetadataId) => {
  //loop through all subjectsTableData elements besides the first one
  for (let i = 1; i < subjectsTableData.length; i++) {
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
  console.log(samplesTableData);
  console.log(sampleMetadataId);
  console.log(subjectMetadataId);
  for (let i = 1; i < samplesTableData.length; i++) {
    if (
      samplesTableData[i][0] === subjectMetadataId &&
      samplesTableData[i][1] === sampleMetadataId
    ) {
      //if the id matches, load the metadata into the form
      console.log("match found");
      populateFormsSamples(subjectMetadataId, sampleMetadataId, "", "guided");
      return;
    }
  }
};
const openModifySubjectMetadataPage = (subjectMetadataID) => {
  guidedLoadSubjectMetadataIfExists(subjectMetadataID);
  $("#guided-metadata-subject-id").text(subjectMetadataID);
};
const openModifySampleMetadataPage = (
  sampleMetadataID,
  sampleMetadataSubjectID,
  sampleMetadataPoolID
) => {
  guidedLoadSampleMetadataIfExists(sampleMetadataID, sampleMetadataSubjectID);
  $("#guided-metadata-sample-id").text(sampleMetadataID);
  $("#guided-metadata-sample-subject-id").text(sampleMetadataSubjectID);
  document.getElementById("guided-bootbox-wasDerivedFromSample").value =
    sampleMetadataSubjectID;
  document.getElementById("guided-bootbox-sample-pool-id").value =
    sampleMetadataPoolID;
};

const openCopySubjectMetadataPopup = async () => {
  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjectsArray = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically
  subjectsArray = subjectsArray.map((subject) => subject.subjectName);

  const copyFromMetadata = subjectsArray
    .map((subject) => {
      return `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${subject}">
          <label>${subject}</label>
        </div>
      </div>`;
    })
    .join("\n");

  const copyToMetadata = subjectsArray
    .map((subject) => {
      return `
      <div class="field text-left">
        <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${subject}">
          <label>${subject}</label>
        </div>
      </div>`;
    })
    .join("\n");

  const copyMetadataElement = `
  <div class="space-between">
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
        console.log(selectedCopyFromSubject);
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSubjects = [];
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSubjects.push($(this).val());
        });

        let copyFromSubjectData = [];
        for (var i = 1; i < subjectsTableData.length; i++) {
          if (subjectsTableData[i][0] === selectedCopyFromSubject) {
            //copy all elements from matching array except the first one
            copyFromSubjectData = subjectsTableData[i].slice(2);
          }
        }
        for (subject of selectedCopyToSubjects) {
          //initialize copyToSubjectHasMetadata as false, set to True if the subject being copied to has existing metadata
          //If not, add the subject to the subjectsTable and add metadata being copied
          let copyToSubjectHasMetadata = false;
          subjectsTableData.forEach((subjectData, index) => {
            if (subjectData[0] === subject) {
              copyToSubjectHasMetadata = true;
              subjectData = [subjectData[0], subjectData[1]];
              subjectData = subjectData.concat(copyFromSubjectData);
              subjectsTableData[index] = subjectData;
            }
          });
          if (!copyToSubjectHasMetadata) {
            newSubjectData = [subject].concat(copyFromSubjectData);
            subjectsTableData.push(newSubjectData);
          }
        }

        console.log(subjectsTableData);
      }
    });
};

const openCopySampleMetadataPopup = async () => {
  const [samplesInPools, samplesOutsidePools] =
    sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];

  //sort samples object by sampleName property alphabetically
  samples = samples.map((sample) => sample.sampleName);

  const copyFromMetadata = samples
    .map((sample) => {
      return `
        <div class="field text-left">
          <div class="ui radio checkbox">
            <input type="radio" name="copy-from" value="${sample}">
            <label>${sample}</label>
          </div>
        </div>`;
    })
    .join("\n");

  const copyToMetadata = samples
    .map((sample) => {
      return `
        <div class="field text-left">
          <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${sample}">
          <label>${sample}</label>
          </div>
        </div>
      `;
    })
    .join("\n");

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

        let copyFromSampleData = []; //["input1","input"]
        //Add the data from the selected copy fro sample to cpoyFromSampleData array
        for (var i = 1; i < samplesTableData.length; i++) {
          if (samplesTableData[i][1] === selectedCopyFromSample) {
            //copy all elements from matching array except the first one
            copyFromSampleData = samplesTableData[i].slice(4);
            console.log(copyFromSampleData);
          }
        }
        for (sample of selectedCopyToSamples) {
          let copyToSampleHasMetadata = false;
          samplesTableData.forEach((sampleData, index) => {
            console.log(sampleData);
            if (sampleData[1] === sample) {
              console.log(samplesTableData);
              copyToSampleHasMetadata = true;
              sampleData = [
                sampleData[0],
                sampleData[1],
                sampleData[2],
                sampleData[3],
              ];
              sampleData = sampleData.concat(copyFromSampleData);
              samplesTableData[index] = sampleData;
              console.log(samplesTableData);
            }
          });
          if (!copyToSampleHasMetadata) {
            console.log(samplesTableData);

            newsampleData = [guidedGetSamplesSubject(sample), sample].concat(
              copyFromSampleData
            );
            samplesTableData.push(newsampleData);
            console.log(samplesTableData);
          }
        }
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
      console.log(poolName);
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
      if (poolName.length > 0) {
        if (!subSamInputIsValid(poolName)) {
          //show alert message below pool name input if input is invalid and abort function
          generateAlertMessage(poolNameInput);
          return;
        }
        removeAlertMessageIfExists(poolNameInput);
        if (poolNameInput.attr("data-prev-name")) {
          const poolFolderToRename = poolNameInput.attr("data-prev-name");

          sodaJSONObj.renamePool(poolFolderToRename, poolName);

          //refresh the UI to update the dropdowns to avoid having to update select2 dropdowns
          setActiveSubPage("guided-organize-subjects-into-pools-page");
          return;
        } else {
          console.log(poolSubjectsDropdownCell);
          //Add left border back to subject dropdown cell to seperate pool name and subject dropdown
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
        placeholder="Enter new subject ID"
        onkeyup="specifySubject(event, $(this))"
        data-input-set="guided-subjects-folder-tab"
        data-alert-message="Subject IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSubjectName}"
      />
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
        style="width: 250px;"
      />
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
  }
};
const addSampleSpecificationTableRow = (clickedSubjectAddSampleButton) => {
  const addSampleTable = clickedSubjectAddSampleButton.closest("table");
  const addSampleTableBody = addSampleTable.querySelector("tbody");

  //check if subject specification table body has an input with the name guided-subject-id
  const sampleSpecificationTableInput = addSampleTableBody.querySelector(
    "input[name='guided-sample-id']"
  );

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

  if (poolSpecificationTableInput) {
    //focus on the input that already exists
    poolSpecificationTableInput.focus();
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
};
const deletePool = (poolDeleteButton) => {
  const poolIdCellToDelete = poolDeleteButton.closest("tr");
  const poolIdToDelete = poolIdCellToDelete.find(".pool-id").text();
  //delete the table row element in the UI
  poolIdCellToDelete.remove();
  sodaJSONObj.deletePool(poolIdToDelete);
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
    console.log(samplesSubject);
    console.log(samplesSubjectsPool);

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
    </div>
  `;
  sampleIdCellToRename.html(sampleRenameElement);
};
const openSampleFolder = (clickedStructureButton) => {
  let subjectIdFromTable = clickedStructureButton
    .closest("tbody")
    .siblings()
    .find(".sample-table-name")
    .text()
    .trim();
  let sampleID = clickedStructureButton.closest("tr").find(".sample-id").text();

  $("#structure-folder-header").text(
    `Virtually structure ${sampleID}'s subject folder in the interface below.`
  );
  $("#structure-folder-contents").text(
    `${sampleID}'s folder should contain lorem ipsum foo bar random instructional
    text will go here`
  );
  $("#structure-return-destination-text").text("subjects table");

  $("#guided-input-global-path").val(
    `My_dataset_folder/primary/${subjectIdFromTable}/${sampleID}/`
  );
  $("#folder-structure-button-row-top").append(`
    <button
      class="ui secondary basic button small"
      onclick="returnToTableFromFolderStructure($(this))"
      data-prev-page="guided-samples-folder-tab"
    >
      <i class="fas fa-arrow-left" style="margin-right: 10px"></i
      >Back to samples table
    </button>
  `);
  traverseToTab("guided-structure-folder-tab");
  $("#guided-footer-div").hide();

  setActiveCapsule("guided-samples-folder-tab");

  var filtered = getGlobalPath(organizeDSglobalPath);
  organizeDSglobalPath.value =
    filtered.slice(0, filtered.length).join("/") + "/";

  var myPath = datasetStructureJSONObj;
  for (var item of filtered.slice(1, filtered.length)) {
    myPath = myPath["folders"][item];
  }
  // construct UI with files and folders
  var appendString = loadFileFolder(myPath);

  /// empty the div
  $("#items").empty();
  $("#items").html(appendString);

  // reconstruct div with new elements
  listItems(myPath, "#items");
  getInFolder(
    ".single-item",
    "#items",
    organizeDSglobalPath,
    datasetStructureJSONObj
  );
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

const renderSampleMetadataTables = () => {
  let subjectsToMap = guidedGetSubjects();
  let sampleMetadataTables = subjectsToMap.map((subject) => {
    let samples = guidedGetSubjectSamples(subject);
    let sampleMetadataRows;
    if (samples.length > 0) {
      sampleMetadataRows = guidedGetSubjectSamples(subject)
        .map((sample, index) => {
          let tableIndex = index + 1;
          return generateSampleMetadataRowElement(tableIndex, sample);
        })
        .join("\n");
    } else {
      const emptyRowWarning = generateAlertElement(
        "warning",
        `No samples were added to the subject ${subject}. If you would like to add samples to ${subject}, return to the samples table.`
      );
      sampleMetadataRows = `<tr><td colspan="3">${emptyRowWarning}</td></tr>`;
    }
    return `
      <table
        class="ui celled striped table"
        style="margin-bottom: 25px; min-width: 820px;"
      >
        <thead>
          <tr>
            <th
              colspan="3"
              class="text-center"
              style="
                z-index: 2;
                height: 50px;
                position: sticky !important;
                top: -10px !important;
              "
            >
              <span class="sample-subject-metadata-id">${subject}</span>'s sample metadata
            </th>
          </tr>
          <tr>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important;"
            >
              Index
            </th>
            <th
              style="z-index: 2; position: sticky !important; top: 40px !important;"
            >
              sample ID
            </th>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important;"
            >
              Modify metadata
            </th>
          </tr>
        </thead>
        <tbody>
          ${sampleMetadataRows}
        </tbody>
      </table>
    `;
  });
  let sampleMetadataTablesContainer = document.getElementById(
    "sample-metadata-tables-container"
  );
  //sampleMetadataTablesContainer.innerHTML = sampleMetadataTables.join("\n");
};

const removePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionNameToRemove = permissionElementToRemove
    .find(".permission-name-cell")
    .text();
  let permissionTypeToRemove = permissionElementToRemove
    .find(".permission-type-cell")
    .text();

  //remove the permission from the datasetStructureJSONObj
  //TODOASDF
  //Remove permission from the dom
  permissionElementToRemove.remove();
};

const createPermissionsTableRowElement = (name, permission) => {
  return `
    <tr>
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
  const owner = sodaJSONObj["digital-metadata"]["pi-owner"]["name"];
  const users = sodaJSONObj["digital-metadata"]["user-permissions"];
  const teams = sodaJSONObj["digital-metadata"]["team-permissions"];
  permissionsTableElements.push(
    createPermissionsTableRowElement(owner, "owner")
  );
  for (user of users) {
    permissionsTableElements.push(
      createPermissionsTableRowElement(user["userString"], user["permission"])
    );
  }
  for (team of teams) {
    permissionsTableElements.push(
      createPermissionsTableRowElement(team["teamString"], team["permission"])
    );
  }

  let permissionsTable = permissionsTableElements.join("\n");
  let permissionsTableBody = document.getElementById("permissions-table-body");
  permissionsTableBody.innerHTML = permissionsTable;
};

/*********** Source page functions ***********/
$("#guided-button-has-source-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["source"] == undefined)
    datasetStructureJSONObj["folders"]["source"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };

  updateFolderStructureUI(highLevelFolderPageData.source);
});

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

/*********** Code page functions ***********/

$("#guided-button-has-code-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["code"] == undefined)
    datasetStructureJSONObj["folders"]["code"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  updateFolderStructureUI(highLevelFolderPageData.code);
});
$("#guided-button-no-code-data").on("click", () => {
  //ask user to confirm they would like to delete code folder if it exists
  if (datasetStructureJSONObj["folders"]["code"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the code folder.",
      text: "Are you sure you would like to delete your code folder progress?",
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
        //User agrees to delete code folder
        delete datasetStructureJSONObj["folders"]["code"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no code files
        $("#guided-button-has-code-data").click();
      }
    });
  }
});

/*********** Docs page functions ***********/
$("#guided-button-has-docs-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["docs"] == undefined)
    datasetStructureJSONObj["folders"]["docs"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  updateFolderStructureUI(highLevelFolderPageData.docs);
});
$("#guided-button-no-docs-data").on("click", () => {
  //ask user to confirm they would like to delete docs folder if it exists
  if (datasetStructureJSONObj["folders"]["docs"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the docs folder.",
      text: "Are you sure you would like to delete your docs folder progress?",
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
        //User agrees to delete docs folder
        delete datasetStructureJSONObj["folders"]["docs"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no docs files
        $("#guided-button-has-docs-data").click();
      }
    });
  }
});

/*********** Protocol page functions ***********/
$("#guided-button-has-protocol-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["protocol"] == undefined)
    datasetStructureJSONObj["folders"]["protocol"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  console.log($("#guided-file-explorer-elements"));

  updateFolderStructureUI(highLevelFolderPageData.protocol);
});
$("#guided-button-no-protocol-data").on("click", () => {
  //ask user to confirm they would like to delete protocol folder if it exists
  if (datasetStructureJSONObj["folders"]["protocol"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the protocol folder.",
      text: "Are you sure you would like to delete your protocol folder progress?",
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
        //User agrees to delete protocol folder
        delete datasetStructureJSONObj["folders"]["protocol"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no protocol files
        $("#guided-button-has-protocol-data").click();
      }
    });
  }
});

const getTagsFromTagifyElement = (tagifyElement) => {
  return Array.from(tagifyElement.getTagElms()).map((tag) => {
    return tag.textContent;
  });
};

/////////////////////////////////////////////////////////
//////////       GUIDED OBJECT ACCESSORS       //////////
/////////////////////////////////////////////////////////
const setGuidedDatasetName = (datasetName) => {
  sodaJSONObj["digital-metadata"]["name"] = datasetName;
  $(".guidedDatasetName").text(datasetName);
};
const getGuidedDatasetName = () => {
  return sodaJSONObj["digital-metadata"]["name"];
};

const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitle;
  $(".guidedDatasetSubtitle").text(datasetSubtitle);
};
const getGuidedDatasetSubtitle = () => {
  return sodaJSONObj["digital-metadata"]["subtitle"];
};

const guidedShowBannerImagePreview = (imagePath) => {
  const bannerImagePreviewelement = document.getElementById(
    "guided-banner-image-preview"
  );
  guidedBannerImageElement = `
    <img
      src="${imagePath}"
      alt="Preview of banner image"
      style="max-height: 300px;"
    />
  `;
  bannerImagePreviewelement.innerHTML = guidedBannerImageElement;
  $("#guided-banner-image-preview-container").show();
};
const setGuidedBannerImage = (croppedImagePath) => {
  sodaJSONObj["digital-metadata"]["banner-image-path"] = croppedImagePath;
  guidedShowBannerImagePreview(croppedImagePath);
};

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  $(".guidedDatasetOwner").text(newPiOwnerObj.userString);
  sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] =
    newPiOwnerObj.userString;
  sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
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

  sodaJSONObj["digital-metadata"]["user-permissions"].push(
    newUserPermissionObj
  );
  renderPermissionsTable();
};
const guidedRemoveUserPermission = (userParentElement) => {};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
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

  sodaJSONObj["digital-metadata"]["team-permissions"].push(
    newTeamPermissionObj
  );
  renderPermissionsTable();
};
const guidedRemoveTeamPermission = (teamParentElement) => {};

const setGuidedLicense = (newLicense) => {
  $(".guidedBfLicense").text(newLicense);
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

  console.log(subjectsWithSamples);

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
      <div class="justify-center mt-md">
        <label class="guided--form-label centered">
          ${poolName}
        </label>
      </div>
        ${subjects
          .map((subject) => {
            return `
              <div class="w-100">
                <label class="guided--form-label text-left">
                  ${subject.subjectName}
                </label>
              </div>
                ${subject.samples
                  .map((sample) => {
                    return `
                    <a 
                      class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                      data-path-suffix="${subject.poolName}/${subject.subjectName}/${sample}"
                    >${sample}</a>
                  `;
                  })
                  .join("\n")}
            `;
          })
          .join("\n")}
    `;
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
      <div class="justify-center mt-md">
        <label class="guided--form-label centered">
          ${subject.subjectName}
        </label>
      </div>
        ${subject.samples
          .map((sample) => {
            return `  
              <a
                class="${highLevelFolderName}-selection-aside-item selection-aside-item"
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

const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(
    `guided-${highLevelFolderName}-subjects-aside`
  );
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically

  console.log(subjects);

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
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
      console.log(pathSuffix);

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

  console.log(subjects);

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a 
            class="subjects-metadata-aside-item selection-aside-item"
            data-pool-id="${subject.poolName ? subject.poolName : "N/A"}"
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

      previousSubject = document.getElementById(
        "guided-metadata-subject-id"
      ).innerHTML;
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
      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-subject-pool-id").value =
        e.target.getAttribute("data-pool-id");
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

  //Create the HTML for the samples
  const sampleItems = samples
    .map((sample) => {
      return `
        <a
          class="samples-metadata-aside-item selection-aside-item"
          data-samples-subject-name="${sample.subjectName}"
          data-samples-pool-id="${sample.poolName ? sample.poolName : "N/A"}"
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

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      const samplesSubject = e.target.getAttribute("data-samples-subject-name");
      const samplesPool = e.target.getAttribute("data-samples-pool-id");

      //Set the subject id field based of clicked elements data-subject-id attribute
      document.getElementById("guided-bootbox-wasDerivedFromSample").value =
        samplesSubject;

      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-sample-pool-id").value =
        samplesPool;

      previousSample = document.getElementById(
        "guided-metadata-sample-id"
      ).innerHTML;

      //check to see if previousSample is empty
      if (previousSample) {
        addSample("guided");
      }
      //clear all sample form fields
      clearAllSubjectFormFields(guidedSamplesFormDiv);

      //call openModifySampleMetadataPage function on clicked item
      openModifySampleMetadataPage(
        e.target.innerText,
        samplesSubject,
        samplesPool
      );
    });

    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

$(document).ready(() => {
  $("#guided-button-start-new-curate").on("click", () => {
    guidedTransitionFromHome();
    //temp bypass stuff
    /*$("#guided-dataset-name-input").val(makeid(10));
    $("#guided-dataset-subtitle-input").val(makeid(10));
    $("#guided-create-new-dataset").click();*/

    /*
    //show the next button after 5 seconds
    setTimeout(() => {
      $("#guided-next-button").show();
      traverseToTab("guided-create-subjects-metadata-tab");
    }, 5000);*/
  });
  $("#guided-button-cancel-create-new-dataset").on("click", () => {
    //remove text from dataset name and subtitle inputs
    document.getElementById("guided-dataset-name-input").value = "";
    document.getElementById("guided-dataset-subtitle-input").value = "";
    //show the home page
    document
      .getElementById("guided-name-subtitle-parent-tab")
      .classList.add("hidden");
    document.getElementById("guided-home").classList.remove("hidden");

    guidedPrepareHomeScreen();
  });
  $("#guided-create-new-dataset").on("click", async function () {
    let errorArray = [];
    try {
      $(this).addClass("loading");
      let datasetName = document
        .getElementById("guided-dataset-name-input")
        .value.trim();
      //temp bypass stuff
      datasetName = makeid("10");
      let datasetSubtitle = document
        .getElementById("guided-dataset-subtitle-input")
        .value.trim();
      //temp bypass stuff
      datasetSubtitle = makeid("10");
      if (datasetName != "" && datasetSubtitle != "") {
        //get names of existing progress saves
        const existingProgressNames = fs.readdirSync(guidedProgressFilePath);
        //Remove '.json' from each element in existingProgressNames
        existingProgressNames.forEach((element, index) => {
          existingProgressNames[index] = element.replace(".json", "");
        });
        //check if dataset name is already in use
        if (existingProgressNames.includes(datasetName)) {
          errorArray.push({
            type: "notyf",
            message:
              "An existing progress file already exists with that name. Please choose a different name.",
          });
          throw errorArray;
        }
        console.log(existingProgressNames);
        //If sodaJSONObj is empty, populate initial object properties
        guidedCreateSodaJSONObj();

        //Get the users information and set them as PI if a PI has not been designated yet
        if (sodaJSONObj["digital-metadata"]["pi-owner"] == undefined) {
          let user = await getUserInformation();
          const originalDatasetCreator = {
            userString: `${user["firstName"]} ${user["lastName"]} (${user["email"]})`,
            UUID: user["id"],
            name: `${user["firstName"]} ${user["lastName"]}`,
          };
          setGuidedDatasetPiOwner(originalDatasetCreator);
          generateAlertMessage($("#guided-designated-PI-info"));
        }
        setGuidedDatasetName(datasetName);
        setGuidedDatasetSubtitle(datasetSubtitle);
        saveGuidedProgress(sodaJSONObj["digital-metadata"]["name"]);

        guidedTransitionFromDatasetNameSubtitlePage();

        /*$("#guided-button-guided-dataset-structuring").click();
        $("#guided-next-button").click();
        sodaJSONObj.addSubject("sub-1");
        sodaJSONObj.addSubject("sub-2");
        sodaJSONObj.addSubject("sub-3");
        sodaJSONObj.addSubject("sub-4");
        sodaJSONObj.addSubject("sub-5");
        sodaJSONObj.addSubject("sub-6");
        sodaJSONObj.addSubject("sub-7");
        sodaJSONObj.addSubject("sub-8");
        sodaJSONObj.addSubject("sub-9");
        sodaJSONObj.addSubject("sub-10");
        sodaJSONObj.addSubject("sub-11");
        sodaJSONObj.addSubject("sub-12");
        sodaJSONObj.addSubject("sub-13");
        sodaJSONObj.addSubject("sub-14");
        sodaJSONObj.addSubject("sub-15");
        sodaJSONObj.addSubject("sub-16");
        sodaJSONObj.addSubject("sub-17");
        sodaJSONObj.addSubject("sub-18");
        sodaJSONObj.addSubject("sub-19");
        sodaJSONObj.addSubject("sub-20");
        sodaJSONObj.addSubject("sub-21");
        sodaJSONObj.addSubject("sub-22");
        sodaJSONObj.addSubject("sub-23");
        sodaJSONObj.addSubject("sub-24");
        sodaJSONObj.addSubject("sub-25");
        sodaJSONObj.addSubject("sub-26");
        sodaJSONObj.addSubject("sub-27");
        sodaJSONObj.addSubject("sub-28");
        sodaJSONObj.addSubject("sub-29");
        sodaJSONObj.addSubject("sub-30");

        sodaJSONObj.addPool("pool-1");
        sodaJSONObj.addPool("pool-2");
        sodaJSONObj.addPool("pool-3");
        sodaJSONObj.addPool("pool-4");
        sodaJSONObj.addPool("pool-5");
        sodaJSONObj.addPool("pool-6");
        sodaJSONObj.addPool("pool-7");
        sodaJSONObj.addPool("pool-8");
        sodaJSONObj.addPool("pool-9");
        sodaJSONObj.addPool("pool-10");
        function sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }
        await sleep(200);
        sodaJSONObj.moveSubjectIntoPool("sub-1", "pool-1");
        sodaJSONObj.moveSubjectIntoPool("sub-2", "pool-1");
        sodaJSONObj.moveSubjectIntoPool("sub-3", "pool-1");
        sodaJSONObj.moveSubjectIntoPool("sub-4", "pool-1");
        sodaJSONObj.moveSubjectIntoPool("sub-5", "pool-1");
        sodaJSONObj.moveSubjectIntoPool("sub-6", "pool-2");
        sodaJSONObj.moveSubjectIntoPool("sub-7", "pool-2");
        sodaJSONObj.moveSubjectIntoPool("sub-8", "pool-2");
        sodaJSONObj.moveSubjectIntoPool("sub-9", "pool-2");
        sodaJSONObj.moveSubjectIntoPool("sub-10", "pool-2");
        await sleep(200);
        sodaJSONObj.addSampleToSubject("sam-1", "pool-1", "sub-1");
        sodaJSONObj.addSampleToSubject("sam-2", "pool-1", "sub-1");
        sodaJSONObj.addSampleToSubject("sam-3", "pool-1", "sub-1");
        sodaJSONObj.addSampleToSubject("sam-4", "pool-1", "sub-1");
        sodaJSONObj.addSampleToSubject("sam-5", "pool-1", "sub-1");
        //(sampleName, subjectPoolName, subjectName)
        sodaJSONObj.addSampleToSubject("sam-1", "pool-1", "sub-2");
        sodaJSONObj.addSampleToSubject("sam-2", "pool-1", "sub-2");
        sodaJSONObj.addSampleToSubject("sam-3", "pool-1", "sub-2");

        sodaJSONObj.addSampleToSubject("sam-1", "pool-2", "sub-10");
        sodaJSONObj.addSampleToSubject("sam-2", "pool-2", "sub-10");
        sodaJSONObj.addSampleToSubject("sam-3", "pool-2", "sub-10");
        sodaJSONObj.addSampleToSubject("sam-4", "pool-2", "sub-10");
        sodaJSONObj.addSampleToSubject("sam-5", "pool-2", "sub-10");

        sodaJSONObj.addSampleToSubject("sam-sub111", "", "sub-11");
        sodaJSONObj.addSampleToSubject("sam-sub112", "", "sub-11");
        sodaJSONObj.addSampleToSubject("sam-sub113", "", "sub-11");

        sodaJSONObj.addSampleToSubject("sam-sub121", "", "sub-12");
        sodaJSONObj.addSampleToSubject("sam-sub122", "", "sub-12");
        sodaJSONObj.addSampleToSubject("sam-sub123", "", "sub-12");*/
      } else {
        if (datasetName == "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset name",
          });
        }
        if (datasetSubtitle == "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset subtitle",
          });
        }
        $(this).removeClass("loading");
        throw errorArray;
      }
      $(this).removeClass("loading");
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
      $(this).removeClass("loading");
    }
  });
  $("#guided-modify-dataset-name-subtitle").on("click", async () => {
    let errorArray = [];
    try {
      const datasetName = getGuidedDatasetName();
      const datasetSubtitle = getGuidedDatasetSubtitle();
      const datasetNameInputValue = document.getElementById(
        "guided-dataset-name-input"
      ).value;
      const datasetSubtitleInputValue = document.getElementById(
        "guided-dataset-subtitle-input"
      ).value;

      console.log(datasetName);

      if (datasetNameInputValue != "" && datasetSubtitleInputValue != "") {
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
              setGuidedDatasetName(datasetNameInputValue);
              setGuidedDatasetSubtitle(datasetSubtitleInputValue);
              saveGuidedProgress(datasetNameInputValue);
              //delete the old progress file
              const progressFilePathToDelete = path.join(
                guidedProgressFilePath,
                datasetName + ".json"
              );
              //delete the progress file
              fs.unlinkSync(progressFilePathToDelete, (err) => {
                console.log(err);
              });
            }
          } else {
            setGuidedDatasetName(datasetNameInputValue);
            setGuidedDatasetSubtitle(datasetSubtitleInputValue);
            saveGuidedProgress(datasetNameInputValue);
            //delete the old progress file
            const progressFilePathToDelete = path.join(
              guidedProgressFilePath,
              datasetName + ".json"
            );
            //delete the progress file
            fs.unlinkSync(progressFilePathToDelete, (err) => {
              console.log(err);
            });
          }
        }
        //transition out of dataset name/subtitle page
        guidedTransitionFromDatasetNameSubtitlePage();
      } else {
        if (datasetNameInputValue == "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset name",
          });
        }
        if (datasetSubtitleInputValue == "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset subtitle",
          });
        }
        throw errorArray;
      }
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
      console.log($(this));
      $(this)[0].scrollIntoView({
        behavior: "smooth",
      });
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
    selectedButton.removeClass("not-selected basic");
    selectedButton.addClass("selected");

    //Display and scroll to selected element container if data-next-element exists
    if (selectedButton.data("next-element")) {
      nextQuestionID = selectedButton.data("next-element");
      console.log(nextQuestionID);
      nextQuestionElement = $(`#${nextQuestionID}`);
      nextQuestionElement.removeClass("hidden");
      //slow scroll to the next question
      //temp fix to prevent scrolling error
      const elementsToNotScrollTo = [
        "guided-add-samples-table",
        "guided-add-pools-table",
        "guided-div-add-subjects-table",
      ];
      if (!elementsToNotScrollTo.includes(nextQuestionID)) {
        nextQuestionElement[0].scrollIntoView({
          behavior: "smooth",
        });
      }
    }
    //Hide all child containers of non-selected buttons
    notSelectedButton.each(function () {
      console.log($(this));
      if ($(this).data("next-element")) {
        nextQuestionID = $(this).data("next-element");
        $(`#${nextQuestionID}`).addClass("hidden");
      }
    });
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

  // function for importing a banner image if one already exists
  $("#guided-button-add-banner-image").click(async () => {
    $("#guided-banner-image-modal").modal("show");
  });

  // Action when user click on "Import image" button for banner image
  $("#guided-button-import-banner-image").click(() => {
    $("#guided-para-dataset-banner-image-status").html("");
    ipcRenderer.send("guided-open-file-dialog-import-banner-image");
  });
  /////////////////////////////////////////////////////////
  //////////    GUIDED IPC RENDERER LISTENERS    //////////
  /////////////////////////////////////////////////////////

  ipcRenderer.on("guided-selected-banner-image", async (event, path) => {
    console.log(path);
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
            console.log("starting tiff conversion");
            if (!fs.existsSync(destination_image_path)) {
              fs.mkdirSync(destination_image_path);
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
                  console.log("File size too large. Resizing image");

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
                      console.log("File size is too big", fileSizeInMegabytes);
                      conversion_success = false;
                      // SHOW ERROR
                    }
                  }
                }
                console.log("file conversion complete");
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
    } else {
      if ($("#para-current-banner-img").text() === "None") {
        $("#save-banner-image").css("visibility", "hidden");
      } else {
        $("#save-banner-image").css("visibility", "visible");
      }
    }
  });

  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
  });

  $("#pennsieve-account-confirm-button").on("click", () => {
    sodaJSONObj["generate-dataset"]["starting-point"] = "bf";
    sodaJSONObj["bf-account-selected"] = {};
    sodaJSONObj["bf-account-selected"]["account-name"] =
      $("#guided-bf-account").text();
    enableProgressButton();
    $("#guided-next-button").click();
  });

  $("#guided-dataset-name-confirm-button").on("click", () => {
    sodaJSONObj["bf-dataset-selected"] = {};
    sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $(
      "#guided-confirm-dataset-name"
    )
      .text()
      .trim();
    enableProgressButton();
    $("#guided-next-button").click();
  });

  //FETCH FUNCTIONS//
  //fetch
  const guidedUpdateUploadStatus = (uploadContainerElement, status) => {
    i;
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
  const create_dataset = async (
    dataset_name,
    dataset_subtitle,
    dataset_tags,
    dataset_license
  ) => {
    // get the access token so the user can access the Pennsieve api
    let jwt = await get_access_token();

    const options = {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        name: dataset_name,
        description: dataset_subtitle,
        tags: dataset_tags,
        license: dataset_license,
      }),
    };

    const response = await fetch("https://api.pennsieve.io/datasets/", options);

    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      Swal.fire({
        icon: "error",
        text: `An error has occured: ${response.status}`,
        confirmButtonText: "OK",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      guidedUploadStatusIcon("guided-dataset-name-upload-status", "error");
      guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "error");
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "error");
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "error");
      throw new Error(message);
    } else {
      guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
      guidedUploadStatusIcon(
        "guided-dataset-subtitle-upload-status",
        "success"
      );
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
    }
    const createDatasetResponseJson = response.json();
    return createDatasetResponseJson;
  };

  const addPennsieveMetadata = async (
    bfAccount,
    datasetName,
    pathToCroppedBannerImage,
    userPermissions,
    teamPermissions
  ) => {
    const promises = [
      guided_add_user_permissions(bfAccount, datasetName, userPermissions),
      guided_add_team_permissions(bfAccount, datasetName, teamPermissions),
      guided_add_banner_image(bfAccount, datasetName, pathToCroppedBannerImage),
    ];
    const result = await Promise.allSettled(promises);
    return result;
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
      console.log(event);
      console.log(data);
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

  const guided_create_dataset = (bfAccount, datasetName) => {
    console.log(bfAccount);
    console.log(datasetName);
    return new Promise((resolve, reject) => {
      log.info(`Creating a new dataset with the name: ${datasetName}`);
      client.invoke(
        "api_bf_new_dataset_folder",
        datasetName,
        bfAccount,
        (error, res) => {
          if (error) {
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to create new datsaet",
            });
            log.error(error);
            let emessage = userError(error);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Create Empty Dataset",
              datasetName
            );
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: `Dataset ${datasetName} was created successfully`,
            });
            log.info(`Created dataset successfully`);
            guidedIncreaseCurateProgressBar(5);
            console.log("added dataset + " + res);
            resolve(res);
          }
        }
      );
    });
  };

  const guided_add_subtitle = (bfAccount, datasetName, datasetSubtitle) => {
    return new Promise((resolve, reject) => {
      console.log("adding subtitle");
      log.info("Adding subtitle to dataset");
      log.info(datasetSubtitle);
      client.invoke(
        "api_bf_add_subtitle",
        bfAccount,
        datasetName,
        datasetSubtitle,
        (error, res) => {
          if (error) {
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add subtitle",
            });
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Add/Edit Subtitle",
              defaultBfDataset
            );
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: "Added subtitle to dataset",
            });
            log.info("Added subtitle to dataset");
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Add/Edit Subtitle",
              defaultBfDataset
            );
            guidedIncreaseCurateProgressBar(5);
            console.log("added subtitle + " + res);

            resolve(`Subtitle added to ${datasetName}`);
          }
        }
      );
    });
  };

  const guided_add_PI_owner = async (bfAccount, bfDataset, datasetPiOwner) => {
    return new Promise((resolve) => {
      log.info("Changing PI Owner of datset");
      client.invoke(
        "api_bf_add_permission",
        bfAccount,
        bfDataset,
        datasetPiOwner,
        "owner",
        (error, res) => {
          if (error) {
            ipcRenderer.send(
              "track-evefnt",
              "Error",
              "Manage Dataset - Change PI Owner",
              bfDataset
            );
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            log.info("Changed PI Owner of datset");
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Change PI Owner",
              bfDataset
            );
            notyf.open({
              duration: "5000",
              type: "success",
              message: "Changed PI Owner",
            });
            resolve(res);
          }
        }
      );
    });
  };

  const guided_add_banner_image = (
    bfAccount,
    datasetName,
    pathToCroppedImage
  ) => {
    return new Promise((resolve, reject) => {
      client.invoke(
        "api_bf_add_banner_image",
        bfAccount,
        datasetName,
        pathToCroppedImage,
        (error, res) => {
          if (error) {
            guidedUploadStatusIcon(
              "guided-dataset-banner-image-upload-status",
              "error"
            );
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            guidedUploadStatusIcon(
              "guided-dataset-banner-image-upload-status",
              "success"
            );
            console.log("Banner image added + " + res);
            resolve(`Banner image added` + res);
          }
        }
      );
    });
  };

  const guided_add_user = (bfAccount, datasetName, userUUID, selectedRole) => {
    return new Promise((resolve, reject) => {
      log.info("Adding a permission for a user on a dataset");
      client.invoke(
        "api_bf_add_permission",
        bfAccount,
        datasetName,
        userUUID,
        selectedRole,
        (error, res) => {
          if (error) {
            guidedUploadStatusIcon(
              "guided-dataset-user-permissions-upload-status",
              "error"
            );
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            guidedUploadStatusIcon(
              "guided-dataset-user-permissions-upload-status",
              "success"
            );
            log.info("Dataset permission added");
            console.log("permission added + " + res);

            resolve(
              `${userUUID} added as ${selectedRole} to ${datasetName} dataset`
            );
          }
        }
      );
    });
  };

  const guided_add_team = (
    bfAccount,
    datasetName,
    teamString,
    selectedRole
  ) => {
    return new Promise((resolve, reject) => {
      log.info("Adding a permission for a team on a dataset");
      client.invoke(
        "api_bf_add_permission_team",
        bfAccount,
        datasetName,
        teamString,
        selectedRole,
        (error, res) => {
          if (error) {
            guidedUploadStatusIcon(
              "guided-dataset-user-permissions-upload-status",
              "error"
            );
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            guidedUploadStatusIcon(
              "guided-dataset-user-permissions-upload-status",
              "success"
            );
            log.info("Dataset permission added");
            console.log("permission added + " + res);
            resolve(
              `${teamString} added as ${selectedRole} to ${datasetName} dataset`
            );
          }
        }
      );
    });
  };

  const guided_add_user_permissions = async (
    bfAccount,
    datasetName,
    userPermissionsArray
  ) => {
    const promises = userPermissionsArray.map((userPermission) => {
      return guided_add_user(
        bfAccount,
        datasetName,
        userPermission.UUID,
        userPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
    console.log(result.map((promise) => promise.status));
  };

  const guided_add_team_permissions = async (
    bfAccount,
    datasetName,
    teamPermissionsArray
  ) => {
    console.log(teamPermissionsArray);
    const promises = teamPermissionsArray.map((teamPermission) => {
      return guided_add_team(
        bfAccount,
        datasetName,
        teamPermission.teamString,
        teamPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
    console.log(result);
    console.log(result.map((promise) => promise.status));
  };

  const buildReadMeString = (
    studyPurpose,
    dataCollection,
    primaryConclusion
  ) => {
    let requiredFields = [];
    requiredFields.push("**Study Purpose:** " + studyPurpose + "\n\n");
    requiredFields.push("**Data Collection:** " + dataCollection + "\n\n");
    requiredFields.push(
      "**Primary Conclusion:** " + primaryConclusion + "\n\n"
    );
    requiredFields = requiredFields.join("");
    return requiredFields;
  };

  const guided_add_description = async (bfAccount, bfDataset, readMe) => {
    return new Promise((resolve, reject) => {
      client.invoke(
        "api_bf_add_description",
        bfAccount,
        bfDataset,
        readMe,
        (error, res) => {
          if (error) {
            guidedUploadStatusIcon(
              "guided-dataset-description-upload-status",
              "error"
            );
            log.error(error);
            console.error(error);
            reject(error);
          } else {
            console.log(res);
            guidedUploadStatusIcon(
              "guided-dataset-description-upload-status",
              "success"
            );
            console.log("added descr + " + res);
            resolve(`Description added to ${bfDataset}`);
          }
        }
      );
    });
  };

  const guided_add_metadata = async (bfAccount, bfDataset) => {
    return new Promise((resolve, reject) => {
      client.invoke(
        "api_bf_add_description",
        bfAccount,
        bfDataset,
        readMe,
        (error, res) => {
          if (error) {
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add description",
            });
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            console.log(res);
            notyf.open({
              duration: "5000",
              type: "success",
              message: "Added description to dataset",
            });
            guidedIncreaseCurateProgressBar(5);
            console.log("added descr + " + res);
            resolve(`Description added to ${bfDataset}`);
          }
        }
      );
    });
  };

  const guided_add_tags = async (bfDataset, tagsArray) => {
    // Add tags to dataset
    try {
      await update_dataset_tags(bfDataset, tagsArray);
      console.log("added tags");
    } catch (e) {
      // log the error
      log.error(e);
      console.error(e);
      // alert the user of the error
      Swal.fire({
        title: "Failed to edit your dataset tags!",
        icon: "error",
        text: e.message,
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      // halt execution
      return;
    }
  };

  const guided_add_license = async (bfAccount, bfDataset, license) => {
    return new Promise((resolve, reject) => {
      client.invoke(
        "api_bf_add_license",
        bfAccount,
        bfDataset,
        license,
        (error, res) => {
          if (error) {
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add license",
            });
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: "License successfully added to dataset",
            });
            console.log("added license + " + res);
            resolve(`Added ${license} to ${datasetName}`);
          }
        }
      );
    });
  };

  const guidedPennsieveDatasetUpload = async () => {
    let guidedBfAccount = defaultBfAccount;
    let guidedDatasetName = sodaJSONObj["digital-metadata"]["name"];
    let guidedDatasetSubtitle = sodaJSONObj["digital-metadata"]["subtitle"];
    let guidedUsers = sodaJSONObj["digital-metadata"]["user-permissions"];
    let guidedPIOwner = sodaJSONObj["digital-metadata"]["pi-owner"];
    let guidedTeams = sodaJSONObj["digital-metadata"]["team-permissions"];
    let guidedStudyPurpose = sodaJSONObj["digital-metadata"]["study-purpose"];
    let guidedDataCollection =
      sodaJSONObj["digital-metadata"]["data-collection"];
    let guidedPrimaryConclusion =
      sodaJSONObj["digital-metadata"]["primary-conclusion"];
    let guidedReadMe = buildReadMeString(
      guidedStudyPurpose,
      guidedDataCollection,
      guidedPrimaryConclusion
    );
    let guidedTags = sodaJSONObj["digital-metadata"]["dataset-tags"];
    let guidedLicense = sodaJSONObj["digital-metadata"]["license"];
    let guidedBannerImagePath =
      sodaJSONObj["digital-metadata"]["banner-image-path"];

    guidedUpdateJSONStructureGenerate();

    create_dataset(
      guidedDatasetName,
      guidedDatasetSubtitle,
      guidedTags,
      guidedLicense
    )
      .then((res) => {
        addPennsieveMetadata(
          guidedBfAccount,
          guidedDatasetName,
          guidedBannerImagePath,
          guidedUsers,
          guidedTeams
        );
      })
      .then(
        guided_add_description(guidedBfAccount, guidedDatasetName, guidedReadMe)
      )
      .then(guided_main_curate())
      /*.then(guided_add_metadata(guidedBfAccount, guidedDatasetName))*/
      /*
      .then((res) => {
        guided_add_PI_owner(guidedBfAccount, guidedDatasetName, guidedPIOwner);//this will need to change as PI owner obj changed
      })*/
      .catch((error) => {
        console.log(error);
        Swal.fire({
          icon: "error",
          text: error,
          confirmButtonText: "OK",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      });
  };

  const guidedUpdateJSONStructureGenerate = () => {
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing-bf",
    };
  };

  function guided_initiate_generate() {
    // Initiate curation by calling Python function
    let manifest_files_requested = false;
    var main_curate_status = "Solving";
    var main_total_generate_dataset_size;

    if ("manifest-files" in sodaJSONObj) {
      if ("destination" in sodaJSONObj["manifest-files"]) {
        if (
          sodaJSONObj["manifest-files"]["destination"] === "generate-dataset"
        ) {
          manifest_files_requested = true;
          delete_imported_manifest();
        }
      }
    }

    let dataset_name = "";
    let dataset_destination = "";

    if ("bf-dataset-selected" in sodaJSONObj) {
      dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      dataset_destination = "Pennsieve";
    } else if ("generate-dataset" in sodaJSONObj) {
      if ("destination" in sodaJSONObj["generate-dataset"]) {
        let destination = sodaJSONObj["generate-dataset"]["destination"];
        if (destination == "local") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Local";
        }
        if (destination == "bf") {
          dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
          dataset_destination = "Pennsieve";
        }
      }
    }

    client.invoke("api_main_curate_function", sodaJSONObj, (error, res) => {
      if (error) {
        $("#sidebarCollapse").prop("disabled", false);
        var emessage = userError(error);
        $("#guided-progress-bar-new-curate").attr("value", 0);
        log.error(error);
        console.error(error);
        logCurationForAnalytics(
          "Error",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.PREFIX,
          [],
          determineDatasetLocation()
        );
        logCurationForAnalytics(
          "Error",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Step 7", "Generate", "dataset", `${dataset_destination}`],
          determineDatasetLocation()
        );

        file_counter = 0;
        folder_counter = 0;
        get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

        ipcRenderer.send(
          "track-event",
          "Error",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
          "Size",
          main_total_generate_dataset_size
        );

        ipcRenderer.send(
          "track-event",
          "Error",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
          main_total_generate_dataset_size
        );

        // get dataset id if available
        let datasetLocation = determineDatasetLocation();
        ipcRenderer.send(
          "track-event",
          "Error",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          main_total_generate_dataset_size
        );

        ipcRenderer.send(
          "track-event",
          "Error",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
          "Number of Files",
          file_counter
        );

        ipcRenderer.send(
          "track-event",
          "Error",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          file_counter
        );

        ipcRenderer.send(
          "track-event",
          "Error",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          file_counter
        );
        //refresh dropdowns user has access too
        client.invoke(
          "api_bf_dataset_account",
          defaultBfAccount,
          (error, result) => {
            if (error) {
              log.error(error);
              console.log(error);
              var emessage = error;
            } else {
              datasetList = [];
              datasetList = result;
            }
          }
        );
      } else {
        main_total_generate_dataset_size = res[1];
        $("#sidebarCollapse").prop("disabled", false);
        log.info("Completed curate function");
        if (manifest_files_requested) {
          let high_level_folder_num = 0;
          if ("dataset-structure" in sodaJSONObj) {
            if ("folders" in sodaJSONObj["dataset-structure"]) {
              for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
                high_level_folder_num += 1;
              }
            }
          }

          // get dataset id if available
          let datasetLocation = determineDatasetLocation();
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest",
            datasetLocation === "Pennsieve"
              ? defaultBfDatasetId
              : datasetLocation,
            high_level_folder_num
          );

          ipcRenderer.send(
            "track-event",
            "Success",
            `Prepare Datasets - Organize dataset - Step 7 - Generate - Manifest - ${dataset_destination}`,
            datasetLocation === "Pennsieve"
              ? defaultBfDatasetId
              : datasetLocation,
            high_level_folder_num
          );
        }

        file_counter = 0;
        folder_counter = 0;
        get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.PREFIX,
          [],
          determineDatasetLocation()
        );

        // for tracking the total size of all datasets ever created on SODA
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
          "Size",
          main_total_generate_dataset_size
        );

        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Step 7", "Generate", "Dataset", `${dataset_destination}`],
          determineDatasetLocation()
        );

        let datasetLocation = determineDatasetLocation();
        // for tracking the total size of all the "saved", "new", "Pennsieve", "local" datasets by category
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Size",
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          main_total_generate_dataset_size
        );

        // tracks the total size of datasets that have been generated to Pennsieve and on the user machine
        ipcRenderer.send(
          "track-event",
          "Success",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Size`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          main_total_generate_dataset_size
        );

        // track amount of files for all datasets
        ipcRenderer.send(
          "track-event",
          "Success",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
          "Number of Files",
          file_counter
        );

        // track amount of files for datasets by ID or Local
        ipcRenderer.send(
          "track-event",
          "Success",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - Number of Files`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          file_counter
        );

        ipcRenderer.send(
          "track-event",
          "Success",
          `Prepare Datasets - Organize dataset - Step 7 - Generate - Dataset - ${dataset_destination} - Number of Files`,
          datasetLocation === "Pennsieve"
            ? defaultBfDatasetId
            : datasetLocation,
          file_counter
        );

        client.invoke(
          "api_bf_dataset_account",
          defaultBfAccount,
          (error, result) => {
            if (error) {
              log.error(error);
              console.log(error);
              var emessage = error;
            } else {
              datasetList = [];
              datasetList = result;
            }
          }
        );
      }
    });

    // Progress tracking function for main curate
    var countDone = 0;
    var timerProgress = setInterval(main_progressfunction, 1000);
    function main_progressfunction() {
      client.invoke("api_main_curate_function_progress", (error, res) => {
        if (error) {
          var emessage = userError(error);
          log.error(error);
          console.error(error);
        } else {
          main_curate_status = res[0];
          var start_generate = res[1];
          var main_curate_progress_message = res[2];
          main_total_generate_dataset_size = res[3];
          var main_generated_dataset_size = res[4];
          var elapsed_time_formatted = res[5];

          if (start_generate === 1) {
            $("#guided-progress-bar-new-curate").css("display", "block");
            if (main_curate_progress_message.includes("Success: COMPLETED!")) {
              setGuidedProgressBarValue(100);
            } else {
              var value =
                (main_generated_dataset_size /
                  main_total_generate_dataset_size) *
                100;
              setGuidedProgressBarValue(value);
              if (main_total_generate_dataset_size < displaySize) {
                var totalSizePrint =
                  main_total_generate_dataset_size.toFixed(2) + " B";
              } else if (
                main_total_generate_dataset_size <
                displaySize * displaySize
              ) {
                var totalSizePrint =
                  (main_total_generate_dataset_size / displaySize).toFixed(2) +
                  " KB";
              } else if (
                main_total_generate_dataset_size <
                displaySize * displaySize * displaySize
              ) {
                var totalSizePrint =
                  (
                    main_total_generate_dataset_size /
                    displaySize /
                    displaySize
                  ).toFixed(2) + " MB";
              } else {
                var totalSizePrint =
                  (
                    main_total_generate_dataset_size /
                    displaySize /
                    displaySize /
                    displaySize
                  ).toFixed(2) + " GB";
              }
              var progressMessage = "";
              progressMessage += main_curate_progress_message + "<br>";
              progressMessage +=
                "Progress: " +
                value.toFixed(2) +
                "%" +
                " (total size: " +
                totalSizePrint +
                ") " +
                "<br>";
              progressMessage +=
                "Elaspsed time: " + elapsed_time_formatted + "<br>";
              document.getElementById(
                "para-new-curate-progress-bar-status"
              ).innerHTML = progressMessage;
            }
          } else {
            document.getElementById(
              "para-new-curate-progress-bar-status"
            ).innerHTML =
              main_curate_progress_message +
              "<br>" +
              "Elapsed time: " +
              elapsed_time_formatted +
              "<br>";
          }
        }
      });

      if (main_curate_status === "Done") {
        $("#sidebarCollapse").prop("disabled", false);
        countDone++;
        if (countDone > 1) {
          log.info("Done curate track");
          // then show the sidebar again
          // forceActionSidebar("show");
          clearInterval(timerProgress);
          // electron.powerSaveBlocker.stop(prevent_sleep_id)
        }
      }
    }
  }

  const guided_main_curate = async () => {
    console.log(sodaJSONObj);
    sodaJSONObj["starting-point"]["type"] = "bf";
    let dataset_name = "";
    let dataset_destination = "";
    if ("bf-dataset-selected" in sodaJSONObj) {
      dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
      dataset_destination = "Pennsieve";
    }
    if (dataset_destination == "Pennsieve") {
      let supplementary_checks = await run_pre_flight_checks(false);
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }
    }
    updateJSONStructureDSstructure();

    // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
    if ("files" in sodaJSONObj["dataset-structure"]) {
      sodaJSONObj["dataset-structure"]["files"] = {};
    }

    // delete manifest files added for treeview
    for (var highLevelFol in sodaJSONObj["dataset-structure"]["folders"]) {
      if (
        "manifest.xlsx" in
          sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
        sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"][
          "manifest.xlsx"
        ]["forTreeview"]
      ) {
        delete sodaJSONObj["dataset-structure"]["folders"][highLevelFol][
          "files"
        ]["manifest.xlsx"];
      }
    }
    client.invoke(
      "api_check_empty_files_folders",
      sodaJSONObj,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          console.error(error);
          $("#sidebarCollapse").prop("disabled", false);
          reject(error);
        } else {
          log.info("Continue with curate");
          var message = "";
          error_files = res[0];
          error_folders = res[1];
          if (error_files.length > 0) {
            var error_message_files =
              backend_to_frontend_warning_message(error_files);
            message += error_message_files;
          }
          if (error_folders.length > 0) {
            var error_message_folders =
              backend_to_frontend_warning_message(error_folders);
            message += error_message_folders;
          }
          if (message) {
            message += "Would you like to continue?";
            message = "<div style='text-align: left'>" + message + "</div>";
            Swal.fire({
              icon: "warning",
              html: message,
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
            }).then((result) => {
              if (result.isConfirmed) {
                guided_initiate_generate();
              } else {
                $("#sidebarCollapse").prop("disabled", false);
              }
            });
          } else {
            guided_initiate_generate();
          }
        }
      }
    );
  };
  $("#guided-add-subject-button").on("click", () => {
    $("#guided-subjects-intro").hide();
    $("#guided-add-subject-div").show();
  });

  /*$("#guided-button-add-subjects-table").on("click", () => {
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
  });*/

  /*$("#guided-button-organize-subjects-into-pools").on("click", () => {
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
  });*/

  /*$("#guided-button-add-samples-tables").on("click", () => {
    const [subjectsInPools, subjectsOutsidePools] =
      sodaJSONObj.getAllSubjects();
    //Combine sample data from subjects in and out of pools
    let subjects = [...subjectsInPools, ...subjectsOutsidePools];

    //sort subjects object by subjectName property alphabetically
    subjects = subjects.sort((a, b) => {
      const subjectNameA = a.subjectName.toLowerCase();
      const subjectNameB = b.subjectName.toLowerCase();
      if (subjectNameA < subjectNameB) return -1;
      if (subjectNameA > subjectNameB) return 1;
      return 0;
    });

    console.log(subjects);

    //Create the HTML for the subjects
    const subjectSampleAdditionTables = subjects
      .map((subject) => {
        return renderSubjectSampleAdditionTable(subject);
      })
      .join("\n");
    console.log(subjectSampleAdditionTables);

    //Add the subject sample addition elements to the DOM
    const subjectSampleAdditionTableContainer = document.getElementById(
      "guided-div-add-samples-tables"
    );

    subjectSampleAdditionTableContainer.innerHTML = subjectSampleAdditionTables;
  });*/

  //submission
  $("#guided-button-save-checked-milestones").on("click", () => {
    const checkedMilestoneData = getCheckedMilestones();
    //if checkedMilestoneData is empty, create notyf
    if (checkedMilestoneData.length === 0) {
      notyf.error("Please select at least one milestone");
      return;
    }

    // get a unique set of completionDates from checkedMilestoneData
    const uniqueCompletionDates = Array.from(
      new Set(checkedMilestoneData.map((milestone) => milestone.completionDate))
    );

    //reset accordion to default

    const submissionAccordion = document.getElementById(
      "guided-div-submission-accordion"
    );
    const guidedCompletionDateInput = document.getElementById(
      "guided-submission-completion-date"
    );
    const guidedCompletionDateInstructionalText = document.getElementById(
      "guided-completion-date-instructional-text"
    );
    const guidedCompletionDateContainer = document.getElementById(
      "guided-div-completion-date-selection"
    );
    submissionAccordion.classList.add("hidden");
    guidedCompletionDateContainer.classList.add("hidden");
    guidedCompletionDateInput.disabled = false;
    guidedCompletionDateInput.value = "";
    guidedSubmissionTagsTagify.removeAllTags();

    if (checkedMilestoneData.length === 1) {
      const uniqueCompletionDate = uniqueCompletionDates[0];

      guidedSubmissionTagsTagify.addTags([
        { value: checkedMilestoneData[0]["milestone"], readonly: true },
      ]);

      document
        .getElementById("guided-div-completion-date-selection")
        .classList.add("hidden");
      guidedCompletionDateInput.value = uniqueCompletionDate;
      guidedCompletionDateInput.disabled = true;
      unHideAndSmoothScrollToElement("guided-div-submission-accordion");
    }

    if (checkedMilestoneData.length > 1) {
      for (milestone of checkedMilestoneData) {
        guidedSubmissionTagsTagify.addTags([
          { value: milestone["milestone"], readonly: true },
        ]);
      }
      //filter value 'NA' from uniqueCompletionDates
      const filteredUniqueCompletionDates = uniqueCompletionDates.filter(
        (date) => date !== "NA"
      );
      if (filteredUniqueCompletionDates.length === 1) {
        guidedCompletionDateInput.value = filteredUniqueCompletionDates[0];
        guidedCompletionDateInput.disabled = true;
        unHideAndSmoothScrollToElement("guided-div-submission-accordion");
        return;
      } else {
        //set the text of guided-completion-date-instructional-text
        guidedCompletionDateInstructionalText.innerHTML =
          "Select the completion date for your submission";
        const completionDates = [];
        for (date of filteredUniqueCompletionDates) {
          completionDates.push(date);
        }

        //create a radio button for each unique date
        const completionDateCheckMarks = completionDates
          .map((completionDate) => {
            return createCompletionDateRadioElement(
              "completion-date",
              completionDate
            );
          })
          .join("\n");
        document.getElementById("guided-completion-date-container").innerHTML =
          completionDateCheckMarks;
        unHideAndSmoothScrollToElement("guided-div-completion-date-selection");
      }
    }
    //set opacity and remove pointer events for table and show edit button
    disableElementById("milestones-table");

    //switch button from save to edit
    document.getElementById(
      "guided-button-save-checked-milestones"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-checked-milestones"
    ).style.display = "flex";
  });
  $("#guided-button-edit-checked-milestones").on("click", () => {
    //re-enable disabled elements and hide completion date selection div
    enableElementById("milestones-table");
    enableElementById("guided-completion-date-container");
    document
      .getElementById("guided-div-completion-date-selection")
      .classList.add("hidden");
    document
      .getElementById("guided-div-submission-accordion")
      .classList.add("hidden");

    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-checked-milestones"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-checked-milestones"
    ).style.display = "flex";
    document.getElementById(
      "guided-button-edit-checked-completion-date"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-checked-completion-date"
    ).style.display = "flex";
  });

  $("#guided-button-save-checked-completion-date").on("click", () => {
    const guidedCompletionDateInput = document.getElementById(
      "guided-submission-completion-date"
    );
    //function that checks is the input is a valid date yyyy-mm-dd
    const isValidDate = (date) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(date);
    };
    const customCompletionDateInput = document.getElementById(
      "guided-input-custom-completion-date"
    );

    //check to see if customCompletionDateInput is not undefined or null
    if (
      customCompletionDateInput !== undefined &&
      customCompletionDateInput !== null
    ) {
      if (isValidDate(customCompletionDateInput.value)) {
        removeAlertMessageIfExists($("#guided-input-custom-completion-date"));
        guidedCompletionDateInput.value = customCompletionDateInput.value;
        guidedCompletionDateInput.disabled = true;
        unHideAndSmoothScrollToElement("guided-div-submission-accordion");
        return;
      } else {
        generateAlertMessage($("#guided-input-custom-completion-date"));
        return;
      }
    }
    const selectedCompletionDate = document.querySelector(
      "input[name='completion-date']:checked"
    );
    if (selectedCompletionDate) {
      const completionDate = selectedCompletionDate.value;
      guidedCompletionDateInput.value = selectedCompletionDate.value;
      guidedCompletionDateInput.disabled = true;
      unHideAndSmoothScrollToElement("guided-div-submission-accordion");
    } else {
      notyf.error("Please select a completion date");
      return;
    }
    disableElementById("guided-completion-date-container");
    //switch button from save to edit
    document.getElementById(
      "guided-button-save-checked-completion-date"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-checked-completion-date"
    ).style.display = "flex";
  });
  $("#guided-button-edit-checked-completion-date").on("click", () => {
    //re-enable disabled elements and hide completion date selection div
    enableElementById("guided-completion-date-container");
    document
      .getElementById("guided-div-submission-accordion")
      .classList.add("hidden");

    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-checked-completion-date"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-checked-completion-date"
    ).style.display = "flex";
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

  //description///////////////////////////////////////
  const renderContributorFields = (contributionMembersArray) => {
    //loop through curationMembers object
    let contributionMembersElements = contributionMembersArray
      .map((contributionMember) => {
        return generateContributorField(
          contributionMember["contributorLastName"],
          contributionMember["contributorFirstName"],
          contributionMember["contributorORCID"],
          contributionMember["contributorAffiliation"],
          contributionMember["contributorRole"]
        );
      })
      .join("\n");

    const contributorsContainer = document.getElementById(
      "contributors-container"
    );
    contributorsContainer.innerHTML = contributionMembersElements;
    const contributorRoleInputs = document.querySelectorAll(
      ".guided-contributor-role-input"
    );

    //create a tagify for each element in contributorRoleElements
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
          enabled: 1,
          closeOnSelect: true,
          position: "auto",
        },
      });
    });

    //show the contributor fields
    unHideAndSmoothScrollToElement("guided-div-contributor-field-set");
  };

  $("#guided-button-save-checked-contributors").on("click", async function () {
    //disable button and set to loading while querying contributor data from AirTable
    $(this).prop("disabled", true);
    $(this).addClass("loading");
    const checkedContributors = getCheckedContributors();
    console.log(checkedContributors);
    //if checkedMilestoneData is empty, create notyf
    if (checkedContributors.length === 0) {
      notyf.error("Please select at least one contributor");
      $(this).prop("disabled", false);
      $(this).removeClass("loading");
      return;
    }

    var airKeyContent = parseJson(airtableConfigPath);
    var airKeyInput = airKeyContent["api-key"];
    var airtableConfig = Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    // Create a filter string to select every entry with first and last names that match the checked contributors
    let contributorInfoFilterString = "OR(";
    for (const contributor of checkedContributors) {
      contributorInfoFilterString += `AND({First_name} = "${contributor["contributorFirstName"]}", {Last_name} = "${contributor["contributorLastName"]}"),`;
    }
    //replace last comma with closing bracket
    contributorInfoFilterString =
      contributorInfoFilterString.slice(0, -1) + ")";

    //Select contributors where contributor first name is Jacob and contributor last name is Smith or contributor first name is John and contributor last name is Doe
    const contributorInfoResult = await base("sparc_members")
      .select({
        filterByFormula: contributorInfoFilterString,
      })
      .all();

    const contributorInfo = contributorInfoResult.map((contributor) => {
      return {
        contributorFirstName: contributor.fields["First_name"],
        contributorLastName: contributor.fields["Last_name"],
        contributorORCID: contributor.fields["ORCID"],
        contributorAffiliation: contributor.fields["Institution"],
        contributorRole: contributor.fields["Institution_role"],
      };
    });
    renderContributorFields(contributorInfo);

    //set opacity and remove pointer events for table and show edit button
    disableElementById("contributors-table");
    //switch button from save to edit
    document.getElementById(
      "guided-button-save-checked-contributors"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-checked-contributors"
    ).style.display = "flex";
    $(this).prop("disabled", false);
    $(this).removeClass("loading");
  });

  $("#guided-button-edit-checked-contributors").on("click", () => {
    enableElementById("contributors-table");
    enableElementById("contributors-container");
    enableElementById("guided-button-add-contributor");
    document
      .getElementById("guided-div-contributor-field-set")
      .classList.add("hidden");

    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-checked-contributors"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-checked-contributors"
    ).style.display = "flex";
    document.getElementById(
      "guided-button-edit-contributor-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-contributor-fields"
    ).style.display = "flex";
  });

  $("#guided-button-save-contributor-fields").on("click", () => {
    let allInputsValid = true;
    //get all contributor fields
    const contributorFields = document.querySelectorAll(
      ".guided-contributor-field-container"
    );
    //check if contributorFields is empty
    if (contributorFields.length === 0) {
      notyf.error("Please add at least one contributor");
      //Add a contributor field to help the user out a lil
      addContributorField();
      return;
    }

    //loop through contributor fields and get values
    const contributorFieldsArray = Array.from(contributorFields);
    ///////////////////////////////////////////////////////////////////////////////
    contributorFieldsArray.forEach((contributorField) => {
      const contributorLastName = contributorField.querySelector(
        ".guided-last-name-input"
      );
      contributorFirstName = contributorField.querySelector(
        ".guided-first-name-input"
      );
      contributorORCID = contributorField.querySelector(".guided-orcid-input");
      contributorAffiliation = contributorField.querySelector(
        ".guided-affiliation-input"
      );
      //get the tags inside the tagify element with the class guided-contributor-role-input
      const contributorRoleTagify = contributorField.querySelector(
        ".guided-contributor-role-input"
      );
      //get the children of contributorRoleTagify in an array
      const contributorRoleTagifyChildren = Array.from(
        contributorRoleTagify.children
      );
      //remove the span element from the array so only tag elements are left
      contributorRoleTagifyChildren.pop();
      //get the titles of the tagify tagsh
      const contributorRoles = contributorRoleTagifyChildren.map((child) => {
        return child.title;
      });
      //Validate all of the contributor fields
      const textInputs = [
        contributorLastName,
        contributorFirstName,
        contributorORCID,
        contributorAffiliation,
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
        contributorLastName: contributorLastName.value,
        contributorFirstName: contributorFirstName.value,
        contributorORCID: contributorORCID.value,
        contributorAffiliation: contributorAffiliation.value,
        contributorRoles: contributorRoles,
      };
    });
    ///////////////////////////////////////////////////////////////////////////////
    if (!allInputsValid) {
      notyf.error("Please fill out all contributor information fields");
      return;
    }

    //set opacity and remove pointer events for table and show edit button
    disableElementById("contributors-container");
    disableElementById("guided-button-add-contributor");

    //switch button from save to edit
    document.getElementById(
      "guided-button-save-contributor-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-contributor-fields"
    ).style.display = "flex";
    pulseNextButton();
  });
  $("#guided-button-edit-contributor-fields").on("click", () => {
    enableElementById("contributors-container");
    enableElementById("guided-button-add-contributor");
    //switch button from edit to save
    document.getElementById(
      "guided-button-edit-contributor-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-save-contributor-fields"
    ).style.display = "flex";
    unPulseNextButton();
  });

  $("#guided-button-save-protocol-fields").on("click", () => {
    let allInputsValid = true;
    let protocolData = [];

    //get all contributor fields
    const protocolFields = document.querySelectorAll(
      ".guided-protocol-field-container"
    );
    //check if contributorFields is empty
    if (protocolFields.length === 0) {
      notyf.error("Please add at least one protocol");
      return;
    }

    //loop through contributor fields and get values
    const protocolFieldsArray = Array.from(protocolFields);
    ///////////////////////////////////////////////////////////////////////////////
    protocolFieldsArray.forEach((protocolField) => {
      protocolUrl = protocolField.querySelector(".guided-protocol-url-input");
      protocolDescription = protocolField.querySelector(
        ".guided-protocol-description-input"
      );

      const textInputs = [protocolUrl, protocolDescription];

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
      //
      const protocolInputObj = {
        protocolUrl: protocolUrl,
        protocolDescription: protocolDescription,
      };
      protocolData.push(protocolInputObj);
    });
    ///////////////////////////////////////////////////////////////////////////////

    if (!allInputsValid) {
      notyf.error("Please fill out all protocol fields");
      return;
    }

    //Add the protocol data to the jsonObj
    for (const protocol of protocolData) {
      sodaJSONObj["dataset-metadata"]["protocol-data"].push(protocol);
    }

    //set opacity and remove pointer events for table and show edit button
    disableElementById("protocols-container");
    disableElementById("guided-button-add-protocol");

    //switch button from save to edit
    document.getElementById(
      "guided-button-save-protocol-fields"
    ).style.display = "none";
    document.getElementById(
      "guided-button-edit-protocol-fields"
    ).style.display = "flex";
  });
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
      console.log(otherLinkField);
      const linkUrl = otherLinkField.querySelector(
        ".guided-other-link-url-input"
      );
      console.log(linkUrl);
      const linkDescription = otherLinkField.querySelector(
        ".guided-other-link-description-input"
      );
      console.log(linkDescription);
      const linkRelation = otherLinkField.querySelector(
        ".guided-other-link-relation-dropdown"
      );
      console.log(linkRelation);
      console.log(linkRelation.value);
      const textInputs = [linkUrl, linkDescription];

      //check if all text inputs are valid
      textInputs.forEach((textInput) => {
        console.log(textInput);
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

  const guidedSaveDescriptionFile = () => {
    let datasetInfoValueObj = getGuidedDatasetInformation();
    let studyInfoValueObject = getGuidedDatasetStudyInformation();
    let contributorObj = getGuidedDatasetContributorInformation();
    let relatedInfoArr = guidedCombineLinkSections();

    let json_str_ds = JSON.stringify(datasetInfoValueObj);
    let json_str_study = JSON.stringify(studyInfoValueObject);
    let json_str_con = JSON.stringify(contributorObj);
    let json_str_related_info = JSON.stringify(relatedInfoArr);

    let descriptionFileDestination = path.join(
      $("#guided-dataset-path").text().trim(),
      "description.xlsx"
    );
    if ($("#guided-dataset-path").text().trim() == "") {
      Swal.fire({
        title: "Please select a destination folder",
        icon: "warning",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    } else {
      client.invoke(
        "api_save_ds_description_file",
        false,
        "None",
        "None",
        descriptionFileDestination,
        json_str_ds,
        json_str_study,
        json_str_con,
        json_str_related_info,
        async (error, res) => {
          if (error) {
            var emessage = userError(error);
            log.error(error);
            console.error(error);
            Swal.fire({
              title: "Failed to generate the dataset_description file",
              html: emessage,
              icon: "warning",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          } else {
            let successMessage =
              "Successfully generated the dataset_description.xlsx file at the specified location.";
            Swal.fire({
              title: successMessage,
              icon: "success",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          }
        }
      );
    }
  };
  const getGuidedDatasetInformation = () => {
    const name = sodaJSONObj["digital-metadata"]["name"];
    const description = sodaJSONObj["digital-metadata"]["subtitle"];
    //get the value of the checked radio button with the name dataset-relation and store as type
    const type = document.querySelector(
      "input[name='dataset-relation']:checked"
    ).value;
    const keywordArray = keywordTagify.value;
    const subjects = guidedGetSubjects();
    const numSubjects = subjects.length;
    let numSamples = 0;
    //get the number of samples for each subject and add it to the numSamples variable
    for (const subject of subjects) {
      numSamples += guidedGetSubjectSamples(subject).length;
    }

    return {
      name: name,
      description: description,
      type: type,
      keywords: keywordArray,
      "number of samples": numSamples,
      "number of subjects": numSubjects,
    };
  };
  const getGuidedDatasetStudyInformation = () => {
    var studyOrganSystemTags = getTagsFromTagifyElement(
      guidedStudyOrganSystemsTagify
    );
    var studyApproachTags = getTagsFromTagifyElement(guidedStudyApproachTagify);
    var studyTechniqueTags = getTagsFromTagifyElement(
      guidedStudyTechniquesTagify
    );
    var studyPurpose = document.getElementById("guided-ds-study-purpose").value;
    var studyDataCollection = document.getElementById(
      "guided-ds-study-data-collection"
    ).value;
    var studyPrimaryConclusion = document.getElementById(
      "guided-ds-study-primary-conclusion"
    ).value;
    var studyCollectionTitle = document.getElementById(
      "guided-ds-study-collection-title"
    ).value;

    return {
      "study organ system": studyOrganSystemTags,
      "study approach": studyApproachTags,
      "study technique": studyTechniqueTags,
      "study purpose": studyPurpose,
      "study data collection": studyDataCollection,
      "study primary conclusion": studyPrimaryConclusion,
      "study collection title": studyCollectionTitle,
    };
  };
  const getGuidedDatasetContributorInformation = () => {
    var funding = document.getElementById(
      "guided-ds-description-award-input"
    ).value;
    var acknowledgment = document.getElementById(
      "guided-ds-description-acknowledgments"
    ).value;

    var fundingArray = [];
    if (funding === "") {
      fundingArray = [""];
    } else {
      fundingArray = [funding];
    }
    /// other funding sources
    var otherFunding = getTagsFromTagifyElement(
      guidedOtherFundingsourcesTagify
    );
    for (var i = 0; i < otherFunding.length; i++) {
      fundingArray.push(otherFunding[i]);
    }

    var contributorInfo = {};
    contributorInfo["funding"] = fundingArray;
    contributorInfo["acknowledgment"] = acknowledgment;
    contributorInfo["contributors"] = contributorArray;
    return contributorInfo;
  };
  const getGuidedAdditionalLinkSection = () => {
    var table = document.getElementById("guided-other-link-table-dd");
    var rowcountLink = table.rows.length;
    var additionalLinkInfo = [];
    for (i = 1; i < rowcountLink; i++) {
      var additionalLink = {
        link: table.rows[i].cells[1].innerText,
        type: table.rows[i].cells[2].innerText,
        relation: table.rows[i].cells[3].innerText,
        description: table.rows[i].cells[4].innerText,
      };
      additionalLinkInfo.push(additionalLink);
    }
    return additionalLinkInfo;
  };
  const getGuidedProtocolSection = () => {
    var table = document.getElementById("guided-protocol-link-table-dd");
    var rowcountLink = table.rows.length;
    var protocolLinkInfo = [];
    for (i = 1; i < rowcountLink; i++) {
      var protocol = {
        link: table.rows[i].cells[1].innerText,
        type: table.rows[i].cells[2].innerText,
        relation: table.rows[i].cells[3].innerText,
        description: table.rows[i].cells[4].innerText,
      };
      protocolLinkInfo.push(protocol);
    }
    return protocolLinkInfo;
  };
  const guidedCombineLinkSections = () => {
    var protocolLinks = getGuidedProtocolSection();
    var otherLinks = getGuidedAdditionalLinkSection();
    protocolLinks.push.apply(protocolLinks, otherLinks);
    return protocolLinks;
  };
  $("#guided-generate-description-file").on("click", () => {
    guidedSaveDescriptionFile();
  });

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

  const guidedSaveStudyInformation = () => {
    let studyOrganSystems = getTagsFromTagifyElement(
      guidedStudyOrganSystemsTagify
    );
    let studyApproaches = getTagsFromTagifyElement(guidedStudyApproachTagify);
    let studyTechniques = getTagsFromTagifyElement(guidedStudyTechniquesTagify);
    let studyPurpose = $("#guided-ds-study-purpose").val();
    let studyDataCollection = $("#guided-ds-study-data-collection").val();
    let studyPrimaryConclusion = $("#guided-ds-study-primary-conclusion").val();

    if (
      studyOrganSystems.length === 0 ||
      studyApproaches.length === 0 ||
      studyTechniques.length == 0 ||
      studyPurpose.length == 0 ||
      studyDataCollection.length == 0 ||
      studyPrimaryConclusion.length == 0
    ) {
      /*Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: "Please fill in all of the study information fields.",
        title: "Incomplete information",
      });*/
    } else {
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "studyOrganSystems"
      ] = studyOrganSystems;
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "studyApproaches"
      ] = studyApproaches;
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "studyTechniques"
      ] = studyTechniques;
      sodaJSONObj["dataset-metadata"]["description-metadata"]["studyPurpose"] =
        studyPurpose;
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "studyDataCollection"
      ] = studyDataCollection;
      sodaJSONObj["dataset-metadata"]["description-metadata"][
        "studyPrimaryConclusion"
      ] = studyPrimaryConclusion;
    }
  };

  //Award & Contributor Information functions
  const guidedSaveAwardAndContrinbutorInformation = () => {
    sparcAwardNumber = $("#guided-ds-description-award-input").val();
  };

  $("#guided-generate-dataset-button").on("click", async function () {
    traverseToTab("guided-dataset-generation-tab");
    guidedPennsieveDatasetUpload();
    $("#guided-footer-div").hide();
  });

  const guidedSaveBannerImage = () => {
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
    let imagePath = path.join(
      imageFolder,
      `${datasetName}-banner-image.` + imageExtension
    );
    let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

    imageDataURI.outputFile(croppedImageDataURI, imagePath).then(() => {
      let image_file_size = fs.statSync(imagePath)["size"];
      if (image_file_size < 5 * 1024 * 1024) {
        $("#guided-para-dataset-banner-image-status").html("");
        setGuidedBannerImage(imagePath);
        $("#guided-banner-image-modal").modal("hide");
        $("#guided-button-add-banner-image").text("Edit banner image");
      } else {
        $("#guided-para-dataset-banner-image-status").html(
          "<span style='color: red;'> " +
            "Final image size must be less than 5 MB" +
            "</span>"
        );
      }
    });
  };
  /**************************************/
  $("#guided-save-banner-image").click((event) => {
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
        }).then((result) => {
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
            }).then((result) => {
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
        }

        if (buttonYesImportExistingSelected) {
          sodaJSONObj["guided-options"]["dataset-start-location"] =
            "import-existing";
        }
      }

      if (pageBeingLeftID === "guided-subjects-folder-tab") {
        const skipSubSamFolderAndMetadataPages = () => {
          $("#guided-create-subjects-metadata-tab").attr(
            "data-skip-page",
            "true"
          );
          $("#guided-create-samples-metadata-tab").attr(
            "data-skip-page",
            "true"
          );
        };
        const unSkipSubSamFolderAndMetadataPages = () => {
          $("#guided-create-subjects-metadata-tab").attr(
            "data-skip-page",
            "false"
          );
          $("#guided-create-samples-metadata-tab").attr(
            "data-skip-page",
            "false"
          );
        };
        //If the user indicated they had subjects however left the subjects table page without adding any,
        //Ask the user if they would like to go back to subjects table, and if not, skip
        //to the source folder
        if (guidedGetSubjects().length == 0) {
          let result = await Swal.fire({
            title: "Continue?",
            text: "You indicated that your dataset contained subjects, however, you did not add any subjects to your subjects table.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085D6",
            confirmButtonText: "I want to add subjects into the subject table",
            cancelButtonText: "I do not have any subjects",
          });
          //If the user indicates they do not have any subjects, skip to source folder
          if (result.isConfirmed) {
            $(this).removeClass("loading");
            return;
          } else {
            skipSubSamFolderAndMetadataPages();
            traverseToTab("guided-source-folder-tab");
            $(this).removeClass("loading");
            return;
          }
        } else {
          unSkipSubSamFolderAndMetadataPages();
        }
      }
      if (pageBeingLeftID === "guided-samples-folder-tab") {
        const skipSampleMetadataPages = () => {
          $("#guided-create-samples-metadata-tab").attr(
            "data-skip-page",
            "true"
          );
        };
        const unSkipSampleMetadataPages = () => {
          $("#guided-create-samples-metadata-tab").attr(
            "data-skip-page",
            "false"
          );
        };
        //If the user indicated they had subjects however left the subjects table page,
        //Ask the user if they would like to go back to subjects table, and if not, skip
        //to the source folder

        //get combined length of arrays for properties in sodaJSONObj["subjects-samples-structure"]

        let numSamples = 0;
        for (let i = 0; i < guidedGetSubjects().length; i++) {
          numSamples =
            numSamples + guidedGetSubjectSamples(guidedGetSubjects()[i]).length;
        }

        if (numSamples == 0) {
          let result = await Swal.fire({
            title: "Continue without adding samples?",
            text: "You indicated that your dataset contained samples, however, you did not add any samples to your samples table.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "I want to add samples into the sample table",
            cancelButtonText: "I do not have any samples",
          });
          //If the user indicates they do not have any samples, skip to source folder
          if (result.isConfirmed) {
            $(this).removeClass("loading");
            return;
          } else {
            skipSampleMetadataPages();
            traverseToTab("guided-source-folder-tab");
            $(this).removeClass("loading");
            return;
          }
        } else {
          unSkipSampleMetadataPages();
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
        if (
          !document
            .getElementById("guided-button-has-code-data")
            .classList.contains("selected") &&
          !document
            .getElementById("guided-button-no-code-data")
            .classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains code data",
          });
          //throw errorArray;
        }
      }
      if (pageBeingLeftID === "guided-docs-folder-tab") {
        if (
          !document
            .getElementById("guided-button-has-docs-data")
            .classList.contains("selected") &&
          !document
            .getElementById("guided-button-no-docs-data")
            .classList.contains("selected")
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please indicate if your dataset contains docs data",
          });
          //throw errorArray;
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
        if (isPageValid(pageBeingLeftID)) {
          const designateSelfButton = document.getElementById(
            "guided-button-designate-self-PI"
          );
          const designateOtherButton = document.getElementById(
            "guided-button-designate-other-PI"
          );
          if (designateOtherButton.classList.contains("selected")) {
            let PiOwnerString = $("#guided_bf_list_users_pi option:selected")
              .text()
              .trim();
            // get the text before the email address from the selected dropdown
            let PiName = PiOwnerString.split("(")[0];
            let PiUUID = $("#guided_bf_list_users_pi").val().trim();

            const newPiOwner = {
              userString: PiOwnerString,
              UUID: PiUUID,
              name: PiName,
            };
            setGuidedDatasetPiOwner(newPiOwner);
          }
        } else {
          if (
            !designateSelfButton.classList.contains("selected") &&
            !designateOtherButton.classList.contains("selected")
          ) {
            errorArray.push({
              type: "notyf",
              message:
                "Please indicate who you would like to designate as the PI.",
            });
            throw errorArray;
          }
          if (designateOtherButton.classList.contains("selected")) {
            errorArray.push({
              type: "notyf",
              message:
                "Please select a user from the dropdown to designate as PI",
            });
            throw errorArray;
          }
        }
      }
      if (pageBeingLeftID === "guided-designate-permissions-tab") {
      }
      if (pageBeingLeftID === "guided-add-description-tab") {
        let studyPurpose = document
          .getElementById("guided-ds-description-study-purpose")
          .value.trim();
        let dataCollection = document
          .getElementById("guided-ds-description-data-collection")
          .value.trim();
        let primaryConclusion = document
          .getElementById("guided-ds-description-primary-conclusion")
          .value.trim();
        sodaJSONObj["digital-metadata"]["study-purpose"] = studyPurpose;
        sodaJSONObj["digital-metadata"]["data-collection"] = dataCollection;
        sodaJSONObj["digital-metadata"]["primary-conclusion"] =
          primaryConclusion;
      }
      if (pageBeingLeftID === "guided-add-tags-tab") {
        let datasetTags = getTagsFromTagifyElement(guidedDatasetTagsTagify);
        $(".guidedDatasetTags").text(datasetTags.join("\r\n"));
        sodaJSONObj["digital-metadata"]["dataset-tags"] = datasetTags;
      }
      if (pageBeingLeftID === "guided-designate-permissions-tab") {
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
      if (pageBeingLeftID === "guided-dataset-generation-tab") {
        if ($("#generate-dataset-local-card").hasClass("checked")) {
          sodaJSONObj["generate-dataset"]["destination"] = "local";
        }
        if ($("#generate-dataset-pennsieve-card").hasClass("checked")) {
          sodaJSONObj["generate-dataset"]["destination"] = "bf";
        }
      }
      if (pageBeingLeftID === "guided-dataset-generate-location-tab") {
        if ($("#guided-generate-dataset-local-card").hasClass("checked")) {
          sodaJSONObj["generate-dataset"]["destination"] = "local";
        }
        if ($("#guided-generate-dataset-pennsieve-card").hasClass("checked")) {
          sodaJSONObj["generate-dataset"]["destination"] = "bf";
        }
      }
      if (pageBeingLeftID === "guided-dataset-generate-destination-tab") {
        if ($("#guided-generate-dataset-new-card").hasClass("checked")) {
          confirmed_dataset_name = $("#guided-bf-dataset-name-confirm").text();
          sodaJSONObj["generate-dataset"]["dataset-name"] =
            confirmed_dataset_name;
        }
        sodaJSONObj["generate-dataset"]["generate-option"] = "new";
        sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
        sodaJSONObj["generate-dataset"]["if-existing-files"] =
          "create-duplicate";

        if ($("#guided-generate-dataset-pennsieve-card").hasClass("checked")) {
          sodaJSONObj["generate-dataset"]["destination"] = "bf";
        }

        $(this).css("visibility", "hidden");
      }
      if (pageBeingLeftID === "guided-create-submission-metadata-tab") {
        const award = $("#guided-submission-sparc-award").val();
        const date = $("#guided-submission-completion-date").val();
        const milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagify);
        //validate submission metadata
        if (award === "") {
          errorArray.push({
            type: "notyf",
            message:
              "Please add a SPARC award number to your submission metadata",
          });
        }
        if (date === "") {
          errorArray.push({
            type: "notyf",
            message: "please add a completion date to your submission metadata",
          });
        }
        if (milestones.length === 0) {
          errorArray.push({
            type: "notyf",
            message:
              "Please add at least one milestone to your submission metadata",
          });
        }
        if (errorArray.length > 0) {
          // throw errorArray;
        }
        // submission data validated, add to JSON
        var json_arr = [];
        json_arr.push({
          award: award,
          date: date,
          milestone: milestones[0],
        });
        for (milestone of milestones) {
          json_arr.push({
            award: "",
            date: "",
            milestone: milestone,
          });
        }
        json_str = JSON.stringify(json_arr);
        sodaJSONObj["dataset-metadata"]["submission-metadata"] = json_str;
        // save the award string to JSONObj to be shared with other award inputs
        sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
          award;
      }
      if (pageBeingLeftID === "guided-create-description-metadata-tab") {
      }
      if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
        guidedShowTreePreview(
          sodaJSONObj["digital-metadata"]["name"],
          guidedJstreePreview
        );
      }

      console.log(sodaJSONObj);

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
        errorArray = [];
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
        .getElementById("guided-name-subtitle-parent-tab")
        .classList.remove("hidden");
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
      datasetNameInputElement.value = datasetName;
      datasetSubtitleInputElement.value = datasetSubtitle;

      //switch the create new / modify existing buttons
      $("#guided-modify-dataset-name-subtitle").show();
      $("#guided-create-new-dataset").hide();

      return;
    }

    if (pageBeingLeftID === "guided-dataset-generation-confirmation-tab") {
      $("#guided-next-button").css("visibility", "visible");
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
          console.log("recursive back");
          return getPrevPageNotSkipped(prevPage);
        } else {
          console.log("regular back");
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
    currentParentPageID = CURRENT_PAGE.attr("id");
    //Get the id of the sub-page that's currently open
    const openSubPageID = getOpenSubPageInPage(currentParentPageID);
    console.log(openSubPageID);

    switch (currentParentPageID) {
      case "guided-subjects-folder-tab": {
        switch (openSubPageID) {
          case "guided-specify-subjects-page": {
            setActiveSubPage("guided-organize-subjects-into-pools-page");
            break;
          }

          case "guided-organize-subjects-into-pools-page": {
            setActiveSubPage("guided-specify-samples-page");
            break;
          }

          case "guided-specify-samples-page": {
            hideSubNavAndShowMainNav("next");
            break;
          }
        }
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
      }
    }
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
            $("#guided-sub-page-navigation-footer-div").hide();
            $("#guided-footer-div").css("display", "flex");
            $("#guided-back-button").click();
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
      }

      case "guided-primary-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-primary-samples-organization-page": {
            $("#guided-sub-page-navigation-footer-div").hide();
            $("#guided-footer-div").css("display", "flex");
            $("#guided-back-button").click();
            break;
          }

          case "guided-primary-subjects-organization-page": {
            setActiveSubPage("guided-primary-samples-organization-page");
            break;
          }
        }
      }

      case "guided-source-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-source-samples-organization-page": {
            $("#guided-sub-page-navigation-footer-div").hide();
            $("#guided-footer-div").css("display", "flex");
            $("#guided-back-button").click();
            break;
          }

          case "guided-source-subjects-organization-page": {
            setActiveSubPage("guided-source-samples-organization-page");
            break;
          }
        }
      }

      case "guided-derivative-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-derivative-samples-organization-page": {
            $("#guided-sub-page-navigation-footer-div").hide();
            $("#guided-footer-div").css("display", "flex");
            $("#guided-back-button").click();
            break;
          }

          case "guided-derivative-subjects-organization-page": {
            setActiveSubPage("guided-derivative-samples-organization-page");
            break;
          }
        }
      }
    }
  });

  //tagify initializations
  const guidedOtherFundingSourcesInput = document.getElementById(
    "guided-ds-other-funding"
  );
  const guidedOtherFundingsourcesTagify = new Tagify(
    guidedOtherFundingSourcesInput,
    { duplicates: false }
  );
  const guidedStudyOrganSystemsInput = document.getElementById(
    "guided-ds-study-organ-system"
  );
  const guidedStudyOrganSystemsTagify = new Tagify(
    guidedStudyOrganSystemsInput,
    {
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
    }
  );
  const guidedStudyApproachInput = document.getElementById(
    "guided-ds-study-approach"
  );
  const guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, {
    duplicates: false,
  });
  const guidedStudyTechniquesInput = document.getElementById(
    "guided-ds-study-technique"
  );
  const guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, {
    duplicates: false,
  });

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
  /*$("#guided-submission-completion-date").change(function () {
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
          $("#guided-submission-completion-date").append(
            $("<option>", {
              value: input_date,  
              text: input_date,
            })
          );
          var $option = $("#guided-submission-completion-date")
            .children()
            .last();
          $option.prop("selected", true);
        }
      });
    }
  });*/
});

const guided_generate = async () => {
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  if ("manifest-files" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
  }

  let dataset_name = "";
  let dataset_destination = "";

  if ("bf-dataset-selected" in sodaJSONObj) {
    dataset_name = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
    console.log(dataset_name);
  } else if ("generate-dataset" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["generate-dataset"]) {
      let destination = sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Local";
      }
      if (destination == "bf") {
        dataset_name = sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Pennsieve";
      }
    }
  }
  console.log(dataset_name);

  // prevent_sleep_id = electron.powerSaveBlocker.start('prevent-display-sleep')

  client.invoke("api_main_curate_function", sodaJSONObj, (error, res) => {
    if (error) {
      $("#sidebarCollapse").prop("disabled", false);
      var emessage = userError(error);
      document.getElementById(
        "para-new-curate-progress-bar-error-status"
      ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
      document.getElementById("para-new-curate-progress-bar-status").innerHTML =
        "";
      document.getElementById("div-new-curate-progress").style.display = "none";
      generateProgressBar.value = 0;
      log.error(error);
      console.error(error);
      // forceActionSidebar('show');
      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset",
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset - Size",
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );

      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );
    } else {
      $("#sidebarCollapse").prop("disabled", false);
      log.info("Completed curate function");
      console.log("Completed curate function");
      if (manifest_files_requested) {
        let high_level_folder_num = 0;
        if ("dataset-structure" in sodaJSONObj) {
          if ("folders" in sodaJSONObj["dataset-structure"]) {
            for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
              high_level_folder_num += 1;
            }
          }
        }

        ipcRenderer.send(
          "track-event",
          "Success",
          "Manifest Files Created",
          dataset_name,
          high_level_folder_num
        );
        ipcRenderer.send(
          "track-event",
          "Success",
          `Manifest Files Created - ${dataset_destination}`,
          dataset_name,
          high_level_folder_num
        );
      }

      if (dataset_destination == "Pennsieve") {
        show_curation_shortcut();
      }

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        "Generate Dataset - Size",
        dataset_name,
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );
    }
  });

  // Progress tracking function for main curate
  var countDone = 0;
  var timerProgress = setInterval(main_progressfunction, 1000);
};
