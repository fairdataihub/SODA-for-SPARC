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
function delFolder(
  ev,
  organizeCurrentLocation,
  uiItem,
  singleUIItem,
  inputGlobal
) {
  var itemToDelete = ev.parentElement.innerText;
  var promptVar;
  var type; // renaming files or folders

  if (ev.classList.value.includes("myFile")) {
    promptVar = "file";
    type = "files";
  } else if (ev.classList.value.includes("myFol")) {
    promptVar = "folder";
    type = "folders";
  }

  if (ev.classList.value.includes("deleted")) {
    bootbox.confirm({
      title: "Restore " + promptVar,
      message:
        "Are you sure you want to restore this " +
        promptVar +
        "? If any " +
        promptVar +
        " of the same name has been added, this restored " +
        promptVar +
        " will be renamed.",
      onEscape: true,
      centerVertical: true,
      callback: function (result) {
        if (result !== null && result === true) {
          /// get current location of folders or files
          let itemToRestore = itemToDelete;
          var filtered = getGlobalPath(organizeCurrentLocation);
          var myPath = getRecursivePath(filtered.slice(1), inputGlobal);

          // update Json object with the restored object
          let index = myPath[type][itemToRestore]["action"].indexOf("deleted");
          myPath[type][itemToRestore]["action"].splice(index, 1);
          let itemToRestore_new_key = itemToRestore.substring(
            0,
            itemToRestore.lastIndexOf("-")
          );
          // Add a (1) if the file name already exists
          if (itemToRestore_new_key in myPath[type]) {
            myPath[type][itemToRestore]["action"].push("renamed");
            itemToRestore_new_key = itemToRestore_new_key + "(1)";
          }
          myPath[type][itemToRestore_new_key] = myPath[type][itemToRestore];
          delete myPath[type][itemToRestore];

          // update UI with updated jsonobj
          listItems(myPath, uiItem);
          getInFolder(
            singleUIItem,
            uiItem,
            organizeCurrentLocation,
            inputGlobal
          );
        }
      },
    });
  } else {
    if ($(".selected-file").length > 2) {
      bootbox.confirm({
        title: "Delete " + promptVar,
        message: "Are you sure you want to delete these " + promptVar + "s?",
        onEscape: true,
        centerVertical: true,
        callback: function (result) {
          if (result !== null && result === true) {
            /// get current location of folders or files
            var filtered = getGlobalPath(organizeCurrentLocation);
            var myPath = getRecursivePath(filtered.slice(1), inputGlobal);

            $(".single-item, .selected-file").each(function (
              index,
              current_element
            ) {
              itemToDelete = $($(current_element).children()[1]).text();
              // fix mypath
              // update Json object with new folder created
              if (
                myPath[type][itemToDelete]["type"] === "bf" ||
                (myPath[type][itemToDelete]["type"] === "local" &&
                  myPath[type][itemToDelete]["action"].includes("existing"))
              ) {
                if (!myPath[type][itemToDelete]["action"].includes("deleted")) {
                  myPath[type][itemToDelete]["action"] = [];
                  myPath[type][itemToDelete]["action"].push("existing");
                  myPath[type][itemToDelete]["action"].push("deleted");
                  let itemToDelete_new_key = itemToDelete + "-DELETED";
                  myPath[type][itemToDelete_new_key] =
                    myPath[type][itemToDelete];
                  delete myPath[type][itemToDelete];
                }
              } else {
                delete myPath[type][itemToDelete];
              }
            });

            // update UI with updated jsonobj
            listItems(myPath, uiItem);
            getInFolder(
              singleUIItem,
              uiItem,
              organizeCurrentLocation,
              inputGlobal
            );
          }
        },
      });
    } else {
      bootbox.confirm({
        title: "Delete " + promptVar,
        message: "Are you sure you want to delete this " + promptVar + "?",
        onEscape: true,
        centerVertical: true,
        callback: function (result) {
          if (result !== null && result === true) {
            /// get current location of folders or files
            var filtered = getGlobalPath(organizeCurrentLocation);
            var myPath = getRecursivePath(filtered.slice(1), inputGlobal);
            // update Json object with new folder created
            if (
              myPath[type][itemToDelete]["type"] === "bf" ||
              (myPath[type][itemToDelete]["type"] === "local" &&
                myPath[type][itemToDelete]["action"].includes("existing"))
            ) {
              if (!myPath[type][itemToDelete]["action"].includes("deleted")) {
                myPath[type][itemToDelete]["action"] = [];
                myPath[type][itemToDelete]["action"].push("existing");
                myPath[type][itemToDelete]["action"].push("deleted");
                let itemToDelete_new_key = itemToDelete + "-DELETED";
                myPath[type][itemToDelete_new_key] = myPath[type][itemToDelete];
                delete myPath[type][itemToDelete];
              }
            } else {
              delete myPath[type][itemToDelete];
            }
            // update UI with updated jsonobj
            listItems(myPath, uiItem);
            getInFolder(
              singleUIItem,
              uiItem,
              organizeCurrentLocation,
              inputGlobal
            );
          }
        },
      });
    }
  }
}

