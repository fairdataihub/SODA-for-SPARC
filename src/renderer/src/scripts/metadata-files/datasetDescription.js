import Swal from "sweetalert2";
import { Destinations } from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import client from "../client";
import kombuchaEnums from "../analytics/analytics-enums";
import createEventDataPrepareMetadata from "../analytics/prepare-metadata-analytics";
import api from "../others/api/api";
import Tagify from "@yaireo/tagify/dist/tagify.esm.js";
import tippy from "tippy.js";
import doiRegex from "doi-regex";
import validator from "validator";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// opendropdown event listeners
document.querySelectorAll(".dd-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    window.openDropdownPrompt(null, "ps");
  });
});

document.querySelectorAll(".dd-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    window.openDropdownPrompt(element, "dataset");
  });
});

// Prepare Dataset Description File

window.currentContributorsLastNames = [];

window.globalContributorNameObject = {};

var ddDestinationPath = "";

$(document).ready(function () {
  window.electron.ipcRenderer.on("show-missing-items-ds-description", (event, index) => {
    if (index === 0) {
      window.electron.ipcRenderer.send(
        "open-folder-dialog-save-ds-description",
        "dataset_description.xlsx"
      );
    }
  });

  // generate dd file
  window.electron.ipcRenderer.on("selected-destination-generate-dd-locally", (event, dirpath) => {
    if (dirpath.length > 0) {
      document.getElementById("input-destination-generate-dd-locally").placeholder = dirpath[0];
      let destinationPath = window.path.join(dirpath[0], "dataset_description.xlsx");
      ddDestinationPath = destinationPath;
      $("#div-confirm-destination-dd-locally").css("display", "flex");
      $($("#div-confirm-destination-dd-locally").children()[0]).css("display", "flex");
    } else {
      document.getElementById("input-destination-generate-dd-locally").placeholder = "Browse here";
      $("#div-confirm-destination-dd-locally").css("display", "none");
    }
  });

  $(".prepare-dd-cards").click(function () {
    $("create_dataset_description-tab").removeClass("show");
    let target = $(this).attr("data-next");
    $("#" + target).toggleClass("show");
    document.getElementById("prevBtn").style.display = "none";
  });

  $("#bf_dataset_load_dd").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-dd-2").hasClass("show") &&
      !$("#Question-prepare-dd-6").hasClass("show")
    ) {
      $("#Question-prepare-dd-2").removeClass("show");
    }
    if ($("#bf_dataset_load_dd").text().trim() !== "None") {
      $("#div-check-ps-import-dd").css("display", "flex");
      $($("#div-check-ps-import-dd").children()[0]).show();
    } else {
      $("#div-check-ps-import-dd").css("display", "none");
    }
  });

  $("#bf_dataset_generate_dd").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_dd").text().trim() !== "None") {
      $("#div-check-ps-generate-dd").css("display", "flex");
    } else {
      $("#div-check-ps-generate-dd").css("display", "none");
    }
  });
});

/* The below function is needed because
  when users add a row and then delete it, the ID for such row is deleted (row-name-2),
  but the row count for the table (used for naming row ID) is changed and that messes up the naming and ID retrieval process
*/
window.checkForUniqueRowID = (rowID, no) => {
  if ($("#" + rowID + no.toString()).length == 0) {
    return no;
  } else {
    no = no + 1;
    return window.checkForUniqueRowID(rowID, no);
  }
};

// resetting the dataset_description file

window.showExistingDDFile = () => {
  if (
    $("#existing-dd-file-destination").prop("placeholder") !== "Browse here" &&
    $("#Question-prepare-dd-2").hasClass("show")
  ) {
    Swal.fire({
      title: "Are you sure you want to import a different dataset_description file?",
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: window.reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        window.electron.ipcRenderer.send("open-file-dialog-existing-DD");
        document.getElementById("existing-dd-file-destination").placeholder = "Browse here";
        $("#div-confirm-existing-dd-import").hide();
        $($("#div-confirm-existing-dd-import button")[0]).hide();
        $("#Question-prepare-dd-2").removeClass("show");
      }
    });
  } else {
    window.electron.ipcRenderer.send("open-file-dialog-existing-DD");
  }
};

