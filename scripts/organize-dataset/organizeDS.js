//// option to show tool-tips for high-level folders
function showTooltips(ev) {
  var folderName = ev.parentElement.innerText;
  Swal.fire({
    icon: "info",
    html: highLevelFolderToolTip[folderName],
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate_fastest",
    },
  });
}

const recursive_mark_sub_files_deleted = (dataset_folder, mode) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        continue;
      }
      if (mode === "delete") {
        if (!dataset_folder["files"][file]["action"].includes("recursive_deleted")) {
          dataset_folder["files"][file]["action"].push("recursive_deleted");
        }
      } else if (mode === "restore") {
        if (dataset_folder["files"][file]["action"].includes("recursive_deleted")) {
          let index = dataset_folder["files"][file]["action"].indexOf("recursive_deleted");
          dataset_folder["files"][file]["action"].splice(index, 1);
        }
      }
    }
  }
  if ("folders" in dataset_folder && Object.keys(dataset_folder["folders"]).length !== 0) {
    for (let folder in dataset_folder["folders"]) {
      recursive_mark_sub_files_deleted(dataset_folder["folders"][folder], mode);
      if ("action" in dataset_folder["folders"][folder]) {
        if (mode === "delete") {
          if (!dataset_folder["folders"][folder]["action"].includes("recursive_deleted")) {
            dataset_folder["folders"][folder]["action"].push("recursive_deleted");
          }
        } else if (mode === "restore") {
          if (dataset_folder["folders"][folder]["action"].includes("recursive_deleted")) {
            let index = dataset_folder["folders"][folder]["action"].indexOf("recursive_deleted");
            dataset_folder["folders"][folder]["action"].splice(index, 1);
          }
        }
      }
    }
  }
};

///////// Option to delete folders or files
function delFolder(ev, organizeCurrentLocation, uiItem, singleUIItem, inputGlobal) {
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

  // selected-item class will always be in multiples of two
  if ($(".selected-item").length > 2) {
    type = "items";
  }

  if (ev.classList.value.includes("deleted")) {
    if (ev.classList.value.includes("selected-item") && type === "items") {
      Swal.fire({
        title: `Restore ${type}`,
        icon: "warning",
        text: "You can only restore one file at a time. Please select a single file for restoration.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      return;
    }
    if (ev.classList.value.includes("recursive_deleted_file")) {
      Swal.fire({
        title: `Restore ${type}`,
        icon: "warning",
        text: "The parent folder for this item has been marked for deletion. Please restore that folder to recover this item.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      return;
    }

    // Handle file/folder restore
    Swal.fire({
      icon: "warning",
      title: `Restore ${promptVar}`,
      text: `Are you sure you want to restore this ${promptVar}? If any ${promptVar} of the same name has been added, this restored ${promptVar} will be renamed.`,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "OK",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let itemToRestore = itemToDelete;
        var filtered = getGlobalPath(organizeCurrentLocation);

        var myPath = getRecursivePath(filtered.slice(1), inputGlobal);

        if (filtered.length == 1) {
          let itemToRestore_new_key = itemToRestore.substring(0, itemToRestore.lastIndexOf("-"));
          if (itemToRestore_new_key in myPath[type]) {
            Swal.fire({
              title: `Unable to restore ${type}`,
              icon: "warning",
              text: "There already exists a high level folder with the same name. Please remove that folder before you restore this one.",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            });
            return;
          }
        }

        if (type === "folders") {
          recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "restore");
        }

        // update Json object with the restored object
        let index = myPath[type][itemToRestore]["action"].indexOf("deleted");
        myPath[type][itemToRestore]["action"].splice(index, 1);
        let itemToRestore_new_key = itemToRestore.substring(0, itemToRestore.lastIndexOf("-"));

        // Add a (somenumber) if the file name already exists
        // Done using a loop to avoid a case where the same file number exists
        if (itemToRestore_new_key in myPath[type]) {
          myPath[type][itemToRestore]["action"].push("renamed");
          itemToRestore_new_key_file_name = path.parse(itemToRestore_new_key).name;
          itemToRestore_new_key_file_ext = path.parse(itemToRestore_new_key).ext;
          file_number = 1;
          while (true) {
            itemToRestore_potential_new_key =
              itemToRestore_new_key_file_name +
              " (" +
              file_number +
              ")" +
              itemToRestore_new_key_file_ext;
            if (!myPath[type].hasOwnProperty(itemToRestore_potential_new_key)) {
              itemToRestore_new_key = itemToRestore_potential_new_key;
              break;
            }
            file_number++;
          }
        }

        // Add the restored item with the new file name back into the object.
        myPath[type][itemToRestore_new_key] = myPath[type][itemToRestore];
        delete myPath[type][itemToRestore];

        // update UI with updated jsonobj
        listItems(myPath, uiItem, 500, (reset = true));
        getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
        beginScrollListen();
      }
    });
  } else {
    if (type === "items") {
      Swal.fire({
        icon: "warning",
        title: `Delete ${promptVar}`,
        text: `Are you sure you want to delete these ${type}?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: `Delete ${type}`,
        cancelButtonText: "Cancel",
        reverseButtons: reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          var filtered = getGlobalPath(organizeCurrentLocation);
          var myPath = getRecursivePath(filtered.slice(1), inputGlobal);

          $("div.single-item.selected-item > .folder_desc").each(function (index, current_element) {
            itemToDelete = $(current_element).text();
            if (itemToDelete in myPath["files"]) {
              type = "files";
            } else if (itemToDelete in myPath["folders"]) {
              type = "folders";
            }
            if (
              myPath[type][itemToDelete]["type"] === "bf" ||
              (myPath[type][itemToDelete]["type"] === "local" &&
                myPath[type][itemToDelete]["action"].includes("existing"))
            ) {
              if (type === "folders") {
                recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "delete");
                current_element.parentNode.remove();
              }

              if (!myPath[type][itemToDelete]["action"].includes("deleted")) {
                myPath[type][itemToDelete]["action"] = [];
                myPath[type][itemToDelete]["action"].push("existing");
                myPath[type][itemToDelete]["action"].push("deleted");
                let itemToDelete_new_key = itemToDelete + "-DELETED";
                myPath[type][itemToDelete_new_key] = myPath[type][itemToDelete];
                delete myPath[type][itemToDelete];
                let current_item = current_element.parentElement;
                current_item.children[0].classList.add("deleted-file");
                current_item.children[1].className = "folder_desc pennsieve_file";
              }
            } else {
              delete myPath[type][itemToDelete];
            }
          });

          // update UI with updated jsonobj
          listItems(myPath, uiItem, 500, (reset = true));
          getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
          beginScrollListen();
        }
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: `Delete ${promptVar}`,
        text: `Are you sure you want to delete this ${promptVar}?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: `Delete ${promptVar}`,
        cancelButtonText: "Cancel",
        reverseButtons: reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          /// get current location of folders or files
          var filtered = getGlobalPath(organizeCurrentLocation);
          var myPath = getRecursivePath(filtered.slice(1), inputGlobal);
          // update Json object with new folder created
          if (
            myPath[type][itemToDelete]["type"] === "bf" ||
            (myPath[type][itemToDelete]["type"] === "local" &&
              myPath[type][itemToDelete]["action"].includes("existing"))
          ) {
            if (type === "folders") {
              recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "delete");
            }

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
          listItems(myPath, uiItem, 500, (reset = true));
          getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
          beginScrollListen();
        }
      });
    }
  }
}

// helper function to rename files/folders
function checkValidRenameInput(
  event,
  input,
  type,
  oldName,
  newName,
  itemElement
  // myBootboxDialog
) {
  double_extensions = [
    ".ome.tiff",
    ".ome.tif",
    ".ome.tf2,",
    ".ome.tf8",
    ".ome.btf",
    ".ome.xml",
    ".brukertiff.gz",
    ".mefd.gz",
    ".moberg.gz",
    ".nii.gz",
    ".mgh.gz",
    ".tar.gz",
    ".bcl.gz",
  ];

  var duplicate = false;
  // if renaming a file
  if (type === "files") {
    let double_ext_present = false;
    for (let index in double_extensions) {
      if (oldName.search(double_extensions[index]) != -1) {
        newName = input.trim() + path.parse(path.parse(oldName).name).ext + path.parse(oldName).ext;
        double_ext_present = true;
        break;
      }
    }
    if (double_ext_present == false) {
      newName = input.trim() + path.parse(oldName).ext;
    }
    // check for duplicate or files with the same name
    for (var i = 0; i < itemElement.length; i++) {
      if (!itemElement[i].innerText.includes("-DELETED")) {
        if (newName === path.parse(itemElement[i].innerText).base) {
          duplicate = true;
          break;
        }
      }
    }
    if (duplicate) {
      Swal.fire({
        icon: "error",
        text: `The file name: ${newName} already exists, please rename to a different name!`,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });
      newName = "";
      // log the error
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 3", "Rename", "File"],
        determineDatasetLocation()
      );
    }
    //// if renaming a folder
  } else {
    newName = input.trim();
    // check for duplicate folder as shown in the UI
    for (var i = 0; i < itemElement.length; i++) {
      if (input.trim() === itemElement[i].innerText) {
        duplicate = true;
        break;
      }
    }
    var itemDivElements = document.getElementById("items").children;
    let organizeCurrentLocation = organizeDSglobalPath;
    renameFolder(event, organizeCurrentLocation, itemDivElements);
    if (duplicate) {
      Swal.fire({
        icon: "error",
        text: `The folder name: ${newName} already exists, please rename to a different name!`,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });
      newName = "";

      // log the error
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 3", "Rename", "Folder"],
        determineDatasetLocation()
      );
    }
  }
  return newName;
}

