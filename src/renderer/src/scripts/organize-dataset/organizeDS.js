import Swal from "sweetalert2";

while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

window.recursive_mark_sub_files_deleted = (dataset_folder, mode) => {
  if ("files" in dataset_folder) {
    for (let file in dataset_folder["files"]) {
      if ("forTreeview" in dataset_folder["files"][file]) {
        // Manifest files usually have this key
        continue;
      }
      if (mode === "delete") {
        if (!dataset_folder["files"][file]["action"].includes("recursive_deleted")) {
          dataset_folder["files"][file]["action"].push("recursive_deleted");
        }
      } else if (
        mode === "restore" &&
        dataset_folder["files"][file]["action"].includes("recursive_deleted")
      ) {
        let index = dataset_folder["files"][file]["action"].indexOf("recursive_deleted");
        dataset_folder["files"][file]["action"].splice(index, 1);
      }
    }
  }
  if ("folders" in dataset_folder && Object.keys(dataset_folder["folders"]).length !== 0) {
    for (let folder in dataset_folder["folders"]) {
      window.recursive_mark_sub_files_deleted(dataset_folder["folders"][folder], mode);
      if ("action" in dataset_folder["folders"][folder]) {
        if (mode === "delete") {
          if (!dataset_folder["folders"][folder]["action"].includes("recursive_deleted")) {
            dataset_folder["folders"][folder]["action"].push("recursive_deleted");
          }
        } else if (
          mode === "restore" &&
          dataset_folder["folders"][folder]["action"].includes("recursive_deleted")
        ) {
          let index = dataset_folder["folders"][folder]["action"].indexOf("recursive_deleted");
          dataset_folder["folders"][folder]["action"].splice(index, 1);
        }
      }
    }
  }
};

///////// Option to delete folders or files
window.delFolder = (ev, organizeCurrentLocation, uiItem, singleUIItem, inputGlobal) => {
  let itemToDelete = ev.parentElement.innerText;
  let promptVar;
  let type; // renaming files or folders

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
      reverseButtons: window.reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let itemToRestore = itemToDelete;
        let filtered = window.getGlobalPath(organizeCurrentLocation);
        let myPath = window.getRecursivePath(filtered.slice(1), inputGlobal);

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
          window.recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "restore");
        }

        // update Json object with the restored object
        let index = myPath[type][itemToRestore]["action"].indexOf("deleted");
        myPath[type][itemToRestore]["action"].splice(index, 1);
        let itemToRestore_new_key = itemToRestore.substring(0, itemToRestore.lastIndexOf("-"));

        // Add a (somenumber) if the file name already exists
        // Done using a loop to avoid a case where the same file number exists
        if (itemToRestore_new_key in myPath[type]) {
          myPath[type][itemToRestore]["action"].push("renamed");
          itemToRestore_new_key_file_name = window.path.parse(itemToRestore_new_key).name;
          itemToRestore_new_key_file_ext = window.path.parse(itemToRestore_new_key).ext;
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
        window.listItems(myPath, uiItem, 500, true);
        window.getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
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
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          let filtered = window.getGlobalPath(organizeCurrentLocation);
          let myPath = window.getRecursivePath(filtered.slice(1), inputGlobal);

          $("div.single-item.selected-item > .folder_desc").each(function (index, current_element) {
            itemToDelete = $(current_element).text();
            if (itemToDelete in myPath["files"]) {
              type = "files";
            } else if (itemToDelete in myPath["folders"]) {
              type = "folders";
            }
            if (
              myPath[type][itemToDelete]["location"] === "ps" ||
              (myPath[type][itemToDelete]["location"] === "local" &&
                myPath[type][itemToDelete]["action"].includes("existing"))
            ) {
              if (type === "folders") {
                window.recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "delete");
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
          window.listItems(myPath, uiItem, 500, true);
          window.getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
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
        reverseButtons: window.reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          /// get current location of folders or files
          var filtered = window.getGlobalPath(organizeCurrentLocation);
          var myPath = window.getRecursivePath(filtered.slice(1), inputGlobal);
          // update Json object with new folder created
          if (
            myPath[type][itemToDelete]["location"] === "ps" ||
            (myPath[type][itemToDelete]["location"] === "local" &&
              myPath[type][itemToDelete]["action"].includes("existing"))
          ) {
            if (type === "folders") {
              window.recursive_mark_sub_files_deleted(myPath[type][itemToDelete], "delete");
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
          window.listItems(myPath, uiItem, 500, true);
          window.getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal);
          beginScrollListen();
        }
      });
    }
  }
};

