// JSON object of all the tabs

var allParentStepsJSON = {
  'getting-started':'getting-started-tab',
  'high-level-folders':'high-level-folders-tab',
  'organize-dataset': 'organize-dataset-tab',
  'metadata-files': 'metadata-files-tab',
  'generate-dataset': 'generate-dataset-tab'
}

var currentTab = 0; // Current tab is set to be the first tab (0)
showParentTab(0)

//// change between tabs (steps) in the UI for the Curate feature
function changeMainContent(currentMain, nextMain) {
  $('#'+ currentMain).toggleClass('show');
  $('#'+ nextMain).toggleClass('show');
}

function showParentTab(n) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  document.getElementById("nextBtn").disabled = false;

  // // update JSON structure
  // updateOverallJSONStructure(x[currentTab].id)

  $(x[n]).addClass('tab-active');
  var inActiveTabArray = [0,1,2,3,4].filter( function( element ) {
  return ![n].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass('tab-active');
  }

  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("nextBtn").innerHTML = "Next";
  } else if (n == 1){
    document.getElementById("nextBtn").innerHTML = "Confirm";
    document.getElementById("nextBtn").disabled = true;
    checkHighLevelFoldersInput();
    highLevelFoldersDisableOptions();
} else {
    document.getElementById("prevBtn").style.display = "inline";
    document.getElementById("nextBtn").style.display = "inline";
    document.getElementById("nextBtn").innerHTML = "Next";
  }

  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
  }
  fixStepIndicator(n)
  fixStepDone(n-1)

}

function checkHighLevelFoldersInput() {
  var optionCards = document.getElementsByClassName("option-card");
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
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("parent-tabs");

  // update JSON structure
  updateOverallJSONStructure(x[currentTab].id)

  // Hide the current tab:
  $(x[currentTab]).removeClass('tab-active');

  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;

  // if we have reached the end of the form... :
  if (currentTab >= x.length) {
    console.log("submit");
  }
  // Otherwise, display the correct tab:
  if (currentTab === 1) {
    highLevelFoldersDisableOptions()
  }
  showParentTab(currentTab);
}

function fixStepIndicator(n) {
  // This function removes the "current" class of all steps...
  var i, x = document.getElementsByClassName("progress-li");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" is-current", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " is-current";
}

function fixStepDone(n) {
  var x = document.getElementsByClassName("progress-li");
  $(x[n]).addClass('is-done')
}

//
// // High level folders check mark effect
$(".option-card").click(function() {
  // $(this).toggleClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[1].children[0].checked = true
  } else {
    $(this).children()[0].children[1].children[0].checked = false
  }
  checkHighLevelFoldersInput()
})

$(".folder-input-check").click(function() {
  var highLevelFolderCard = $(this).parents()[2];
  $(highLevelFolderCard).toggleClass('checked')
  if ($(this).checked) {
    $(this).checked = false;
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
  var allowUnChooseOption = {};
  for (var folder in highLevelFolderOptions) {
    if (
      JSON.stringify(datasetStructureJSONObj["folders"][folder]["files"]) === "{}" &&
     JSON.stringify(datasetStructureJSONObj["folders"][folder]["folders"]) === "{}"
   ) {
     allowUnChooseOption[folder] = true
   } else {
     allowUnChooseOption[folder] = false
   }
  }
  Object.keys(allowUnChooseOption).forEach((element) => {
    if (!allowUnChooseOption[element]) {
      var optionCard = $("#"+element+"-check").parents()[2];
      $(optionCard).addClass('disabled');
    }
  })
}

function updateOverallJSONStructure(id) {
  if (id === allParentStepsJSON["high-level-folders"]) {
    var optionCards = document.getElementsByClassName("option-card");
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
  }
}
