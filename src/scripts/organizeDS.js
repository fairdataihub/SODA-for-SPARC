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
function delFolder(ev, organizeCurrentLocation, uiItem, singleUIItem, inputGlobal) {

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
        var filtered = getGlobalPath(organizeCurrentLocation)
        var myPath = getRecursivePath(filtered, inputGlobal)
        // update Json object with new folder created
        delete myPath[itemToDelete];
        // update UI with updated jsob obj
        listItems(myPath, uiItem)
        getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal)
        }
      }
    })
  }
}

///// Option to rename a folder
function renameFolder(event1, organizeCurrentLocation, itemElement, inputGlobal, uiItem, singleUIItem) {

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
      title: 'Rename '+ promptVar,
      message: 'Please enter a new name:',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Save',
              className: 'btn-success'
          }
      },
      value: nameWithoutExtension,
      centerVertical: true,
      callback: function (r) {
        if(r!==null){
          // if renaming a file
          if (type==="file") {
            newName = r.trim() + currentName.slice(currentName.indexOf("."))

            // check for duplicate or files with the same name
            for (var i=0;i<itemElement.length;i++) {
              if (newName === itemElement[i].innerText) {
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
              if (organizeCurrentLocation.value === "/" && !(["dataset_description", "submission", "README", "CHANGES", "samples", "subjects"].includes(newName))) {
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

              for (var i=0;i<itemElement.length;i++) {
                if (r.trim() === itemElement[i].innerText) {
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
          var filtered = getGlobalPath(organizeCurrentLocation)
          var myPath = getRecursivePath(filtered, inputGlobal)
          /// update jsonObjGlobal with the new name
          storedValue = myPath[currentName]
          delete myPath[currentName];
          myPath[newName] = storedValue
          /// list items again with updated JSON obj
          listItems(myPath, uiItem)
          getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal)
        }
    }
  })
  }
}

function getGlobalPath(path) {
  var currentPath = path.value.trim()
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered
}

function loadFileFolder(myPath) {

  var appendString = ""
  var sortedObj = sortObjByKeys(myPath)
  for (var item in sortedObj) {
    if (Array.isArray(sortedObj[item])) {
      // not the auto-generated manifest
      if (sortedObj[item].length !== 1) {
        var extension = sliceStringByValue(sortedObj[item][0],  ".")
        if (!["docx", "doc", "pdf", "txt", "jpg", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
          extension = "other"
        }
      } else {
        extension = "other"
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
    }
    else {

      var emptyFolder = "";
      if (! highLevelFolders.includes(item)) {
        if (JSON.stringify(sortedObj[item]) === '{}') {
          emptyFolder = " empty";
        }
      } else {
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
    }
  }

  return appendString
}

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};

  Object.keys(object).sort().forEach(function(key) {
  if (Array.isArray(object[key])) {
    orderedFiles[key] = object[key]
  } else {
      orderedFolders[key] = object[key];
  }
  });
  const orderedObject = {
    ...orderedFolders,
    ...orderedFiles
  }
  return orderedObject
}

function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1)
  return newString
}


function getRecursivePath(filteredList, inputObj) {
  var myPath = inputObj;
  for (var item of filteredList) {
    if (item.trim()!=="") {
      myPath = myPath[item]
    }
  }
  return myPath
}

/// check if an array contains another array
function checkSubArrayBool(parentArray, childArray) {
  var bool = true
  for (var element of childArray) {
    if (!parentArray.includes(element)) {
      bool = false
      break
    }
  }
  return bool
}
//
// function loadingDialog(text1, text2, func) {
//   var bootboxDialog = bootbox.dialog({
//     message: '<p><i class="fa fa-spin fa-spinner"></i> '+text1+'</p>',
//   })
//   bootboxDialog.init(function(){
//     setTimeout(function(){
//       func;
//       bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>"+text2+"");
//   }, 2000);
//   })

