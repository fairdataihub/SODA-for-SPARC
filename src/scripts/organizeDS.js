import { highLevelFolderToolTip, highLevelFolders,  } from './renderer.js';

//// option to show tool-tips for high-level folders
function showTooltips(ev) {
  var folderName = ev.parentElement.innerText;
  bootbox.alert({
    message: highLevelFolderToolTip[folderName],
    button: {
      ok: {
        className: 'btn-primary'
      }
    },
    centerVertical: true
  })
}

///////// Option to delete folders or files
function delFolder(ev) {

  var itemToDelete = ev.parentElement.innerText
  // console.log(itemToDelete)
  // console.log(ev.parentElement.innerText)
  var promptVar;
  var highLevelFolderBool;

  /// check for high-level folders (if so, folders cannot be deleted from the current UI)
  if (highLevelFolders.includes(itemToDelete)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (ev.classList.value.includes("myFile")) {
    promptVar = "file";
  } else if (ev.classList.value.includes("myFol")) {
    promptVar = "folder";
  }

  if (highLevelFolderBool) {
    bootbox.alert({
      message: "High-level SPARC folders cannot be deleted!",
      centerVertical: true
    })
  } else {
    bootbox.confirm({
      title: "Delete "+ promptVar,
      message: "Are you sure you want to delete this " + promptVar + "?",
      onEscape: true,
      centerVertical: true,
      callback: function(result) {
      if(result !== null && result === true) {

        /// get current location of folders or files
        var filtered = getGlobalPath()
        var myPath = getRecursivePath(filtered)
        // update Json object with new folder created
        delete myPath[itemToDelete];
        // update UI with updated jsob obj
        listItems(myPath)
        getInFolder(myPath)
        }
      }
    })
  }
}
