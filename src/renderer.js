//////////////////////////////////
// Import required modules
//////////////////////////////////

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
require('v8-compile-cache')

//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////
let client = new zerorpc.Client({ timeout: 300000})
client.connect("tcp://127.0.0.1:4242")
client.invoke("echo", "server ready", (error, res) => {
  if(error || res !== 'server ready') {
    log.error(error)
    console.error(error)
  } else {
    console.log("Connected to Python back-end successfully")
    log.info("Connected to Python back-end successfully")
  }
})

//////////////////////////////////
// App launch actions
//////////////////////////////////

// Log file settings //
log.transports.console.level = false
log.transports.file.maxSize = 1024*1024*10
var homeDirectory = app.getPath('home')

// Check default radio buttons //
document.getElementById("selectAccount").click()
document.getElementById("add-edit-subtitle").click()
document.getElementById("pi-owner").click()
document.getElementById("cloud-dataset").click()
document.getElementById("organize-dataset").click()

//log user's OS version //
log.info("User OS:", os.type(), os.platform(), "version:", os.release())
console.log("User OS:", os.type(), os.platform(), "version:", os.release())

// Check current app version //
const appVersion = window.require('electron').remote.app.getVersion()
log.info("Current SODA version:", appVersion)
console.log("Current SODA version:", appVersion)

//check user's internet connection abd connect to default Blackfynn account //
require('dns').resolve('www.google.com', function(err) {
  if (err) {
     console.error("No internet connection");
     log.error("No internet connection")
     ipcRenderer.send('warning-no-internet-connection')
  } else {
     console.log("Connected to the internet");
     log.info("Connected to the internet")
     //Check new app version
     checkNewAppVersion()
     //Load Default/global blackfynn account if available
     loadDefaultAccount()
  }
});

// Check lasted app version and warn if newer available //
function checkNewAppVersion() {
  const axios = require('axios');
  const url = 'https://github.com/bvhpatel/SODA';
  axios.get(url)
    .then(response => {
      var str = response.data
      var firstvariable = "Latest version: "
      var secondvariable = "<"
      var scrappedVersion = str.match(new RegExp(firstvariable + "(.*)" + secondvariable))[1]
      log.info("Latest SODA version:", scrappedVersion)
      console.log("Latest SODA version:", scrappedVersion)

      if (appVersion !== scrappedVersion){
        ipcRenderer.send('warning-new-version')
      }
    })
    .catch(error => {
      log.error(error);
      console.error(error)
    })
}

//////////////////////////////////
// Get html elements from UI 
//////////////////////////////////

// Navigator button //
const buttonSidebar = document.getElementById("button-hamburger")
const buttonSidebarIcon = document.getElementById("button-soda-icon")
const buttonSidebarBigIcon = document.getElementById("button-soda-big-icon")

// Metadata Templates //
const downloadSubmission = document.getElementById("a-submission")
const downloadSamples = document.getElementById("a-samples")
const downloadSubjects = document.getElementById("a-subjects")
const downloadDescription = document.getElementById("a-description")
const downloadManifest = document.getElementById("a-manifest")
const homedir = os.homedir()
const userDownloadFolder = path.join(homedir, "Downloads")

// Organize dataset //
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
const tableMetadata = document.getElementById("metadata-table")
let tableMetadataCount = 0
const previewProgressBar = document.getElementById("div-dataset-preview-progress")
const previewMetadataProgressBar = document.getElementById("div-metadata-preview-progress")
const selectSaveFileOrganizationMetadataBtn = document.getElementById('button-select-save-file-organization-metadata')

// Generate dataset //
const createNewStatus = document.querySelector('#create-newdataset')
const modifyExistingStatus = document.querySelector('#existing-dataset')
const bfUploadDirectlyStatus = document.querySelector('#cloud-dataset')
const pathNewDataset = document.querySelector('#selected-new-dataset')
const newDatasetName = document.querySelector('#new-dataset-name')
const manifestStatus = document.querySelector('#generate-manifest')
const curationForm = document.querySelector('#dataset-curate-form')
const progressBarCurate = document.getElementById("progress-bar-curate")
const progressCurateUpload = document.getElementById("div-curate-progress")
const curateDatasetBtn = document.getElementById('button-curate-dataset')
const bfUploadDatasetBtn = document.getElementById('button-upload-dataset')

// Manage datasets //
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

// Blackfynn dataset metadata //
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
const currentDatasetLicense = document.querySelector('#para-dataset-license-current')
const bfListLicense = document.querySelector('#bf-license-list')
const bfAddLicenseBtn = document.getElementById('button-add-license')
const datasetLicenseStatus = document.querySelector('#para-dataset-license-status')

// Blackfynn dataset permission //
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

//Blackfynn dataset status
const bfDatasetListDatasetStatus = document.querySelector('#bfdatasetlist_dataset_status')
const bfCurrentDatasetStatusProgress = document.querySelector('#div-bf-current-dataset-status-progress')
const bfListDatasetStatus = document.querySelector('#bf_list_dataset_status')
const datasetStatusStatus = document.querySelector('#para-dataset-status-status')
const bfRefreshDatasetStatusBtn = document.getElementById('button-refresh-dataset-status')
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

