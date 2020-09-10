//////////////////////////////////////////////////////////////////////////////
///////////////////////// CONTEXT MENU OPTIONS ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////

let menuFolder = null;
let menuFile = null;
menuFolder = document.querySelector('.menu.reg-folder');
menuFile = document.querySelector('.menu.file');
menuHighLevelFolders = document.querySelector('.menu.high-level-folder');


//// helper functions for hiding/showing context menus
function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    if (category === "folder") {
      menuFolder.style.display = "block";
      menuFolder.style.top = `${ev.clientY - 10}px`;
      menuFolder.style.left = `${ev.clientX + 15}px`;
    } else if (category === "high-level-folder") {
      menuHighLevelFolders.style.display = "block";
      menuHighLevelFolders.style.top = `${ev.clientY - 10}px`;
      menuHighLevelFolders.style.left = `${ev.clientX + 15}px`;
    } else {
        menuFile.style.display = "block";
        menuFile.style.top = `${ev.clientY - 10}px`;
        menuFile.style.left = `${ev.clientX + 15}px`;
      }
}

function hideMenu(category){
  if (category === "folder") {
    menuFolder.style.display = "none";
    menuFolder.style.top = "-200%";
    menuFolder.style.left = '-200%';
  } else if (category === "high-level-folder") {
    menuHighLevelFolders.style.display = "none";
    menuHighLevelFolders.style.top = "-220%";
    menuHighLevelFolders.style.left = '-220%';
  } else {
    menuFile.style.display = "block";
    menuFile.style.top = "-210%";
    menuFile.style.left = "-210%";
  }
}

////// function to trigger action for each context menu option

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li").unbind().click(function(){
    if ($(this).attr('id') === "folder-rename") {
        renameFolder(event)
      } else if ($(this).attr('id') === "folder-delete") {
        delFolder(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("folder")
     hideMenu("high-level-folder")
     hideFullName()
 });

 /// options for high-level folders
 $(".menu.high-level-folder li").unbind().click(function(){
   if ($(this).attr('id') === "folder-rename") {
       renameFolder(event)
     } else if ($(this).attr('id') === "folder-delete") {
       delFolder(event)
     } else if ($(this).attr('id') === "tooltip-folders") {
       showTooltips(event)
     }
    // Hide it AFTER the action was triggered
    hideMenu("folder")
    hideMenu("high-level-folder")
    hideFullName()

});
/// hide both menus after an option is clicked
 hideMenu("folder")
 hideMenu("high-level-folder")
 hideFullName()
}

//////// options for files
function fileContextMenu(event) {
  $(".menu.file li").unbind().click(function(){
    if ($(this).attr('id') === "file-rename") {
        renameFolder(event)
      } else if ($(this).attr('id') === "file-delete") {
        delFolder(event)
      } else if ($(this).attr('id') === "file-description") {
        manageDesc(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("file")
 });
 hideMenu("file")
}

// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {
    // Avoid the real one
    event.preventDefault();
    /// check for high level folders
    var highLevelFolderBool = false
    var folderName = event.target.parentElement.innerText
    if (highLevelFolders.includes(folderName)) {
      highLevelFolderBool = true
    }
    // Show the rightcontextmenu for each clicked
    // category (high-level folders, regular sub-folders, and files)
    if (event.target.classList[0] === "myFol") {
      if (highLevelFolderBool) {
        showmenu(event, "high-level-folder")
        hideMenu("file")
      } else {
        showmenu(event, "folder")
        hideMenu("file")
      }
    } else if (event.target.classList[0] === "myFile") {
      showmenu(event, "file")
      hideMenu("folder")
      hideMenu("high-level-folder")
      // otherwise, do not show any menu
    } else {
      hideMenu("folder")
      hideMenu("high-level-folder")
      hideMenu("file")
      hideFullPath()
      hideFullName()
    }
});