// helper function to rename files/folders
function checkValidRenameInput(event, input, type, oldName, newName, itemElement, myBootboxDialog) {
  var duplicate = false;
  // if renaming a file
  if (type==="files") {
    newName = input.trim() + path.parse(oldName).ext
    // check for duplicate or files with the same name
    for (var i=0;i<itemElement.length;i++) {
      if (path.parse(newName).name === path.parse(itemElement[i].innerText).name) {
        duplicate = true
        break
      }
    }
    if (duplicate) {
      $(myBootboxDialog).find(".modal-footer span").text("")
      myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>The file name: "+newName+" already exists, please rename to a different name!</span>");
      newName = "";
    }
  //// if renaming a folder
  } else {
      newName = input.trim()
      // check for duplicate folder as shown in the UI
      for (var i=0;i<itemElement.length;i++) {
        if (input.trim() === itemElement[i].innerText) {
          duplicate = true
          break
        }
      }
      if (duplicate) {
        $(myBootboxDialog).find(".modal-footer span").text("")
        myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>The folder name: "+input.trim()+" already exists, please rename to a different name!</span>");
        newName = "";
      }
  }
  return newName
}

///// Option to rename a folder and files
function renameFolder(
  event1,
  organizeCurrentLocation,
  itemElement,
  inputGlobal,
  uiItem,
  singleUIItem
) {
  var promptVar;
  var type; // renaming files or folders
  var newName;
  var currentName = event1.parentElement.innerText;
  var nameWithoutExtension;
  var highLevelFolderBool;

  if (highLevelFolders.includes(currentName)) {
    highLevelFolderBool = true;
  } else {
    highLevelFolderBool = false;
  }

  if (event1.classList[0] === "myFile") {
    promptVar = "file";
    type = "files";
  } else if (event1.classList[0] === "myFol") {
    promptVar = "folder";
    type = "folders";
  }
  if (type === "files") {
    nameWithoutExtension = path.parse(currentName).name;
  } else {
    nameWithoutExtension = currentName;
  }

  if (highLevelFolderBool) {
    bootbox.alert({
      message: "High-level SPARC folders cannot be renamed!",
      centerVertical: true,
    });
  } else {
    // show prompt to enter a new name
    var myBootboxDialog = bootbox.dialog({
      title: "Rename " + promptVar,
      message:
        'Please enter a new name: <p><input type="text" id="input-new-name-renamed" class="form-control" value="' +
        nameWithoutExtension +
        '"></input></p>',
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel',
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Save',
          className: "btn-success",
          callback: function () {
            var returnedName = checkValidRenameInput(
              event1,
              $("#input-new-name-renamed").val().trim(),
              type,
              currentName,
              newName,
              itemElement,
              myBootboxDialog
            );
            if (returnedName !== "") {
              myBootboxDialog.modal("hide");
              bootbox.alert({
                message: "Successfully renamed!",
                centerVertical: true,
              });

              /// assign new name to folder or file in the UI
              event1.parentElement.parentElement.innerText = returnedName;
              /// get location of current file or folder in JSON obj
              var filtered = getGlobalPath(organizeCurrentLocation);
              var myPath = getRecursivePath(filtered.slice(1), inputGlobal);
              /// update jsonObjGlobal with the new name
              storedValue = myPath[type][currentName];
              delete myPath[type][currentName];
              myPath[type][returnedName] = storedValue;
              if (
                "action" in myPath[type][returnedName] &&
                !myPath[type][returnedName]["action"].includes("renamed")
              ) {
                myPath[type][returnedName]["action"].push("renamed");
              } else {
                myPath[type][returnedName]["action"] = ["new", "renamed"];
              }
              /// list items again with updated JSON obj
              listItems(myPath, uiItem);
              getInFolder(
                singleUIItem,
                uiItem,
                organizeCurrentLocation,
                inputGlobal
              );
            }
            return false;
          },
        },
      },
      centerVertical: true,
    });
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

  for (var item in sortedObj["folders"]) {
    var emptyFolder = "";
    if (! highLevelFolders.includes(item)) {
      if (
        JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
        JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
    ) {
        emptyFolder = " empty";
      }
    }
    appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
  }
  for (var item in sortedObj["files"]) {
    // not the auto-generated manifest
    if (sortedObj["files"][item].length !== 1) {
      var extension = sliceStringByValue(sortedObj["files"][item]["path"],  ".")
      if (!["docx", "doc", "pdf", "txt", "jpg", "JPG", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
        extension = "other"
      }
    } else {
      extension = "other"
    }
    appendString = appendString + '<div class="single-item"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
  }

  return appendString
}

