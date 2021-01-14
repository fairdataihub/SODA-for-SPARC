
var metadataFile = '';

$(".button-individual-metadata.remove").click(function() {
  var metadataFileStatus = $($(this).parents()[1]).find('.para-metadata-file-status');
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).find('.div-metadata-confirm').css("display", "none");
  $($(this).parents()[1]).find('.div-metadata-go-back').css("display", "flex");
})

$(".metadata-button").click(function() {
  metadataFile = $(this);
  $(".div-organize-generate-dataset.metadata").addClass('hide');
  var target = $(this).attr('data-next');
  $("#"+target).toggleClass('show');
  // document.getElementById("save-progress-btn").style.display = "none";
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("prevBtn").style.display = "none";
})

function confirmMetadataFilePath(ev) {
  $($(ev).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  // document.getElementById("save-progress-btn").style.display = "block";

  // Checking if metadata files are imported
  //// once users click "Confirm" or "Cancel", check if file is specified
  //// if yes: addClass 'done'
  //// if no: removeClass 'done'
  var errorMetadataFileMessages = ["", "Please only drag and drop a file!", "Your SPARC metadata file must be in one of the formats listed above!", "Your SPARC metadata file must be named and formatted exactly as listed above!"]
  var metadataFileStatus = $($(ev).parents()[1]).find('.para-metadata-file-status');
  if (!(errorMetadataFileMessages.includes($(metadataFileStatus).text()))) {
    $(metadataFile).addClass('done');
  } else {
    $(metadataFile).removeClass('done');
    $(metadataFileStatus).text("");
  }
}
// $(".button-individual-metadata.confirm").click(function() {
// })

$(".button-individual-metadata.go-back").click(function() {
  var metadataFileStatus = $($(this).parents()[1]).find('.para-metadata-file-status');
  $(metadataFileStatus).text("");
  $($(this).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  var errorMetadataFileMessages = ["", "Please only drag and drop a file!", "Your SPARC metadata file must be in one of the formats listed above!", "Your SPARC metadata file must be named and formatted exactly as listed above!"]
  var metadataFileStatus = $($(this).parents()[1]).find('.para-metadata-file-status');
  if (!(errorMetadataFileMessages.includes($(metadataFileStatus).text()))) {
    $(metadataFile).addClass('done');
  } else {
    $(metadataFile).removeClass('done');
    $(metadataFileStatus).text("");
  }
})

function dropHandler(ev, paraElement, metadataFile) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  document.getElementById(paraElement).innerHTML = ""

  if (ev.dataTransfer.items) {
    /// if users drag multiple files, only show first file
    var file = ev.dataTransfer.items[0];
      // If dropped items aren't files, reject them
    if (ev.dataTransfer.items[0].kind === 'file') {
      var file = ev.dataTransfer.items[0].getAsFile();
      var metadataWithoutExtension = file.name.slice(0, file.name.indexOf('.'))
      if (metadataWithoutExtension === metadataFile) {
        document.getElementById(paraElement).innerHTML = file.path;
        $($("#"+paraElement).parents()[1]).find('.div-metadata-confirm').css("display", "flex");
        $($("#"+paraElement).parents()[1]).find('.div-metadata-go-back').css("display", "none");
      } else {
        document.getElementById(paraElement).innerHTML = "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>"
      }
    } else {
      document.getElementById(paraElement).innerHTML = "<span style='color:red'>Please only drag and drop a file!</span>"
    }
  }
}

////////////////// IMPORT EXISTING PROGRESS FILES ////////////////////////////////
const progressFileDropdown = document.getElementById('progress-files-dropdown');

/////////////////////////////// Helpers function for Import progress function /////////////////////////////
// function to load SODA with progress file
function progressFileParse(ev) {
  var fileName = $(ev).val();
  if (fileName !== "Select") {
    var filePath = path.join(progressFilePath, fileName);
    try {
      var content = fs.readFileSync(filePath);
      contentJson = JSON.parse(content);
      return contentJson
    } catch (error) {
      log.error(error)
      console.log(error);
      document.getElementById('para-progress-file-status').innerHTML = "<span style='color:red'>"+error+"</span>"
      return {}
    }
  } else {
      return {}
  }
}

function importManifest(object) {
  if ("manifest-files" in object) {
    manifestFileCheck.checked = true;
  } else {
    manifestFileCheck.checked = false;
  }
}

function importMetadataFilesProgress(object) {
  populateMetadataProgress(false, '', '')
  if ("metadata-files" in object) {
    var metadataFileArray = Object.keys(object["metadata-files"]);
    metadataFileArray.forEach(function(element) {
      var fullPath = object["metadata-files"][element]["path"];
      populateMetadataProgress(true, path.parse(element).name, fullPath);
    })
  }
}

function importDatasetStructure(object) {
  if ("dataset-structure" in object) {
    datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
    highLevelFoldersDisableOptions()
  } else {
      datasetStructureJSONObj = {"folders":{},
      "files":{},
      "type":""
      }
  }
}

function importGenerateDatasetStep(object) {
  if ("generate-dataset" in sodaJSONObj) {
    // Step 1: Where to generate the dataset
    if (sodaJSONObj["generate-dataset"]["destination"] === "local") {
      $('#generate-local-desktop').prop("checked", true);
      $($('#generate-local-desktop').parents()[2]).click();
      // Step 2: if generate locally, name and path
      $('#input-destination-generate-dataset-locally').val(sodaJSONObj["generate-dataset"]["path"]);
      $('#btn-confirm-local-destination').click();
      $('#inputNewNameDataset').val(sodaJSONObj["generate-dataset"]["dataset-name"]);
      $("#btn-confirm-new-dataset-name").click();
    } else if (sodaJSONObj["generate-dataset"]["destination"] === "bf") {
      $('#generate-upload-BF').prop("checked", true);
      $($('#generate-upload-BF').parents()[2]).click();
      // Step 2: if generate on bf, choose bf account
      if ("bf-account-selected" in sodaJSONObj && sodaJSONObj["bf-account-selected"]["account-name"] !== "") {
        var bfAccountSelected = sodaJSONObj["bf-account-selected"]["account-name"];
        if ($('#bfallaccountlist option[value="' +bfAccountSelected+ '"]').prop("selected", true).length) {
          $('#bfallaccountlist option[value="' +bfAccountSelected+ '"]').prop("selected", true);
          $('#btn-bf-account').click()
          // Step 3: choose to generate on an existing or new dataset
          if ("bf-dataset-selected" in sodaJSONObj && sodaJSONObj["bf-dataset-selected"]["dataset-name"] !== "") {
            $('#generate-BF-dataset-options-existing').prop("checked", true);
            $($('#generate-BF-dataset-options-existing').parents()[2]).click();
            var bfDatasetSelected = sodaJSONObj["bf-dataset-selected"]["dataset-name"];
            setTimeout(function(){
              if ($('#curatebfdatasetlist option[value="' +bfDatasetSelected+ '"]').prop("selected", true).length) {
                $('#curatebfdatasetlist option[value="' +bfDatasetSelected+ '"]').prop("selected", true);
                $('#button-confirm-bf-dataset').click();
                // Step 4: Handle existing files and folders
                if ("if-existing" in sodaJSONObj["generate-dataset"]) {
                  var existingFolderOption = sodaJSONObj["generate-dataset"]["if-existing"]
                  $('#existing-folders-'+existingFolderOption).prop("checked", true);
                  $($('#existing-folders-'+existingFolderOption).parents()[2]).click();
                }
                if ("if-existing-files" in sodaJSONObj["generate-dataset"]) {
                  var existingFileOption = sodaJSONObj["generate-dataset"]["if-existing-files"]
                  $('#existing-files-'+existingFileOption).prop("checked", true);
                  $($('#existing-files-'+existingFileOption).parents()[2]).click();
                }
              }
            }, 3000)
          } else {
            $('#generate-BF-dataset-options-new').prop("checked", true);
            $($('#generate-BF-dataset-options-new').parents()[2]).click();
            $('#inputNewNameDataset').val(sodaJSONObj["generate-dataset"]["dataset-name"]);
            $('#inputNewNameDataset').keyup()
          }
        }
      }
    }
  } else {
    // the block of code below reverts all the checks to option cards if applicable
    exitCurate();
    $('#previous-progress').prop("checked", true);
    $($('#previous-progress').parents()[2]).addClass("checked");
    $($($($('#div-getting-started-previous-progress').parents()[0]).siblings()[0]).children()[0]).toggleClass('non-selected')
  }
}

// check metadata files
function populateMetadataProgress(populateBoolean, metadataFileName, localPath) {
  var metadataButtonsArray = $(".metadata-button.button-generate-dataset");
  var correspondingMetadataParaElement = {"submission": ['para-submission-file-path', metadataButtonsArray[0]], "dataset_description": ['para-ds-description-file-path', metadataButtonsArray[1]], "subjects": ['para-subjects-file-path', metadataButtonsArray[2]], "samples": ['para-samples-file-path', metadataButtonsArray[3]], "README": ['para-readme-file-path', metadataButtonsArray[4]], "CHANGES": ['para-changes-file-path', metadataButtonsArray[5]]}
  if (populateBoolean) {
    if (metadataFileName in correspondingMetadataParaElement) {
      var paraElement = correspondingMetadataParaElement[metadataFileName]
      $("#"+paraElement[0]).text(localPath);
      $($("#"+paraElement[0]).parents()[1]).find('.div-metadata-confirm').css("display", "flex");
      $($("#"+paraElement[0]).parents()[1]).find('.div-metadata-go-back').css("display", "none");
      $(paraElement[1]).addClass('done');
    }
  } else {
      for (var key in correspondingMetadataParaElement) {
        var paraElement = correspondingMetadataParaElement[key]
        $("#"+paraElement[0]).text("");
        $($("#"+paraElement[0]).parents()[1]).find('.div-metadata-confirm').css("display", "none");
        $($("#"+paraElement[0]).parents()[1]).find('.div-metadata-go-back').css("display", "flex");
        $(paraElement[1]).removeClass('done');
      }
  }
}

//////////////////////// Main Import progress function
function loadProgressFile(ev) {
  document.getElementById('para-progress-file-status').innerHTML = "";
  document.getElementById('nextBtn').disabled = true;
  document.getElementById('div-progress-file-loader').style.display = "block";
  // create loading effect
  var jsonContent = progressFileParse(ev);
  if (JSON.stringify(jsonContent) !== "{}") {
    sodaJSONObj = jsonContent;
    setTimeout(function() {
      sodaJSONObj = jsonContent;
      importManifest(sodaJSONObj)
      importMetadataFilesProgress(sodaJSONObj)
      importDatasetStructure(sodaJSONObj)
      importGenerateDatasetStep(sodaJSONObj)
      document.getElementById('div-progress-file-loader').style.display = "none"
      document.getElementById('nextBtn').disabled = false;
      document.getElementById('para-progress-file-status').innerHTML = "<span style='color:var(--color-light-green)'>Previous work loaded successfully! Continue below.</span>"
    }, 1300)
  } else {
      sodaJSONObj = {};
      setTimeout(function() {
        importManifest(sodaJSONObj)
        importMetadataFilesProgress(sodaJSONObj)
        importDatasetStructure(sodaJSONObj)
        importGenerateDatasetStep(sodaJSONObj)
        document.getElementById('div-progress-file-loader').style.display = "none"
        document.getElementById('para-progress-file-status').innerHTML = ""
      }, 500)
    }
}

// function to load Progress dropdown
function importOrganizeProgressPrompt() {
  document.getElementById('para-progress-file-status').innerHTML = ""
  removeOptions(progressFileDropdown);
  addOption(progressFileDropdown, "Select", "Select")
  if (fs.existsSync(progressFilePath)) {
    var fileNames = fs.readdirSync(progressFilePath);
    if (fileNames.length > 0) {
      fileNames.forEach((item, i) => {
        addOption(progressFileDropdown, path.parse(item).name, item)
      });
    } else {
      document.getElementById('para-progress-file-status').innerHTML = "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>"
    }
  } else {
    document.getElementById('para-progress-file-status').innerHTML = "<span style='color:var(--color)'>There is no existing progress to load. Please choose one of the other options above!</span>"
  }
}

importOrganizeProgressPrompt()
async function openDropdownPrompt(dropdown) {
  // if users edit current account
  if (dropdown === "bf") {
    var resolveMessage = "";
    if (bfAccountOptionsStatus === "") {
        if (Object.keys(bfAccountOptions).length === 1) {
        footerMessage = "No existing accounts to load. Please add an account!"
      } else {
        footerMessage = "<a href='#'>Need help?</a>"
      }
    } else {
      footerMessage = bfAccountOptionsStatus;
    }
    var bfacct;
    const { value: bfAccountSwal } = await Swal.fire({
          title: 'Select your Blackfynn account',
          input: 'select',
          showCloseButton: true,
          inputOptions: bfAccountOptions,
          confirmButtonText: "Confirm",
          denyButtonText: "Add account",
          showDenyButton: true,
          showCancelButton: false,
          inputValue: defaultBfAccount,
          reverseButtons: true,
          footer: footerMessage,
          didOpen: function(ele) {
             $(ele).find('.swal2-select').attr("id", "bfaccountdropdown");
             $("#bfaccountdropdown").removeClass('swal2-select');
             $("#bfaccountdropdown").addClass('w-100');
             $("#bfaccountdropdown").attr('data-live-search', "true");
             $("#bfaccountdropdown").wrap("<div class='search-select-box'></div>");
             $("#bfaccountdropdown").selectpicker();
             $("#bfaccountdropdown").attr('disabled', false);
          },
          inputValidator: (value) => {
            return new Promise((resolve) => {
                if (value !== 'Select') {
                  bfacct = $("#bfaccountdropdown").val();
                  resolve();
                } else {
                  bfacct = undefined;
                  resolve("You need to select an account!")
                }
            })
          }
        })
        if (bfAccountSwal === null) {
          if (bfacct !== "Select") {
            Swal.fire(
              {
                title: 'Loading your account details...',
                timer: 2000,
                timerProgressBar: true,
                allowEscapeKey: false,
                showConfirmButton: false
              });
              $('#current-bf-account').text("");
              $('#para-account-detail-curate').html("");
              client.invoke("api_bf_account_details", bfacct, (error, res) => {
                if(error) {
                  log.error(error)
                  console.error(error)
                  Swal.fire({
                    icon: 'error',
                    text: error,
                    footer: '<a href>Why do I have this issue?</a>'
                  })
                  showHideDropdownButtons("account", "hide");
                  // $("#div-bf-account-btns").css("display", "none");
                  // $('#div-bf-account-btns button').hide();
                } else {
                  $('#para-account-detail-curate').html(res);
                  $('#current-bf-account').text(bfacct);
                  updateBfAccountList()
                  if (!($('#Question-generate-dataset-BF-account').hasClass('prev'))) {
                    $("#div-bf-account-btns").css("display", "flex");
                    $('#div-bf-account-btns button').show();
                  } else {
                    $("#div-bf-account-btns").css("display", "none");
                    $('#div-bf-account-btns button').hide();
                  }
                  if (!($('#Question-getting-started-BF-account').hasClass('prev'))) {
                    $("#div-bf-account-btns-getting-started").css("display", "flex");
                    $('#div-bf-account-btns-getting-started button').show();
                  }
                }
              })
          } else {
            Swal.showValidationMessage("Please select an account!")
          }
        } else if (bfAccountSwal === false) {
          // // else, if users click Add account
          showBFAddAccountBootbox()
        }
  } else if (dropdown === "dataset") {
    var bfDataset = "";
    // if users edit Current dataset
    datasetPermissionDiv.style.display = "block";
    $('#select-permission-list-2').val('All').trigger('change');
    const { value: bfDS } = await Swal.fire({
      title: "<h3 style='margin-bottom:20px !important'>Please choose a dataset</h3>",
      html: datasetPermissionDiv,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        bfDataset = $('#curatebfdatasetlist').val();
        if (!bfDataset) {
          Swal.showValidationMessage("Please select a dataset!")
          return undefined
        } else {
          if (bfDataset === "Select dataset") {
             Swal.showValidationMessage("Please select a dataset!")
             return undefined
           } else {
             return bfDataset
           }
        }
      }
    })
    // check return value
    if (bfDS) {
        $("#current-bf-dataset").text(bfDataset);
        defaultBfDataset = bfDataset;
        tempDatasetListsSync()
        showHideDropdownButtons("dataset", "show");
        // $($('#button-confirm-bf-dataset').parents()[0]).css("display", "flex")
        // $('#button-confirm-bf-dataset').show()
      }
    // hide "Confirm" button if Current dataset set to None
    if ($("#current-bf-dataset").text() === "None")  {
      showHideDropdownButtons("dataset", "hide");
      // $($('#button-confirm-bf-dataset').parents()[0]).css("display", "none")
      // $('#button-confirm-bf-dataset').hide()
    }
  }
}