/////////////// Generate ds description file ///////////////////
////////////////////////////////////////////////////////////////
window.generateDatasetDescription = async () => {
  var funding = $("#ds-description-award-input").val().trim();
  var allFieldsSatisfied = window.detectEmptyRequiredFields(funding)[0];
  var errorMessage = window.detectEmptyRequiredFields(funding)[1];

  /// raise a warning if empty required fields are found
  if (allFieldsSatisfied === false) {
    var textErrorMessage = "";
    for (var i = 0; i < errorMessage.length; i++) {
      textErrorMessage += errorMessage[i] + "<br>";
    }
    var messageMissingFields = `<div>The following mandatory item(s) is/are missing:<br> ${textErrorMessage} <br>Would you still like to generate the dataset description file?</div>`;
    var { value: continueProgressGenerateDD } = await Swal.fire({
      icon: "warning",
      html: messageMissingFields,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
    if (continueProgressGenerateDD) {
      $("#dd-accordion").removeClass("active");
      $("#dd-accordion").find(".title").removeClass("active");
      $("#dd-accordion").find(".content").removeClass("active");
      return true;
    } else {
      return false;
    }
  } else {
    $("#dd-accordion").removeClass("active");
    $("#dd-accordion").find(".title").removeClass("active");
    $("#dd-accordion").find(".content").removeClass("active");
    return true;
  }
};

window.generateDDFile = async (uploadBFBoolean) => {
  let bfaccountname = window.defaultBfAccount;
  let bf_dataset = document.getElementById("bf_dataset_load_dd").innerText.trim();
  if (uploadBFBoolean) {
    /// get current, selected Pennsieve account

    // Run pre-flight checks before uploading the dataset_description file to Pennsieve
    const supplementary_checks = await window.run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(bf_dataset);
    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${bf_dataset} is locked from editing`,
        html: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a  target="_blank" href="mailto:curation@sparc.science">curation@sparc.science.</a>
            `,
        width: 600,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        focusConfirm: true,
        allowOutsideClick: false,
      });

      return;
    }

    // Check if the dataset is locked before uploading

    let { value: continueProgress } = await Swal.fire({
      title:
        "Any existing dataset_description.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
  } else {
    let { value: continueProgress } = await Swal.fire({
      title:
        "Any existing dataset_description.xlsx file in the specified location will be replaced.",
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
  }
  Swal.fire({
    title: "Generating the dataset_description.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then(() => {});
  var datasetInfoValueObj = window.grabDSInfoEntries();
  var studyInfoValueObject = grabStudyInfoEntries();
  //// grab entries from contributor info section and pass values to conSectionArray
  var contributorObj = grabConInfoEntries();
  // grab related information (protocols and additional links)
  var relatedInfoArr = combineLinksSections();
  //// process obtained values to pass to an array ///
  ///////////////////////////////////////////////////

  // process multiple Study info tagify values - keywords
  var keywordVal = [];
  for (let i = 0; i < datasetInfoValueObj["keywords"].length; i++) {
    keywordVal.push(datasetInfoValueObj["keywords"][i].value);
  }
  /// replace raw tagify values with processed tagify values
  datasetInfoValueObj["keywords"] = keywordVal;

  // process multiple Study info tagify values - Study techniques, approaches, and study organ systems
  let studyTechniqueArr = [];
  for (let i = 0; i < studyInfoValueObject["study technique"].length; i++) {
    studyTechniqueArr.push(studyInfoValueObject["study technique"][i].value);
  }
  let studyOrganSystemsArr = [];
  for (let i = 0; i < studyInfoValueObject["study organ system"].length; i++) {
    studyOrganSystemsArr.push(studyInfoValueObject["study organ system"][i].value);
  }
  let studyApproachesArr = [];
  for (let i = 0; i < studyInfoValueObject["study approach"].length; i++) {
    studyApproachesArr.push(studyInfoValueObject["study approach"][i].value);
  }
  /// replace raw tagify values with processed tagify values
  studyInfoValueObject["study organ system"] = studyOrganSystemsArr;
  studyInfoValueObject["study technique"] = studyTechniqueArr;
  studyInfoValueObject["study approach"] = studyApproachesArr;

  log.info(`Generating a dataset description file.`);
  /// call python function to save file
  try {
    let save_ds_desc_file = await client.post(
      `/prepare_metadata/dataset_description_file`,
      {
        selected_account: bfaccountname,
        selected_dataset: bf_dataset,
        filepath: ddDestinationPath,
        dataset_str: datasetInfoValueObj,
        study_str: studyInfoValueObject,
        contributor_str: contributorObj,
        related_info_str: relatedInfoArr,
      },
      {
        params: {
          upload_boolean: uploadBFBoolean,
        },
      }
    );

    let res = save_ds_desc_file.data.size;

    if (uploadBFBoolean) {
      var successMessage =
        "Successfully generated the dataset_description.xlsx file on your Pennsieve dataset.";
    } else {
      var successMessage =
        "Successfully generated the dataset_description.xlsx file at the specified location.";
    }

    Swal.fire({
      title: successMessage,
      icon: "success",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the successful attempt to generate the description file in analytics at this step in the Generation process
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.DATASET_DESCRIPTION_XLSX,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(uploadBFBoolean ? "Pennsieve" : "Local", 1)
    );

    // log the size of the metadata file that was generated at varying levels of granularity
    const size = res;
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.DATASET_DESCRIPTION_XLSX_SIZE,
      kombuchaEnums.Status.SUCCESS,
      createEventDataPrepareMetadata(uploadBFBoolean ? "Pennsieve" : "Local", size)
    );
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);

    Swal.fire({
      title: "Failed to generate the dataset_description file",
      html: emessage,
      icon: "warning",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    // log the failure to generate the description file to analytics at this step in the Generation process
    window.electron.ipcRenderer.send(
      "track-kombucha",
      kombuchaEnums.Category.PREPARE_METADATA,
      kombuchaEnums.Action.GENERATE_METADATA,
      kombuchaEnums.Label.DATASET_DESCRIPTION_XLSX,
      kombuchaEnums.Status.FAIL,
      createEventDataPrepareMetadata(uploadBFBoolean ? "Pennsieve" : "Local", 1)
    );
  }
};

///// Functions to grab each piece of info to generate the dd file

// contributor info
const grabConInfoEntries = () => {
  var funding = $("#ds-description-award-input").val();
  var acknowledgment = $("#ds-description-acknowledgments").val();

  var fundingArray = [];
  if (funding === "") {
    fundingArray = [""];
  } else {
    fundingArray = [funding];
  }
  /// other funding sources
  var otherFunding = window.otherFundingTagify.value;
  for (var i = 0; i < otherFunding.length; i++) {
    fundingArray.push(otherFunding[i].value);
  }

  var contributorInfo = {};

  contributorInfo["funding"] = fundingArray;
  contributorInfo["acknowledgment"] = acknowledgment;
  contributorInfo["contributors"] = window.contributorArray;
  return contributorInfo;
};

const grabAdditionalLinkSection = () => {
  var table = document.getElementById("other-link-table-dd");
  var rowcountLink = table.rows.length;
  var additionalLinkInfo = [];
  for (let i = 1; i < rowcountLink; i++) {
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

const grabProtocolSection = () => {
  var table = document.getElementById("protocol-link-table-dd");
  var rowcountLink = table.rows.length;
  var protocolLinkInfo = [];
  for (let i = 1; i < rowcountLink; i++) {
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

const combineLinksSections = () => {
  var protocolLinks = grabProtocolSection();
  var otherLinks = grabAdditionalLinkSection();
  protocolLinks.push.apply(protocolLinks, otherLinks);
  return protocolLinks;
};

// add protocol function for DD file
window.addProtocol = async () => {
  const { value: values } = await Swal.fire({
    title: "Add a protocol",
    html:
      '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">' +
      '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    width: "38rem",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-protocol-link").val();
      let protocolLink = "";
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      } else {
        if (doiRegex.declared({ exact: true }).test(link) === true) {
          protocolLink = "DOI";
        } else {
          //check if link is valid
          if (validator.isURL(link) != true) {
            Swal.showValidationMessage(`Please enter a valid link`);
          } else {
            //link is valid url and check for 'doi' in link
            if (link.includes("doi")) {
              protocolLink = "DOI";
            } else {
              protocolLink = "URL";
            }
          }
        }
      }
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      var duplicate = window.checkLinkDuplicate(
        $("#DD-protocol-link").val(),
        document.getElementById("protocol-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate protocol. The protocol you entered is already added."
        );
      }
      return [
        $("#DD-protocol-link").val(),
        protocolLink,
        "IsProtocolFor",
        $("#DD-protocol-description").val(),
      ];
    },
  });
  if (values) {
    addProtocolLinktoTableDD(values[0], values[1], values[2], values[3]);
  }
};

const addProtocolLinktoTableDD = (protocolLink, protocolType, protocolRelation, protocolDesc) => {
  var protocolTable = document.getElementById("protocol-link-table-dd");
  protocolTable.style.display = "block";
  document.getElementById("div-protocol-link-table-dd").style.display = "block";
  var rowcount = protocolTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  protocolTable.rows[protocolTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = window.checkForUniqueRowID("row-current-protocol", rowIndex);
  var indexNumber = rowIndex;
  protocolTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-protocol" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td><a href='" +
    protocolLink +
    "' target='_blank'>" +
    protocolLink +
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    protocolType +
    "</td><td class='contributor-table-row'>" +
    protocolRelation +
    "</td><td class='contributor-table-row' style='display:none'>" +
    protocolDesc +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.edit_current_protocol_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='window.delete_current_protocol_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>";
};

window.addAdditionalLinktoTableDD = (link, linkType, linkRelation, description) => {
  let linkTable = document.getElementById("other-link-table-dd");
  linkTable.style.display = "block";
  document.getElementById("div-other-link-table-dd").style.display = "block";
  let rowcount = linkTable.rows.length;
  /// append row to table from the bottom
  let rowIndex = rowcount;
  linkTable.rows[linkTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  let newRowIndex = window.checkForUniqueRowID("row-current-additional-link", rowIndex);
  let indexNumber = rowIndex;
  linkTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-other" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td><a href='" +
    link +
    "' target='_blank'>" +
    link +
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    linkType +
    "</td><td class='contributor-table-row'>" +
    linkRelation +
    "</td><td class='contributor-table-row' style='display:none'>" +
    description +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.edit_current_additional_link_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_additional_link_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>";
};

const changeAward = (award) => {
  Swal.fire({
    title: "Loading your award and contributor information.",
    html: "Please wait...",
    timer: 3000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then(() => {});
  $("#ds-description-award-input").val(award);
  $("#submission-sparc-award").val(award);
};

var contributorElement = `<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-ps" onchange="window.onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-ps" " style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-ps" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div></div> `;

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-ps" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-ps" style="line-height: 2"></input></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-ps" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div></div>';

window.contributorArray = [];
var affiliationSuggestions = [];

window.delete_current_con_id = (ev) => {
  Swal.fire({
    title: "Are you sure you want to delete this contributor?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Yes",
    reverseButtons: window.reverseSwalButtons,
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];

      currentRow.remove();
      window.updateIndexForTable(document.getElementById("contributor-table-dd"), false);
      // 2. Delete from JSON
      var contributorName = $(currentRow)[0].cells[0].innerText;
      for (var i = 0; i < window.contributorArray.length; i++) {
        if (window.contributorArray[i].conName.trim() === contributorName.trim()) {
          window.contributorArray.splice(i, 1);
          break;
        }
      }
    }
  });
};

window.checkAtLeastOneContactPerson = () => {
  let contactPersonExists = false;
  let allConTable = document.getElementById("contributor-table-dd");
  let rowcount = allConTable.rows.length;
  if (allConTable.rows.length > 1) {
    for (let i = 1; i < rowcount; i++) {
      let contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
  }
  return contactPersonExists;
};

const checkDuplicateContributorName = (first, last, contributorsTable) => {
  let table = contributorsTable[0];
  let duplicate = false;
  let name = first + ", " + last;
  let rowcount = table.rows.length;
  for (let i = 1; i < rowcount; i++) {
    let currentContributorName = table.rows[i].cells[1].innerText;
    if (currentContributorName === name) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
};

///// Functions to grab each piece of info to generate the dd file

// dataset and participant info
window.grabDSInfoEntries = () => {
  let name = document.getElementById("ds-name").value;
  let description = document.getElementById("ds-description").value;
  let type = $("#ds-type").val();
  let keywordArray = window.keywordTagify.value;
  let samplesNo = document.getElementById("ds-samples-no").value;
  let subjectsNo = document.getElementById("ds-subjects-no").value;

  return {
    name: name,
    description: description,
    type: type,
    keywords: keywordArray,
    "number of samples": samplesNo,
    "number of subjects": subjectsNo,
  };
};

// study info
const grabStudyInfoEntries = () => {
  let studyOrganSystem = window.studyOrganSystemsTagify.value;
  let studyApproach = window.studyApproachesTagify.value;
  let studyTechnique = window.studyTechniquesTagify.value;
  let studyPurpose = document.getElementById("ds-study-purpose").value;
  let studyDataCollection = document.getElementById("ds-study-data-collection").value;
  let studyPrimaryConclusion = document.getElementById("ds-study-primary-conclusion").value;
  let studyCollectionTitle = document.getElementById("ds-study-collection-title").value;

  return {
    "study organ system": studyOrganSystem,
    "study approach": studyApproach,
    "study technique": studyTechnique,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle,
  };
};

window.importExistingDDFile = () => {
  let filePath = $("#existing-dd-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your dataset_description.xlsx file,",
      "error"
    );
  } else {
    if (window.path.parse(filePath).base !== "dataset_description.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'dataset_description.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });
    } else {
      Swal.fire({
        title: "Loading an existing dataset_description.xlsx file",
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
      }).then(() => {});
      setTimeout(loadDDfileDataframe(filePath), 1000);
    }
  }
};

window.checkBFImportDD = async () => {
  Swal.fire({
    title: "Importing the dataset_description.xlsx file",
    html: "Please wait...",
    timer: 15000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  let bf_dataset = document.getElementById("bf_dataset_load_dd").innerText;
  log.info(`Importing dataset_description.xlsx file from Pennsieve for dataset ${bf_dataset}`);
  try {
    let metadata_import = await client.get(`/prepare_metadata/import_metadata_file`, {
      params: {
        selected_account: window.defaultBfAccount,
        selected_dataset: bf_dataset,
        file_type: "dataset_description.xlsx",
      },
    });
    let res = metadata_import.data;
    loadDDFileToUI(res, "ps");

    // log the import action success to analytics
    window.logMetadataForAnalytics(
      "Success",
      window.MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.PENNSIEVE
    );
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: `Failed to load existing dataset_description.xslx file`,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "warning",
      text: error.response.data.message,
    });

    window.logMetadataForAnalytics(
      "Error",
      window.MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
};

const loadDDfileDataframe = async (filePath) => {
  try {
    let ddFileResponse = await client.get("/prepare_metadata/dataset_description_file", {
      params: {
        filepath: filePath,
        import_type: "local",
      },
    });

    let ddFileData = ddFileResponse.data;

    loadDDFileToUI(ddFileData, "local");
    // log the import action success to analytics
    window.logMetadataForAnalytics(
      "Success",
      window.MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      window.AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      "Existing",
      Destinations.LOCAL
    );
  } catch (error) {
    clientError(error);
    var emessage = userErrorMessage(error);
    Swal.fire({
      title: "Failed to load the existing dataset_description.xlsx file",
      html: emessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });

    // log the import action failure to analytics
    window.logMetadataForAnalytics(
      "Error",
      window.MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      window.AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
};

const loadDDFileToUI = (object, file_type) => {
  var basicInfoObj = object["Basic information"];
  var studyInfoObj = object["Study information"];
  var contributorData = object["Contributor information"];
  var awardInfoObj = object["Award information"];
  var relatedInfo = object["Related information"];

  ///// populating Basic info UI
  for (var arr of basicInfoObj) {
    if (arr[0] === "Type") {
      $("#ds-type").val(arr[1].toLowerCase());
    } else if (arr[0] === "Title") {
      $("#ds-name").val(arr[1]);
    } else if (arr[0] === "Subtitle") {
      $("#ds-description").val(arr[1]);
    } else if (arr[0] === "Number of subjects") {
      $("#ds-subjects-no").val(arr[1]);
    } else if (arr[0] === "Number of samples") {
      $("#ds-samples-no").val(arr[1]);
    } else if (arr[0] === "Keywords") {
      // populate keywords
      populateTagifyDD(window.keywordTagify, arr.splice(1));
    }
  }
  //// populating Study info UI
  for (var arr of studyInfoObj) {
    if (arr[0] === "Study purpose") {
      $("#ds-study-purpose").val(arr[1]);
    } else if (arr[0] === "Study data collection") {
      $("#ds-study-data-collection").val(arr[1]);
    } else if (arr[0] === "Study primary conclusion") {
      $("#ds-study-primary-conclusion").val(arr[1]);
    } else if (arr[0] === "Study organ system") {
      // populate organ systems
      populateTagifyDD(window.studyOrganSystemsTagify, arr.splice(1));
    } else if (arr[0] === "Study approach") {
      // populate approach
      populateTagifyDD(window.studyApproachesTagify, arr.splice(1));
    } else if (arr[0] === "Study technique") {
      // populate technique
      populateTagifyDD(window.studyTechniquesTagify, arr.splice(1));
    } else if (arr[0] === "Study collection title") {
      // populate collection title
      $("#ds-study-collection-title").val(arr[1]);
    }
  }

  for (var arr of awardInfoObj) {
    if (arr[0] === "Acknowledgments") {
      $("#ds-description-acknowledgments").val(arr[1]);
    } else if (arr[0] === "Funding") {
      // populate awards
      $("#ds-description-award-input").val(arr[1]);
      changeAward(arr[1]);
      populateTagifyDD(window.otherFundingTagify, arr.splice(2));
    }
  }

  /// populating Con info UI
  loadContributorsToTable(contributorData);

  /// populating Related info UI
  loadRelatedInfoToTable(relatedInfo);

  Swal.fire({
    title: "Loaded successfully!",
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
    },
  });
  $("#button-generate-dd").show();
  if (file_type === "local") {
    $("#div-confirm-existing-dd-import").hide();
    $($("#div-confirm-existing-dd-import button")[0]).hide();
    $("#button-fake-confirm-existing-dd-file-load").click();
  } else {
    $("#div-check-ps-import-dd").hide();
    $($("#div-check-ps-import-dd button")[0]).hide();
    // $($("#button-fake-confirm-existing-ps-dd-file-load").siblings()[0]).hide();
    $("#button-fake-confirm-existing-ps-dd-file-load").click();
  }
};

const populateTagifyDD = (tagify, values) => {
  tagify.removeAllTags();
  for (var value of values) {
    if (value.trim() !== "") {
      tagify.addTags(value.trim());
    }
  }
};

const loadRelatedInfoToTable = (array) => {
  $("#protocol-link-table-dd tr:gt(0)").remove();
  $("#div-protocol-link-table-dd").css("display", "none");
  $("#other-link-table-dd tr:gt(0)").remove();
  $("#div-other-link-table-dd").css("display", "none");
  for (var arr of array.splice(1)) {
    if (arr[2].trim() !== "") {
      var protocolBoolean = protocolCheck(arr);
      if (protocolBoolean) {
        addProtocolLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      } else {
        window.addAdditionalLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      }
    }
  }
};

// check if a link is a protocol for UI import purpose (Basic version, could be improved further for accuracy)
// (nothing will be changed for the generating purpose, just for the UI link separation between protocols and other links)
const protocolCheck = (array) => {
  var boolean = false;
  // if relation includes IsProtocolFor, HasProtocol OR if description includes the word "protocol"(s) at all
  if (
    array[1].includes("IsProtocolFor") ||
    array[1].includes("HasProtocol") ||
    array[0].includes("protocol") ||
    array[0].includes("protocols")
  ) {
    boolean = true;
  }
  return boolean;
};

// searches the markdown for key sections and returns them as an easily digestible object
// returns: {Study Purpose: text/markdown | "", Data Collection: text/markdown | "", Primary Conclusion: text/markdown | "", invalidText: text/markdown | ""}
export const createParsedReadme = (readme) => {
  // read in the readme file and store it in a variable ( it is in markdown )
  let mutableReadme = readme;

  // create the return object
  const parsedReadme = {
    "Study Purpose": "",
    "Data Collection": "",
    "Primary Conclusion": "",
    "invalid text": "",
  };

  // remove the "Study Purpose" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Study Purpose", parsedReadme);

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Data Collection", parsedReadme);

  // search for the "Primary Conclusion" and basic variations of spacing
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "Primary Conclusion", parsedReadme);

  // remove the invalid text from the readme contents
  mutableReadme = stripInvalidTextFromReadme(mutableReadme, parsedReadme);

  // return the parsed readme
  return parsedReadme;
};

// strips the required section starting with the given section name from a copy of the given readme string. Returns the mutated string. If given a parsed readme object
// it will also place the section text in that object.
// Inputs:
//      readme: A string with the users dataset description
//      sectionName: The name of the section the user wants to strip from the readme
//      parsedReadme: Optional object that gets the stripped section text if provided
const stripRequiredSectionFromReadme = (readme, sectionName, parsedReadme = undefined) => {
  // lowercase the readme file text to avoid casing issues with pattern matching
  let mutableReadme = readme.trim();

  // serch for the start of the given section -- it can have one or more whitespace between the colon
  let searchRegExp = new RegExp(`[*][*]${sectionName}[ ]*:[*][*]`);
  let altSearchRegExp = new RegExp(`[*][*]${sectionName}[*][*][ ]*:`);
  let sectionIdx = mutableReadme.search(searchRegExp);
  if (sectionIdx === -1) {
    sectionIdx = mutableReadme.search(altSearchRegExp);
  }
  // if the section is not found return the readme unchanged
  if (sectionIdx === -1) {
    return mutableReadme;
  }

  // remove the section title text
  mutableReadme = mutableReadme.replace(searchRegExp, "");
  mutableReadme = mutableReadme.replace(altSearchRegExp, "");
  // search for the end of the removed section's text
  let endOfSectionIdx;
  // curator's section is designated by three hyphens in a row
  let curatorsSectionIdx = mutableReadme.search("---");

  for (endOfSectionIdx = sectionIdx; endOfSectionIdx < mutableReadme.length; endOfSectionIdx++) {
    // check if we found the start of a new section
    if (mutableReadme[endOfSectionIdx] === "*" || endOfSectionIdx === curatorsSectionIdx) {
      // if so stop
      break;
    }
  }

  // store the value of the given section in the parsed readme if one was provided
  if (parsedReadme) {
    parsedReadme[`${sectionName}`] = mutableReadme.slice(
      sectionIdx,
      endOfSectionIdx >= mutableReadme.length ? undefined : endOfSectionIdx
    );
  }

  // strip the section text from the readme
  mutableReadme = mutableReadme.slice(0, sectionIdx) + mutableReadme.slice(endOfSectionIdx);

  return mutableReadme;
};

// find invalid text and strip it from a copy of the given readme string. returns the mutated readme.
// Text is invalid in these scenarios:
//   1. any text that occurs before an auxillary section is invalid text because we cannot assume it belongs to one of the auxillary sections below
//   2. any text in a string where there are no sections
const stripInvalidTextFromReadme = (readme, parsedReadme = undefined) => {
  // ensure the required sections have been taken out
  if (
    readme.search(`[*][*]${requiredSections.studyPurpose}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.studyPurpose}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[*][*][ ]*:`) !== -1
  ) {
    throw new Error("There was a problem with reading your description file.");
  }

  // search for the first occurring auxillary section -- this is a user defined section
  let auxillarySectionIdx = readme.search("[*][*].*[ ]*:[*][*]");

  // check if there was an auxillary section found that has a colon before the markdown ends
  if (auxillarySectionIdx !== -1) {
    let auxillarySectionIdxAltFormat = readme.search("[*][*].*[ ]*[*][*][ ]*:");
    // check if there is an auxillary section that comes before the current section that uses alternative common syntax
    if (auxillarySectionIdxAltFormat !== -1 && auxillarySectionIdx > auxillarySectionIdxAltFormat) {
      auxillarySectionIdx = auxillarySectionIdxAltFormat;
    }
  } else {
    // no auxillary section could be found using the colon before the closing markdown sytnatx so try the alternative common syntax
    auxillarySectionIdx = readme.search("[*][*].*[ ]*[*][*][ ]*:");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    let curatorsSectionIdx = readme.search("(---)");
    // check if the curator's section appears before the auxillary section that was found
    if (curatorsSectionIdx !== -1 && auxillarySectionIdx > curatorsSectionIdx) {
      auxillarySectionIdx = curatorsSectionIdx;
    }
  } else {
    // set the auxillary section idx to the start of the curator's section idx
    auxillarySectionIdx = readme.search("(---)");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    // get the text that comes before the auxillary seciton idx
    let invalidText = readme.slice(0, auxillarySectionIdx);

    // if there is no invalid text then parsing is done
    if (!invalidText.length) {
      return readme;
    }

    // check if the user wants to store the invalid text in a parsed readme
    if (parsedReadme) {
      // place the invalid text into the parsed readme
      parsedReadme[requiredSections.invalidText] = invalidText;
    }

    // remove the text from the readme
    readme = readme.slice(auxillarySectionIdx);

    // return the readme file
    return readme;
  } else {
    // there are no auxillary sections so the rest of the string is invalid text -- if there is any string left
    if (parsedReadme) {
      parsedReadme[requiredSections.invalidText] = readme;
    }

    // remove the text from the readme === return an empty string
    return "";
  }
};
