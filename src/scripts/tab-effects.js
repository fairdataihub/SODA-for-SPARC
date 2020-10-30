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

function showTab(n) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("sub-tabs");
  $(x[n]).addClass('tab-active');
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").innerHTML = "Submit";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  fixStepIndicator(n)
  fixStepDone(n-1)
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("sub-tabs");
  // if (n == 1 && !validateForm()) return false;
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
  showTab(currentTab);
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
