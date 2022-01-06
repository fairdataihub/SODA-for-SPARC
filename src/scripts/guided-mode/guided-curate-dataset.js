const getOrganizationMembers = async () => {
  sodaOrganizationId = "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0";

  // get the user's access token
  let jwt = await get_access_token();

  // fetch the readme file from the Pennsieve API at the readme endpoint (this is because the description is the subtitle not readme )
  let organizationMembersResponse = await fetch(
    `https://api.pennsieve.io/organizations/${sodaOrganizationId}/members`,
    {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    }
  );

  // get the status code out of the response
  let statusCode = organizationMembersResponse.status;

  // check the status code of the response
  switch (statusCode) {
    case 200:
      // success do nothing
      break;
    case 404:
      throw new Error(
        `${statusCode} - The dataset you selected cannot be found. Please select a valid dataset.`
      );
    case 401:
      throw new Error(
        `${statusCode} - You cannot get the dataset readme while unauthenticated. Please reauthenticate and try again.`
      );
    case 403:
      throw new Error(
        `${statusCode} - You do not have access to this dataset. `
      );

    default:
      // something unexpected happened
      let statusText = await organizationMembersResponse.json().statusText;
      throw new Error(`${statusCode} - ${statusText}`);
  }

  // grab the organization members out of the response
  let organizationMembers = await organizationMembersResponse.json();

  return organizationMembers;
};

//SHARED VARIABLES

const guided_dataset_name = $("#guided-dataset-name-input");
const guided_dataset_subtitle = document.getElementById(
  "guided-dataset-subtitle-input"
);
const guided_dataset_subtitle_char_count = document.getElementById(
  "guided-subtitle-char-count"
);

const create_dataset_button = $("#guided-create-empty-dataset");
let current_selected_folder = $("#code-card");
let current_progression_tab = $("#prepare-dataset-progression-tab");
let current_sub_step = $("#guided-make-pi-owner-tab");
let current_sub_step_capsule = $("#guided-basic-description-capsule");

const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};
const disableProgressButton = () => {
  $("#guided-next-button").prop("disabled", true);
};

/////////////////////////////////////////////////////////
//////////       GUIDED FORM VALIDATORS       ///////////
/////////////////////////////////////////////////////////

const validateGuidedBasicDescriptionInputs = () => {
  //True if dataset name and dataset subtitle inputs are valid
  if (
    check_forbidden_characters_bf(
      $("#guided-dataset-name-input").val().trim()
    ) ||
    $("#guided-dataset-name-input").val().trim().length == 0 ||
    $("#guided-dataset-subtitle-input").val().trim().length == 0
  ) {
    disableProgressButton();
  } else {
    enableProgressButton();
  }
};

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

