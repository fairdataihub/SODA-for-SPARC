const os = require('os');
const path = require('path');
const fs = require('fs');
const $ = require('jquery');
const {ipcRenderer} = require('electron')
const dialog = require('electron').dialog
const electron = require('electron')
const bootbox = require('bootbox')
const app = require('electron').app;

// Navigator button //
const buttonSidebar = document.getElementById("button-hamburger")
// const buttonSidebarIcon = document.getElementById("button-soda-icon")
const buttonSidebarBigIcon = document.getElementById("button-soda-big-icon")

// context menu
let menuFolder = null;
let menuFile = null;
menuFolder = document.querySelector('.menu.reg-folder');
menuFile = document.querySelector('.menu.file');
menuHighLevelFolders = document.querySelector('.menu.high-level-folder');

var backFolder = []
var forwardFolder =[]

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocols"]

var highLevelFolderToolTip = {
  "code": "code: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  "derivative": "derivative: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  "docs": "docs: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  "source": "source: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  "primary": "primary: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  "protocol": "protocol: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>."
}

var jsonObjGlobal = {
  "code": {
    'empty_directory': {
    }
  },
  "derivative": {},
  "primary": {},
  "source": {
    'empty-directory': {}
  },
  "docs": {},
  "protocols": {}
}

var jsonMetadataGlobal = {
  // any file's value is a list [full_path, added description, added metadata]
  "submission.csv": ["C:/mypath/folder1/sub-folder-1/submission.csv", "This is my current description.", "This is my sample metadata for this file."],
  "dataset_description.xlsx": ["C:/mypath/folder1/sub-folder-1/dataset_description.xlsx", "This is my current description.", "This is my sample metadata for this file."]
}

const globalPath = document.getElementById("input-global-path")
const backButton = document.getElementById("button-back")
const addFiles = document.getElementById("add-files")
const addNewFolder = document.getElementById("new-folder")
const addFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
const fullPathValue = document.querySelector(".hoverPath")
const fullNameValue = document.querySelector(".hoverFullName")
const resetProgress = document.getElementById("clear-progress")
const saveProgress = document.getElementById("save-progress")
const importProgress = document.getElementById("import-progress")
const homePathButton = document.getElementById("home-path")


listItems(jsonObjGlobal)
getInFolder()

function getGlobalPath() {
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered
}

// load and parse existing json progress file
function parseJson(path) {
  if (!fs.existsSync(path)) {
    return {}
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson
  } catch (error) {
    // log.error(error)
    console.log(error);
    return {}
  }
}

/// back button
backButton.addEventListener("click", function() {
  event.preventDefault();
  var currentPath = globalPath.value

  if (currentPath !== "/") {
    var filtered = getGlobalPath()
    if (filtered.length === 1) {
      globalPath.value = "/"
    } else {
      globalPath.value = "/" + filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = jsonObjGlobal;
    for (var item of filtered.slice(0,filtered.length-1)) {
      myPath = myPath[item]
    }
    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // reconstruct div with new elements
    listItems(myPath)
    getInFolder()
  }
})

// Add folder button
addNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  if(globalPath.value!=="/") {
    var newFolderName = "New Folder"

    // show prompt for name
    bootbox.prompt({
      title: "Adding a new folder...",
      message: "<p>Please enter a name below: </p>",
      centerVertical: true,
      callback: function(result) {

        if(result !== null && result!== "") {
          newFolderName = result.trim()

          // check for duplicate or files with the same name
          var duplicate = false
          var itemDivElements = document.getElementById("items").children
          for (var i=0;i<itemDivElements.length;i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true
              break
            }
          }

          if (duplicate) {
            bootbox.alert({
              message: "Duplicate folder name: " + newFolderName,
              centerVertical: true
            })
          } else {
            var appendString = '';
            appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
            $(appendString).appendTo('#items');

            /// update jsonObjGlobal
            var currentPath = globalPath.value
            var jsonPathArray = currentPath.split("/")
            var filtered = jsonPathArray.filter(function (el) {
              return el != "";
            });

            var myPath = getRecursivePath(filtered)

            // update Json object with new folder created
            var renamedNewFolder = newFolderName
            myPath[renamedNewFolder] = {}

            listItems(myPath)
            getInFolder()
          }
        }
      }
    })
  } else {
      bootbox.alert({
        message: "New folders cannot be added at this level!",
        centerVertical: true
      })
    }
})

// ///////////////////////////////////////////////////////////////////////////

