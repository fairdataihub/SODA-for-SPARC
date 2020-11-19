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

// //// change between tabs (steps) in the UI for the Curate feature
// function changeMainContent(currentMain, nextMain) {
//   $('#'+ currentMain).toggleClass('show');
//   $('#'+ nextMain).toggleClass('show');
// }


function showParentTab(n) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  fixStepIndicator(n)
  fixStepDone(n-1)

  $(x[n]).addClass('tab-active');
  var inActiveTabArray = [0,1,2,3,4].filter( function( element ) {
  return ![n].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass('tab-active');
  }
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  document.getElementById("nextBtn").innerHTML = "Continue";

  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("nextBtn").disabled = true;

  } else if (n == 1){
    document.getElementById("nextBtn").disabled = true;
    checkHighLevelFoldersInput();
    highLevelFoldersDisableOptions();
} else {
    document.getElementById("nextBtn").disabled = false;
}

  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
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
  document.getElementById("nextBtn").disabled = false;
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
  $(this).toggleClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[0].children[0].checked = true
  } else {
    $(this).children()[0].children[0].children[0].checked = false
  }
})

$(".folder-input-check").click(function() {
  var parentCard = $(this).parents()[2];
  $(parentCard).toggleClass('checked')
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

  // $("#"+currentDiv).children().find('.folder-input-check')
  // ($(ev).find('.folder-input-check')[0]).id

  document.getElementById("nextBtn").disabled = true;
  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').removeClass('checked');
  // $("#"+currentDiv).children().find('.folder-input-check')).prop('checked', false);
   $(ev).children().find('.folder-input-check').prop('checked', true);

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
    $(ev).hide();
  }
  // auto-scroll to bottom of div
  document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;

  if (ev.getAttribute('data-next') === "Question-getting-started-final") {
    document.getElementById("nextBtn").disabled = false;
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
      $("#"+currentDiv).nextAll().find('.folder-input-check').prop('checked', false);
      var childElements2 = $("#"+currentDiv).nextAll().find('.form-control');
      for (var child of childElements2) {
        document.getElementById(child.id).value = "";
      };
      $("#"+currentDiv).nextAll().find('button').show();

      break
    }
  }
}

$(".metadata-button").click(function() {
  $(".div-organize-generate-dataset.metadata").addClass('hide');
  var target = $(this).attr('data-next');
  $("#"+target).toggleClass('show');
})

$(".button-individual-metadata").click(function() {
  $($(this).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
})

$(".button-individual-metadata.cancel").click(function() {
  $($(this).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
})
