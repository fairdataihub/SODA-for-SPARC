//////////////////////////////////
// Import required modules
//////////////////////////////////
const zerorpc = require("zerorpc")
const fs = require("fs")
const path = require('path')
const {ipcRenderer} = require('electron')

// Connect to python server and check
let client = new zerorpc.Client()

client.connect("tcp://127.0.0.1:4242")

client.invoke("echo", "server ready", (error, res) => {
  if(error || res !== 'server ready') {
    console.error(error)
  } else {
    console.log("server is ready")
  }
})

//////////////////////////////////
// Inputs from html elements fronm user interface //
//////////////////////////////////

// Organize dataset
const selectDatasetBtn = document.getElementById('button-select-dataset')
let pathDataset = document.querySelector('#para-selected-dataset')
const tableOrganized = document.getElementById("table-organized")
var tableOrganizedCount = 0
const tableNotOrganized = document.getElementById("code_table")
var tableNotOrganizedCount = 0
let alreadyOrganizedStatus = document.querySelector('#preorganized-dataset')
let organizeDatasetStatus = document.querySelector('#organize-dataset')
const clearTableBtn = document.getElementById('button-clear-table')

// Curate dataset
const selectSaveFileOrganizationBtn = document.getElementById('button-select-save-file-organization')
const selectPreviewBtn = document.getElementById('button-preview-file-organization')
const deletePreviewBtn = document.getElementById('button-delete-preview-organization-status')
const selectUploadFileOrganizationBtn = document.getElementById('button-select-upload-file-organization')

let createNewStatus = document.querySelector('#create-newdataset')
let modifyExistingStatus = document.querySelector('#existing-dataset')
let bfDirectlyStatus = document.querySelector('#cloud-dataset')
let pathNewDataset = document.querySelector('#selected-new-dataset')
let newDatasetName = document.querySelector('#new-dataset-name')
let manifestStatus = document.querySelector('#generate-manifest')
let curationForm = document.querySelector('#dataset-curate-form')

let existingSubmissionStatus = document.querySelector('#existing-submission')
let newSubmissionStatus = document.querySelector('#new-submission')
let pathSubmissionExisting = document.querySelector('#selected-submission')

let existingDescriptionStatus = document.querySelector('#existing-description')
let newDescriptionStatus = document.querySelector('#new-description')
let pathDescriptionExisting = document.querySelector('#selected-description')

let existingSubjectsStatus = document.querySelector('#existing-subjects')
let newSubjectsStatus = document.querySelector('#new-subjects')
let pathSubjectsExisting = document.querySelector('#selected-subjects')

let existingSamplesStatus = document.querySelector('#existing-samples')
let newSamplesStatus = document.querySelector('#new-samples')
let pathSamplesExisting = document.querySelector('#selected-samples')

var submissionStatus
var pathSubmission
var descriptionStatus
var pathDescription
var subjectsStatus
var pathSubjects
var samplesStatus
var pathSamples


const curateDatasetBtn = document.getElementById('button-curate-dataset')
let progressInfo = document.querySelector('#progressinfo')


// Manage and submit
let keyName = document.querySelector('#bf-key-name')
let key = document.querySelector('#bf-key')
let secret = document.querySelector('#bf-secret')
const bfAddAccountBtn = document.getElementById('add-bf-account')
let bfAddAccountInfo = document.querySelector('#add-account-progress')

let bfAccountList = document.querySelector('#bfaccountlist')
var myitem
let bfDatasetList = document.querySelector('#bfdatasetlist')

const bfRefreshDatasetBtn = document.getElementById('button-refresh-dataset-list')
let bfNewDatasetName = document.querySelector('#bf-new-dataset-name')
const bfCreateNewDatasetBtn = document.getElementById('button-create-bf-new-dataset')
let bfCreateNewDatasetInfo = document.querySelector('#add-new-dataset-progress')
const bfSubmitDatasetBtn = document.getElementById('button-submit-dataset')
let bfSubmitDatasetInfo = document.querySelector('#progresssubmit')
let pathSubmitDataset = document.querySelector('#selected-submit-dataset')
var progressBar = document.getElementById("div-progress-bar")

