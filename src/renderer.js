//////////////////////////////////
// Import required modules
//////////////////////////////////
// const $ = require("jquery");
const zerorpc = require("zerorpc")
const fs = require("fs")
const os = require("os")
const path = require('path')
const {ipcRenderer} = require('electron')
const Editor = require('tui-editor')
const remote = require('electron').remote;
const app = remote.app;
const imageDataURI = require("image-data-uri");
const log  = require("electron-log");

var homeDirectory = app.getPath('home')

// Connect to python server and check
let client = new zerorpc.Client({ timeout: 300000})

client.connect("tcp://127.0.0.1:4242")

client.invoke("echo", "server ready", (error, res) => {
  if(error || res !== 'server ready') {
    log.error(error)
    console.error(error)
  } else {
    console.log("server is ready")
  }
})


//////////////////////////////////
// Get html elements from the user interface //
//////////////////////////////////

// Metadata Templates
const downloadSubmission = document.getElementById("a-submission")
const downloadSamples = document.getElementById("a-samples")
const downloadSubjects = document.getElementById("a-subjects")
const downloadDescription = document.getElementById("a-description")
const downloadManifest = document.getElementById("a-manifest")
const homedir = os.homedir()
const userDownloadFolder = path.join(homedir, "Downloads")

// Organize dataset
const bfAccountCheckBtn = document.getElementById('button-check-bf-account-details')
const bfUploadAccountCheckBtn = document.getElementById('button-upload-check-bf-account-details')
const selectDatasetBtn = document.getElementById('button-select-dataset')
const pathDataset = document.querySelector('#para-selected-dataset')
const tableOrganized = document.getElementById("table-organized")
let tableOrganizedCount = 0
const tableNotOrganized = document.getElementById("code_table")
let tableNotOrganizedCount = 0
const alreadyOrganizedStatus = document.querySelector('#preorganized-dataset')
const organizeDatasetStatus = document.querySelector('#organize-dataset')
const clearTableBtn = document.getElementById('button-clear-table')
const selectSaveFileOrganizationBtn = document.getElementById('button-select-save-file-organization')
const selectPreviewBtn = document.getElementById('button-preview-file-organization')
const selectImportFileOrganizationBtn = document.getElementById('button-select-upload-file-organization')

const selectPreviewMetadataBtn = document.getElementById('button-preview-file-organization-metadata')


// Generate dataset
const createNewStatus = document.querySelector('#create-newdataset')
const modifyExistingStatus = document.querySelector('#existing-dataset')
const bfUploadDirectlyStatus = document.querySelector('#cloud-dataset')
const pathNewDataset = document.querySelector('#selected-new-dataset')
const newDatasetName = document.querySelector('#new-dataset-name')
const manifestStatus = document.querySelector('#generate-manifest')
const curationForm = document.querySelector('#dataset-curate-form')
const progressBarCurate = document.getElementById("progress-bar-curate")
const progressCurateUpload = document.getElementById("div-curate-progress")

const tableMetadata = document.getElementById("metadata-table")
let tableMetadataCount = 0

const curateDatasetBtn = document.getElementById('button-curate-dataset')
const bfUploadDatasetBtn = document.getElementById('button-upload-dataset')

// Manage datasets
const keyName = document.querySelector('#bf-key-name')
const key = document.querySelector('#bf-key')
const secret = document.querySelector('#bf-secret')
const bfAddAccountBtn = document.getElementById('add-bf-account')
const bfAddAccountStatus = document.querySelector('#para-add-account-status')
const bfAddAccountInfo = document.querySelector('#add-account-progress')

const bfAccountList = document.querySelector('#bfaccountlist')
const bfUploadAccountList = document.querySelector('#bfuploadaccountlist')
const bfAccountLoadProgress = document.querySelector('#div-bf-account-load-progress')
const bfAccountLoadProgressCurate = document.querySelector('#div-bf-account-load-progress-curate')

var myitem
const bfDatasetList = document.querySelector('#bfdatasetlist')
const bfUploadDatasetList = document.querySelector('#bfuploaddatasetlist')
const bfSelectAccountStatus = document.getElementById("para-select-account-status")
const bfUploadSelectAccountStatus = document.getElementById("para-upload-select-account-status")

const bfRefreshDatasetBtn = document.getElementById('button-refresh-dataset-list')
const bfRefreshDatasetMetadataBtn = document.getElementById('button-refresh-dataset-list-metadata')
const bfRefreshDatasetPermissionBtn = document.getElementById('button-refresh-dataset-list-permission')
const bfUploadRefreshDatasetBtn = document.getElementById('button-upload-refresh-dataset-list')
const bfNewDatasetName = document.querySelector('#bf-new-dataset-name')
const bfCreateNewDatasetBtn = document.getElementById('button-create-bf-new-dataset')
const bfCreateNewDatasetStatus = document.querySelector('#para-add-new-dataset-status')
const bfNewDatasetSubtitle = document.querySelector('#bf-new-dataset-subtitle')
const bfNewDatasetSubtitleCharCount = document.querySelector('#para-char-count')

const bfSubmitDatasetBtn = document.getElementById('button-submit-dataset')
const bfSubmitDatasetInfo = document.querySelector('#progresssubmit')
const pathSubmitDataset = document.querySelector('#selected-submit-dataset')
const progressUploadBf = document.getElementById("div-progress-submit")
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf")


// Blackfynn dataset metadata
const bfMetadataForm = document.querySelector('#bf-add-metadata-form')

const bfDatasetListMetadata = document.querySelector('#bfdatasetlist_metadata')
const bfCurrentMetadataProgress = document.querySelector('#div-bf-current-metadata-progress')

const bfDatasetSubtitle = document.querySelector('#bf-dataset-subtitle')
const bfDatasetSubtitleCharCount = document.querySelector('#para-char-count-metadata')
const bfAddSubtitleBtn = document.getElementById('button-add-subtitle')
const datasetSubtitleStatus = document.querySelector('#para-dataset-subtitle-status')

const bfAddDescriptionBtn = document.getElementById('button-add-description')
const datasetDescriptionStatus = document.querySelector('#para-dataset-description-status')


const bfCurrentBannerImg = document.getElementById('current-banner-img')
const bfImportBannerImageBtn = document.getElementById('button-import-banner-image')
const datasetBannerImagePath = document.querySelector('#para-path-image')
const bfViewImportedImage = document.querySelector('#image-banner')
const bfSaveBannerImageBtn = document.getElementById('save-banner-image')
const datasetBannerImageStatus = document.querySelector('#para-dataset-banner-image-status')
const formBannerHeight = document.getElementById('form-banner-height')
const formBannerWidth = document.getElementById('form-banner-width')

const currentDatasetLicense = document.querySelector('#para-dataset-license-current')
const bfListLicense = document.querySelector('#bf-license-list')
const bfAddLicenseBtn = document.getElementById('button-add-license')
const datasetLicenseStatus = document.querySelector('#para-dataset-license-status')


// Blackfynn dataset permission
const bfPermissionForm = document.querySelector('#blackfynn-permission-form')

const bfDatasetListPermission = document.querySelector('#bfdatasetlist_permission')
const currentDatasetPermission = document.querySelector('#para-dataset-permission-current')
const bfCurrentPermissionProgress = document.querySelector('#div-bf-current-permission-progress')

const bfListUsersPI = document.querySelector('#bf_list_users_pi')
const bfAddPermissionPIBtn = document.getElementById('button-add-permission-pi')
const datasetPermissionStatusPI = document.querySelector('#para-dataset-permission-status-pi')

const bfAddPermissionCurationTeamBtn = document.getElementById('button-add-permission-curation-team')
const datasetPermissionStatusCurationTeam = document.querySelector('#para-dataset-permission-status-curation-team')

const bfListUsers = document.querySelector('#bf_list_users')
const bfListRoles = document.querySelector('#bf_list_roles')
const bfAddPermissionBtn = document.getElementById('button-add-permission')
const datasetPermissionStatus = document.querySelector('#para-dataset-permission-status')