///// Option to rename a folder and files
function renameFolder(
  event1, //this
  organizeCurrentLocation, //current section of My_folder
  itemElement, //the elements in the container with items
  inputGlobal, //datasetStructureJSONObj
  uiItem, //container with the folders
  singleUIItem //class name
) {
  var promptVar;
  var type; // renaming files or folders
  var newName;
  var currentName = event1.parentElement.getElementsByTagName("div")[0].innerText;
  var nameWithoutExtension;
  var highLevelFolderBool;

  double_extensions = [
    ".ome.tiff",
    ".ome.tif",
    ".ome.tf2,",
    ".ome.tf8",
    ".ome.btf",
    ".ome.xml",
    ".brukertiff.gz",
    ".mefd.gz",
    ".moberg.gz",
    ".nii.gz",
    ".mgh.gz",
    ".tar.gz",
    ".bcl.gz",
  ];

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
    let double_ext_present = false;
    for (let index in double_extensions) {
      if (currentName.search(double_extensions[index]) != -1) {
        nameWithoutExtension = path.parse(path.parse(currentName).name).name;
        double_ext_present = true;
        break;
      }
    }
    if (double_ext_present == false) {
      nameWithoutExtension = path.parse(currentName).name;
    }
  } else {
    nameWithoutExtension = currentName;
  }

  if (highLevelFolderBool) {
    Swal.fire({
      icon: "warning",
      text: "High-level SPARC folders cannot be renamed!",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else {
    Swal.fire({
      title: `Rename ${promptVar}`,
      text: "Please enter a new name:",
      input: "text",
      inputValue: nameWithoutExtension,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        $(".swal2-input").attr("id", "rename-folder-input");
        $(".swal2-confirm").attr("id", "rename-folder-button");
        let swal_popup = document.getElementsByClassName("swal2-popup")[0];
        swal_popup.style.width = "42rem";
        $("#rename-folder-input").keyup(function () {
          var val = $("#rename-folder-input").val();
          for (var char of nonAllowedCharacters) {
            if (val.includes(char)) {
              Swal.showValidationMessage(
                `The folder name cannot contains the following characters ${nonAllowedCharacters}, please rename to a different name!`
              );
              let swal_message = document.getElementsByClassName("swal2-validation-message")[0];
              swal_message.style.margin = "1rem";
              $("#rename-folder-button").attr("disabled", true);
              return;
            }
            $("#rename-folder-button").attr("disabled", false);
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var returnedName = checkValidRenameInput(
          event1,
          result.value.trim(),
          type,
          currentName,
          newName,
          itemElement
          // myBootboxDialog
        );
        if (returnedName !== "") {
          Swal.fire({
            icon: "success",
            text: "Successfully renamed!.",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showClass: {
              popup: "animate__animated animate__fadeInDown animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutUp animate__faster",
            },
          });

          // log the success
          logCurationForAnalytics(
            "Success",
            PrepareDatasetsAnalyticsPrefix.CURATE,
            AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
            ["Step 3", "Rename", promptVar],
            determineDatasetLocation()
          );

          /// assign new name to folder or file in the UI
          event1.parentElement.children[1].innerText = returnedName;
          /// get location of current file or folder in JSON obj
          var filtered = getGlobalPath(organizeCurrentLocation);
          var myPath = getRecursivePath(filtered.slice(1), inputGlobal);
          /// update jsonObjGlobal with the new name
          storedValue = myPath[type][currentName];
          delete myPath[type][currentName];
          myPath[type][returnedName] = storedValue;
          myPath[type][returnedName]["basename"] = returnedName;
          if ("action" in myPath[type][returnedName]) {
            if (!myPath[type][returnedName]["action"].includes("renamed")) {
              myPath[type][returnedName]["action"].push("renamed");
            }
          } else {
            myPath[type][returnedName]["action"] = [];
            myPath[type][returnedName]["action"].push("renamed");
          }
          /// list items again with updated JSON obj
          // start = 0;
          // listItems(myPath, "#items", 500);
          // getInFolder(
          //   singleUIItem,
          //   uiItem,
          //   organizeCurrentLocation,
          //   inputGlobal
          // );
          // beginScrollListen();
        }
      }
    });
  }
}

function getGlobalPath(path) {
  var currentPath = path.value.trim();
  var jsonPathArray = currentPath.split("/");
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered;
}

function loadFileFolder(myPath) {
  var appendString = "";
  var sortedObj = sortObjByKeys(myPath);
  let count = 0;
  let file_elem = [],
    folder_elem = [];

  for (var item in sortedObj["folders"]) {
    var emptyFolder = "";
    count += 1;
    if (!highLevelFolders.includes(item)) {
      if (
        JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
        JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
      ) {
        emptyFolder = " empty";
      }
    }
    appendString =
      appendString +
      '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
      emptyFolder +
      '"></h1><div class="folder_desc">' +
      item +
      "</div></div>";
    if (count === 100) {
      folder_elem.push(appendString);
      count = 0;
      continue;
    }
  }
  if (count < 100) {
    if (!folder_elem.includes(appendString)) {
      folder_elem.push(appendString);
      count = 0;
    }
  }

  count = 0;
  appendString = "";
  for (var item in sortedObj["files"]) {
    count += 1;
    // not the auto-generated manifest
    if (sortedObj["files"][item].length !== 1) {
      if ("path" in sortedObj["files"][item]) {
        var extension = path.extname(sortedObj["files"][item]["path"]);
        extension = extension.slice(1);
      } else {
        var extension = "other";
      }
      if (
        ![
          "docx",
          "doc",
          "pdf",
          "txt",
          "jpg",
          "JPG",
          "jpeg",
          "JPEG",
          "xlsx",
          "xls",
          "csv",
          "png",
          "PNG",
        ].includes(extension)
      ) {
        extension = "other";
      }
    } else {
      extension = "other";
    }
    appendString =
      appendString +
      '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
      extension +
      '" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">' +
      item +
      "</div></div>";
    if (count === 100) {
      file_elem.push(appendString);
      count = 0;
      continue;
    }
  }
  if (count < 100) {
    if (!file_elem.includes(appendString)) {
      file_elem.push(appendString);
      count = 0;
    }
  }
  if (folder_elem[0] === "") {
    folder_elem.splice(0, 1);
  }
  if (file_elem[0] === "") {
    file_elem.splice(0, 1);
  }

  let items = [folder_elem, file_elem];
  return items;
}

function getRecursivePath(filteredList, inputObj) {
  var myPath = inputObj;
  for (var item of filteredList) {
    if (item.trim() !== "") {
      myPath = myPath["folders"][item];
    }
  }
  if (myPath === undefined) {
    myPath = inputObj;
    filteredList.pop();
    for (var item of filteredList) {
      if (item.trim() !== "") {
        myPath = myPath["folders"][item];
      }
    }
    let items = [myPath, filteredList];
    return items;
  } else {
    return myPath;
  }
}

/// check if an array contains another array
function checkSubArrayBool(parentArray, childArray) {
  var bool = true;
  for (var element of childArray) {
    if (!parentArray.includes(element)) {
      bool = false;
      break;
    }
  }
  return bool;
}

function animate_updatedFiles() {
  let updated_docs = document.getElementsByClassName("update-file");

  for (let i = 0; i < updated_docs.length; i++) {
    $(updated_docs[i].parentElement).addClass("backgroundAnimate");
  }
}

function showItemsAsListBootbox(arrayOfItems) {
  var htmlElement = "";
  let i = 0;
  for (var element of arrayOfItems) {
    htmlElement =
      htmlElement +
      "<li style='font-size: large; margin-bottom: 5px; margin-right: 270px; margin-left: 242px;'>" +
      element +
      "</li>";
  }
  return htmlElement;
}

function selectAll(source) {
  let container = document.getElementById("container");
  let checkboxes = container.querySelectorAll("input[type=checkbox]");

  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked;
  }
}

function showParentSwal(duplicateArray) {
  var tempFile = [];
  var temp = duplicateArray.substring(1, duplicateArray.length - 1);
  temp = temp.split(",");
  let titleSwal = "";
  let htmlSwal = "";
  let html_word = "";

  for (let i = 0; i < temp.length; i++) {
    let lastSlash = temp[i].lastIndexOf("\\") + 1;
    let fieldContainer = document.createElement("div");
    if (lastSlash === 0) {
      //in case it's on mac
      lastSlash = temp[i].lastIndexOf("/") + 1;
    }
    //removes [ ] at end of string when passed through as JSON.stringify
    tempFile[i] = temp[i].substring(lastSlash, temp[i].length);
  }
  if (tempFile[0].indexOf(".") != -1) {
    titleSwal = "Duplicate file(s) detected";
    htmlSwal = "Files with the following names are already in the the current folder: ";
    html_word = "Files";
  } else {
    titleSwal = "Duplicate folder(s) detected";
    htmlSwal = "Folders with the following names are already in the current folder: ";
    html_word = "Folders";
  }
  var listElements = showItemsAsListBootbox(tempFile);
  newList = JSON.stringify(temp).replace(/"/g, "");

  return Swal.fire({
    title: titleSwal,
    icon: "warning",
    showConfirmButton: false,
    allowOutsideClick: false,
    showCloseButton: true,
    customClass: "wide-swal-auto",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    html:
      `
    <div class="caption">
      <p>${htmlSwal}<p><ul style="text-align: start;">${listElements}</ul></p></p>
    </div>  
    <div class="swal-button-container">
      <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
      newList +
      `', 'free-form')">Skip ${html_word}</button>
      <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '` +
      newList +
      `', 'free-form')">Replace Existing ${html_word}</button>
      <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '` +
      newList +
      `', 'free-form')">Import Duplicates</button>
      <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel','', 'free-form')">Cancel</button>
      </div>`,
  });
}

//creates the html for sweet alert

const handleDuplicateImports = (btnId, duplicateArray, curationMode) => {
  Swal.close();
  const createSwalDuplicateContent = (btnId, list) => {
    if (btnId === "replace" || btnId === "skip") {
      type = "checkbox";
    } else if (btnId === "rename") {
      type = "text";
    }
    var tempFile = [];
    for (let i = 0; i < list.length; i++) {
      let lastSlash = list[i].lastIndexOf("\\") + 1;
      let fieldContainer = document.createElement("div");
      if (lastSlash === 0) {
        //in case it's on mac
        lastSlash = list[i].lastIndexOf("/") + 1;
      }
      //removes [ ] at end of string when passed through as JSON.stringify
      tempFile[i] = list[i].substring(lastSlash, list[i].length);

      let para = document.createElement("p");
      var extIndex = tempFile[i].lastIndexOf(".");
      var justFileName = tempFile[i].substring(0, extIndex);
      let input = document.createElement("input");
      let text = document.createTextNode(tempFile[i]);

      input.type = type;
      input.setAttribute("required", "");

      input.id = tempFile[i];
      if (extIndex != -1) {
        input.placeholder = justFileName;
      } else {
        input.placeholder = input.id;
      }
      para.style = "margin: 0; margin: 10px;";
      para.className = "input-name";
      container.id = "container";

      //design for checkbox
      if (type === "checkbox") {
        input.className = "checkbox-design";
        input.name = "checkbox";
        fieldContainer.className = "checkbox-container";

        para.append(text);
        fieldContainer.append(para);
        fieldContainer.appendChild(input);
        container.append(fieldContainer);
        selectAll.appendChild(container);
      } else if (type === "text") {
        //design for input fields
        input.className = "input-field-design";
        fieldContainer.className = "input-container";

        para.append(text);
        fieldContainer.append(para);
        text = document.createTextNode(":");
        para.append(text);
        fieldContainer.appendChild(input);
        container.append(fieldContainer);
      }
    }
    return tempFile;
    //returns array of file names or folder names
  };

  //toast alert created with Notyf
  var toastUpdate = new Notyf({
    position: { x: "right", y: "bottom" },
    dismissible: true,
    ripple: false,
    types: [
      {
        type: "file_updated",
        background: "#13716D",
        icon: {
          className: "fas fa-check-circle",
          tagName: "i",
          color: "white",
        },
        //duration: 3000,
      },
      {
        type: "no_selection",
        background: "#B80D49",
        icon: {
          className: "fas fa-times-circle",
          tagName: "i",
          color: "white",
        },
      },
    ],
  });

  var filtered = getGlobalPath(organizeDSglobalPath);

  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);

  //SKIP OPTION
  if (btnId === "skip") {
    var tempFile = [];
    var temp = duplicateArray.substring(1, duplicateArray.length - 1);
    temp = temp.split(",");
    container = document.createElement("div");
    var selectAll = document.createElement("div");
    var selectText = document.createTextNode("Select All");
    var para2 = document.createElement("p");
    let selectAllCheckbox = document.createElement("input");

    para2.id = "selectAll";
    para2.className = "selectAll-container";
    selectAllCheckbox.setAttribute("onclick", "selectAll(this);");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.className = "checkbox-design selectAll-checkbox";

    para2.append(selectText);
    para2.append(selectAllCheckbox);
    selectAll.append(para2);
    selectAll.append(container);

    tempFile = createSwalDuplicateContent(btnId, temp);
    if (tempFile[0].indexOf(".") === -1) {
      var header = "Select which folders to skip";
    } else {
      header = "Select which files to skip";
    }

    Swal.fire({
      title: header,
      html: selectAll,
      focusConfirm: false,
      showCancelButton: true,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      didOpen: () => {
        var confirm_button = document.getElementsByClassName("swal2-confirm");
        confirm_button[0].disabled = true;
        var select_all = document.getElementById("container").parentElement.children[0].children[0];
        var container = document.getElementById("container");
        var check_boxes = container.querySelectorAll("input[type=checkbox]");
        let checkedCount = 0;
        check_boxes.forEach(function (element) {
          element.addEventListener("change", function () {
            if (this.checked) {
              checkedCount += 1;
              if (checkedCount === check_boxes.length) {
                select_all.checked = true;
              } else {
                select_all.checked = false;
              }
              confirm_button[0].disabled = false;
            } else {
              checkedCount -= 1;
              if (checkedCount === check_boxes.length) {
                select_all.checked = true;
              } else {
                select_all.checked = false;
              }
              let one_checked = false;
              for (let i = 0; i < check_boxes.length; i++) {
                if (check_boxes[i].checked) {
                  one_checked = true;
                  break;
                }
              }
              if (one_checked === true) {
                confirm_button[0].disabled = false;
              } else {
                confirm_button[0].disabled = true;
                select_all.checked = false;
              }
            }
          });
        });
        select_all.addEventListener("change", function () {
          var check_boxes = container.querySelectorAll("input[type=checkbox]");
          if (this.checked) {
            confirm_button[0].disabled = false;
          } else {
            confirm_button[0].disabled = true;
          }
        });
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let container = document.getElementById("container");
        let checkboxes = container.querySelectorAll("input[type=checkbox]:checked");
        var fileName = [];
        var newList = [];
        //remove slashes and place just file name in new array
        for (let i = 0; i < temp.length; i++) {
          let lastSlash = temp[i].lastIndexOf("\\") + 1;
          if (lastSlash === 0) {
            lastSlash = temp[i].lastIndexOf("/") + 1;
          }
          fileName.push(temp[i].substring(lastSlash, temp[i].length));
        }
        //go through just file names and compare to select checkboxes
        //remove the unchecked names from the array
        for (let i = 0; i < checkboxes.length; i++) {
          if (fileName.includes(checkboxes[i].id)) {
            let index = fileName.indexOf(checkboxes[i].id);
            fileName.splice(index, 1);
          }
        }
        //now compare filenames with original array containing the paths
        for (let i = 0; i < temp.length; i++) {
          let lastSlash = temp[i].lastIndexOf("\\") + 1;
          if (lastSlash === 0) {
            lastSlash = temp[i].lastIndexOf("/") + 1;
          }
          if (fileName.includes(temp[i].substring(lastSlash, temp[i].length))) {
            newList.push(temp[i]);
          }
        }
      }
      if (!result.isConfirmed) {
        showParentSwal(duplicateArray);
        return;
      }
      //unless all files are skipped it will prompt again on what to do
      //with duplicate files

      if (fileName.length > 0) {
        var listElements = showItemsAsListBootbox(fileName);
        newList = JSON.stringify(newList).replace(/"/g, "");
        let titleSwal = "";
        let htmlSwal = "";
        let html_word = "";
        if (tempFile[0].indexOf(".") != -1) {
          titleSwal = "Duplicate file(s) detected";
          htmlSwal = "Files with the following names are already in the the current folder: ";
          html_word = "Files";
        } else {
          titleSwal = "Duplicate folder(s) detected";
          htmlSwal = "Folders with the following names are already in the current folder: ";
          html_word = "Folders";
        }
        Swal.fire({
          title: titleSwal,
          icon: "warning",
          showConfirmButton: false,
          allowOutsideClick: false,
          showCloseButton: true,
          customClass: "wide-swal-auto",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          html:
            `
          <div class="caption">
            <p>${htmlSwal}<p><ul style="text-align: start;">${listElements}</ul></p></p>
          </div>  
          <div class="swal-button-container">
            <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
            newList +
            `', 'free-form')">Skip ${html_word}</button>
            <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '` +
            newList +
            `', 'free-form')">Replace Existing ${html_word}</button>
            <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '` +
            newList +
            `', 'free-form')">Import Duplicates</button>
            <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
            </div>`,
        });
      }
    });
  }
  //RENAME OPTION
  if (btnId === "rename") {
    var temp = "";
    if (duplicateArray.substring(0, 1) === "[") {
      temp = duplicateArray.substring(1, duplicateArray.length - 1);
    } else {
      temp = duplicateArray.substring(0, duplicateArray.length);
    }
    temp = temp.split(",");
    container = document.createElement("div");

    var tempFile = createSwalDuplicateContent(btnId, temp);
    if (tempFile[0].indexOf(".") === -1) {
      var header = "Rename Folders";
    } else {
      header = "Rename Files";
    }
    swal
      .fire({
        title: header,
        confirmButtonText: "Save",
        allowOutsideClick: false,
        focusConfirm: false,
        heightAuto: false,
        customClass: "wide-swal",
        showCloseButton: true,
        showCancelButton: true,
        backdrop: "rgba(0, 0, 0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate_animated animate_zoomout animate__faster",
        },
        html: container,
        didOpen: () => {
          var confirm_button = document.getElementsByClassName("swal2-confirm");
          var container = document.getElementById("container");
          let input_fields = container.querySelectorAll("input[type=text]");
          let fileExt = input_fields[0].id.lastIndexOf(".");
          var keyCheck;
          if (fileExt === -1) {
            //working with a folder
            keyCheck = myPath["folders"];
          } else {
            //working with a file
            keyCheck = myPath["files"];
          }

          confirm_button[0].disabled = true;
          input_fields.forEach(function (element) {
            element.addEventListener("input", function () {
              if (fileExt != -1) {
                let first_ext = element.id.lastIndexOf(".");
                let extType = element.id.substring(first_ext, element.id.length);
                if (element.value === "" || keyCheck.hasOwnProperty(element.value + extType)) {
                  confirm_button[0].disabled = true;
                } else {
                  let one_input = false;
                  for (let i = 0; i < input_fields.length; i++) {
                    let file_Ext = input_fields[i].id.lastIndexOf(".");
                    extType = input_fields[i].id.substring(file_Ext, input_fields[i].id.length);
                    if (
                      input_fields[i].value === "" ||
                      keyCheck.hasOwnProperty(input_fields[i].value + extType)
                    ) {
                      one_input = true;
                      break;
                    }
                  }
                  if (one_input === true) {
                    confirm_button[0].disabled = true;
                  } else {
                    input_fields.forEach(function (element) {});
                    confirm_button[0].disabled = false;
                  }
                }
              } else {
                //working with folders
                if (element.value === "" || keyCheck.hasOwnProperty(element.value)) {
                  confirm_button[0].disabled = true;
                } else {
                  let one_input = false;
                  for (let i = 0; i < input_fields.length; i++) {
                    if (input_fields[i].value === "" || keyCheck.hasOwnProperty(element.value)) {
                      one_input = true;
                      break;
                    }
                  }
                  if (one_input === true) {
                    confirm_button[0].disabed = true;
                  } else {
                    confirm_button[0].disabled = false;
                  }
                }
              }
            });
          });
        },
        preConfirm: () => {
          //check the same name isn't being used
          var fileNames = [];
          var fileLocation = [];
          sameName = [];

          for (var i = 0; i < tempFile.length; i++) {
            let inputField = tempFile[i];
            document.getElementById(inputField).style.borderColor = "";
            extIndex = tempFile[i].lastIndexOf(".");
            if (extIndex === -1) {
              //if extIndex === -1 then we are working with a folder not file
              var folder = true;
              justFileName = tempFile[i];
              let newName = document.getElementById(inputField).value;
              if (myPath["folders"].hasOwnProperty(newName) || newName === "") {
                //checks if newName has already been used
                document.getElementById(inputField).style.borderColor = "red";
                document.getElementById(inputField).value = "";
                document.getElementById(inputField).placeholder = "Provide a new name";
                sameName.push(true);
              } else {
                //if all elements are false then all newNames are original
                sameName.push(false);
              }
              if (
                justFileName != newName &&
                newName != "" &&
                fileNames.includes(newName) === false
              ) {
                fileNames.push(newName);
                fileLocation.push(temp[i]);
              }
            } else {
              //else we are working with a file
              justFileName = tempFile[i].substring(0, extIndex);
              let newName = document.getElementById(inputField).value;

              let filewithExt = tempFile[i].substring(extIndex, tempFile[i].length);
              newNamewithExt = newName.concat(filewithExt);
              if (myPath["files"].hasOwnProperty(newNamewithExt) || newName == "") {
                document.getElementById(inputField).style.borderColor = "red";
                document.getElementById(inputField).value = "";
                document.getElementById(inputField).placeholder = "Provide a new name";
                sameName.push(true);
              } else {
                sameName.push(false);
              }
              if (
                justFileName != newName &&
                newName != "" &&
                fileNames.includes(newName) === false
              ) {
                fileNames.push(newName.concat(tempFile[i].substring(extIndex, tempFile[i].length)));
                fileLocation.push(temp[i]);
              }
            }
          }
          if (folder === true) {
            //working with folders
            if (sameName.includes(true) === true) {
              sameName = [];
              i = 0;
              return false;
              $("swal2-confirm swal2-styled").removeAttr("disabled");
            } else {
              //add files to json and ui
              //update json action
              for (let index = 0; index < temp.length; index++) {
                myPath["folders"][fileNames[index]] = {
                  files: myPath["folders"][tempFile[index]].files,
                  folders: myPath["folders"][tempFile[index]].folders,
                  path: myPath["folders"][tempFile[index]].path,
                  type: "local",
                  action: ["new", "renamed"],
                };
                listItems(myPath, "#items");
                getInFolder("#items", "#items", organizeDSglobalPath, datasetStructureJSONObj);
                hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
                hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
              }
            }
          } else {
            //working with files
            //update file json
            if (sameName.includes(true) === true) {
              sameName = [];
              i = 0;
              return false;
              $("swal2-confirm swal2-styled").removeAttr("disabled");
            } else {
              //update json action
              for (let index = 0; index < temp.length; index++) {
                myPath["files"][fileNames[index]] = {
                  path: fileLocation[index],
                  basename: fileNames[index],
                  type: "local",
                  description: "",
                  "additional-metadata": "",
                  action: ["new", "renamed"],
                };
                var appendString =
                  '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)"  style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
                  myPath["files"][fileNames[index]]["basename"] +
                  "</div></div>";

                $("#items").html(appendString);
                listItems(myPath, "#items");
                getInFolder("#items", "#items", organizeDSglobalPath, datasetStructureJSONObj);
              }
            }
          }
        },
      })
      .then((result) => {
        if (result.isConfirmed) {
          //folders are no clickable unless page is refreshed
          //automated the refresh
          var section = organizeDSglobalPath.value;
          let lastSlash = section.indexOf("/") + 1;
          section = section.substring(lastSlash, section.length - 1);
          if (section.includes("/")) {
            let lastSlash = section.lastIndexOf("/") + 1;
            section = section.substring(lastSlash, section.length);
          }
          var back_button = document.getElementById("button-back");
          back_button.click();
          var folders = document.getElementById("items").getElementsByClassName("folder_desc");
          for (let i = 0; i < folders.length; i++) {
            if (folders[i].innerText === section) {
              folders[i].parentNode.dispatchEvent(new Event("dblclick"));
            }
          }
          toastUpdate.open({
            type: "file_updated",
            message: "Successfully Imported and Renamed!",
          });
        }
        if (!result.isConfirmed) {
          showParentSwal(duplicateArray);
        }
      });
  }
  if (btnId === "replace") {
    var tempFile = [];
    var temp = duplicateArray.substring(1, duplicateArray.length - 1);
    temp = temp.split(",");
    var container = document.createElement("div");
    var selectAll = document.createElement("div");
    var selectText = document.createTextNode("Select All");
    var para2 = document.createElement("p");
    let selectAllCheckbox = document.createElement("input");

    para2.className = "selectAll-text";
    selectAllCheckbox.style = "margin-right: 64px;";
    selectAllCheckbox.setAttribute("onclick", "selectAll(this);");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.className = "checkbox-design";

    para2.append(selectText);
    para2.append(selectAllCheckbox);
    selectAll.append(para2);
    selectAll.append(container);

    //loop through paths and get file name
    var tempFile = createSwalDuplicateContent(btnId, temp);

    if (tempFile[0].indexOf(".") === -1) {
      var header = "Select which folders to replace";
    } else {
      header = "Select which files to replace";
    }
    var nodes = document.getElementsByClassName("folder_desc");
    Swal.fire({
      title: header,
      html: selectAll,
      allowOutsideClick: false,
      cancelButtonText: "Cancel",
      showCancelButton: true,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      didOpen: () => {
        var confirm_button = document.getElementsByClassName("swal2-confirm");
        confirm_button[0].disabled = true;
        var select_all = document.getElementById("container").parentElement.children[0].children[0];
        var container = document.getElementById("container");
        var check_boxes = container.querySelectorAll("input[type=checkbox]");
        let checkedCount = 0;
        check_boxes.forEach(function (element) {
          element.addEventListener("change", function () {
            if (this.checked) {
              checkedCount += 1;
              if (checkedCount === check_boxes.length) {
                select_all.checked = true;
              } else {
                select_all.checked = false;
              }
              confirm_button[0].disabled = false;
            } else {
              checkedCount -= 1;
              if (checkedCount === check_boxes.length) {
                select_all.checked = true;
              } else {
                select_all.checked = false;
              }
              let one_checked = false;
              for (let i = 0; i < check_boxes.length; i++) {
                if (check_boxes[i].checked) {
                  one_checked = true;
                  break;
                }
              }
              if (one_checked === true) {
                confirm_button[0].disabled = false;
              } else {
                confirm_button[0].disabled = true;
                select_all.checked = false;
              }
            }
          });
        });
        select_all.addEventListener("change", function () {
          var check_boxes = container.querySelectorAll("input[type=checkbox]");
          if (this.checked) {
            confirm_button[0].disabled = false;
          } else {
            confirm_button[0].disabled = true;
          }
        });
      },
    }).then((result) => {
      if (result.isConfirmed) {
        container = document.getElementById("container");
        var checkboxes = container.querySelectorAll("input[type=checkbox]:checked");
        if (checkboxes.length > 0) {
          let fileCheck = [];
          for (let i = 0; i < temp.length; i++) {
            let lastSlash = temp[i].lastIndexOf("\\") + 1;
            if (lastSlash === 0) {
              lastSlash = temp[i].lastIndexOf("/") + 1;
            }
            fileCheck.push(temp[i].substring(lastSlash, temp[i].length));
          }
          for (let i = 0; i < checkboxes.length; i++) {
            var removeExt = checkboxes[i].id.lastIndexOf(".");
            if (removeExt === -1) {
              let justName = checkboxes[i].id;
              let index = fileCheck.indexOf(checkboxes[i].id);
              let fileName = checkboxes[i].id;
              myPath["folders"][justName] = {
                files: myPath["folders"][tempFile[index]].files,
                folders: myPath["folders"][tempFile[index]].folders,
                path: temp[index],
                type: "local",
                action: ["new", "updated"],
              };
              for (let j = 0; j < nodes.length; j++) {
                if (nodes[j].innerText === fileName) {
                  nodes[j].parentNode.remove();
                }
              }
              listItems(myPath, "#items");
              getInFolder("#items", "#items", organizeDSglobalPath, datasetStructureJSONObj);
            } else {
              let justName = checkboxes[i].id.substring(0, removeExt);
              let ext = checkboxes[i].id.substring(removeExt, checkboxes[i].id.length);
              let index = fileCheck.indexOf(checkboxes[i].id);
              let fileName = checkboxes[i].id;
              delete myPath["files"][fileName];
              myPath["files"][justName + ext] = {
                path: temp[index],
                basename: fileName,
                type: "local",
                description: "",
                "additional-metadata": "",
                action: ["new", "updated"],
              };
              for (let j = 0; j < nodes.length; j++) {
                if (nodes[j].innerText === fileName) {
                  nodes[j].parentNode.remove();
                }
              }
              listItems(myPath, "#items");
              getInFolder("#items", "#items", organizeDSglobalPath, datasetStructureJSONObj);
            }
          }
          let section = organizeDSglobalPath.value;
          let lastSlash = section.indexOf("/") + 1;
          section = section.substring(lastSlash, section.length - 1);
          if (section.includes("/")) {
            let lastSlash = section.lastIndexOf("/") + 1;
            section = section.substring(lastSlash, section.length);
          }
          let back_button = document.getElementById("button-back");
          back_button.click();
          let folders = document.getElementById("items").getElementsByClassName("folder_desc");
          for (let i = 0; i < folders.length; i++) {
            if (folders[i].innerText === section) {
              folders[i].parentNode.dispatchEvent(new Event("dblclick"));
            }
          }

          animate_updatedFiles();

          //add glowing effect here after page is refreshed
          if (removeExt === -1) {
            toastUpdate.open({
              type: "file_updated",
              message: "Updated Folder(s)",
            });
          } else {
            toastUpdate.open({
              type: "file_updated",
              message: "Updated File(s)",
            });
          }
        } else {
          toastUpdate.open({
            type: "no_selection",
            message: "No selection was made",
          });
        }
      }
      if (!result.isConfirmed) {
        showParentSwal(duplicateArray);
      }
    });
    //then handle the selected checkboxes
  }
};

const addFilesfunction = async (
  fileArray,
  currentLocation,
  organizeCurrentLocation,
  uiItem,
  singleUIItem,
  globalPathValue
) => {
  //toast alert created with Notyf
  let importToast = new Notyf({
    position: { x: "right", y: "bottom" },
    dismissible: true,
    ripple: false,
    types: [
      {
        type: "success",
        background: "#13716D",
        icon: {
          className: "fas fa-check-circle",
          tagName: "i",
          color: "white",
        },
        duration: 2500,
      },
    ],
  });

  // check for duplicate or files with the same name
  var nonAllowedDuplicateFiles = [];
  let doubleExtension = [];
  let tripleExtension = [];
  var nonAllowedFiles = [];
  var regularFiles = {};
  var hiddenFiles = [];
  var nonAllowedCharacterFiles = [];
  let loadingIcon = document.getElementById("items_loading_container");
  let loadingContainer = document.getElementById("loading-items-background-overlay");

  for (var i = 0; i < fileArray.length; i++) {
    var fileName = fileArray[i];

    let regex = /[\+&\%#]/i;
    if (regex.test(path.parse(fileName).base) === true) {
      console.log("nonallowed");
      nonAllowedCharacterFiles.push(fileName);
      continue;
    }
    console.log(path.parse(fileName).base);

    if ((path.parse(fileName).base.match(/\./g) || []).length > 2) {
      //multiple extensions, raise warning
      tripleExtension.push(fileName);
      continue;
    } else if ((path.parse(fileName).base.match(/\./g) || []).length === 2) {
      //double extension ask if compressed file
      doubleExtension.push(fileName);
      continue;
    }

    //check for non allowed files
    //.DS_Store and Thumbs.db files are strictly not allowed
    if (path.parse(fileName).name.substr(0, 1) === ".") {
      if (path.parse(fileName).name === ".DS_Store") {
        nonAllowedFiles.push(fileName);
        continue;
      } else {
        hiddenFiles.push(fileName);
        continue;
      }
    }

    if (path.parse(fileName).base === "Thumbs.db") {
      nonAllowedFiles.push(fileName);
      continue;
    }

    // check if dataset structure level is at high level folder
    var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount === 1) {
      if (loadingContainer != undefined) {
        loadingContainer.style.display = "none";
        loadingIcon.style.display = "none";
      }
      Swal.fire({
        icon: "error",
        html: "<p>This interface is only for including files in the SPARC folders. If you are trying to add SPARC metadata file(s), you can do so in the next Step.</p>",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      if (loadingContainer != undefined) {
        loadingContainer.style.display = "flex";
        loadingIcon.style.display = "block";
      }
      // log the error
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 3", "Import", "File"],
        determineDatasetLocation()
      );
      break;
    } else {
      if (
        JSON.stringify(currentLocation["files"]) === "{}" &&
        JSON.stringify(regularFiles) === "{}"
      ) {
        //regular files object key with path, and basename
        regularFiles[path.parse(fileName).base] = {
          path: fileName,
          basename: path.parse(fileName).base,
        };
      } else {
        //check file name in key of regular files (search for duplicate)
        if (path.parse(fileName).base in regularFiles) {
          nonAllowedDuplicateFiles.push(fileName);
          nonAllowedDuplicate = true;
          continue;
        } else {
          //search for duplicate in currentlocation[files]
          if (path.parse(fileName).base in currentLocation["files"]) {
            nonAllowedDuplicateFiles.push(fileName);
            nonAllowedDuplicate = true;
            continue;
          } else {
            //not in there or regular files so store?
            regularFiles[path.parse(fileName).base] = {
              path: fileName,
              basename: path.parse(fileName).base,
            };
          }
        }
        for (const objectKey in currentLocation["files"]) {
          //tries finding duplicates with the same path
          if (objectKey != undefined) {
            var nonAllowedDuplicate = false;
            //if file already exist in json
            if (fileName === currentLocation["files"][objectKey]["path"]) {
              if (currentLocation["files"][objectKey]["action"].includes("renamed") === false) {
                //same path and has not been renamed
                nonAllowedDuplicateFiles.push(fileName);
                nonAllowedDuplicate = true;
                continue;
              }
            } else {
              //file path and object key path arent the same
              //check if the file name are the same
              //if so consider it as a duplicate
              if (path.parse(fileName).base === objectKey) {
                nonAllowedDuplicateFiles.push(fileName);
                nonAllowedDuplicate = true;
                continue;
              } else {
                //store in regular files
                regularFiles[path.parse(fileName).base] = {
                  path: fileName,
                  basename: path.parse(fileName).base,
                };
              }
            }
          }
        }
      }
    }
  }

  if (doubleExtension.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }

    await Swal.fire({
      title:
        "The following files have a double period, which is only allowed if they are compressed files as per SPARC Data Standards. Do you confirm that these are all compressed files?",
      html: "<div style='max-height:300px; overflow-y:auto'>" +
      doubleExtension.join("</br></br>") +
      "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Yes, import them",
      // denyButtonText: "Import",
      cancelButtonText: "No, skip them",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0]
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //remove slashes and place just file name in new array
        for (let i = 0; i < doubleExtension.length; i++) {
          if (
            doubleExtension[i] in currentLocation["files"] ||
            path.parse(doubleExtension[i]).base in Object.keys(regularFiles)
          ) {
            nonAllowedDuplicateFiles.push(fileName);
            continue;
          } else {
            //not in there or regular files so store?
            regularFiles[path.parse(doubleExtension[i]).base] = {
              path: doubleExtension[i],
              basename: path.parse(doubleExtension[i]).base,
            };
          }
        }
      }
    });
  }

  if (tripleExtension.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "Files should typically have one (two when they are compressed) periods in their names according to the SPARC Data Standards. The following files have three of more periods in their name and will not be imported.",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        tripleExtension.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: false,
      showCancelButton: false,
      confirmButtonText: "OK",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        swalContainer.style.width = "600px";
        swal_content.style.textAlign = "justify";;
      },
    });
  }

  if (nonAllowedCharacterFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "The following files have characters (#&%+) that are typically not recommendeda as per the SPARC Data Standards. Although not forbidden to import as is, we recommend replacing those characters.",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        nonAllowedCharacterFiles.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace characters with '-'",
      denyButtonText: "Import as is",
      cancelButtonText: "Skip All",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        let swalDenyButton = document.getElementsByClassName("swal2-deny")[0];
        swalContainer.style.width = "600px"
        swal_content.style.textAlign = "justify";
        swalDenyButton.style.backgroundColor = "#086dd3";
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //replace characters
        for (let i = 0; i < nonAllowedCharacterFiles.length; i++) {
          let fileName = path.parse(nonAllowedCharacterFiles[i]).base;
          // console.log(fileName);
          let regex = /[\+&\%#]/g;
          let replaceFile = fileName.replace(regex, "-");
          console.log(replaceFile);
          regularFiles[replaceFile] = {
            path: nonAllowedCharacterFiles[i],
            basename: replaceFile,
          };
        }
      }
      if (result.isDenied) {
        for (let i = 0; i < nonAllowedCharacterFiles.length; i++) {
          let fileName = nonAllowedCharacterFiles[i];
          console.log(fileName);
          regularFiles[fileName] = {
            path: fileName,
            basename: path.parse(fileName).base,
          };
        }
      }
    });
  }

  if (hiddenFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title:
        "The following files have an unexpected name starting with a period and are considered hidden files. As per SPARC Data Standards they are typically not recommended to be imported as hidden. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" + hiddenFiles.join("</br></br>") + "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Remove period",
      denyButtonText: "Import as is",
      cancelButtonText: "Skip All",
      didOpen: () => {
        $(".swal-popover").popover();
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        let swal_content = document.getElementsByClassName("swal2-content")[0];
        swalContainer.style.width = "600px"
        swal_content.style.textAlign = "justify";
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        //replace characters
        //check for already imported
        if (loadingContainer != undefined) {
          loadingContainer.style.display = "flex";
          loadingIcon.style.display = "block";
        }
        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(currentLocation["files"]).length > 0) {
            for (const objectKey in currentLocation["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                if (file_name.substr(1, file_name.length) === objectKey) {
                  //if file already exist in json
                  if (path_name === currentLocation["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //file path and object key path arent the same
                    //check if the file name are the same
                    //if so consider it as a duplicate
                    //store in regular files
                    regularFiles[file_name.substr(1, file_name.length)] = {
                      path: path_name,
                      basename: file_name.substr(1, file_name.length),
                    };
                  }
                } else {
                  //store in regular files
                  regularFiles[file_name.substr(1, file_name.length)] = {
                    path: path_name,
                    basename: file_name.substr(1, file_name.length),
                  };
                }
              }
            }
          } else {
            //store in regular files
            regularFiles[file_name.substr(1, file_name.length)] = {
              path: path_name,
              basename: file_name.substr(1, file_name.length),
            };
          }
        }
      }
      if (result.isDenied) {
        //leave as is
        if (loadingContainer != undefined) {
          loadingContainer.style.display = "flex";
          loadingIcon.style.display = "block";
        }
        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(currentLocation["files"]).length > 0) {
            for (const objectKey in currentLocation["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                //if file already exist in json
                if (file_name === objectKey) {
                  if (path_name === currentLocation["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //store in regular files
                    regularFiles[file_name] = {
                      path: path_name,
                      basename: file_name,
                    };
                  }
                  //file path and object key path arent the same
                  //check if the file name are the same
                  //if so consider it as a duplicate
                }
              }
            }
          } else {
            //store in regular files
            regularFiles[file_name] = {
              path: path_name,
              basename: file_name,
            };
          }
        }
      }
    });
  }

  if (nonAllowedDuplicateFiles.length > 0) {
    //add sweetalert here before non duplicate files pop
    var baseName = [];
    for (let element in nonAllowedDuplicateFiles) {
      let lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("\\") + 1;
      if (lastSlash === 0) {
        lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("/") + 1;
      }
      baseName.push(
        nonAllowedDuplicateFiles[element].substring(
          lastSlash,
          nonAllowedDuplicateFiles[element].length
        )
      );
    }
    var list = JSON.stringify(nonAllowedDuplicateFiles).replace(/"/g, "");

    //alert giving a list of files + path that cannot be copied bc theyre duplicates
    var listElements = showItemsAsListBootbox(baseName);
    let titleSwal = "";
    let htmlSwal = "";
    let html_word = "";
    if (baseName.length != 0) {
      if (baseName[0].indexOf(".") != -1) {
        titleSwal = "Duplicate file(s) detected";
        htmlSwal = "Files with the following names are already in the the current folder: ";
        html_word = "Files";
      } else {
        titleSwal = "Duplicate folder(s) detected";
        htmlSwal = "Folders with the following names are already in the current folder: ";
        html_word = "Folders";
      }
    }
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title: titleSwal,
      icon: "warning",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: true,
      customClass: "wide-swal-auto",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      html:
        `
      <div class="caption">
        <p>${htmlSwal}<p><ul style="text-align:start;">${listElements}</ul></p></p>
      </div>  
      <div class="swal-button-container">
      <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
        list +
        `')">Skip ${html_word}</button>
      <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '` +
        list +
        `')">Replace Existing ${html_word}</button>
      <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '` +
        list +
        `')">Import Duplicates</button>
      <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel')">Cancel</button>
      </div>`,
    });
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "flex";
      loadingIcon.style.display = "block";
    }
  }

  if (nonAllowedFiles.length > 0) {
    if (loadingContainer != undefined) {
      loadingContainer.style.display = "none";
      loadingIcon.style.display = "none";
    }
    await Swal.fire({
      title: "The following files are not allowed in datasets as per the SPARC Data Standards and will thus not be imported",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        nonAllowedFiles.join("</br></br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      confirmButtonText: "OK",
      didOpen: () => {
        let swalContainer = document.getElementsByClassName("swal2-popup")[0];
        swalContainer.style.width = "600px";
      }
    });
  }
  if (loadingContainer != undefined) {
    loadingContainer.style.display = "flex";
    loadingIcon.style.display = "block";
  }
  // now handle non-allowed duplicates (show message), allowed duplicates (number duplicates & append to UI),
  // and regular files (append to UI)
  if (Object.keys(regularFiles).length > 0) {
    start = 0;
    listed_count = 0;
    $("#items").empty();
    for (var element in regularFiles) {
      currentLocation["files"][regularFiles[element]["basename"]] = {
        path: regularFiles[element]["path"],
        type: "local",
        description: "",
        "additional-metadata": "",
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(
        currentLocation["files"][regularFiles[element]["basename"]]["path"]
      ).base;
      if (element !== originalName) {
        currentLocation["files"][regularFiles[element]["basename"]]["action"].push("renamed");
      }
    }
    await listItems(currentLocation, uiItem, 500);
    getInFolder(singleUIItem, uiItem, organizeCurrentLocation, globalPathValue);
    beginScrollListen();
    if (Object.keys(regularFiles).length > 1) {
      importToast.open({
        type: "success",
        message: "Successfully Imported Files",
      });
    } else {
      importToast.open({
        type: "success",
        message: "Successfully Imported File",
      });
    }
    // log the successful import
    logCurationForAnalytics(
      "Success",
      PrepareDatasetsAnalyticsPrefix.CURATE,
      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
      ["Step 3", "Import", "File"],
      determineDatasetLocation()
    );
  }
};

//create intersection observ
let scroll_box = document.querySelector("#organize-dataset-tab");
let item_box = document.querySelector("#items");
let dataset_path = document.getElementById("input-global-path");

//will observe if property of element changes to decide of eventListener is needed
function observeElement(element, property, callback, delay = 0) {
  let elementPrototype = Object.getPrototypeOf(element);
  if (elementPrototype.hasOwnProperty(property)) {
    let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
    Object.defineProperty(element, property, {
      get: function () {
        return descriptor.get.apply(this, arguments);
      },
      set: function () {
        let oldValue = this[property];
        descriptor.set.apply(this, arguments);
        let newValue = this[property];
        if (typeof callback == "function") {
          setTimeout(callback.bind(this, oldValue, newValue), delay);
        }
        return newValue;
      },
    });
  }
}

//when on top layer of dataset eventListener is removed
function check_dataset_value() {
  if (dataset_path.value === "My_dataset_folder/") {
    item_box.removeEventListener("scroll", lazyLoad, true);
  }
  if (dataset_path.value != "My_dataset_folder/") {
    var filtered = getGlobalPath(dataset_path);
    var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
    amount = 500;
    listItems(myPath, "items", 500);
    getInFolder(".single-item", "#items", dataset_path, datasetStructureJSONObj);
    beginScrollListen();
  }
}
observeElement(dataset_path, "value", check_dataset_value);

var amount = 500;

function beginScrollListen() {
  amount = 500;
  item_box.addEventListener("scroll", lazyLoad);
}

async function lazyLoad() {
  let total_items = already_created_elem.length;
  let filtered = getGlobalPath(dataset_path);
  let myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);

  //if there's less than 20 items event listener will be removed

  //load spinner is prepended to beginning to elements if any de-rendered
  //itemscrollTop is > item_box.scrollHeight - 280 (for scrolling bottom)
  //item.scrollTop is < 280 (scrolling the top)

  if (item_box.childElementCount != 0) {
    if (
      item_box.children[0].id === "items_container" ||
      item_box.children[item_box.childElementCount - 1].id === "items_container"
    ) {
      //loading icon is there
      if (
        item_box.scrollTop > item_box.scrollHeight - 300 ||
        (item_box.scrollTop < 300 && item_box.children[0].id === "items_container")
      ) {
        //for rerendering on scroll up
        //monitors when user scrolls back up to prepend elements
        let array_select = preprended_items - 1;
        let remove_limit = 5; //only prepend 500 elements at a time
        let load_spinner = `
        <div id="items_container">
          <div id="item_load" class="ui medium active inline loader icon-wrapper">
          </div>
        </div>`;

        item_box.children[0].remove(); //remove loading spinner
        //add elements back to top of item_box
        for (let i = 0; i < remove_limit; i++) {
          $(uiItems).prepend(already_created_elem[array_select]); //adding on scroll up
          array_select--;
        }
        array_select += 1;
        if (array_select != 0) {
          $(uiItems).prepend(load_spinner);
          item_box.children[0].style.setProperty("margin-top", "20px");
        } else {
          //we have re-rendered all files from beginning
          if (item_box.children[0].id === "items_container") {
            item_box.children[0].remove();
          }
        }
        await getInFolder(".single-item", "#items", dataset_path, datasetStructureJSONObj);

        if (item_box.lastChild.id === "items_container") {
          item_box.lastChild.remove();
        }
        //remove 500 items from the end of item_box list
        for (let i = 0; i <= 500; i++) {
          item_box.lastChild.remove();
        }
        if (item_box.childElementCount > 1000) {
          while (item_box.childElementCount > 1000) {
            item_box.lastChild.remove();
          }
          if (item_box.children[0].id != "items_container") {
            item_box.lastChild.remove();
          }
        }
        listed_count -= 5;
        start -= 5;
        amount -= 500;
        preprended_items -= 5;
        $("#items").append(load_spinner); //loading spinner reattached
        item_box.lastChild.style.setProperty("margin-top", "5px");
        item_box.lastChild.style.setProperty("margin-bottom", "30px");
      }
    }
  }

  //all items have been fully rendered
  if (listed_count === total_items) {
    if (item_box.childElementCount != 0) {
      if (item_box.lastChild.id === "items_container") {
        item_box.removeChild(item_box.lastChild);
      }
    }
  } else {
    if (item_box.scrollTop + 50 > item_box.scrollHeight - item_box.offsetHeight) {
      //user scrolls down, render more items if available
      let wait4items = new Promise(async (resolved) => {
        amount += 500;
        await listItems(myPath, uiItems, amount);
        // add_items_to_view(already_created_elem, 400);
        await getInFolder(".single-item", "#items", dataset_path, datasetStructureJSONObj);
        resolved();
      });
    }
  }
}