// Sidebar Navigation //
var open = false
function openSidebar(buttonElement) {
  if (!open) {
    ipcRenderer.send('resize-window', 'up')
    document.getElementById("main-nav").style.width = "250px";
    document.getElementById("SODA-logo").style.display = "block";
    buttonSidebarIcon.style.display = "none"
    open = true;
  } else {
    ipcRenderer.send('resize-window', 'down')
    document.getElementById("main-nav").style.width = "70px";
    document.getElementById("SODA-logo").style.display = "none";
    buttonSidebarIcon.style.display = "block";
    open = false;
  }
}
// Open/Close Sidebar effect
buttonSidebar.addEventListener('click', (event) => {
  openSidebar(buttonSidebar)
})
buttonSidebarIcon.addEventListener('click', (event) => {
  buttonSidebar.click()
})
buttonSidebarBigIcon.addEventListener('click', (event) => {
  buttonSidebar.click()
})

// Button selection to move on to next step under Prepare Dataset //
document.getElementById('button-organize-next-step').addEventListener('click', (event) => {
  document.getElementById('button-specfy-dataset-demo-toggle').click()
  if (getComputedStyle(document.getElementById('div-file-conversion'), null).display === 'none'){
    document.getElementById('button-file-conversion-demo-toggle').click()
  }
})
document.getElementById('button-file-conversion-next-step').addEventListener('click', (event) => {
  document.getElementById('button-file-conversion-demo-toggle').click()
  if (getComputedStyle(document.getElementById('div-specify-metadata'), null).display === 'none'){
    document.getElementById('button-specify-metadata-demo-toggle').click()
  }
})
document.getElementById('button-specify-metadata-next-step').addEventListener('click', (event) => {
  document.getElementById('button-specify-metadata-demo-toggle').click()
  if (getComputedStyle(document.getElementById('div-validate-dataset'), null).display === 'none'){
    document.getElementById('button-validate-dataset-demo-toggle').click()
  }
})
document.getElementById('button-validate-dataset-next-step').addEventListener('click', (event) => {
  document.getElementById('button-validate-dataset-demo-toggle').click()
  if (getComputedStyle(document.getElementById('div-generate-dataset'), null).display === 'none'){
    document.getElementById('button-generate-dataset-demo-toggle').click()
  }
})

// Download Metadata Templates //
templateArray = ["submission.xlsx", "dataset_description.xlsx", "subjects.xlsx", "samples.xlsx", "manifest.xlsx"]
function downloadTemplates(templateItem, destinationFolder) {
  var templatePath = path.join(__dirname, "file_templates", templateItem)
  var destinationPath = path.join(destinationFolder, templateItem)
  if (fs.existsSync(destinationPath)) {
    var emessage = "File " + templateItem +  " already exists in " +  destinationFolder
    ipcRenderer.send('open-error-metadata-file-exits', emessage)
  } else {
    fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath))
    var emessage = "Successfully saved file " + templateItem + " to " + destinationFolder
    ipcRenderer.send('open-info-metadata-file-donwloaded', emessage)
  }
}
downloadSubmission.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-metadata', templateArray[0])
});
downloadDescription.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-metadata', templateArray[1])
});
downloadSubjects.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-metadata', templateArray[2])
});
downloadSamples.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-metadata', templateArray[3])
});
downloadManifest.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-metadata', templateArray[4])
});
ipcRenderer.on('selected-metadata-download-folder', (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0])
  }
})


// Select organized dataset folder and populate table //
selectDatasetBtn.addEventListener('click', (event) => {
  clearStrings()
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

//Select files/folders to be added to table for organizing //

//code
const selectCodeBtn = document.getElementById('button-select-code')
selectCodeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-code')
})
const selectCodeDirectoryBtn = document.getElementById('button-select-code-directory')
selectCodeDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-code')
})
ipcRenderer.on('selected-code', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'code')
})

//derivatives
const selectDerivativesBtn = document.getElementById('button-select-derivatives')
selectDerivativesBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-derivatives')
})
const selectDerivativesDirectoryBtn = document.getElementById('button-select-derivatives-directory')
selectDerivativesDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-derivatives')
})
ipcRenderer.on('selected-derivatives', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'derivatives')
})

//docs
const selectDocsBtn = document.getElementById('button-select-docs')
selectDocsBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-docs')
})
const selectDocsDirectoryBtn = document.getElementById('button-select-docs-directory')
selectDocsDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-docs')
})
ipcRenderer.on('selected-docs', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'docs')
})

//primary
const selectPrimaryBtn = document.getElementById('button-select-primary')
selectPrimaryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-primary')
})
const selectPrimaryDirectoryBtn = document.getElementById('button-select-primary-directory')
selectPrimaryDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-primary')
})
ipcRenderer.on('selected-primary', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'primary')
})

//protocol
const selectProtocolBtn = document.getElementById('button-select-protocol')
selectProtocolBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-protocol')
})
const selectProtocolDirectoryBtn = document.getElementById('button-select-protocol-directory')
selectProtocolDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-protocol')
})

ipcRenderer.on('selected-protocol', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'protocol')
})

//source
const selectSourceBtn = document.getElementById('button-select-source')
selectSourceBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-source')
})
const selectSourceDirectoryBtn = document.getElementById('button-select-source-directory')
selectSourceDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-source')
})
ipcRenderer.on('selected-source', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'source')
})

// Drag and drop //
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

//Clear table //
clearTableBtn.addEventListener('click', () => {
  // Generate warning before continuing
  clearStrings()
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

//Select files to be added to metadata files table //
const selectMetadataBtn = document.getElementById('button-select-metadata')
selectMetadataBtn.addEventListener('click', (event) => {
  document.getElementById("para-preview-organization-status-metadata").innerHTML = ""
  ipcRenderer.send('open-file-dialog-metadata')
})
ipcRenderer.on('selected-metadata', (event, path) => {
    insertFileToMetadataTable(tableMetadata, path)
})
var holderMetadata = document.getElementById('metadata')
holderMetadata.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderMetadata.id
   dropAddToTableMetadata(event, myID)
})