let bfDatasetListPermission = document.querySelector('#bfdatasetlist_permission')
let currentDatasetPermission = document.querySelector('#para-dataset-permission-current')
let bfListUsers = document.querySelector('#bf_list_users')
let bfListRoles = document.querySelector('#bf_list_roles')
const bfAddPermissionBtn = document.getElementById('button-add-permission')
let datasetPermissionStatus = document.querySelector('#para-dataset-permission-status')

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = '#000000'
const redColor = '#ff1a1a'
const sparcFolderNames = ["code", "derivatives", "docs", "protocol", "samples", "sourcedata", "subjects"]


//////////////////////////////////
// Defaults action (at start on the program)
//////////////////////////////////


// Add existing bf account(s) to dropdown list
updateBfAccountList()

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////


// Select organized dataset folder and populate table
selectDatasetBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-dataset')
})
ipcRenderer.on('selected-dataset', (event, path) => {
  clearTable(tableOrganized)
  pathDataset.innerHTML = ""
  var folderChecking = checkFolderStruture(path[0])
  if (folderChecking == true) {
    pathDataset.innerHTML = path
    var jsonfolder = organizedFolderToJson(path[0])
    jsonToTableOrganized(tableOrganized, jsonfolder)
  } else {
    pathDataset.innerHTML = "<span style='color: red;'> Error: please select a dataset with SPARC folder structure </span>"
  }
})

//Select files/folders to be added to table for organizing
const selectCodeBtn = document.getElementById('button-select-code')
selectCodeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-code')
})

const selectCodeDirectoryBtn = document.getElementById('button-select-code-directory')
selectCodeDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-code')
})

ipcRenderer.on('selected-code', (event, path) => {
    insertFileToTable(tableNotOrganized, path)
    console.log(tableNotOrganized)
})

//Clear table
clearTableBtn.addEventListener('click', () => {
  if (alreadyOrganizedStatus.checked){
    clearTable(tableOrganized)
  } else if (organizeDatasetStatus.checked) {
    clearTable(tableNotOrganized)
  }
})

// Drag and drop
var holder_code = document.getElementById('code')
holder_code.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_code.id
   dropAddToTable(event, myID)
})

var holder_derivatives = document.getElementById('derivatives')
holder_derivatives.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_derivatives.id
   dropAddToTable(event, myID)
})

var holder_docs = document.getElementById('docs')
holder_docs.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_docs.id
   dropAddToTable(event, myID)
})

var holder_protocol = document.getElementById('protocol')
holder_protocol.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_protocol.id
   dropAddToTable(event, myID)
})

var holder_samples = document.getElementById('samples')
holder_samples.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_samples.id
   dropAddToTable(event, myID)
})

var holder_sourcedata = document.getElementById('sourcedata')
holder_sourcedata.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_sourcedata.id
   dropAddToTable(event, myID)
})

var holder_subjects = document.getElementById('subjects')
holder_subjects.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_subjects.id
   dropAddToTable(event, myID)
})

var holder_main = document.getElementById('main')
holder_main.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holder_main.id
   dropAddToTable(event, myID)
})


//////////////////////////////////
// Operations calling to pysoda.py functions //
//////////////////////////////////

// Action when user click on Save file organization button
selectSaveFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('save-file-dialog-saveorganization')
})
ipcRenderer.on('selected-saveorganizationfile', (event, path) => {
  if (alreadyOrganizedStatus.checked == true){
    var jsonformat = tableToJson(tableOrganized)
    var jsonvect = tableToJsonWithDescription(tableOrganized)
  } else {
    var jsonformat = tableToJson(tableNotOrganized)
    var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  }
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]
  document.getElementById("para-save-file-organization-status").innerHTML = "";
  // Call python to save
  if (path != null){
    client.invoke("api_save_file_organization", jsonpath, jsondescription, path, (error, res) => {
        if(error) {
          console.log(error)
          var emessage = userError(error)
          document.getElementById("para-save-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        } else {
          console.log(res)
          document.getElementById("para-save-file-organization-status").innerHTML = "Saved!";
        }
    })
  }
})


