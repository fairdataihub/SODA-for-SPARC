/*
This file contains all of the functions related to the submission.xlsx file
*/

// event listeners for opendropdown prompt
document.querySelectorAll(".submission-change-current-account").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "bf");
  });
});

document.querySelectorAll(".submission-change-current-ds").forEach((element) => {
  element.addEventListener("click", function () {
    openDropdownPrompt(null, "dataset");
  });
});

const renderMilestoneSelectionTable = (milestoneData) => {
  //create a table row element for each description array element for each milestone key in guidedMilestoneData
  const milestoneTableRows = Object.keys(milestoneData)
    .map((milestoneKey) => {
      const milestoneDescriptionArray = milestoneData[milestoneKey];
      const milestoneDescriptionTableRows = milestoneDescriptionArray.map(
        (milestoneDescription) => {
          const descriptionString = milestoneDescription["Description of data"];
          const milestoneString = milestoneKey;
          const completionDateString = milestoneDescription["Expected date of completion"];
          return generateMilestoneRowElement(
            descriptionString,
            milestoneString,
            completionDateString
          );
        }
      );
      return milestoneDescriptionTableRows.join("");
    })
    .join("\n");
  const milestonesTableContainer = document.getElementById("milestones-table-container");
  milestonesTableContainer.innerHTML = milestoneTableRows;
};

