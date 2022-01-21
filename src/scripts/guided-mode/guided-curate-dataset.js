/////////////////////////////////////////////////////////
//////////          Shared variables          ///////////
/////////////////////////////////////////////////////////
let guided_dataset_name = "";
let guided_dataset_subtitle = "";
let guided_PI_owner = {};
let guidedUserPermissions = [];
let guidedTeamPermissions = [];
const guided_dataset_subtitle_char_count = document.getElementById(
  "guided-subtitle-char-count"
);
const create_dataset_button = $("#guided-create-empty-dataset");
let current_selected_folder = $("#code-card");

//main nav variables
let current_progression_tab = $("#prepare-dataset-progression-tab");
let current_sub_step = $("#guided-basic-description-tab");
let current_sub_step_capsule = $("#guided-basic-description-capsule");

guidedSetDatasetName = (newDatasetName) => {
  datasetName = newDatasetName.val().trim();
  guided_dataset_name = datasetName;
  $(".guidedDatasetName").text(datasetName);
  //defaultBfDataset = datasetName;
};

guidedSetDatasetSubtitle = (newDatasetSubtitle) => {
  datasetSubtitle = newDatasetSubtitle.val().trim();
  guided_dataset_subtitle = datasetSubtitle;
  $(".guidedDatasetSubtitle").text(datasetSubtitle);
};

var guidedJstreePreview = document.getElementById(
  "guided-div-dataset-tree-preview"
);

