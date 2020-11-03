var currentTab = 0; // Current tab is set to be the first tab (0)
// showTab(currentTab); // Display the current tab

//// change between tabs (steps) in the UI for the Curate feature
function changeMainContent(currentMain, nextMain) {
  $('#'+ currentMain).toggleClass('show');
  $('#'+ nextMain).toggleClass('show');
}

function onClickTabs(currentTab, siblingTabs, liItem) {
  siblingTabs.forEach(item => $('#'+item).removeClass('tab-active'));
  $('#'+ currentTab).addClass('tab-active');
  $(".progress-li").removeClass('is-current');
  $(liItem).toggleClass('is-current');
}

function showParentTab(n) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  document.getElementById("nextBtn").disabled = false;

  $(x[n]).addClass('tab-active');
  var inActiveTabArray = [0,1,2,3,4].filter( function( element ) {
  return ![n].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass('tab-active');
  }

  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else if (n == 1){
    document.getElementById("nextBtn").innerHTML = "Confirm";
    document.getElementById("nextBtn").disabled = true;
    checkHighLevelFoldersInput()
} else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
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
  // Hide the current tab:
  $(x[currentTab]).removeClass('tab-active');
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;
  // if you have reached the end of the form... :
  if (currentTab >= x.length) {
    //...the form gets submitted:
    console.log("submit");
    return false;
  }
  // Otherwise, display the correct tab:
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

// check which prev next button it currently is
function checkPrevNextButton(button) {
  if (button.innerHTML === "Confirm") {

  }
}