already_created_elem = [];
let listed_count = 0;
let start = 0;
let preprended_items = 0;
async function add_items_to_view(list, amount_req, reset) {
  uiItems = "#items";
  let elements_req = amount_req / 100; //array stores 100 elements per index
  let element_items = item_box.childElementCount;
  let load_spinner = `
  <div id="items_container">
    <div id="item_load" class="ui medium active inline loader icon-wrapper">
    </div>
  </div>`;
  if (already_created_elem.length === 0) {
    listed_count = already_created_elem.length;
  }
  if (reset === true || dataset_path === "My_dataset_folder/") {
    $("#items").empty();

    start = 0;
    listed_count = 0;
    element_items = item_box.childElementCount;
  }
  start = listed_count;
  listed_count = 0;

  //remove loading spinners before adding more files
  if (item_box.lastChild != undefined) {
    if (item_box.lastChild.id === "items_container") {
      item_box.removeChild(item_box.lastChild);
    }
  }
  if (item_box.children[0] != undefined) {
    if (
      item_box.children[0].id === "items_container" ||
      item_box.children[0].classList.contains("drag-drop-container-instructions")
    ) {
      item_box.children[0].remove();
    }
  }

  //folders and files stored in one array
  already_created_elem = list[0].concat(list[1]);

  if (element_items >= 1000) {
    //at most we want 1000 items rendered
    preprended_items += 5;

    for (let i = 0; i < 500; i++) {
      item_box.children[0].remove();
    }
    $(uiItems).prepend(load_spinner);
    item_box.children[0].style.setProperty("margin-top", "20px");
  }

  for (let i = start; i < elements_req; i++) {
    if (i < already_created_elem.length) {
      $(uiItems).append(already_created_elem[i]);
      listed_count += 1;
    } else {
      break;
    }
  }
  listed_count += start;
  start = listed_count;
  if ($(uiItems).children().length >= 500) {
    $(uiItems).append(load_spinner);
    item_box.lastChild.style.setProperty("margin-top", "5px");
    item_box.lastChild.style.setProperty("margin-bottom", "30px");
  }
}

