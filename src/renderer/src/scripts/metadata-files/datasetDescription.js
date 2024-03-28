import Swal from "sweetalert2";
import determineDatasetLocation, { Destinations } from "../analytics/analytics-utils";
import { clientError, userErrorMessage } from "../others/http-error-handler/error-handler";
import client from "../client";
import kombuchaEnums from "../analytics/analytics-enums";
import createEventDataPrepareMetadata from "../analytics/prepare-metadata-analytics";
import api from "../others/api/api";
import Tagify from "@yaireo/tagify/dist/tagify.esm";
import tippy from "tippy.js";
import doiRegex from "doi-regex";
import validator from "validator";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// opendropdown event listeners
document.querySelectorAll(".dd-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    window.openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".dd-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    window.openDropdownPrompt(element, "dataset");
  });
});

// Prepare Dataset Description File
const dsAwardArray = document.getElementById("ds-description-award-list");
const dsContributorArrayLast1 = document.getElementById("ds-description-contributor-list-last-1");
const dsContributorArrayFirst1 = document.getElementById("ds-description-contributor-list-first-1");

window.currentContributorsLastNames = [];
var currentContributorsFirstNames = [];
window.globalContributorNameObject = {};

// const affiliationInput = document.getElementById("input-con-affiliation-1");
const addCurrentContributorsBtn = document.getElementById("button-ds-add-contributor");
const contactPerson = document.getElementById("ds-contact-person");
const generateDSBtn = document.getElementById("button-generate-ds-description");
const addAdditionalLinkBtn = document.getElementById("button-ds-add-link");
const datasetDescriptionFileDataset = document.getElementById("ds-name");
const parentDSDropdown = document.getElementById("input-parent-ds");

var sparcAwards = [];

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
      $("#div-check-bf-import-dd").css("display", "flex");
      $($("#div-check-bf-import-dd").children()[0]).show();
    } else {
      $("#div-check-bf-import-dd").css("display", "none");
    }
  });

  $("#bf_dataset_generate_dd").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_dd").text().trim() !== "None") {
      $("#div-check-bf-generate-dd").css("display", "flex");
    } else {
      $("#div-check-bf-generate-dd").css("display", "none");
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

const populateProtocolLink = (ev) => {
  if ($(ev).val() === "Protocol URL or DOI*") {
    // display dropdown to select protocol titles
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "block");
    } else {
      var divElement =
        '<select id="select-misc-links" class="form-container-input-bf" style="font-size:13px; line-height:2;margin-top: 20px" onchange="autoPopulateProtocolLink(this, \'\', \'dd\')"></select>';
      $($(ev).parents()[0]).append(divElement);
      // populate dropdown with protocolResearcherList
      window.removeOptions(document.getElementById("select-misc-links"));
      window.addOption(
        document.getElementById("select-misc-links"),
        "Select protocol title",
        "Select"
      );
      for (var key of Object.keys(protocolResearcherList)) {
        $("#select-misc-links").append(
          '<option value="' + protocolResearcherList[key] + '">' + key + "</option>"
        );
      }
    }
  } else {
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "none");
    }
  }
};

// check for duplicates in names of contributors
const checkContributorNameDuplicates = (table, currentRow) => {
  var duplicate = false;
  var currentConLastName = $("#" + currentRow.cells[0].children[0].id).val();
  var currentConFirstName = $("#" + currentRow.cells[1].children[0].id).val();
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount - 1; i++) {
    if (
      $("#" + document.getElementById(table).rows[i].cells[0].children[0].id).val() ===
        currentConLastName &&
      $("#" + document.getElementById(table).rows[i].cells[1].children[0].id).val() ===
        currentConFirstName
    ) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
};