// New instance for description editor
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

// Character count for subtitle //
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
// Prepare Dataset
//////////////////////////////////

function disablePrepareDatasetButtons() {
  selectSaveFileOrganizationBtn.disabled = true
  selectImportFileOrganizationBtn.disabled = true
  clearTableBtn.disabled = true
  selectPreviewBtn.disabled = true
  selectPreviewMetadataBtn.disabled = true
  selectSaveFileOrganizationMetadataBtn.disabled = true
  curateDatasetBtn.disabled = true
}

function enablePrepareDatasetButtons() {
  selectSaveFileOrganizationBtn.disabled = false
  selectImportFileOrganizationBtn.disabled = false
  clearTableBtn.disabled = false
  selectPreviewBtn.disabled = false
  selectPreviewMetadataBtn.disabled = false
  selectSaveFileOrganizationMetadataBtn.disabled = false
  curateDatasetBtn.disabled = false
}

// Action when user click on "Save" file organization button //
selectSaveFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('save-file-dialog-saveorganization', 'dataset')
  clearStrings()
})
selectSaveFileOrganizationMetadataBtn.addEventListener('click', (event) => {
  ipcRenderer.send('save-file-dialog-saveorganization', 'metadata')
  clearStrings()
})
ipcRenderer.on('selected-saveorganizationfile', (event, path, location) => {
  if (path.length > 0){
    if (alreadyOrganizedStatus.checked == true){
      var jsonvect = tableToJsonWithDescriptionOrganized(tableOrganized)
    } else {
      var jsonvect = tableToJsonWithDescription(tableNotOrganized)
    }
    var jsonpath = jsonvect[0]
    var jsondescription = jsonvect[1]
    var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
    if (location === 'dataset'){
      document.getElementById("para-save-file-organization-status").innerHTML = "Please wait..."
    } else if (location === 'metadata'){
      document.getElementById("para-preview-organization-status-metadata").innerHTML = "Please wait..."
    }
    // Call python to save
    if (path != null){
      disablePrepareDatasetButtons()
      client.invoke("api_save_file_organization", jsonpath, jsondescription, jsonpathMetadata, path, (error, res) => {
          if(error) {
            log.error(error)
            console.error(error)
            var emessage = userError(error)
            if (location === 'dataset'){
              document.getElementById("para-save-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
            } else if (location === 'metadata'){
              document.getElementById("para-preview-organization-status-metadata").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
            }
            enablePrepareDatasetButtons()
          } else {
            if (location === 'dataset'){
              document.getElementById("para-save-file-organization-status").innerHTML = "Saved!"
            } else if (location === 'metadata'){
              document.getElementById("para-preview-organization-status-metadata").innerHTML = "Saved!"
            }
            enablePrepareDatasetButtons()
          }
      })
    }
  }
})

// Action when user click on "Import" button //
selectImportFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-uploadorganization')
  clearStrings()
})
ipcRenderer.on('selected-uploadorganization', (event, path) => {
  if (path.length > 0) {
    disablePrepareDatasetButtons()
    document.getElementById("para-save-file-organization-status").innerHTML = "Please wait..."
    var headerNames = sparcFolderNames.slice()
    var lennames =  headerNames.length
    for (var i = 0; i < lennames; i++) {
    	headerNames.push(headerNames[i] + "_description")
    }
    headerNames.push("metadata")
    client.invoke("api_import_file_organization", path[0], headerNames, (error, res) => {
          if(error) {
            log.error(error)
            console.error(error)
            var emessage = userError(error)
            document.getElementById("para-save-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
            enablePrepareDatasetButtons()
          } else {
            var jsonpath = res[0]
            jsonToTableWithDescription(tableNotOrganized, jsonpath)
            var jsonpathMetadata = res[1]
            jsonToTableMetadata(tableMetadata, jsonpathMetadata)
            document.getElementById("para-save-file-organization-status").innerHTML = "Imported!";
            enablePrepareDatasetButtons()
          }
    })
  }
})

// Action when user click on "Preview" file organization button //
selectPreviewBtn.addEventListener('click', () => {
  previewProgressBar.style.display = 'block'
  disablePrepareDatasetButtons()
  clearStrings()
  document.getElementById("para-save-file-organization-status").innerHTML = "Please wait..."
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  if (manifestStatus.checked){
    var keyvect = sparcFolderNames.slice()
    for (var j = 0; j < keyvect.length; j++){
      var folder = keyvect[j]
      var folderPaths = jsonpath[folder]
      if (folderPaths.length>0){
        folderPaths.push(path.join(__dirname, "file_templates","manifest.xlsx"))
      }
    }
  }
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  jsonpath['main'] = jsonpathMetadata['metadata']
  client.invoke("api_preview_file_organization", jsonpath, (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        var emessage = userError(error)
        document.getElementById("para-save-file-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
        enablePrepareDatasetButtons()
        previewProgressBar.style.display = 'none'
      } else {
        document.getElementById("para-save-file-organization-status").innerHTML = "Preview folder is available in a new file explorer window!";
        selectPreviewBtn.disabled = false
        selectPreviewMetadataBtn.disabled = false
        enablePrepareDatasetButtons()
        previewProgressBar.style.display = 'none'
      }
  })
})

selectPreviewMetadataBtn.addEventListener('click', () => {
  previewMetadataProgressBar.style.display = 'block'
  disablePrepareDatasetButtons()
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
        folderPaths.push(path.join(__dirname, "file_templates","manifest.xlsx"))
      }
    }
  }
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  jsonpath['main'] = jsonpathMetadata['metadata']
  client.invoke("api_preview_file_organization", jsonpath, (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        var emessage = userError(error)
        document.getElementById("para-preview-organization-status-metadata").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
        enablePrepareDatasetButtons()
        previewMetadataProgressBar.style.display = 'none'
      } else {
        document.getElementById("para-preview-organization-status-metadata").innerHTML = "Preview folder is available in a new file explorer window!";
        enablePrepareDatasetButtons()
        previewMetadataProgressBar.style.display = 'none'
      }
  })
})