const bfListTeams = document.querySelector('#bf_list_teams')
const bfListRolesTeam = document.querySelector('#bf_list_roles_team')
const bfAddPermissionTeamBtn = document.getElementById('button-add-permission-team')
const datasetPermissionStatusTeam = document.querySelector('#para-dataset-permission-status-team')


//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = '#000000'
const redColor = '#ff1a1a'
const sparcFolderNames = ["code", "derivatives", "docs", "primary", "protocol", "source"]
const smileyCan = '<img class="message-icon" src="assets/img/can-smiley.png">'
const sadCan = '<img class="message-icon" src="assets/img/can-sad.png">'

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Button selection to move on to next step
document.getElementById('button-organize-next-step').addEventListener('click', (event) => {
  if (getComputedStyle(document.getElementById('div-file-conversion'), null).display === 'none'){
    document.getElementById('button-file-conversion-demo-toggle').click()
    document.getElementById('button-specfy-dataset-demo-toggle').click()
  }
})
document.getElementById('button-file-conversion-next-step').addEventListener('click', (event) => {
  if (getComputedStyle(document.getElementById('div-specify-metadata'), null).display === 'none'){
    document.getElementById('button-specify-metadata-demo-toggle').click()
    document.getElementById('button-file-conversion-demo-toggle').click()
  }
})
document.getElementById('button-specify-metadata-next-step').addEventListener('click', (event) => {
  if (getComputedStyle(document.getElementById('div-validate-dataset'), null).display === 'none'){
    document.getElementById('button-validate-dataset-demo-toggle').click()
    document.getElementById('button-specify-metadata-demo-toggle').click()
  }
})
document.getElementById('button-validate-dataset-next-step').addEventListener('click', (event) => {
  if (getComputedStyle(document.getElementById('div-generate-dataset'), null).display === 'none'){
    document.getElementById('button-generate-dataset-demo-toggle').click()
    document.getElementById('button-validate-dataset-demo-toggle').click()
  }
})


//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Check app version and warn for updates
const appVersion = window.require('electron').remote.app.getVersion()
console.log("Current SODA version:", appVersion)

const axios = require('axios');
const url = 'https://github.com/bvhpatel/SODA';

axios.get(url)
  .then(response => {
    var str = response.data
    var firstvariable = "Latest version: "
    var secondvariable = "<"
    var scrappedVersion = str.match(new RegExp(firstvariable + "(.*)" + secondvariable))[1]
    console.log("Latest SODA version:", scrappedVersion)
    if (appVersion !== scrappedVersion){
      ipcRenderer.send('warning-new-version')
    }
  })
  .catch(error => {
    console.log(error);
  })

// Download Metadata Templates
templateArray = ["submission.xlsx", "subjects.xlsx", "samples.xlsx", "dataset_description.xlsx", "manifest.xlsx"]

const { COPYFILE_EXCL } = fs.constants.COPYFILE_FICLONE;
function downloadTemplates(templateItem) {
  var downloadedPath = path.join(userDownloadFolder, templateItem)
  if (fs.existsSync(downloadedPath)) {
    window.alert("File already exists in Downloads folder")
  } else {
    window.alert("Successfully saved file to your Downloads folder")
    fs.createReadStream(path.join("file_templates", templateItem)).pipe(fs.createWriteStream(path.join(userDownloadFolder, templateItem)))
  }
}
downloadSubmission.addEventListener('click', (event) => {
  downloadTemplates(templateArray[0])
});
downloadSubjects.addEventListener('click', (event) => {
  downloadTemplates(templateArray[1])
});
downloadSamples.addEventListener('click', (event) => {
  downloadTemplates(templateArray[2])
});
downloadDescription.addEventListener('click', (event) => {
  downloadTemplates(templateArray[3])
});
downloadManifest.addEventListener('click', (event) => {
  downloadTemplates(templateArray[4])
});

// Select organized dataset folder and populate table
selectDatasetBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-dataset')
})
ipcRenderer.on('selected-dataset', (event, path) => {
  if (path.length > 0) {
    clearTable(tableOrganized)
    pathDataset.innerHTML = ""
    var folderChecking = checkFolderStruture(path[0])
    if (folderChecking == true) {
      pathDataset.innerHTML = path
      var jsonFolder = organizedFolderToJson(path[0])
      jsonToTableOrganized(tableOrganized, jsonFolder)
    } else {
      pathDataset.innerHTML = "<span style='color: red;'> Error: please select a dataset with SPARC folder structure </span>" + sadCan
    }
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
})

//Clear table
clearTableBtn.addEventListener('click', () => {
  // Generate warning before continuing
  ipcRenderer.send('warning-clear-table')
})
ipcRenderer.on('warning-clear-table-selection', (event, index) => {
  if (index === 0) {
    if (alreadyOrganizedStatus.checked){
      clearTable(tableOrganized)
      pathDataset.innerHTML = ""
    } else if (organizeDatasetStatus.checked) {
      clearTable(tableNotOrganized)
      clearStrings()
    }
  }
})


// Drag and drop
var holderCode = document.getElementById('code')
holderCode.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderCode.id
   dropAddToTable(event, myID)
})

var holderDerivatives = document.getElementById('derivatives')
holderDerivatives.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderDerivatives.id
   dropAddToTable(event, myID)
})

var holderDocs = document.getElementById('docs')
holderDocs.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderDocs.id
   dropAddToTable(event, myID)
})

var holderPrimary = document.getElementById('primary')
holderPrimary.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderPrimary.id
   dropAddToTable(event, myID)
})

var holderProtocol = document.getElementById('protocol')
holderProtocol.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderProtocol.id
   dropAddToTable(event, myID)
})

var holderSource = document.getElementById('source')
holderSource.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderSource.id
   dropAddToTable(event, myID)
})

var holderMetadata = document.getElementById('metadata')
holderMetadata.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderMetadata.id
   dropAddToTableMetadata(event, myID)
})


//Select files to be added to metadata files table
const selectMetadataBtn = document.getElementById('button-select-metadata')
selectMetadataBtn.addEventListener('click', (event) => {
  document.getElementById("para-preview-organization-status-metadata").innerHTML = ""
  ipcRenderer.send('open-file-dialog-metadata')
})
ipcRenderer.on('selected-metadata', (event, path) => {
    insertFileToMetadataTable(tableMetadata, path)
})



const tuiInstance = new Editor({
  el: document.querySelector('#editorSection'),
  initialEditType: 'wysiwyg',
  previewStyle: 'vertical',
  height: '400px',
  toolbarItems: [
    'heading',
    'bold',
    'italic',
    'strike',
    'link',
    'divider',
    'ul',
    'ol',
    'divider',
    'hr',
    'quote',
    'code',
    'codeblock',
    'divider',
    // First way to add a button
    {
      type: 'button',
      options: {
        $el: $('<div class="custom-button"><i class="fas fa-briefcase-medical"></i></div>'),
        name: 'test2',
        className: '',
        command: 'Bold', // you can use "Bold"
        tooltip: 'Bold'
      }
    }
  ]
})


function countCharacters(textelement, pelement) {
  var textEntered = textelement.value;
  var counter = (256 - (textEntered.length));
  pelement.innerHTML = counter + ' characters remaining'
}

bfNewDatasetSubtitle.addEventListener('keyup',  function(){
  countCharacters(bfNewDatasetSubtitle, bfNewDatasetSubtitleCharCount)
})

bfDatasetSubtitle.addEventListener('keyup',  function(){
  countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount)
})


//////////////////////////////////
// Operations calling to pysoda.py functions //
//////////////////////////////////

