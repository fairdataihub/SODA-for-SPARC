// const path = require('path')

// JSON object of all the tabs

var allParentStepsJSON = {
  'getting-started':'getting-started-tab',
  'high-level-folders':'high-level-folders-tab',
  'organize-dataset': 'organize-dataset-tab',
  'metadata-files': 'metadata-files-tab',
  'manifest-file': 'manifest-file-tab',
  'generate-dataset': 'generate-dataset-tab'
}

var currentTab = 0; // Current tab is set to be the first tab (0)
showParentTab(0, 1)

function showParentTab(tabNow, nextOrPrev) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  fixStepIndicator(tabNow)
  fixStepDone(tabNow-1)

  $(x[tabNow]).addClass('tab-active');

  var inActiveTabArray = [0,1,2,3,4,5].filter( function( element ) {
  return ![tabNow].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass('tab-active');
  }

  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  document.getElementById("nextBtn").innerHTML = "Continue";

  if (tabNow == 0) {
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("nextBtn").disabled = true;

  } else if (tabNow == 1){
    document.getElementById("nextBtn").disabled = true;
    checkHighLevelFoldersInput();
    highLevelFoldersDisableOptions();
} else {
    document.getElementById("nextBtn").disabled = false;
}

  if (tabNow == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
  }

  if (nextOrPrev === -1) {
    document.getElementById("nextBtn").disabled = false;
  }
}

function checkHighLevelFoldersInput() {
  var optionCards = document.getElementsByClassName("option-card high-level-folders");
  var checked = false;
  for (var card of optionCards) {
    if ($(card).hasClass('checked')) {
      checked = true;
      break
    }
  }
  if (checked) {
    document.getElementById("nextBtn").disabled = false;
  } else {
    document.getElementById("nextBtn").disabled = true;
  }
  return checked
}

function nextPrev(n) {
  var x = document.getElementsByClassName("parent-tabs");

  // update JSON structure
  updateOverallJSONStructure(x[currentTab].id)

  // Hide the current tab:
  $(x[currentTab]).removeClass('tab-active');

  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;

  // if we have reached the end of the form... :
  if (currentTab >= x.length-1) {
    // checkJSONObjGenerate()
  }

  // Otherwise, display the correct tab:
  if (currentTab === 1 || currentTab === 2 || currentTab === 3) {
    highLevelFoldersDisableOptions()
  }
  showParentTab(currentTab, n);
  // document.getElementById("nextBtn").disabled = false;
}

function fixStepIndicator(n) {
  // This function removes the "is-current" class of all steps...
  var i, x = document.getElementsByClassName("not-me");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" is-current", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " is-current";
}

function fixStepDone(n) {
  var x = document.getElementsByClassName("not-me");
  $(x[n]).addClass('done');
}

//
// // High level folders check mark effect
$(".option-card.high-level-folders").click(function() {
  $(this).toggleClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[1].children[0].checked = true
  } else {
    $(this).children()[0].children[1].children[0].checked  = false
  }
  checkHighLevelFoldersInput()
})

// Other radio buttons check mark effect
$(".option-card.radio-button").click(function() {
  $(this).removeClass('non-selected');
  $(this).addClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[0].children[0].checked = true;
    $(this).removeClass('non-selected')
  } else {
    $(this).children()[0].children[0].children[0].checked = false;
    $(this).addClass('non-selected')
  }
  $(this).css('pointer-events', 'none');
})

$(".folder-input-check").click(function() {
  var parentCard = $(this).parents()[2];
  $(parentCard).toggleClass('checked')
  if ($(this).checked) {
    $(this).checked = false;
    $(parentCard).removeClass('non-selected')
  } else {
      $(this).checked = true;
  }
  checkHighLevelFoldersInput()
})


function showSubTab(section, tab, input){
  var tabArray;
  if (section === "metadata") {
    tabArray = ["div-submission-metadata-file", "div-dataset-description-metadata-file", "div-subjects-metadata-file",
                "div-samples-metadata-file", "div-changes-metadata-file", "div-readme-metadata-file",
                "div-manifest-metadata-file"]
  }
  var inActiveTabArray = tabArray.filter( function( element ) {
  return ![tab].includes(element);
  });
  for (var id of inActiveTabArray) {
    document.getElementById(id).style.display = "none";
  }
  document.getElementById(input).checked = true;
  document.getElementById(tab).style.display = "block";
}

// function to check if certain high level folders already chosen and have files/sub-folders
// then disable the option (users cannot un-choose)