// Action when user click on upload file organization button
selectUploadFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-uploadorganization')
})
ipcRenderer.on('selected-uploadorganization', (event, path) => {
  document.getElementById("para-upload-file-organization-status").innerHTML = "";
  var headernames = sparcFolderNames.slice()
  headernames.push("main")
  var lennames =  headernames.length
  for (var i = 0; i < lennames; i++) {
  	headernames.push(headernames[i] + "_description")
  }
  client.invoke("api_upload_file_organization", path[0], headernames, (error, res) => {
        if(error) {
          console.log(error)
          var emessage = userError(error)
          document.getElementById("para-upload-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        } else {
          console.log(res)
          jsonToTableWithDescription(tableNotOrganized, res)
          document.getElementById("para-upload-file-organization-status").innerHTML = "Uploaded!";
        }
  })
})

// Action when user click on Preview file organization button
selectPreviewBtn.addEventListener('click', () => {
  document.getElementById("para-preview-organization-status").innerHTML = ""
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  client.invoke("api_preview_file_organization", jsonpath, (error, res) => {
      if(error) {
        console.log(error)
        var emessage = userError(error)
        document.getElementById("para-preview-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        document.getElementById("para-preview-organization-status").innerHTML = "Loading Preview folder...";
        console.log(res)
        console.log("Done")
        document.getElementById("para-preview-organization-status").innerHTML = "Preview folder available in a new window";
      }
  })
})

// Action when user click on Delete Preview file organization button
deletePreviewBtn.addEventListener('click', () => {
  document.getElementById("para-preview-organization-status").innerHTML = ""
  client.invoke("api_delete_preview_file_organization", (error, res) => {
      if(error) {
        console.log(error)
        var emessage = userError(error)
        document.getElementById("para-preview-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        console.log(res)
        console.log("Done")
        document.getElementById("para-preview-organization-status").innerHTML = "Preview folder deleted!";
      }
  })
})

// // // // // // // // // //
// Action when user click on Curate Dataset
// // // // // // // // // //

curateDatasetBtn.addEventListener('click', () => {

  // Disable curate button to prevent multiple clicks
  progressInfo.style.color = blackColor
  curateDatasetBtn.disabled = true
  disableform(curationForm)

  // Convert table content into json file for transferring to Python
  if (alreadyOrganizedStatus.checked) {
    if (fs.existsSync(pathDataset.innerHTML)) {
      var jsonvect = tableToJsonWithDescriptionOrganized(tableOrganized)
    } else {
      progressInfo.style.color = redColor
      progressInfo.value = 'Error: Select a valid dataset folder'
      curateDatasetBtn.disabled = false
      enableform(curationForm)
      console.error('Error')
      return
    }
  } else if (organizeDatasetStatus.checked) {
    var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  } else {
  	progressInfo.style.color = redColor
  	progressInfo.value = 'Error: Please select an option under "Organize dataset" '
    curateDatasetBtn.disabled = false
    enableform(curationForm)
  	return
  }
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]

  var metadatafiles = []
  if (existingSubmissionStatus.checked === true){
    submissionStatus = true
    pathSubmission = pathSubmissionExisting.value
    metadatafiles.push(pathSubmission)
  } else if (newSubmissionStatus.checked === true){
    submissionStatus = true
    pathSubmission = path.join(__dirname, 'file_templates', 'submission.xlsx')
    metadatafiles.push(pathSubmission)
  } else {
    submissionStatus = false
  }

  if (existingDescriptionStatus.checked === true){
    descriptionStatus = true
    pathDescription = pathDescriptionExisting.value
    metadatafiles.push(pathDescription)
  } else if (newDescriptionStatus.checked === true){
    descriptionStatus = true
    pathDescription = path.join(__dirname, 'file_templates', 'dataset_description.xlsx')
    metadatafiles.push(pathDescription)
  } else {
    descriptionStatus = false
  }

  if (existingSubjectsStatus.checked === true){
    subjectsStatus = true
    pathSubjects = pathSubjectsExisting.value
    metadatafiles.push(pathSubjects)
  } else if (newSubjectsStatus.checked === true){
    subjectsStatus = true
    pathSubjects = path.join(__dirname, 'file_templates', 'subjects.xlsx')
    metadatafiles.push(pathSubjects)
  } else {
    subjectsStatus = false
  }

  if (existingSamplesStatus.checked === true){
    samplesStatus = true
    pathSamples = pathSamplesExisting.value
    metadatafiles.push(pathSamples)
  } else if (newSamplesStatus.checked === true){
    samplesStatus = true
    pathSamples = path.join(__dirname, 'file_templates', 'samples.xlsx')
    metadatafiles.push(pathSamples)
  } else {
   samplesStatus = false
  }

  // Initiate curation by calling python
  progressInfo.value = ''
  var completionstatus = 'Solving'
  var pathDatasetValue = String(pathDataset.innerHTML)

  client.invoke("api_curate_dataset", pathDatasetValue, createNewStatus.checked, pathNewDataset.value,
    manifestStatus.checked, submissionStatus, pathSubmission,  descriptionStatus, pathDescription,
    subjectsStatus, pathSubjects, samplesStatus, pathSamples, jsonpath, jsondescription, modifyExistingStatus.checked,
    bfDirectlyStatus.checked, alreadyOrganizedStatus.checked, organizeDatasetStatus.checked, newDatasetName.value,
    (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      progressInfo.style.color = redColor
      progressInfo.value = emessage
      console.log(error)
      enableform(curationForm)
    } else {
      console.log('Done', res)
    }
  })

  var timerprogress = setInterval(progressfunction, 1000)
  function progressfunction(){
    client.invoke("api_curate_dataset_progress", (error, res) => {
      if(error) {
        console.error(error)
      } else {
        completionstatus = res[1]
        var printstatus = res[2]
        if (printstatus === 'Curating') {
          progressInfo.value = res[0].split(',').join('\n')
        }
      }
    })
    console.log('Completion', completionstatus)
    if (completionstatus === 'Done'){
      clearInterval(timerprogress)
      curateDatasetBtn.disabled = false
      enableform(curationForm)
    }
  }


})


// // // // // // // // // //
// // // // // // // // // //

// Add bf account
bfAddAccountBtn.addEventListener('click', () => {
  bfAddAccountInfo.style.color = blackColor
  bfAddAccountBtn.disabled = true
  bfAddAccountInfo.value = ''
  client.invoke("api_bf_add_account", keyName.value, key.value, secret.value, (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      bfAddAccountInfo.style.color = redColor
      bfAddAccountInfo.value = emessage
    } else {
        bfAddAccountInfo.value = res
        removeOptions(bfAccountList)
        updateBfAccountList()
    }
    bfAddAccountBtn.disabled = false
  })
})