$('#select-permission-list-2').change(function(e) {
  $("#div-filter-datasets-progress-2").css("display", "block");
  var datasetPermission = $('#select-permission-list-2').val();
  var bfacct = $("#current-bf-account").text();
  if (bfacct === "None") {
    document.getElementById("para-filter-datasets-status-2").innerHTML = "<span style='color:red'>Please select a Blackfynn account first!</span>"
  } else {
    $("#curatebfdatasetlist").selectpicker();
    updateDatasetList(bfacct, datasetPermission)
  }
})

function tempDatasetListsSync() {
  $("#bfdatasetlist_renamedataset").val(defaultBfDataset);
  currentDatasetDropdowns = [bfDatasetListMetadata, bfUploadDatasetList, bfDatasetList, bfDatasetListDatasetStatus, bfDatasetListPermission,
                            bfDatasetListPostCurationCuration, bfDatasetListPostCurationConsortium, bfDatasetListPostCurationPublish, datasetDescriptionFileDataset];
  var listSelectedIndex = bfDatasetListRenameDataset.selectedIndex;
  for (var list of currentDatasetDropdowns) {
    list.selectedIndex = listSelectedIndex;
  }
  postCurationListChange()
  showDatasetDescription()
  metadataDatasetlistChange()
  permissionDatasetlistChange()
  datasetStatusListChange()
  renameDatasetlistChange()
  postCurationListChange()
  showDatasetDescription()
}