// clone Last names of contributors to subsequent selects so we don't have to keep calling Airtable API
const cloneConNamesSelect = (selectLast) => {
  window.removeOptions(document.getElementById(selectLast));
  window.addOption(document.getElementById(selectLast), "Select an option", "Select");
  for (var i = 0; i < window.currentContributorsLastNames.length; i++) {
    var opt = window.currentContributorsLastNames[i];
    if (document.getElementById(selectLast)) {
      window.addOption(document.getElementById(selectLast), opt, opt);
    }
  }
};

// the below 2 functions initialize Tagify for each input field for a new added row (Role and Affiliation)
const createConsRoleTagify = (inputField) => {
  var input = document.getElementById(inputField);
  // initialize Tagify on the above input node reference
  var tagify = new Tagify(input, {
    whitelist: [
      "PrincipalInvestigator",
      "Creator",
      "CoInvestigator",
      "CorrespondingAuthor",
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
      maxItems: Infinity,
      enabled: 1,
      closeOnSelect: true,
    },
  });
  window.createDragSort(tagify);
};

const createConsAffliationTagify = (inputField) => {
  var input = document.getElementById(inputField);
  var tagify = new Tagify(input, {
    dropdown: {
      classname: "color-blue",
      enabled: 0, // show the dropdown immediately on focus
      maxItems: 25,
      closeOnSelect: true, // keep the dropdown open after selecting a suggestion
    },
    duplicates: false,
  });
  window.createDragSort(tagify);
};

const convertDropdownToTextBox = (dropdown) => {
  if (document.getElementById(dropdown)) {
    $($("#" + dropdown).parents()[1]).css("display", "none");
    if (dropdown == "ds-description-award-list") {
      $("#SPARC-Award-raw-input-div-dd").css("display", "flex");
    }
  }
};

// resetting the dataset_description file
const resetDDUI = (table) => {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount - 1;
  var currentRow =
    document.getElementById(table).rows[document.getElementById(table).rows.length - 1];

  $("#SPARC-Award-raw-input-div-dd").css("display", "none");
  $("#dd-description-raw-contributor-list-last-1").css("display", "none");
  $("#ds-description-contributor-list-last-1").remove();
  $("#ds-description-contributor-list-first-1").remove();
  $("#dd-description-raw-contributor-list-first-1").css("display", "none");
  $($("#ds-description-award-list").parents()[1]).css("display", "flex");
  $("#add-other-contributors").css("display", "block");
  $("#add-other-contributors").text("Add contributors not listed above");
  $("#table-current-contributors").find("tr").slice(1).remove();

  // show generate button again
  $("#button-generate-dd").show();

  rowIndex = 1;
  newRowIndex = 1;
  var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
    "<tr id='row-current-name" +
    newRowIndex +
    "'><td class='grab'><select id='ds-description-contributor-list-last-" +
    newRowIndex +
    "' onchange='window.onchangeLastNames(" +
    newRowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select disabled id='ds-description-contributor-list-first-" +
    newRowIndex +
    "' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-" +
    newRowIndex +
    "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
    newRowIndex +
    "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
    newRowIndex +
    "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
    newRowIndex +
    ")' id='ds-contact-person-" +
    newRowIndex +
    "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
    newRowIndex +
    ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
  window.changeAwardInputDsDescription();
  cloneConNamesSelect("ds-description-contributor-list-last-" + rowIndex.toString());
};