// Action when user click on "Save" file organization button
selectSaveFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('save-file-dialog-saveorganization')
  document.getElementById("para-save-file-organization-status").innerHTML = ""
  clearStrings()
})
ipcRenderer.on('selected-saveorganizationfile', (event, path) => {
  if (path.length > 0){
    if (alreadyOrganizedStatus.checked == true){
      var jsonvect = tableToJsonWithDescriptionOrganized(tableOrganized)
    } else {
      var jsonvect = tableToJsonWithDescription(tableNotOrganized)
    }
    var jsonpath = jsonvect[0]
    var jsondescription = jsonvect[1]
    document.getElementById("para-save-file-organization-status").innerHTML = ""
    // Call python to save
    if (path != null){
      client.invoke("api_save_file_organization", jsonpath, jsondescription, path, (error, res) => {
          if(error) {
            log.error(error)
            var emessage = userError(error)
            document.getElementById("para-save-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
          } else {
            document.getElementById("para-save-file-organization-status").innerHTML = "Saved!"
          }
      })
    }
  }
})


// Action when user click on "Import" button
selectImportFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-uploadorganization')
    clearStrings()
})
ipcRenderer.on('selected-uploadorganization', (event, path) => {
  if (path.length > 0) {
    clearStrings()
    var headerNames = sparcFolderNames.slice()
    var lennames =  headerNames.length
    for (var i = 0; i < lennames; i++) {
    	headerNames.push(headerNames[i] + "_description")
    }
    client.invoke("api_import_file_organization", path[0], headerNames, (error, res) => {
          if(error) {
            log.error(error)
            var emessage = userError(error)
            document.getElementById("para-upload-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
          } else {
            jsonToTableWithDescription(tableNotOrganized, res)
            document.getElementById("para-upload-file-organization-status").innerHTML = "Imported!";
          }
    })
  }
})

// Action when user click on "Preview" file organization button
selectPreviewBtn.addEventListener('click', () => {
  clearStrings()
  document.getElementById("para-preview-organization-status").innerHTML = "Please wait..."
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  if (manifestStatus.checked){
    var keyvect = sparcFolderNames.slice()
    console.log(keyvect)
    for (var j = 0; j < keyvect.length; j++){
      var folder = keyvect[j]
      var folderPaths = jsonpath[folder]
      if (folderPaths.length>0){
        folderPaths.push(path.join("file_templates","manifest.xlsx"))
      }
    }
  }
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  console.log(jsonpath)
  jsonpath['main'] = jsonpathMetadata['metadata']
  client.invoke("api_preview_file_organization", jsonpath, (error, res) => {
      if(error) {
        log.error(error)
        var emessage = userError(error)
        document.getElementById("para-preview-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        document.getElementById("para-preview-organization-status").innerHTML = "Preview folder available in a new file explorer window";
      }
  })
})

selectPreviewMetadataBtn.addEventListener('click', () => {
  clearStrings()
  document.getElementById("para-preview-organization-status-metadata").innerHTML = "Please wait..."
  if (alreadyOrganizedStatus.checked) {
    var jsonvect = tableToJsonWithDescriptionOrganized(tableOrganized)
  } else if (organizeDatasetStatus.checked) {
    var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  }
  var jsonpath = jsonvect[0]
  if (manifestStatus.checked){
    var keyvect = sparcFolderNames.slice()
    for (var j = 0; j < keyvect.length; j++){
      var folder = keyvect[j]
      var folderPaths = jsonpath[folder]
      if (folderPaths.length>0){
        folderPaths.push(path.join("file_templates","manifest.xlsx"))
      }
    }
  }
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  jsonpath['main'] = jsonpathMetadata['metadata']
  client.invoke("api_preview_file_organization", jsonpath, (error, res) => {
      if(error) {
        log.error(error)
        var emessage = userError(error)
        document.getElementById("para-preview-organization-status-metadata").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        document.getElementById("para-preview-organization-status-metadata").innerHTML = "Preview folder available in a new file explorer window";
      }
  })
})


// // // // // // // // // //
// Action when user click on Generate Dataset
// // // // // // // // // //

curateDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-curate").innerHTML = "Please wait..."
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  progressBarCurate.value = 0;
  // Disable curate button to prevent multiple clicks
  curateDatasetBtn.disabled = true
  disableform(curationForm)
  var sourceDataset = ''
  // Convert table content into json file for transferring to Python
  if (alreadyOrganizedStatus.checked) {
    if (fs.existsSync(pathDataset.innerHTML)) {
      var jsonvect = tableToJsonWithDescriptionOrganized(tableOrganized)
      sourceDataset = 'already organized'
    } else {
      var emessage = 'Error: Select a valid dataset folder'
      document.getElementById("para-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
      document.getElementById("para-please-wait-curate").innerHTML = "";
      curateDatasetBtn.disabled = false
      enableform(curationForm)
      console.error('Error')
      return
    }
  } else if (organizeDatasetStatus.checked) {
    var jsonvect = tableToJsonWithDescription(tableNotOrganized)
    var error = true
    for (var keys in jsonvect[0]) {
      if(jsonvect[0][keys].length > 0) {
        error = false
      }
    }
    if (error) {
      var emessage = 'Error: Please add files to your dataset'
      document.getElementById("para-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
      document.getElementById("para-please-wait-curate").innerHTML = "";
      curateDatasetBtn.disabled = false
      enableform(curationForm)
      console.error(emessage)
      return
    }
    sourceDataset = 'not organized'
  } else {
    var emessage = 'Error: Please select an option under "Organize dataset" '
    document.getElementById("para-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
    document.getElementById("para-please-wait-curate").innerHTML = "";
    curateDatasetBtn.disabled = false
    enableform(curationForm)
  	return
  }

  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  jsonpath['main'] = jsonpathMetadata['metadata']

  var destinationDataset = ''
  var pathDatasetValue = ''
  var newDatasetNameVar = ''
  if (modifyExistingStatus.checked) {
    destinationDataset = 'modify existing'
    pathDatasetValue = String(pathDataset.innerHTML)
  } else if (createNewStatus.checked) {
    destinationDataset = 'create new'
    pathDatasetValue = pathNewDataset.value
    newDatasetNameVar = newDatasetName.value
  } else if (bfUploadDirectlyStatus.checked) {
    destinationDataset = 'upload to blackfynn'
    pathDatasetValue = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
    newDatasetNameVar = bfUploadDatasetList.options[bfUploadDatasetList.selectedIndex].text
  }

  // Initiate curation by calling python funtion
  var err = false
  var completionstatus = 'Solving'
  document.getElementById("para-curate-progress-bar-status").innerHTML = "Started generating files ..."
  client.invoke("api_curate_dataset",
    sourceDataset, destinationDataset, pathDatasetValue, newDatasetNameVar,
    manifestStatus.checked, jsonpath, jsondescription,
    (error, res) => {
    if (error) {
      document.getElementById("para-please-wait-curate").innerHTML = ""
      var emessage = userError(error)
      document.getElementById("para-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
      document.getElementById("para-curate-progress-bar-status").innerHTML = ""
      document.getElementById("para-please-wait-curate").innerHTML = "";
      progressCurateUpload.style.display = "none"
      progressBarCurate.value = 0;
      err = true
      log.error(error)
      curateDatasetBtn.disabled = false
      enableform(curationForm)
    } else {
      document.getElementById("para-please-wait-curate").innerHTML = "Please wait...";
      progressCurateUpload.style.display = "block";
      console.log('Started curating')
    }
  })
  var countDone = 0
  var timerProgress = setInterval(progressfunction, 1000)
  function progressfunction(){
    curateDatasetBtn.disabled = true
    disableform(curationForm)
    client.invoke("api_curate_dataset_progress", (error, res) => {
      if (error) {
        var emessage = userError(error)
        document.getElementById("para-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
        log.error(error)
        document.getElementById("para-curate-progress-bar-status").innerHTML = ''
      } else {
        completionstatus = res[1]
        var printstatus = res[2]
        var totalCurateSize = res[3]
        var curatedSize = res[4]
        var value = (curatedSize / totalCurateSize) * 100
        progressBarCurate.value = value
        //console.log(value, totalCurateSize, curatedSize)
        if (printstatus === 'Curating') {
          if (res[0].includes('Success: COMPLETED!')){
            document.getElementById("para-please-wait-curate").innerHTML = "";
            document.getElementById("para-curate-progress-bar-status").innerHTML = res[0] + smileyCan
          } else {
            document.getElementById("para-curate-progress-bar-status").innerHTML = res[0] + 'Progress: ' + value.toFixed(2) + '%'
          }
        }
      }
    })
    if (completionstatus === 'Done'){
      countDone++
      if (countDone > 1){
        console.log('Done curating')
        document.getElementById("para-please-wait-curate").innerHTML = "";
        clearInterval(timerProgress)
        curateDatasetBtn.disabled = false
        enableform(curationForm)
      }
    }
  }
})

// // // // // // // // // //
//MANAGE DATASETS
// // // // // // // // // //

// Add existing bf account(s) to dropdown list


bfAccountCheckBtn.addEventListener('click', (event) => {
  bfSelectAccountStatus.innerHTML = "Please wait..."
  bfAccountLoadProgress.style.display = 'block'
  bfAccountLoadProgressCurate.style.display = 'block'
  updateBfAccountList()
})

bfUploadAccountCheckBtn.addEventListener('click', (event) => {
  bfSelectAccountStatus.innerHTML = "Please wait..."
  bfAccountLoadProgress.style.display = 'block'
  bfAccountLoadProgressCurate.style.display = 'block'
  updateBfAccountList()
})

// Add bf account
bfAddAccountBtn.addEventListener('click', () => {
  bfAddAccountBtn.disabled = true
  bfAddAccountStatus.innerHTML = ''
  client.invoke("api_bf_add_account", keyName.value, key.value, secret.value, (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      bfAddAccountStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
    } else {
        bfAddAccountStatus.innerHTML = res + smileyCan +". Please select your account below!"
        bfAccountLoadProgress.style.display = 'block'
        updateBfAccountList()
        keyName.value = ''
        key.value = ''
        secret.value = ''
    }
    bfAddAccountBtn.disabled = false
  })
})


// Select bf account from dropdownlist and show existing dataset
bfAccountList.addEventListener('change', () => {
  bfSelectAccountStatus.innerHTML = "Please wait..."
  bfAccountLoadProgress.style.display = 'block'
  currentDatasetPermission.innerHTML = ''
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  if (selectedbfaccount == 'Select') {
    bfSelectAccountStatus.innerHTML = "";
    bfUploadSelectAccountStatus.innerHTML = "";
    bfAccountLoadProgress.style.display = 'none'
  } else{
    var myitemselect = selectedbfaccount
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    bfUploadAccountList.value = selectedbfaccount
    showAccountDetails(bfAccountLoadProgress)
  }
  refreshAllBfDatasetLists()
  refreshBfUsersList()
  refreshBfTeamsList(bfListTeams)

})


bfUploadAccountList.addEventListener('change', () => {
  bfUploadSelectAccountStatus.innerHTML = "Please wait..."
  bfAccountLoadProgressCurate.style.display = 'block'
  currentDatasetPermission.innerHTML = ''
  var selectedbfaccount = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
  if (selectedbfaccount == 'Select') {
    bfSelectAccountStatus.innerHTML = "";
    bfUploadSelectAccountStatus.innerHTML = "";
    bfAccountLoadProgressCurate.style.display = 'none'
  } else{
    var myitemselect = selectedbfaccount
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    bfAccountList.value = selectedbfaccount
    showAccountDetails(bfAccountLoadProgressCurate)
  }
  refreshAllBfDatasetLists()
  refreshBfUsersList()
  refreshBfTeamsList(bfListTeams)
})

// Refresh list of bf dataset list (in case user create it online)
bfRefreshDatasetBtn.addEventListener('click', () => {
  currentDatasetPermission.innerHTML = ''
  refreshAllBfDatasetLists()
})
bfUploadRefreshDatasetBtn.addEventListener('click', () => {
  refreshAllBfDatasetLists()
})
bfRefreshDatasetMetadataBtn.addEventListener('click', () => {
  refreshAllBfDatasetLists()
})
bfRefreshDatasetPermissionBtn.addEventListener('click', () => {
  refreshAllBfDatasetLists()
})
// Add new dataset folder (empty) on bf
bfCreateNewDatasetBtn.addEventListener('click', () => {
  bfCreateNewDatasetBtn.disabled = true
  bfCreateNewDatasetStatus.innerHTML = 'Adding...'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  client.invoke("api_bf_new_dataset_folder", bfNewDatasetName.value, selectedbfaccount, (error, res) => {
    if (error) {
      log.error(error)
      var emessage = userError(error)
      bfCreateNewDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
      bfCreateNewDatasetBtn.disabled = false
    } else {
        var inputSubtitle = bfNewDatasetSubtitle.value
        client.invoke("api_bf_add_subtitle", selectedbfaccount, bfNewDatasetName.value, inputSubtitle,
        (error, res) => {
        if(error) {
          log.error(error)
          var emessage = userError(error)
          bfCreateNewDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
          bfCreateNewDatasetBtn.disabled = false
        } else {
          bfCreateNewDatasetStatus.innerHTML = 'Success: created dataset' + " '" + bfNewDatasetName.value + "'" + smileyCan
          refreshAllBfDatasetLists()
          currentDatasetPermission.innerHTML = ''
          bfCreateNewDatasetBtn.disabled = false
        }
      })
    }
  })
})

// Submit dataset to bf
bfSubmitDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-manage-dataset").innerHTML = "Please wait..."
  document.getElementById("para-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-progress-bar-status").innerHTML = ""
  var err = false
  bfSubmitDatasetBtn.disabled = true
  var completionStatus = 'Solving'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedbfdataset = bfDatasetList.options[bfDatasetList.selectedIndex].text
  client.invoke("api_bf_submit_dataset", selectedbfaccount, selectedbfdataset, pathSubmitDataset.value, (error, res) => {
    if (error) {
      document.getElementById("para-please-wait-manage-dataset").innerHTML = ""
      log.error(error)
      var emessage = userError(error)
      document.getElementById("para-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
      progressUploadBf.style.display = "none"
      progressBarUploadBf.value = 0
      err = true
    } else {
      document.getElementById("para-please-wait-manage-dataset").innerHTML = "Please wait..."
      progressUploadBf.style.display = "block"
      console.log('Started uploading')
    }
  })

  var countDone = 0
  var timerProgress = setInterval(progressfunction, 1000)
    function progressfunction(){
      client.invoke("api_submit_dataset_progress", (error, res) => {
        if(error) {
          var emessage = userError(error)
          document.getElementById("para-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
          log.error(error)
        } else {
          var dataProgress = res[0]
          completionStatus = res[1]
          var uploadedFileSize = res[3]
          var totalFileSize = res[4]
          var value = (uploadedFileSize / totalFileSize) * 100
          progressBarUploadBf.value = value
          if (completionStatus != 'Done') {
            document.getElementById("para-progress-bar-status").innerHTML = dataProgress + 'Progress: ' + value.toFixed(2) + '%'
          }
        }
      })
      if (completionStatus === 'Done'){
        countDone++
        if (countDone > 1){
          console.log('Done uploading')
          if (!err){
            progressBarUploadBf.value = 100
            document.getElementById("para-progress-bar-status").innerHTML = "Upload completed!" + smileyCan
            document.getElementById("para-please-wait-manage-dataset").innerHTML = ""
          }
          clearInterval(timerProgress)
          bfSubmitDatasetBtn.disabled = false
        }
      }
    }
})


/**
 * This event tracks change of the selected dataset in the dropdown list
 * under the "Add metadata to Blackfynn dataset" feature
 */
bfDatasetListMetadata.addEventListener('change', () => {
  bfCurrentMetadataProgress.style.display = 'block'
  datasetSubtitleStatus.innerHTML = ''
  datasetLicenseStatus.innerHTML = ''
  bfDatasetSubtitle.value = ''
  datasetDescriptionStatus.innerHTML = ''
  datasetBannerImageStatus.innerHTML = ''
  showCurrentSubtitle()
  showCurrentDescription()
  showCurrentBannerImage()
  showCurrentLicense()
})


bfAddSubtitleBtn.addEventListener('click', () => {
  bfCurrentMetadataProgress.style.display = 'block'
  datasetSubtitleStatus.innerHTML = 'Please wait...'
  disableform(bfMetadataForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  var inputSubtitle = bfDatasetSubtitle.value
  client.invoke("api_bf_add_subtitle", selectedBfAccount, selectedBfDataset, inputSubtitle,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetSubtitleStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentMetadataProgress.style.display = 'none'
      enableform(bfMetadataForm)
    } else {
      datasetSubtitleStatus.innerHTML = res
      bfCurrentMetadataProgress.style.display = 'none'
      enableform(bfMetadataForm)
    }
  })
})

bfAddDescriptionBtn.addEventListener('click', () => {
  bfCurrentMetadataProgress.style.display = 'block'
  datasetDescriptionStatus.innerHTML = "Please wait..."
  disableform(bfMetadataForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  var markdownDescription = tuiInstance.getMarkdown()
  client.invoke("api_bf_add_description", selectedBfAccount, selectedBfDataset, markdownDescription,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetDescriptionStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentMetadataProgress.style.display = 'none'
      enableform(bfMetadataForm)
    } else {
      datasetDescriptionStatus.innerHTML = res
      bfCurrentMetadataProgress.style.display = 'none'
      enableform(bfMetadataForm)
    }
  })
})


const Cropper = require('cropperjs')
var cropOptions = {
  aspectRatio: 1,
  movable: false,
   // Enable to rotate the image
  rotatable: false,
  // Enable to scale the image
  scalable: false,
  // Enable to zoom the image
  zoomable: false,
  // Enable to zoom the image by dragging touch
  zoomOnTouch: false,
  // Enable to zoom the image by wheeling mouse
  zoomOnWheel: false,
  preview: '.preview',
  viewMode: 1,
  crop: function(e) {
      var data = e.detail;
      formBannerHeight.value = Math.round(data.height)
      formBannerWidth.value = Math.round(data.width)
  }
  // ready() {
  //   console.log('ready')
  //   console.log(myCropper.getCanvasData().height)
  //   document.getElementById('banner-preview').style.height = String(myCropper.getCanvasData().height) + 'px'
  //   console.log(document.getElementById('banner-preview').style.height)
  //   console.log(String(myCropper.getCanvasData().height) + 'px')
  // }
  // minCanvasWidth: 0,
  // minCanvasHeight: 0,
  /*minContainerWidth: 400,
  minContainerHeight: 400,*/
}

var imageExtension

var myCropper = new Cropper(bfViewImportedImage, cropOptions)
// Action when user click on "Import image" button for banner image
bfImportBannerImageBtn.addEventListener('click', (event) => {
  datasetBannerImageStatus.innerHTML = ""
  ipcRenderer.send('open-file-dialog-import-banner-image')
})
ipcRenderer.on('selected-banner-image', (event, path) => {
  if (path.length > 0){
    datasetBannerImagePath.innerHTML = path
    imageExtension = path[0].split('.').pop()
    bfViewImportedImage.src = path[0]
    myCropper.destroy()
    myCropper = new Cropper(bfViewImportedImage, cropOptions)
    }
  })

bfSaveBannerImageBtn.addEventListener('click', (event) => {
  datasetBannerImageStatus.innerHTML = ""
  if (bfViewImportedImage.src.length > 0){
    if (formBannerHeight.value>1023 && formBannerWidth.value>1023){
      bfCurrentMetadataProgress.style.display = 'block'
      datasetBannerImageStatus.innerHTML = 'Please wait...'
      disableform(bfMetadataForm)

      //Save cropped image locally and check size
      var imageFolder = path.join(homeDirectory, 'SODA', 'banner-image')
      if (!fs.existsSync(imageFolder)){
        fs.mkdirSync(imageFolder)
      }
      if (imageExtension == 'png'){
        var imageType = 'image/png'
      } else {
        var imageType = 'image/jpeg'
      }
      var imagePath = path.join(imageFolder, 'banner-image-SODA.' + imageExtension)
      var croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType)
      imageDataURI.outputFile(croppedImageDataURI, imagePath).then( function() {
        if(fs.statSync(imagePath)["size"] < 5*1024*1024) {
          var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
          var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
          client.invoke("api_bf_add_banner_image", selectedBfAccount, selectedBfDataset, imagePath, (error, res) => {
            if(error) {
              log.error(error)
              var emessage = userError(error)
              datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
              bfCurrentMetadataProgress.style.display = 'none'
              enableform(bfMetadataForm)
            } else {
              datasetBannerImageStatus.innerHTML = res
              showCurrentBannerImage()
              bfCurrentMetadataProgress.style.display = 'none'
              enableform(bfMetadataForm)
            }
          })
        } else {
          datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + "Final image size must be less than 5 MB" + "</span>"
        }
      }
      )
    } else {
      datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + "Height and width of selected area must be at least 1024 px" + "</span>"
    }
  } else {
    datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + "Please import an image first" + "</span>"
  }
})

bfAddLicenseBtn.addEventListener('click', () => {
  bfCurrentMetadataProgress.style.display = 'block'
  datasetLicenseStatus.innerHTML = 'Please wait...'
  disableform(bfMetadataForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  /*var selectedLicense = bfListLicense.options[bfListLicense.selectedIndex].text*/
  var selectedLicense = 'Creative Commons Attribution'
  client.invoke("api_bf_add_license", selectedBfAccount, selectedBfDataset, selectedLicense,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetLicenseStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentMetadataProgress.style.display = 'none'
      enableform(bfMetadataForm)
    } else {
      datasetLicenseStatus.innerHTML = res
      showCurrentLicense()
      enableform(bfMetadataForm)
    }
  })
})