$(document).ready(() => {
  getOrganizationMembers().then((data) =>
    data.map((x) => {
      console.log(x);
      $("#guided-bf-users-select-pi").append(
        $(
          "<option>",
          {
            value: 1,
            text: `${x.firstName} ${x.lastName} (${x.email})`,
          },
          onclick
        )
      );
    })
  );

  $(".guided--text-data-description").on("keyup", function () {
    validateGuidedDatasetDescriptionInputs();
  });

  //Handles high-level progress and their respective panels opening and closing
  $(".guided--progression-tab").on("click", function () {
    const selectedTab = $(this);
    selectedTab.siblings().removeClass("selected-tab");
    selectedTab.addClass("selected-tab");

    const tabPanelId = selectedTab
      .attr("id")
      .replace("progression-tab", "parent-tab");
    const tabPanel = $("#" + tabPanelId);
    tabPanel.siblings().hide();
    tabPanel.show();
  });
  //click new dataset card until from existing and from Pennsieve functionalities are built.
  $("#guided-curate-new-dataset-card").click();
  $("#guided-dataset-name-input").on("keyup", () => {
    let newName = $("#guided-dataset-name-input").val().trim();
    if (newName !== "") {
      if (check_forbidden_characters_bf(newName)) {
        $("#guided-dataset-name-input-warning-message").text(
          "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>."
        );
        $("#guided-dataset-name-input-warning-message").show();
        disableProgressButton();
      } else {
        /*change this to continue button $("#create-pennsieve-dataset").hide(); */
        $("#guided-dataset-name-input-warning-message").hide();
        validateGuidedBasicDescriptionInputs();
      }
    } else {
      $("#guided-dataset-name-input-warning-message").hide();
    }
  });

  $("#guided-dataset-subtitle-input").on("keyup", () => {
    countCharacters(
      guided_dataset_subtitle,
      guided_dataset_subtitle_char_count
    );
    validateGuidedBasicDescriptionInputs();
  });

  $("#prepare-dataset-tab").on("click", () => {
    $("#guided-basic-description-tab").hide();
    $("#guided-prepare-dataset-parent-tab").css("display", "flex");
  });

  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
  });

  $(".guided--card-container > div").on("click", function () {
    $(this).attr("data-enable-next-button") == "true"
      ? enableProgressButton()
      : disableProgressButton();
    const selectedTab = $(this);
    selectedTab.siblings().removeClass("checked");
    selectedTab.siblings().addClass("non-selected");
    selectedTab.removeClass("non-selected");
    selectedTab.addClass("checked");

    const tabPanelId = selectedTab.attr("id").replace("-card", "-panel");
    const tabPanel = $("#" + tabPanelId);
    tabPanel.siblings().hide();
    tabPanel.css("display", "flex");
  });

  $("#pennsieve-account-confirm-button").on("click", () => {
    sodaJSONObj["generate-dataset"]["destination"] = "bf";
    sodaJSONObj["bf-account-selected"]["account-name"] =
      $("#guided-bf-account").text();
    enableProgressButton();
    $("#guided-next-button").click();
  });

  $("#guided-dataset-name-confirm-button").on("click", () => {
    enableProgressButton();
    $("#guided-next-button").click();
  });

  const complete_curr_question = (questionID) => {
    questionID.css("opacity", ".5");
    nextQuestion = questionID.next();
    nextQuestion.css("display", "flex");
    nextId = nextQuestion.attr("id");
    document.getElementById(nextId).scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  //next button click handler
  $("#guided-next-button").on("click", () => {
    //individual sub step processes

    //1st: create guided mode sodaObj, append properties per user input
    if (current_sub_step.attr("id") == "guided-basic-description-tab") {
      sodaJSONObj["bf-account-selected"] = {};
      sodaJSONObj["mode"] = "guided";
      sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
      sodaJSONObj["generate-dataset"] = {};
      sodaJSONObj["manifest-files"] = {};
      sodaJSONObj["metadata-files"] = {};
      sodaJSONObj["starting-point"] = {};

      //set starting point to local for now for curate new dataset until new dataset functionality implemented
      if ($("#guided-curate-new-dataset-card").hasClass("checked")) {
        sodaJSONObj["starting-point"]["type"] = "local";
      }
      if ($("#guided-curate-new-dataset-card").hasClass("checked")) {
        sodaJSONObj["starting-point"]["type"] = "local";
      }
      datasetStructureJSONObj = { folders: {}, files: {} };
      sodaJSONObj["metadata"] = {};
      let datasetName = $("#guided-dataset-name-input").val().trim();
      sodaJSONObj["generate-dataset"]["dataset-name"] = datasetName;
      $("#guided-bf-dataset-name-confirm").text(datasetName);
      sodaJSONObj["metadata"]["subtitle"] = $("#guided-dataset-subtitle-input")
        .val()
        .trim();
    }

    if (current_sub_step.attr("id") == "guided-dataset-generation-tab") {
      if ($("#generate-dataset-local-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "local";
      }
      if ($("#generate-dataset-pennsieve-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }

    if (current_sub_step.attr("id") == "guided-dataset-generate-location-tab") {
      if ($("#guided-generate-dataset-local-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "local";
      }
      if ($("#guided-generate-dataset-pennsieve-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }

    if (
      current_sub_step.attr("id") == "guided-dataset-generate-destination-tab"
    ) {
      if ($("#guided-generate-dataset-new-card").hasClass("checked")) {
        confirmed_dataset_name = $("#guided-bf-dataset-name-confirm").text();
        sodaJSONObj["generate-dataset"]["dataset-name"] =
          confirmed_dataset_name;
      }
      sodaJSONObj["generate-dataset"]["generate-option"] = "new";
      sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
      sodaJSONObj["generate-dataset"]["if-existing-files"] = "create-duplicate";

      if ($("#guided-generate-dataset-pennsieve-card").hasClass("checked")) {
        sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }

    if (current_sub_step.attr("id") == "add-edit-description-tab") {
      sodaJSONObj["digital-metadata"]["study-purpose"] = $(
        "#guided-ds-description-study-purpose"
      )
        .val()
        .trim();
      sodaJSONObj["digital-metadata"]["data-collection"] = $(
        "#guided-ds-description-data-collection"
      )
        .val()
        .trim();
      sodaJSONObj["digital-metadata"]["primary-conclusion"] = $(
        "#guided-ds-description-primary-conclusion"
      )
        .val()
        .trim();
      console.log("description metadata added");
    }

    //if more tabs in parent tab, go to next tab and update capsule
    if (current_sub_step.next().attr("id") !== undefined) {
      current_sub_step.hide();
      current_sub_step = current_sub_step.next();
      current_sub_step_capsule.css("background-color", "#ddd");
      current_sub_step_capsule = current_sub_step_capsule.next();
      current_sub_step_capsule.css(
        "background-color",
        "var(--color-light-green)"
      );
      current_sub_step.css("display", "flex");
    } else {
      //go to next tab
      current_progression_tab.next().click();
    }
    disableProgressButton();
    console.log(sodaJSONObj);
    console.log(current_sub_step);
    console.log(current_progression_tab);
  });

  $("#guided-generate-dataset-button").on("click", async function () {
    console.log(sodaJSONObj);
    if (sodaJSONObj["starting-point"]["type"] === "local") {
      sodaJSONObj["starting-point"]["type"] = "new";
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
    /*
    generateProgressBar.value = 0;
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "Please wait while we verify a few things...";*/

    if (dataset_destination == "Pennsieve") {
      alert("supp checks");
      let supplementary_checks = await run_pre_flight_checks(false);
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }
    }

    //  from here you can modify
    document.getElementById("para-please-wait-new-curate").innerHTML =
      "Please wait...";
    document.getElementById(
      "para-new-curate-progress-bar-error-status"
    ).innerHTML = "";
    document.getElementById("para-new-curate-progress-bar-status").innerHTML =
      "";
    document.getElementById("div-new-curate-progress").style.display = "none";

    progressBarNewCurate.value = 0;

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
          document.getElementById(
            "para-new-curate-progress-bar-error-status"
          ).innerHTML =
            "<span style='color: red;'> Error: " + emessage + "</span>";
          document.getElementById("para-please-wait-new-curate").innerHTML = "";
          console.error(error);
          $("#sidebarCollapse").prop("disabled", false);
        } else {
          document.getElementById("para-please-wait-new-curate").innerHTML =
            "Please wait...";
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
                console.log("Continue");
                initiate_generate();
              } else {
                console.log("Stop");
                $("#sidebarCollapse").prop("disabled", false);
                document.getElementById(
                  "para-please-wait-new-curate"
                ).innerHTML = "Return to make changes";
                document.getElementById("div-generate-comeback").style.display =
                  "flex";
              }
            });
          } else {
            initiate_generate();
          }
        }
      }
    );
  });
});