const resetLazyLoading = () => {
  already_created_elem = [];
  listed_count = 0;
  start = 0;
  preprended_items = 0;
  amount = 500;
};

///// function to load details to show in display once
///// users click Show details
function loadDetailsContextMenu(fileName, filePath, textareaID1, textareaID2, paraLocalPath) {
  if ("description" in filePath["files"][fileName]) {
    document.getElementById(textareaID1).value = filePath["files"][fileName]["description"];
  } else {
    document.getElementById(textareaID1).value = "";
  }
  if ("additional-metadata" in filePath["files"][fileName]) {
    document.getElementById(textareaID2).value = filePath["files"][fileName]["additional-metadata"];
  } else {
    document.getElementById(textareaID2).value = "";
  }
  path_label = document.querySelector(
    "#organize-dataset-tab > div > div > div > div.div-display-details.file > div:nth-child(2) > label"
  );
  if (filePath["files"][fileName]["type"] === "bf") {
    path_label.innerHTML = "<b>Pennsieve path:<br></b>";
    bf_path = "";
    filePath["files"][fileName]["bfpath"].forEach((item) => (bf_path += item + "/"));
    bf_path += fileName;
    document.getElementById(paraLocalPath).innerHTML = bf_path;
  } else {
    path_label.innerHTML = "<b>Local path:<br></b>";
    document.getElementById(paraLocalPath).innerHTML = filePath["files"][fileName]["path"];
  }
}