function populateJSONObjFolder(jsonObject, folderPath) {
    var myitems = fs.readdirSync(folderPath)
    myitems.forEach(element => {
      var statsObj = fs.statSync(path.join(folderPath, element))
      var addedElement = path.join(folderPath, element)
      if (statsObj.isDirectory()) {
        jsonObject[element] = {}
        populateJSONObjFolder(jsonObject[element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject[element] = [addedElement, "", ""]
        }
    });
}

function showFullPath(ev, text) {
  ev.preventDefault()
  fullPathValue.style.display = "block";
  fullPathValue.style.top = `${ev.clientY - 10}px`;
  fullPathValue.style.left = `${ev.clientX + 15}px`;
  fullPathValue.innerHTML = text
}

function hideFullPath() {
  fullPathValue.style.display = "none";
  fullPathValue.style.top = '-210%';
  fullPathValue.style.left = '-210%';
}

/// hover for a full path
function hoverForPath(ev) {
    var currentPath = globalPath.value
    var jsonPathArray = currentPath.split("/")
    var filtered = jsonPathArray.filter(function (el) {
      return el != "";
    });

    var myPath = getRecursivePath(filtered)

    // get full path from JSON object
    var fullPath = myPath[ev.innerText]
    showFullPath(event, fullPath[0])
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    ev.preventDefault()
    fullNameValue.style.display = "block";
    fullNameValue.style.top = `${ev.clientY - 10}px`;
    fullNameValue.style.left = `${ev.clientX + 15}px`;
    fullNameValue.innerHTML = text
  }
}

function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

/// hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText

    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// If the document is clicked somewhere
document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value !== "myFile") {
    hideFullPath()
  } else {
    hoverForPath(e)
  }
});

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});

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

function listItems(jsonObj) {

        var appendString = ''
        var folderID = ''

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
            folderID = item;
            var emptyFolder = "";
            if (! highLevelFolders.includes(item)) {
              if (JSON.stringify(sortedObj[item]) === '{}') {
                emptyFolder = " empty"
              }
            }
            appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()" id=' + folderID + '><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
          }
        }

        $('#items').empty()
        $('#items').html(appendString)
  }