// Select bf account from dropdownlist and show existing dataset
bfAccountList.addEventListener('change', () => {
  refreshBfDatasetList(bfDatasetList)
  refreshBfDatasetList(bfDatasetListPermission)
  currentDatasetPermission.innerHTML = ''
  refreshBfUsersList(bfListUsers)
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text

  if (selectedbfaccount == 'Select') {

    document.getElementById("para-select-account-status").innerHTML = "";

  } else{

    showAccountDetails()
  }
})


// Refresh list of bf dataset list (in case user create it online)
bfRefreshDatasetBtn.addEventListener('click', () => {
  refreshBfDatasetList(bfDatasetList)
  refreshBfDatasetList(bfDatasetListPermission)
  currentDatasetPermission.innerHTML = ''
  console.log("refreshed")
})

// Add new dataset folder (empty) on bf
bfCreateNewDatasetBtn.addEventListener('click', () => {
  bfCreateNewDatasetInfo.style.color = blackColor
  bfCreateNewDatasetBtn.disabled = true
  bfCreateNewDatasetInfo.value = 'Adding'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  client.invoke("api_bf_new_dataset_folder", bfNewDatasetName.value, selectedbfaccount, (error, res) => {
    if (error) {
      console.log('ERROR')
      var emessage = userError(error)
      bfCreateNewDatasetInfo.style.color = redColor
      bfCreateNewDatasetInfo.value = emessage
      bfCreateNewDatasetBtn.disabled = false
    } else {
        bfCreateNewDatasetInfo.value = 'Success: created folder' + ' ' + bfNewDatasetName.value
        refreshBfDatasetList(bfDatasetList)
        refreshBfDatasetList(bfDatasetListPermission)
        currentDatasetPermission.innerHTML = ''
        bfCreateNewDatasetBtn.disabled = false
    }
  })
})