const openSubmissionMultiStepSwal = async (curationMode, sparcAward, milestoneRes) => {
  //add a custom milestone row for when the user wants to add a custom milestone
  //not included in the dataset deliverables document
  milestoneRes["N/A"] = [
    {
      "Description of data":
        "Select this option when the dataset you are submitting is not related to a pre-agreed milestone",
      "Expected date of completion": "N/A",
    },
  ];

  let milestoneData;
  let completionDate;
  const milestoneValues = await Swal.mixin({
    confirmButtonText: "Next &rarr;",
    showCancelButton: true,
    progressSteps: ["1", "2"],
    width: 900,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    allowOutsideClick: false,
  }).queue([
    {
      title: "Select the milestones associated with this submission:",
      html: `
          <div class="scrollable-swal-content-container" id="milestone-selection-table-container">
             <table
                class="ui celled striped table"
                id="milestones-table"
                style="margin-bottom: 25px; width: 800px"
              >
                <thead>
                  <tr>
                    <th></th>
                    <th>Description</th>
                    <th>Milestone</th>
                    <th class="center aligned">Completion date</th>
                  </tr>
                </thead>
                <tbody id="milestones-table-container"></tbody>
              </table>
        
          </div>
        `,
      didOpen: () => {
        renderMilestoneSelectionTable(milestoneRes);
      },
      preConfirm: () => {
        const checkedMilestoneData = getCheckedMilestones();
        checkedMilestoneData.length === 0
          ? Swal.showValidationMessage("Please select at least one milestone")
          : (milestoneData = checkedMilestoneData);
      },
    },
    {
      title: "Select the completion date associated with this submission:",
      html: `
          <div class="scrollable-swal-content-container">
            <div class="justify-center">
              <div class="ui form">
                <div
                  class="grouped fields"
                  id="guided-completion-date-container"
                  style="align-items: center"
                ></div>
              </div>
            </div>
          </div>
        `,
      didOpen: () => {
        // get a unique set of completionDates from checkedMilestoneData
        const uniqueCompletionDates = Array.from(
          new Set(milestoneData.map((milestone) => milestone.completionDate))
        );

        if (uniqueCompletionDates.length === 1) {
          //save the completion date into sodaJSONObj
          completionDate = uniqueCompletionDates[0];
          // Add a radio button for the unique completion date
          document.getElementById("guided-completion-date-container").innerHTML =
            createCompletionDateRadioElement("completion-date", completionDate);
          //check the completion date
          document.querySelector(
            `input[name="completion-date"][value="${completionDate}"]`
          ).checked = true;
        }

        if (uniqueCompletionDates.length > 1) {
          //filter value 'N/A' from uniqueCompletionDates
          const filteredUniqueCompletionDates = uniqueCompletionDates.filter(
            (date) => date !== "N/A"
          );

          //create a radio button for each unique date
          const completionDateCheckMarks = filteredUniqueCompletionDates
            .map((completionDate) => {
              return createCompletionDateRadioElement("completion-date", completionDate);
            })
            .join("\n");
          document.getElementById("guided-completion-date-container").innerHTML =
            completionDateCheckMarks;
        }
      },
      preConfirm: () => {
        const selectedCompletionDate = document.querySelector(
          "input[name='completion-date']:checked"
        );
        if (!selectedCompletionDate) {
          Swal.showValidationMessage("Please select a completion date");
        } else {
          completionDate = selectedCompletionDate.value;
        }
      },
    },
  ]);

  if (milestoneData && completionDate) {
    console.log("curaion mode: ", curationMode);
    // Fill the SPARC award input with the imported SPARC award if it was found (otherwise it will be an empty string)
    if (curationMode === "free-form") {
      document.getElementById("submission-sparc-award").value = sparcAward;
    }
    if (curationMode === "guided") {
      document.getElementById("guided-submission-sparc-award-manual").value = sparcAward;
    }

    // // // // // // // // // // // // end sparc award // // // // // // // // // // // //

    // Remove duplicate milestones from milestoneData and add them to the tagify input
    const uniqueMilestones = Array.from(
      new Set(milestoneData.map((milestone) => milestone.milestone))
    );

    if (curationMode === "free-form") {
      milestoneTagify1.removeAllTags();
      milestoneTagify1.addTags(uniqueMilestones);
    }
    if (curationMode === "guided") {
      guidedSubmissionTagsTagifyManual.removeAllTags();
      guidedSubmissionTagsTagifyManual.addTags(uniqueMilestones);
    }

    // // // // // // // // // // // // end milestone tags // // // // // // // // // // // //

    if (curationMode === "free-form") {
      // Add the completion date to the completion date dropdown and select it
      const completionDateInput = document.getElementById("submission-completion-date");
      completionDateInput.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
      completionDateInput.value = completionDate;
    }
    if (curationMode === "guided") {
      // Add the completion date to the completion date dropdown and select it
      const completionDateInput = document.getElementById(
        "guided-submission-completion-date-manual"
      );
      completionDateInput.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
      completionDateInput.value = completionDate;
    }

    if (curationMode === "guided") {
      // Hide the milestone selection section and show the submission metadata section
      const sectionThatAsksIfDataDeliverablesReady = document.getElementById(
        "guided-section-user-has-data-deliverables-question"
      );
      const sectionSubmissionMetadataInputs = document.getElementById(
        "guided-section-submission-metadata-inputs"
      );
      const sectionDataDeliverablesImport = document.getElementById(
        "guided-section-import-data-deliverables-document"
      );
      sectionThatAsksIfDataDeliverablesReady.classList.add("hidden");
      sectionDataDeliverablesImport.classList.add("hidden");
      sectionSubmissionMetadataInputs.classList.remove("hidden");
    }
  }
};

const importSubmissionMetadataFromDataDeliverablesDocument = async (
  curationMode,
  dataDeliverablesDocumentFilePath
) => {
  const extract_milestone = await client.get(`/prepare_metadata/import_milestone`, {
    params: {
      path: dataDeliverablesDocumentFilePath,
    },
  });

  const res = extract_milestone.data;

  // Get the SPARC award and milestone data from the response
  const importedSparcAward = res["sparc_award"];
  const milestoneObj = res["milestone_data"];

  await openSubmissionMultiStepSwal(curationMode, importedSparcAward, milestoneObj);
};