function updateDatasetList(bfaccount, myPermission) {
  removeOptions(curateDatasetDropdown)
  addOption(curateDatasetDropdown, "Select dataset", "Select dataset")
  initializeBootstrapSelect("#curatebfdatasetlist", "disabled")
  var filteredDatasets = [];
  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(function() {
    if (myPermission.toLowerCase()==="all") {
      for (var i=0; i<datasetList.length; i++) {
        filteredDatasets.push(datasetList[i].name);
      }
    } else {
      for (var i=0; i<datasetList.length; i++) {
        if (datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name)
        }
      }
    }
    filteredDatasets.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    for (myitem in filteredDatasets){
      var myitemselect = filteredDatasets[myitem]
      var option = document.createElement("option")
      option.textContent = myitemselect
      option.value = myitemselect
      curateDatasetDropdown.appendChild(option)
    }
    initializeBootstrapSelect("#curatebfdatasetlist", "show")
    document.getElementById("div-permission-list-2").style.display = "block";
    $("#div-filter-datasets-progress-2").css("display", "none");
    document.getElementById("para-filter-datasets-status-2").innerHTML = filteredDatasets.length + " dataset(s) where you have " +  myPermission.toLowerCase() + " permissions were loaded successfully below."
  }, 2000)
}

/// helper function to refresh live search dropdowns per dataset permission on change event
function initializeBootstrapSelect(dropdown, action) {
  if (action === "disabled") {
    $(dropdown).attr('disabled', true);
    $(".dropdown.bootstrap-select button").addClass('disabled');
    $(".dropdown.bootstrap-select").addClass('disabled');
    $(dropdown).selectpicker('refresh');
  } else if (action === "show"){
    $(dropdown).selectpicker();
    $(dropdown).selectpicker('refresh');
    $(dropdown).attr('disabled', false);
    $(".dropdown.bootstrap-select button").removeClass('disabled');
    $(".dropdown.bootstrap-select").removeClass('disabled');
  }
}