function highLevelFoldersDisableOptions() {
  var highLevelFolderOptions = datasetStructureJSONObj["folders"];
  for (var folder of highLevelFolders) {
    if (Object.keys(highLevelFolderOptions).includes(folder)) {
      var optionCard = $("#"+folder+"-check").parents()[2];
      $(optionCard).addClass('disabled');
    } else {
      var optionCard = $("#"+folder+"-check").parents()[2];
      $(optionCard).removeClass('disabled');
      $(optionCard).removeClass('checked');
      $(optionCard).children()[0].children[1].children[0].checked = false
    }
  }
}

function updateOverallJSONStructure(id) {
  if (id === allParentStepsJSON["high-level-folders"]) {
    document.getElementById('input-global-path').value = "Mydatasetfolder/"
    var optionCards = document.getElementsByClassName("option-card high-level-folders");
    var newDatasetStructureJSONObj = {"folders": {}};
    var keys = [];
    for (var card of optionCards) {
      if ($(card).hasClass('checked')) {
        keys.push($(card).children()[0].innerText)
      }
    }
    keys.forEach((folder) => {
      if (Object.keys(datasetStructureJSONObj["folders"]).includes(folder)) {
        // clone a new json object
        newDatasetStructureJSONObj["folders"][folder] = datasetStructureJSONObj["folders"][folder];
      } else {
        newDatasetStructureJSONObj["folders"][folder] = {"folders": {}, "files": {}, "type":""}
      }
    })
    datasetStructureJSONObj = newDatasetStructureJSONObj;
    listItems(datasetStructureJSONObj, '#items')
    getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
  } else if (id === allParentStepsJSON["getting-started"]) {
      updateJSONStructureGettingStarted();
  } else if (id === allParentStepsJSON["metadata-files"]) {
    updateJSONStructureMetadataFiles()
  } else if (id === allParentStepsJSON["manifest-file"]) {
    updateJSONStructureManifest()
  } else if (id === allParentStepsJSON["organize-dataset"]) {
    updateJSONStructureDSstructure()
  }
}


// // High level folders check mark effect

$(".folder-input-check").click(function() {
  var highLevelFolderCard = $(this).parents()[2];
  $(highLevelFolderCard).toggleClass('checked')
  if ($(this).checked) {
    $(this).checked = false;
  } else {
      $(this).checked = true;
  }
})


// ////////////// THIS IS FOR THE SUB-TABS OF GETTING STARTED and GENERATE DATASET sections /////////////////////////
function transitionQuestions(ev, category, id) {

  // var buttons = document.getElementsByClassName('question-buttons');
  var individualQuestions = document.getElementsByClassName('individual-question');
  var target = ev.getAttribute('data-next');
  var height;

  if ($($(ev).parents()[5]).hasClass("previous")) {


    for (var j = 0; j < individualQuestions.length; j++) {

      var question = individualQuestions[j];

      if (! (question === $(ev).parents()[5])) {
        // $(question).removeClass('show');
        $(question).removeClass('previous');
      }
    }
    document.getElementById(target).className = document.getElementById(target).className + ' show'
  } else {
    for (var j = 0; j < individualQuestions.length; j++) {

      var question = individualQuestions[j];

      if (question.id === target) {
        if (j>0) {
          previousQuestion = individualQuestions[j-1]
          previousQuestion.classList.add("previous");
          if (j == 2) {
            height = -30*j - 10;
          } else {
            height = -30*j + 10;
          }
          $(previousQuestion).css("transform", "translateY("+height+"px)");
          $(previousQuestion).css("transtition", "transform 0.4s ease-out");
        }

        question.classList.add("show");
        $(question).css("transform", "translateY(-45%)");
        $(question).css("transtition", "transform 0.4s ease-out");

        if (category==='dropdown') {
          var selectEle = document.getElementById(id);
          var answer = selectEle.options[selectEle.selectedIndex].text;
          $(ev).hide()
        }
      } else {
        question.classList.remove("show");
      }

      if (target === "") {
        document.getElementById("nextBtn").disabled = false;
        $(ev).hide()
        previousQuestion = $(ev).parents()[1];
        previousQuestion.classList.add("previous");
        height = -30*j + 10;
        $(previousQuestion).css("transform", "translateY(-80%)");
        $(previousQuestion).css("transtition", "transform 0.4s ease-out");

        break
      }
    }
  }
}


var divList = [];