// // Submit local dataset to selected bf dataset
// bfSubmitDatasetBtn.addEventListener('click', () => {
//   bfsubmitdatasetinfo.style.color = blackcolor
//   bfSubmitDatasetBtn.disabled = true
//   bfsubmitdatasetinfo.value = 'Submitting'
//   var completionstatus = 'Solving'
//   var selectedbfaccount = bfaccountlist.options[bfaccountlist.selectedIndex].text
//   var selectedbfdataset = bfdatasetlist.options[bfdatasetlist.selectedIndex].text
//   client.invoke("apiBfSubmitDataset", selectedbfaccount, selectedbfdataset, pathsubmitdataset.value, (error, res) => {
//     if (error) {
//       console.log('ERROR')
//       var emessage = userError(error)
//       bfsubmitdatasetinfo.style.color = redcolor
//       bfsubmitdatasetinfo.value = emessage
//     } else {
//       console.log('Done', res)
//     }
//   })
//
//   var timerprogress = setInterval(progressfunction, 500)
//     function progressfunction(){
//       client.invoke("apiSubmitDatasetProgress", (error, res) => {
//         if(error) {
//           console.error(error)
//         } else {
//           completionstatus = res[1]
//           var printstatus = res[2]
//           if (printstatus === 'Uploading') {
//             bfsubmitdatasetinfo.value = res[0].split(',').join('\n')
//           }
//         }
//       })
//       if (completionstatus === 'Done'){
//         clearInterval(timerprogress)
//         bfSubmitDatasetBtn.disabled = false
//       }
//     }
// })


bfSubmitDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-progress-bar-status").innerHTML = ""
  var err = false
  // bfsubmitdatasetinfo.style.color = blackcolor
  bfSubmitDatasetBtn.disabled = true
  // bfsubmitdatasetinfo.value = 'Submitting'
  var completionStatus = 'Solving'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedbfdataset = bfDatasetList.options[bfDatasetList.selectedIndex].text
  client.invoke("api_bf_submit_dataset", selectedbfaccount, selectedbfdataset, pathSubmitDataset.value, (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      document.getElementById("para-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      progressBar.style.width = 0 + "%";
      err = true
      // bfsubmitdatasetinfo.style.color = redcolor
      // bfsubmitdatasetinfo.value = emessage
    } else {
      console.log('Done', res)
    }
  })


  var timerprogress = setInterval(progressfunction, 250)
    function progressfunction(){
      client.invoke("api_submit_dataset_progress", (error, res) => {
        if(error) {
          console.error(error)
        } else {
          // (submitdataprogress, submitdatastatus, submitprintstatus, uploaded_file_size, total_file_size)
          var dataProgress = res[0]
          completionStatus = res[1]
          var uploadedFileSize = res[3]
          var totalFileSize = res[4]
          var value = (uploadedFileSize / totalFileSize) * 100
          console.log(uploadedFileSize, totalFileSize, value)
          progressBar.style.width = value + "%";
          if (completionStatus != 'Done') {
            document.getElementById("para-progress-bar-status").innerHTML = dataProgress.split(',').pop()
            // bfsubmitdatasetinfo.value = dataProgress.split(',').join('\n')
          }
        }
      })
      if (completionStatus === 'Done'){
        if (!err){
          progressBar.style.width = 100 + "%";
          document.getElementById("para-progress-bar-status").innerHTML = "Upload completed !"
        }
        clearInterval(timerprogress)
        bfSubmitDatasetBtn.disabled = false
      }
    }
})

/**
 * This event tracks change of the selected dataset in the dropdown list
 * under the "Manage dataset permission" feature
 */