// helper function to rename files/folders
const checkValidRenameInput = (
  event,
  input,
  type,
  oldName,
  newName,
  itemElement
  // myBootboxDialog
) => {
  let double_extensions = [
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
  if (type === "files") {
    // if renaming a file
    let double_ext_present = false;
    for (let index in double_extensions) {
      if (oldName.search(double_extensions[index]) != -1) {
        newName =
          input.trim() +
          window.path.parse(window.path.parse(oldName).name).ext +
          window.path.parse(oldName).ext;
        double_ext_present = true;
        break;
      }
    }
    if (double_ext_present == false) {
      newName = input.trim() + window.path.parse(oldName).ext;
    }
    // check for duplicate or files with the same name
    for (var i = 0; i < itemElement.length; i++) {
      if (!itemElement[i].innerText.includes("-DELETED")) {
        if (newName === window.path.parse(itemElement[i].innerText).base) {
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
    }
  } else {
    //// if renaming a folder
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
    window.renameFolder(event, organizeCurrentLocation, itemDivElements);
    if (duplicate) {
      Swal.fire({
        icon: "error",
        text: `The folder name: ${newName} already exists, please rename to a different name!`,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });
      newName = "";
    }
  }
  return newName;
};

///// Option to rename a folder and files
window.renameFolder = (
  event1, //this
  organizeCurrentLocation, //current section of My_folder
  itemElement, //the elements in the container with items
  inputGlobal, //window.datasetStructureJSONObj
  uiItem, //container with the folders
  singleUIItem //class name
) => {
  let promptVar;
  let type; // renaming files or folders
  let newName;
  let currentName = event1.parentElement.getElementsByTagName("div")[0].innerText;
  let nameWithoutExtension;
  let highLevelFolderBool;

  let double_extensions = [
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

  if (window.highLevelFolders.includes(currentName)) {
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
        nameWithoutExtension = window.path.parse(window.path.parse(currentName).name).name;
        double_ext_present = true;
        break;
      }
    }
    if (double_ext_present == false) {
      nameWithoutExtension = window.path.parse(currentName).name;
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
      reverseButtons: window.reverseSwalButtons,
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
          let val = $("#rename-folder-input").val();
          for (let char of window.nonAllowedCharacters) {
            if (val.includes(char)) {
              Swal.showValidationMessage(
                `The ${promptVar} name cannot contains the following characters ${window.nonAllowedCharacters}, please rename to a different name!`
              );

              // Add styling to the error message
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
        let returnedName = checkValidRenameInput(
          event1,
          result.value.trim(),
          type,
          currentName,
          newName,
          itemElement
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

          // get location of current item in SODA JSON
          let filtered = window.getGlobalPath(organizeCurrentLocation);
          let myPath = window.getRecursivePath(filtered.slice(1), inputGlobal);

          // update UI with new name
          event1.parentElement.children[1].innerText = returnedName;

          /// update jsonObjGlobal with the new name
          let storedValue = myPath[type][currentName];
          delete myPath[type][currentName];
          myPath[type][returnedName] = storedValue;
          myPath[type][returnedName]["basename"] = returnedName;

          // Add in the action key if it doesn't exist, then add that it has been renamed
          if ("action" in myPath[type][returnedName]) {
            if (!myPath[type][returnedName]["action"].includes("renamed")) {
              myPath[type][returnedName]["action"].push("renamed");
            }
          } else {
            myPath[type][returnedName]["action"] = ["renamed"];
          }
        }
      }
    });
  }
};

window.getGlobalPath = (path) => {
  let currentPath = (typeof path === "string" ? path : path.value || "").trim();
  let jsonPathArray = currentPath.split("/");
  return jsonPathArray.filter((el) => el !== "");
};

window.getGlobalPathFromString = (pathString) => {
  let jsonPathArray = pathString.split("/");
  return jsonPathArray.filter((el) => {
    return el != "";
  });
};

window.loadFileFolder = (myPath) => {
  let appendString = "";
  let sortedObj = window.sortObjByKeys(myPath);
  let count = 0;
  let file_elem = [],
    folder_elem = [];

  for (let item in sortedObj["folders"]) {
    let emptyFolder = "";
    count += 1;
    if (
      !window.highLevelFolders.includes(item) &&
      JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
      JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
    ) {
      emptyFolder = " empty";
    }
    appendString =
      appendString +
      '<div class="single-item" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 oncontextmenu="window.folderContextMenu(this)" class="myFol' +
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

  if (count < 100 && !folder_elem.includes(appendString)) {
    folder_elem.push(appendString);
    count = 0;
  }

  count = 0;
  appendString = "";
  for (var item in sortedObj["files"]) {
    count += 1;
    // not the auto-generated manifest
    if (sortedObj["files"][item].length !== 1) {
      if ("path" in sortedObj["files"][item]) {
        var extension = window.path.extname(sortedObj["files"][item]["path"]);
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
      '<div class="single-item" onmouseover="window.hoverForFullName(this)" onmouseleave="window.hideFullName()"><h1 class="myFile ' +
      extension +
      '" oncontextmenu="window.fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">' +
      item +
      "</div></div>";
    if (count === 100) {
      file_elem.push(appendString);
      count = 0;
      continue;
    }
  }
  if (count < 100 && !file_elem.includes(appendString)) {
    file_elem.push(appendString);
    count = 0;
  }
  if (folder_elem[0] === "") {
    folder_elem.splice(0, 1);
  }
  if (file_elem[0] === "") {
    file_elem.splice(0, 1);
  }

  return [folder_elem, file_elem];
};

window.getRecursivePath = (filteredList, inputObj) => {
  let myPath = inputObj;
  for (let item of filteredList) {
    if (item.trim() !== "") {
      myPath = myPath["folders"][item];
    }
  }
  if (myPath === undefined) {
    myPath = inputObj;
    filteredList.pop();
    for (let item of filteredList) {
      if (item.trim() !== "") {
        myPath = myPath["folders"][item];
      }
    }
    return [myPath, filteredList];
  } else {
    return myPath;
  }
};

// Function is used to giving a glowing effect on files that are updated in the file explorer
// Files are updated when a duplicate file is found and they select to update the file
const animateUpdatedFiles = () => {
  let updated_docs = document.getElementsByClassName("update-file");

  for (let i = 0; i < updated_docs.length; i++) {
    $(updated_docs[i].parentElement).addClass("backgroundAnimate");
  }
};

const showItemsAsListBootbox = (arrayOfItems) => {
  let htmlElement = "";
  for (let element of arrayOfItems) {
    htmlElement =
      htmlElement +
      "<li style='font-size: large; margin-bottom: 5px; margin-right: 270px; margin-left: 242px;'>" +
      element +
      "</li>";
  }
  return htmlElement;
};

const showParentSwal = (duplicateArray) => {
  let tempFile = [];
  let temp = duplicateArray.substring(1, duplicateArray.length - 1).split(",");
  let titleSwal = "";
  let htmlSwal = "";
  let html_word = "";

  for (let i = 0; i < temp.length; i++) {
    let lastSlash = temp[i].lastIndexOf("\\") + 1;
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
  let listElements = showItemsAsListBootbox(tempFile);
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
};

const checkForMultipleExtensions = (filename) => {
  return filename.match(/\./g).length;
};

const forbiddenFileCheck = (filename) => {
  if (filename === ".DS_Store" || filename === "Thumbs.db") {
    return "forbidden";
  }
  if (filename.substr(0, 1) === ".") {
    return "hidden";
  } else {
    return "none";
  }
};

window.getPathSlashCount = () => {
  console.log(organizeDSglobalPath.value);
  return organizeDSglobalPath.value.trim().split("/").length - 1;
};

//create intersection observ
window.scroll_box = document.querySelector("#organize-dataset-tab");
let item_box = document.querySelector("#items");
let dataset_path = document.getElementById("input-global-path");

//will observe if property of element changes to decide of eventListener is needed
const observeElement = (element, property, callback, delay = 0) => {
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
};

//when on top layer of dataset eventListener is removed
const check_dataset_value = () => {
  if (dataset_path.value === "dataset_root/") {
    item_box.removeEventListener("scroll", lazyLoad, true);
  }
  if (dataset_path.value != "dataset_root/") {
    var filtered = window.getGlobalPath(dataset_path);
    var myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);
    window.amount = 500;
    window.listItems(myPath, "items", 500);
    window.getInFolder(".single-item", "#items", dataset_path, window.datasetStructureJSONObj);
    beginScrollListen();
  }
};
observeElement(dataset_path, "value", check_dataset_value);

window.amount = 500;

const beginScrollListen = () => {
  window.amount = 500;
  item_box.addEventListener("scroll", lazyLoad);
};

const lazyLoad = async () => {
  let total_items = window.already_created_elem.length;
  let filtered = window.getGlobalPath(dataset_path);
  let myPath = window.getRecursivePath(filtered.slice(1), window.datasetStructureJSONObj);

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
        let array_select = window.preprended_items - 1;
        let remove_limit = 5; //only prepend 500 elements at a time
        let load_spinner = `
        <div id="items_container">
          <div id="item_load" class="ui medium active inline loader icon-wrapper">
          </div>
        </div>`;

        item_box.children[0].remove(); //remove loading spinner
        //add elements back to top of item_box
        for (let i = 0; i < remove_limit; i++) {
          $(uiItems).prepend(window.already_created_elem[array_select]); //adding on scroll up
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
        await window.getInFolder(
          ".single-item",
          "#items",
          dataset_path,
          window.datasetStructureJSONObj
        );

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
        window.listed_count -= 5;
        window.start -= 5;
        window.amount -= 500;
        window.preprended_items -= 5;
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
      new Promise(async (resolved) => {
        window.amount += 500;
        await window.listItems(myPath, uiItems, window.amount);
        // window.add_items_to_view(window.already_created_elem, 400);
        await window.getInFolder(
          ".single-item",
          "#items",
          dataset_path,
          window.datasetStructureJSONObj
        );
        resolved();
      });
    }
  }
};

window.already_created_elem = [];
window.listed_count = 0;
window.start = 0;
window.preprended_items = 0;
window.add_items_to_view = async (list, amount_req, reset) => {
  let uiItems = "#items";
  let elements_req = amount_req / 100; //array stores 100 elements per index
  let element_items = item_box.childElementCount;
  let load_spinner = `
  <div id="items_container">
    <div id="item_load" class="ui medium active inline loader icon-wrapper">
    </div>
  </div>`;
  if (window.already_created_elem.length === 0) {
    listed_count = window.already_created_elem.length;
  }
  if (reset === true || dataset_path === "dataset_root/") {
    $("#items").empty();

    window.start = 0;
    window.listed_count = 0;
    element_items = item_box.childElementCount;
  }
  window.start = window.listed_count;
  window.listed_count = 0;

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
  window.already_created_elem = list[0].concat(list[1]);

  if (element_items >= 1000) {
    //at most we want 1000 items rendered
    window.preprended_items += 5;

    for (let i = 0; i < 500; i++) {
      item_box.children[0].remove();
    }
    $(uiItems).prepend(load_spinner);
    item_box.children[0].style.setProperty("margin-top", "20px");
  }

  for (let i = window.start; i < elements_req; i++) {
    if (i < window.already_created_elem.length) {
      $(uiItems).append(window.already_created_elem[i]);
      window.listed_count += 1;
    } else {
      break;
    }
  }
  window.listed_count += window.start;
  window.start = window.listed_count;
  if ($(uiItems).children().length >= 500) {
    $(uiItems).append(load_spinner);
    item_box.lastChild.style.setProperty("margin-top", "5px");
    item_box.lastChild.style.setProperty("margin-bottom", "30px");
  }
};

///// function to load details to show in display once
///// users click Show details
window.loadDetailsContextMenu = (fileName, filePath, textareaID1, textareaID2, paraLocalPath) => {
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
  let path_label = document.querySelector(
    "#organize-dataset-tab > div > div > div > div.div-display-details.file > div:nth-child(2) > label"
  );
  if (filePath["files"][fileName]["location"] === "ps") {
    path_label.innerHTML = "<b>Pennsieve path:<br></b>";
    bf_path = "";
    filePath["files"][fileName]["bfpath"].forEach((item) => (bf_path += item + "/"));
    bf_path += fileName;
    document.getElementById(paraLocalPath).innerHTML = bf_path;
  } else {
    path_label.innerHTML = "<b>Local path:<br></b>";
    document.getElementById(paraLocalPath).innerHTML = filePath["files"][fileName]["path"];
  }
};

// on change event (in this case: NextBtn click from Step 2 - Step 3)
// 1. Check path: if path === "dataset_root", then hideOrganizeButtons(), otherwise, showOrganizeButtons()
// 2. How to show/hide Organize buttons:
//    a. Hide: display: none (New folder, Import, Back button, and path)
//    b. Show: display: flex (New folder, Import, Back button, and path) + Center the items
window.organizeLandingUIEffect = () => {
  if ($("#input-global-path").val() === "dataset_root/") {
    $(".div-organize-dataset-menu").css("visibility", "hidden");
    // $("#organize-path-and-back-button-div").css("visibility", "hidden");
    $("#organize-path-and-back-button-div").css("display", "none");
  } else {
    $("#organize-path-and-back-button-div").css("display", "flex");
    $(".div-organize-dataset-menu").css("visibility", "visible");
  }
};