function transitionSubQuestions(ev, currentDiv, parentDiv, button, category){

  document.getElementById("nextBtn").disabled = true;
  $(ev).removeClass('non-selected');
  $(ev).children().find('.folder-input-check').prop('checked', true);

  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').removeClass('checked');
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').css('pointer-events', 'auto');
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').addClass('non-selected');

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute('data-next'));

  hidePrevDivs(currentDiv, category);

  target.className = target.className + ' show';

  // append to parentDiv
  document.getElementById(parentDiv).appendChild(target);
  setTimeout(()=> target.classList.add("test2"), 100);

  document.getElementById(currentDiv).classList.add("prev");
  // handle buttons (if buttons are confirm buttons -> delete after users confirm)
  if (button==='delete') {
    if ($(ev).siblings().length>0) {
      $(ev).siblings().hide()
    }
    $(ev).hide();
  }
  // auto-scroll to bottom of div
  document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;

  if (ev.getAttribute('data-next') === "Question-getting-started-final") {
    if ($(ev).children().find('.folder-input-check').prop('checked')) {
      document.getElementById('nextBtn').disabled = false;
      $("#nextBtn").click();
    } else {
      document.getElementById('nextBtn').disabled = true
    }
  }
}

function obtainDivsbyCategory(category) {
  var individualQuestions = document.getElementsByClassName('individual-question');
  var categoryQuestionList = [];

  for (var i = 0; i < individualQuestions.length; i++) {
    var question = individualQuestions[i];

    if (question.getAttribute('data-id') !== null) {
      if (question.getAttribute('data-id').includes(category)) {
        categoryQuestionList.push(question.id);
      }
    }
  }
  return categoryQuestionList
}

function hidePrevDivs(currentDiv, category) {

  var individualQuestions = document.getElementsByClassName(category);

  // hide all other siblings
  for (var i = 0; i < individualQuestions.length; i++) {
    if (currentDiv === individualQuestions[i].id) {
      $("#"+currentDiv).nextAll().removeClass("show");
      $("#"+currentDiv).nextAll().removeClass("prev");
      $("#"+currentDiv).nextAll().removeClass("test2");

      /// remove all checkmarks and previous data input
      $("#"+currentDiv).nextAll().find('.option-card.radio-button').removeClass('checked');
      $("#"+currentDiv).nextAll().find('.option-card.radio-button').css('pointer-events', 'auto');
      $("#"+currentDiv).nextAll().find('.option-card.radio-button').removeClass('non-selected');
      $("#"+currentDiv).nextAll().find('.folder-input-check').prop('checked', false);
      $("#"+currentDiv).nextAll().find('#curatebfdatasetlist').prop("selectedIndex", 0);

      var childElements2 = $("#"+currentDiv).nextAll().find('.form-control');

      for (var child of childElements2) {
         if (child.id === "inputNewNameDataset")  {
          document.getElementById(child.id).value = "";
          document.getElementById(child.id).placeholder = "Type here";
        } else {
          document.getElementById(child.id).value = "";
          document.getElementById(child.id).placeholder = "Browse here";
        }
      };
      // $("#"+currentDiv).nextAll().find('button').show();
      break
    }
  }
}


function updateJSONStructureGettingStarted() {

  document.getElementById('input-global-path').value = "Mydatasetfolder/"

  if ($('input[name="getting-started-1"]:checked')[0].id === "prepare-new") {
    sodaJSONObj["generate-dataset"] = {'path':'', 'destination':'', 'dataset-name': "", "if-existing": "", "generate-option": "new", "if-existing-files": ""}
  }
  //   var newDatasetName = $('#inputNewNameDataset').val().trim();
  //   sodaJSONObj["bf-account-selected"]["account-name"] = "";
  //   sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
  //   sodaJSONObj["generate-dataset"] = {'path':'', 'destination':'', 'dataset-name': newDatasetName, "if-existing": "", "generate-option": "new", "if-existing-files": ""}
  // } else if ($('input[name="getting-started-1"]:checked')[0].id === "previous-progress") {
  //
  // }

  // } else if ($('input[name="getting-started-1"]:checked')[0].id === "modify-existing") {
  //     if ($('input[name="getting-started-2"]:checked')[0].id === "existing-location") {
  //       var localPath = $('#location-new-dataset')[0].placeholder;
  //       sodaJSONObj["generate-dataset"]["path"] = localPath;
  //       sodaJSONObj["generate-dataset"]["dataset-name"] = path.basename(localPath);
  //       // populateOrganizeDatasetUI(sodaJSONObj['dataset-structure'], sodaJSONObj['generate-dataset']['path']);
  //
  //     } else if ($('input[name="getting-started-2"]:checked')[0].id === "existing-BF") {
  //       sodaJSONObj["bf-account-selected"]["account-name"] = $($('#bfallaccountlist').find('option:selected')[0]).val();
  //       sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $($('#curatebfdatasetlist').find('option:selected')[0]).val();
  //       sodaJSONObj["generate-dataset"]["destination"] = "bf";
  //     }
  // }
  // if (sodaJSONObj["generate-dataset"]["dataset-name"] !== "") {
  // if (document.getElementById('input-global-path').value === "/") {
    // document.getElementById('input-global-path').value = "Mydatasetfolder/"
  // }
  // }
}