// Generate dataset //
curateDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-curate").innerHTML = "Please wait..."
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  progressBarCurate.value = 0;

  // Disable curate button to prevent multiple clicks
  curateDatasetBtn.disabled = true
  disableform(curationForm)
  var sourceDataset = ''

  // Convert table content into json format for transferring to Python
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
      console.error(emessage)
      log.error(emessage)
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
      log.error(emessage)
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

  //Get dataset destination info (local or Blackfynn)
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
    ipcRenderer.send('open-info-upload-limitations')
  }

  // Initiate curation by calling Python funtion
  var err = false
  var curatestatus = 'Solving'
  document.getElementById("para-curate-progress-bar-status").innerHTML = "Preparing files ..."
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
      console.error(error)
      curateDatasetBtn.disabled = false
      enableform(curationForm)
    } else {
      document.getElementById("para-please-wait-curate").innerHTML = "Please wait...";
      log.info('Completed curate function')
      console.log('Completed curate function')
    }
  })

  // Progress tracking function
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
        console.error(error)
        document.getElementById("para-curate-progress-bar-status").innerHTML = ''
      } else {
        curatestatus = res[1]
        var curateprintstatus = res[2]
        var totalDatasetSize = res[3]
        var curatedDatasetSize = res[4]
        if (curateprintstatus === 'Curating') {
          progressCurateUpload.style.display = "block";
          if (res[0].includes('Success: COMPLETED!')){
            progressBarCurate.value = 100
            document.getElementById("para-please-wait-curate").innerHTML = "";
            document.getElementById("para-curate-progress-bar-status").innerHTML = res[0] + smileyCan
          } else {
            var value = (curatedDatasetSize / totalDatasetSize) * 100
            progressBarCurate.value = value
            if (totalDatasetSize < 1024){
              var totalSizePrint = totalDatasetSize.toFixed(2) + ' B'
            } else if (totalDatasetSize < 1024*1024){
              var totalSizePrint = (totalDatasetSize/1024).toFixed(2) + ' KB'
            } else if (totalDatasetSize < 1024*1024*1024){
              var totalSizePrint = (totalDatasetSize/1024/1024).toFixed(2) + ' MB'
            } else {
              var totalSizePrint = (totalDatasetSize/1024/1024/1024).toFixed(2) + ' GB'
            }
            document.getElementById("para-curate-progress-bar-status").innerHTML = res[0] + 'Progress: ' + value.toFixed(2) + '%' + ' (total size: ' + totalSizePrint + ')'
            // console.log(value, totalDatasetSize, curatedDatasetSize)
          }
        }
      }
    })
    if (curatestatus === 'Done'){
      countDone++
      if (countDone > 1){
        log.info('Done curate track')
        console.log('Done curate track')
        document.getElementById("para-please-wait-curate").innerHTML = "";
        clearInterval(timerProgress)
        curateDatasetBtn.disabled = false
        enableform(curationForm)
      }
    }
  }

})

//////////////////////////////////
// Manage Dataset
//////////////////////////////////


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

// Add new bf account //
bfAddAccountBtn.addEventListener('click', () => {
  bfAddAccountBtn.disabled = true
  bfAddAccountStatus.innerHTML = ''
  client.invoke("api_bf_add_account", keyName.value, key.value, secret.value, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      bfAddAccountStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
    } else {
        bfAddAccountStatus.innerHTML = res + smileyCan +". Please select your account!"
        bfAccountLoadProgress.style.display = 'block'
        updateBfAccountList()
        keyName.value = ''
        key.value = ''
        secret.value = ''
    }
    bfAddAccountBtn.disabled = false
  })
})

// Select bf account from dropdownlist and show existing dataset //
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

// Refresh lists of bf datasets (in case user create it online) //
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

bfRefreshDatasetStatusBtn.addEventListener('click', () => {
  refreshAllBfDatasetLists()
})