$(document).bind("click", function (event) {
  if (event.target.classList[0] !== "myFol" &&
      event.target.classList[0] !== "myFile") {
        hideMenu("folder")
        hideMenu("high-level-folder")
        hideMenu("file")
        hideFullPath()
        hideFullName()
      }
})

//////// prompt for Manage description
function triggerManageDescriptionPrompt(fileName, filePath) {
  bootbox.prompt({
    title: "<h6>Please choose an option: </h6>",
    buttons: {
      cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
            label: '<i class="fa fa-check"></i> Continue',
            className: 'btn-success'
        }
    },
    centerVertical: true,
    size: 'small',
    inputType: 'radio',
    inputOptions: [{
        text: '<h7>Add/edit description</h7>',
        value: 'description',
        className: 'bootbox-input-text'
    },
    {
        text: 'Add/edit additional metadata',
        value: 'metadata'
    }],
    callback: function (result) {
      if (result==="metadata") {
        bootbox.dialog({
          message: "<div class='form-content'>" + "<form class='form' role='form'>" + "<div class='form-group>" + "<label for='metadata'>View/edit additional metadata below: </label>"+"<textarea style='min-height: 80px;margin-top: 10px;font-size: 13px !important' class='form-control' id='metadata'>"+filePath[fileName][2]+"</textarea>"+"</div>"+ "<br>" + "<div class='checkbox'>"+"<label>"+"<input name='apply-all-metadata' type='checkbox'> Apply this metadata to all files in this folder</label> "+" </div> "+"</form>"+"</div>",
          title: "<h6>Adding additional metadata...</h6>",
          buttons: {
            success: {
              label: '<i class="fa fa-check"></i> Save',
              className: "btn-success",
              callback: function () {
                var metadata = $('#metadata').val();
                var applyToAllMetadataBoolean = $("input[name='apply-all-metadata']:checked").val()

                filePath[fileName][2] = metadata.trim()

                if (applyToAllMetadataBoolean==="on") {
                  for (var element in filePath) {
                    if (Array.isArray(filePath[element])) {
                      filePath[element][2] = metadata.trim()
                    }
                  }
                }
              }
            },
            cancel: {
              label: 'Cancel',
              className: "btn btn-default pull-left"
            }
          },
        centerVertical: true,
      });
      } else if (result==="description"){
          bootbox.dialog({
            message: "<div class='form-content'>" + "<form class='form' role='form'>" + "<div class='form-group>" + "<label for='description'>View/Edit your description below:</label> "+"<textarea style='min-height: 80px;margin-top: 10px;font-size: 13px !important' class='form-control' id='description'>"+filePath[fileName][1]+"</textarea>"+ "<br>" + "</div>"+"<div class='checkbox'>"+"<label>"+"<input name='apply-all-desc' type='checkbox'> Apply this description to all files in this folder</label> "+" </div> "+"</form>"+"</div>",
            title: "<h6>Adding a description...</h6>",
            buttons: {
              success: {
                label: '<i class="fa fa-check"></i> Save',
                className: "btn-success",
                callback: function () {
                  var description = $("#description").val();
                  var applyToAllDescBoolean = $("input[name='apply-all-desc']:checked").val()

                  filePath[fileName][1] = description.trim()
                  if (applyToAllDescBoolean==="on") {
                    for (var element in filePath) {
                      if (Array.isArray(filePath[element])) {
                        filePath[element][1] = description.trim()
                      }
                    }
                  }
                }
              },
              cancel: {
                label: "Cancel",
                className: "btn btn-default pull-left"
              }
            },
          value: filePath[fileName][1],
          centerVertical: true,
        });
      }
    }
  });
}

///// Option to manage description for files
function manageDesc(ev) {

  var fileName = ev.parentElement.innerText

  /// get current location of files in JSON object
  var filtered = getGlobalPath()
  var myPath = getRecursivePath(filtered)

  /// prompt for Manage description
  triggerManageDescriptionPrompt(fileName, myPath)

  /// list Items again with new updated JSON structure
  listItems(myPath)
  getInFolder(myPath)
}