bfDatasetListPermission.addEventListener('change', () => {
  showCurrentPermission()
})


/**
 * This event listener add permission to the selected dataset
 * when user clicks on the "Add permission"  button
 */
bfAddPermissionBtn.addEventListener('click', () => {
  datasetPermissionStatus.innerHTML = ''
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedUser = bfListUsers.options[bfListUsers.selectedIndex].text
  var selectedRole = bfListRoles.options[bfListRoles.selectedIndex].text

  client.invoke("api_bf_add_permission", selectedBfAccount, selectedBfDataset, selectedUser, selectedRole,
    (error, res) => {
    if(error) {
      console.log(error)
      var emessage = userError(error)
      datasetPermissionStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
    } else {
      console.log('Done', res)
      datasetPermissionStatus.innerHTML = res
      showCurrentPermission()
    }
  })
})


// // // // // // // // // //
// Functions: Organize dataset
// // // // // // // // // //

function userError(error)
{
  var myerror = error.message
  return myerror
}

function updateBfAccountList(){
  client.invoke("api_bf_account_list", (error, res) => {
  if(error) {
    console.error(error)
  } else {
    for (myitem in res){
      var myitemselect = res[myitem]
      var option = document.createElement("option")
      option.textContent = myitemselect
      option.value = myitemselect
      bfAccountList.appendChild(option)
    }
  }
})
}

function removeOptions(selectbox)
{
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
    {
        selectbox.remove(i);
    }
}

function disableform(formId) {
  var f = formId.elements;
  for (var i=0;i<f.length;i++)
     f[i].disabled=true
  }

function enableform(formId) {
  var f = formId.elements;
  for (var i=0;i<f.length;i++)
     f[i].disabled=false
}

function refreshBfDatasetList(bfdstlist){
  removeOptions(bfdstlist)
  var accountselected = bfAccountList.options[bfAccountList.selectedIndex].text
  if (accountselected === "Select"){
    var optionselect = document.createElement("option")
    optionselect.textContent = 'Select dataset'
    bfdstlist.appendChild(optionselect)
  } else {
    client.invoke("api_bf_dataset_account", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
      if(error) {
        console.error(error)
      } else {
        for (myitem in res){
          var myitemselect = res[myitem]
          var option = document.createElement("option")
          option.textContent = myitemselect
          option.value = myitemselect
          bfdstlist.appendChild(option)
        }
      }
    })
  }
}

/**
 * refreshBfUsersList is a function that refreshes the dropdown list
 * with names of users when an Blackfynn account is selected
 */
function refreshBfUsersList(UsersList){
  removeOptions(UsersList)
  var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text
  var optionUser = document.createElement("option")
  optionUser.textContent = 'Select user'
  UsersList.appendChild(optionUser)
  if (accountSelected !== "Select") {
    client.invoke("api_bf_get_users", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
      if (error){
        console.error(error)
      } else{
        for ( var myItem in res){
          var myUser = res[myItem]
          var optionUser = document.createElement("option")
          optionUser.textContent = myUser
          optionUser.value = myUser
          UsersList.appendChild(optionUser)
        }
      }
    })
  }
}

function showCurrentPermission(){
  currentDatasetPermission.innerHTML = ''
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    currentDatasetPermission.innerHTML = ''
  } else {
    client.invoke("api_bf_get_permission", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        console.log(error)
      } else {
        console.log('Done', res)
        var permissionList = ''
        for (var i in res){
          permissionList = permissionList + res[i] + '<br>'
        }
        currentDatasetPermission.innerHTML = permissionList
      }
    })
  }
}

function showAccountDetails(){
  client.invoke("api_bf_account_details", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      console.error(error)
    } else {
      document.getElementById("para-select-account-status").innerHTML = res;
    }
  })
}

// // // // // // // // // //
// Functions: Organize dataset
// // // // // // // // // //