// function to show dataset or account Confirm buttons
function showHideDropdownButtons(category, action) {
  if (category === "dataset") {
    if (action === "show") {
      // btn under Step 6
      $($('#button-confirm-bf-dataset').parents()[0]).css("display", "flex");
      $('#button-confirm-bf-dataset').show();
      // btn under Step 1
      $($('#button-confirm-bf-dataset-getting-started').parents()[0]).css("display", "flex");
      $('#button-confirm-bf-dataset-getting-started').show();
    } else {
      // btn under Step 6
      $($('#button-confirm-bf-dataset').parents()[0]).css("display", "none");
      $('#button-confirm-bf-dataset').hide();
      // btn under Step 1
      $($('#button-confirm-bf-dataset-getting-started').parents()[0]).css("display", "none");
      $('#button-confirm-bf-dataset-getting-started').hide();
    }
  } else if (category === "account") {
      if (action === "show") {
        // btn under Step 6
        $("#div-bf-account-btns").css("display", "flex");
        $('#div-bf-account-btns button').show();
        // btn under Step 1
        $("#div-bf-account-btns-getting-started").css("display", "flex");
        $('#div-bf-account-btns-getting-started button').show();
      } else {
        // btn under Step 6
        $("#div-bf-account-btns").css("display", "none");
        $('#div-bf-account-btns button').hide();
        // btn under Step 1
        $("#div-bf-account-btns-getting-started").css("display", "none");
        $('#div-bf-account-btns-getting-started button').hide();
      }
    }
}