//path_label = document.querySelector("#organize-dataset-tab > div > div > div > div.div-display-details.file > div:nth-child(2) > label");

function triggerManageDetailsPrompts(ev, fileName, filePath, textareaID1, textareaID2) {
  filePath["files"][fileName]["additional-metadata"] = document
    .getElementById(textareaID2)
    .value.trim();
  filePath["files"][fileName]["description"] = document.getElementById(textareaID1).value.trim();
  // check for "Apply to all files"
  if (document.getElementById("input-add-file-metadata").checked) {
    for (var file in filePath["files"]) {
      filePath["files"][file]["additional-metadata"] = document
        .getElementById(textareaID2)
        .value.trim();
    }
  }
  if (document.getElementById("input-add-file-description").checked) {
    for (var file in filePath["files"]) {
      filePath["files"][file]["description"] = document.getElementById(textareaID1).value.trim();
    }
  }
  // $(this).html("Done <i class='fas fa-check'></i>");
}

// on change event (in this case: NextBtn click from Step 2 - Step 3)
// 1. Check path: if path === "My_dataset_folder", then hideOrganizeButtons(), otherwise, showOrganizeButtons()
// 2. How to show/hide Organize buttons:
//    a. Hide: display: none (New folder, Import, Back button, and path)
//    b. Show: display: flex (New folder, Import, Back button, and path) + Center the items
function organizeLandingUIEffect() {
  if ($("#input-global-path").val() === "My_dataset_folder/") {
    $(".div-organize-dataset-menu").css("visibility", "hidden");
    // $("#organize-path-and-back-button-div").css("visibility", "hidden");
    $("#organize-path-and-back-button-div").css("display", "none");
  } else {
    $("#organize-path-and-back-button-div").css("display", "flex");
    $(".div-organize-dataset-menu").css("visibility", "visible");
  }
}