/**
 * This event tracks change of the selected dataset in the dropdown list
 * under the "Manage dataset permission" feature
 */
bfDatasetListPermission.addEventListener('change', () => {
  bfCurrentPermissionProgress.style.display = 'block'
  showCurrentPermission()
})

/**
 * This event listener make PI owener of the selected dataset
 * when user clicks on the "Make PI owner"  button
 */
bfAddPermissionPIBtn.addEventListener('click', () => {
  datasetPermissionStatusPI.innerHTML = ''
  bfCurrentPermissionProgress.style.display = 'block'
  ipcRenderer.send('warning-add-permission-owner-PI')
})
ipcRenderer.on('warning-add-permission-owner-selection-PI', (event, index) => {
  datasetPermissionStatusPI.innerHTML = ''
  disableform(bfPermissionForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedUser = bfListUsersPI.options[bfListUsersPI.selectedIndex].text
  var selectedRole = 'owner'
  if (index === 0) {
    client.invoke("api_bf_add_permission", selectedBfAccount, selectedBfDataset, selectedUser, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetPermissionStatusPI.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentPermissionProgress.style.display = 'none'
      enableform(bfPermissionForm)
    } else {
      datasetPermissionStatusPI.innerHTML = res
      showCurrentPermission()
      enableform(bfPermissionForm)
    }
  })
  } else {
    bfCurrentPermissionProgress.style.display = 'none'
    enableform(bfPermissionForm)
  }
})

