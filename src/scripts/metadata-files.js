
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
  var errorMetadataFileMessages = ["", "Please only drag and drop a file!", "Your SPARC metadata file must be in one of the formats listed above!", "Your SPARC metadata file must be named and formatted exactly as listed above!"]
  var metadataFileStatus = $($(this).parents()[1]).find('.para-metadata-file-status');
  if (!(errorMetadataFileMessages.includes($(metadataFileStatus).text()))) {
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
  document.getElementById(paraElement).innerHTML = ""

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
        document.getElementById(paraElement).innerHTML = "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>"
      }
    } else {
      document.getElementById(paraElement).innerHTML = "<span style='color:red'>Please only drag and drop a file!</span>"
    }
  }
}