// Add new dataset folder (empty) on bf //
bfCreateNewDatasetBtn.addEventListener('click', () => {
  bfCreateNewDatasetBtn.disabled = true
  bfCreateNewDatasetStatus.innerHTML = 'Adding...'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  client.invoke("api_bf_new_dataset_folder", bfNewDatasetName.value, selectedbfaccount, (error, res) => {
    if (error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      bfCreateNewDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
      bfCreateNewDatasetBtn.disabled = false
    } else {
        var inputSubtitle = bfNewDatasetSubtitle.value
        client.invoke("api_bf_add_subtitle", selectedbfaccount, bfNewDatasetName.value, inputSubtitle,
        (error, res) => {
        if(error) {
          log.error(error)
          console.error(error)
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

// Submit dataset to bf //
bfSubmitDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-manage-dataset").innerHTML = "Please wait..."
  document.getElementById("para-progress-bar-error-status").innerHTML = ""
  progressBarUploadBf.value = 0
  bfSubmitDatasetBtn.disabled = true
  var err = false
  var completionStatus = 'Solving'
  document.getElementById("para-progress-bar-status").innerHTML = "Preparing files ..."
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedbfdataset = bfDatasetList.options[bfDatasetList.selectedIndex].text
  ipcRenderer.send('open-info-upload-limitations')
  client.invoke("api_bf_submit_dataset", selectedbfaccount, selectedbfdataset, pathSubmitDataset.value, (error, res) => {
    if (error) {
      document.getElementById("para-please-wait-manage-dataset").innerHTML = ""
      var emessage = userError(error)
      document.getElementById("para-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
      document.getElementById("para-progress-bar-status").innerHTML = ""
      progressUploadBf.style.display = "none"
      progressBarUploadBf.value = 0
      err = true
      log.error(error)
      console.error(error)
      bfSubmitDatasetBtn.disabled = false
    } else {
      // document.getElementById("para-please-wait-manage-dataset").innerHTML = "Please wait..."
      log.info('Completed submit function')
      console.log('Completed submit function')
      console.log(res)
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
        console.error(error)
      } else {
        completionStatus = res[1]
        var submitprintstatus = res[2]
        var totalFileSize = res[3]
        var uploadedFileSize = res[4]
        if (submitprintstatus === "Uploading"){
          progressUploadBf.style.display = "block"
          if (res[0].includes('Success: COMPLETED!')){
            progressBarUploadBf.value = 100
            document.getElementById("para-please-wait-manage-dataset").innerHTML = ""
            document.getElementById("para-progress-bar-status").innerHTML = res[0] + smileyCan
          }  else {
            var value = (uploadedFileSize/totalFileSize)*100
            progressBarUploadBf.value = value
            if (totalFileSize < 1024){
              var totalSizePrint = totalFileSize.toFixed(2) + ' B'
            } else if (totalFileSize < 1024*1024){
              var totalSizePrint = (totalFileSize/1024).toFixed(2) + ' KB'
            } else if (totalFileSize < 1024*1024*1024){
              var totalSizePrint = (totalFileSize/1024/1024).toFixed(2) + ' MB'
            } else {
              var totalSizePrint = (totalFileSize/1024/1024/1024).toFixed(2) + ' GB'
            }
            document.getElementById("para-progress-bar-status").innerHTML = res[0] + 'Progress: ' + value.toFixed(2) + '%' + ' (total size: ' + totalSizePrint + ')'
            // console.log(value, totalFileSize, uploadedFileSize)
          }
        }
      }
    })
    if (completionStatus === 'Done'){
      countDone++
      if (countDone > 1){
        log.info('Done submit track')
        console.log('Done submit track')
        document.getElementById("para-please-wait-manage-dataset").innerHTML = ""
        clearInterval(timerProgress)
        bfSubmitDatasetBtn.disabled = false       
      }
    }
  }
})


// Change selected dataset from dropdown lists //

// Generate dataset
bfUploadDatasetList.addEventListener('change', () => {
  var listSelectedIndex = bfUploadDatasetList.selectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
})

// Upload local dataset
bfDatasetList.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetList.selectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
})

// Add metadata to Blackfynn dataset
bfDatasetListMetadata.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListMetadata.selectedIndex
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
})

function metadataDatasetlistChange(){
  bfCurrentMetadataProgress.style.display = 'block'
  datasetSubtitleStatus.innerHTML = ''
  datasetLicenseStatus.innerHTML = ''
  bfDatasetSubtitle.value = ''
  datasetDescriptionStatus.innerHTML = ''
  datasetBannerImageStatus.innerHTML = ''
  showCurrentSubtitle()
  showCurrentDescription()
  showCurrentLicense()
  showCurrentBannerImage()
}

// Manage dataset permission
bfDatasetListPermission.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListPermission.selectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
})

function permissionDatasetlistChange(){
  bfCurrentPermissionProgress.style.display = 'block'
  showCurrentPermission()
}

// Change dataset status
bfDatasetListDatasetStatus.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListDatasetStatus.selectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  datasetStatusListChange()
})

function datasetStatusListChange(){
  bfCurrentDatasetStatusProgress.style.display = 'block'
  showCurrentDatasetStatus()
}

// Change dataset status option change
bfListDatasetStatus.addEventListener('change', () => {
  bfCurrentDatasetStatusProgress.style.display = 'block'
  datasetStatusStatus.innerHTML = 'Please wait...'
  selectOptionColor(bfListDatasetStatus)
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListDatasetStatus.options[bfDatasetListDatasetStatus.selectedIndex].text
  var selectedStatusOption = bfListDatasetStatus.options[bfListDatasetStatus.selectedIndex].text
  client.invoke("api_bf_change_dataset_status", selectedBfAccount, selectedBfDataset, selectedStatusOption,
    (error, res) => {
    if( error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      function showErrorDatasetStatus(){
        datasetStatusStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        bfCurrentDatasetStatusProgress.style.display = 'none'
      }
      showCurrentDatasetStatus(showErrorDatasetStatus)
    } else {
      bfCurrentDatasetStatusProgress.style.display = 'none'
      datasetStatusStatus.innerHTML = res
    }
  })  
})

// Add substitle //
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
      console.error(error)
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