document.querySelectorAll(".button-import-data-deliverables-document").forEach(async (button) => {
  button.addEventListener("click", async () => {
    // First get the filepath from the user
    let dataDeliverablesDocumentFilePath = "";

    const result = await Swal.fire({
      title: "Importing the Data Deliverables document",
      html: `
        <div class="container-milestone-upload" style="display: flex;margin:10px">
          <input class="milestone-upload-text" id="input-milestone-select" onclick="openDDDimport()" style="text-align: center;height: 40px;border-radius: 0;background: #f5f5f5; border: 1px solid #d0d0d0; width: 100%" type="text" readonly placeholder="Browse here"/>
        </div>
      `,
      heightAuto: false,
      showCancelButton: true,
      backdrop: "rgba(0,0,0, 0.4)",
      preConfirm: () => {
        const inputSelectDataDeliverablesPath = $("#input-milestone-select");
        if (inputSelectDataDeliverablesPath.attr("placeholder") === "Browse here") {
          Swal.showValidationMessage("Please select a file");
        } else {
          dataDeliverablesDocumentFilePath = inputSelectDataDeliverablesPath.attr("placeholder"); // Set the file path
          return true;
        }
      },
    });
    if (!result.isConfirmed) {
      console.log("User cancelled the operation");
      return; // Exit early if the user does not import a file
    }

    const buttonId = button.id;
    let curationMode = null;
    if (buttonId === "button-ffm-import-data-deliverables-document") {
      curationMode = "free-form";
    }
    if (buttonId === "button-guided-import-data-deliverables-document") {
      curationMode = "guided";
    }

    try {
      await importSubmissionMetadataFromDataDeliverablesDocument(
        curationMode,
        dataDeliverablesDocumentFilePath
      );
    } catch (error) {
      console.log(error);
      clientError(error);
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: userErrorMessage(error),
      });
    }
  });
});

let guidedMilestoneData = {};

const createCompletionDateRadioElement = (name, label) => {
  return `
    <div class="field" style="width: auto !important">
      <div class="ui radio checkbox">
        <input type="radio" name='${name}' value='${label}'>
        <label>${label}</label>
      </div>
    </div>
  `;
};

const handleMilestoneClick = () => {
  //get all checked checkboxes with name "milestone" vanilla js
  const checkedMilestones = document.querySelectorAll("input[name='milestone']:checked");
  //convert checkMilestones to array of checkMilestones values
  const checkedMilestonesArray = Array.from(checkedMilestones);
  //get the values of checkedMilestonesArray
  const checkedMilestonesValues = checkedMilestonesArray.map(
    (checkMilestone) => checkMilestone.value
  );
  const completionDatesToCheck = [];
  for (const milestone of checkedMilestonesValues) {
    for (const task of guidedMilestoneData[milestone]) {
      completionDatesToCheck.push(task["Expected date of completion"]);
    }
  }

  const completionDatesToCheckArray = Array.from(new Set(completionDatesToCheck));
  const completionDateRadioElements = completionDatesToCheckArray
    .map((completionDate) => createCompletionDateRadioElement("completion-date", completionDate))
    .join("\n");
  //replace the current completion-date-radio-elements with the new ones
  const completionDateRadioElementContainer = document.getElementById(
    "guided-completion-date-checkbox-container"
  );
  completionDateRadioElementContainer.innerHTML = completionDateRadioElements;
};

const generateMilestoneRowElement = (dataDescription, milestoneString, dateString) => {
  return `
    <tr>
      <td class="middle aligned collapsing text-center">
        <div class="ui fitted checkbox">
          <input type="checkbox" name="milestone" value="${dataDescription}">
          <label></label>
        </div>
      </td>
      <td class="middle aligned">
        ${dataDescription}
      </td>
      <td class="middle aligned">
        ${milestoneString}
      </td>
      <td class="middle aligned collapsing"> 
        ${dateString}
      </td>
    </tr>
  `;
};