function addFilesfunction(fileArray, currentLocation, organizeCurrentLocation, uiItem, singleUIItem, globalPathValue) {

  // check for duplicate or files with the same name
    for (var i=0; i<fileArray.length;i++) {
      var baseName = path.basename(fileArray[i])
      if (organizeCurrentLocation.value === "/" && (!["dataset_description.xlsx", "dataset_description.csv", "dataset_description.json", "submission.xlsx", "submission.json", "submission.csv", "samples.xlsx", "samples.csv", "samples.json", "subjects.xlsx", "subjects.csv", "subjects.json", "CHANGES.txt", "README.txt"].includes(baseName))) {
        bootbox.alert({
          message: "<p>Invalid file(s). Only SPARC metadata files are allowed in the high-level dataset folder.<br> <ul><li>dataset_description (.xslx/.csv/.json)</li><li>submission (.xslx/.csv/.json)</li><li>subjects (.xslx/.csv/.json)</li><li>samples (.xslx/.csv/.json)</li><li>CHANGES.txt</li><li>README.txt</li></ul></p>",
          centerVertical: true
        })
        break
      } else {
        var duplicate = false;
        for (var objKey in currentLocation) {
          if (Array.isArray(currentLocation[objKey])) {
            if (baseName === objKey) {
              duplicate = true
              break
            }
          }
        }
        if (duplicate) {
          bootbox.alert({
            message: 'Duplicate file name: ' + baseName,
            centerVertical: true
          })
        } else {
          currentLocation[baseName] = [fileArray[i], "", ""]
          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

          $(uiItem).html(appendString)
          listItems(currentLocation, uiItem)
          getInFolder(singleUIItem, uiItem, organizeCurrentLocation, globalPathValue)
        }
      }
  }
}

function hideFullName(value) {
  value.style.display = "none";
  value.style.top = '-250%';
  value.style.left = '-250%';
}

function listItems(jsonObj, uiItem) {
    var appendString = ''
    var sortedObj = sortObjByKeys(jsonObj)
    for (var item in sortedObj) {
      if (Array.isArray(sortedObj[item])) {
        // not the auto-generated manifest
        if (sortedObj[item].length !== 1) {
          var extension = sliceStringByValue(sortedObj[item][0],  ".")
          if (!["docx", "doc", "pdf", "txt", "jpg", "JPG", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
            extension = "other"
          }
        } else {
          extension = "other"
        }
        appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
      }
      else {
        var emptyFolder = "";
        if (! highLevelFolders.includes(item)) {
          if (JSON.stringify(sortedObj[item]) === '{}') {
            emptyFolder = " empty";
          }
        } else {
        }
        appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName('+fullNameValue+')"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
      }
    }
    $(uiItem).empty()
    $(uiItem).html(appendString)
}


function getInFolder(singleUIItem, uiItem, currentLocation, globalObj) {
  $(singleUIItem).dblclick(function(){
    if($(this).children("h1").hasClass("myFol")) {
      var folderName = this.innerText
      var appendString = ''
      currentLocation.value = currentLocation.value + folderName + "/"

      var currentPath = currentLocation.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj)
      var appendString = loadFileFolder(myPath)

      $(uiItem).empty()
      $(uiItem).html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath, uiItem)
      getInFolder(singleUIItem, uiItem, currentLocation, globalObj)
    }
  })
}

////// function to trigger action for each context menu option
function hideMenu(category, menu1, menu2, menu3){
  if (category === "folder") {
    menu1.style.display = "none";
    menu1.style.top = "-200%";
    menu1.style.left = '-200%';
  } else if (category === "high-level-folder") {
    menu2.style.display = "none";
    menu2.style.top = "-220%";
    menu2.style.left = '-220%';
  } else {
    menu3.style.display = "none";
    menu3.style.top = "-210%";
    menu3.style.left = "-210%";
  }
}

//////// prompt for Manage description
function triggerManageDescriptionPrompt(fileName, filePath) {
  bootbox.prompt({
    title: "Choose an option below:",
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
        text: 'Add/edit description',
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
          title: "<h2>Add metadata...</h2>",
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
                  bootbox.alert({
                    message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully added!",
                    centerVertical: true
                  })
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
            title: "Add description",
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
                    bootbox.alert({
                      message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully added!",
                      centerVertical: true
                    })
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

// export {getGlobalPath, loadFileFolder, sortObjByKeys, sliceStringByValue, getRecursivePath, checkSubArrayBool, addFilesfunction, hideFullName,
//         listItems, getInFolder, hideMenu, triggerManageDescriptionPrompt}