// Add description //
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
      console.error(error)
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

// upload banner image //
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
  // preview: '.preview',
  viewMode: 1,
  responsive: true,
  crop: function(e) {
      var data = e.detail;
      formBannerHeight.value = Math.round(data.height)
      // formBannerWidth.value = Math.round(data.width)
  }
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
    document.getElementById("div-img-container-holder").style.display="none"
    document.getElementById("div-img-container").style.display="block"
    datasetBannerImagePath.innerHTML = path
    imageExtension = path[0].split('.').pop()
    bfViewImportedImage.src = path[0]
    myCropper.destroy()
    myCropper = new Cropper(bfViewImportedImage, cropOptions)
    }
  })

function uploadBannerImage(){
  bfCurrentMetadataProgress.style.display = 'block'
  datasetBannerImageStatus.innerHTML = 'Please wait...'
  disableform(bfMetadataForm)
  //Save cropped image locally and check size
  var imageFolder = path.join(homeDirectory, 'SODA', 'banner-image')
  if (!fs.existsSync(imageFolder)){
    fs.mkdirSync(imageFolder, {recursive: true})
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
          console.error(error)
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
  })
}

bfSaveBannerImageBtn.addEventListener('click', (event) => {
  datasetBannerImageStatus.innerHTML = ""
  if (bfViewImportedImage.src.length > 0){
    if (formBannerHeight.value>511){
      if (formBannerHeight.value<1024){
        ipcRenderer.send('warning-banner-image-below-1024', formBannerHeight.value)
      } else{
        uploadBannerImage()
      }
    } else {
      datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + "Dimensions of cropped area must be at least 512 px" + "</span>"
    }
  } else {
    datasetBannerImageStatus.innerHTML = "<span style='color: red;'> " + "Please import an image first" + "</span>"
  }
})

// Add license //
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
      console.error(error)
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


// Make PI owner //
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
      console.error(error)
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

// Share with Curation Team //
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
      console.error(error)
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

// Add permission for user //
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

// Add permission for team
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
      console.error(error)
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

//////////////////////////////////
// Helper functions
//////////////////////////////////

// General //

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
  document.getElementById("para-save-file-organization-status").innerHTML = ""
  document.getElementById("para-preview-organization-status-metadata").innerHTML = ""
  document.getElementById("para-selected-dataset").innerHTML = ""
}

function clearPermissionsStrings() {
  document.getElementById("para-save-file-organization-status").innerHTML = ""
  document.getElementById("para-selected-dataset").innerHTML = ""
}

function userError(error)
{
  var myerror = error.message
  return myerror
}

// Manage Datasets //

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

function refreshAllBfDatasetLists(){
    var accountSelected = bfAccountList.options[bfAccountList.selectedIndex].text
    if (accountSelected === "Select"){
      removeOptions(bfDatasetList)
      removeOptions(bfDatasetListMetadata)
      removeOptions(bfDatasetListPermission)
      removeOptions(bfUploadDatasetList)
      removeOptions(bfDatasetListDatasetStatus)
      var optionSelect = document.createElement("option")
      optionSelect.textContent = 'Select dataset'
      bfDatasetList.appendChild(optionSelect)
      var option2 = optionSelect.cloneNode(true)
      var option3 = optionSelect.cloneNode(true)
      var option4 = optionSelect.cloneNode(true)
      var option5 = optionSelect.cloneNode(true)
      bfDatasetListMetadata.appendChild(option2)
      bfDatasetListPermission.appendChild(option3)
      bfUploadDatasetList.appendChild(option4)
      bfDatasetListDatasetStatus.appendChild(option5)
    } else {
      client.invoke("api_bf_dataset_account", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
        if(error) {
          log.error(error)
          console.error(error)
        } else {
          removeOptions(bfDatasetList)
          removeOptions(bfDatasetListMetadata)
          removeOptions(bfDatasetListPermission)
          removeOptions(bfUploadDatasetList)
          removeOptions(bfDatasetListDatasetStatus)
          for (myitem in res){
            var myitemselect = res[myitem]
            var option = document.createElement("option")
            option.textContent = myitemselect
            option.value = myitemselect
            bfDatasetList.appendChild(option)
            var option2 = option.cloneNode(true)
            var option3 = option.cloneNode(true)
            var option4 = option.cloneNode(true)
            var option5 = option.cloneNode(true)
            bfDatasetListMetadata.appendChild(option2)
            bfDatasetListPermission.appendChild(option3)
            bfUploadDatasetList.appendChild(option4)
            bfDatasetListDatasetStatus.appendChild(option5)
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
    bfDatasetSubtitle.value = "";
  } else {
    client.invoke("api_bf_get_subtitle", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
      } else {
        bfDatasetSubtitle.value = res;
        countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount)
      }
    })
  }
}

function showCurrentDescription(){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentMetadataProgress.style.display = 'none'
    tuiInstance.setMarkdown("")
  } else {
    client.invoke("api_bf_get_description", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
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
    bfCurrentBannerImg.src = ''
    document.getElementById('para-current-banner-img').innerHTML = 'None'
  } else {
    client.invoke("api_bf_get_banner_image", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        bfCurrentMetadataProgress.style.display = 'none'
        bfCurrentBannerImg.src = 'assets/img/no-banner-image.png'
        document.getElementById('para-current-banner-img').innerHTML = 'None'
      } else {
        if (res === 'No banner image'){
          bfCurrentBannerImg.src = ''
          document.getElementById('para-current-banner-img').innerHTML = 'None'
        }
        else {
          document.getElementById('para-current-banner-img').innerHTML = ''
          bfCurrentBannerImg.src = res
        }
        bfCurrentMetadataProgress.style.display = 'none'
      }
    })
  }
}