// Organized
function checkFolderStruture(pathDatasetFolder){
  var files = fs.readdirSync(pathDatasetFolder)
  var folders = []
  for (var i = 0; i<files.length; i++) {
    var filename = files[i]
    var filepath = path.join(pathDatasetFolder, filename)
    if (fs.lstatSync(filepath).isDirectory()){
      folders.push(filename)
    }
  }
  //if (folders.length != sparcFolderNames.length)
  //      return false
  var foldersorted = folders.sort()
  // var sparcFolderSorted = sparcFolderNames.sort()
  for (var i = 0; i < foldersorted.length; i++) {
    //if (foldersorted[i] != sparcFolderSorted[i]) {
    if (!sparcFolderNames.includes(foldersorted[i])) {
      return false
    }
  }
  return true
}

function organizedFolderToJson(pathDatasetVal){
  var jsonvar = {}
  var mainfolderfiles = []
  var files = fs.readdirSync(pathDatasetVal)
  for (var i = 0; i<files.length; i++) {
    var filename = files[i]
    var filepath = path.join(pathDatasetVal, filename)
    if (fs.lstatSync(filepath).isDirectory()){
      var filesinfolder = fs.readdirSync(filepath)
      console.log(filesinfolder)
      filesinfolder = filesinfolder.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
      console.log(filesinfolder)
      var folderfiles = []
      for (var j = 0; j<filesinfolder.length; j++) {
        var filenameinfolder = filesinfolder[j]
        folderfiles.push(path.join(filepath, filenameinfolder))
      }
      jsonvar[filename] = folderfiles
    } else {
      if(! /^\..*/.test(filename)) {
        mainfolderfiles.push(filepath)
      }
    }
  }
  jsonvar['main'] = mainfolderfiles
  return jsonvar
}

function jsonToTableOrganized(table, jsonvar){
  var keyvect = Object.keys(jsonvar)
  for (var j = 0; j < keyvect.length; j++) {
    let SPARCfolder = keyvect[j]
    var SPARCfolderid = SPARCfolder + '_org'
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var pathlist = jsonvar[SPARCfolder]
    for (var i = 0; i < pathlist.length; i++){
      tableOrganizedCount = tableOrganizedCount + 1
      var rownum = rowcount + i + 1
      var table_len = tableOrganizedCount
      var row = table.insertRow(rownum).outerHTML="<tr id='row-org"+table_len+"'><td id='name_row_org"+table_len+"'>"+ pathlist[i] +"</td> <td id='description_row_org"+table_len+"'>"+ "" +"</td> <td><input type='button' id='edit_button_org"+table_len+"' value='Edit description' class='edit' onclick='edit_row_org("+table_len+")'> <input type='button' id='save_button_org"+table_len+"' value='Save description' class='save' onclick='save_row_org("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row_org("+table_len+")'> </td></tr>";
    }
  }
  return table
}