function loadFileFolder(myPath) {
  var appendString = ""

  var sortedObj = sortObjByKeys(myPath)


  for (var item in sortedObj) {
    if (Array.isArray(sortedObj[item])) {
      // not the auto-generated manifest
      if (sortedObj[item].length !== 1) {
        var extension = sliceStringByValue(sortedObj[item][0],  ".")
        if (!["docx", "doc", "pdf", "txt", "jpg", "xlsx", "xls", "csv", "png"].includes(extension)) {
          extension = "other"
        }
      } else {
        extension = "other"
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
    }
    else {
      folderID = item;
      var emptyFolder = "";
      if (! highLevelFolders.includes(item)) {
        if (JSON.stringify(sortedObj[item]) === '{}') {
          emptyFolder = " empty"
        }
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()" id=' + folderID + '><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
    }
  }

  return appendString
}

function getRecursivePath(filteredList) {
  var myPath = jsonObjGlobal;
  for (var item of filteredList) {
    myPath = myPath[item]
  }
  return myPath
}

function getInFolder() {
  $('.single-item').dblclick(function(){

    if($(this).children("h1").hasClass("myFol")) {
      var folder = this.id
      var appendString = ''
      globalPath.value = globalPath.value + folder + "/"

      var currentPath = globalPath.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.filter(function (el) {
        return el != "";
      });

      var myPath = getRecursivePath(filtered)

      var appendString = loadFileFolder(myPath)

      $('#items').empty()
      $('#items').html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath)
      getInFolder()
      hideMenu("folder")
      hideMenu("high-level-folder")
    }
  })
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

/// import progress
importProgress.addEventListener("click", function() {
  globalPath.value = "/"

  var filePath = dialog.showOpenDialogSync(null, {
    defaultPath: os.homedir(),
    filters: [
      {name: 'JSON', extensions: ['json']}
    ],
    properties: ['openFile']
  });

  if (filePath !== undefined) {
    var progressData = fs.readFileSync(filePath[0])
    var content = JSON.parse(progressData.toString())
    var contentKeys = Object.keys(content)
    if (checkSubArrayBool(contentKeys, highLevelFolders)) {
      jsonObjGlobal = content
    } else {
      bootbox.alert({
        message: "<p>Please import a valid file organization!</p>",
        centerVertical: true
      })
      return
    }

    var bootboxDialog = bootbox.dialog({
      message: '<p><i class="fa fa-spin fa-spinner"></i>Importing file organization...</p>'
    })
    bootboxDialog.init(function(){
      listItems(jsonObjGlobal)
      getInFolder()
      bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully loaded!");
    })
  }
})

// save progress
saveProgress.addEventListener("click", function() {
  var filePath = dialog.showSaveDialogSync(null, {
    defaultPath: os.homedir(),
    filters: [
      {name: 'JSON', extensions: ['json']}
    ]
  });
  if (filePath !== undefined) {
    fs.writeFileSync(filePath, JSON.stringify(jsonObjGlobal))
    bootbox.alert({
      message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully saved file organization.",
      centerVertical: true
    })
  }
})


/// reset progress
resetProgress.addEventListener("click", function() {
  bootbox.confirm({
    title: "Clearing progress",
    message: "<p>Are you sure you want to clear the current file organization?</p>",
    centerVertical: true,
    callback: function(r) {
      if (r!==null) {
        globalPath.value = "/"
        jsonObjGlobal = {
          "code": {},
          "derivative": {},
          "primary": {},
          "source": {},
          "docs": {},
          "protocols": {}
        }
        listItems(jsonObjGlobal)
        getInFolder()
      }
    }
  })
})

function loadingDialog(text1, text2, func) {
  var bootboxDialog = bootbox.dialog({
    message: '<p><i class="fa fa-spin fa-spinner"></i> '+text1+'</p>',
  })
  bootboxDialog.init(function(){
    setTimeout(function(){
      func;
      bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>"+text2+"");
  }, 2000);
  })
}

/// if users choose to include manifest files
/// this function will first add manifest files to the UI
/// and update the JSON object with files "manifest": ["auto-generated manifest"]
/// TODO: not allow context menu for manifest files with value === array (lenght=1)
function updateManifestLabel(jsonObject) {
  /// first, add manifest files to UI
  var elements = Object.keys(jsonObject)
  for (var key of elements) {
      if (typeof jsonObject[key] === "object" && !(Array.isArray(jsonObject[key]))) {
        if (Object.keys(jsonObject[key]).length !== 0) {
          jsonObject[key]["manifest.xlsx"] = ["auto-generated"]
          /// if this folder is not empty, then recursively add manifest file
          updateManifestLabel(jsonObject[key])
        }
      }
    }
}
//
// const organizeNextStepBtn = document.getElementById("organize-next-step")
// const organizeFinalizeStepBtn = document.getElementById("organize-finalize")

// function changeStepOrganize(step) {
//     if (step.id==="step-1-organize") {
//       document.getElementById("div-step-1-organize").style.display = "block";
//       document.getElementById("div-step-2-organize").style.display = "none";
//       document.getElementById("step-2-organize").classList.remove("active")
//       step.classList.add("active")
//       document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders"
//       organizeNextStepBtn.style.display = "block"
//       organizeFinalizeStepBtn.style.display = "none"
//     } else {
//       document.getElementById("div-step-1-organize").style.display = "none";
//       document.getElementById("div-step-2-organize").style.display = "block";
//       document.getElementById("step-1-organize").classList.remove("active")
//       step.classList.add("active")
//       document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Metadata files"
//       organizeFinalizeStepBtn.style.display = "block"
//       organizeNextStepBtn.style.display = "none"
//     }
// }
//
// function organizeNextStep() {
//   document.getElementById("div-step-2-organize").style.display = "block";
//   document.getElementById("div-step-1-organize").style.display = "none";
//   document.getElementById("step-2-organize").classList.add("active")
//   document.getElementById("step-1-organize").classList.remove("active")
//   organizeNextStepBtn.style.display = "none"
//   organizeFinalizeStepBtn.style.display = "block"
// }
//
// organizeFinalizeStepBtn.addEventListener("click", () => {
//   // jsonObjGlobal
// })

//
// document.getElementById("generate-manifest").addEventListener("click", function() {
//
//   if (document.getElementById("generate-manifest").checked) {
//
//     var bootboxDialog = bootbox.dialog({
//       message: '<p><i class="fa fa-spin fa-spinner"></i>Adding manifest files...</p>'
//     })
//     bootboxDialog.init(function(){
//       updateManifestLabel(jsonObjGlobal)
//       bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Success! Manifest files will be generated for your dataset!<br><br>Note: manifest files are not added to empty folders.");
//     })
//   }  else {
//       var bootboxDialog = bootbox.dialog({
//         message: '<p><i class="fa fa-spin fa-spinner"></i>Removing manifest files from your file organization...</p>'
//       })
//       bootboxDialog.init(function(){
//         // myHelper()
//         bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully removed!");
//       })
//     }
// })


//////////// FILE BROWSERS to import existing files and folders /////////////////////

addFiles.addEventListener("click", function() {
   dialog.showOpenDialog({ properties: ['openFile', 'multiSelections']
 }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFilesfunction(result.filePaths, myPath)
  })
})


addFolders.addEventListener("click", function() {
  dialog.showOpenDialog({ properties: ['openDirectory', 'multiSelections']
  }).then(result => {
      var filtered = getGlobalPath()
      var myPath = getRecursivePath(filtered)
      addFoldersfunction(result.filePaths, myPath)
  })
})

function addFoldersfunction(folderArray, currentLocation) {

  if (globalPath.value === "/") {
    bootbox.alert({
      message: "Other non-SPARC folders cannot be added to this dataset level!",
      centerVertical: true
    })
  } else {

    // check for duplicates/folders with the same name
    for (var i=0; i<folderArray.length;i++) {
      var baseName = path.basename(folderArray[i])
      var duplicate = false;
      for (var objKey in currentLocation) {
        if (typeof currentLocation[objKey] === "object") {
          if (baseName === objKey) {
            duplicate = true
            break
          }
        }
      }
      if (duplicate) {
        bootbox.alert({
          message: 'Duplicate folder name: ' + baseName,
          centerVertical: true
        })
      } else {

        currentLocation[baseName] = {}
        populateJSONObjFolder(currentLocation[baseName], folderArray[i])

        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation)
        getInFolder()
      }
    }
  }
}

