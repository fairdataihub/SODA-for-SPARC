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
  return organizeDSglobalPath.value.trim().split("/").length - 1;
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