function showCurrentLicense(){
  currentDatasetLicense.innerHTML = "Please wait..."
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListMetadata.options[bfDatasetListMetadata.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    currentDatasetLicense.innerHTML = 'None'
    bfCurrentMetadataProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_license", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        bfCurrentMetadataProgress.style.display = 'none'
      } else {
        currentDatasetLicense.innerHTML = res
        bfCurrentMetadataProgress.style.display = 'none'
      }
    })
  }
}

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
        console.error(error)
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
        console.error(error)
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
    currentDatasetPermission.innerHTML = 'None'
    bfCurrentPermissionProgress.style.display = 'none'
  } else {
    client.invoke("api_bf_get_permission", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
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

function addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole){
  client.invoke("api_bf_add_permission", selectedBfAccount, selectedBfDataset, selectedUser, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
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


function showCurrentDatasetStatus(callback){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListDatasetStatus.options[bfDatasetListDatasetStatus.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentDatasetStatusProgress.style.display = 'none'
    datasetStatusStatus.innerHTML = ""
    removeOptions(bfListDatasetStatus)
    bfListDatasetStatus.style.color = 'black'
  } else {
    datasetStatusStatus.innerHTML = 'Please wait...'
    client.invoke("api_bf_get_dataset_status", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        var emessage = userError(error)
        datasetStatusStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        bfCurrentDatasetStatusProgress.style.display = 'none'
      } else {
        var myitemselect = []
        removeOptions(bfListDatasetStatus)
        for (var item in res[0]){
          var option = document.createElement("option")
          option.textContent = res[0][item]['displayName']
          option.value = res[0][item]['name']
          option.style.color = res[0][item]['color']
          bfListDatasetStatus.appendChild(option)
        }
        bfListDatasetStatus.value = res[1]
        selectOptionColor(bfListDatasetStatus)
        bfCurrentDatasetStatusProgress.style.display = 'none'
        datasetStatusStatus.innerHTML = ""
        if (callback !== undefined){
          callback()
        }
      }
    })
  }
}

function selectOptionColor(mylist){
  mylist.style.color = mylist.options[mylist.selectedIndex].style.color
}

function showAccountDetails(bfLoadAccount){
  client.invoke("api_bf_account_details", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      bfSelectAccountStatus.innerHTML = "<span style='color: red;'> " + error + "</span>"
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
      bfLoadAccount.style.display = 'none'
    } else {
      bfSelectAccountStatus.innerHTML = res;
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
      bfLoadAccount.style.display = 'none'
    }
  })
}

function showUploadAccountDetails(bfLoadAccount){
  client.invoke("api_bf_account_details", 
    bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      bfLoadAccount.style.display = 'none'
    } else {
      bfUploadSelectAccountStatus.innerHTML = res;
      bfLoadAccount.style.display = 'none'
    }
  })
}

function loadDefaultAccount() {
  client.invoke("api_bf_default_account_load", (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
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
          var option = bfAccountList.options[0]
          option.textContent = myitemselect
          option.value = myitemselect
          bfAccountList.appendChild(option)
          var selectedbfaccount = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
      }
    }
  })
}