function addFilesfunction(fileArray, currentLocation) {

  // check for duplicate or files with the same name
    for (var i=0; i<fileArray.length;i++) {
      var baseName = path.basename(fileArray[i])

      if (globalPath.value === "/" && (!["dataset_description.xlsx", "dataset_description.csv", "dataset_description.json", "submission.xlsx", "submission.json", "submission.csv", "samples.xlsx", "samples.csv", "samples.json", "subjects.xlsx", "subjects.csv", "subjects.json", "CHANGES.txt", "README.txt"].includes(baseName))) {
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

          $('#items').html(appendString)

          listItems(currentLocation)
          getInFolder()
        }
      }
  }
}


//// Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  // get global path
  var currentPath = globalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered)
  ev.preventDefault();

  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path
    var itemName = ev.dataTransfer.files[i].name
    var duplicate = false

    var statsObj = fs.statSync(itemPath)

    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }

    /// check for File duplicate
    if (statsObj.isFile()) {
      if (globalPath.value === "/") {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
        } else {
            if (!["dataset_description.xlsx", "submission.xlsx", "samples.xlsx", "subjects.xlsx", "README.txt"].includes(itemName)) {
              bootbox.alert({
                message: "Invalid file(s). Only SPARC metadata files are allowed in the high-level dataset folder.<br> <ul><li>dataset_description (.xslx/.csv/.json)</li><li>submission (.xslx/.csv/.json)</li><li>subjects (.xslx/.csv/.json)</li><li>samples (.xslx/.csv/.json)</li><li>CHANGES.txt</li><li>README.txt</li></ul>",
                centerVertical: true
              })
            } else {
              myPath[itemName] = [itemPath, "", ""]

              var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);

              listItems(myPath)
              getInFolder()
            }
        }
      } else {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
        } else {
          myPath[itemName] = [itemPath, "", ""]

          var appendString = '<div class="single-item" onmouseover="hoverForPath(this)" onmouseleave="hideFullPath()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      if (globalPath.value === "/") {
        bootbox.alert({
          message: "Other non-SPARC folders cannot be added to this dataset level!",
          centerVertical: true
        })
      } else {
        if (duplicate) {
          bootbox.alert({
            message: 'Duplicate folder name: ' + itemName,
            centerVertical: true
          })
        } else {
          var currentPath = globalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered)

          var folderJsonObject = {};

          populateJSONObjFolder(folderJsonObject, itemPath)

          myPath[itemName] = folderJsonObject

          var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);

          listItems(myPath)
          getInFolder()
        }
      }
    }
  }
}


// SAVE FILE ORG
ipcRenderer.on('save-file-organization-dialog', (event) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }
  dialog.showSaveDialog(null, options, (filename) => {
    event.sender.send('selected-saveorganizationfile', filename)
  })
})


//////////////////////////////////////////////////////////////////////////////
///////////////////////// CONTEXT MENU OPTIONS ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////


//// helper functions for hiding/showing context menus
function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    if (category === "folder") {
      menuFolder.style.display = "block";
      menuFolder.style.top = `${ev.clientY - 2}px`;
      menuFolder.style.left = `${ev.clientX + 2}px`;
    } else if (category === "high-level-folder") {
      menuHighLevelFolders.style.display = "block";
      menuHighLevelFolders.style.top = `${ev.clientY - 20}px`;
      menuHighLevelFolders.style.left = `${ev.clientX - 10}px`;
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



$("#menu-sidebar-toggle").click(function(){
    if (mobileBreakpoint.matches) {
        $(".nav.js-nav").toggleClass("show");
    } else {
        $(".nav.js-nav").toggleClass("hide");
    }
});
