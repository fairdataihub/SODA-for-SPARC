function handleDuplicateImports(btnId, duplicateArray, curationMode) {
  Swal.close();
  //creates the html for sweetalert
  function createSwalDuplicateContent(btnId, list) {
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
        selectAll.append(container);
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
  }

  //toast alert created with Notyf
  var toastUpdate = new Notyf({
    position: { x: "right", y: "bottom" },
    ripple: true,
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
  var filtered = "";
  if (curationMode === "free-form") {
    filtered = getGlobalPath(organizeDSglobalPath);
  }
  if (curationMode === "guided") {
    filtered = getGlobalPath(guidedOrganizeDSglobalPath);
  }

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
        var select_all =
          document.getElementById("container").parentElement.children[0]
            .children[0];
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
        let checkboxes = container.querySelectorAll(
          "input[type=checkbox]:checked"
        );
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
          htmlSwal =
            "Files with the following names are already in the the current folder: ";
          html_word = "Files";
        } else {
          titleSwal = "Duplicate folder(s) detected";
          htmlSwal =
            "Folders with the following names are already in the current folder: ";
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
            <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', 'free-form')">Cancel</button>
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
                let extType = element.id.substring(
                  first_ext,
                  element.id.length
                );
                if (
                  element.value === "" ||
                  keyCheck.hasOwnProperty(element.value + extType)
                ) {
                  confirm_button[0].disabled = true;
                } else {
                  let one_input = false;
                  for (let i = 0; i < input_fields.length; i++) {
                    let file_Ext = input_fields[i].id.lastIndexOf(".");
                    extType = input_fields[i].id.substring(
                      file_Ext,
                      input_fields[i].id.length
                    );
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
                if (
                  element.value === "" ||
                  keyCheck.hasOwnProperty(element.value)
                ) {
                  confirm_button[0].disabled = true;
                } else {
                  let one_input = false;
                  for (let i = 0; i < input_fields.length; i++) {
                    if (
                      input_fields[i].value === "" ||
                      keyCheck.hasOwnProperty(element.value)
                    ) {
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
                document.getElementById(inputField).placeholder =
                  "Provide a new name";
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

              let filewithExt = tempFile[i].substring(
                extIndex,
                tempFile[i].length
              );
              newNamewithExt = newName.concat(filewithExt);
              if (
                myPath["files"].hasOwnProperty(newNamewithExt) ||
                newName == ""
              ) {
                document.getElementById(inputField).style.borderColor = "red";
                document.getElementById(inputField).value = "";
                document.getElementById(inputField).placeholder =
                  "Provide a new name";
                sameName.push(true);
              } else {
                sameName.push(false);
              }
              if (
                justFileName != newName &&
                newName != "" &&
                fileNames.includes(newName) === false
              ) {
                fileNames.push(
                  newName.concat(
                    tempFile[i].substring(extIndex, tempFile[i].length)
                  )
                );
                fileLocation.push(temp[i]);
              }
            }
          }
          if (folder === true) {
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
                getInFolder(
                  "#items",
                  "#items",
                  organizeDSglobalPath,
                  datasetStructureJSONObj
                );
                hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
                hideMenu(
                  "high-level-folder",
                  menuFolder,
                  menuHighLevelFolders,
                  menuFile
                );
              }
            }
          } else {
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
                getInFolder(
                  "#items",
                  "#items",
                  organizeDSglobalPath,
                  datasetStructureJSONObj
                );
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
          var folders = document
            .getElementById("items")
            .getElementsByClassName("folder_desc");
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
        var select_all =
          document.getElementById("container").parentElement.children[0]
            .children[0];
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
        var checkboxes = container.querySelectorAll(
          "input[type=checkbox]:checked"
        );
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
              getInFolder(
                "#items",
                "#items",
                organizeDSglobalPath,
                datasetStructureJSONObj
              );
            } else {
              let justName = checkboxes[i].id.substring(0, removeExt);
              let ext = checkboxes[i].id.substring(
                removeExt,
                checkboxes[i].id.length
              );
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
              getInFolder(
                "#items",
                "#items",
                organizeDSglobalPath,
                datasetStructureJSONObj
              );
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
          let folders = document
            .getElementById("items")
            .getElementsByClassName("folder_desc");
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
}