//nav functions
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
  $("#guided-button-add-permission-user").on("click", function () {
    //create user permissions object
    const newUserPermission = {
      userString: $("#guided_bf_list_users option:selected").text().trim(),
      UUID: $("#guided_bf_list_users").val().trim(),
      permission: $("#select-permission-list-3").val(),
    };

    const guidedAddUserPermission = (newUserPermissionObj) => {
      //append created user to permissions array
      guidedUserPermissions.push(newUserPermissionObj);

      /*create user permissions element and append to all elements
      with guidedDatasetUserPermissions class.*/
      const newUserPermissionElement = $("<div>", {
        class: "guided--dataset-info-content-container",
        style: "width: 100%",
      });
      newUserPermissionElement.attr(
        "data-user-string",
        newUserPermissionObj.userString
      );
      newUserPermissionElement.attr("data-uuid", newUserPermissionObj.UUID);
      newUserPermissionElement.attr(
        "data-user-permission",
        newUserPermissionObj.permission
      );
      newUserPermissionElement.append(
        $("<h5>", {
          class: "guided--dataset-info-content",
          text:
            $("#guided_bf_list_users option:selected").text().trim() +
            " : " +
            $("#select-permission-list-3").val(),
        })
      );
      newUserPermissionElement.append(
        $("<i>", {
          class: "fas fa-user-times guided-delete-permission",
          style: "color: red",
          onclick: `$(this).closest(".guided--dataset-info-content-container").remove()`,
        })
      );
      $(".guidedDatasetUserPermissions").append(newUserPermissionElement);
    };
    guidedAddUserPermission(newUserPermission);
  });

  $("#guided-button-add-permission-team").on("click", function () {
    const newTeamPermissionObj = {
      teamString: $("#guided_bf_list_teams option:selected").text().trim(),
      UUID: $("#guided_bf_list_teams").val().trim(),
      permission: $("#select-permission-list-4").val(),
    };

    const guidedAddTeamPermission = (newTeamPermission) => {
      guidedTeamPermissions.push(newTeamPermissionObj);
      const newTeamPermissionElement = $("<div>", {
        class: "guided--dataset-info-content-container",
        style: "width: 100%",
      });
      newTeamPermissionElement.append(
        $("<h5>", {
          class: "guided--dataset-info-content",
          text:
            $("#guided_bf_list_teams option:selected").text().trim() +
            " : " +
            $("#select-permission-list-4").val(),
        })
      );
      newTeamPermissionElement.append(
        $("<i>", {
          class: "fas fa-user-times guided-delete-permission",
          style: "color: red",
          onclick: `$(this).closest(".guided--dataset-info-content-container").remove()`,
        })
      );
      $(".guidedDatasetTeamPermissions").append(newTeamPermissionElement);
    };
    guidedAddTeamPermission(newTeamPermissionObj);
  });

  $("#guided-dataset-name-input").val("test 2");
  $(guidedJstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });

  $(guidedJstreePreview).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });

  $(guidedJstreePreview).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });

  function guidedShowTreePreview(new_dataset_name) {
    datasetStructureJSONObj["files"] = sodaJSONObj["metadata-files"];
    if (manifestFileCheck.checked) {
      addManifestFilesForTreeView();
    } else {
      revertManifestForTreeView();
    }

    var guidedJsTreePreviewData = create_child_node(
      datasetStructureJSONObj,
      new_dataset_name,
      "folder",
      "",
      true,
      false,
      false,
      "",
      "preview"
    );
    $(guidedJstreePreview).jstree(true).settings.core.data =
      guidedJsTreePreviewData;
    $(guidedJstreePreview).jstree(true).refresh();
  }
  $("#guided-button-add-permission-pi").on("click", function () {
    const newPiOwner = {
      PiOwnerString: $("#guided_bf_list_users_pi option:selected")
        .text()
        .trim(),
      UUID: $("#guided_bf_list_users_pi").val().trim(),
      permission: "owner",
    };
    const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
      guided_PI_owner = newPiOwnerObj;
      $(".guidedDatasetOwner").text(newPiOwnerObj.PiOwnerString);
    };
    setGuidedDatasetPiOwner(newPiOwner);
  });
  $(".guided-change-dataset-name").on("click", async function () {
    const { value: datasetName } = await Swal.fire({
      title: "Input new dataset name",
      input: "text",
      inputPlaceholder: "Enter your new dataset name here",
    });

    if (datasetName) {
      $(".guidedDatasetName").text(datasetName);
    }
  });
  $(".guided-change-dataset-subtitle").on("click", async function () {
    const { value: datasetSubtitle } = await Swal.fire({
      title: "Input new dataset subtitle",
      input: "text",
      inputPlaceholder: "Enter your new dataset subtitle here",
    });

    if (datasetSubtitle) {
      $(".guidedDatasetSubtitle").text(datasetSubtitle);
    }
  });

  $(".guided--text-data-description").on("keyup", function () {
    validateGuidedDatasetDescriptionInputs();
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
      document.getElementById("guided-dataset-subtitle-input"),
      guided_dataset_subtitle_char_count
    );
    validateGuidedBasicDescriptionInputs();
  });
  $("#guided-button-add-license").on("click", function () {
    $(".guidedBfLicense").text("Creative Commons Attribution (CC-BY)");
    $("#guided-button-add-license").attr("disabled");
    enableProgressButton();
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
    if (tabPanelId == "prepare-pennsieve-metadata-parent-tab") {
      $(".selectpicker").selectpicker("refresh");
    }
    const tabPanel = $("#" + tabPanelId);
    current_sub_step = tabPanel.children(".guided--panel").first();
    current_sub_step_capsule = tabPanel
      .children(".guided--capsule-container")
      .children()
      .first();
    tabPanel.siblings().hide();
    tabPanel.show();
  });
  //card click hanndler that displays the card's panel using the card's id prefix
  //e.g. clicking a card with id "foo-bar-card" will display the panel with the id "foo-bar-panel"
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

  // function for importing a banner image if one already exists
  $("#guided-button-add-banner-image").click(async () => {
    $("#guided-banner-image-modal").modal("show");
  });

  // Action when user click on "Import image" button for banner image
  $("#guided-button-import-banner-image").click(() => {
    ipcRenderer.send("guided-open-file-dialog-import-banner-image");
  });

  ipcRenderer.on("guided-selected-banner-image", async (event, path) => {
    console.log(path);
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
      console.log(path);

      if (imageExtension.toLowerCase() == "tiff") {
        alert("tiff");
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
        alert("not tiff");
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

  //ipcRenderer event handlers
  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
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

  //TODO changes completed question's opacity to .5, then scrolls to next question
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

  $("#guided-generate-dataset-button").on("click", function () {
    let bfNewDatasetName =
      "testingtesting2" + Math.floor(Math.random() * (999 - 100 + 1) + 100);
    const guidedCreateDataset = async () => {
      let selectedbfaccount = defaultBfAccount;

      log.info(`Creating a new dataset with the name: ${bfNewDatasetName}`);
      Swal.fire({
        title: `Creating a new dataset named: ${bfNewDatasetName}`,
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
      });
      const newDs = await client.invoke(
        "api_bf_new_dataset_folder",
        bfNewDatasetName,
        selectedbfaccount,
        (error, res) => {
          if (error) {
            log.error(error);
            console.error(error);
            let emessage = userError(error);
            Swal.fire({
              title: `Failed to create a new dataset.`,
              text: emessage,
              showCancelButton: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              icon: "error",
            });
            ipcRenderer.send(
              "track-event",
              "Error",
              "Manage Dataset - Create Empty Dataset",
              bfNewDatasetName
            );
            return error;
          } else {
            Swal.fire({
              title: `Dataset ${bfNewDatasetName} was created successfully`,
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              didOpen: () => {
                Swal.hideLoading();
              },
            });

            log.info(`Created dataset successfully`);

            defaultBfDataset = bfNewDatasetName;
            refreshDatasetList();
            addNewDatasetToList(bfNewDatasetName);
            ipcRenderer.send(
              "track-event",
              "Success",
              "Manage Dataset - Create Empty Dataset",
              bfNewDatasetName
            );

            log.info(`Requesting list of datasets`);

            client.invoke(
              "api_bf_dataset_account",
              defaultBfAccount,
              (error, result) => {
                if (error) {
                  log.error(error);
                  console.log(error);
                } else {
                  log.info(`Requested list of datasets successfully`);
                  datasetList = [];
                  datasetList = result;
                }
              }
            );
          }
        }
      );
      return newDs;
    };
    guidedCreateDataset().then();
  });

  /*
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
                guided_generate();
              } else {
                $("#sidebarCollapse").prop("disabled", false);
                document.getElementById(
                  "para-please-wait-new-curate"
                ).innerHTML = "Return to make changes";
                document.getElementById("div-generate-comeback").style.display =
                  "flex";
              }
            });
          } else {
            guided_generate().then();
          }
        }
      }
    );*/

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

  //next button click handler
  $("#guided-next-button").on("click", () => {
    //individual sub step processes

    //1st: create guided mode sodaObj, append properties per user input
    if (current_sub_step.attr("id") == "guided-basic-description-tab") {
      $(".guidedDatasetName").text($("#guided-dataset-name-input").val());
      $(".guidedDatasetSubtitle").text(
        $("guided-dataset-subtitle-input").val()
      );
      $(".guidedDatasetSubtitle").text(
        $("#guided-dataset-subtitle-input").val()
      );
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
      sodaJSONObj["generate-dataset"]["dataset-name"] = $(
        "#guided-dataset-name-input"
      )
        .val()
        .trim();
      sodaJSONObj["digital-metadata"]["name"] = $("#guided-dataset-name-input")
        .val()
        .trim();
      sodaJSONObj["digital-metadata"]["subtitle"] = $(
        "#guided-dataset-subtitle-input"
      )
        .val()
        .trim();
      guidedSetDatasetName($("#guided-dataset-name-input"));
      guidedSetDatasetSubtitle($("#guided-dataset-subtitle-input"));
    }

    if (current_sub_step.attr("id") == "guided-designate-pi-owner-tab") {
      sodaJSONObj["digital-metadata"]["pi-owner"] = guided_PI_owner;
    }

    if (current_sub_step.attr("id") == "guided-designate-permissions-tab") {
      sodaJSONObj["digital-metadata"]["user-permissions"] =
        guidedUserPermissions;
      sodaJSONObj["digital-metadata"]["team-permissions"] =
        guidedUserPermissions;
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

    if (current_sub_step.attr("id") == "add-edit-description-tags-tab") {
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
      sodaJSONObj["digital-metadata"]["dataset-tags"] = Array.from(
        guidedDatasetTagsTagify.getTagElms()
      ).map((tag) => {
        return tag.textContent;
      });
    }

    if (current_sub_step.attr("id") == "guided-assign-license-tab") {
      sodaJSONObj["digital-metadata"]["license"] =
        "Creative Commons Attribution";
    }

    if (current_sub_step.attr("id") == "add-edit-tags-tab") {
      const guidedTags = Array.from(guidedDatasetTagsTagify.getTagElms()).map(
        (tag) => {
          return tag.textContent;
        }
      );
      sodaJSONObj["digital-metadata"]["tags"] = guidedTags;
      console.log(guidedTags);
      guidedTags.length > 0 ? enableProgressButton() : disableProgressButton();
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
    //disableProgressButton();
    console.log(sodaJSONObj);
    console.log(current_sub_step.attr("id"));
    console.log(current_progression_tab.attr("id"));
    if (current_sub_step.attr("id") == "guided-create-readme-metadata-tab") {
      guidedShowTreePreview(guided_dataset_name);
    }
  });
  const goToTabOnStart = (tabIsd) => {
    $("#guided_mode_view").click();
    $("#guided_create_new_bf_dataset_btn").click();
    $("#guided-dataset-name-input").val("test 2");
    $("#guided-dataset-subtitle-input").val("lkjasdf");
    enableProgressButton();
    for (var i = 1; i <= 100; i++) {
      if (current_sub_step.attr("id") != tabIsd) {
        $("#guided-next-button").click();
      }
    }
  };
  //goToTabOnStart("guided-designate-pi-owner-tab");

  //TAGIFY initializations
  var guidedSubmissionTagsInput = document.getElementById(
    "guided-tagify-submission-milestone-tags"
  );
  guidedSubmissionTagsTagify = new Tagify(guidedSubmissionTagsInput);
  const guidedDatasetKeywordsInput =
    document.getElementById("guided-ds-keywords");
  const guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeywordsInput, {
    duplicates: false,
  });
  const guidedOtherFundingSourcesInput = document.getElementById(
    "guided-ds-other-funding"
  );
  const guidedOtherFundingsourcesTagify = new Tagify(
    guidedOtherFundingSourcesInput,
    { duplicates: false }
  );

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

function guided_generate() {
  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  document.getElementById("para-new-curate-progress-bar-status").innerHTML =
    "Preparing files ...";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "block";
  document.getElementById("div-generate-comeback").style.display = "none";

  if ("manifest-files" in sodaJSONObj) {
    if ("destination" in sodaJSONObj["manifest-files"]) {
      if (sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
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

  // prevent_sleep_id = electron.powerSaveBlocker.start('prevent-display-sleep')

  client.invoke("api_main_curate_function", sodaJSONObj, (error, res) => {
    if (error) {
      $("#sidebarCollapse").prop("disabled", false);
      var emessage = userError(error);
      document.getElementById(
        "para-new-curate-progress-bar-error-status"
      ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
      document.getElementById("para-new-curate-progress-bar-status").innerHTML =
        "";
      document.getElementById("div-new-curate-progress").style.display = "none";
      generateProgressBar.value = 0;
      log.error(error);
      console.error(error);
      // forceActionSidebar('show');
      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset",
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      ipcRenderer.send(
        "track-event",
        "Error",
        "Generate Dataset - Size",
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      // ipcRenderer.send(
      //   "track-event",
      //   "Error",
      //   `Generate Dataset - ${dataset_name} - Number of Folders`,
      //   folder_counter
      // );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Error",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );

      // electron.powerSaveBlocker.stop(prevent_sleep_id)

      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );
    } else {
      $("#sidebarCollapse").prop("disabled", false);
      log.info("Completed curate function");
      console.log("Completed curate function");
      if (manifest_files_requested) {
        let high_level_folder_num = 0;
        if ("dataset-structure" in sodaJSONObj) {
          if ("folders" in sodaJSONObj["dataset-structure"]) {
            for (folder in sodaJSONObj["dataset-structure"]["folders"]) {
              high_level_folder_num += 1;
            }
          }
        }

        ipcRenderer.send(
          "track-event",
          "Success",
          "Manifest Files Created",
          dataset_name,
          high_level_folder_num
        );
        ipcRenderer.send(
          "track-event",
          "Success",
          `Manifest Files Created - ${dataset_destination}`,
          dataset_name,
          high_level_folder_num
        );
      }

      if (dataset_destination == "Pennsieve") {
        show_curation_shortcut();
      }

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination}`,
        dataset_name
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        "Generate Dataset - Size",
        dataset_name,
        main_total_generate_dataset_size
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Size`,
        dataset_name,
        main_total_generate_dataset_size
      );

      file_counter = 0;
      folder_counter = 0;
      get_num_files_and_folders(sodaJSONObj["dataset-structure"]);

      // ipcRenderer.send(
      //   "track-event",
      //   "Success",
      //   `Generate Dataset - ${dataset_name} - Number of Folders`,
      //   folder_counter
      // );

      // ipcRenderer.send(
      //   "track-event",
      //   "Success",
      //   "Generate Dataset - Number of Folders",
      //   folder_counter
      // );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - Number of Files`,
        dataset_name,
        file_counter
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        `Generate Dataset - ${dataset_destination} - Number of Files`,
        dataset_name,
        file_counter
      );

      // electron.powerSaveBlocker.stop(prevent_sleep_id)

      client.invoke(
        "api_bf_dataset_account",
        defaultBfAccount,
        (error, result) => {
          if (error) {
            log.error(error);
            console.log(error);
            var emessage = error;
          } else {
            datasetList = [];
            datasetList = result;
          }
        }
      );
    }
    document.getElementById("div-generate-comeback").style.display = "flex";
  });

  // Progress tracking function for main curate
  var countDone = 0;
  var timerProgress = setInterval(main_progressfunction, 1000);
  function main_progressfunction() {
    client.invoke("api_main_curate_function_progress", (error, res) => {
      if (error) {
        var emessage = userError(error);
        document.getElementById(
          "para-new-curate-progress-bar-error-status"
        ).innerHTML = "<span style='color: red;'>" + emessage + "</span>";
        log.error(error);
        console.error(error);
      } else {
        main_curate_status = res[0];
        var start_generate = res[1];
        var main_curate_progress_message = res[2];
        main_total_generate_dataset_size = res[3];
        var main_generated_dataset_size = res[4];
        var elapsed_time_formatted = res[5];

        //console.log(`Data transferred (bytes): ${main_generated_dataset_size}`);

        if (start_generate === 1) {
          divGenerateProgressBar.style.display = "block";
          if (main_curate_progress_message.includes("Success: COMPLETED!")) {
            generateProgressBar.value = 100;
            document.getElementById(
              "para-new-curate-progress-bar-status"
            ).innerHTML = main_curate_status + smileyCan;
          } else {
            var value =
              (main_generated_dataset_size / main_total_generate_dataset_size) *
              100;
            generateProgressBar.value = value;
            if (main_total_generate_dataset_size < displaySize) {
              var totalSizePrint =
                main_total_generate_dataset_size.toFixed(2) + " B";
            } else if (
              main_total_generate_dataset_size <
              displaySize * displaySize
            ) {
              var totalSizePrint =
                (main_total_generate_dataset_size / displaySize).toFixed(2) +
                " KB";
            } else if (
              main_total_generate_dataset_size <
              displaySize * displaySize * displaySize
            ) {
              var totalSizePrint =
                (
                  main_total_generate_dataset_size /
                  displaySize /
                  displaySize
                ).toFixed(2) + " MB";
            } else {
              var totalSizePrint =
                (
                  main_total_generate_dataset_size /
                  displaySize /
                  displaySize /
                  displaySize
                ).toFixed(2) + " GB";
            }
            var progressMessage = "";
            progressMessage += main_curate_progress_message + "<br>";
            progressMessage +=
              "Progress: " +
              value.toFixed(2) +
              "%" +
              " (total size: " +
              totalSizePrint +
              ") " +
              "<br>";
            progressMessage +=
              "Elaspsed time: " + elapsed_time_formatted + "<br>";
            document.getElementById(
              "para-new-curate-progress-bar-status"
            ).innerHTML = progressMessage;
          }
        } else {
          document.getElementById(
            "para-new-curate-progress-bar-status"
          ).innerHTML =
            main_curate_progress_message +
            "<br>" +
            "Elapsed time: " +
            elapsed_time_formatted +
            "<br>";
        }
      }
    });

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      countDone++;
      if (countDone > 1) {
        log.info("Done curate track");
        console.log("Done curate track");
        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  }
}