//create an array of values for checked checkboxes with the name "milestone"
const getCheckedMilestones = () => {
  const checkedMilestones = document.querySelectorAll("input[name='milestone']:checked");
  const checkedMilestonesArray = Array.from(checkedMilestones);
  //get first tr parent for each checkedMilestonesArray element
  const checkedMilestoneData = checkedMilestonesArray.map((checkMilestone) => {
    const tableRow = checkMilestone.parentElement.parentElement.parentElement;
    const description = tableRow.children[1].innerHTML.trim();
    const milestone = tableRow.children[2].innerHTML.trim();
    const completionDate = tableRow.children[3].innerHTML.trim();

    return {
      description: description,
      milestone: milestone,
      completionDate: completionDate,
    };
  });
  return checkedMilestoneData;
};

const openDDDimport = async (curationMode) => {
  let filepath = await ipcRenderer.invoke("open-file-dialog-data-deliverables");
  if (filepath.length > 0) {
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Metadata - submission - import-DDD",
      "Data Deliverables Document",
      1
    );
    if (curationMode === "guided") {
      sodaJSONObj["dataset-metadata"]["submission-metadata"]["filepath"] = filepath[0];
      let swal_container = document.getElementsByClassName("swal2-popup")[0];
      let swal_actions = document.getElementsByClassName("swal2-actions")[0];
      let swal_content = document.getElementsByClassName("swal2-content")[0];
      let DDLottie = document.getElementById("swal-data-deliverable");
      let swal_header = document.getElementsByClassName("swal2-header")[0];
      //append file path
      DDLottie.innerHTML = "";
      let firstItem = swal_content.children[0];
      let paragraph = document.createElement("p");
      let paragraph2 = document.createElement("p");
      paragraph.id = "getting-started-filepath";
      paragraph2.innerText =
        "To replace the current Data Deliverables just drop in or select a new one.";
      paragraph2.style.marginBottom = "1rem";
      paragraph.style.marginTop = "1rem";
      paragraph.style.fontWeight = "700";
      paragraph.innerText = "File Path: " + filepath[0];
      if (firstItem.children[0].id === "getting-started-filepath") {
        firstItem.children[0].remove();
        firstItem.children[firstItem.childElementCount - 1].remove();
      }
      firstItem.append(paragraph2);
      firstItem.prepend(paragraph);
      lottie.loadAnimation({
        container: DDLottie,
        animationData: successCheck,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      document.getElementById("guided-button-import-data-deliverables").click();
      document.getElementsByClassName("swal2-confirm")[0].style.display = "block";
    } else {
      document.getElementById("input-milestone-select").placeholder = filepath[0];
      // log the successful attempt to import a data deliverables document from the user's computer
    }
  }
};

function onboardingSubmission() {
  const introOptions = {
    steps: [
      {
        element: document.querySelector("#button-ffm-import-data-deliverables-document"),
        intro:
          "Click here to import your Data Deliverables document for SODA to automatically retrieve your milestone and completion date.",
      },
    ],
    dontShowAgain: true,
    exitOnEsc: false,
    exitOnOverlayClick: false,
    disableInteraction: false,
  };

  introJs()
    .setOptions(introOptions)
    .onbeforeexit(() => {
      introStatus.submission = true;
    })
    .start();
}

function validateSubmissionFileInputs() {
  const fundingConsortiumFromDropdown = $("#ffm-select-sparc-funding-consortium").val();
  if (fundingConsortiumFromDropdown === "") {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: "Please select a funding consortium.",
      title: "Incomplete information",
    });
    return false;
  }

  const awardNumber = $("#submission-sparc-award").val();
  const completionDate = $("#submission-completion-date").val();
  const milestones = getTagsFromTagifyElement(milestoneTagify1);
  if (awardNumber === "") {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: "Please enter an award number.",
      title: "Incomplete information",
    });
    return false;
  }
  if (completionDate === "") {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: "Please enter a completion date.",
      title: "Incomplete information",
    });
    return false;
  }
  if (milestones.length === 0) {
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      text: "Please enter at least one milestone.",
      title: "Incomplete information",
    });
    return false;
  }

  // If all the above checks pass, then return true
  return true;
}