///// Option to rename a folder
function renameFolder(event1) {

  var promptVar;
  var type;
  var newName;
  var currentName = event1.parentElement.innerText
  var nameWithoutExtension;
  var highLevelFolderBool;
  var duplicate = false

  if (highLevelFolders.includes(currentName)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (event1.classList[0] === "myFile") {
    promptVar = "file";
    type = "file";
  } else if (event1.classList[0] === "myFol") {
    promptVar = "folder";
    type = "folder";
  }

  if (type==="file") {
    nameWithoutExtension = currentName.slice(0,currentName.indexOf("."))
  } else {
    nameWithoutExtension = currentName
  }

  if (highLevelFolderBool) {
    bootbox.alert({
      message: "High-level SPARC folders cannot be renamed!",
      centerVertical: true
    })
  } else {
    // show prompt to enter a new name
    bootbox.prompt({
      title: '<h6>Renaming '+ promptVar + "..." + '</h6>',
      message: '<p> Please enter a new name: </p>',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Save',
              className: 'btn-success'
          }
      },
      size: "small",
      value: nameWithoutExtension,
      centerVertical: true,
      callback: function (r) {
        if(r!==null){
          // if renaming a file
          if (type==="file") {
            newName = r.trim() + currentName.slice(currentName.indexOf("."))

            // check for duplicate or files with the same name
            var itemDivElements = document.getElementById("items").children
            for (var i=0;i<itemDivElements.length;i++) {
              if (newName === itemDivElements[i].innerText) {
                duplicate = true
                break
              }
            }
            if (duplicate) {
              bootbox.alert({
                message:"Duplicate file name: " + newName,
                centerVertical: true
              })
            } else {
              if (globalPath.value === "/" && !(["dataset_description", "submission", "README", "CHANGES", "samples", "subjects"].includes(newName))) {
                bootbox.alert({
                  message:"Invalid name for a metadata file! Required names for metadata files are: <b>'dataset_description', 'submission', 'samples', 'subjects', 'README', 'CHANGES'</b>. Please try renaming your file again.",
                  centerVertical: true
                })
                return
              }
            }

          //// if renaming a folder
          } else {
              // check for duplicate folder as shown in the UI
              var itemDivElements = document.getElementById("items").children
              for (var i=0;i<itemDivElements.length;i++) {
                if (r.trim() === itemDivElements[i].innerText) {
                  duplicate = true
                  break
                }
              }
              if (duplicate) {
                bootbox.alert({
                  message:"Duplicate folder name: " + r.trim(),
                  centerVertical: true
                })
                return
              } else {
                newName = r.trim()
              }
          }

          /// assign new name to folder or file in the UI
          event1.parentElement.parentElement.innerText = newName
          /// get location of current file or folder in JSON obj
          var filtered = getGlobalPath()
          var myPath = getRecursivePath(filtered)
          /// update jsonObjGlobal with the new name
          storedValue = myPath[currentName]
          delete myPath[currentName];
          myPath[newName] = storedValue
          /// list items again with updated JSON obj
          listItems(myPath)
          getInFolder(myPath)
        }
    }
  })
  }
}

///////// Option to delete folders or files
function delFolder(ev) {

  var itemToDelete = ev.parentElement.parentElement.innerText
  var promptVar;
  var highLevelFolderBool;

  /// check for high-level folders (if so, folders cannot be deleted from the current UI)
  if (highLevelFolders.includes(itemToDelete)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (ev.classList.value === "myFile") {
    promptVar = "file";
  } else if (ev.classList.value === "fas fa-folder") {
    promptVar = "folder";
  }

  if (highLevelFolderBool) {
    bootbox.alert({
      message: "High-level SPARC folders cannot be deleted!",
      centerVertical: true
    })
  } else {
    bootbox.confirm({
      title: "Deleting a "+ promptVar + "...",
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
  // dialog.showMessageBox(options)
}
