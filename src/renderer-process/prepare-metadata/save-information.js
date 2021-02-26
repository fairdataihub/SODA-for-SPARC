function showDSInfo() {
  document.getElementById("div-ds-dataset-info").style.display = "block";
  document.getElementById("div-ds-award-info").style.display = "none";
  document.getElementById("div-ds-contributor-info").style.display = "none";
  document.getElementById("div-ds-misc-info").style.display = "none";
  document.getElementById("div-ds-optional-info").style.display = "none";
}
function showAwardInfo() {
  document.getElementById("div-ds-dataset-info").style.display = "none";
  document.getElementById("div-ds-award-info").style.display = "block";
  document.getElementById("div-ds-contributor-info").style.display = "none";
  document.getElementById("div-ds-misc-info").style.display = "none";
  document.getElementById("div-ds-optional-info").style.display = "none";
}
function showContributorInfo() {
  document.getElementById("div-ds-dataset-info").style.display = "none";
  document.getElementById("div-ds-award-info").style.display = "none";
  document.getElementById("div-ds-contributor-info").style.display = "block";
  document.getElementById("div-ds-misc-info").style.display = "none";
  document.getElementById("div-ds-optional-info").style.display = "none";
}
function showMiscInfo() {
  document.getElementById("div-ds-dataset-info").style.display = "none";
  document.getElementById("div-ds-award-info").style.display = "none";
  document.getElementById("div-ds-contributor-info").style.display = "none";
  document.getElementById("div-ds-misc-info").style.display = "block";
  document.getElementById("div-ds-optional-info").style.display = "none";
}
function showOptionalInfo() {
  document.getElementById("div-ds-dataset-info").style.display = "none";
  document.getElementById("div-ds-award-info").style.display = "none";
  document.getElementById("div-ds-contributor-info").style.display = "none";
  document.getElementById("div-ds-misc-info").style.display = "none";
  document.getElementById("div-ds-optional-info").style.display = "block";
}

var domStrings = {
  dataset: [
    document.getElementById("ds-name"),
    document.getElementById("ds-description"),
    document.getElementById("ds-keywords"),
    document.getElementById("ds-samples-no"),
    document.getElementById("ds-subjects-no"),
  ],
  optional: [
    document.getElementById("input-completeness"),
    document.getElementById("input-parent-ds"),
    document.getElementById("input-completeds-title"),
  ],
};
//// check if all fields have been filled
function checkFields(div, fieldArray) {
  var fieldSatisfied = true;
  for (let field of fieldArray) {
    if (field) {
      if (field.value.length === 0 || field.value === "Select") {
        fieldSatisfied = false;
      }
    }
  }
  if (fieldSatisfied) {
    document.getElementById(div).className =
      "multisteps-form__progress-btn js-active2";
  }
}

/// check if at least one contributor is added
function checkFieldsContributors() {
  var div = "ds-contributor-info";
  var dsAwardArray = document.getElementById("ds-description-award-list");
  var award = dsAwardArray.options[dsAwardArray.selectedIndex].value;
  var tableCurrentCon = document.getElementById("table-current-contributors");
  var fieldSatisfied = true;
  var contactPersonExists = false;
  /// check for empty award
  if (award.value === "Select") {
    fieldSatisfied = false;
  }
  for (var i = 0; i < tableCurrentCon.rows.length; i++) {
    if (tableCurrentCon.rows[i].cells[4].innerHTML === "Yes") {
      contactPersonExists = true;
      break;
    }
  }
  if (
    fieldSatisfied &&
    contactPersonExists &&
    tableCurrentCon.rows.length > 1
  ) {
    document.getElementById(div).className =
      "multisteps-form__progress-btn js-active2";
  }
}

// /// check if other info section is all populated
function checkOtherInfoFields() {
  var div = "ds-misc-info";
  var tableCurrentLinks = document.getElementById("doi-table");
  var fieldSatisfied = false;
  for (var i = 1; i < tableCurrentLinks.rows.length; i++) {
    if (
      tableCurrentLinks.rows[i].cells[0].innerHTML === "Protocol URL or DOI*"
    ) {
      fieldSatisfied = true;
    }
  }
  if (fieldSatisfied) {
    document.getElementById(div).className =
      "multisteps-form__progress-btn js-active2";
  } else {
    document.getElementById(div).className = "multisteps-form__progress-btn";
  }
}

$(document).ready(function() {
  document.getElementById("ds-dataset-info").addEventListener("click", () => {
    showDSInfo();
    $('.multisteps-form__progress-btn').removeClass("js-active1");
    document.getElementById("ds-dataset-info").classList.add("js-active1");
  });
  document.getElementById("ds-award-info").addEventListener("click", () => {
    showAwardInfo();
    $('.multisteps-form__progress-btn').removeClass("js-active1");
    document.getElementById("ds-award-info").classList.add("js-active1");
  });
  //
  document.getElementById("ds-contributor-info").addEventListener("click", () => {
    showContributorInfo();
    $('.multisteps-form__progress-btn').removeClass("js-active1");
    $("#ds-contributor-info").addClass("js-active1");
  });
  document.getElementById("ds-misc-info").addEventListener("click", () => {
    showMiscInfo();
    $('.multisteps-form__progress-btn').removeClass("js-active1");
    $("#ds-misc-info").addClass("js-active1");
  });
  document.getElementById("ds-optional-info").addEventListener("click", () => {
    showOptionalInfo();
    $('.multisteps-form__progress-btn').removeClass("js-active1");
    $("#ds-optional-info").addClass("js-active1");
  });

  ///prev buttons
  document
  .getElementById("button-prev-contributor-award")
  .addEventListener("click", () => {
    document.getElementById("ds-dataset-info").click();
    checkFieldsContributors();
  });
  document
  .getElementById("button-prev-award-ds")
  .addEventListener("click", () => {
    document.getElementById("ds-dataset-info").click();
    checkFieldsContributors();
  });
  document
  .getElementById("button-prev-misc-contributor")
  .addEventListener("click", () => {
    document.getElementById("ds-contributor-info").click();
    checkOtherInfoFields();
  });
  document
  .getElementById("button-prev-optional-misc")
  .addEventListener("click", () => {
    document.getElementById("ds-misc-info").click();
    checkFields("ds-optional-info", domStrings.optional);
  });

  //next buttons
  document
  .getElementById("button-next-ds-award")
  .addEventListener("click", () => {
    document.getElementById("ds-award-info").click();
    checkFields("ds-dataset-info", domStrings.dataset);
  });
  document
  .getElementById("button-next-award-contributor")
  .addEventListener("click", () => {
    document.getElementById("ds-contributor-info").click();
    checkFields("ds-dataset-info", domStrings.dataset);
  });
  document
  .getElementById("button-next-contributor-misc")
  .addEventListener("click", () => {
    document.getElementById("ds-misc-info").click();
    checkFieldsContributors();
  });
  document
  .getElementById("button-next-misc-optional")
  .addEventListener("click", () => {
    document.getElementById("ds-optional-info").click();
    checkOtherInfoFields();
  });
})