/**
 * This event listener add 'manager' permission for the Curation Team
 * when user clicks on the "Share with Curation Team"  button
 */
bfAddPermissionCurationTeamBtn.addEventListener('click', () => {
  datasetPermissionStatusCurationTeam.innerHTML = ''
  bfCurrentPermissionProgress.style.display = 'block'
  disableform(bfPermissionForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedTeam = 'SPARC Data Curation Team'
  var selectedRole = 'manager'
  client.invoke("api_bf_add_permission_team", selectedBfAccount, selectedBfDataset, selectedTeam, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetPermissionStatusCurationTeam.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentPermissionProgress.style.display = 'none'
      enableform(bfPermissionForm)
    } else {
      datasetPermissionStatusCurationTeam.innerHTML = 'Shared with Curation Team'
      showCurrentPermission()
      enableform(bfPermissionForm)
    }
  })
})


/**
 * This event listener add permission to the selected dataset
 * when user clicks on the "Add permission for user"  button
 */
bfAddPermissionBtn.addEventListener('click', () => {
  datasetPermissionStatus.innerHTML = ''
  bfCurrentPermissionProgress.style.display = 'block'
  disableform(bfPermissionForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedUser = bfListUsers.options[bfListUsers.selectedIndex].text
  var selectedRole = bfListRoles.options[bfListRoles.selectedIndex].text
  if (selectedRole === 'owner'){
    ipcRenderer.send('warning-add-permission-owner')
  } else {
    addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole)
  }
})
ipcRenderer.on('warning-add-permission-owner-selection', (event, index) => {
  datasetPermissionStatus.innerHTML = ''
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedUser = bfListUsers.options[bfListUsers.selectedIndex].text
  var selectedRole = bfListRoles.options[bfListRoles.selectedIndex].text
  if (index === 0) {
    addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole)
  } else {
    bfCurrentPermissionProgress.style.display = 'none'
    enableform(bfPermissionForm)
  }
})