function create_child_node(oldFormatNode, nodeName, type, ext) {
  var newFormatNode = {"text": nodeName, "state": {"opened": true}, "children": [], "type": type + ext}
  for (const [key, value] of Object.entries(oldFormatNode["folders"])) {
    var new_node = create_child_node(value, key, "folder", "");
    newFormatNode["children"].push(new_node);
  }
  for (const [key, value] of Object.entries(oldFormatNode["files"])) {
    if (["png", "PNG", "xls", "xlsx", "pdf", "txt", "jpeg", "JPEG", "csv", "CSV", "DOC", "DOCX", "doc", "docx"].includes(path.parse(key).ext)) {
      nodeType = "file " + path.parse(key).ext;
    } else {
      nodeType = "file other"
    }
    var new_node = {"text": key, "type": nodeType};
    newFormatNode["children"].push(new_node)
  }
  return newFormatNode
}

const dataOldStructure = {
    "files":{},
    "folders": {
        "primary":{"folders":{"manage_submit":{"type":"local","path":"C:\\Users\\Public\\SODA-packaging\\SODA\\src\\sections\\manage_submit",
                                              "folders":{},
                                              "files":{"manage_submit.html":{"path":"C:\\Users\\Public\\SODA-packaging\\SODA\\src\\sections\\manage_submit\\manage_submit.html","description":"","additional-metadata":"","type":"local","action":["new"]}},"action":["new"]},
                              "one-step-curation":{"type":"local","path":"C:\\Users\\Public\\SODA-packaging\\SODA\\src\\sections\\one-step-curation",
                                                  "folders":{},
                                                  "files":{"one-step-curation.html":{"path":"C:\\Users\\Public\\SODA-packaging\\SODA\\src\\sections\\one-step-curation\\one-step-curation.html","description":"","additional-metadata":"","type":"local","action":["new"]}},
                                                  "action":["new"]}
                              },
                    "files":{},"type":""},
        "source":{"folders":{},"files":{},"type":""}}}