const checkEmptyConRowInfo = (table, row) => {
  var empty = false;
  var type = ["select", "input"];
  for (var i = 0; i < row.cells.length - 2; i++) {
    if (row.cells[i].style.display !== "none") {
      var cell = $(row.cells[i]);
      for (var item of type) {
        if ($(cell).find(item).length > 0) {
          if (
            $(cell).find(item).val() == "" ||
            $(cell).find(item).val() == "Select an option" ||
            $(cell).find(item).val() == "Select"
          ) {
            empty = true;
            $(cell).find(item).addClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").addClass("invalid");
            }
          } else {
            $(cell).find(item).removeClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").removeClass("invalid");
            }
          }
        }
      }
    }
  }
  return empty;
};

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
    const isLocked = await api.isDatasetLocked(bfaccountname, bf_dataset);
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
  }).then((result) => {});
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
  var currentRow = protocolTable.rows[protocolTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = window.checkForUniqueRowID("row-current-protocol", rowIndex);
  var indexNumber = rowIndex;
  var row = (protocolTable.insertRow(rowIndex).outerHTML =
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
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.edit_current_protocol_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='window.delete_current_protocol_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
};

window.addAdditionalLinktoTableDD = (link, linkType, linkRelation, description) => {
  let linkTable = document.getElementById("other-link-table-dd");
  linkTable.style.display = "block";
  document.getElementById("div-other-link-table-dd").style.display = "block";
  let rowcount = linkTable.rows.length;
  /// append row to table from the bottom
  let rowIndex = rowcount;
  let currentRow = linkTable.rows[linkTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  let newRowIndex = window.checkForUniqueRowID("row-current-additional-link", rowIndex);
  let indexNumber = rowIndex;
  let row = (linkTable.insertRow(rowIndex).outerHTML =
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
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.edit_current_additional_link_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_additional_link_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
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
  }).then((result) => {});
  $("#ds-description-award-input").val(award);
  $("#submission-sparc-award").val(award);
};

const generateContributorRowElement = (contributorLastName, contributorFirstName) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <div class="ui fitted checkbox">
          <input type="checkbox" name="contributor">
          <label></label>
        </div>
      </td>
      <td class="middle aligned">
        ${contributorLastName}
      </td>
      <td class="middle aligned">
        ${contributorFirstName}
      </td>
    </tr>
  `;
};

const addContributortoTableDD = (name, contributorObject) => {
  const contributorIsValid = window.contributorDataIsValid(contributorObject);
  const conRole = contributorObject.conRole;
  let conTable = document.getElementById("contributor-table-dd");
  let rowcount = conTable.rows.length;
  let rowIndex = rowcount;
  /// append row to table from the bottom
  let currentRow = conTable.rows[conTable.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  let newRowIndex = window.checkForUniqueRowID("row-current-con", rowIndex);
  let indexNumber = rowIndex;
  let conName = name;
  // var conContactPerson = contactStatus;

  document.getElementById("div-contributor-table-dd").style.display = "block";
  document.getElementById("contributor-table-dd").style.display = "table";

  let row = (conTable.insertRow(rowIndex).outerHTML =
    `<tr id='row-current-con' class='row-protocol'><td class='contributor-table-row'>
  ${conName}
    </td><td>
  
    ${conRole}
    </td><td class='contributor-table-row'>
    ${
      contributorIsValid
        ? `<span class="badge badge-pill badge-success">Valid</span>`
        : `<span class="badge badge-pill badge-warning">Missing Fields</span>`
    }
    </td> <td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.edit_current_con_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button></div></td>
    <td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='window.delete_current_con_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>`);
};

var contributorElement = `<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-bf" onchange="window.onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-bf" " style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div></div> `;

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-bf" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-bf" style="line-height: 2"></input></div></div><div><label>ORCiD <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle tippy-tooltip" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div></div>';

window.contributorArray = [];
var affiliationSuggestions = [];