/**
 * This event listener add permission to the selected dataset
 * when user clicks on the "Add permission for team"  button
 */
bfAddPermissionTeamBtn.addEventListener('click', () => {
  datasetPermissionStatusTeam.innerHTML = ''
  bfCurrentPermissionProgress.style.display = 'block'
  disableform(bfPermissionForm)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  var selectedTeam = bfListTeams.options[bfListTeams.selectedIndex].text
  var selectedRole = bfListRolesTeam.options[bfListRolesTeam.selectedIndex].text
  client.invoke("api_bf_add_permission_team", selectedBfAccount, selectedBfDataset, selectedTeam, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetPermissionStatusTeam.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentPermissionProgress.style.display = 'none'
      enableform(bfPermissionForm)
    } else {
      datasetPermissionStatusTeam.innerHTML = res
      showCurrentPermission()
      enableform(bfPermissionForm)
    }
  })
})

// // // // // // // // // //
// Helper functions
// // // // // // // // // //

function refreshBfDatasetList(bfdstlist, bfAccountList){
  removeOptions(bfdstlist)
  var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text
  if (accountSelected === "Select"){
    var optionSelect = document.createElement("option")
    optionSelect.textContent = 'Select dataset'
    bfdstlist.appendChild(optionSelect)
  } else {
    client.invoke("api_bf_dataset_account", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
      if(error) {
        log.error(error)
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

function refreshAllBfDatasetLists(){
    removeOptions(bfDatasetList)
    removeOptions(bfDatasetListMetadata)
    removeOptions(bfDatasetListPermission)
    removeOptions(bfUploadDatasetList)
    var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text
    if (accountSelected === "Select"){
      var optionSelect = document.createElement("option")
      optionSelect.textContent = 'Select dataset'
      bfDatasetList.appendChild(optionSelect)
      var option2 = optionSelect.cloneNode(true)
      var option3 = optionSelect.cloneNode(true)
      var option4 = optionSelect.cloneNode(true)
      bfDatasetListMetadata.appendChild(option2)
      bfDatasetListPermission.appendChild(option3)
      bfUploadDatasetList.appendChild(option4)
    } else {
      client.invoke("api_bf_dataset_account", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
        if(error) {
          log.error(error)
        } else {
          for (myitem in res){
            var myitemselect = res[myitem]
            var option = document.createElement("option")
            option.textContent = myitemselect
            option.value = myitemselect
            bfDatasetList.appendChild(option)
            var option2 = option.cloneNode(true)
            var option3 = option.cloneNode(true)
            var option4 = option.cloneNode(true)
            bfDatasetListMetadata.appendChild(option2)
            bfDatasetListPermission.appendChild(option3)
            bfUploadDatasetList.appendChild(option4)

        }
      }
    })
    }
}

function showCurrentSubtitle(){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentMetadataProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_subtitle", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
      } else {
        bfDatasetSubtitle.value = res
      }
    })
  }
}

function showCurrentDescription(){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentMetadataProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_description", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
      } else {
        tuiInstance.setMarkdown(res)
      }
    })
  }
}

function showCurrentBannerImage(){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentMetadataProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_banner_image", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
      } else {
        if (res === 'No banner image'){
          bfCurrentBannerImg.src = 'assets/img/no-banner-image.png'
        }
        else {
          bfCurrentBannerImg.src = res
        }
      }
    })
  }
}

function showCurrentLicense(){
  currentDatasetLicense.innerHTML = "Please wait..."
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    currentDatasetLicense.innerHTML = ''
    bfCurrentMetadataProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_license", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        bfCurrentMetadataProgress.style.display = 'none'
      } else {
        currentDatasetLicense.innerHTML = res
        bfCurrentMetadataProgress.style.display = 'none'
      }
    })
  }
}


/**
 * refreshBfUsersList is a function that refreshes the dropdown list
 * with names of users when an Blackfynn account is selected
 */
function refreshBfUsersList(){
  var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text

  removeOptions(bfListUsers)
  var optionUser = document.createElement("option")
  optionUser.textContent = 'Select user'
  bfListUsers.appendChild(optionUser)

  removeOptions(bfListUsersPI)
  var optionUserPI = document.createElement("option")
  optionUserPI.textContent = 'Select PI'
  bfListUsersPI.appendChild(optionUserPI)

  if (accountSelected !== "Select") {
    client.invoke("api_bf_get_users", accountSelected, (error, res) => {
      if (error){
        log.error(error)
      } else{
        for ( var myItem in res){
          var myUser = res[myItem]
          var optionUser = document.createElement("option")
          optionUser.textContent = myUser
          optionUser.value = myUser
          bfListUsers.appendChild(optionUser)
          var optionUser2 = optionUser.cloneNode(true)
          bfListUsersPI.appendChild(optionUser2)
        }
      }
    })
  }
}

/**
 * refreshBfTeamsList is a function that refreshes the dropdown list
 * with names of teams when an Blackfynn account is selected
 */
function refreshBfTeamsList(teamList){
  removeOptions(teamList)
  var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text
  var optionTeam = document.createElement("option")
  optionTeam.textContent = 'Select team'
  teamList.appendChild(optionTeam)
  if (accountSelected !== "Select") {
    client.invoke("api_bf_get_teams", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
      if (error){
        log.error(error)
      } else{
        for ( var myItem in res){
          var myTeam = res[myItem]
          var optionTeam = document.createElement("option")
          optionTeam.textContent = myTeam
          optionTeam.value = myTeam
          teamList.appendChild(optionTeam)
        }
      }
    })
  }
}

function showCurrentPermission(){
  currentDatasetPermission.innerHTML = "Please wait..."
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPermission.options[bfdatasetlist_permission.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    currentDatasetPermission.innerHTML = ''
    bfCurrentPermissionProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_permission", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        bfCurrentPermissionProgress.style.display = 'none'
      } else {
        var permissionList = ''
        for (var i in res){
          permissionList = permissionList + res[i] + '<br>'
        }
        currentDatasetPermission.innerHTML = permissionList
        bfCurrentPermissionProgress.style.display = 'none'
      }
    })
  }
}

function showAccountDetails(bfLoadAccount){
  client.invoke("api_bf_account_details", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      bfLoadAccount.style.display = 'none'
    } else {
      bfSelectAccountStatus.innerHTML = res;
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
      bfLoadAccount.style.display = 'none'
    }
  })
}

function showUploadAccountDetails(bfLoadAccount){
  client.invoke("api_bf_account_details", bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      bfLoadAccount.style.display = 'none'
    } else {
      bfUploadSelectAccountStatus.innerHTML = res;
      bfLoadAccount.style.display = 'none'
    }
  })
}


// // // // // // // // // //
// Helper Functions
// // // // // // // // // //

function userError(error)
{
  var myerror = error.message
  return myerror
}

