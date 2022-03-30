//Temp variables used for data storage until put into sodaJSONObj on next button press
let guidedUserPermissions = [];
let guidedTeamPermissions = [];

//Temp var used by guidedSaveBannerImage to hold the cropped image path
//until it is passed into the sodaJSONObj
let tempGuidedCroppedBannerImagePath = "";

//main nav variables initialized to first page of guided mode
let CURRENT_PAGE = $("#guided-basic-description-tab");

/////////////////////////////////////////////////////////
/////////////       Util functions      /////////////////
/////////////////////////////////////////////////////////
const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};
const disableProgressButton = () => {
  $("#guided-next-button").prop("disabled", true);
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
const renderProgressCards = (progressFileJSONdata) => {
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
  let targetCapsuleID = targetPageID.replace("tab", "capsule");
  let targetCapsule = $(`#${targetCapsuleID}`);
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

//Scroll down to dataset name prompt when a dataset start location is selected.
$(".dataset-info-button").on("click", () => {
  $("#guided-dataset-name-prompt")[0].scrollIntoView({
    behavior: "smooth",
  });
});

const guidedLoadSavedProgressFiles = async () => {
  //Check if Guided-Progress folder exists. If not, create it.
  if (!fs.existsSync(guidedProgressFilePath)) {
    fs.mkdirSync(guidedProgressFilePath);
  }
  //Get files in Guided-Progress folder
  const guidedSavedProgressFiles = await readDirAsync(guidedProgressFilePath);
  //render progress resumption cards from progress file array on first page of guided mode
  if (guidedSavedProgressFiles.length > 0) {
    const progressFileData = await getAllProgressFileData(
      guidedSavedProgressFiles
    );
    console.log(progressFileData);
    renderProgressCards(progressFileData);
  } else {
    console.log("No guided save files found");
  }
};
const traverseToTab = (targetPageID) => {
  if (
    targetPageID === "guided-designate-pi-owner-tab" ||
    "guided-designate-permissions-tab"
  ) {
    //Refresh select pickers so items can be selected
    $(".selectpicker").selectpicker("refresh");
  }
  if (targetPageID === "guided-subjects-folder-tab") {
    $("#guided-button-preview-folder-structure").show();
  }
  if (targetPageID === "guided-create-subjects-metadata-tab") {
    //Create new subjectsArray variable and assign it to all properties in datasetStructureJSONObj.folders.primary.folders if defined
    try {
      let subjectsArray = Object.keys(
        datasetStructureJSONObj.folders.primary.folders
      );
      for (let subject of subjectsArray) {
        //check to see if subject already has data in the sodajsonObj
        if (
          sodaJSONObj["dataset-metadata"]["subject-metadata"][subject] ===
          undefined
        ) {
          sodaJSONObj["dataset-metadata"]["subject-metadata"][subject] = {};
        }
      }
      renderSubjectsMetadataTable(subjectsArray);
    } catch {
      traverseToTab("guided-create-samples-metadata-tab");
      throw "subjectsArray not defined, going to samples metadata tab";
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
  let regex = /^[a-zA-Z0-9-_]+$/;
  return regex.test(subSamInput);
}
const generateAlertElement = (alertType, warningMessageText) => {
  return `
      <div class="alert alert-${alertType} guided--alert" role="alert">
        ${warningMessageText}
      </div>
    `;
  disableProgressButton();
};
const generateWarningMessage = (elementToWarn) => {
  const warningMessage = elementToWarn.data("warning");
  const alertType = elementToWarn.data("alert-type");
  if (!elementToWarn.next().hasClass("alert")) {
    elementToWarn.after(generateAlertElement(alertType, warningMessage));
  }
  enableProgressButton();
};
const removeWarningMessageIfExists = (elementToCheck) => {
  const warningMessageToRemove = elementToCheck.next();
  if (warningMessageToRemove.hasClass("alert")) {
    console.log("removing alert");
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
        removeWarningMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateWarningMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-dataset-subtitle-input") {
    let subtitle = inputElementToValidate.val().trim();
    if (subtitle !== "") {
      if (subtitle.length < 257) {
        removeWarningMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateWarningMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-number-of-subjects-input") {
    let numSubjects = inputElementToValidate.val().trim();
    if (numSubjects !== "") {
      if (isNumberBetween(numSubjects, 1, 1000)) {
        removeWarningMessageIfExists(inputElementToValidate);
        $("#guided-subjects-same-samples-amount-div").css("display", "flex");
        inputIsValid = true;
      } else {
        generateWarningMessage(inputElementToValidate);
        $("#guided-subjects-same-samples-amount-div").hide();
      }
    } else {
      $("#guided-subjects-same-samples-amount-div").hide();
    }
  }
  if (inputID === "guided-number-of-samples-input") {
    let numSamples = inputElementToValidate.val().trim();
    if (numSamples !== "") {
      if (isNumberBetween(numSamples, 1, 1000)) {
        removeWarningMessageIfExists(inputElementToValidate);
        $("#guided-button-generate-subjects-table").show();

        inputIsValid = true;
      } else {
        generateWarningMessage(inputElementToValidate);
        $("#guided-button-generate-subjects-table").hide();
      }
    } else {
      $("#guided-button-generate-subjects-table").hide();
    }
  }
  return inputIsValid;
};

const checkIfEnableNextButton = (inputSetID) => {
  if (inputSetID === "guided-basic-description-tab") {
    let datasetName = document
      .getElementById("guided-dataset-name-input")
      .value.trim();
    let datasetSubtitle = document
      .getElementById("guided-dataset-subtitle-input")
      .value.trim();

    if (
      datasetName != "" &&
      datasetSubtitle != "" &&
      tempGuidedCroppedBannerImagePath != "" &&
      ($("#guided-curate-new-dataset-card").hasClass("selected") ||
        $("#guided-curate-existing-local-dataset-card").hasClass("selected"))
    ) {
      enableProgressButton();
    } else {
      disableProgressButton();
    }
  }
  if (inputSetID === "guided-subjects-folder-tab") {
    let numSubjectsIsValid = false;
    let numSubjects = document
      .getElementById(`guided-number-of-subjects-input`)
      .value.trim();
    if (numSubjects !== "") {
      if (!isNumberBetween(numSubjects, 1, 1000)) {
        generateWarningMessage(inputElementToValidate);
      } else {
        removeWarningMessageIfExists(inputElementToValidate);
        numSubjectsIsValid = true;
      }
    }
  }
};

/////////////////////////////////////////////////////////
//////////       GUIDED FORM VALIDATORS       ///////////
/////////////////////////////////////////////////////////

const validateGuidedDatasetDescriptionInputs = () => {
  if (
    $("#guided-ds-description-study-purpose").val().trim().length == 0 ||
    $("#guided-ds-description-data-collection").val().trim().length == 0 ||
    $("#guided-ds-description-primary-conclusion").val().trim().length == 0
  ) {
    disableProgressButton();
  } else {
    enableProgressButton();
  }
};
//populates user inputs from the completed-tabs array, and returns the last page
//that the user completed
const populateGuidedModePages = (loadedJSONObj) => {
  let completedTabs = loadedJSONObj["completed-tabs"];
  //variable that keeps track if last completed page. Once this function is finished populating the UI,
  //the last completed page is rendered and next button clicked
  let lastCompletedTab = "none";

  if (completedTabs.includes("guided-basic-description-tab")) {
    let datasetName = loadedJSONObj["digital-metadata"]["name"];
    let datasetSubtitle = loadedJSONObj["digital-metadata"]["subtitle"];
    tempGuidedCroppedBannerImagePath =
      sodaJSONObj["digital-metadata"]["banner-image-path"];
    $("#guided-dataset-name-input").val(datasetName);
    $("#guided-dataset-subtitle-input").val(datasetSubtitle);

    let startingPoint = loadedJSONObj["starting-point"]["type"];
    if (startingPoint == "new") {
      handlePageBranching($("#guided-curate-new-dataset-card"));
      lastCompletedTab = "guided-basic-description-tab";
    }
    if (startingPoint == "local") {
      handlePageBranching($("#guided-curate-existing-local-dataset-card"));
      lastCompletedTab = "guided-basic-description-tab";
    } else {
      lastCompletedTab = "guided-basic-description-tab";
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
  if (completedTabs.includes("add-edit-description-tags-tab")) {
    let studyPurpose = loadedJSONObj["digital-metadata"]["study-purpose"];
    let dataCollection = loadedJSONObj["digital-metadata"]["data-collection"];
    let primaryConclusion =
      loadedJSONObj["digital-metadata"]["primary-conclusion"];
    let datasetTags = loadedJSONObj["digital-metadata"]["dataset-tags"];
    $("#guided-ds-description-study-purpose").val(studyPurpose);
    $("#guided-ds-description-data-collection").val(dataCollection);
    $("#guided-ds-description-primary-conclusion").val(primaryConclusion);
    guidedDatasetTagsTagify.addTags(datasetTags);

    lastCompletedTab = "add-edit-description-tags-tab";
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
  sodaJSONObj = {};
  sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  sodaJSONObj["generate-dataset"] = {};
  sodaJSONObj["manifest-files"] = {};
  sodaJSONObj["metadata-files"] = {};
  sodaJSONObj["starting-point"] = {};
  sodaJSONObj["dataset-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["subject-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["sample-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["submission-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["description-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["readMe-metadata"] = {};
  sodaJSONObj["dataset-metadata"]["changes-metadata"] = {};
  sodaJSONObj["digital-metadata"] = {};
  sodaJSONObj["completed-tabs"] = [];
  sodaJSONObj["last-modified"] = "";
  datasetStructureJSONObj = { folders: {}, files: {} };
};

/********** Folder structure utility **********/
const highLevelFolderPageData = {
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
};
const updateFolderStructureUI = (pageDataObj) => {
  $("#structure-folder-header").text(pageDataObj.headerText);
  $("#structure-folder-contents").text(pageDataObj.contentsText);
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
  traverseToTab("guided-create-subjects-metadata-tab");
  $("#guided-footer-div").css("display", "flex");
};
const renderSubjectsMetadataTable = (subjects) => {
  let subjectMetadataRows = subjects.sort().map((subject, index) => {
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
  });
  let subjectsMetadataContainer = document.getElementById(
    "subjects-metadata-table-container"
  );
  subjectsMetadataContainer.innerHTML = subjectMetadataRows.join("\n");
};
const guidedLoadSubjectMetadataIfExists = (subjectMetadataId) => {
  //loop through all guidedSubjectsTableData elements besides the first one
  for (let i = 1; i < guidedSubjectsTableData.length; i++) {
    if (guidedSubjectsTableData[i][0] === subjectMetadataId) {
      //if the id matches, load the metadata into the form
      populateForms(subjectMetadataId, "", "guided");
      return;
    }
  }
};
const openModifySubjectMetadataPage = (clickedSubjectAddMetadataButton) => {
  let subjectMetadataID = clickedSubjectAddMetadataButton
    .closest("tr")
    .find(".subject-metadata-id")
    .text();
  guidedLoadSubjectMetadataIfExists(subjectMetadataID);
  $("#guided-metadata-subject-id").text(subjectMetadataID);
  $("#guided-generate-subjects-file").text(
    `Save ${subjectMetadataID} metadata`
  );
  traverseToTab("guided-subject-metadata-tab");
  //Manually override active capsule to make it seem like they're still on the subjects tab
  setActiveCapsule("guided-create-subjects-metadata-tab");
  $("#guided-footer-div").hide();
};
const openCopySubjectMetadataPopup = (clickedSubjectCopyMetadataButton) => {
  let subjectsArray = Object.keys(
    datasetStructureJSONObj.folders.primary.folders
  );
  const copyFromMetadata = subjectsArray
    .map((subject) => {
      return `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from">
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
          <input type="checkbox" name="copy-to">
          <label>${subject}</label>
        </div>
      </div>`;
    })
    .join("\n");

  const copyMetadataElement = `
  <div class="space-between">
    <div class="ui form">
      <div class="grouped fields">
        <label class="guided--form-label text-left">Which subject would you like to copy metadata from?</label>
        ${copyFromMetadata}
      </div>
    </div>
    <div class="ui form">
      <div class="grouped fields">
        <label class="guided--form-label text-left">Which subjects would you like to copy metadata to?</label>
        ${copyToMetadata}
      </div>
    </div>
  </div>
  `;
  swal.fire({
    width: 950,
    html: copyMetadataElement,
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    confirmButtonColor: "Copy",
    focusCancel: true,
  });
};

//Click handler that sets the Subject's name after enter press in the table input
$("#guided-button-generate-subjects-table").on("click", () => {
  let numSubjectRowsToCreate = parseInt(
    $("#guided-number-of-subjects-input").val().trim()
  );
  // gets amount of samples to fill all number of sample input boxes
  let numSamplesIfAllSubjectsSameNumSamples = "";
  if ($("#guided-button-samples-same").hasClass("selected")) {
    numSamplesIfAllSubjectsSameNumSamples = parseInt(
      $("#guided-number-of-samples-input").val().trim()
    );
  }
  console.log(numSamplesIfAllSubjectsSameNumSamples);
  let subjectsTableBody = document.getElementById("subjects-table-body");
  const subjectRows = Array(numSubjectRowsToCreate)
    .fill(0)
    .map((subject, index) => {
      let tableIndex = index + 1;
      return generateSubjectRowElement(
        tableIndex,
        numSamplesIfAllSubjectsSameNumSamples
      );
    });
  subjectsTableBody.innerHTML = subjectRows.join("\n");

  guidedAddHighLevelFolderToDatasetStructureObj("primary");
  $("#number-of-subjects-prompt").hide();
  $("#subjects-table").css("display", "flex");
});

const createSubjectFolder = (event, subjectNameInput) => {
  if (event.which == 13) {
    try {
      const subjectName = subjectNameInput.val().trim();
      let existingSubjectNames = Object.keys(
        datasetStructureJSONObj.folders.primary.folders
      );
      //Throw error if entered subject name is duplicate
      if (existingSubjectNames.includes(subjectName)) {
        throw new Error("Subject name already exists");
      }
      const subjectNameElement = `
            <div class="space-between">
              <span class="subject-id">${subjectName}</span>
              <i
                class="far fa-edit jump-back"
                style="cursor: pointer;"
                onclick="openSubjectRenameInput($(this))"
              >
              </i>
            </div>
          `;
      if (subjectName.length > 0) {
        if (subSamInputIsValid(subjectName)) {
          removeWarningMessageIfExists(subjectNameInput);
          const subjectIdCellToAddNameTo = subjectNameInput.parent();
          subjectIdCellToAddNameTo.html(subjectNameElement);

          subjectTargetFolder = getRecursivePath(
            ["primary"],
            datasetStructureJSONObj
          ).folders;
          //Check to see if input has prev-name data attribute
          //Added when renaming a subject
          if (subjectNameInput.attr("data-prev-name")) {
            //get the name of the subject being renamed
            const subjectFolderToRename =
              subjectNameInput.attr("data-prev-name");
            //create a temp copy of the folder to be renamed
            copiedFolderToRename = subjectTargetFolder[subjectFolderToRename];
            //set the copied obj from the prev name to the new obj name
            subjectTargetFolder[subjectName] = copiedFolderToRename;
            //delete the temp copy of the folder that was renamed
            delete subjectTargetFolder[subjectFolderToRename];
          } else {
            //Create an empty folder for the new subject
            subjectTargetFolder[subjectName] = {
              folders: {},
              files: {},
              type: "",
              action: [],
            };
          }
        } else {
          generateWarningMessage(subjectNameInput);
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

//On edit button click, creates a new subject ID rename input box
const openSubjectRenameInput = (subjectNameEditButton) => {
  const subjectIdCellToRename = subjectNameEditButton.closest("td");
  const prevSubjectName = subjectIdCellToRename.find(".subject-id").text();
  const subjectRenameElement = `
    <input
      class="guided--input"
      type="text"
      name="guided-subject-id"
      placeholder="Enter new subject ID"
      onkeyup="createSubjectFolder(event, $(this))"
      data-input-set="guided-subjects-folder-tab"
      data-warning="Subject IDs may not contain special characters"
      data-alert-type="danger"
      data-prev-name="${prevSubjectName}"
    />
  `;
  subjectIdCellToRename.html(subjectRenameElement);
};

//updates the indices for guided tables using class given to spans in index cells
const updateGuidedTableIndices = (tableIndexClass) => {
  const indiciesToUpdate = $(`.${tableIndexClass}`);
  indiciesToUpdate.each((index, indexElement) => {
    let newIndex = index + 1;
    indexElement.innerHTML = newIndex;
  });
};
generateSubjectRowElement = (subjectIndex, subjectNumSamples) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <span class="subject-table-index">${subjectIndex}</span>
      </td>
      <td class="middle aligned subject-id-cell">
        <input
          class="guided--input"
          type="text"
          name="guided-subject-id"
          placeholder="Enter subject ID and press enter"
          onkeyup="createSubjectFolder(event, $(this))"
          data-input-set="guided-subjects-folder-tab"
          data-warning="Subject IDs may not contain special characters"
          data-alert-type="danger"
        />
      </td>
      <td class="middle aligned collapsing text-center">
        <input
          class="guided--input guided-input-sample-count"
          type="text"
          name="guided-number-of-samples"
          placeholder="Quantity"
          style="width: 120px; text-align: center;"
          value="${subjectNumSamples}"
        />
      </td>
      <td class="middle aligned collapsing text-center" style="min-width: 130px">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          style="background-color: var(--color-light-green) !important"
          onclick="openSubjectFolder($(this))"
        >
          Add files
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSubjectFolder($(this))"
        ></i>
      </td>
    </tr>
  `;
};
const addSubjectFolder = (subjectDeleteButton) => {
  $("#subjects-table-body").append(generateSubjectRowElement("", ""));
  updateGuidedTableIndices("subject-table-index");
};
//Deletes the entered subject folder from dsJSONObj and updates UI
const deleteSubjectFolder = (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();
  //delete the table row element in the UI
  subjectIdCellToDelete.remove();
  //Update subject table row indices
  updateGuidedTableIndices("subject-table-index");
  console.log(
    datasetStructureJSONObj["folders"]["primary"]["folders"][subjectIdToDelete]
  );
  //delete the subject folder from the dataset structure obj
  delete datasetStructureJSONObj["folders"]["primary"]["folders"][
    subjectIdToDelete
  ];
};
//Takes the user back to the subject table from subject folder structure page

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
        throw new Error("Sample name already exists");
      }
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
      if (sampleName.length > 0) {
        const sampleIdCellToAddNameTo = sampleNameInput.parent();
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
    <input
      class="guided--input"
      type="text"
      name="guided-sample-id"
      placeholder="Enter new subject ID"
      onkeyup="createSampleFolder(event, $(this))"
      data-prev-name="${prevSampleName}"
    />
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
const generateSampleRowElement = (sampleIndex) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <span class="sample-table-index">${sampleIndex}</span>
      </td>
      <td class="middle aligned sample-id-cell">
        <input
          class="guided--input"
          type="text"
          name="guided-sample-id"
          placeholder="Enter sample ID and press enter"
          onkeyup="createSampleFolder(event, $(this))"
        />
      </td>
      <td class="middle aligned collapsing text-center" style="min-width: 130px">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          style="background-color: var(--color-light-green) !important"
          onclick="openSampleFolder($(this))"
        >
          Add files
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSampleFolder($(this))"
        ></i>
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
  console.log(samplesParentSubject);
  console.log(sampleIdToDelete);
  //delete the table row element in the UI
  sampleIdCellToDelete.remove();
  //Update sample table row indices
  updateGuidedTableIndices("sample-table-index");
  //delete the sample folder from the dataset structure obj

  delete datasetStructureJSONObj["folders"]["primary"]["folders"][
    samplesParentSubject
  ]["folders"][sampleIdToDelete];
};
const renderSamplesTables = () => {
  //get subjects from the datasetStructureJSONObj
  let subjectsToMap = Object.keys(
    datasetStructureJSONObj.folders.primary.folders
  );
  //get the sample count from the number of samples input on the subjects page and
  //map the subjects to an array to create the sample tables
  let sampleData = subjectsToMap.sort().map((subject) => {
    let subjectNumSamples = $(`.subject-id:contains("${subject}")`)
      .closest("tr")
      .find(".guided-input-sample-count")
      .val();
    return {
      subjectName: subject,
      sampleCount: subjectNumSamples,
    };
  });
  let sampleTables = sampleData.map((subject) => {
    let sampleRows = Array(parseInt(subject.sampleCount))
      .fill(0)
      .map((subject, index) => {
        let tableIndex = index + 1;
        return generateSampleRowElement(tableIndex);
      })
      .join("\n");
    return `
      <table class="ui celled striped table" style="margin-bottom: 25px; min-width: 900px;">
        <thead>
          <tr>
            <th
              colspan="4"
              class="text-center"
              style="
                z-index: 2;
                height: 50px;
                position: sticky !important;
                top: -10px !important;
              "
            >
              <span class="sample-table-name">
                ${subject.subjectName}
              </span>
              <button
                class="ui primary basic button small"
                style="position: absolute;
                  right: 20px;
                  top: 50%;
                  transform: translateY(-50%);"
                  onclick="addSampleFolder($(this))"
                >
                <i class="fas fa-folder-plus" style="margin-right: 7px"></i
                >Add ${subject.subjectName} sample
              </button>
            </th>
          </tr>
          <tr>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Index
            </th>
            <th style="z-index: 2; position: sticky !important; top: 40px !important">
              Sample ID
            </th>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Specify data files for the sample
            </th>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Delete
            </th>
          </tr>
        </thead>
        <tbody>
          ${sampleRows}
        </tbody>
      </table>
    `;
  });
  let sampleTablesContainer = document.getElementById(
    "sample-tables-container"
  );
  sampleTablesContainer.innerHTML = sampleTables.join("\n");
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
  $("#structure-subjects-folder").appendTo($("#guided-user-has-source-data"));
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
  $("#structure-subjects-folder").appendTo(
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
  $("#structure-subjects-folder").appendTo($("#guided-user-has-code-data"));
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
  $("#structure-subjects-folder").appendTo($("#guided-user-has-docs-data"));
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

$("#guided-dataset-name-input").val("test " + makeid(5));
$("#guided-dataset-subtitle-input").val("test " + makeid(5));
tempGuidedCroppedBannerImagePath = "placeholder";
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

const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitle;
  $(".guidedDatasetSubtitle").text(datasetSubtitle);
};

const setGuidedBannerImage = (croppedImagePath) => {
  let datasetName = sodaJSONObj["digital-metadata"]["name"];
  //Replace "temp" from old cropped image path with entered dataset name and then update
  //the temp guided banner image path to be dataset-name specific

  //check if croppedImagePath string has substring "temp"
  if (croppedImagePath.includes("temp")) {
    console.log("includes temp");
    updatedCroppedImagePath = croppedImagePath.replace("temp", datasetName);
    fs.rename(croppedImagePath, updatedCroppedImagePath, (error) => {
      if (error) {
        console.log(error);
      }
    });
    //Update json obj to link to the new banner image path
    sodaJSONObj["digital-metadata"]["banner-image-path"] =
      updatedCroppedImagePath;
  }
};

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  console.log(newPiOwnerObj);
  $(".guidedDatasetOwner").text(newPiOwnerObj.userString);
  sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] =
    newPiOwnerObj.userString;
  sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
  //append created user to permissions array
  guidedUserPermissions.push(newUserPermissionObj);

  /*create user permissions element and append to all elements
      with guidedDatasetUserPermissions class.*/
  const newUserPermissionElement = $("<div>", {
    class: "guided--dataset-content-container",
    style: "width: 100%",
  });
  newUserPermissionElement.attr(
    "data-user-string",
    newUserPermissionObj.userString
  );
  newUserPermissionElement.attr(
    "data-user-permission",
    newUserPermissionObj.permission
  );
  newUserPermissionElement.append(
    $("<h5>", {
      class: "guided--dataset-content",
      text:
        $("#guided_bf_list_users option:selected").text().trim() +
        " : " +
        $("#select-permission-list-3").val(),
    })
  );
  newUserPermissionElement.append(
    $("<i>", {
      class: "fas fa-user-times guided-delete-permission-user",
      style: "color: red",
      onclick: `removeUserPermission($(this).closest(".guided--dataset-content-container"))`,
    })
  );
  $(".guidedDatasetUserPermissions").append(newUserPermissionElement);
};
const removeUserPermission = (userParentElement) => {
  userStringToRemove = userParentElement.data("user-string");
  guidedUserPermissions = guidedUserPermissions.filter(
    (userPermission) => userPermission.userString != userStringToRemove
  );
  $(".guidedDatasetUserPermissions")
    .children(`[data-user-string='${userStringToRemove}']`)
    .remove();
};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
  //append created team obj to array
  guidedTeamPermissions.push(newTeamPermissionObj);
  console.log(newTeamPermissionObj);

  const newTeamPermissionElement = $("<div>", {
    class: "guided--dataset-content-container",
    style: "width: 100%",
  });
  newTeamPermissionElement.attr(
    "data-team-string",
    newTeamPermissionObj.teamString
  );
  newTeamPermissionElement.attr(
    "data-team-permission",
    newTeamPermissionObj.permission
  );
  newTeamPermissionElement.append(
    $("<h5>", {
      class: "guided--dataset-content",
      text:
        $("#guided_bf_list_teams option:selected").text().trim() +
        " : " +
        $("#select-permission-list-4").val(),
    })
  );
  newTeamPermissionElement.append(
    $("<i>", {
      class: "fas fa-user-times guided-delete-permission-team",
      style: "color: red",
      onclick: `removeTeamPermission($(this).closest(".guided--dataset-content-container"))`,
    })
  );
  $(".guidedDatasetTeamPermissions").append(newTeamPermissionElement);
};
const removeTeamPermission = (teamParentElement) => {
  teamStringToRemove = teamParentElement.data("team-string");
  guidedTeamPermissions = guidedTeamPermissions.filter(
    (teamPermission) => teamPermission.teamString != teamStringToRemove
  );
  $(".guidedDatasetTeamPermissions")
    .children(`[data-team-string='${teamStringToRemove}']`)
    .remove();
};
const setGuidedLicense = (newLicense) => {
  $(".guidedBfLicense").text(newLicense);
  sodaJSONObj["digital-metadata"]["license"] = "Creative Commons Attribution";
};

$(document).ready(() => {
  $("#guided-button-add-permission-user").on("click", function () {
    //create user permissions object
    const newUserPermission = {
      userString: $("#guided_bf_list_users option:selected").text().trim(),
      UUID: $("#guided_bf_list_users").val().trim(),
      permission: $("#select-permission-list-3").val(),
    };
    guidedAddUserPermission(newUserPermission);
  });

  $("#guided-button-add-permission-team").on("click", function () {
    const newTeamPermissionObj = {
      teamString: $("#guided_bf_list_teams").val().trim(),
      permission: $("#select-permission-list-4").val(),
    };
    guidedAddTeamPermission(newTeamPermissionObj);
  });

  $(".guided--radio-button").on("click", function () {
    const selectedButton = $(this);
    const notSelectedButton = $(this).siblings(".guided--radio-button");

    notSelectedButton.removeClass("selected");
    notSelectedButton.addClass("not-selected");
    selectedButton.removeClass("not-selected");
    selectedButton.addClass("selected");

    //Display selected element container if data-next-question exists
    if (selectedButton.data("next-question")) {
      nextQuestionID = selectedButton.data("next-question");
      nextQuestionElement = $(`#${nextQuestionID}`);
      nextQuestionElement.css("display", "flex");
      nextQuestionElement[0].scrollIntoView({
        behavior: "smooth",
      });
    }
    //Hide all child containers of non-selected buttons
    notSelectedButton.each(function () {
      if ($(this).data("next-question")) {
        nextQuestionID = $(this).data("next-question");
        $(`#${nextQuestionID}`).hide();
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

  function guidedShowTreePreview(new_dataset_name, targetElement) {
    datasetStructureJSONObj["files"] = sodaJSONObj["metadata-files"];

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
    console.log(guidedJsTreePreviewData);
    $(targetElement).jstree(true).settings.core.data = guidedJsTreePreviewData;
    $(targetElement).jstree(true).refresh();
    //Open Jstree element with passed in folder node name
    const openFolder = (folderName) => {
      var tree = $("#jstree").jstree(true);
      var node = tree.get_node(folderName);
      tree.open_node(node);
    };
  }
  /////////////////////////////////////////////////////////
  /////////  PENNSIEVE METADATA BUTTON HANDLERS   /////////
  /////////////////////////////////////////////////////////
  $("#guided-button-add-permission-pi").on("click", function () {
    let PiOwnerString = $("#guided_bf_list_users_pi option:selected")
      .text()
      .trim();
    // gets the text before the email address from the selected dropdown
    let PiName = PiOwnerString.split("(")[0];
    let PiUUID = $("#guided_bf_list_users_pi").val().trim();

    const newPiOwner = {
      userString: PiOwnerString,
      UUID: PiUUID,
      name: PiName,
    };
    setGuidedDatasetPiOwner(newPiOwner);
  });

  $(".guided-change-dataset-subtitle").on("click", async function () {
    const { value: datasetSubtitle } = await Swal.fire({
      title: "Input new dataset subtitle",
      input: "text",
      inputPlaceholder: "Enter your new dataset subtitle here",
    });

    if (datasetSubtitle) {
      $(".guidedDatasetSubtitle").text(datasetSubtitle);
    }
  });

  $(".guided--text-data-description").on("keyup", function () {
    validateGuidedDatasetDescriptionInputs();
  });

  $("#guided-dataset-subtitle-input").on("keyup", () => {
    const guidedDatasetSubtitleCharCount = document.getElementById(
      "guided-subtitle-char-count"
    );
    countCharacters(
      document.getElementById("guided-dataset-subtitle-input"),
      guidedDatasetSubtitleCharCount
    );
  });
  $("#guided-button-add-license").on("click", function () {
    setGuidedLicense("Creative Commons Attribution (CC-BY)");
    $("#guided-button-add-license").attr("disabled");
    enableProgressButton();
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
      throw new Error(message);
    }

    const createDatasetResponseJson = response.json();
    console.log(createDatasetResponseJson);
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
      html: `<div id="guided-folder-structure-preview" style="display: flex; justify-content: flex-start;"></div>`,
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
      console.log("open folder");
      data.instance.set_type(data.node, "folder open");
    });
    $(folderStructurePreview).on("close_node.jstree", function (event, data) {
      console.log("close folder");
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
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add banner image",
            });
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: "Banner Image added",
            });
            guidedIncreaseCurateProgressBar(5);
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
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add user permission",
            });
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: "User permission added",
            });
            log.info("Dataset permission added");
            guidedIncreaseCurateProgressBar(5);
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
            notyf.open({
              duration: "5000",
              type: "error",
              message: "Failed to add team permission",
            });
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            reject(error);
          } else {
            notyf.open({
              duration: "5000",
              type: "success",
              message: "Team permission added",
            });
            log.info("Dataset permission added");
            guidedIncreaseCurateProgressBar(5);
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
    requiredFields.push("**Study Purpose:** " + studyPurpose + "\n");
    requiredFields.push("**Data Collection:** " + dataCollection + "\n");
    requiredFields.push("**Primary Conclusion:** " + primaryConclusion + "\n");
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

  //dataset metadata functions
  const guidedSaveSubmissionFile = () => {
    let award = $("#guided-submission-sparc-award").val();
    let date = $("#guided-submission-completion-date").val();
    let milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagify);
    if (award === "" || date === null || milestones.length == 0) {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: "Please fill in all of the required fields.",
        title: "Incomplete information",
      });
    } else {
      var json_arr = [];
      json_arr.push({
        award: award,
        date: date,
        milestone: milestones[0],
      });
      if (milestones.length > 0) {
        for (var index = 1; index < milestones.length; index++) {
          json_arr.push({
            award: "",
            date: "",
            milestone: milestones[index],
          });
        }
      }
      json_str = JSON.stringify(json_arr);
      client.invoke(
        "api_save_submission_file",
        false,
        "None",
        "None",
        path.join($("#guided-dataset-path").text().trim(), "submission.xlsx"),
        json_str,
        (error, res) => {
          if (error) {
            var emessage = userError(error);
            log.error(error);
            console.error(error);
            Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              icon: "error",
              html: emessage,
              title: "Failed to generate the submission file",
            });
          } else {
            $("#guided-generate-submission-file").text("Edit submission file");
          }
        }
      );
    }
  };

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
  } /*
  $("#guided-generate-subjects-file").on("click", () => {
    guidedSaveSubjectsFile();
  });*/
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
    var name = sodaJSONObj["digital-metadata"]["name"];
    var description = sodaJSONObj["digital-metadata"]["subtitle"];
    var type = $("#guided-ds-type").val();
    var keywordArray = keywordTagify.value;
    sodaJSONObj["digital-metadata"]["dataset-tags"];
    var samplesNo = document.getElementById("guided-ds-samples-no").value;
    var subjectsNo = document.getElementById("guided-ds-subjects-no").value;

    return {
      name: name,
      description: description,
      type: type,
      keywords: keywordArray,
      "number of samples": samplesNo,
      "number of subjects": subjectsNo,
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
    enableProgressButton();
    $("#guided-next-button").click();
    guidedPennsieveDatasetUpload();
  });

  const guidedSaveBannerImageWithTempName = () => {
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

    let imagePath = path.join(
      imageFolder,
      "temp-banner-image." + imageExtension
    );
    let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

    imageDataURI.outputFile(croppedImageDataURI, imagePath).then(() => {
      let image_file_size = fs.statSync(imagePath)["size"];
      if (image_file_size < 5 * 1024 * 1024) {
        tempGuidedCroppedBannerImagePath = imagePath;
        $("#guided-banner-image-modal").modal("hide");
        /*validateInputSet($("#guided-button-add-banner-image"));*/
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
                guidedSaveBannerImageWithTempName();
              }
            });
          } else {
            guidedSaveBannerImageWithTempName();
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
  $("#guided-next-button").on("click", async () => {
    //Get the ID of the current page to handle actions on page leave (next button pressed)
    pageBeingLeftID = CURRENT_PAGE.attr("id");
    //add a bootstrap loader to the next button
    $("#guided-next-button").addClass("loading");

    try {
      if (pageBeingLeftID === "guided-basic-description-tab") {
        let datasetName = document
          .getElementById("guided-dataset-name-input")
          .value.trim();
        let datasetSubtitle = document
          .getElementById("guided-dataset-subtitle-input")
          .value.trim();
        if (
          datasetName != "" &&
          datasetSubtitle != "" &&
          tempGuidedCroppedBannerImagePath != "" &&
          ($("#guided-curate-new-dataset-card").hasClass("checked") ||
            $("#guided-curate-existing-local-dataset-card").hasClass("checked"))
        ) {
          //If sodaJSONObj is empty, populate initial object properties
          if (Object.keys(sodaJSONObj).length === 0) {
            if ($("#guided-curate-new-dataset-card").hasClass("checked")) {
              guidedCreateSodaJSONObj();
              sodaJSONObj["starting-point"]["type"] = "new";
            }
            if (
              $("#guided-curate-existing-local-dataset-card").hasClass(
                "checked"
              )
            ) {
              guidedCreateSodaJSONObj();
              sodaJSONObj["starting-point"]["type"] = "local";
            }
          }

          if (sodaJSONObj["digital-metadata"]["pi-owner"] == undefined) {
            let user = await getUserInformation();
            const originalDatasetCreator = {
              userString: `${user["firstName"]} ${user["lastName"]} (${user["email"]})`,
              UUID: user["id"],
              name: `${user["firstName"]} ${user["lastName"]}`,
            };
            setGuidedDatasetPiOwner(originalDatasetCreator);
          }

          setGuidedDatasetName(datasetName);
          setGuidedDatasetSubtitle(datasetSubtitle);
          setGuidedBannerImage(tempGuidedCroppedBannerImagePath);
        } else {
          let basicDescriptionTabErrorMessage = [];
          if (datasetName == "") {
            basicDescriptionTabErrorMessage.push("Please enter a dataset name");
          }
          if (datasetSubtitle == "") {
            basicDescriptionTabErrorMessage.push(
              "Please enter a dataset subtitle"
            );
          }
          if (tempGuidedCroppedBannerImagePath == "") {
            basicDescriptionTabErrorMessage.push("Please add a banner image");
          }
          if (
            !$("#guided-curate-new-dataset-card").hasClass("checked") &&
            !$("#guided-curate-existing-local-dataset-card").hasClass("checked")
          ) {
            basicDescriptionTabErrorMessage.push(
              "Please select a dataset start location"
            );
          }
          throw basicDescriptionTabErrorMessage;
        }
      }
      if (pageBeingLeftID === "guided-subjects-folder-tab") {
        if ($("#guided-button-has-subjects").hasClass("selected")) {
          renderSamplesTables();
        } else {
          $("#guided-samples-folder-tab").attr("data-skip-page", "true");
        }
      }
      if (pageBeingLeftID === "guided-folder-importation-tab") {
      }
      if (pageBeingLeftID === "guided-designate-pi-owner-tab") {
      }
      if (pageBeingLeftID === "guided-designate-permissions-tab") {
      }
      if (pageBeingLeftID === "add-edit-description-tags-tab") {
        let studyPurpose = $("#guided-ds-description-study-purpose")
          .val()
          .trim();
        let dataCollection = $("#guided-ds-description-data-collection")
          .val()
          .trim();
        let primaryConclusion = $("#guided-ds-description-primary-conclusion")
          .val()
          .trim();
        sodaJSONObj["digital-metadata"]["study-purpose"] = studyPurpose;
        sodaJSONObj["digital-metadata"]["data-collection"] = dataCollection;
        sodaJSONObj["digital-metadata"]["primary-conclusion"] =
          primaryConclusion;
        $("#guided-textarea-create-readme").text(
          buildReadMeString(studyPurpose, dataCollection, primaryConclusion)
        );
        let datasetTags = getTagsFromTagifyElement(guidedDatasetTagsTagify);
        $(".guidedDatasetTags").text(datasetTags.join("\r\n"));
        sodaJSONObj["digital-metadata"]["dataset-tags"] = datasetTags;
      }
      if (pageBeingLeftID === "guided-designate-permissions-tab") {
      }
      if (pageBeingLeftID === "guided-assign-license-tab") {
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

        $("#guided-next-button").css("visibility", "hidden");
      }
      if (pageBeingLeftID === "add-edit-tags-tab") {
        const guidedTags = Array.from(guidedDatasetTagsTagify.getTagElms()).map(
          (tag) => {
            return tag.textContent;
          }
        );
        sodaJSONObj["digital-metadata"]["tags"] = guidedTags;
        guidedTags.length > 0
          ? enableProgressButton()
          : disableProgressButton();
      }
      if (pageBeingLeftID === "guided-create-submission-metadata-tab") {
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
          if (nextPage.data("skip-page")) {
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
          return nextPage;
        }
      };

      //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
      //if more tabs in parent tab, go to next tab and update capsule
      let targetPage = getNextPageNotSkipped(CURRENT_PAGE);
      let targetPageID = targetPage.attr("id");

      traverseToTab(targetPageID);
    } catch (error) {
      //check to see if the type of error is array
      if (Array.isArray(error)) {
        errorArray.map((error) => {
          notyf.open({
            duration: "5000",
            type: "error",
            message: error,
          });
        });
      } else {
        console.log("error: ", error);
      }
    }
    $("#guided-next-button").removeClass("loading");
  });

  //back button click handler
  $("#guided-back-button").on("click", () => {
    pageBeingLeftID = CURRENT_PAGE.attr("id");

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
        if (prevPage.data("skip-page")) {
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
        console.log("back to prev parent tab");
        prevPage = startingPage
          .parent()
          .prev()
          .children(".guided--panel")
          .last();
        if (prevPage.data("skip-page")) {
          console.log("recursive back");
          return getPrevPageNotSkipped(prevPage);
        } else {
          console.log("regular back");
          //element is valid and not to be skipped
          return prevPage;
        }
      }
    };
    let targetPage = getPrevPageNotSkipped(CURRENT_PAGE);
    let targetPageID = targetPage.attr("id");
    traverseToTab(targetPageID);
  });

  //tagify initializations
  var guidedSubmissionTagsInput = document.getElementById(
    "guided-tagify-submission-milestone-tags"
  );
  guidedSubmissionTagsTagify = new Tagify(guidedSubmissionTagsInput, {
    duplicates: false,
    delimiters: null,
    dropdown: {
      classname: "color-blue",
      maxItems: Infinity,
      enabled: 0,
      closeOnSelect: true,
    },
  }); /*
  const guidedDatasetKeywordsInput =
    document.getElementById("guided-ds-keywords");
  const guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeywordsInput, {
    duplicates: false,
  });*/
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
            console.log(val);
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
              var appendString = "";
              appendString =
                appendString +
                '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
                newFolderName +
                "</div></div>";
              $(appendString).appendTo("#items");

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

              listItems(myPath, "#items");
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
          validateCreateSubmissionMetadata();
        }
      });
    }
  });
  const validateCreateSubmissionMetadata = () => {
    if (
      $("#guided-submission-sparc-award").val().trim().length === 0 ||
      guidedSubmissionTagsTagify.getTagElms().length === 0 ||
      $("#guided-submission-completion-date").children().length <= 2
    ) {
      disableProgressButton();
    } else {
      enableProgressButton();
    }
  };

  $(".guided-award-and-milestone-information").change(function () {
    validateCreateSubmissionMetadata();
  });
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