function tableToJsonWithDescriptionOrganized(table){
  var jsonvar = {}
  var jsonvardescription= {}

  var pathlist = new Array()
  var descriptionlist = new Array()

  var keyval = "code"

  var tableheaders = sparcFolderNames.slice()
  tableheaders.push("main")
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    var descriptionname = row.cells[1].innerHTML
    if (tableheaders.includes(pathname)) {
      jsonvar[keyval] = pathlist
      jsonvardescription[keyval + "_description"] = descriptionlist
      keyval = pathname
      var pathlist = new Array()
      var descriptionlist = new Array()
    } else {
      pathlist.push(row.cells[0].innerHTML)
      descriptionlist.push(row.cells[1].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  jsonvardescription[keyval+ "_description"] = descriptionlist

  return [jsonvar, jsonvardescription]
}

// Not organized
function insertFileToTable(table, path){
  var i
  let SPARCfolder = document.querySelector('#SPARCfolderlist').value
  var rowcount = document.getElementById(SPARCfolder).rowIndex
  var jsonvar = tableToJson(table)
  var emessage = ''
  var count = 0
  for (i = 0; i < path.length; i++) {
      if ( jsonvar[SPARCfolder].indexOf(path[i]) > -1 ) {
        emessage = emessage + path[i] + ' already exists in ' + SPARCfolder + "\n"
        count += 1
      }
  }
  if (count > 0) {
    console.log(emessage)
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
    for (i = 0; i < path.length; i++) {
      tableNotOrganizedCount = tableNotOrganizedCount + 1
      var table_len=tableNotOrganizedCount
      var rownum = rowcount + i + 1
      var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ path[i] +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
    }
    return table
  }
}

function tableToJson(table){
  var jsonvar = {}
  var pathlist = new Array()
  var keyval = "code"
  var tableheaders = sparcFolderNames.slice()
  tableheaders.push("main")
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    if (tableheaders.includes(pathname)) {
      jsonvar[keyval] = pathlist
      keyval = pathname
      var pathlist = new Array()
    } else {
      pathlist.push(row.cells[0].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  return jsonvar
}

function jsonToTableWithDescription(table, jsonvar){
  var keyvect = Object.keys(jsonvar)
  var tableheaders = sparcFolderNames.slice()
  tableheaders.push("main")
  for (var j = 0; j < tableheaders.length; j++) {
    let SPARCfolder = tableheaders[j]
    var SPARCfolderid = SPARCfolder
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var pathlist = jsonvar[SPARCfolder]
    var descriptionlist = jsonvar[SPARCfolder + "_description"]
    for (var i = 0; i < pathlist.length; i++){
      if (pathlist[i] !== "" ) {
	      var rownum = rowcount + i + 1
	      tableNotOrganizedCount = tableNotOrganizedCount + 1
	      var table_len = tableNotOrganizedCount
	      var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ pathlist[i] +"</td><td id='description_row"+table_len+"'>"+ descriptionlist[i] +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
       }
    }
  }
  return table
}

function tableToJsonWithDescription(table){
  var jsonvar = {}
  var jsonvardescription= {}

  var pathlist = new Array()
  var descriptionlist = new Array()

  var keyval = "code"
  if (table === tableOrganized){
    keyval = keyval + "_org"
  }
  var tableheaders = sparcFolderNames.slice()
  tableheaders.push("main")
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    var descriptionname = row.cells[1].innerHTML
    if (tableheaders.includes(pathname)) {
      jsonvar[keyval] = pathlist
      jsonvardescription[keyval + "_description"] = descriptionlist
      keyval = pathname
      if (table === tableOrganized){
      keyval = keyval + "_org"
    }
      var pathlist = new Array()
      var descriptionlist = new Array()
    } else {
      pathlist.push(row.cells[0].innerHTML)
      descriptionlist.push(row.cells[1].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  jsonvardescription[keyval+ "_description"] = descriptionlist

  return [jsonvar, jsonvardescription]
}

function dropAddToTable(e, myID){
	var rowcount = document.getElementById(myID).rowIndex
	var i = 0
  var jsonvar = tableToJson(tableNotOrganized)
  var emessage = ''
  var count = 0
  for (let f of e.dataTransfer.files) {
      if ( jsonvar[myID].indexOf(f.path) > -1 ) {
        emessage = emessage + f.path + ' already exists in ' + myID + "\n"
        count += 1
      }
  }
  if (count > 0) {
    console.log(emessage)
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
  	for (let f of e.dataTransfer.files) {
          console.log('File(s) you dragged here: ', f.path, myID)
          var rownum = rowcount + i + 1
  	    tableNotOrganizedCount = tableNotOrganizedCount + 1
  	    var table_len = tableNotOrganizedCount
  	    var row = tableNotOrganized.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ f.path +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
       	i = i + 1
      }
  }
}

//Both
function clearTable(table){
  var keyvect = sparcFolderNames.slice()
  keyvect.push("main")
  while (table.rows.length > keyvect.length){
    var keyrow = []
    for (var j = 0; j < keyvect.length; j++) {
      var SPARCfolderid = keyvect[j]
      if (table == tableOrganized){
        SPARCfolderid = SPARCfolderid + "_org"
      }
      var rowcount = document.getElementById(SPARCfolderid).rowIndex
      keyrow.push(rowcount)
    }
    for (var i = 0; i < table.rows.length; i++) {
      if (keyrow.includes(i) === false){
        table.deleteRow(i)
        break
      }
    }
  }
  return table
}