client.invoke("api_bf_default_account_load", (error, res) => {
  if(error) {
    log.error(error)
  } else {
      if (res.length > 0) {
        var myitemselect = res[0]
        var option = document.createElement("option")
        option.textContent = myitemselect
        option.value = myitemselect
        var option2 = option.cloneNode(true)
        removeOptions(bfAccountList)
        bfAccountList.appendChild(option)
        removeOptions(bfUploadAccountList)
        bfUploadAccountList.appendChild(option2)
        showAccountDetails(bfAccountLoadProgress)
        bfAccountLoadProgress.style.display = 'block'
        refreshAllBfDatasetLists()
        refreshBfUsersList()
        refreshBfTeamsList(bfListTeams)
    } else {
        var myitemselect = "Select"
        var option = document.createElement("option")
        option.textContent = myitemselect
        option.value = myitemselect
        bfAccountList.appendChild(option)
        var selectedbfaccount = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
    }
  }
})

function updateBfAccountList(){
  removeOptions(bfAccountList)
  removeOptions(bfUploadAccountList)
  client.invoke("api_bf_account_list", (error, res) => {
  if(error) {
    log.error(error)
  } else {
      for (myitem in res){
        var myitemselect = res[myitem]
        var option = document.createElement("option")
        option.textContent = myitemselect
        option.value = myitemselect
        bfAccountList.appendChild(option)
        bfSelectAccountStatus.innerHTML = ""
        bfAccountLoadProgress.style.display = 'none'
        var option2 = option.cloneNode(true)
        bfUploadAccountList.appendChild(option2)
        bfUploadSelectAccountStatus.innerHTML = ""
        bfAccountLoadProgressCurate.style.display = 'none'
      }
    }
    if (res[0] === "Select" && res.length === 1) {
      bfSelectAccountStatus.innerHTML = "No existing accounts to switch. Please add a new account!"
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
    }

    refreshAllBfDatasetLists()
    refreshBfUsersList()
    refreshBfTeamsList(bfListTeams)
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

function clearStrings() {
  document.getElementById("para-preview-organization-status").innerHTML = ""
  document.getElementById("para-save-file-organization-status").innerHTML = ""
  document.getElementById("para-upload-file-organization-status").innerHTML = ""
  document.getElementById("para-preview-organization-status-metadata").innerHTML = ""
  document.getElementById("para-selected-dataset").innerHTML = ""
}

function clearPermissionsStrings() {
  document.getElementById("para-preview-organization-status").innerHTML = ""
  document.getElementById("para-save-file-organization-status").innerHTML = ""
  document.getElementById("para-upload-file-organization-status").innerHTML = ""
  document.getElementById("para-selected-dataset").innerHTML = ""
}


// // // // // // // // // //
// Helper Functions: Organize dataset
// // // // // // // // // //

// Dataset Organized
function checkFolderStruture(pathDatasetFolder){
  var files = fs.readdirSync(pathDatasetFolder)
  var folders = []
  if (files.length < 1) {
    return false
  } else {
    for (var i = 0; i<files.length; i++) {
      var filename = files[i]
      var filepath = path.join(pathDatasetFolder, filename)
      if (fs.lstatSync(filepath).isDirectory()){
        folders.push(filename)
      }
    }
    //if (folders.length != sparcFolderNames.length)
    //      return false
    var folderSorted = folders.sort()
    // var sparcFolderSorted = sparcFolderNames.sort()
    for (var i = 0; i < folderSorted.length; i++) {
      //if (folderSorted[i] != sparcFolderSorted[i]) {
      if (!sparcFolderNames.includes(folderSorted[i])) {
        return false
      }
    }
    return true
  }
}

function organizedFolderToJson(pathDatasetVal){
  var jsonvar = {}
  var files = fs.readdirSync(pathDatasetVal)
  for (var i = 0; i<files.length; i++) {
    var filename = files[i]
    var filepath = path.join(pathDatasetVal, filename)
    if (fs.lstatSync(filepath).isDirectory()){
      var filesInFolder = fs.readdirSync(filepath)
      filesInFolder = filesInFolder.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
      var folderfiles = []
      for (var j = 0; j<filesInFolder.length; j++) {
        var fileNameInFolder = filesInFolder[j]
        folderfiles.push(path.join(filepath, fileNameInFolder))
      }
      jsonvar[filename] = folderfiles
    }
  }
  return jsonvar
}

function jsonToTableOrganized(table, jsonvar){
  var keyvect = Object.keys(jsonvar)
  for (var j = 0; j < keyvect.length; j++) {
    let SPARCfolder = keyvect[j]
    var SPARCfolderid = SPARCfolder + '_org'
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var pathlist = jsonvar[SPARCfolder]
    if (pathlist.length !== 0){
      var myheader = tableOrganized.rows[rowcount].cells[0]
      if (myheader.className === "table-header"){
        myheader.className = "table-header openfolder"
      }
    }
    for (var i = 0; i < pathlist.length; i++){
      tableOrganizedCount = tableOrganizedCount + 1
      var rownum = rowcount + i + 1
      var table_len = tableOrganizedCount
      if (fs.lstatSync(pathlist[i]).isDirectory()) {
        var row = table.insertRow(rownum).outerHTML="<tr id='row-org"+table_len+"'style='color: #000000;'><td id='name_row_org"+table_len+"'>"+ pathlist[i] +"</td> <td id='description_row_org"+table_len+"'>"+ "" +"</td> <td> </td></tr>";
      } else {
      var row = table.insertRow(rownum).outerHTML="<tr id='row-org"+table_len+"'style='color: #000000;'><td id='name_row_org"+table_len+"'>"+ pathlist[i] +"</td> <td id='description_row_org"+table_len+"'>"+ "" +"</td> <td><input type='button' id='edit_button_org"+table_len+"' value='Edit description' class='edit' onclick='edit_row_org("+table_len+")'> <input type='button' id='save_button_org"+table_len+"' value='Save description' class='save' onclick='save_row_org("+table_len+")'> </td></tr>";
      }
    }
  }
  return table
}

function tableToJsonWithDescriptionOrganized(table){
  var jsonvar = {}
  var jsonvardescription= {}

  var pathlist = new Array()
  var descriptionList = new Array()

  var keyval = "code"

  var tableheaders = sparcFolderNames.slice()
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    var descriptionname = row.cells[1].innerHTML
    if (tableheaders.includes(pathname)) {
      jsonvar[keyval] = pathlist
      jsonvardescription[keyval + "_description"] = descriptionList
      keyval = pathname
      var pathlist = new Array()
      var descriptionList = new Array()
    } else {
      pathlist.push(row.cells[0].innerHTML)
      descriptionList.push(row.cells[1].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  jsonvardescription[keyval+ "_description"] = descriptionList

  return [jsonvar, jsonvardescription]
}

// Daaset not organized
function insertFileToTable(table, path){
  var i
  let SPARCfolder = document.querySelector('#SPARCfolderlist').value
  var rowcount = document.getElementById(SPARCfolder).rowIndex
  var jsonvar = tableToJson(table)
  var emessage = ''
  var count = 0
  for (i = 0; i < path.length; i++) {
      if ( jsonvar[SPARCfolder].indexOf(path[i]) > -1 ) {
        emessage = emessage + path[i] + ' already added to ' + SPARCfolder + "\n"
        count += 1
      }
  }
  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
    var myheader = tableNotOrganized.rows[rowcount].cells[0]
    if (myheader.className === "table-header"){
      myheader.className = "table-header openfolder"
    }
    var r = rowcount + 1
    while ((row = tableNotOrganized.rows[r]) && !/\bparent\b/.test(row.className)){
      if (/\bopen\b/.test(row.className))
         row.className = row.className.replace(/\bopen\b/," ")
      r += 1
    }
    for (i = 0; i < path.length; i++) {
      tableNotOrganizedCount = tableNotOrganizedCount + 1
      var table_len=tableNotOrganizedCount
      var rownum = rowcount + i + 1
      if (fs.lstatSync(path[i]).isDirectory()) {
        var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ path[i]+"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
      } else {
        var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ path[i]+"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
      }
    }
    return table
  }
}

function insertFileToMetadataTable(table, path){
  var i
  var rowcount = 0
  var jsonvar = tableToJsonMetadata(table)
  var emessage = ''
  var count = 0
  var SPARCfolder = 'metadata'
  for (i = 0; i < path.length; i++) {
      if ( jsonvar[SPARCfolder].indexOf(path[i]) > -1 ) {
        emessage = emessage + path[i] + ' already added to ' + SPARCfolder + "\n"
        count += 1
      }
  }
  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
    var myheader = tableNotOrganized.rows[rowcount].cells[0]
    for (i = 0; i < path.length; i++) {
      tableMetadataCount = tableMetadataCount + 1
      var table_len= tableMetadataCount
      var rownum = rowcount + i + 1
      var row = table.insertRow(rownum).outerHTML="<tr id='row_metadata"+table_len+"'style='color: #000000;'><td id='name_row_metadata"+table_len+"'>"+ path[i] +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row_metadata("+table_len+")'></td></tr>";
      }
    }
    return table
  }


function tableToJson(table){
  var jsonvar = {}
  var pathlist = new Array()
  var keyval = "code"
  var tableheaders = sparcFolderNames.slice()
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

function tableToJsonMetadata(table){
  var jsonvar = {}
  var pathlist = new Array()
  var keyval = "metadata"
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    if (pathname !== keyval) {
      pathlist.push(row.cells[0].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  return jsonvar
}

function jsonToTableWithDescription(table, jsonvar){
  var keyvect = Object.keys(jsonvar)
  var tableheaders = sparcFolderNames.slice()
  for (var j = 0; j < tableheaders.length; j++) {
    let SPARCfolder = tableheaders[j]
    var SPARCfolderid = SPARCfolder
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var pathlist = jsonvar[SPARCfolder]
    var descriptionList = jsonvar[SPARCfolder + "_description"]
    for (var i = 0; i < pathlist.length; i++){
      var countDouble  = 0
      for (var r = 0, row; row = table.rows[r]; r++) {
        if (pathlist[i] === row.cells[0].innerHTML){
          countDouble += 1
        }
      }
      if (pathlist[i] !== "" &&  countDouble === 0) {
        var myheader = tableNotOrganized.rows[rowcount].cells[0]
        if (myheader.className === "table-header"){
          myheader.className = "table-header openfolder"
        }
        var r = rowcount + 1
        while ((row = tableNotOrganized.rows[r]) && !/\bparent\b/.test(row.className)){
          if (/\bopen\b/.test(row.className))
            row.className = row.className.replace(/\bopen\b/," ")
            r += 1
        }
	      var rownum = rowcount + i + 1
	      tableNotOrganizedCount = tableNotOrganizedCount + 1
	      var table_len = tableNotOrganizedCount
        if (fs.lstatSync(pathlist[i]).isDirectory()) {
  	      var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"' style='color: #000000;'><td id='name_row"+table_len+"'>"+ pathlist[i] + "</td><td id='description_row"+table_len+"'>"+ descriptionList[i] +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
        } else {
          var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"' style='color: #000000;'><td id='name_row"+table_len+"'>"+ pathlist[i] + "</td><td id='description_row"+table_len+"'>"+ descriptionList[i] +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
        }
       }
    }
  }
  return table
}

function tableToJsonWithDescription(table){
  var jsonvar = {}
  var jsonvardescription= {}

  var pathlist = new Array()
  var descriptionList = new Array()

  var keyval = "code"
  if (table === tableOrganized){
    keyval = keyval + "_org"
  }
  var tableheaders = sparcFolderNames.slice()
  for (var i = 1, row; row = table.rows[i]; i++) {
    var pathname = row.cells[0].innerHTML
    var descriptionname = row.cells[1].innerHTML
    if (tableheaders.includes(pathname)) {
      jsonvar[keyval] = pathlist
      jsonvardescription[keyval + "_description"] = descriptionList
      keyval = pathname
      if (table === tableOrganized){
      keyval = keyval + "_org"
    }
      var pathlist = new Array()
      var descriptionList = new Array()
    } else {
      pathlist.push(row.cells[0].innerHTML)
      descriptionList.push(row.cells[1].innerHTML)
    }
  }
  jsonvar[keyval] = pathlist
  jsonvardescription[keyval+ "_description"] = descriptionList

  return [jsonvar, jsonvardescription]
}

function dropAddToTable(e, myID){
  e.target.style.color = 'inherit';
  e.target.style.backgroundColor = '';
	var rowcount = document.getElementById(myID).rowIndex
	var i = 0
  var jsonvar = tableToJson(tableNotOrganized)
  var emessage = ''
  var count = 0
  for (let f of e.dataTransfer.files) {
      if ( jsonvar[myID].indexOf(f.path) > -1 ) {
        emessage = emessage + f.path + ' already added to ' + myID + "\n"
        count += 1
      }
  }
  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
    var myheader = tableNotOrganized.rows[rowcount].cells[0]
    if (myheader.className === "table-header"){
      myheader.className = "table-header openfolder"
    }
    var r = rowcount + 1
    while ((row = tableNotOrganized.rows[r]) && !/\bparent\b/.test(row.className)){
      if (/\bopen\b/.test(row.className))
         row.className = row.className.replace(/\bopen\b/," ")
      r += 1
    }
  	for (let f of e.dataTransfer.files) {
          var rownum = rowcount + i + 1
  	    tableNotOrganizedCount = tableNotOrganizedCount + 1
  	    var table_len = tableNotOrganizedCount
        if (fs.lstatSync(f.path).isDirectory()) {
    	    var row = tableNotOrganized.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ f.path +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
        } else {
          var row = tableNotOrganized.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ f.path +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
        }
       	i = i + 1
      }
  }
}

function dropAddToTableMetadata(e, myID){
  e.target.style.color = 'inherit';
  e.target.style.backgroundColor = '';
  var rowcount = document.getElementById(myID).rowIndex
  var i = 0
  var jsonvar = tableToJsonMetadata(tableMetadata)
  var emessage = ''
  var emessage2 = ''
  var count = 0
  var count2 = 0
  for (let f of e.dataTransfer.files) {
    if ( jsonvar[myID].indexOf(f.path) > -1 ) {
      emessage = emessage + f.path + ' already added to ' + myID + "\n"
      count += 1
    }
    var validFormat = ['.csv', '.xlsx', '.xls']
    if (validFormat.indexOf(path.extname(f.path)) === -1 ) {
      emessage2 = emessage2 + f.path + ' is not a csv or xslx file ' + "\n"
      count2 += 1
    }
  }
  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else {
    for (let f of e.dataTransfer.files) {
      var rownum = rowcount + i + 1
      tableMetadataCount = tableMetadataCount + 1
      var table_len = tableMetadataCount
      var row = tableMetadata.insertRow(rownum).outerHTML="<tr id='row_metadata"+table_len+"'style='color: #000000;'><td id='name_row_metadata"+table_len+"'>"+ f.path +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row_metadata("+table_len+")'></td></tr>";
      i = i + 1
    }
  }
}

//Both organized and not organized options
function clearTable(table){
  var keyvect = sparcFolderNames.slice()
  clearStrings()
  for (var j = 0; j < keyvect.length; j++) {
    var SPARCfolderid = keyvect[j]
    if (table == tableOrganized){
      SPARCfolderid = SPARCfolderid + "_org"
    }
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var myheader = table.rows[rowcount].cells[0]
    if (myheader.className === "table-header openfolder"){
      myheader.className = "table-header"
    }
  }
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


function addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole){
  client.invoke("api_bf_add_permission", selectedBfAccount, selectedBfDataset, selectedUser, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      var emessage = userError(error)
      datasetPermissionStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfCurrentPermissionProgress.style.display = 'none'
      enableform(bfPermissionForm)
    } else {
      datasetPermissionStatus.innerHTML = res
      showCurrentPermission()
      enableform(bfPermissionForm)
    }
  })
}