var jsTreeData = create_child_node(dataOldStructure, "My_dataset_folder", "root", "")

$(document).ready(function(){
  $('#data').jstree({
    "core" : {
        "check_callback" : true,
        "data": jsTreeData
      },
    "plugins": ["types"],
    "types" : {
        "root" : {
          "icon" : "fas fa-folder root",
          "valid_children" : ["default"]
        },
        'folder' : {
            'icon': 'fas fa-folder',
            'font-weight': "600"
        },
        'f-open' : {
                'icon' : 'fas fa-folder-open fa-fw'
        },
        'f-closed' : {
            'icon' : 'fas fa-folder fa-fw'
        },
        'file xlsx': {
          'icon' : './assets/img/excel-file.png'
        },
        'file xls': {
          'icon' : './assets/img/excel-file.png'
        },
        'file png': {
          'icon' : './assets/img/png-file.png'
        },
        'file PNG': {
          'icon' : './assets/img/png-file.png'
        },
        'file pdf': {
          'icon' : './assets/img/pdf-file.png'
        },
        'file txt': {
          'icon' : './assets/img/txt-file.png'
        },
        'file csv': {
          'icon' : './assets/img/csv-file.png'
        },
        'file CSV': {
          'icon' : './assets/img/csv-file.png'
        },
        'file DOC': {
          'icon' : './assets/img/doc-file.png'
        },
        'file DOCX': {
          'icon' : './assets/img/doc-file.png'
        },
        'file docs': {
          'icon' : './assets/img/doc-file.png'
        },
        'file doc': {
          'icon' : './assets/img/doc-file.png'
        },
        'file jpeg': {
          'icon' : './assets/img/jpeg-file.png'
        },
        'file JPEG': {
          'icon' : './assets/img/jpeg-file.png'
        },
        'file other': {
          'icon' : './assets/img/other-file.png'
        }
      }
    })
    $('#data').on('changed.jstree', function (e, data) {
      console.log(data.node.text);
    })
})

$("#data").on('open_node.jstree', function (event, data) {
    data.instance.set_type(data.node,'f-open');
});
$("#data").on('close_node.jstree', function (event, data) {
    data.instance.set_type(data.node,'f-closed');
});