function updateJSONStructureMetadataFiles() {
  var submissionFilePath = document.getElementById('para-submission-file-path').innerHTML;
  var dsDescriptionFilePath = document.getElementById('para-ds-description-file-path').innerHTML;
  var subjectsFilePath = document.getElementById('para-subjects-file-path').innerHTML;
  var samplesFilePath = document.getElementById('para-samples-file-path').innerHTML;
  var readmeFilePath = document.getElementById('para-readme-file-path').innerHTML;
  var changesFilePath = document.getElementById('para-changes-file-path').innerHTML;
  var invalidOptionsList = ["Please drag a file!", "Please only import SPARC metadata files!", ""];

  if (!(invalidOptionsList.includes(submissionFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(submissionFilePath)] = {"type": "local", "action": "new", "path": submissionFilePath, "destination": "generate-dataset"}
  }
  if (!(invalidOptionsList.includes(dsDescriptionFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(dsDescriptionFilePath)] = {"type": "local", "action": "new", "path": dsDescriptionFilePath, "destination": "generate-dataset"}
  }
  if (!(invalidOptionsList.includes(subjectsFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(subjectsFilePath)] = {"type": "local", "action": "new", "path": subjectsFilePath, "destination": "generate-dataset"}
  }
  if (!(invalidOptionsList.includes(samplesFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(samplesFilePath)] = {"type": "local", "action": "new", "path": samplesFilePath, "destination": "generate-dataset"}
  }
  if (!(invalidOptionsList.includes(readmeFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(readmeFilePath)] = {"type": "local", "action": "new", "path": readmeFilePath, "destination": "generate-dataset"}
  }
  if (!(invalidOptionsList.includes(changesFilePath))) {
    sodaJSONObj["metadata-files"][path.basename(changesFilePath)] = {"type": "local", "action": "new", "path": changesFilePath, "destination": "generate-dataset"}
  }
}

function updateJSONStructureManifest() {
  const manifestFileCheck = document.getElementById("generate-manifest-curate");
  if (manifestFileCheck.checked) {
    sodaJSONObj["manifest-files"] = {"destination": "generate-dataset"}
  } else {

  }
}

function checkJSONObjGenerate() {
  var optionShown = "";
  if (sodaJSONObj["generate-dataset"]["path"] === "" && sodaJSONObj["bf-account-selected"]["account-name"] === ""  && sodaJSONObj["bf-dataset-selected"]["dataset-name"] === "") {
    optionShown = "curate-new"
  } else if (sodaJSONObj["generate-dataset"]["path"] !== "") {
    optionShown = "modify-existing-local-dataset"
  } else if (sodaJSONObj["bf-account-selected"]["account-name"] !== "") {
    optionShown = "modify-existing-bf-dataset"
  }

 if (optionShown === "modify-existing-local-dataset") {
    document.getElementById("div-modify-current-local-dataset").style.display = "block";
    document.getElementById('Question-generate-dataset').classList.add('show');
    document.getElementById('modify-current-confirmation').innerHTML = "SODA will modify this dataset: <b style='color:var(--color-bg-plum)'>" +sodaJSONObj["generate-dataset"]["path"]+"</b>.<br>Please click the button below to confirm."
  } else if (optionShown === "modify-existing-bf-dataset") {
    document.getElementById('Question-generate-dataset').classList.remove('show');
    document.getElementById('Question-generate-dataset-bf-confirmation').classList.add('show');
    document.getElementById("generate-bf-confirmation").innerHTML = "SODA will modify this dataset: <b style='color:var(--color-bg-plum)'>" + sodaJSONObj["bf-dataset-selected"] + "</b><br>You specify this Blackfynn account: <b style='color:var(--color-bg-plum)'>" + sodaJSONObj["bf-account-selected"]["account-name"] + "</b>.<br> Please confirm by clicking the button below."
  } else {
    document.getElementById('Question-generate-dataset').classList.add('show');
  }
}


function populateOrganizeDatasetUI(currentLocation, datasetFolder) {

  var baseName = path.basename(datasetFolder)
  // currentLocation = currentLocation["folders"]

  currentLocation = {"type": "local", "folders": {}, "files": {}, 'action': ['existing']}

  var myitems = fs.readdirSync(datasetFolder)
  myitems.forEach(element => {
    var statsObj = fs.statSync(path.join(datasetFolder, element))
    var addedElement = path.join(datasetFolder, element)
    if (statsObj.isDirectory()) {
      currentLocation["folders"][element] = {"type": "local", "folders": {}, "files": {}, 'action': ['existing']}
      populateJSONObjFolder(jsonObject["folders"][element], addedElement)
    } else if (statsObj.isFile()) {
        currentLocation["files"][element] = {"path": addedElement, "description": "", "additional-metadata":"", "type": "local", 'action': ['existing']}
      }
      var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+element+'</div></div>'
      $('#items').html(appendString)

      listItems(currentLocation, '#items')
      getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  });
}

function updateJSONStructureGenerate() {
  if ($('input[name="generate-1"]:checked')[0].id === "generate-local-desktop") {
    var localDestination = $('#input-destination-generate-dataset-locally')[0].placeholder;
    var newDatasetName = $('#inputNewNameDataset').val().trim();
    sodaJSONObj["generate-dataset"] = {'destination': "local", 'path': localDestination, 'dataset-name': newDatasetName, "generate-option": "new", "if-existing": "new", "if-existing-files": ""}
    sodaJSONObj["bf-account-selected"]["account-name"] = "";
    sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";

  } else if ($('input[name="generate-1"]:checked')[0].id === "generate-upload-BF") {
    sodaJSONObj["generate-dataset"]['destination'] = "bf";
    sodaJSONObj["generate-dataset"]['path'] = "";
    sodaJSONObj["bf-account-selected"]["account-name"] = $($('#bfallaccountlist').find('option:selected')[0]).val();

    if ($('input[name="generate-4"]:checked')[0].id === "generate-BF-dataset-options-existing") {
      if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-duplicate") {
        sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
      } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-replace") {
        sodaJSONObj["generate-dataset"]["if-existing"] = "replace";
      } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-merge") {
        sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
      } else if ($('input[name="generate-5"]:checked')[0].id === "existing-folders-skip") {
        sodaJSONObj["generate-dataset"]["if-existing"] = "skip";
      }
      if ($('input[name="generate-6"]:checked')[0].id === "existing-files-duplicate") {
        sodaJSONObj["generate-dataset"]["if-existing-files"] = "create-duplicate";
      } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-replace") {
        sodaJSONObj["generate-dataset"]["if-existing-files"] = "replace";
      } else if ($('input[name="generate-6"]:checked')[0].id === "existing-files-skip") {
        sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
      }
      sodaJSONObj["generate-dataset"]["dataset-name"] = "";
      sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $($('#curatebfdatasetlist').find('option:selected')[0]).val();
    } else if ($('input[name="generate-4"]:checked')[0].id === "generate-BF-dataset-options-new") {
      var newDatasetName = $('#inputNewNameDataset').val().trim();
      sodaJSONObj["generate-dataset"]['dataset-name'] = newDatasetName;
      sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
      sodaJSONObj["generate-dataset"]["if-existing-files"] = "create-duplicate";
    }
  }
}

function deleteEmptyKeysFromObject(object) {
  for (var key in object) {
    if (object[key] === null || object[key] === undefined || object[key] === "" || JSON.stringify(object[key]) === "{}") {
      delete object[key];
    }
  }
}

function updateJSONStructureDSstructure() {
  sodaJSONObj["dataset-structure"] = datasetStructureJSONObj
}

// function exitOrganizeSection() {
//   bootbox.confirm({
//     title: "Exit section",
//     message: "<p>Are you sure you want to exit the current section and clear the current file organization?</p>",
//     centerVertical: true,
//     callback: function(r) {
//       if (r!==null) {
//         bootbox.confirm({
//           title: "Exit section",
//           message: "<p>Would you like to save your progress?</p>",
//           centerVertical: true,
//           callback: function(result) {
//             if (result!==null) {
//
//             }
//       }
// }
//
// function saveOrganizeProgress() {
//
// }
