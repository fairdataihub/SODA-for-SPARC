

var metadataFile = '';

$(".metadata-button").click(function() {
  metadataFile = $(this);
  $(".div-organize-generate-dataset.metadata").addClass('hide');
  var target = $(this).attr('data-next');
  $("#"+target).toggleClass('show');
  document.getElementById("nextBtn").style.display = "none";
  document.getElementById("prevBtn").style.display = "none";
})

$(".button-individual-metadata").click(function() {
  $($(this).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";

  // Checking if metadata files are imported
  //// once users click "Confirm" or "Cancel", check if file is specified
  //// if yes: addClass 'done'
  //// if no: removeClass 'done'

  var metadataFileStatus = $($(this).parents()[1]).find('.para-metadata-file-status');
  if ($(metadataFileStatus).text() !== ""
      && $(metadataFileStatus).text() !== "Please drag a file!"
      && $(metadataFileStatus).text() !== "Please only import SPARC metadata files!"
    ) {
    $(metadataFile).addClass('done')
  } else {
    $(metadataFile).removeClass('done');
    $(metadataFileStatus).text("");
  }
})

$(".button-individual-metadata.cancel").click(function() {
  $($(this).parents()[1]).removeClass('show');
  $(".div-organize-generate-dataset.metadata").removeClass('hide');
  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
})

function dropHandler(ev, paraElement, metadataFile) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    /// if users drag multiple files, only show first file
    var file = ev.dataTransfer.items[0];
      // If dropped items aren't files, reject them
    if (ev.dataTransfer.items[0].kind === 'file') {
      var file = ev.dataTransfer.items[0].getAsFile();
      var metadataWithoutExtension = file.name.slice(0, file.name.indexOf('.'))
      if (metadataWithoutExtension === metadataFile) {
        document.getElementById(paraElement).innerHTML = file.path
      } else {
        document.getElementById(paraElement).innerHTML = "<span style='color:red'>Please only import SPARC metadata files!</span>"
      }
    } else {
      document.getElementById(paraElement).innerHTML = "<span style='color:red'>Please drag a file!</span>"
    }
  }
}


var metadataIndividualFile = "";
var metadataAllowedExtensions = [];
var metadataParaElement = "";

function importMetadataFiles(ev, metadataFile, extentionList, paraEle) {
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extentionList;
  metadataParaElement = paraEle;
  ipcRenderer.send('open-file-dialog-metadata-curate');
}

ipcRenderer.on('selected-metadataCurate', (event, mypath) => {
  var dotCount = path.basename(mypath[0]).trim().split(".").length - 1;
  if (dotCount === 1)  {
    var metadataWithoutExtension = path.basename(mypath[0]).slice(0, path.basename(mypath[0]).indexOf('.'));
    var extension = path.basename(mypath[0]).slice(path.basename(mypath[0]).indexOf('.'));

    if (metadataWithoutExtension === metadataIndividualFile) {
      if (metadataAllowedExtensions.includes(extension)) {
        document.getElementById(metadataParaElement).innerHTML = mypath[0]
      } else {
        document.getElementById(metadataParaElement).innerHTML = "<span style='color:red'>We only support SPARC metadata files in the format listed above!</span>"
      }
    } else {
      document.getElementById(metadataParaElement).innerHTML = "<span style='color:red'>Please only import SPARC metadata files!</span>"
    }
  }
})