function updateBfAccountList(){
  client.invoke("api_bf_account_list", (error, res) => {
  if(error) {
    log.error(error)
    console.error(error)
  } else {
    removeOptions(bfAccountList)
    removeOptions(bfUploadAccountList)
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

// Organize Dataset //

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

// Dataset not organized
function insertFileToTable(table, pathlist, SPARCfolder){
  var i
  var rowcount = document.getElementById(SPARCfolder).rowIndex
  var jsonvar = tableToJson(table)
  var emessage = ''
  var count = 0

  var listfilePath = []
  for (let filePath of jsonvar[SPARCfolder]){
      var fileFull = path.basename(filePath);
      listfilePath.push(fileFull)
    }
  for (i = 0; i < pathlist.length; i++) {
      var fileFull = path.basename(pathlist[i]);
    if (listfilePath.indexOf(fileFull) > -1 ) {
      emessage = emessage + fileFull + ' already added to ' + SPARCfolder + "\n"
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
    for (i = 0; i < pathlist.length; i++) {
      tableNotOrganizedCount = tableNotOrganizedCount + 1
      var table_len=tableNotOrganizedCount
      var rownum = rowcount + i + 1
      if (fs.lstatSync(pathlist[i]).isDirectory()) {
        var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ pathlist[i]+"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
      } else {
        var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'style='color: #000000;'><td id='name_row"+table_len+"'>"+ pathlist[i]+"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit description' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save description' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete row' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
      }
    }
    return table
  }
}

function insertFileToMetadataTable(table, pathlist){
  var i
  var rowcount = 0
  var jsonvar = tableToJsonMetadata(table)
  var emessage = ''
  var count = 0
  var emessage2 = ''
  var count2 = 0
  var SPARCfolder = 'metadata'

  var listfilePath = []
  for (let filePath of jsonvar[SPARCfolder]){
      var extension = path.extname(filePath);
      var file = path.basename(filePath,extension);
      listfilePath.push(file)
    }
  for (i = 0; i < pathlist.length; i++) {
      var extension = path.extname(pathlist[i]);
      var fileFull = path.basename(pathlist[i]);
      var file = path.basename(pathlist[i],extension);
    if (allowedMedataFiles.indexOf(fileFull) === -1 ) {
      emessage2 = emessage2 + file + ' is not an expected SPARC metadata file' + "\n"
      count2 += 1
    }
    if (listfilePath.indexOf(file) > -1 ) {
      emessage = emessage + 'File ' + file + ' already added to ' + SPARCfolder + "\n"
      count += 1
    }
  }

  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else if (count2>0) {
    ipcRenderer.send('open-error-wrong-file', emessage2)
  }
  else {
    for (i = 0; i < pathlist.length; i++) {
      tableMetadataCount = tableMetadataCount + 1
      var table_len= tableMetadataCount
      var rownum = rowcount + i + 1
      var row = table.insertRow(rownum).outerHTML="<tr id='row_metadata"+table_len+"'style='color: #000000;'><td id='name_row_metadata"+table_len+"'>"+ pathlist[i] +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row_metadata("+table_len+")'></td></tr>";
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

function jsonToTableMetadata(table, jsonvar){
  var rowcount = 0
  var jsontable = tableToJsonMetadata(table)
  var emessage = ''
  var count = 0
  var emessage2 = ''
  var count2 = 0
  var SPARCfolder = 'metadata'

  var listfilePath = []
  
  for (let filePath of jsontable[SPARCfolder]){
      var extension = path.extname(filePath);
      var file = path.basename(filePath,extension);
      listfilePath.push(file)
    }
  var pathlist = jsonvar[SPARCfolder]
  for (i = 0; i < pathlist.length; i++) {
      var extension = path.extname(pathlist[i]);
      var fileFull = path.basename(pathlist[i]);
      var file = path.basename(pathlist[i],extension);
    if (allowedMedataFiles.indexOf(fileFull) > -1 && listfilePath.indexOf(file) === -1) {
      tableMetadataCount = tableMetadataCount + 1
      var table_len= tableMetadataCount
      var rownum = rowcount + i + 1
      var row = table.insertRow(rownum).outerHTML="<tr id='row_metadata"+table_len+"'style='color: #000000;'><td id='name_row_metadata"+table_len+"'>"+ pathlist[i] +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row_metadata("+table_len+")'></td></tr>";
    }
  }
  return table
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
  e.target.style.backgroundColor = '';
	var rowcount = document.getElementById(myID).rowIndex
	var i = 0
  var jsonvar = tableToJson(tableNotOrganized)
  var emessage = ''
  var count = 0

  var listfilePath = []
  for (let filePath of jsonvar[myID]){
    var fileFull = path.basename(filePath);
    listfilePath.push(fileFull)
  }
  for (let f of e.dataTransfer.files) {
      var fileFull = path.basename(f.path);
    if (listfilePath.indexOf(fileFull) > -1 ) {
      emessage = emessage + fileFull + ' already added to ' + myID + "\n"
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

const allowedMedataFiles = ['submission.xlsx', 'submission.csv',
  'dataset_description.xlsx', 'dataset_description.csv',
  'subjects.xlsx', 'subjects.csv',
  'samples.xlsx', 'samples.csv',
  'README', 'CHANGES']

function dropAddToTableMetadata(e, myID){
  //e.target.style.color = 'inherit';
  e.target.style.backgroundColor = '';
  var rowcount = document.getElementById(myID).rowIndex
  var i = 0
  var jsonvar = tableToJsonMetadata(tableMetadata)
  var emessage0 = ''
  var emessage = ''
  var emessage2 = ''
  var count0 = 0
  var count = 0
  var count2 = 0

  //Check if folder
  for (let f of e.dataTransfer.files) {
    if (fs.lstatSync(f.path).isDirectory()){
      emessage0 = emessage0 + f.path + ' is a folder ' + "\n"
      count0 += 1
    }
  }

  //Check if file already in table and in allowale list
  var listfilePath = []
  for (let filePath of jsonvar[myID]){
      var extension = path.extname(filePath);
      var file = path.basename(filePath,extension);
      listfilePath.push(file)
    }
  for (let f of e.dataTransfer.files) {
      var extension = path.extname(f.path);
      var fileFull = path.basename(f.path);
      var file = path.basename(f.path,extension);
    if (allowedMedataFiles.indexOf(fileFull) === -1 ) {
      emessage2 = emessage2 + file + ' is not an expected SPARC metadata file' + "\n"
      count2 += 1
    }
    if (listfilePath.indexOf(file) > -1 ) {
      emessage = emessage + 'File ' + file + ' already added to ' + myID + "\n"
      count += 1
    }
  }

  if (count > 0) {
    ipcRenderer.send('open-error-file-exist', emessage)
  } else if (count2 > 0){
    ipcRenderer.send('open-error-wrong-file', emessage2)
  } else if (count0 > 0){
    emessage0 = emessage0 + 'Please select files only' + "\n"
    ipcRenderer.send('open-error-folder-selected', emessage0)
  } else{
    for (let f of e.dataTransfer.files) {
      var rownum = rowcount + i + 1
      tableMetadataCount = tableMetadataCount + 1
      var table_len = tableMetadataCount
      var row = tableMetadata.insertRow(rownum).outerHTML="<tr id='row_metadata"+table_len+"'style='color: #000000;'><td id='name_row_metadata"+table_len+"'>"+ f.path +"</td><td> <input type='button' value='Delete row' class='delete' onclick='delete_row_metadata("+table_len+")'></td></tr>";
      i = i + 1
    }
  }
}

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