const sparcFundingConsortiums = ["SPARC", "SPARC-2", "VESPA", "REVA", "HORNET"];

// Set the funding consortium dropdown options / set up select picker
document.getElementById("ffm-select-sparc-funding-consortium").innerHTML = `
  <option value="">Select a funding consortium</option>
    ${sparcFundingConsortiums
      .map((consortium) => {
        return `<option value="${consortium}">${consortium}</option>`;
      })
      .join("\n")}
`;
$("#ffm-select-sparc-funding-consortium").selectpicker({
  style: "SODA-select-picker",
});
$("#ffm-select-sparc-funding-consortium").selectpicker("refresh");
// Event listener that watches what the user selects and updates the UI accordingly
$("#ffm-select-sparc-funding-consortium").on("change", function (e) {
  const consortium = e.target.value;
  const generateSubmissionButton = document.getElementById("button-generate-submission");

  // Show the generate submission button if the user has selected a funding consortium
  if (consortium === "") {
    generateSubmissionButton.classList.add("hidden");
  } else {
    generateSubmissionButton.classList.remove("hidden");
  }

  // Handle the instructions for the individual form fields
  const RequiredFieldsIfSubmissionIsSparc = document.querySelectorAll(
    ".submission-required-if-sparc-funding-consortium"
  );
  if (consortium === "SPARC") {
    RequiredFieldsIfSubmissionIsSparc.forEach((label) => {
      label.classList.add("required");
    });
    hideElementsWithClass("non-sparc-funding-consortium-instructions");
    showElementsWithClass("sparc-funding-consortium-instructions");
  } else {
    RequiredFieldsIfSubmissionIsSparc.forEach((label) => {
      label.classList.remove("required");
    });
    showElementsWithClass("non-sparc-funding-consortium-instructions");
    hideElementsWithClass("sparc-funding-consortium-instructions");
  }

  const containerDddImportButton = document.getElementById("container-ddd-import-button");
  if (consortium === "SPARC") {
    // Show the DDD import button
    containerDddImportButton.classList.remove("hidden");
    // Show the submission onboarding if the user hasn't seen it yet
    if (!introStatus.submission) {
      onboardingSubmission();
    }
  } else {
    // Hide the DDD import button
    containerDddImportButton.classList.add("hidden");
  }
});
const resetFundingConsortiumDropdown = () => {
  $("#ffm-select-sparc-funding-consortium").val("").change();
};

resetFundingConsortiumDropdown();
var submissionDestinationPath = "";

$(document).ready(function () {
  ipcRenderer.on("selected-existing-submission", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById("existing-submission-file-destination").placeholder = filepath[0];

        if (
          document.getElementById("existing-submission-file-destination").placeholder !==
          "Browse here"
        ) {
          $("#div-confirm-existing-submission-import").show();
          $($("#div-confirm-existing-submission-import button")[0]).show();
        } else {
          $("#div-confirm-existing-submission-import").hide();
          $($("#div-confirm-existing-submission-import button")[0]).hide();
        }
      } else {
        document.getElementById("existing-submission-file-destination").placeholder = "Browse here";
        $("#div-confirm-existing-submission-import").hide();
      }
    } else {
      document.getElementById("existing-submission-file-destination").placeholder = "Browse here";
      $("#div-confirm-existing-submission-import").hide();
    }
  });
  // generate submission file
  ipcRenderer.on("selected-destination-generate-submission-locally", (event, dirpath) => {
    if (dirpath.length > 0) {
      document.getElementById("input-destination-generate-submission-locally").placeholder =
        dirpath[0];
      var destinationPath = path.join(dirpath[0], "submission.xlsx");
      submissionDestinationPath = destinationPath;
      $("#div-confirm-destination-submission-locally").css("display", "flex");
      $($("#div-confirm-destination-submission-locally").children()[0]).css("display", "flex");
    } else {
      document.getElementById("input-destination-generate-submission-locally").placeholder =
        "Browse here";
      $("#div-confirm-destination-submission-locally").css("display", "none");
    }
  });

  $("#bf_dataset_load_submission").on("DOMSubtreeModified", function () {
    if (
      $("#Question-prepare-submission-2").hasClass("show") &&
      !$("#Question-prepare-submission-6").hasClass("show")
    ) {
      $("#Question-prepare-submission-2").removeClass("show");
    }
    if ($("#bf_dataset_load_submission").text().trim() !== "None") {
      $("#div-check-bf-import-submission").css("display", "flex");
      $($("#div-check-bf-import-submission").children()[0]).show();
    } else {
      $("#div-check-bf-import-submission").css("display", "none");
    }
  });

  $("#bf_dataset_generate_submission").on("DOMSubtreeModified", function () {
    if ($("#bf_dataset_generate_submission").text().trim() !== "None") {
      $("#div-check-bf-generate-submission").css("display", "flex");
    } else {
      $("#div-check-bf-generate-submission").css("display", "none");
    }
  });
});

