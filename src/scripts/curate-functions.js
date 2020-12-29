
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

const progressFileDropdown = document.getElementById('progress-files-dropdown');

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
  }
}

function loadProgressFile(ev) {
  document.getElementById('div-progress-file-loader').style.display = "block";
  setTimeout(function() {
    var jsonContent = progressFileParse(ev);
    sodaJSONObj = jsonContent;
    // first, load manifest file (if applicable)
    if ("manifest-files" in jsonContent) {
      manifestFileCheck.checked = true;
    }
    if ("metadata-files" in jsonContent) {
      var metadataFileArray = Object.keys(jsonContent["metadata-files"]);
      metadataFileArray.forEach(function(element) {
        var fullPath = jsonContent["metadata-files"][element]["path"];
        populateMetadataProgress(path.parse(element).name, fullPath);
      })
    }
    if ("dataset-structure" in jsonContent) {
      var foldersArray = Object.keys(jsonContent["dataset-structure"]["folders"]);
    }
    document.getElementById('div-progress-file-loader').style.display = "none"
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('para-progress-file-status').innerHTML = "<span style='color:var(--color-light-green)'>Previous work loaded successfully! Continue below.</span>"
  }, 2000)
}

function populateMetadataProgress(metadataFileName, localPath) {
  var correspondingMetadataParaElement = {"submission": 'para-submission-file-path', "dataset_description": 'para-ds-description-file-path', "subjects": 'para-subjects-file-path', "samples": 'para-samples-file-path', "CHANGES": 'para-changes-file-path', "README": 'para-readme-file-path'}
  if (metadataFileName in correspondingMetadataParaElement) {
    $("#"+correspondingMetadataParaElement[metadataFileName]).text(localPath);
    $($("#"+correspondingMetadataParaElement[metadataFileName]).parents()[1]).find('.div-metadata-confirm').css("display", "flex");
    $($("#"+correspondingMetadataParaElement[metadataFileName]).parents()[1]).find('.div-metadata-go-back').css("display", "none");
    var buttonElement = $($("#"+correspondingMetadataParaElement[metadataFileName]).parents()[1]).find('.div-metadata-confirm .button-individual-metadata.confirm.transition-btn')
    $(buttonElement[0]).trigger("click")
  }
}

// function to load Progress dropdown
function importOrganizeProgressPrompt() {
  removeOptions(progressFileDropdown);
  addOption(progressFileDropdown, "Select", "Select")
  var fileNames = fs.readdirSync(progressFilePath);
  fileNames.forEach((item, i) => {
    addOption(progressFileDropdown, path.parse(item).name, item)
  });
}

importOrganizeProgressPrompt()