window.showContributorSweetalert = (key) => {
  var currentContributortagify;
  var currentAffliationtagify;
  if (key === false) {
    if (Object.keys(window.globalContributorNameObject).length !== 0) {
      var footer =
        "<a style='text-decoration: none !important' onclick='window.showContributorSweetalert(\"pass\")' target='_blank'>I want to add a contributor not listed above</a>";
      var element = contributorElement;
    } else {
      var footer = "";
      var element = contributorElementRaw;
    }
  } else if (key === "pass") {
    var element = contributorElementRaw;
    var footer = "";
  }
  Swal.fire({
    title: "Add a contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add contributor",
    width: "max-content",
    reverseButtons: window.reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: footer,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy(".tippy-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(document.getElementById("input-con-role"), {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
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
        dropdown: {
          classname: "color-blue",
          enabled: 0, // show the dropdown immediately on focus
          maxItems: 25,
          closeOnSelect: true, // keep the dropdown open after selecting a suggestion
        },
        enforceWhitelist: true,
        duplicates: false,
      });
      window.createDragSort(currentContributortagify);

      currentAffliationtagify = new Tagify(document.getElementById("input-con-affiliation"), {
        dropdown: {
          classname: "color-blue",
          enabled: 0, // show the dropdown immediately on focus
          maxItems: 25,
          closeOnSelect: true, // keep the dropdown open after selecting a suggestion
        },
        whitelist: affiliationSuggestions,
        delimiters: null,
        duplicates: false,
      });
      window.createDragSort(currentAffliationtagify);

      // load contributor names onto Select
      if (Object.keys(window.globalContributorNameObject).length !== 0) {
        if (key === false) {
          cloneConNamesSelect("dd-contributor-last-name");
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      var affValues = grabCurrentTagifyContributor(currentAffliationtagify);
      // store affiliation info as suggestions
      affiliationSuggestions.push.apply(affiliationSuggestions, affValues);
      var affSet = new Set(affiliationSuggestions);
      var affArray = [...affSet];
      affiliationSuggestions = affArray;
      var affiliationVals = affValues.join(", ");
      var roleVals = grabCurrentTagifyContributor(currentContributortagify).join(", ");

      var firstName = $("#dd-contributor-first-name").val().trim();
      var lastName = $("#dd-contributor-last-name").val().trim();
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        firstName === "Select" ||
        lastName === "Select" ||
        firstName === "" ||
        lastName === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var duplicateConName = checkDuplicateContributorName(
          firstName,
          lastName,
          $("#contributor-table-dd")
        );
        if (!duplicateConName) {
          var myCurrentCon = {
            conName: lastName + ", " + firstName,
            contributorFirstName: firstName,
            contributorLastName: lastName,
            conID: $("#input-con-ID").val().trim(),
            conAffliation: affiliationVals,
            conRole: roleVals,
          };
          window.contributorArray.push(myCurrentCon);
          return [myCurrentCon];
          // if ($("#ds-contact-person").prop("checked")) {
          //   window.contributorArray.push(myCurrentCon);
          //   return [myCurrentCon.conName, "No"];
          //   var contactPersonExists = checkContactPersonStatus("add", null);
          //   // if (contactPersonExists) {
          //   //   Swal.showValidationMessage(
          //   //     "One corresponding author is already added. Only one corresponding author is allowed for a dataset."
          //   //   );
          //   // } else {
          //   //   var myCurrentCon = {
          //   //     conName: lastName + ", " + firstName,
          //   //     conID: $("#input-con-ID").val().trim(),
          //   //     conAffliation: affiliationVals,
          //   //     conRole: roleVals + ", CorrespondingAuthor",
          //   //   };
          //   //   window.contributorArray.push(myCurrentCon);
          //   //   return [myCurrentCon.conName, "Yes"];
          //   // }
          // } else {

          // }
        } else {
          Swal.showValidationMessage(
            `The contributor ${lastName + ", " + firstName} is already added.`
          );
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addContributortoTableDD(result.value[0].conName, result.value[0]);
      // memorize Affiliation info for next time as suggestions
      memorizeAffiliationInfo(affiliationSuggestions);
    }
  });
};

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
      var currentRowid = $(currentRow).prop("id");

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

window.edit_current_con_id = (ev) => {
  var currentContributortagify;
  var currentAffliationtagify;
  var element = contributorElementRaw;
  var currentRow = $(ev).parents()[2];
  var name = $(currentRow)[0].cells[0].innerText.trim();
  Swal.fire({
    text: "Edit contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    width: "max-content",
    customClass: "contributor-popup",
    reverseButtons: window.reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy(".tippy-tooltip", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // disable first and last names (cannot edit these fields)
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(document.getElementById("input-con-role"), {
        whitelist: [
          "PrincipalInvestigator",
          "Creator",
          "CoInvestigator",
          "CorrespondingAuthor",
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
        dropdown: {
          classname: "color-blue",
          enabled: 0, // show the dropdown immediately on focus
          maxItems: 25,
          closeOnSelect: true, // keep the dropdown open after selecting a suggestion
        },
        enforceWhitelist: true,
        duplicates: false,
      });
      window.createDragSort(currentContributortagify);

      currentAffliationtagify = new Tagify(document.getElementById("input-con-affiliation"), {
        dropdown: {
          classname: "color-blue",
          enabled: 0, // show the dropdown immediately on focus
          maxItems: 25,
          closeOnSelect: true, // keep the dropdown open after selecting a suggestion
        },
        // delimiters: ",",
        whitelist: affiliationSuggestions,
        duplicates: false,
      });
      window.createDragSort(currentAffliationtagify);

      for (var contributor of window.contributorArray) {
        if (contributor.conName === name) {
          // add existing tags to tagifies
          let splitNames = [];

          // Add affiliation tags
          for (var affiliation of contributor.conAffliation.split(" ,")) {
            currentAffliationtagify.addTags(affiliation);
          }

          // Add role tags
          for (var role of contributor.conRole.split(" ,")) {
            currentContributortagify.addTags(role);
          }

          // Add corresponding author: REMOVE
          if (contributor.conRole.includes("CorrespondingAuthor")) {
            $("#ds-contact-person").prop("checked", true);
          } else {
            $("#ds-contact-person").prop("checked", false);
          }

          if (name.includes(", ")) {
            splitNames = name.split(", ");
          } else {
            splitNames = name.split(" ");
          }

          $("#dd-contributor-first-name").val(splitNames[1].trim());
          $("#dd-contributor-last-name").val(splitNames[0].trim());
          // $("#dd-contributor-last-name").attr("disabled", true);
          // $("#dd-contributor-first-name").attr("disabled", true);
          $("#input-con-ID").val(contributor.conID);
          break;
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        $("#dd-contributor-last-name").val().trim() === "Select" ||
        $("#dd-contributor-first-name").val().trim() === "Select" ||
        $("#dd-contributor-last-name").val().trim() === "" ||
        $("#dd-contributor-first-name").val().trim() === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var affValues = grabCurrentTagifyContributor(currentAffliationtagify);
        affiliationSuggestions.push.apply(affiliationSuggestions, affValues);
        var affSet = new Set(affiliationSuggestions);
        var affArray = [...affSet];
        affiliationSuggestions = affArray;
        var affiliationVals = affValues.join(", ");
        var roleVals = grabCurrentTagifyContributor(currentContributortagify).join(", ");
        var myCurrentCon = {
          conName:
            $("#dd-contributor-last-name").val().trim() +
            ", " +
            $("#dd-contributor-first-name").val().trim(),
          contributorFirstName: $("#dd-contributor-first-name").val().trim(),
          contributorLastName: $("#dd-contributor-last-name").val().trim(),
          conID: $("#input-con-ID").val().trim(),
          conAffliation: affiliationVals,
          conRole: roleVals,
          // conContact: "No",
        };
        for (var contributor of window.contributorArray) {
          if (contributor.conName === name) {
            window.contributorArray[window.contributorArray.indexOf(contributor)] = myCurrentCon;
            break;
          }
        }
        return [myCurrentCon];
        // if ($("#ds-contact-person").prop("checked")) {
        //   var contactPersonExists = checkContactPersonStatus("edit", ev);
        //   if (contactPersonExists) {
        //     Swal.showValidationMessage(
        //       "One corresponding author is already added above. Only corresponding author person is allowed for a dataset."
        //     );
        //   } else {
        //     var myCurrentCon = {
        //       conName:
        //         $("#dd-contributor-first-name").val().trim() +
        //         ", " +
        //         $("#dd-contributor-last-name").val().trim(),
        //       conID: $("#input-con-ID").val().trim(),
        //       conAffliation: affiliationVals,
        //       conRole: roleVals + ", CorrespondingAuthor",
        //       // conContact: "Yes",
        //     };
        //     for (var contributor of window.contributorArray) {
        //       if (contributor.conName === name) {
        //         window.contributorArray[window.contributorArray.indexOf(contributor)] = myCurrentCon;
        //         break;
        //       }
        //     }

        //     return [myCurrentCon.conName, "Yes"];
        //   }
        // } else {

        //   return [myCurrentCon.conName, "No"];
        // }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      let conName = result.value[0].conName;
      $(currentRow)[0].cells[0].innerText = conName;
      $(currentRow)[0].cells[2].innerHTML =
        `<span class="badge badge-pill badge-success">Valid</span>`;
      $(currentRow)[0].cells[1].innerText = result.value[0].conRole;
      memorizeAffiliationInfo(affiliationSuggestions);
    }
  });
};

const memorizeAffiliationInfo = (values) => {
  window.createMetadataDir();
  var content = window.parseJson(window.affiliationConfigPath);
  content["affiliation"] = values;
  window.fs.writeFileSync(window.affiliationConfigPath, JSON.stringify(content));
};

const grabCurrentTagifyContributor = (tagify) => {
  var infoArray = [];
  // var element = document.getElementById(id)
  var values = tagify.DOM.originalInput.value;
  if (values.trim() !== "") {
    var valuesArray = JSON.parse(values.trim());
    if (valuesArray.length > 0) {
      for (var val of valuesArray) {
        infoArray.push(val.value);
      }
    }
  }
  return infoArray;
};

const checkContactPersonStatus = (type, ev) => {
  //TODO: remove this functionality as it is not needed anymore
  var allConTable = document.getElementById("contributor-table-dd");
  if (type === "edit") {
    var contactPersonExists = false;
    var currentRow = $(ev).parents()[2];
    var name = $(currentRow)[0].cells[1].innerText;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      var currentContributorName = allConTable.rows[i].cells[1].innerText;
      if (currentContributorName !== name) {
        if (contactLabel === "Yes") {
          contactPersonExists = true;
          break;
        }
      }
    }
    return contactPersonExists;
  } else {
    var contactPersonExists = false;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
    return contactPersonExists;
  }
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

const checkDuplicateLink = (link, table) => {
  let duplicate = false;
  let rowcount = document.getElementById(table).rows.length;
  for (let i = 1; i < rowcount; i++) {
    let currentLink = document.getElementById(table).rows[i].cells[1].innerText;
    if (currentLink === link) {
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

// adding row for contributor table
const addNewRow = (table) => {
  $("#para-save-link-status").text("");
  $("#para-save-contributor-status").text("");
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount;
  var currentRow =
    document.getElementById(table).rows[document.getElementById(table).rows.length - 1];

  /// append row to table from the bottom
  if (table === "doi-table") {
    if (
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[1])
        .find("input")
        .val() === "" ||
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[0])
        .find("select")
        .val() === "Select"
    ) {
      $("#para-save-link-status").text("Please enter a link to add!");
    } else {
      $(".doi-helper-buttons").css("display", "inline-flex");
      $(".doi-add-row-button").css("display", "none");
      $("#select-misc-links").remove();
      // check for unique row id in case users delete old rows and append new rows (same IDs!)
      var newRowIndex = window.checkForUniqueRowID("row-current-link", rowIndex);
      var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
        "<tr id='row-current-link" +
        newRowIndex +
        "'><td><select id='select-misc-link' class='form-container-input-bf' onchange='populateProtocolLink(this)' style='font-size:13px;line-height:2;'><option value='Select'>Select an option</option><option value='Protocol URL or DOI*'>Protocol URL or DOI*</option><option value='Originating Article DOI'>Originating Article DOI</option><option value='Additional Link'>Additional Link</option></select></td><td><input type='text' contenteditable='true'></input></td><td><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"doi-table\")' class='ui right floated medium primary labeled icon button doi-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons doi-helper-buttons' style='display:none'><button onclick='delete_link(" +
        rowIndex +
        ")'' class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    }
  } else if (table === "table-current-contributors") {
    // check if all the fields are populated before Adding
    var empty = checkEmptyConRowInfo(table, currentRow);
    if (empty) {
      $("#para-save-contributor-status").text("Please fill in all the fields to add!");
      return;
    }
    if ($(currentRow).find("label").find("input")[0].checked) {
      var currentContactPersonIDNumber = $($(currentRow).find("label").find("input")[0])
        .prop("id")
        .slice(-1);
      var contactPersonBoolean = contactPersonCheck(currentContactPersonIDNumber);
      if (contactPersonBoolean) {
        $("#para-save-contributor-status").text(
          "One corresponding author is already added above. Only one corresponding author is allowed for a dataset."
        );
        return;
      }
    }
    var nameDuplicateBoolean = checkContributorNameDuplicates(table, currentRow);
    if (nameDuplicateBoolean) {
      $("#para-save-contributor-status").text("Contributor already added!");
      return;
    }
    $("#table-current-contributors .contributor-helper-buttons").css("display", "inline-flex");
    $("#table-current-contributors .contributor-add-row-button").css("display", "none");
    // check for unique row id in case users delete old rows and append new rows (same IDs!)
    var newRowIndex = window.checkForUniqueRowID("row-current-name", rowIndex);
    var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
      "<tr id='row-current-name" +
      newRowIndex +
      "'><td class='grab'><input id='ds-description-raw-contributor-list-last-" +
      newRowIndex +
      "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input id='ds-description-raw-contributor-list-first-" +
      newRowIndex +
      "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input name='id' type='text' id='input-con-ID-" +
      newRowIndex +
      "' contenteditable='true'></input></td><td class='grab'><input name='affiliation' id='input-con-affiliation-" +
      newRowIndex +
      "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
      newRowIndex +
      "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
      newRowIndex +
      ")' id='ds-contact-person-" +
      newRowIndex +
      "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
      newRowIndex +
      ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    createConsRoleTagify("input-con-role-" + newRowIndex.toString());
    createConsAffliationTagify("input-con-affiliation-" + newRowIndex.toString());
  }
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
      }).then((result) => {});
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
    loadDDFileToUI(res, "bf");

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
    $("#div-check-bf-import-dd").hide();
    $($("#div-check-bf-import-dd button")[0]).hide();
    // $($("#button-fake-confirm-existing-bf-dd-file-load").siblings()[0]).hide();
    $("#button-fake-confirm-existing-bf-dd-file-load").click();
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

const loadContributorsToTable = (array) => {
  window.contributorArray = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");

  for (var arr of array.splice(1)) {
    let splitNames = [];

    if (arr[0].trim() !== "") {
      if (arr[0].trim().includes(", ")) {
        splitNames = arr[0].trim().split(", ");
      } else {
        splitNames = arr[0].trim().split(" ");
      }
      var myCurrentCon = {
        conName: splitNames[0].trim() + ", " + splitNames[1].trim(),
        contributorFirstName: splitNames[0],
        contributorLastName: splitNames[1],
        conID: arr[1].trim(),
        conAffliation: arr[2].trim(),
        conRole: arr[3].trim(),
      };
      window.contributorArray.push(myCurrentCon);
      // var contact = "";
      // if (myCurrentCon.conRole.includes("CorrespondingAuthor")) {
      //   contact = "Yes";
      // } else {
      //   contact = "No";
      // }
      addContributortoTableDD(myCurrentCon.conName, myCurrentCon);
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