//Function is used for when user is creating Metadata files locally
//At most the metadata files should be no bigger than 3MB
//Function checks the selected storage device to ensure at least 3MB are available
const checkStorage = (id) => {
  var location = id;
  var threeMB = 3145728;
  checkDiskSpace(location).then((diskSpace) => {
    freeMem = diskSpace.free;
    if (freeMem < threeMB) {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "OK",
        heightAuto: false,
        icon: "warning",
        showCancelButton: false,
        title: "Not enough space",
        text: "Please free up at least 3MB",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      ipcRenderer.send(
        "track-event",
        "Error",
        "Prepare Metadata - Generate - Check Storage Space",
        "Free memory: " + freeMem + "\nMemory needed: " + threeMB,
        1
      );

      // stop execution to avoid logging a success case for the storage space check
      return;
    }

    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Metadata - Generate - Check Storage Space",
      "Free memory: " + freeMem + "\nMemory needed: " + threeMB,
      1
    );
  });
};
const localSubmissionBtn = document.getElementById("btn-confirm-local-submission-destination");
const localDDBtn = document.getElementById("btn-confirm-local-dd-destination");
const localSubjectsBtn = document.getElementById("btn-confirm-local-subjects-destination");
const localSamplesBtn = document.getElementById("btn-confirm-local-samples-destination");
const localChangesBtn = document.getElementById("btn-confirm-local-changes-destination");
const localReadmeBtn = document.getElementById("btn-confirm-local-readme-destination");
//event listeners for each button since each one uses a different ID
localSubmissionBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-submission-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localDDBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document.getElementById("input-destination-generate-dd-locally").getAttribute("placeholder")
    );
  },
  false
);
localSubjectsBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-subjects-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localSamplesBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-samples-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localChangesBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-changes-locally")
        .getAttribute("placeholder")
    );
  },
  false
);
localReadmeBtn.addEventListener(
  "click",
  function () {
    checkStorage(
      document
        .getElementById("input-destination-generate-readme-locally")
        .getAttribute("placeholder")
    );
  },
  false
);

