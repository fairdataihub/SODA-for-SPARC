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
let current_sub_step = $("#guided-basic-description-tab");
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

  //Handles high-level progress and their respective panels opening and closing,
  //as well as updates current tabs/capsule state
  $(".guided--progression-tab").on("click", function () {
    const selectedTab = $(this);
    selectedTab.siblings().removeClass("selected-tab");
    selectedTab.addClass("selected-tab");

    const tabPanelId = selectedTab
      .attr("id")
      .replace("progression-tab", "parent-tab");
    const tabPanel = $("#" + tabPanelId);
    current_sub_step = tabPanel.children(".guided--panel").first();
    current_sub_step_capsule = tabPanel
      .children(".guided--capsule-container")
      .children()
      .first();
    console.log(current_sub_step);
    console.log(current_sub_step_capsule);
    tabPanel.siblings().hide();
    tabPanel.show();
  });

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

  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO

  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO
  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO

  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO

  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO
  //TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO EDIT GUIDED SAVE BANNER IMAGE!

  $("#guided-save-banner-image").click((event) => {
    $("#guided-para-dataset-banner-image-status").html("");
    if (bfViewImportedImage.src.length > 0) {
      if (formBannerHeight.value > 511) {
        Swal.fire({
          icon: "warning",
          text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((result) => {
          if (formBannerHeight.value < 1024) {
            Swal.fire({
              icon: "warning",
              text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${formBannerHeight.value} px. Would you like to continue?`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              focusCancel: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then((result) => {
              if (result.isConfirmed) {
                uploadBannerImage();
              }
            });
          } else {
            uploadBannerImage();
          }
        });
      } else {
        $("#guided-para-dataset-banner-image-status").html(
          "<span style='color: red;'> " +
            "Dimensions of cropped area must be at least 512 px" +
            "</span>"
        );
      }
    } else {
      $("#guided-para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Please import an image first" +
          "</span>"
      );
    }
  });

  ipcRenderer.on("guided-selected-banner-image", async (event, path) => {
    if (path.length > 0) {
      let original_image_path = path[0];
      let image_path = original_image_path;
      let destination_image_path = require("path").join(
        homeDirectory,
        "SODA",
        "banner-image-conversion"
      );
      let converted_image_file = require("path").join(
        destination_image_path,
        "converted-tiff.jpg"
      );
      let conversion_success = true;
      imageExtension = path[0].split(".").pop();

      if (imageExtension.toLowerCase() == "tiff") {
        $("body").addClass("waiting");
        Swal.fire({
          title: "Image conversion in progress!",
          html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Jimp.read(original_image_path)
          .then(async (file) => {
            console.log("starting tiff conversion");
            if (!fs.existsSync(destination_image_path)) {
              fs.mkdirSync(destination_image_path);
            }

            try {
              if (fs.existsSync(converted_image_file)) {
                fs.unlinkSync(converted_image_file);
              }
            } catch (err) {
              conversion_success = false;
              console.error(err);
            }

            return file.write(converted_image_file, async () => {
              if (fs.existsSync(converted_image_file)) {
                let stats = fs.statSync(converted_image_file);
                let fileSizeInBytes = stats.size;
                let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                if (fileSizeInMegabytes > 5) {
                  console.log("File size too large. Resizing image");

                  fs.unlinkSync(converted_image_file);

                  await Jimp.read(original_image_path)
                    .then((file) => {
                      return file
                        .resize(1024, 1024)
                        .write(converted_image_file, () => {
                          document.getElementById(
                            "guided-div-img-container-holder"
                          ).style.display = "none";
                          document.getElementById(
                            "guided-div-img-container"
                          ).style.display = "block";

                          $("#guided-para-path-image").html(image_path);
                          bfViewImportedImage.src = converted_image_file;
                          myCropper.destroy();
                          myCropper = new Cropper(
                            bfViewImportedImage,
                            cropOptions
                          );
                          $("#guided-save-banner-image").css(
                            "visibility",
                            "visible"
                          );
                          $("body").removeClass("waiting");
                        });
                    })
                    .catch((err) => {
                      conversion_success = false;
                      console.error(err);
                    });
                  if (fs.existsSync(converted_image_file)) {
                    let stats = fs.statSync(converted_image_file);
                    let fileSizeInBytes = stats.size;
                    let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                    if (fileSizeInMegabytes > 5) {
                      console.log("File size is too big", fileSizeInMegabytes);
                      conversion_success = false;
                      // SHOW ERROR
                    }
                  }
                }
                console.log("file conversion complete");
                image_path = converted_image_file;
                imageExtension = "jpg";
                $("#guided-para-path-image").html(image_path);
                bfViewImportedImage.src = image_path;
                myCropper.destroy();
                myCropper = new Cropper(bfViewImportedImage, cropOptions);
                $("#guided-save-banner-image").css("visibility", "visible");
              }
            });
          })
          .catch((err) => {
            conversion_success = false;
            console.error(err);
            Swal.fire({
              icon: "error",
              text: "Something went wrong",
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          });
        if (conversion_success == false) {
          $("body").removeClass("waiting");
          return;
        } else {
          Swal.close();
        }
      } else {
        document.getElementById(
          "guided-div-img-container-holder"
        ).style.display = "none";
        document.getElementById("guided-div-img-container").style.display =
          "block";

        $("#guided-para-path-image").html(image_path);
        bfViewImportedImage.src = image_path;
        myCropper.destroy();
        myCropper = new Cropper(bfViewImportedImage, cropOptions);

        $("#guided-save-banner-image").css("visibility", "visible");
      }
    } else {
      if ($("#guided-para-current-banner-img").text() === "None") {
        $("#guided-save-banner-image").css("visibility", "hidden");
      } else {
        $("#guided-save-banner-image").css("visibility", "visible");
      }
    }
  });

  $("#guided-button-add-dataset-tags").on("click", () => {
    const guidedTags = Array.from(guidedDatasetTagsTagify.getTagElms()).map(
      (tag) => {
        return tag.textContent;
      }
    );
    sodaJSONObj["digital-metadata"]["tags"] = guidedTags;
    guidedTags.length > 0 ? enableProgressButton() : disableProgressButton();
  });

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
      sodaJSONObj["digital-metadata"] = {};
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

    if (
      current_sub_step.attr("id") == "guided-create-submission-metadata-tab"
    ) {
      if ($("#guided-generate-new-submission-card").hasClass("checked")) {
        confirmed_dataset_name = $("#guided-bf-dataset-name-confirm").text();
        sodaJSONObj["generate-dataset"]["dataset-name"] =
          confirmed_dataset_name;
      }
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
      current_progression_tab = current_progression_tab.next();
      console.log(current_progression_tab.attr("id"));
      console.log(current_progression_tab.first(".guided--panel").attr("id"));
      console.log(current_progression_tab.first(".guided--capsule").attr("id"));
      current_progression_tab.click();
    }
    /*disableProgressButton();*/
    console.log(sodaJSONObj);
    console.log(current_sub_step);
    console.log(current_progression_tab);
  });
  const goToGuidedTab = (tabIsd) => {
    $("#guided_mode_view").click();
    $("#guided_create_new_bf_dataset_btn").click();
    $("#guided-dataset-name-input").val("asdlfkj");
    $("#guided-dataset-subtitle-input").val("lkjasdf");
    enableProgressButton();
    for (var i = 1; i <= 100; i++) {
      if (current_sub_step.attr("id") != tabIsd) {
        $("#guided-next-button").click();
      }
    }
  };
  goToGuidedTab("add-edit-tags-tab");

  //CREATE SUBMISSION METADATA
  var guidedSubmissionTagsInput = document.getElementById(
    "guided-tagify-submission-milestone-tags"
  );
  // initialize Tagify on the above input node reference
  guidedSubmissionTagsTagify = new Tagify(guidedSubmissionTagsInput);

  $("#guided-submission-completion-date").change(function () {
    const text = $("#guided-submission-completion-date").val();
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
          document.getElementById("milestone_date_picker").valueAsDate =
            new Date();
        },
        preConfirm: async () => {
          const input_date = document.getElementById(
            "milestone_date_picker"
          ).value;
          return {
            date: input_date,
          };
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const input_date = result.value.date;
          $("#guided-submission-completion-date").append(
            $("<option>", {
              value: input_date,
              text: input_date,
            })
          );
          var $option = $("#guided-submission-completion-date")
            .children()
            .last();
          $option.prop("selected", true);
          validateCreateSubmissionMetadata();
        }
      });
    }
  });
  //TODO
  //MAYBE TRY CHANGING THE SELECTOR LOCATION FOR GUIDEDSUBMISSIONTAGSTAGIFY
  const validateCreateSubmissionMetadata = () => {
    if (
      $("#guided-submission-sparc-award").val().trim().length === 0 ||
      guidedSubmissionTagsTagify.getTagElms().length === 0 ||
      $("#guided-submission-completion-date").children().length <= 2
    ) {
      disableProgressButton();
    } else {
      enableProgressButton();
    }
  };

  $(".guided-award-and-milestone-information").change(function () {
    validateCreateSubmissionMetadata();
  });
});