function getRecursivePath(filteredList, inputObj) {
  var myPath = inputObj;
  for (var item of filteredList) {
    if (item.trim()!=="") {
      myPath = myPath["folders"][item]
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

function showItemsAsListBootbox(arrayOfItems) {
  var htmlElement = "";
  for (var element of arrayOfItems) {
    htmlElement = htmlElement + "<li>" + element + "</li>"
  }
  return htmlElement
}

function addFilesfunction(fileArray, currentLocation, organizeCurrentLocation, uiItem, singleUIItem, globalPathValue) {

  // check for duplicate or files with the same name
  var nonAllowedDuplicateFiles = [];
  var regularFiles = {};
  var uiFilesWithoutExtension = {};

  for (var file in currentLocation["files"]) {
    uiFilesWithoutExtension[path.parse(file).name] = 1
  }

  for (var i=0; i<fileArray.length;i++) {
    var fileName = fileArray[i];
    // check if dataset structure level is at high level folder
    var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount === 1) {
      bootbox.alert({
        message: "<p>SPARC metadata files can be imported in the next step!</p>",
        centerVertical: true
      })
      break
    } else {
        if (JSON.stringify(currentLocation["files"]) === "{}" && JSON.stringify(regularFiles) === "{}") {
          regularFiles[path.parse(fileName).name] = {"path": fileName, "basename":path.parse(fileName).base}
        } else {
            for (var objectKey in currentLocation["files"]) {
              if (objectKey !== undefined) {
                var nonAllowedDuplicate = false;
                if (fileName === currentLocation["files"][objectKey]["path"]) {
                  nonAllowedDuplicateFiles.push(fileName);
                  nonAllowedDuplicate = true;
                  break
                }
              }
            }
            if (!nonAllowedDuplicate) {
              var j = 1;
              var fileBaseName = path.basename(fileName);
              var originalFileNameWithoutExt = path.parse(fileBaseName).name;
              var fileNameWithoutExt = originalFileNameWithoutExt;
              while (fileNameWithoutExt in uiFilesWithoutExtension || fileNameWithoutExt in regularFiles) {
                fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
                j++;
              }
              regularFiles[fileNameWithoutExt] = {"path": fileName, "basename": fileNameWithoutExt + path.parse(fileName).ext};
            }
          }
      }
    }

    // now handle non-allowed duplicates (show message), allowed duplicates (number duplicates & append to UI),
    // and regular files (append to UI)
    if (Object.keys(regularFiles).length > 0) {
      for (var element in regularFiles) {
        currentLocation["files"][regularFiles[element]["basename"]] = {"path": regularFiles[element]["path"], "type": "local", "description":"", "additional-metadata":"", "action":["new"]}
        // append "renamed" to "action" key if file is auto-renamed by UI
        var originalName = path.parse(currentLocation["files"][regularFiles[element]["basename"]]["path"]).name;
        if (element !== originalName) {
          currentLocation["files"][regularFiles[element]["basename"]]["action"].push('renamed');
        }
        var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+regularFiles[element]["basename"]+'</div></div>'
        $(uiItem).html(appendString)
        listItems(currentLocation, uiItem)
        getInFolder(singleUIItem, uiItem, organizeCurrentLocation, globalPathValue)
      }
    }
    if (nonAllowedDuplicateFiles.length > 0) {
      var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles)
      bootbox.alert({
        message: 'The following files are already imported into the current location of your dataset: <p><ul>'+listElements+'</ul></p>',
        centerVertical: true
      })
    }
}

///// function to load details to show in display once
///// users click Show details
function loadDetailsContextMenu(
  fileName,
  filePath,
  textareaID1,
  textareaID2,
  paraLocalPath
) {
  if ("description" in filePath["files"][fileName]) {
    document.getElementById(textareaID1).value =
      filePath["files"][fileName]["description"];
  } else {
    document.getElementById(textareaID1).value = "";
  }
  if ("additional-metadata" in filePath["files"][fileName]) {
    document.getElementById(textareaID2).value =
      filePath["files"][fileName]["additional-metadata"];
  } else {
    document.getElementById(textareaID2).value = "";
  }
  path_label = document.querySelector(
    "#organize-dataset-tab > div > div > div > div.div-display-details.file > div:nth-child(2) > label"
  );
  if (filePath["files"][fileName]["type"] === "bf") {
    path_label.innerHTML = "<b>Blackfynn path:<br></b>";
    bf_path = "";
    filePath["files"][fileName]["bfpath"].forEach(
      (item) => (bf_path += item + "/")
    );
    bf_path += fileName;
    document.getElementById(paraLocalPath).innerHTML = bf_path;
  } else {
    path_label.innerHTML = "<b>Local path:<br></b>";
    document.getElementById(paraLocalPath).innerHTML =
      filePath["files"][fileName]["path"];
  }
}

//path_label = document.querySelector("#organize-dataset-tab > div > div > div > div.div-display-details.file > div:nth-child(2) > label");


function triggerManageDetailsPrompts(ev, fileName, filePath, textareaID1, textareaID2) {
  filePath["files"][fileName]["additional-metadata"] = document.getElementById(textareaID2).value.trim();
  filePath["files"][fileName]["description"] = document.getElementById(textareaID1).value.trim();
  // check for "Apply to all files"
  if (document.getElementById("input-add-file-metadata").checked) {
    for (var file in filePath["files"]) {
        filePath["files"][file]["additional-metadata"] = document.getElementById(textareaID2).value.trim();
      }
    }
  if (document.getElementById("input-add-file-description").checked) {
    for (var file in filePath["files"]) {
        filePath["files"][file]["description"] = document.getElementById(textareaID1).value.trim();
      }
    }
   // $(this).html("Done <i class='fas fa-check'></i>");
};