const generateSubmissionHelper = async (uploadBFBoolean) => {
  let datasetName = $("#bf_dataset_load_submission").text().trim();
  if (uploadBFBoolean) {
    // Run pre-flight checks before uploading the submission file to Pennsieve
    let supplementary_checks = await run_pre_flight_checks(false);
    if (!supplementary_checks) {
      return;
    }

    // Check if dataset is locked after running pre-flight checks
    const isLocked = await api.isDatasetLocked(defaultBfAccount, datasetName);

    if (isLocked) {
      await Swal.fire({
        icon: "info",
        title: `${datasetName} is locked from editing`,
        html: `
              This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
              <br />
              <br />
              If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
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

    let { value: continueProgress } = await Swal.fire({
      title:
        "Any existing submission.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
      title: "Any existing submission.xlsx file in the specified location will be replaced.",
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
    title: "Generating the submission.xlsx file",
    html: "Please wait...",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.showLoading();
    },
  });

  const fundingConsortiumFromDropdown = $("#ffm-select-sparc-funding-consortium").val();

  const submissionIsSparc = $("#ffm-select-sparc-funding-consortium").val() === "SPARC";

  const awardNumber = $("#submission-sparc-award").val();
  const milestones = getTagsFromTagifyElement(milestoneTagify1);
  const completionDate = $("#submission-completion-date").val();

  if (milestonesRes !== "") {
    milestoneValue = JSON.parse(milestonesRes);
  }

  const submissionMetadataArray = [];

  submissionMetadataArray.push({
    fundingConsortium: "SPARC",
    consortiumDataStandard: consortiumDataStandard,
    award: submissionIsSparc ? awardNumber : "",
    date: submissionIsSparc ? completionDate : "",
    milestone: submissionIsSparc ? milestones[0] : "",
  });

  if (submissionIsSparc && milestones.length > 1) {
    for (let i = 1; i < milestones.length; i++) {
      submissionMetadataArray.push({
        fundingConsortium: "",
        consortiumDataStandard: "",
        award: "",
        date: "",
        milestone: milestones[i],
      });
    }
  }

  client
    .post(
      `/prepare_metadata/submission_file`,
      {
        submission_file_rows: json_arr,
        filepath: submissionDestinationPath,
        upload_boolean: uploadBFBoolean,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: datasetName,
        },
      }
    )
    .then((res) => {
      let successMessage = "";
      if (uploadBFBoolean) {
        successMessage =
          "Successfully generated the submission.xlsx file on your Pennsieve dataset.";
      } else {
        successMessage =
          "Successfully generated the submission.xlsx file at the specified location.";
      }
      Swal.fire({
        title: successMessage,
        icon: "success",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Ok",
        allowOutsideClick: true,
      });

      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );

      // get the size of the uploaded file from the result
      const { size } = res.data;

      // log the size of the metadata file that was generated at varying levels of granularity
      logMetadataSizeForAnalytics(uploadBFBoolean, "submission.xlsx", size);
    })
    .catch((error) => {
      clientError(error);
      let emessage = userErrorMessage(error);
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        html: emessage,
        title: "Failed to generate the submission file",
      });

      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );
    });
};

$("#submission-completion-date").change(function () {
  const text = $("#submission-completion-date").val();
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
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        $("#submission-completion-date").append(
          $("<option>", {
            value: input_date,
            text: input_date,
          })
        );
        var $option = $("#submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#input-milestone-select-reupload").click(function () {
  document.getElementById("para-milestone-document-info-long-reupload").style.display = "none";
  ipcRenderer.send("open-file-dialog-milestone-doc-reupload");
});

$("#cancel-reupload-DDD").click(function () {
  $("#Question-prepare-submission-reupload-DDD").removeClass("show prev");
  $("#div-confirm-select-SPARC-awards").show();
  $("#div-confirm-select-SPARC-awards button").show();
  $("#div-confirm-select-SPARC-awards button").click();
});

// import existing Changes/README file
function showExistingSubmissionFile(type) {
  if (
    $(`#existing-submission-file-destination`).prop("placeholder") !== "Browse here" &&
    $(`#Question-prepare-submission-2`).hasClass("show")
  ) {
    Swal.fire({
      title: `Are you sure you want to import a different submission file?`,
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send(`open-file-dialog-existing-submission`);
        document.getElementById(`existing-submission-file-destination`).placeholder = "Browse here";
        $(`#div-confirm-existing-submission-import`).hide();
        $($(`#div-confirm-existing-submission-import button`)[0]).hide();
        $(`#Question-prepare-submission-2`).removeClass("show");
      }
    });
  } else {
    ipcRenderer.send(`open-file-dialog-existing-submission`);
  }
}

function openFileBrowserDestination(metadataType) {
  ipcRenderer.send(`open-destination-generate-${metadataType}-locally`);
}

function importExistingSubmissionFile(type) {
  var filePath = $(`#existing-submission-file-destination`).prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire("No file chosen", `Please select a path to your submission.xlsx file`, "error");

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  } else {
    if (path.parse(filePath).base !== "submission.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: `Your file must be named submission.xlsx to be imported to SODA.`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBMISSION,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
    } else {
      Swal.fire({
        title: `Loading an existing submission.xlsx file`,
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
      setTimeout(loadExistingSubmissionFile(filePath), 1000);
    }
  }
}

// function to load existing submission files
async function loadExistingSubmissionFile(filepath) {
  log.info(`Loading existing submission file: ${filepath}`);
  try {
    let load_submission_file = await client.get(`/prepare_metadata/submission_file`, {
      params: {
        filepath,
      },
    });

    let res = load_submission_file.data;
    loadSubmissionFileToUI(res, "local");
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: "Failed to load the existing submission.xlsx file.",
      html: userErrorMessage(error),
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error",
    });
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

function loadSubmissionFileToUI(data, type) {
  console.log(data);
  milestoneTagify1.removeAllTags();
  removeOptions(descriptionDateInput);
  addOption(descriptionDateInput, "Select an option", "Select");
  $("#submission-completion-date").val("Select");
  $("#submission-sparc-award").val("");
  // 1. populate milestones
  if (typeof data["Milestone achieved"] === "string") {
    milestoneTagify1.addTags(data["Milestone achieved"]);
  } else {
    for (var milestone of data["Milestone achieved"]) {
      console.log(milestone);
      milestoneTagify1.addTags(milestone);
    }
  }
  // 2. populate SPARC award
  if (data["SPARC Award number"] !== "") {
    $("#submission-sparc-award").val(data["SPARC Award number"]);
  }
  // 3. populate Completion date
  if (data["Milestone completion date"] !== "") {
    addOption(
      descriptionDateInput,
      data["Milestone completion date"],
      data["Milestone completion date"]
    );
    // HERE BOI
    $("#submission-completion-date").append(
      $("<option>", {
        text: "Enter my own date",
      })
    );
    $("#submission-completion-date").val(data["Milestone completion date"]);
  }
  Swal.fire({
    title: "Loaded successfully!",
    icon: "success",
    showConfirmButton: false,
    timer: 500,
    timerProgressBar: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
    },
  });

  logMetadataForAnalytics(
    "Success",
    MetadataAnalyticsPrefix.SUBMISSION,
    AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
    "Existing",
    type === "local" ? Destinations.LOCAL : Destinations.PENNSIEVE
  );

  if (type === "local") {
    $("#div-confirm-existing-submission-import").hide();
    $($("#div-confirm-existing-submission-import button")[0]).hide();
    $("#button-fake-confirm-existing-submission-file-load").click();
  } else {
    $("#div-check-bf-import-submission").hide();
    $($("#div-check-bf-import-submission button")[0]).hide();
    $("#button-fake-confirm-existing-bf-submission-file-load").click();
  }
}

// function to check for existing submission file on Penn
async function checkBFImportSubmission() {
  Swal.fire({
    title: "Importing the submission.xlsx file",
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
  }).then((result) => {});
  const bfDataset = $("#bf_dataset_load_submission").text().trim();
  log.info(`Loading submission file from Pennsieve dataset: ${bfDataset}`);
  try {
    let import_metadata = await client.get(`/prepare_metadata/import_metadata_file`, {
      params: {
        file_type: "submission.xlsx",
        selected_account: defaultBfAccount,
        selected_dataset: bfDataset,
      },
    });
    let res = import_metadata.data;

    loadSubmissionFileToUI(res, "bf");
  } catch (error) {
    clientError(error);

    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "error",
      html: error.response.data.message,
    });
    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBMISSION,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.PENNSIEVE
    );
  }
}
