//////////////////////////////////
// Import required modules
//////////////////////////////////

const zerorpc = require("zerorpc-rotkehlchen")
const fs = require("fs")
const os = require("os")
const path = require('path')
const {ipcRenderer} = require('electron')
const Editor = require('@toast-ui/editor')
const remote = require('electron').remote;
const app = remote.app;
const imageDataURI = require("image-data-uri");
const log  = require("electron-log");
const Airtable = require('airtable');
require('v8-compile-cache');
const Tagify = require('@yaireo/tagify');
const https = require('https')
const $ = require( "jquery" );
const PDFDocument = require('pdfkit');
const html2canvas = require("html2canvas");
const removeMd = require('remove-markdown');
const electron = require('electron')
const bootbox = require('bootbox')

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
document.getElementById("createDataset").click()
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

//check user's internet connection and connect to default Blackfynn account //
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
        ipcRenderer.send('warning-new-version', appVersion, scrappedVersion)
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
const downloadDDD = document.getElementById("a-DDD")

/// save airtable api key
const addAirtableKeyBtn = document.getElementById("button-add-airtable-key")
const bfRefreshAirtableStatusBtn = document.querySelector('#button-refresh-airtable-status')

// Save grant information
const milestoneArray = document.getElementById("table-current-milestones")
const awardInputField = document.getElementById("input-grant-info")
const presavedAwardArray1 = document.getElementById("select-presaved-grant-info-list")
const addAwardBtn = document.getElementById("button-add-award")
const deleteMilestoneBtn = document.getElementById("button-delete-milestone")
const editMilestoneBtn = document.getElementById("button-edit-milestone")
const addMilestoneBtn = document.getElementById("button-add-milestone")
const deleteAwardBtn = document.getElementById("button-delete-award")
const addNewMilestoneBtn = document.getElementById("button-default-save-milestone")
const saveInformationBtn = document.getElementById("button-save-milestone")

// Prepare Submission File
const presavedAwardArray2 = document.getElementById("presaved-award-list")
const generateSubmissionBtn = document.getElementById("generate-submission")

// Prepare Dataset Description File
const dsAwardArray = document.getElementById("ds-description-award-list")
const dsContributorArray = document.getElementById("ds-description-contributor-list")
var contributorRoles = document.getElementById("input-con-role")
const affiliationInput = document.getElementById("input-con-affiliation")
const addCurrentContributorsBtn = document.getElementById("button-ds-add-contributor")
const contactPerson = document.getElementById("ds-contact-person")
const currentConTable = document.getElementById("table-current-contributors")
const generateDSBtn = document.getElementById("button-generate-ds-description")
const addAdditionalLinkBtn = document.getElementById("button-ds-add-link")
const datasetDescriptionFileDataset = document.getElementById('ds-name')
const parentDSDropdown = document.getElementById("input-parent-ds")

/////// New Organize Datasets /////////////////////
const organizeDSglobalPath = document.getElementById("input-global-path")
const organizeDSbackButton = document.getElementById("button-back")
const organizeDSaddFiles = document.getElementById("add-files")
const organizeDSaddNewFolder = document.getElementById("new-folder")
const organizeDSaddFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
// const fullPathValue = document.querySelector(".hoverPath")
const fullNameValue = document.querySelector(".hoverFullName")
// const resetProgress = document.getElementById("clear-progress")
// const saveProgress = document.getElementById("save-progress")
// const importProgress = document.getElementById("import-progress")
const homePathButton = document.getElementById("home-path")
const menuFolder = document.querySelector('.menu.reg-folder');
const menuFile = document.querySelector('.menu.file');
const menuHighLevelFolders = document.querySelector('.menu.high-level-folder');
const organizeNextStepBtn = document.getElementById("button-organize-confirm-create")
const organizePrevStepBtn = document.getElementById("button-organize-prev")

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

// Validate dataset //
const validateCurrentDSBtn = document.getElementById("button-validate-current-ds")
const previewCurrentDsValidate = document.getElementById("button-preview-local-ds")
const validateCurrentDatasetReport = document.querySelector('#textarea-validate-current-dataset')
const currentDatasetReportBtn = document.getElementById('button-generate-report-current-ds')
const validateLocalDSBtn = document.getElementById("button-validate-local-ds")
const validateLocalDatasetReport = document.querySelector('#textarea-validate-local-dataset')
const localDatasetReportBtn = document.getElementById('button-generate-report-local-ds')
const validateLocalProgressBar = document.getElementById("div-indetermiate-bar-validate-local")
const validateSODAProgressBar = document.getElementById("div-indetermiate-bar-validate-soda")

// Generate dataset //
const createNewStatus = document.querySelector('#create-newdataset')
const modifyExistingStatus = document.querySelector('#existing-dataset')
const bfUploadDirectlyStatus = document.querySelector('#cloud-dataset')
const selectnewDatasetBtn = document.getElementById('selected-new-dataset')
const importnewDatasetBtn = document.getElementById('button-select-new-dataset')
// const pathNewDataset = document.querySelector('#selected-new-dataset')
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
const datasetPermissionList = document.getElementById("select-permission-list")
var myitem
var datasetList = []
const bfDatasetList = document.querySelector('#bfdatasetlist')
const bfUploadDatasetList = document.querySelector('#bfuploaddatasetlist')
const bfSelectAccountStatus = document.getElementById("para-select-account-status")
const bfUploadSelectAccountStatus = document.getElementById("para-upload-select-account-status")
const bfRefreshDatasetBtn = document.getElementById('button-refresh-dataset-list')
const bfRefreshDatasetMetadataBtn = document.getElementById('button-refresh-dataset-list-metadata')
const bfRefreshDatasetPermissionBtn = document.getElementById('button-refresh-dataset-list-permission')
const bfUploadRefreshDatasetBtn = document.getElementById('button-upload-refresh-dataset-list')
const bfNewDatasetForm = document.getElementById('blackfynn-new-dataset-form')
const bfNewDatasetName = document.querySelector('#bf-new-dataset-name')
const bfCreateNewDatasetBtn = document.getElementById('button-create-bf-new-dataset')
const bfCreateNewDatasetStatus = document.querySelector('#para-add-new-dataset-status')
const bfSubmitDatasetBtn = document.getElementById('button-submit-dataset')
const selectLocalDsSubmit = document.getElementById("selected-local-dataset-submit")
// const importLocalDsSubmit = document.getElementById("button-import-local-ds-submit")
const bfSubmitDatasetInfo = document.querySelector('#progresssubmit')
const pathSubmitDataset = document.querySelector('#selected-local-dataset-submit')
const progressUploadBf = document.getElementById("div-progress-submit")
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf")
const bfDatasetListRenameDataset = document.querySelector('#bfdatasetlist_renamedataset')
const bfRenameDatasetBtn = document.getElementById('button-rename-dataset')
const bfRefreshDatasetRenameDatasetBtn = document.getElementById('button-refresh-dataset-renamedataset-list')
const renameDatasetName = document.querySelector('#bf-rename-dataset-name')
const bfRenameDatasetStatus = document.getElementById('para-rename-dataset-status')

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

//Blackfynn post curation
// const bfPostCurationForm = document.querySelector('#blackfynn-post-curation')
const bfDatasetListPostCurationDOI = document.querySelector('#bfdatasetlist_postcuration-doi')
const bfDatasetListPostCurationCuration = document.querySelector('#bfdatasetlist-postcuration-curation')
const bfDatasetListPostCurationConsortium = document.querySelector('#bfdatasetlist-postcuration-consortium')
const bfDatasetListPostCurationPublish = document.querySelector('#bfdatasetlist-postcuration-publish')

const bfPostCurationProgressCuration = document.querySelector('#div-bf-post-curation-progress-curation')
const bfPostCurationProgressConsortium = document.querySelector('#div-bf-post-curation-progress-consortium')
const bfPostCurationProgressPublish = document.querySelector('#div-bf-post-curation-progress-publish')
const bfPostCurationProgressDOI = document.querySelector('#div-bf-post-curation-progress-doi')

const bfShareConsortiumBtn = document.querySelector('#button-share-consortium')
const sharedWithConsortiumStatus = document.querySelector('#shared-with-consortium-status')
const shareConsortiumStatus = document.querySelector('#para-share-consortium-status')

const bfReserveDOIBtn = document.querySelector('#button-reserve-doi')
const currentDOI = document.querySelector('#input-current-doi')
const reserveDOIStatus = document.querySelector('#para-reserve-doi-status')

const bfPublishDatasetBtn = document.querySelector('#button-publish-dataset')
const bfSubmitReviewDatasetBtn = document.querySelector('#button-submit-review-dataset')
const bfRefreshPublishingDatasetStatusBtn = document.querySelector('#button-refresh-publishing-status')
const bfWithdrawReviewDatasetBtn = document.querySelector('#button-withdraw-review-dataset')
const reviewDatasetInfo = document.querySelector('#para-review-dataset-info')
const publishingStatus = document.querySelector('#input-publishing-status')
const publishDatasetStatus = document.querySelector('#para-publish-dataset-status')

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = '#000000'
const redColor = '#ff1a1a'
const sparcFolderNames = ["code", "derivative", "docs", "primary", "protocol", "source"]
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

// Button selection to move on to next step under Prepare Dataset //
document.getElementById('button-organize-next-step').addEventListener('click', (event) => {
  document.getElementById('button-specfy-dataset-demo-toggle').click()
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

///////////////////// Prepare Metadata Section ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

///// Global variables for this section

/////// Save and load award and milestone info
var metadataPath = path.join(homeDirectory,"SODA", "METADATA");
var awardFileName = "awards.json";
var milestoneFileName = "milestones.json";
var defaultAwardFileName = "default-awards.json";
var airtableConfigFileName = "airtable-config.json";
var awardPath = path.join(metadataPath, awardFileName);
var milestonePath = path.join(metadataPath, milestoneFileName);
var defaultAwardPath = path.join(metadataPath, defaultAwardFileName);
var airtableConfigPath = path.join(metadataPath, airtableConfigFileName);

///////////////////// Airtable Authentication /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/////// Load SPARC airtable data
var airtableHostname = 'api.airtable.com'

function sendHTTPsRequestAirtable(options, varSuccess) {
  https.get(options, res => {
    if (res.statusCode === 200) {
      varSuccess = true
    } else {
      log.error(res)
      console.error(res)
      varSuccess = false
    }
    res.on('error', error => {
      log.error(error)
      console.error(error)
    })
  return res
  })
}

///// Upon clicking "Connect" to Airtable
addAirtableKeyBtn.addEventListener("click", function() {
  document.getElementById("para-add-airtable-key").innerHTML = ""
  var apiKeyInput = document.getElementById("airtable-api-key").value;
  var keyName = document.getElementById("airtable-key-name").value;
  if (apiKeyInput.length === 0 || keyName.length === 0) {
    document.getElementById("para-add-airtable-key").innerHTML = "<span style='color: red;'>Please fill in both required fields to add.</span>"
  } else {
    document.getElementById("div-airtable-connect-load-progress").style.display = "block"
    // test connection
    const optionsSparcTable = {
      hostname: airtableHostname,
      port: 443,
      path: '/v0/appiYd1Tz9Sv857GZ/sparc_members',
      headers: {'Authorization': `Bearer ${apiKeyInput}`}
    };
    var sparcTableSuccess;
    https.get(optionsSparcTable, res => {
      if (res.statusCode === 200) {
        /// updating api key in SODA's storage
        createMetadataDir();
        var content = parseJson(airtableConfigPath);
        content["api-key"] = apiKeyInput;
        content["key-name"] = keyName
        fs.writeFileSync(airtableConfigPath, JSON.stringify(content));
        document.getElementById("para-add-airtable-key").innerHTML = "<span style='color: black;'>New Airtable key added successfully for account name: " + keyName + ".</span>";
        document.getElementById('para-save-award-info').innerHTML = ""
        document.getElementById("airtable-api-key").value = ""
        document.getElementById("airtable-key-name").value = ""
        loadAwardData()
      } else if (res.statusCode === 403) {
        document.getElementById("para-add-airtable-key").innerHTML = "<span style='color: red;'>Your account doesn't have access to the SPARC Airtable sheet. Please obtain access (email Dr. Charles Horn at chorn@pitt.edu)!</span>";
      } else {
        log.error(res)
        console.error(res)
        document.getElementById("para-add-airtable-key").innerHTML = "<span style='color: red;'>Failed to connect to Airtable. Please check your API Key and try again!</span>";
      }
      document.getElementById("div-airtable-connect-load-progress").style.display = "none"
      document.getElementById("para-add-airtable-key").style.display = "block"
      res.on('error', error => {
        log.error(error)
        console.error(error)
        document.getElementById("para-add-airtable-key").innerHTML = "<span style='color: red;'>Failed to connect to Airtable. Please check your API Key and try again!</span>";
      })
    })
  }
})

loadAwardData()

/////////////////////// Download Metadata Templates ////////////////////////////
templateArray = ["submission.xlsx", "dataset_description.xlsx", "subjects.xlsx", "samples.xlsx", "manifest.xlsx", "DataDeliverablesDocument-template.docx"]
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

downloadDDD.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-save-DDD', templateArray[5])
});
ipcRenderer.on('selected-DDD-download-folder', (event, path, filename) => {
  if (path.length > 0) {
    downloadTemplates(filename, path[0])
  }
})

/////////////////// Provide Grant Information section /////////////////////////
//////////////// //////////////// //////////////// //////////////// ///////////

////////////////////////Import Milestone Info//////////////////////////////////
const descriptionDateInput = document.getElementById("selected-milestone-date");
const milestoneInput = document.getElementById('selected-milestone')
var milestoneTagify = new Tagify(milestoneInput, {
      duplicates: false,
      delimiters: null,
      dropdown : {
        classname : "color-blue",
        maxItems: Infinity,
        enabled   : 0,
        closeOnSelect : true
      }
})

//// when users click on Import
document.getElementById("button-import-milestone").addEventListener("click", function() {
  document.getElementById("para-milestone-document-info-long").style.display = "none"
  document.getElementById("para-milestone-document-info").innerHTML = "";
  var filepath = document.getElementById("input-milestone-select").placeholder;
  if (filepath === "Select a file") {
    document.getElementById("para-milestone-document-info").innerHTML = "<span style='color: red ;'>" + "Please select a data deliverables document first!</span>"
  } else {
    var award = presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
    client.invoke("api_extract_milestone_info", filepath, (error, res) => {
    if(error) {
      var emessage = userError(error)
      log.error(error)
      console.error(error)
      document.getElementById("para-milestone-document-info-long").style.display = "block"
      document.getElementById("para-milestone-document-info-long").innerHTML = "<span style='color: red;'> " + emessage + "</span>";
    }
    else {
      milestoneObj = res;
      createMetadataDir();
      var informationJson = {};
      informationJson = parseJson(milestonePath);
      informationJson[award] = milestoneObj;
      fs.writeFileSync(milestonePath, JSON.stringify(informationJson));
      document.getElementById("para-milestone-document-info").innerHTML = "<span style='color: black ;'>" + "Imported!</span>"
      //// after saving data to json file, load the table right after.
      /// clear old table before loading new entries
      while (milestoneArray.rows.length>1) {
        milestoneArray.deleteRow(1)
      };
      if (award in informationJson) {
        document.getElementById("para-current-milestones").style.display = "none";
        /// check how many data description rows there are for each milestone (to set number of rowspans)

        var rowIndex = 1;
        var milestoneKey = Object.keys(milestoneObj)
        for (var i=0;i<milestoneKey.length;i++){
          var milestone = milestoneObj[milestoneKey[i]];
          // var span = milestoneObj[milestoneKey[i]].length
          for (var j=0;j<milestone.length;j++) {
            var description = milestone[j]["Description of data"]
            var date = milestone[j]["Expected date of completion"]
            var row = milestoneArray.insertRow(rowIndex).outerHTML="<tr id='row-milestone"+rowIndex+"'style='color: #000000;'><td id='name-row-milestone"+rowIndex+"'>"+ milestoneKey[i] +"</td><td id='name-row-description"+rowIndex+"'>"+ description +"</td><td id='name-row-date"+rowIndex+"'>"+ date +"</td></tr>"
          }
          rowIndex++;
        }
      removeOptions(descriptionDateInput);
      milestoneTagify.removeAllTags()
      milestoneTagify.settings.whitelist = []
      document.getElementById("table-current-milestones").style.display = "block";
      document.getElementById("presaved-award-list").value = "Select"
      document.getElementById("input-milestone-select").placeholder = "Select a file"
      return milestoneArray
    }
  }
})
}
})

document.getElementById("input-milestone-select").addEventListener("click", function() {
  document.getElementById("para-milestone-document-info-long").style.display = "none"
  ipcRenderer.send('open-file-dialog-milestone-doc')
})
ipcRenderer.on('selected-milestonedoc', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      // used to communicate value to button-import-milestone click event-listener
      document.getElementById("input-milestone-select").placeholder = filepath[0];
  }
}
})

presavedAwardArray1.addEventListener('change', function() {
  if (presavedAwardArray1.value === "Select") {
    document.getElementById("div-show-milestone-info-no-existing").style.display = "none";
    document.getElementById("div-milestone-info").style.display = "none";
    document.getElementById("div-show-current-milestones").style.display = "none"
  } else {
      document.getElementById("div-show-milestone-info-no-existing").style.display = "block";
      document.getElementById("div-milestone-info").style.display = "block";
      document.getElementById("div-show-current-milestones").style.display = "block"
      document.getElementById("para-delete-award-status").innerHTML = ""
  }
})

// load and parse json file
function parseJson(path) {
  if (!fs.existsSync(path)) {
    return {}
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson
  } catch (error) {
    log.error(error)
    console.log(error);
    return {}
  }
}

// function to make directory if metadata path does not exist
function createMetadataDir() {
  try {
  fs.mkdirSync(metadataPath, { recursive: true } );
  } catch (error) {
    log.error(error)
    console.log(error)
  }
}

createMetadataDir()

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
    var opt = document.createElement("OPTION");
    opt.text = text;
    opt.value = value;
    selectbox.options.add(opt);
}

// Function to auto load existing awards
function loadAwards() {
  if (!fs.existsSync(awardPath)) {
    return {}
  }
  var contents = fs.readFileSync(awardPath, "utf8");
  var awards = JSON.parse(contents);
  for (var key in awards) {
    // Add options to dropdown lists
    addOption(presavedAwardArray1, eval(JSON.stringify(awards[key])), key);
    addOption(presavedAwardArray2, eval(JSON.stringify(awards[key])), key);
    addOption(dsAwardArray, eval(JSON.stringify(awards[key])), key);
  }
}
loadAwards()

/// function to grab row index
function getRowIndex(table) {
  var rowcount = table.rows.length;
  if (rowcount===2) {
    // start at 1 to skip the header
    var rowIndex = 1;
  } else {
    /// append row to table from the bottom
    var rowIndex = rowcount-1;
  }
  return rowIndex
}


//// initiate a tagify Award list
var awardArrayTagify = new Tagify(awardInputField, {
  delimiters: null,
  enforceWhitelist: true,
  whitelist: [],
  duplicates: false,
  dropdown : {
    classname : "color-blue",
    maxItems: Infinity,
    enabled   : 0,
    closeOnSelect : true
  }
})

// /// clear p messages upon typing new awards
// awardArrayTagify.on('input', e => {
//   document.getElementById("para-save-award-info").innerHTML = "";
// })

// Save grant information
addAwardBtn.addEventListener('click', function() {
  var tagifyArray = awardArrayTagify.value;
  if (tagifyArray.length === 0) {
    document.getElementById("para-save-award-info").innerHTML = "<span style='color:red'>Please choose an award!</span>"
  } else {
    document.getElementById("para-save-award-info").innerHTML = "Please wait..."
    if (awardArrayTagify.length === 0) {
      document.getElementById("para-save-award-info").innerHTML = "<span style='color: red;'>Please choose an award key!</span>";
    }
    var awardVal = [];
    for (var i = 0; i < tagifyArray.length; i++) {
      awardVal.push(tagifyArray[i].value)
    }

    var awardNoAray = [];
    for (var award of awardVal) {
      var awardNo = award.slice(0, award.indexOf(" ("));
      var keyValuePair = {"award-number": awardNo, "award-full-title": award}
      awardNoAray.push(keyValuePair)
    }
    // create empty milestone json files for newly added award
    createMetadataDir();
    var awardsJson = {};
    awardsJson = parseJson(awardPath);
    var duplicateList = [];
    var successfullyAddedList = [];

    for (var keyValuePair of awardNoAray) {
      if (keyValuePair["award-number"] in awardsJson) {
        duplicateList.push(keyValuePair["award-number"])
      } else {
        addOption(presavedAwardArray1, keyValuePair["award-full-title"], keyValuePair["award-number"]);
        addOption(presavedAwardArray2, keyValuePair["award-full-title"], keyValuePair["award-number"]);
        addOption(dsAwardArray, keyValuePair["award-full-title"], keyValuePair["award-number"]);
        awardsJson[keyValuePair["award-number"]] = keyValuePair["award-full-title"];
        successfullyAddedList.push(keyValuePair["award-number"])
      }
    }
    fs.writeFileSync(awardPath, JSON.stringify(awardsJson));
    if (duplicateList.length !== 0) {
      if (successfullyAddedList.length !== 0) {
        document.getElementById("para-save-award-info").innerHTML = "<span style='color: red;'>Award(s) already added to your existing awards: " + duplicateList.join(", ") + "</span><br><span color='color:black'>Award(s) successfully added: " + successfullyAddedList.join(", ") + ".</span>";
      } else {
        document.getElementById("para-save-award-info").innerHTML = "<span style='color: red;'>Award(s) already added to your existing awards: " + duplicateList.join(", ") + ".</span>";
      }
    } else {
      document.getElementById("para-save-award-info").innerHTML = "<span color='color:black'>Award(s) successfully added: " + successfullyAddedList.join(", ") + ".</span>";
    }
    awardArrayTagify.removeAllTags()
  }
})

/////// Delete an Award///////////
function deleteOptionByValue (dropdown, value) {
    for (var i = 0; i < dropdown.length; i++) {
        if (dropdown.options[i].value === value) {
            dropdown.remove(i)
        }
    }
    return null
}

deleteAwardBtn.addEventListener('click', function() {
  award = presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
  if (award==="Select") {
    document.getElementById("para-delete-award-status").innerHTML = "<span style='color: red;'>Please select an award number to delete</span>"
  } else {
    ipcRenderer.send('warning-delete-award')
  }
});
ipcRenderer.on('warning-delete-award-selection', (event, index) => {
  if (index === 0) {
    award = presavedAwardArray1.options[presavedAwardArray1.selectedIndex].value;
    var milestoneJson = parseJson(milestonePath);
    var awardsJson = parseJson(awardPath)
    var defaultedAwardJson = parseJson(defaultAwardPath)
    // check if award is default award
    if (award === defaultedAwardJson["default"]) {
      delete defaultedAwardJson["default"];
      }
    // check if award is in list
    if (award in awardsJson) {
      delete awardsJson[award];
      }
    // check if award is in list of milestones
    if (award in milestoneJson) {
      delete milestoneJson[award];
    }
    fs.writeFileSync(defaultAwardPath, JSON.stringify(defaultedAwardJson));
    fs.writeFileSync(awardPath, JSON.stringify(awardsJson));
    presavedAwardArray1.remove(presavedAwardArray1.selectedIndex);
    fs.writeFileSync(milestonePath, JSON.stringify(milestoneJson));
    // delete award in the next two award arrays
    deleteOptionByValue(presavedAwardArray2,award);
    deleteOptionByValue(dsAwardArray,award);
    awardArrayTagify.removeAllTags()
    document.getElementById("div-show-milestone-info-no-existing").style.display = "none";
    document.getElementById("div-show-current-milestones").style.display = "none";
    document.getElementById("para-delete-award-status").innerHTML = "<span style='color: black'>Deleted award number: " + award + "!" + "</span>"
    }
})

//// function to make a selected award the default award
function makeDefaultAward(award) {
  var defaultObj = {};
  var defaultObj = parseJson(defaultAwardPath);
  defaultObj["default"] = award
  fs.writeFileSync(defaultAwardPath, JSON.stringify(defaultObj));
}

/// When SODA launches, load default award
function loadDefaultAward() {
  var award;
  var defaultObj = parseJson(defaultAwardPath);
  try {
    award = defaultObj["default"]
    return award
  }
  catch (error) {
    log.error(error)
    console.log(error);
    return ""
  }
}

var defaultAward = loadDefaultAward()
loadMilestoneInfo(defaultAward)

function loadMilestoneInfo(awardNumber) {
  document.getElementById("para-milestone-document-info").innerHTML = ""
  document.getElementById("input-milestone-select").placeholder = "Select a file"

  if (awardNumber==="Select") {
    document.getElementById("div-show-milestone-info-no-existing").style.display = "none"
    document.getElementById("div-show-current-milestones").style.display = "none"
  } else {
    ///// first, make the selected award the default so next time SODA will auto-load it.
    makeDefaultAward(awardNumber)
    /// clear old table before loading new table
    while (milestoneArray.rows.length>1) {
      milestoneArray.deleteRow(1)
    };
    //// Start loading milestone table
    var awardJson = parseJson(awardPath);
    if (awardNumber in awardJson) {
      presavedAwardArray1.value = awardNumber
      ///// populate submission award drop-down
      for (var i = 0; i < presavedAwardArray2.length; i++) {
          if (presavedAwardArray2.options[i].value === awardNumber) {
              presavedAwardArray2.value = presavedAwardArray2.options[i].value
              changeAwardInput()
              break
          }
      };
      //// populate dataset contribution award drop-down
      for (var i = 0; i < dsAwardArray.length; i++) {
          if (dsAwardArray.options[i].value === awardNumber) {
              dsAwardArray.value = dsAwardArray.options[i].value
              changeAwardInputDsDescription()
              break
          }
      }
    }
    //// get content from milestone.json file and load it up
    var milestoneJson = parseJson(milestonePath);
    if (awardNumber in milestoneJson) {
      var milestoneObj = milestoneJson[awardNumber];
      // start at 1 to skip the header
      var rowIndex = 1;
      var milestoneKey = Object.keys(milestoneObj)
      for (var i=0;i<milestoneKey.length;i++){
        var milestone = milestoneObj[milestoneKey[i]];
        // var span = milestoneObj[milestoneKey[i]].length
        for (var j=0;j<milestone.length;j++) {
          // console.log(milestoneObj[milestoneKey[i]])
          var description = milestone[j]["Description of data"]
          var date = milestone[j]["Expected date of completion"]
          var row = milestoneArray.insertRow(rowIndex).outerHTML="<tr id='row-milestone"+rowIndex+"'style='color: #000000;'><td id='name-row-milestone"+rowIndex+"'>"+ milestoneKey[i] +"</td><td id='name-row-description"+rowIndex+"'>"+ description +"</td><td id='name-row-date"+rowIndex+"'>"+ date +"</td></tr>"
        }
        rowIndex++;
        }
      document.getElementById("div-show-current-milestones").style.display = "block";
      document.getElementById("div-show-milestone-info-no-existing").style.display = "block";
      document.getElementById("table-current-milestones").style.display = "block";
      document.getElementById("para-current-milestones").style.display = "none";
      return milestoneArray
    } else {
       document.getElementById("div-show-milestone-info-no-existing").style.display = "block";
       document.getElementById("div-show-current-milestones").style.display = "block";
       document.getElementById("table-current-milestones").style.display = "none";
       document.getElementById("para-current-milestones").style.display = "block";
       document.getElementById("para-current-milestones").innerHTML = "There is no existing milestone information. Please import your data deliverable document!";
     }
  }

}

///// Load Milestone info
/// check if no award is selected, then show no current milestones.
presavedAwardArray1.addEventListener('change', function() {
  var currentAward = presavedAwardArray1.value
  loadMilestoneInfo(currentAward)
})

// indicate to user that airtable records are being retrieved
function loadAwardData() {
  document.getElementById("para-save-award-info").innerHTML = ""
  document.getElementById("div-awards-load-progress").style.display = 'block'
  document.getElementById("para-add-airtable-key-status").innerHTML = "Checking..."
  ///// Construct table from data
  var awardResultArray = [];
  ///// config and load live data from Airtable
  var airKeyContent = parseJson(airtableConfigPath)
  if (Object.keys(airKeyContent).length === 0) {
    document.getElementById("div-awards-load-progress").style.display = 'none';
    document.getElementById("para-add-airtable-key-status").innerHTML =  "<span style='color: red;'>Please add an API Key to connect to Airtable!</span>"
    document.getElementById("para-save-award-info").innerHTML = "<span style='color: red;'>No Airtable API key found! Please connect to Airtable first!</span>";
  } else {
    var airKeyInput = airKeyContent["api-key"]
    var airKeyName = airKeyContent["key-name"]
    Airtable.configure({
        endpointUrl: 'https://' + airtableHostname,
        apiKey: airKeyInput
    });
    var base = Airtable.base('appiYd1Tz9Sv857GZ');
    base("sparc_members").select({
        view: 'All members (ungrouped)'
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
          if (record.get('Project_title')!==undefined) {
            item = record.get('SPARC_Award_#').concat(" (", record.get('Project_title'), ")");
            awardResultArray.push(item);
          }
        }),
      fetchNextPage();
    },
    function done(err) {
        document.getElementById("div-awards-load-progress").style.display = 'none';
        if (err) {
          document.getElementById("para-add-airtable-key-status").innerHTML = "<span style='color: red;'>Failed to load awards from Airtable. To add new SPARC award(s), please try re-connecting to Airtable under the Connect to Airtable tab above.</span>";
          document.getElementById("para-add-airtable-key-status").style.display = 'block';
          log.error(err);
          console.log(err);
          return;
        }
        else {
          // create set to remove duplicates
          var awardSet = new Set(awardResultArray)
          var resultArray = [...awardSet]
          awardArrayTagify.settings.whitelist = resultArray
          document.getElementById("div-search-for-awards").style.display = "block"
          document.getElementById("para-add-airtable-key-status").innerHTML = "<br><span style='color: black;'>Successfully connected to Airtable account " + airKeyName + "!" +smileyCan +"</span>";
        }
    });
  }
}

// Refresh publishing dataset status
bfRefreshAirtableStatusBtn.addEventListener('click', () => {
  loadAwardData()
})

///////////////// //////////////// //////////////// ////////////////
///////////////////////Submission file //////////////// ////////////////

function changeAwardInput() {
  document.getElementById("selected-milestone-date").value = "";
  document.getElementById("input-milestone-date").value = "";
  actionEnterNewDate('none')
  document.getElementById("para-save-submission-status").innerHTML = "";
  milestoneTagify.removeAllTags()
  milestoneTagify.settings.whitelist = [];
  removeOptions(descriptionDateInput);
  addOption(descriptionDateInput, "Select an option", "Select")
  descriptionDateInput.options[0].disabled = true;

  // removeOptions(document.getElementById("selected-milestone"))
  // addOption(document.getElementById('selected-milestone'), "Select an option", "Select")
  // addOption(document.getElementById('selected-milestone'), "Not specified in the Data Deliverables document", "Not specified in the Data Deliverables document")

  award = presavedAwardArray2.options[presavedAwardArray2.selectedIndex].value;
  var informationJson = parseJson(milestonePath);

  var completionDateArray = []
  var milestoneValueArray = []
  completionDateArray.push('Enter a date')

  /// when DD is provided
  if (award in informationJson) {
    var milestoneObj = informationJson[award];
    // Load milestone values once users choose an award number
    var milestoneKey = Object.keys(milestoneObj)

    /// add milestones to Tagify suggestion tag list and options to completion date dropdown
    for (var i=0;i<milestoneKey.length;i++) {
      milestoneValueArray.push(milestoneKey[i])
      for (var j=0;j<milestoneObj[milestoneKey[i]].length;j++){
        completionDateArray.push(milestoneObj[milestoneKey[i]][j]["Expected date of completion"])
      }
    }
    milestoneValueArray.push("Not specified in the Data Deliverables document")
  }
  milestoneTagify.settings.whitelist = milestoneValueArray
  for (var i=0; i<completionDateArray.length;i++) {
    addOption(descriptionDateInput, completionDateArray[i], completionDateArray[i])
  }
  descriptionDateInput.value = completionDateArray[1]
}

descriptionDateInput.addEventListener("change", function() {
  document.getElementById("input-milestone-date").value = ''
  if (descriptionDateInput.value === 'Enter a date') {
    actionEnterNewDate('flex')
  } else {
    actionEnterNewDate('none')
  }
})

const submissionDateInput = document.getElementById("input-milestone-date")

function actionEnterNewDate(action) {
  document.getElementById("div-submission-enter-different-date-1").style.display = action
  document.getElementById("div-submission-enter-different-date-2").style.display = action
  document.getElementById("div-submission-enter-different-date-3").style.display = action
}


/////// Populate Submission file fields from presaved information
presavedAwardArray2.addEventListener('change', changeAwardInput)

/// Generate submission file
generateSubmissionBtn.addEventListener('click', (event) => {
  document.getElementById("para-save-submission-status").innerHTML = ""
  awardVal = document.getElementById("presaved-award-list").value;
  milestoneVal = milestoneTagify.value;
  dateVal = document.getElementById("selected-milestone-date").value;

  var missingDateBool = dateVal === "Enter a date" && submissionDateInput.value === ''
  if (awardVal==='Select' || milestoneVal.length === 0 || dateVal === '' || missingDateBool) {
    document.getElementById("para-save-submission-status").innerHTML = "<span style='color: red;'>Please fill in all fields to generate!</span>"
  } else {
    ipcRenderer.send('open-folder-dialog-save-submission', "submission.xlsx")
  }
});

ipcRenderer.on('selected-metadata-submission', (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = path.join(dirpath[0], filename)
    if (fs.existsSync(destinationPath)) {
      var emessage = "File " + filename +  " already exists in " +  dirpath[0]
      ipcRenderer.send('open-error-metadata-file-exits', emessage)
    }
    else {
      var award = presavedAwardArray2.options[presavedAwardArray2.selectedIndex].value;
      var milestoneValue = []
      for (var i=0;i<milestoneVal.length;i++) {
        milestoneValue.push(milestoneVal[i].value)
      }
      var date;
      if (document.getElementById("selected-milestone-date").value === 'Enter a date') {
        date = document.getElementById("input-milestone-date").value;
      } else {
        date = document.getElementById("selected-milestone-date").value;
      }
      var json_arr = [];
      json_arr.push({
        "award": award,
        "date": date,
        "milestone": milestoneValue[0]
      });
      if (milestoneValue.length > 0) {
        for (var index = 1;index<milestoneValue.length;index++) {
          json_arr.push({
            "award": "",
            "date": "",
            "milestone": milestoneValue[index]
          });
        }
      }
      json_str = JSON.stringify(json_arr)
      if (dirpath != null){
        client.invoke("api_save_submission_file", destinationPath, json_str, (error, res) => {
          if(error) {
            var emessage = userError(error)
            log.error(error)
            console.error(error)
            document.getElementById("para-save-submission-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>";
          }
          else {
            document.getElementById("para-save-submission-status").innerHTML = "<span style='color: black ;'>" + "Done!" + smileyCan + "</span>"
          }
        })
    }
  }}
});

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

var keywordInput = document.getElementById('ds-keywords'),
keywordTagify = new Tagify(keywordInput, {
    duplicates: false,
    maxTags  : 5
})

var otherFundingInput = document.getElementById('ds-other-funding'),
otherFundingTagify = new Tagify(otherFundingInput, {
    duplicates: false,
})

var parentDSTagify = new Tagify(parentDSDropdown, {
  enforceWhitelist: true,
  whitelist: [],
  duplicates: false,
  dropdown : {
    maxItems: Infinity,
    enabled   : 0,
    closeOnSelect : true
  }
})


/// initiate tagify for contributor roles
var currentContributortagify = new Tagify(contributorRoles, {
    whitelist : ["PrincipleInvestigator", "Creator", "CoInvestigator", "DataCollector", "DataCurator", "DataManager", "Distributor", "Editor", "Producer", "ProjectLeader", "ProjectManager", "ProjectMember", "RelatedPerson", "Researcher", "ResearchGroup", "Sponsor", "Supervisor", "WorkPackageLeader", "Other"],
    dropdown : {
        classname : "color-blue",
        enabled   : 0,         // show the dropdown immediately on focus
        maxItems  : 25,
        // position  : "text",    // place the dropdown near the typed text
        closeOnSelect : true, // keep the dropdown open after selecting a suggestion
    },
    duplicates: false
});

var currentAffliationtagify = new Tagify(affiliationInput, {
    dropdown : {
        classname : "color-blue",
        enabled   : 0,         // show the dropdown immediately on focus
        maxItems  : 25,
        closeOnSelect : true, // keep the dropdown open after selecting a suggestion
    },
    duplicates: false
});

var completenessInput = document.getElementById('ds-completeness'),
completenessTagify = new Tagify(completenessInput, {
    whitelist : ["hasChildren", "hasNext"],
    enforceWhitelist: true,
    duplicates: false,
    maxTags   : 2,
    dropdown : {
      enabled   : 0,
      closeOnSelect : true
    }
})

//// get datasets and append that to option list for parent datasets
function getParentDatasets() {
  var parentDatasets = []
  for (var i=1, n=datasetDescriptionFileDataset.options.length;i<n;i++) {
    if (datasetDescriptionFileDataset.options[i].value) {
      parentDatasets.push(datasetDescriptionFileDataset.options[i].value);
    }
  }
  return parentDatasets
}

function clearCurrentConInfo() {
  document.getElementById("input-con-ID").value = "";
  document.getElementById("input-con-role").value = "";
  document.getElementById("input-con-affiliation").value = "";
  contactPerson.checked = false;
}

function changeAwardInputDsDescription() {
  clearCurrentConInfo()
  /// delete old table
  while (currentConTable.rows.length>1) {
    currentConTable.deleteRow(1)
  };
  removeOptions(dsContributorArray)
  addOption(dsContributorArray, "Select", "Select an option")
  descriptionDateInput.options[0].disabled = true;
  addOption(dsContributorArray, "Other collaborators", "Other collaborators not listed")
  var awardVal = dsAwardArray.options[dsAwardArray.selectedIndex].value
  var airKeyContent = parseJson(airtableConfigPath)
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"]
    Airtable.configure({
        endpointUrl: 'https://' + airtableHostname,
        apiKey: airKeyInput
    });
    var base = Airtable.base('appiYd1Tz9Sv857GZ');
    base("sparc_members").select({
      filterByFormula: `({SPARC_Award_#} = "${awardVal}")`
    }).eachPage(function page(records, fetchNextPage) {
        var awardValArray = [];
        records.forEach(function(record) {
          var item = record.get('Name');
          awardValArray.push(item);
        }),
      fetchNextPage();
      for (var i = 0; i < awardValArray.length; i++) {
          var opt = awardValArray[i];
          addOption(dsContributorArray, opt, opt)
      }
    }),
      function done(err) {
          if (err) {
            log.error(err)
            console.error(err); return;
          }
      }
  }
}

//////////////////////// Current Contributor(s) /////////////////////
function createCurrentConTable(table) {
  var conVal = dsContributorArray.options[dsContributorArray.selectedIndex].value
  var name;
  if (conVal === "Other collaborators not listed") {
    name = document.getElementById("input-con-others").value
  } else {
    name = conVal
  }
  var id = document.getElementById("input-con-ID").value
  var affiliation = currentAffliationtagify.value
  var role = currentContributortagify.value
  //// check if any field is empty
  if (name.length===0 || id.length===0 || affiliation.length===0 || role.length===0) {
    document.getElementById("para-save-contributor-status").innerHTML = "<span style='color: red;'>Please fill in all the fields to add!</span>"
  }
  else {
    var roleVal = []
    for (var i=0;i<role.length;i++) {
      roleVal.push(role[i].value)
    }
    var affliationVal = []
    for (var i=0;i<affiliation.length;i++) {
      affliationVal.push(affiliation[i].value)
    }
    var contactPersonStatus = "No"
    if (contactPerson.checked) {
      var contactPersonStatus = "Yes"
    }
    /// Construct table
    var rowcount = table.rows.length;
    if (rowcount===1) {
      // start at 1 to skip the header
      var rowIndex = 1;
    } else {
      /// append row to table from the bottom
      var rowIndex = rowcount;
    }

    // check for duplicates
    var duplicate = false
    for (var i=0; i<rowcount;i++){
      if (table.rows[i].cells[0].innerHTML===name) {
        duplicate = true
        break
      }
    }
    var existingContactPersonStatus = false;
    for (var i=0; i<rowcount;i++){
      if (table.rows[i].cells[4].innerHTML==="Yes") {
        existingContactPersonStatus = true
        break
      }
    }
    if (!duplicate) {

      if (contactPersonStatus==="Yes") {
          if (!existingContactPersonStatus) {
            roleVal.push("ContactPerson");
            var row = table.insertRow(rowIndex).outerHTML="<tr id='row-current-name"+rowIndex+"'style='color: #000000;'><td class='grab' id='name-row"+rowIndex+"'>"+name+"</td><td id='orcid-id-row"+rowIndex+"'>"+ id +"</td><td id='affiliation-row"+rowIndex+"'>"+ affliationVal.join('; ') +"</td><td id='role-row"+rowIndex+"'>"+ roleVal.join(', ')+"</td><td id='contact-person-row"+rowIndex+"'>"+contactPersonStatus+"</td><td><input type='button' value='Delete' class='demo-button-table' onclick='delete_current_con("+rowIndex+")'></td></tr>";
            document.getElementById("div-current-contributors").style.display = "block"
            return table

          } else {
            document.getElementById("para-save-contributor-status").innerHTML = "<span style='color: red;'>Contact person is already added below. Per SPARC requirements, only one contact person is allowed for a dataset.</span>"
          }

      } else {
            var row = table.insertRow(rowIndex).outerHTML="<tr  id='row-current-name"+rowIndex+"'style='color: #000000;'><td class='grab' id='name-row"+rowIndex+"'>"+name+"</td><td id='orcid-id-row"+rowIndex+"'>"+ id +"</td><td id='affiliation-row"+rowIndex+"'>"+ affliationVal.join('; ') +"</td><td id='role-row"+rowIndex+"'>"+ roleVal.join(', ')+"</td><td id='contact-person-row"+rowIndex+"'>"+contactPersonStatus+"</td><td><input type='button' value='Delete' class='demo-button-table' onclick='delete_current_con("+rowIndex+")'></td></tr>";

            document.getElementById("div-current-contributors").style.display = "block"
            return table
          }

    } else {
          document.getElementById("para-save-contributor-status").innerHTML = "<span style='color: red;'>Contributor already added!</span>"
      }
    }
}

//////////////////////// Article(s) and Protocol(s) /////////////////////
function createAdditionalLinksTable() {
  document.getElementById("para-save-link-status").innerHTML = ""
  var linkTable = document.getElementById("table-addl-links")
  var linkType = document.getElementById("select-misc-link").value
  var link = document.getElementById("input-misc-links").value
  var description = document.getElementById("input-misc-link-description").value


  /// Construct table
  var rowcount = linkTable.rows.length;
  if (rowcount===1) {
    // start at 1 to skip the header
    var rowIndex = 1;
  } else {
    /// append row to table from the bottom
    var rowIndex = rowcount;
  }

  //// check for duplicate links
  var duplicate = false
  for (var i=0; i<rowcount;i++){
    if (linkTable.rows[i].cells[1].innerHTML===link) {
      duplicate = true
      break
    }
  }

  /// Check for empty entry before adding to table
  var empty = false
  if (link==="" || linkType==="Select") {
    empty = true
  }

  /// construct table
  if (!empty) {
    if (!duplicate) {
      var row = linkTable.insertRow(rowIndex).outerHTML="<tr id='row-current-link"+rowIndex+"'style='color: #000000;'><td id='link-row"+rowIndex+"'>"+ linkType+"</td><td id='link-row"+rowIndex+"'>"+ link+"</td><td id='link-description-row"+rowIndex+"'>"+ description +"</td><td><input type='button' value='Delete' class='demo-button-table' onclick='delete_link("+rowIndex+")'></td></tr>";
      document.getElementById("div-current-additional-links").style.display = "block";
      return linkTable
    } else {
        document.getElementById("para-save-link-status").innerHTML = "<span style='color: red;'>Link already added below!</span>"
    }
  } else {
      document.getElementById("para-save-link-status").innerHTML = "<span style='color: red;'>Please specify a link to add!</span>"
  }

}

//// when link type is changed, clear other values
document.getElementById("select-misc-link").addEventListener("change", function() {
  document.getElementById("input-misc-links").value = ""
  document.getElementById("input-misc-link-description").value = ""
})

//// function to leave fields empty if no data is found on Airtable
function leaveFieldsEmpty(field, element) {
  if (field!==undefined) {
    element.value = field;
  } else {
    element.value = ''
  }
}

/// Create tags input for multi-answer fields
function createTagsInput(field) {
    return new Tagify(field)
}

//// When users click on adding description for each additional link
addAdditionalLinkBtn.addEventListener("click", function() {
  createAdditionalLinksTable()
})

//// When users click on "Add" to current contributors table
addCurrentContributorsBtn.addEventListener("click", function() {
  document.getElementById("para-save-contributor-status").innerHTML = "";
  if (dsContributorArray.options[dsContributorArray.selectedIndex].value === "Select an option") {
    document.getElementById("para-save-contributor-status").innerHTML = "<span style='color:red'>Please choose a contributor!</span>";
  } else {
      createCurrentConTable(currentConTable);
  }
})

$(currentConTable).mousedown(function (e) {
  var tr = $(e.target).closest('tr'), sy = e.pageY, drag;
  if ($(e.target).is('tr')) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass('grabbed');
  // var rowCount = $(currentConTable).length;
  // if( $(currentConTable).length > 2 ) {
    function move (e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function() {
      var s = $(this), i = s.index(), y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i!==0) {
          if (i < tr.index()) s.insertAfter(tr);
          else s.insertBefore(tr);
          return false;
          }
        }
      });
    }
  // }
  function up (e) {
    if (drag && index != tr.index()) {
      drag = false;
    }
    $(document).unbind('mousemove', move).unbind('mouseup', up);
    $(tr).removeClass('grabbed');
  }
  $(document).mousemove(move).mouseup(up);
});

/// load Airtable Contributor data
dsAwardArray.addEventListener("change", changeAwardInputDsDescription)

/// Auto populate once a contributor is selected
dsContributorArray.addEventListener("change", function(e) {
  ///clear old entries once a contributor option is changed
  document.getElementById("para-save-contributor-status").innerHTML = '';
  document.getElementById("input-con-ID").value = '';

  /// hide Other collaborators fields upon changing contributors
  document.getElementById("div-other-collaborators-1").style.display = "none"
  document.getElementById("div-other-collaborators-2").style.display = "none"
  document.getElementById("div-other-collaborators-3").style.display = "none"

  currentContributortagify.removeAllTags()
  currentAffliationtagify.removeAllTags()
  contactPerson.checked = false;

  var contributorVal = dsContributorArray.options[dsContributorArray.selectedIndex].value;
  if (contributorVal === "Other collaborators not listed") {
    document.getElementById("input-con-others").value = '';
    document.getElementById("div-other-collaborators-1").style.display = "flex"
    document.getElementById("div-other-collaborators-2").style.display = "flex"
    document.getElementById("div-other-collaborators-3").style.display = "flex"
  }
  else {
    currentContributortagify.destroy()
    currentAffliationtagify.destroy()
    document.getElementById("input-con-ID").disabled = true
    affiliationInput.disabled = true
    document.getElementById("input-con-role").disabled = true
    document.getElementById("input-con-ID").value = "Loading..."
    affiliationInput.value = "Loading..."
    document.getElementById("input-con-role").value = "Loading..."

    var airKeyContent = parseJson(airtableConfigPath)
    var airKeyInput = airKeyContent["api-key"]
    var airtableConfig = Airtable.configure({
      endpointUrl: 'https://' + airtableHostname,
      apiKey: airKeyInput
    });
    var base = Airtable.base('appiYd1Tz9Sv857GZ');
    base('sparc_members').select({
      filterByFormula: `({Name} = "${contributorVal}")`
    }).eachPage(function page(records, fetchNextPage) {
      var conInfoObj = {};
      records.forEach(function(record) {
        conInfoObj["ID"] = record.get('ORCID');
        conInfoObj["Role"] = record.get('Dataset_contributor_roles');
        conInfoObj["Affiliation"] = record.get('Institution');
      }),
      fetchNextPage();

      leaveFieldsEmpty(conInfoObj["ID"],document.getElementById("input-con-ID"));
      leaveFieldsEmpty(conInfoObj["Role"],document.getElementById("input-con-role"));
      leaveFieldsEmpty(conInfoObj["Affiliation"], affiliationInput);

      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(contributorRoles, {
          whitelist : ["PrincipleInvestigator", "Creator", "CoInvestigator", "DataCollector", "DataCurator", "DataManager", "Distributor", "Editor", "Producer", "ProjectLeader", "ProjectManager", "ProjectMember", "RelatedPerson", "Researcher", "ResearchGroup", "Sponsor", "Supervisor", "WorkPackageLeader", "Other"],
          dropdown : {
              classname : "color-blue",
              enabled   : 0,         // show the dropdown immediately on focus
              maxItems  : 25,
              // position  : "text",    // place the dropdown near the typed text
              closeOnSelect : true, // keep the dropdown open after selecting a suggestion
          },
          duplicates: false
        });
        /// initiate tagify for affiliations
        currentAffliationtagify = new Tagify(affiliationInput, {
            dropdown : {
                classname : "color-blue",
                enabled   : 0,         // show the dropdown immediately on focus
                maxItems  : 25,
                closeOnSelect : true, // keep the dropdown open after selecting a suggestion
            },
            duplicates: false
          });

      document.getElementById("input-con-ID").disabled = false
      affiliationInput.disabled = false
      document.getElementById("input-con-role").disabled = false
    }),
    function done(err) {
      if (err) {
        log.error(err)
        console.error(err); return;
      }
    }
  }
})

///// grab datalist name and auto-load current description
function showDatasetDescription(){
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = datasetDescriptionFileDataset.options[datasetDescriptionFileDataset.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    bfCurrentMetadataProgress.style.display = 'none'
    document.getElementById("ds-description").innerHTML = ""
  } else {
    client.invoke("api_bf_get_description", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
      } else {
        plainText = removeMd(res)
        document.getElementById("ds-description").innerHTML = plainText
      }
    })
  }
}

function emptyDSInfoEntries() {
  var fieldSatisfied = true;
  var inforObj = grabDSInfoEntries()
  var emptyFieldArray = []
  /// check for number of keywords
  for (var element in inforObj) {
    if (element==="keywords") {
      if (inforObj[element].length<3) {
        emptyFieldArray.push("at least 3 keywords")
        fieldSatisfied = false
      }
    } else {
        if (inforObj[element].length===0 || inforObj[element]==="Select dataset") {
          fieldSatisfied = false
          emptyFieldArray.push(element)
        }
    }
  }
  return [fieldSatisfied, emptyFieldArray]
}

function emptyLinkInfo() {
  var tableCurrentLinks = document.getElementById("table-addl-links")
  var fieldSatisfied = false;
  for (var i=0; i<tableCurrentLinks.rows.length; i++) {
    if (tableCurrentLinks.rows[i].cells[0].innerHTML==="Protocol URL or DOI*") {
      fieldSatisfied = true
    }
  }
  return fieldSatisfied
}

function emptyInfoEntries(element) {
  var fieldSatisfied = true
  // var funding = dsAwardArray.options[dsAwardArray.selectedIndex].value;
  if (element==="Select") {
    fieldSatisfied = false
  }
  return fieldSatisfied
}
function contactPersonCheck() {
  var contactPersonExists = false;
  var rowcount = currentConTable.rows.length
  for (var i=0; i<rowcount;i++){
    if (currentConTable.rows[i].cells[4].innerHTML==="Yes") {
      contactPersonExists = true
      break
    }
  }
  return contactPersonExists
}

function grabDSInfoEntries() {
  var rawName = datasetDescriptionFileDataset.options[datasetDescriptionFileDataset.selectedIndex];
  var name;
  if (rawName===undefined) {
    name = "N/A"
  } else {
    name = rawName.value
    if (name==="Select dataset") {
      name = "N/A"
    }
  }
  var description = document.getElementById("ds-description").value;
  var keywordArray = keywordTagify.value;
  var samplesNo = document.getElementById("ds-samples-no").value;
  var subjectsNo = document.getElementById("ds-subjects-no").value;
  return {"name": name, "description": description,
          "keywords": keywordArray, "number of samples": samplesNo,
          "number of subjects": subjectsNo}
}

function grabConInfoEntries() {
  var funding = dsAwardArray.options[dsAwardArray.selectedIndex].value;
  var acknowledgment = document.getElementById("ds-description-acknowledgments").value.trim();

  var contributorObj = {}
  var fundingArray = [];
  if (funding==="Select") {
    fundingArray = [""]
  } else {
    fundingArray = [funding]
  }
  /// other funding sources
  var otherFunding = otherFundingTagify.value
  for (var i=0;i<otherFunding.length;i++) {
    fundingArray.push(otherFunding[i].value)
  }
  /// grab entries from contributor table
  var rowcountCon = currentConTable.rows.length;
  var currentConInfo = []
  for (i=1; i<rowcountCon; i++) {
    var conRoleInfo = currentConTable.rows[i].cells[3].innerHTML;
    var conAffliationInfo = currentConTable.rows[i].cells[2].innerHTML;
    var myCurrentCon = {"conName": currentConTable.rows[i].cells[0].innerHTML.trim(),
                        "conID": currentConTable.rows[i].cells[1].innerHTML.trim(),
                        "conAffliation": conAffliationInfo,
                         "conRole": conRoleInfo,
                        "conContact": currentConTable.rows[i].cells[4].innerHTML
                        }
    currentConInfo.push(myCurrentCon);
    };
  contributorObj["funding"] = fundingArray
  contributorObj["acknowledgment"] = acknowledgment
  contributorObj["contributors"] = currentConInfo
  return contributorObj
}

function grabProtocolSection() {
  var miscObj = {}
  /// Additional link description
  var rowcountLink = document.getElementById("table-addl-links").rows.length;
  var addlLinkInfo = [];
  for (i=1; i<rowcountLink; i++) {
    var addlLink = {"link type": document.getElementById("table-addl-links").rows[i].cells[0].innerHTML,
                    "link": document.getElementById("table-addl-links").rows[i].cells[1].innerHTML,
                    "description": document.getElementById("table-addl-links").rows[i].cells[2].innerHTML}
    addlLinkInfo.push(addlLink)
  }
  //// categorize links based on types
  var originatingDOIArray = [];
  var protocolArray = [];
  var additionalLinkArray = [];
  for (var i=0; i<addlLinkInfo.length;i++) {
    if (addlLinkInfo[i]["link type"]==="Originating Article DOI") {
      originatingDOIArray.push(addlLinkInfo[i])
    } else if (addlLinkInfo[i]["link type"]==="Protocol URL or DOI*"){
      protocolArray.push(addlLinkInfo[i])
    } else {
      additionalLinkArray.push(addlLinkInfo[i])
    }
  }
  miscObj["Originating Article DOI"] = originatingDOIArray
  miscObj["Protocol URL or DOI*"] = protocolArray
  miscObj["Additional Link"] = additionalLinkArray
  return miscObj
}

function grabCompletenessInfo() {
  var completeness = completenessTagify.value;
  var parentDS = parentDSTagify.value;
  var completeDSTitle = document.getElementById("input-completeds-title").value;
  var optionalSectionObj = {};
  var completenessValueArray = []
  for (var i=0; i<completeness.length; i++) {
    completenessValueArray.push(completeness[i].value)
  }
  optionalSectionObj["completeness"] = completenessValueArray.join(", ")

  var parentDSValueArray = []
  for (var i=0; i<parentDS.length; i++) {
    parentDSValueArray.push(parentDS[i].value)
  }
  optionalSectionObj["parentDS"] = parentDSValueArray

  if (completeDSTitle.length===0) {
    optionalSectionObj["completeDSTitle"] = ""
  } else {
    optionalSectionObj["completeDSTitle"] = completeDSTitle;
  }
  return optionalSectionObj
}

//// upon choosing a dataset, populate current description
datasetDescriptionFileDataset.addEventListener("change", function() {
  document.getElementById("ds-description").innerHTML = "Loading..."
  document.getElementById("ds-description").disabled = true;
  syncDatasetDropdownOption(datasetDescriptionFileDataset)
  showDatasetDescription()
})

/// detect empty required fields and raise a warning
function detectEmptyRequiredFields(funding) {

  /// dataset info
  var dsContent = emptyDSInfoEntries()
  var dsSatisfied = dsContent[0]
  var dsEmptyField = dsContent[1]

  /// protocol info check
  var protocolSatisfied = emptyLinkInfo()

  /// contributor info
  var conEmptyField = []
  var conSatisfied = true
  var fundingSatisfied = emptyInfoEntries(funding)
  var contactPersonExists = contactPersonCheck()
  var contributorNumber = currentConTable.rows.length
  if (!fundingSatisfied) {
    conEmptyField.push("SPARC Award")
  }
  if (!contactPersonExists) {
    conEmptyField.push("One contact person")
  }
  if (contributorNumber===1) {
    conEmptyField.push("At least one contributor")
  }
  if (conEmptyField.length!==0) {
    conSatisfied = false
  }

  /// detect empty required fields and raise a warning
  var emptyArray = [dsSatisfied, conSatisfied, protocolSatisfied]
  var emptyMessageArray = ["- Missing required fields under Dataset Info section: " + dsEmptyField.join(", "), "- Missing required fields under Contributor Info section: " + conEmptyField.join(", "), "- Missing required item under Article(s) and Protocol(s) Info section: At least one protocol url"]
  var allFieldsSatisfied = true;
  errorMessage = []
  for (var i=0;i<emptyArray.length;i++) {
    if (!emptyArray[i]) {
      errorMessage.push(emptyMessageArray[i])
      allFieldsSatisfied = false;
    }
  }
  return [allFieldsSatisfied, errorMessage]
}


/////////////// Generate ds description file ///////////////////
////////////////////////////////////////////////////////////////
generateDSBtn.addEventListener('click', (event) => {
  document.getElementById("para-generate-description-status").innerHTML = ""
  var funding = dsAwardArray.options[dsAwardArray.selectedIndex].value
  var allFieldsSatisfied = detectEmptyRequiredFields(funding)[0]
  var errorMessage = detectEmptyRequiredFields(funding)[1]

  /// raise a warning if empty required fields are found
  if (allFieldsSatisfied===false) {
    ipcRenderer.send("warning-missing-items-ds-description", errorMessage.join("\n"))
  } else {
    ipcRenderer.send('open-folder-dialog-save-ds-description',"dataset_description.xlsx")
  }
})

ipcRenderer.on('show-missing-items-ds-description', (event, index) => {
  if (index === 0) {
    ipcRenderer.send('open-folder-dialog-save-ds-description',"dataset_description.xlsx")
  }
})

ipcRenderer.on('selected-metadata-ds-description', (event, dirpath, filename) => {
  if (dirpath.length > 0) {
    var destinationPath = path.join(dirpath[0],filename)
    if (fs.existsSync(destinationPath)) {
      var emessage = "File " + filename +  " already exists in " +  dirpath[0]
      ipcRenderer.send('open-error-metadata-file-exits', emessage)
    } else {
        document.getElementById("para-generate-description-status").innerHTML = "Please wait..."
        var datasetInfoValueArray = grabDSInfoEntries()

        //// process obtained values to pass to an array ///
        ///////////////////////////////////////////////////
        var keywordVal = []
        for (var i=0;i<datasetInfoValueArray["keywords"].length;i++) {
          keywordVal.push(datasetInfoValueArray["keywords"][i].value)
        }
        /// replace keywordArray with keywordVal array
        datasetInfoValueArray["keywords"] = keywordVal;

        //// push to all ds info values to dsSectionArray
        var dsSectionArray = [];
        for (let elementDS in datasetInfoValueArray) {
          dsSectionArray.push(datasetInfoValueArray[elementDS])
        }
        //// grab entries from contributor info section and pass values to conSectionArray
        var contributorObj = grabConInfoEntries()

        /// grab entries from other misc info section
        var miscObj = grabProtocolSection()

        /// grab entries from other optional info section
        var completenessSectionObj = grabCompletenessInfo()

        ///////////// stringify JSON objects //////////////////////
        json_str_ds = JSON.stringify(dsSectionArray);
        json_str_misc = JSON.stringify(miscObj);
        json_str_completeness = JSON.stringify(completenessSectionObj);
        json_str_con = JSON.stringify(contributorObj);

        /// get current, selected Blackfynn account
        var bfaccountname = bfAccountList.options[bfAccountList.selectedIndex].text

        /// call python function to save file
        document.getElementById("para-generate-description-status").style.display = "block"
        if (dirpath != null){
          client.invoke("api_save_ds_description_file", bfaccountname, destinationPath, json_str_ds, json_str_misc, json_str_completeness, json_str_con, (error, res) => {
            if(error) {
              var emessage = userError(error)
              log.error(error)
              console.error(error)
              document.getElementById("para-generate-description-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>";
            }
            else {
              document.getElementById("para-generate-description-status").innerHTML = "<span style='color: black ;'>" + "Done!" + smileyCan + "</span>"
            }
          })
        }
      }
     }
});

//////////////////////////End of Ds description section ///////////////////////////////////
//////////////// //////////////// //////////////// //////////////// ////////////////////////

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
//
// //derivative
const selectderivativeBtn = document.getElementById('button-select-derivative')
selectderivativeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-derivative')
})
const selectderivativeDirectoryBtn = document.getElementById('button-select-derivative-directory')
selectderivativeDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-derivative')
})
ipcRenderer.on('selected-derivative', (event, path) => {
    insertFileToTable(tableNotOrganized, path, 'derivative')
})

// //docs
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

// //primary
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

// //protocol
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
//
// //source
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
//
// // Drag and drop //
var holderCode = document.getElementById('code')
holderCode.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderCode.id
   dropAddToTable(event, myID)
})

var holderderivative = document.getElementById('derivative')
holderderivative.addEventListener("drop", (event)=> {
   event.preventDefault()
   var myID = holderderivative.id
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
//
// //Clear table //
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
  ]
})

// Character count for subtitle //
function countCharacters(textelement, pelement) {
  var textEntered = textelement.value;
  var counter = (256 - (textEntered.length));
  pelement.innerHTML = counter + ' characters remaining'
}

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

// // Action when user click on "Import" button //
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
//
// // Action when user click on "Preview" file organization button //
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
//
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

//// Select to generate a local dataset
selectnewDatasetBtn.addEventListener("click", function() {
  ipcRenderer.send('open-file-dialog-newdataset')
})
ipcRenderer.on('selected-new-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-info-new-dataset").innerHTML = ""
      document.getElementById("selected-new-dataset").placeholder = filepath[0];
    }
  }
})

importnewDatasetBtn.addEventListener("click", function() {
  var filepath = document.getElementById("selected-new-dataset").placeholder;
  if (filepath === "Select destination") {
    document.getElementById("para-info-new-dataset").innerHTML = "<span style='color: red ;'>" + "Please select a destination!</span>"
  } else {
    document.getElementById("para-info-new-dataset").innerHTML = "Selected!"
  }
})

// Generate dataset //
var displaySize = 1000

curateDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-curate").innerHTML = "Please wait..."
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-preview-current-ds").innerHTML = ""
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
    pathDatasetValue = selectnewDatasetBtn.placeholder
    newDatasetNameVar = newDatasetName.value
  } else if (bfUploadDirectlyStatus.checked) {
    destinationDataset = 'upload to blackfynn'
    pathDatasetValue = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
    newDatasetNameVar = bfUploadDatasetList.options[bfUploadDatasetList.selectedIndex].text
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
            if (totalDatasetSize < displaySize){
              var totalSizePrint = totalDatasetSize.toFixed(2) + ' B'
            } else if (totalDatasetSize < displaySize*displaySize){
              var totalSizePrint = (totalDatasetSize/displaySize).toFixed(2) + ' KB'
            } else if (totalDatasetSize < displaySize*displaySize*displaySize){
              var totalSizePrint = (totalDatasetSize/displaySize/displaySize).toFixed(2) + ' MB'
            } else {
              var totalSizePrint = (totalDatasetSize/displaySize/displaySize/displaySize).toFixed(2) + ' GB'
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


////////////////// Validate current datasets ////////////////////////////////

//// when users click on "Preview", show preview dataset in explorer
previewCurrentDsValidate.addEventListener("click", function() {
  document.getElementById("para-preview-current-ds").innerHTML = ""
  document.getElementById("para-preview-current-ds").innerHTML = 'Please wait...'
  previewCurrentDsValidate.disabled = true
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
        document.getElementById("para-preview-current-ds").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        document.getElementById("para-preview-current-ds").innerHTML = "Preview folder is available in a new file explorer window!";
      }
      previewCurrentDsValidate.disabled = false
  })
})

/////// Convert table content into json format for transferring to Python
function grabCurrentDSValidator() {
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]
  var jsonpathMetadata = tableToJsonMetadata(tableMetadata)
  jsonpath['main'] = jsonpathMetadata['metadata']
  return [jsonpath, jsondescription]
}

//// Check for empty JSON object and remove then
function checkJSONObj(jsonObj) {
  var empty = true
  for (var key of Object.keys(jsonObj)) {
    if (jsonObj[key].length !== 0) {
      empty = false
    }
    else{
      if (key !== 'main')
        delete jsonObj[key]
    }
  }
  return [empty, jsonObj]
}

///////// Clicking on Validate current DS
var checkCategory0 = "High-level folder structure"
var checkCategory1 = "High-level metadata files"
var checkCategory2 = "Sub-level organization"
var checkCategory3 = "submission file"
var checkCategory4 = "dataset_description file"
var checkCategory5 = "subjects file"
var checkCategory6 = "samples file"
var checkCategories =[checkCategory0, checkCategory1, checkCategory2, checkCategory3, checkCategory4, checkCategory5, checkCategory6]

validateCurrentDSBtn.addEventListener("click", function() {
  document.getElementById("div-validation-report-current").style.display = "none"
  document.getElementById("para-preview-current-ds").innerHTML = ""
  document.getElementById("para-validate-current-ds").innerHTML = ""
  document.getElementById("para-generate-report-current-ds").innerHTML = ""
  var jsonvect = grabCurrentDSValidator()
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]
  var outCheck = checkJSONObj(jsonpath)
  var empty = outCheck[0]
  if (empty === true) {
    document.getElementById("para-validate-current-ds").innerHTML = "<span style='color: red;'>Please add files or folders to your dataset first!</span>"
  } else {
    validateCurrentDSBtn.disabled = true
    if (manifestStatus.checked){
      validateSODAProgressBar.style.display = 'block'
      client.invoke("api_create_folder_level_manifest", jsonpath, jsondescription, (error, res) => {
        if (error) {
          console.error(error)
          log.error(error)
          var emessage = userError(error)
          document.getElementById("para-validate-current-ds").innerHTML = "<span style='color: red;'>" + emessage + "</span>"
          validateCurrentDSBtn.disabled = false
          validateSODAProgressBar.style.display = 'none'
        } else {
          var validatorInput = res
          localValidator(validatorInput)
        }
      })
    } else {
      var validatorInput = jsonpath
      console.log(validatorInput)
      localValidator(validatorInput)
    }
  }
})

function localValidator(validatorInput){
  var messageDisplay = ""
  client.invoke("api_validate_dataset", validatorInput, (error, res) => {
    if (error) {
      console.error(error)
      log.error(error)
      var emessage = userError(error)
      document.getElementById("para-validate-current-ds").innerHTML = "<span style='color: red;'>" + emessage + "</span>"
      validateCurrentDSBtn.disabled = false
      validateSODAProgressBar.style.display = 'none'
    } else {
      for (var i = 0; i < res.length; i++) {
        messageDisplay = errorMessageCategory(res[i], checkCategories[i], messageDisplay)
      }
      document.getElementById("div-validation-report-current").style.display = "block"
      document.getElementById("div-report-current").style.display = "block"
      document.getElementById("para-validate-current-ds").innerHTML = "Done, see report below!"
      validateCurrentDatasetReport.innerHTML = messageDisplay
      validateCurrentDSBtn.disabled = false
      validateSODAProgressBar.style.display = 'none'
    }
  })
}
///// Generate pdf validator file
currentDatasetReportBtn.addEventListener("click", function() {
  document.getElementById("para-generate-report-current-ds").innerHTML = ""
  ipcRenderer.send('save-file-dialog-validator-current')
})
ipcRenderer.on('selected-savedvalidatorcurrent', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-generate-report-current-ds").innerHTML = "Please wait..."
      currentDatasetReportBtn.disabled = true
      // obtain canvas and print to pdf
      const domElement = validateCurrentDatasetReport
      // obtain canvas and print to pdf
      html2canvas(domElement).then((canvas) => {
        const img = canvas.toDataURL('image/png', 1.0)
        var data = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(data, 'base64');

        // obtain canvas and print to pdf
        pdf = new PDFDocument({autoFirstPage:false})
        var image = pdf.openImage(buf)
        pdf.addPage({size: [image.width + 100, image.height + 25]});
        pdf.pipe(fs.createWriteStream(filepath))
        pdf.image(image, 25, 25);


        pdf.end()

        document.getElementById("para-generate-report-current-ds").innerHTML = "Report saved!"
        })
      }
  }
  currentDatasetReportBtn.disabled = false
})



/////////////////////// Validate local datasets //////////////////////////////

//// when users click on Import local dataset
document.getElementById("input-local-ds-select").addEventListener("click", function() {
  document.getElementById("para-generate-report-local-ds").innerHTML = ""
  document.getElementById("div-report-local").style.display = "none"
  ipcRenderer.send('open-file-dialog-validate-local-ds')
})
ipcRenderer.on('selected-validate-local-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-local-ds-info").innerHTML = ""
      document.getElementById("div-validation-report-local").style.display = "none"
      // used to communicate value to button-import-local-ds click eventlistener
      document.getElementById("input-local-ds-select").placeholder = filepath[0];
    } else {
      document.getElementById("para-local-ds-info").innerHTML = "<span style='color: red ;'>Please select a valid local dataset!</span>"
    }
    }
})

validateLocalDSBtn.addEventListener("click", function() {
  document.getElementById("para-local-ds-info").innerHTML = ""
  document.getElementById("para-generate-report-local-ds").innerHTML = ""
  var datasetPath = document.getElementById("input-local-ds-select").placeholder
  var messageDisplay = ""
  if (datasetPath==="Select a folder") {
    document.getElementById("para-local-ds-info").innerHTML = "<span style='color: red ;'>Please select a local dataset first</span>"
  } else  {
      if (datasetPath != null){
        validateLocalProgressBar.style.display = 'block'
        validateLocalDSBtn.disabled = true
        validatorInput = datasetPath
        client.invoke("api_validate_dataset", validatorInput, (error, res) => {
          if (error) {
            console.error(error)
            log.error(error)
            validateLocalProgressBar.style.display = 'none'
          } else {
            for (var i = 0; i < res.length; i++) {
              if (res[i] !== 'N/A'){
                messageDisplay = errorMessageCategory(res[i], checkCategories[i], messageDisplay)
              }
            }
            document.getElementById("div-validation-report-local").style.display = "block"
            document.getElementById("div-report-local").style.display = "block"
            document.getElementById("para-local-ds-info").innerHTML = "Done, see report below!"
            validateLocalDatasetReport.innerHTML = messageDisplay
            validateLocalProgressBar.style.display = 'none'
          }
        })
        validateLocalDSBtn.disabled = false
      }
  }
})

function validateMessageTransform(inString, classSelection, colorSelection) {
  //outString = inString.split("--").join("<br>")
  outString = inString.split("--")
  var msg = "<li class=" + classSelection + ">" + "<span style='color:"+ colorSelection + ";'>"
  msg += outString[0]
  msg += "</span>" + "</li>"
  if (outString.length > 1){
    msg += "<ul style='margin-top:-10px';>"
    for (var i = 1; i < outString.length; i++) {
      msg += "<li>" + "<span style='color:"+ colorSelection + ";'>" + outString[i] + "</span>" + "</li>"
    }
    msg += "</ul>"
  }
  return msg
}

function errorMessageGenerator(resitem, category, messageDisplay){
  if (resitem[category]){
    var messageCategory = resitem[category]
    if (messageCategory.length > 0){
      if (category === 'fatal'){
        var colorSelection = "red"
        var classSelection = 'bulleterror'
      } else if (category === 'warnings'){
        var colorSelection = "#F4B800"
        var classSelection = 'bulletwarning'
      } else if (category === 'pass'){
        var colorSelection = "green"
        var classSelection = 'bulletpass'
      }
      for (var i = 0; i < messageCategory.length; i++) {
        var message = validateMessageTransform(messageCategory[i], classSelection, colorSelection)
        messageDisplay += message
      }
    }
  }
 return messageDisplay
}

function errorMessageCategory(resitem, checkCategory, messageDisplay){
  messageDisplay += "<b>" + checkCategory + "</b>"
  messageDisplay += "<ul class='validatelist' id='" + checkCategory + "'>"
  var category = 'fatal'
  messageDisplay = errorMessageGenerator(resitem, category, messageDisplay)
  category = 'warnings'
  messageDisplay = errorMessageGenerator(resitem, category, messageDisplay)
  category = 'pass'
  messageDisplay = errorMessageGenerator(resitem, category, messageDisplay)
  messageDisplay += "</ul>"
 return messageDisplay
}



///// Generate pdf report for local validator report
localDatasetReportBtn.addEventListener("click", function() {
  document.getElementById("para-generate-report-local-ds").innerHTML = ""
  ipcRenderer.send('save-file-dialog-validator-local')
})
ipcRenderer.on('selected-savedvalidatorlocal', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-generate-report-local-ds").innerHTML = "Please wait..."
      localDatasetReportBtn.disabled = true
      const domElement = validateLocalDatasetReport
      html2canvas(domElement).then((canvas) => {

        const img = canvas.toDataURL('image/png', 1.0);
        var data = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(data, 'base64');

        // obtain canvas and print to pdf
        pdf = new PDFDocument({autoFirstPage:false})
        var image = pdf.openImage(buf)
        pdf.addPage({size: [image.width + 100, image.height + 25]});
        pdf.pipe(fs.createWriteStream(filepath))
        pdf.image(image, 25, 25);

        pdf.end()

        document.getElementById("para-generate-report-local-ds").innerHTML = "Report saved!"
        })
      }
  }
  localDatasetReportBtn.disabled = false
})

//////////////////////////////////
// Manage Dataset
//////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// This is the part where similar functions are being modified for the new ///////////////
//////////////////////////////////// Prepare dataset UI ////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////


/// Add all BF accounts to the dropdown list, and then choose by default one option ('global' account)
const curateBFaccountList = document.getElementById('bfallaccountlist');
const curateBFAccountLoad = document.getElementById("div-bf-account-load-progress-curate");
const curateBFAccountLoadStatus = document.getElementById('para-account-details-curate');
const curateBFAccountDetails = document.getElementById('para-account-details-curate');
const curateDatasetDropdown = document.getElementById('curatebfdatasetlist');

loadAllBFAccounts()

curateDatasetDropdown.addEventListener('change', function() {
  var curateSelectedbfdataset = curateDatasetDropdown.options[curateDatasetDropdown.selectedIndex].text;
  if (curateSelectedbfdataset === 'Select dataset') {
    document.getElementById('button-confirm-bf-dataset').style.display = "none";
    $('#button-confirm-bf-dataset').hide()
  } else{
    if ($("#Question-generate-dataset-BF-dataset").hasClass('prev')) {
      $('#button-confirm-bf-dataset').hide()
    } else {
      document.getElementById('button-confirm-bf-dataset').style.display = "flex";
      $('#button-confirm-bf-dataset').show()
    }
  }
})

curateBFaccountList.addEventListener('change', function() {
  curateBFAccountLoadStatus.innerHTML = "Loading account details...";
  curateDatasetDropdown.disabled = true;
  curateBFAccountLoad.style.display = 'block';
  // remove all datasets from current list
  removeOptions(curateDatasetDropdown);
  addOption(curateDatasetDropdown, "Loading", "Loading");

  $('#Question-generate-dataset-BF-account').removeClass('test2');
  $('#Question-generate-dataset-BF-account').removeClass('prev');

  $($('#Question-generate-dataset-BF-account').nextAll().find('.option-card.radio-button')).removeClass('checked');
  $($('#Question-generate-dataset-BF-account').nextAll()).removeClass('show');
  $($('#Question-generate-dataset-BF-account').nextAll()).removeClass('test2');
  $($('#Question-generate-dataset-BF-account').nextAll()).removeClass('prev');
  $($('#Question-generate-dataset-BF-account').nextAll()).css('pointer-events', 'auto');

  var curateSelectedbfaccount = curateBFaccountList.options[curateBFaccountList.selectedIndex].text

  if (curateSelectedbfaccount == 'Select') {
    curateBFAccountLoadStatus.innerHTML = "";
    curateBFAccountLoad.style.display = 'none';
  } else{
    var myitemselect = curateSelectedbfaccount
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    curateBFaccountList.value = curateSelectedbfaccount
    curateShowAccountDetails(curateBFaccountList)
    curateBFAccountLoadStatus.innerHTML = ""
    updateDatasetCurate(curateDatasetDropdown, curateBFaccountList);
  }
  curateDatasetDropdown.disabled = false;
})

function loadAllBFAccounts() {
  bfSelectAccountStatus.innerHTML = "Loading existing accounts..."
  bfAccountLoadProgress.style.display = 'block'
  bfAccountLoadProgressCurate.style.display = 'block'
  document.getElementById("para-filter-datasets-status").innerHTML = ""
  updateAllBfAccountList(curateBFaccountList)
}

function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  client.invoke("api_bf_dataset_account", bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text, (error, result) => {
      if (error) {
        log.error(error)
        console.log(error)
        var emessage = error
        curateBFAccountLoadStatus.innerHTML = "<span style='color: red'>" + emessage + "</span>"
      } else {
        // clear and populate dataset list
          populateDatasetDropdownCurate(datasetDropdown, result)
          // $('#curatebfdatasetlist').prop('selectedIndex', 1);
        }
    })
}

//// De-populate dataset dropdowns to clear options for CURATE
function populateDatasetDropdownCurate(datasetDropdown, datasetlist) {
  removeOptions(datasetDropdown);

  /// making the first option: "Select" disabled
  addOption(datasetDropdown, "Select dataset", "Select dataset");
  var options = datasetDropdown.getElementsByTagName("option");
  options[0].disabled = true;

  for (var myitem of datasetlist){
    var myitemselect = myitem.name;
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    datasetDropdown.appendChild(option)
  }
}

function updateAllBfAccountList(dropdown){
  // datasetPermissionList.disabled = true
  client.invoke("api_bf_account_list", (error, res) => {
  if(error) {
    log.error(error)
    console.error(error)
  } else {
    removeOptions(dropdown)
    for (myitem in res){
      var myitemselect = res[myitem]
      var option = document.createElement("option")
      option.textContent = myitemselect
      option.value = myitemselect
      dropdown.appendChild(option)
      curateBFAccountLoad.style.display = 'none'
      curateBFAccountLoadStatus.innerHTML = ""
      curateBFAccountLoad.style.display = 'none'
    }

    var options = dropdown.getElementsByTagName("option");
    options[0].disabled = true;

    if (res[0] === "Select" && res.length === 1) {
      curateBFAccountLoadStatus.innerHTML = "No existing accounts to load. Please add a new account!"
    }
    // refreshAllBfDatasetLists()
    refreshBfUsersList()
    refreshBfTeamsList(bfListTeams)

    client.invoke("api_bf_default_account_load", (error, result) => {
      if(error) {
        log.error(error)
        console.error(error)
      } else {
        if (result.length > 0) {
          var myitemselect = result[0];
          $('#bfallaccountlist option[value='+myitemselect+']').attr('selected','selected');
          curateShowAccountDetails(curateBFaccountList)
          curateBFAccountLoad.style.display = 'block'
          updateDatasetCurate(curateDatasetDropdown, curateBFaccountList)
        }
      }
    })
  }
})
}

function curateShowAccountDetails(dropdown){
  /// load and get permission for account
  client.invoke("api_bf_account_details", dropdown.options[dropdown.selectedIndex].value, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      curateBFAccountDetails.innerHTML = "<span style='color: red;'> " + error + "</span>"
      curateBFAccountLoad.style.display = 'none'
    } else {
        curateBFAccountDetails.innerHTML = res;
        curateBFAccountLoad.style.display = 'none'
        $('#div-bf-account-btns button').show();
      }
  })
}

///////////////////////////////END OF NEW CURATE UI CODE ADAPTATION ///////////////////////////////////////////////////


// Add existing bf account(s) to dropdown list
bfAccountCheckBtn.addEventListener('click', (event) => {
  datasetList = []
  bfAccountList.selectedIndex = 0
  bfSelectAccountStatus.innerHTML = "Loading existing accounts..."
  bfAccountLoadProgress.style.display = 'block'
  bfAccountLoadProgressCurate.style.display = 'block'
  datasetPermissionList.selectedIndex = 0
  document.getElementById("para-filter-datasets-status").innerHTML = ""
  updateBfAccountList()
  clearDatasetDropdowns()
})

bfUploadAccountCheckBtn.addEventListener('click', (event) => {
  bfSelectAccountStatus.innerHTML = "Please wait..."
  bfAccountLoadProgress.style.display = 'block'
  bfAccountLoadProgressCurate.style.display = 'block'
  datasetPermissionList.selectedIndex = 0
  document.getElementById("para-filter-datasets-status").innerHTML = ""
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
  bfSelectAccountStatus.innerHTML = "Loading account details..."
  bfAccountLoadProgress.style.display = 'block'
  currentDatasetPermission.innerHTML = ''
  datasetPermissionList.selectedIndex = 0

  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  if (selectedbfaccount == 'Select') {
    bfSelectAccountStatus.innerHTML = "";
    bfUploadSelectAccountStatus.innerHTML = "";
    bfAccountLoadProgress.style.display = 'none'
    datasetPermissionList.disabled = true
  } else{
    var myitemselect = selectedbfaccount
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    bfUploadAccountList.value = selectedbfaccount
    showAccountDetails(bfAccountLoadProgress)
  }
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
  // refreshAllBfDatasetLists()
  refreshBfUsersList()
  refreshBfTeamsList(bfListTeams)
})

// Refresh lists of bf datasets (in case user create it online) //
bfRefreshDatasetBtn.addEventListener('click', () => {
  currentDatasetPermission.innerHTML = ''
  // refreshAllBfDatasetLists()
})
bfUploadRefreshDatasetBtn.addEventListener('click', () => {
  // refreshAllBfDatasetLists()
})
bfRefreshDatasetMetadataBtn.addEventListener('click', () => {
  // refreshAllBfDatasetLists()
})
bfRefreshDatasetPermissionBtn.addEventListener('click', () => {
  // refreshAllBfDatasetLists()
})

bfRefreshDatasetStatusBtn.addEventListener('click', () => {
  // refreshAllBfDatasetLists()
})

bfRefreshDatasetRenameDatasetBtn.addEventListener('click', () => {
  // renameDatasetName.value = ""
  // refreshAllBfDatasetLists()
})


// Add new dataset folder (empty) on bf //
bfCreateNewDatasetBtn.addEventListener('click', () => {
  bfCreateNewDatasetBtn.disabled = true
  disableform(bfNewDatasetForm)
  bfCreateNewDatasetStatus.innerHTML = 'Adding...'
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  client.invoke("api_bf_new_dataset_folder", bfNewDatasetName.value, selectedbfaccount, (error, res) => {
    if (error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      bfCreateNewDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
      bfCreateNewDatasetBtn.disabled = false
      enableform(bfNewDatasetForm)
    } else {
      bfCreateNewDatasetStatus.innerHTML = 'Success: created dataset' + " '" + bfNewDatasetName.value + "'" + smileyCan
      currentDatasetPermission.innerHTML = ''
      bfCreateNewDatasetBtn.disabled = false
      addNewDatasetToList(bfNewDatasetName.value)
      datasetPermissionList.selectedIndex = "0"
      document.getElementById("para-filter-datasets-status").innerHTML = ""
      var numDatasets = refreshDatasetList()
      bfNewDatasetName.value = ""
      enableform(bfNewDatasetForm)
    }
  })
})

// Rename dataset on bf //
bfRenameDatasetBtn.addEventListener('click', () => {
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var currentDatasetName = bfDatasetListRenameDataset.options[bfDatasetListRenameDataset.selectedIndex].text
  var renamedDatasetName = renameDatasetName.value
  if (currentDatasetName ==='Select dataset'){
    emessage = 'Please select a valid dataset'
    bfRenameDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
  } else {
    bfRenameDatasetBtn.disabled = true
    bfRenameDatasetStatus.innerHTML = 'Renaming...'
    client.invoke("api_bf_rename_dataset", selectedbfaccount, currentDatasetName, renamedDatasetName, (error, res) => {
      if (error) {
        log.error(error)
        console.error(error)
        var emessage = userError(error)
        bfRenameDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>" + sadCan
        bfRenameDatasetBtn.disabled = false
      } else {
        renameDatasetInList(currentDatasetName, renamedDatasetName)
        refreshDatasetListChooseOption("#bfdatasetlist_renamedataset", renamedDatasetName)
        syncDatasetDropdownOption(bfDatasetListRenameDataset)
        renameDatasetName.value = renamedDatasetName
        bfRenameDatasetStatus.innerHTML = 'Success: renamed dataset' + " '" + currentDatasetName + "'" + ' to' + " '" + renamedDatasetName + "'"
        bfRenameDatasetBtn.disabled = false
      }
    })
  }
})

// Submit dataset to bf //
bfSubmitDatasetBtn.addEventListener('click', () => {
  document.getElementById("para-please-wait-manage-dataset").innerHTML = "Please wait..."
  document.getElementById("para-progress-bar-error-status").innerHTML = ""
  progressBarUploadBf.value = 0
  bfSubmitDatasetBtn.disabled = true
  pathSubmitDataset.disabled = true
  var err = false
  var completionStatus = 'Solving'
  document.getElementById("para-progress-bar-status").innerHTML = "Preparing files ..."
  var selectedbfaccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedbfdataset = bfDatasetList.options[bfDatasetList.selectedIndex].text
  client.invoke("api_bf_submit_dataset", selectedbfaccount, selectedbfdataset, pathSubmitDataset.placeholder, (error, res) => {
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
      pathSubmitDataset.disabled = false
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
            if (totalFileSize < displaySize){
              var totalSizePrint = totalFileSize.toFixed(2) + ' B'
            } else if (totalFileSize < displaySize*displaySize){
              var totalSizePrint = (totalFileSize/displaySize).toFixed(2) + ' KB'
            } else if (totalFileSize < displaySize*displaySize*displaySize){
              var totalSizePrint = (totalFileSize/displaySize/displaySize).toFixed(2) + ' MB'
            } else {
              var totalSizePrint = (totalFileSize/displaySize/displaySize/displaySize).toFixed(2) + ' GB'
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
        pathSubmitDataset.disabled = false
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
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  postCurationListChange()
  datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
  showDatasetDescription()
})

selectLocalDsSubmit.addEventListener("click", function() {
  ipcRenderer.send('open-file-dialog-submit-dataset')
})
ipcRenderer.on('selected-submit-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-info-local-submit").innerHTML = ""
      document.getElementById("selected-local-dataset-submit").placeholder = filepath[0];
    }
  }
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
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  postCurationListChange()
  datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
  showDatasetDescription()
})

// Rename dataset
bfDatasetListRenameDataset.addEventListener('change', () => {
  renameDatasetlistChange()
  syncDatasetDropdownOption(bfDatasetListRenameDataset)
  bfRenameDatasetStatus.innerHTML = ""
})

function renameDatasetlistChange(){
  if (bfDatasetListRenameDataset.value === 'Select dataset'){
    renameDatasetName.value = ""
  } else{
    renameDatasetName.value = bfDatasetListRenameDataset.value
  }
}

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
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  postCurationListChange()
  datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
  showDatasetDescription()
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
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-current").innerHTML = ""
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""

  bfListUsers.selectedIndex = 0
  bfListRoles.selectedIndex = 0
  bfListTeams.selectedIndex = 0
  bfListRolesTeam.selectedIndex = 0
  bfListUsersPI.selectedIndex = 0

  syncDatasetDropdownOption(bfDatasetListPermission)
})

function permissionDatasetlistChange(){
  bfCurrentPermissionProgress.style.display = 'block'
  showCurrentPermission()
}

function syncDatasetDropdownOption(dropdown) {
  if (dropdown===bfDatasetListPermission) {
    var listSelectedIndex = bfDatasetListPermission.selectedIndex
    bfDatasetListMetadata.selectedIndex = listSelectedIndex
    bfUploadDatasetList.selectedIndex = listSelectedIndex
    bfDatasetList.selectedIndex = listSelectedIndex
    bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
    bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
    bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
    bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
    bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
    datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
    metadataDatasetlistChange()
    permissionDatasetlistChange()
    datasetStatusListChange()
    renameDatasetlistChange()
    postCurationListChange()
    showDatasetDescription()
  } else if (dropdown===bfDatasetListRenameDataset) {
      var listSelectedIndex = bfDatasetListRenameDataset.selectedIndex
      bfDatasetListMetadata.selectedIndex = listSelectedIndex
      bfUploadDatasetList.selectedIndex = listSelectedIndex
      bfDatasetList.selectedIndex = listSelectedIndex
      bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
      bfDatasetListPermission.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
      datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
      metadataDatasetlistChange()
      permissionDatasetlistChange()
      datasetStatusListChange()
      showDatasetDescription()
  } else {
      var listSelectedIndex = datasetDescriptionFileDataset.selectedIndex
      bfDatasetListMetadata.selectedIndex = listSelectedIndex
      bfUploadDatasetList.selectedIndex = listSelectedIndex
      bfDatasetList.selectedIndex = listSelectedIndex
      bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
      bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
      bfDatasetListPermission.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
      bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
      metadataDatasetlistChange()
      permissionDatasetlistChange()
      datasetStatusListChange()
      showDatasetDescription()
  }
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
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  postCurationListChange()
  datasetDescriptionFileDataset.selectedIndex = listSelectedIndex
  showDatasetDescription()
})

function datasetStatusListChange(){
  bfCurrentDatasetStatusProgress.style.display = 'block'
  showCurrentDatasetStatus()
}

// Post-curation
bfDatasetListPostCurationCuration.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListPostCurationCuration.selectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  postCurationListChange()
})

bfDatasetListPostCurationPublish.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListPostCurationPublish.selectedIndex
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationConsortium.selectedIndex = listSelectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  postCurationListChange()
})

bfDatasetListPostCurationConsortium.addEventListener('change', () => {
  var listSelectedIndex = bfDatasetListPostCurationConsortium.selectedIndex
  bfDatasetListPostCurationPublish.selectedIndex = listSelectedIndex
  bfDatasetListPostCurationCuration.selectedIndex = listSelectedIndex
  bfDatasetListMetadata.selectedIndex = listSelectedIndex
  metadataDatasetlistChange()
  bfUploadDatasetList.selectedIndex = listSelectedIndex
  bfDatasetList.selectedIndex = listSelectedIndex
  bfDatasetListPermission.selectedIndex = listSelectedIndex
  permissionDatasetlistChange()
  bfDatasetListDatasetStatus.selectedIndex = listSelectedIndex
  datasetStatusListChange()
  bfDatasetListRenameDataset.selectedIndex = listSelectedIndex
  renameDatasetlistChange()
  postCurationListChange()
})

function postCurationListChange(){
  reserveDOIStatus.innerHTML = ""
  publishDatasetStatus.innerHTML = ""
  //showCurrentDOI()
  showPublishingStatus()
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

// Add subtitle //
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
      showDatasetDescription()
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

ipcRenderer.on('show-banner-image-below-1024', (event, index) => {
  if (index === 0) {
    uploadBannerImage()
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
      changeDatasetRolePI(selectedBfDataset)
      refreshDatasetListChooseOption("#bfdatasetlist_permission", selectedBfDataset)
      syncDatasetDropdownOption(bfDatasetListPermission)
    }
  })
  } else {
    bfCurrentPermissionProgress.style.display = 'none'
    enableform(bfPermissionForm)
  }
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

// Share with Curation Team //
bfAddPermissionCurationTeamBtn.addEventListener('click', () => {
  datasetPermissionStatusCurationTeam.innerHTML = ''
  ipcRenderer.send('warning-share-with-curation-team', formBannerHeight.value)
})

ipcRenderer.on('warning-share-with-curation-team-selection', (event, index) => {
  if (index === 0) {
    shareWithCurationTeam()
  }
})

function shareWithCurationTeam(){
  datasetPermissionStatusCurationTeam.innerHTML = 'Please wait...'
  bfPostCurationProgressCuration.style.display = 'block'
  // disableform(bfPermissionForm)
  bfAddPermissionCurationTeamBtn.disabled = true
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
      bfPostCurationProgressCuration.style.display = 'none'
      enableform(bfPermissionForm)
      bfAddPermissionCurationTeamBtn.disabled = false
    } else {
      showCurrentPermission()
      var selectedStatusOption = '03. Ready for Curation (Investigator)'
      client.invoke("api_bf_change_dataset_status", selectedBfAccount, selectedBfDataset, selectedStatusOption,
        (error, res) => {
        if(error) {
          log.error(error)
          console.error(error)
          var emessage = userError(error)
          datasetPermissionStatusCurationTeam.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
          bfPostCurationProgressCuration.style.display = 'none'
          bfAddPermissionCurationTeamBtn.disabled = false
        } else {
          datasetPermissionStatusCurationTeam.innerHTML = 'Success - Shared with Curation Team: provided them manager permissions and set dataset status to "Ready for Curation"'
          enableform(bfPermissionForm)
          showCurrentDatasetStatus()
          bfPostCurationProgressCuration.style.display = 'none'
          bfAddPermissionCurationTeamBtn.disabled = false
        }
      })
    }
  })
}

// Share with Consortium
bfShareConsortiumBtn.addEventListener('click', () => {
  shareConsortiumStatus.innerHTML = ""
  ipcRenderer.send('warning-share-with-consortium', formBannerHeight.value)
})

ipcRenderer.on('warning-share-with-consortium-selection', (event, index) => {
  if (index === 0) {
    shareWithConsortium()
  }
})

function shareWithConsortium(){
  shareConsortiumStatus.innerHTML = 'Please wait...'
  bfPostCurationProgressConsortium.style.display = 'block'
  // disableform(bfPostCurationForm)
  bfShareConsortiumBtn.disabled = true
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPostCurationConsortium.options[bfDatasetListPostCurationConsortium.selectedIndex].text
  var selectedTeam = 'SPARC Embargoed Data Sharing Group'
  var selectedRole = 'viewer'
  client.invoke("api_bf_add_permission_team", selectedBfAccount, selectedBfDataset, selectedTeam, selectedRole,
    (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      shareConsortiumStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfPostCurationProgressConsortium.style.display = 'none'
      // enableform(bfPostCurationForm)
      bfShareConsortiumBtn.disabled = false
    } else {
      showCurrentPermission()
      var selectedStatusOption = '11. Complete, Under Embargo (Investigator)'
      client.invoke("api_bf_change_dataset_status", selectedBfAccount, selectedBfDataset, selectedStatusOption,
        (error, res) => {
        if(error) {
          log.error(error)
          console.error(error)
          var emessage = userError(error)
          shareConsortiumStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
          bfPostCurationProgressConsortium.style.display = 'none'
          // enableform(bfPostCurationForm)
          bfShareConsortiumBtn.disabled = false
        } else {
          shareConsortiumStatus.innerHTML = 'Success - Shared with Consortium: provided viewer permissions to Consortium members and set dataset status to "Under Embargo"'
          showCurrentDatasetStatus()
          bfPostCurationProgressConsortium.style.display = 'none'
          // enableform(bfPostCurationForm)
          bfShareConsortiumBtn.disabled = false
        }
      })
    }
  })
}


// // Reserve DOI
// bfReserveDOIBtn.addEventListener('click', () => {
//   // disableform(bfPostCurationForm)
//   bfReserveDOIBtn.disabled = true
//   reserveDOIStatus.innerHTML = "Please wait..."
//   bfPostCurationProgressDOI.style.display = 'block'
//   var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
//   var selectedBfDataset = bfDatasetListPostCuration.options[bfDatasetListPostCuration.selectedIndex].text
//   client.invoke("api_bf_reserve_doi", selectedBfAccount, selectedBfDataset,
//     (error, res) => {
//     if(error) {
//       log.error(error)
//       console.error(error)
//       var emessage = userError(error)
//       reserveDOIStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
//       bfPostCurationProgressDOI.style.display = 'none'
//       // enableform(bfPostCurationForm)
//       bfReserveDOIBtn.disabled = false
//     } else {
//       reserveDOIStatus.innerHTML = res
//       showCurrentDOI()
//       // enableform(bfPostCurationForm)
//       bfReserveDOIBtn.disabled = false
//     }
//   })
// })


// Publish dataset
bfSubmitReviewDatasetBtn.addEventListener('click', () => {
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    reviewDatasetInfo.innerHTML = ""
    emessage = "Please select a valid dataset"
    publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
  } else {
    showPublishingStatus(submitReviewDatasetCheck)
  }
})

function submitReviewDatasetCheck(res){
  var reviewstatus = res[0]
  var publishingStatus = res[1]
  if (publishingStatus === 'PUBLISH_IN_PROGRESS'){
      emessage = "Your dataset is currently being published. Please wait until it is completed."
      publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
    } else if (reviewstatus ==='requested') {
      emessage = "Your dataset is already under review. Please wait until the Publishers within your organization make a decision."
      publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
    } else if (publishingStatus === 'PUBLISH_SUCCEEDED'){
      ipcRenderer.send("warning-publish-dataset-again")
    } else {
      ipcRenderer.send("warning-publish-dataset")
    }
}

ipcRenderer.on('warning-publish-dataset-selection', (event, index) => {
  if (index === 0) {
    submitReviewDataset()
  }
})

ipcRenderer.on('warning-publish-dataset-again-selection', (event, index) => {
  if (index === 0) {
    submitReviewDataset()
  }
})

function submitReviewDataset(){
  // disableform(bfPostCurationForm)
  bfSubmitReviewDatasetBtn.disabled = true
  bfRefreshPublishingDatasetStatusBtn.disabled = true
  bfWithdrawReviewDatasetBtn.disabled = true
  publishDatasetStatus.innerHTML = "Please wait..."
  bfPostCurationProgressPublish.style.display = 'block'
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  client.invoke("api_bf_submit_review_dataset", selectedBfAccount, selectedBfDataset,
    (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfPostCurationProgressPublish.style.display = 'none'
      // enableform(bfPostCurationForm)
      bfSubmitReviewDatasetBtn.disabled = false
      bfRefreshPublishingDatasetStatusBtn.disabled = false
      bfWithdrawReviewDatasetBtn.disabled = false
    } else {
      publishDatasetStatus.innerHTML = 'Success: Dataset has been submitted for review to the Publishers within your organization'
      bfPostCurationProgressPublish.style.display = 'none'
      showPublishingStatus('noClear')
    }
  })
}


//Withdraw dataset from review
bfWithdrawReviewDatasetBtn.addEventListener('click', () => {
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    reviewDatasetInfo.innerHTML = ""
    emessage = "Please select a valid dataset"
    publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
  } else {
    showPublishingStatus(withdrawDatasetCheck)
  }
})


function withdrawDatasetCheck(res){
  var reviewstatus = res[0]
  if (reviewstatus !== 'requested'){
      emessage = "Your dataset is not currently under review"
      publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
  } else {
    ipcRenderer.send("warning-withdraw-dataset")
  }
}

ipcRenderer.on('warning-withdraw-dataset-selection', (event, index) => {
  if (index === 0) {
    withdrawReviewDataset()
  }
})

function withdrawReviewDataset(){
  bfSubmitReviewDatasetBtn.disabled = true
  bfRefreshPublishingDatasetStatusBtn.disabled = true
  bfWithdrawReviewDatasetBtn.disabled = true
  publishDatasetStatus.innerHTML = "Please wait..."
  bfPostCurationProgressPublish.style.display = 'block'
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  client.invoke("api_bf_withdraw_review_dataset", selectedBfAccount, selectedBfDataset,
    (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      var emessage = userError(error)
      publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
      bfPostCurationProgressPublish.style.display = 'none'
      bfSubmitReviewDatasetBtn.disabled = false
      bfRefreshPublishingDatasetStatusBtn.disabled = false
      bfWithdrawReviewDatasetBtn.disabled = false
    } else {
      publishDatasetStatus.innerHTML = 'Success: Dataset has been withdrawn from review'
      showPublishingStatus('noClear')
    }
  })
}

// Refresh publishing dataset status
bfRefreshPublishingDatasetStatusBtn.addEventListener('click', () => {
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    reviewDatasetInfo.innerHTML = ""
    emessage = "Please select a valid dataset"
    publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
  } else {
    showPublishingStatus()
  }
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
  refreshDatasetList()
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

        // refresh dataset lists with filter
        client.invoke("api_get_username", selectedBfAccount, (error, res1) => {
          if(error) {
            log.error(error)
            console.error(error)
          } else {

              if (selectedRole === "owner" ) {
                for (var i=0; i<datasetList.length; i++) {
                  if (datasetList[i].name === selectedBfDataset) {
                    datasetList[i].role = "manager"
                    }
                  }
              refreshDatasetListChooseOption("#bfdatasetlist_permission", selectedBfDataset)
              syncDatasetDropdownOption(bfDatasetListPermission)
              }

              if (selectedUser === res1) {
                // then change role of dataset and refresh dataset list
                for (var i=0; i<datasetList.length; i++) {
                  if (datasetList[i].name === selectedBfDataset) {
                    datasetList[i].role = selectedRole.toLowerCase()
                    }
                }
                /// set permission back to All and refresh dataset list, and select the original dataset option
                refreshDatasetListChooseOption("#bfdatasetlist_permission", selectedBfDataset)
                syncDatasetDropdownOption(bfDatasetListPermission)
                }
              }
          })
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


function showAccountDetails(loadProgress){
  /// load and get permission for account
  client.invoke("api_bf_account_details", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
      bfSelectAccountStatus.innerHTML = "<span style='color: red;'> " + error + "</span>"
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
      loadProgress.style.display = 'none'
    } else {
        bfSelectAccountStatus.innerHTML = res;
        bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
        loadProgress.style.display = 'none'
        document.getElementById("div-permission-list").style.display = "block"
        document.getElementById("div-filter-datasets-progress").style.display = "block"
        document.getElementById("para-filter-datasets-status").innerHTML = "Loading datasets from your account ..."
        datasetPermissionList.disabled = true
        client.invoke("api_bf_dataset_account", bfAccountList.options[bfAccountList.selectedIndex].text, (error, result) => {
            if (error) {
              log.error(error)
              console.log(error)
              var emessage = error
              document.getElementById("para-filter-datasets-status").innerHTML = "<span style='color: red'>" + emessage + "</span>"
            } else {
                datasetList = []
                datasetList = result
                refreshDatasetList()
                document.getElementById("div-filter-datasets-progress").style.display = "none"
                datasetPermissionList.disabled = false
                document.getElementById("para-filter-datasets-status").innerHTML = "All datasets were loaded successfully in SODA's interface. " + smileyCan
              }
          })
        }
  })
}


////////////////////////////////DATASET FILTERING FEATURE/////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

function getDatasetList() {
  client.invoke("api_bf_account_details", bfAccountList.options[bfAccountList.selectedIndex].text, (error, res) => {
    if(error) {
      log.error(error)
      console.error(error)
    } else {
        datasetList = []
        datasetList = res["datasets"]
        var numberOfDatasets = refreshDatasetList()
    }
  })
}

/// rename datasets in place without calling Python
function renameDatasetInList(oldName, newName) {
  for (var i=0; i<datasetList.length; i++) {
    if (datasetList[i].name === oldName) {
      datasetList[i].name = newName
    }
  }
}

/// add new datasets to dataset List without calling Python to retrieve new list from Blackfynn
function addNewDatasetToList(newDataset) {
  datasetList.push({"name": newDataset, "role": "owner"})
}

/// change PI owner status to manager
function changeDatasetRolePI(selectedDataset) {
  for (var i=0; i<datasetList.length; i++) {
    if (datasetList[i].name === selectedDataset) {
      datasetList[i].role = "manager"
    }
  }
}


function refreshDatasetList() {
  var datasetPermission = datasetPermissionList.options[datasetPermissionList.selectedIndex].text

  var filteredDatasets = [];
  if (datasetPermission.toLowerCase()==="all") {
    for (var i=0; i<datasetList.length; i++) {
      filteredDatasets.push(datasetList[i].name)
    }
  } else {
      for (var i=0; i<datasetList.length; i++) {
        if (datasetList[i].role === datasetPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name)
        }
      }
  }

  filteredDatasets.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  populateDatasetDropdowns(filteredDatasets)
  parentDSTagify.settings.whitelist = getParentDatasets();

  return filteredDatasets.length
}

function refreshDatasetListChooseOption(dropdown, selectedDataset) {
  datasetPermissionList.selectedIndex = 0
  document.getElementById("para-filter-datasets-status").innerHTML = ""

  var datasetListSorted = datasetList.sort()

  var filteredDatasets = [];
  for (var i=0; i<datasetListSorted.length; i++) {
    filteredDatasets.push(datasetListSorted[i].name)
  }
  populateDatasetDropdowns(filteredDatasets)
  selectOptionDropdown(dropdown, selectedDataset)
}

function selectOptionDropdown(dropdown, selectedDataset) {
  var dropdownString = dropdown + " option"
  $(dropdownString).each(function() {
    if($(this).text() == selectedDataset) {
      $(this).attr('selected', 'selected');
    }
  });
}

//// De-populate dataset dropdowns to clear options
function clearDatasetDropdowns() {
  for (let list of [bfDatasetList, bfDatasetListMetadata, bfDatasetListMetadata, bfUploadDatasetList, bfDatasetListDatasetStatus, bfDatasetListRenameDataset, bfDatasetListPostCurationPublish, bfDatasetListPostCurationCuration, bfDatasetListPostCurationConsortium, datasetDescriptionFileDataset, bfDatasetListPermission]) {
    removeOptions(list)
    addOption(list, "Select dataset", "Select dataset")
  }
}

/// populate the dropdowns
function populateDatasetDropdowns(mylist) {
  clearDatasetDropdowns()
  for (myitem in mylist){
    var myitemselect = mylist[myitem]
    var option = document.createElement("option")
    option.textContent = myitemselect
    option.value = myitemselect
    bfDatasetList.appendChild(option)
    var option2 = option.cloneNode(true)
    var option3 = option.cloneNode(true)
    var option4 = option.cloneNode(true)
    var option5 = option.cloneNode(true)
    var option6 = option.cloneNode(true)
    var option7 = option.cloneNode(true)
    var option8 = option.cloneNode(true)
    var option9 = option.cloneNode(true)
    var option10 = option.cloneNode(true)

    bfDatasetListMetadata.appendChild(option2)
    bfDatasetListPermission.appendChild(option3)
    bfUploadDatasetList.appendChild(option4)
    bfDatasetListDatasetStatus.appendChild(option5)
    bfDatasetListRenameDataset.appendChild(option6)
    datasetDescriptionFileDataset.appendChild(option7)
    bfDatasetListPostCurationCuration.appendChild(option8)
    bfDatasetListPostCurationConsortium.appendChild(option9)
    bfDatasetListPostCurationPublish.appendChild(option10)
    renameDatasetlistChange()
    metadataDatasetlistChange()
    permissionDatasetlistChange()
    postCurationListChange()
    datasetStatusListChange()
  }
}

datasetPermissionList.addEventListener("change", function(e) {
  var datasetPermission = datasetPermissionList.options[datasetPermissionList.selectedIndex].text

  if (bfAccountList.options[bfAccountList.selectedIndex].text === "Select") {
    document.getElementById("para-filter-datasets-status").innerHTML = "<span style='color:red'>Please select an account first!</span>"
  } else {
    for (let list of [bfDatasetList, bfDatasetListMetadata, bfDatasetListMetadata, bfUploadDatasetList, bfDatasetListDatasetStatus, bfDatasetListRenameDataset, bfDatasetListPostCurationCuration, bfDatasetListPostCurationPublish, bfDatasetListPostCurationConsortium, datasetDescriptionFileDataset]) {
      removeOptions(list)
      addOption(list, "Select dataset", "Select dataset")
    }
    var numberOfDatasetsRetrieved = refreshDatasetList()
    document.getElementById("div-permission-list").style.display = "block"
    document.getElementById("div-filter-datasets-progress").style.display = "none"
    document.getElementById("para-filter-datasets-status").innerHTML = numberOfDatasetsRetrieved + " dataset(s) where you have " +  datasetPermission.toLowerCase() + " permissions were loaded successfully in SODA's interface. " + smileyCan
  }
})

////////////////////////////////////END OF DATASET FILTERING FEATURE//////////////////////////////

// function showUploadAccountDetails(loadProgress){
//   client.invoke("api_bf_account_details",
//     bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text, (error, res) => {
//     if(error) {
//       log.error(error)
//       console.error(error)
//       loadProgress.style.display = 'none'
//     } else {
//       bfUploadSelectAccountStatus.innerHTML = res["account-details"];
//       loadProgress.style.display = 'none'
//     }
//   })
// }

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
          bfSelectAccountStatus.innerHTML = "Loading Blackfynn account details..."
          // refreshAllBfDatasetLists()
          refreshBfUsersList()
          refreshBfTeamsList(bfListTeams)
      } else {
          var myitemselect = "Select"
          var option = bfAccountList.options[0]
          option.textContent = myitemselect
          option.value = myitemselect
          bfAccountList.appendChild(option)
          var selectedbfaccount = bfUploadAccountList.options[bfUploadAccountList.selectedIndex].text
          datasetPermissionList.disabled = true
      }
    }
  })
}

function updateBfAccountList(){
  datasetPermissionList.disabled = true
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
      datasetPermissionList.disabled = false
    }
    if (res[0] === "Select" && res.length === 1) {
      bfSelectAccountStatus.innerHTML = "No existing accounts to switch. Please add a new account!"
      bfUploadSelectAccountStatus.innerHTML = bfSelectAccountStatus.innerHTML
      datasetPermissionList.disabled = true
    }
    // refreshAllBfDatasetLists()
    refreshBfUsersList()
    refreshBfTeamsList(bfListTeams)
})
}

function showCurrentDOI(){
  currentDOI.value = "Please wait..."
  reserveDOIStatus.innerHTML = ""
  bfPostCurationProgressDOI.style.display = 'block'
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPostCurationDOI.options[bfDatasetListPostCurationDOI.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    currentDOI.value = '-------'
    bfPostCurationProgressDOI.style.display = 'none'
  } else {
    client.invoke("api_bf_get_doi", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        currentDOI.value = '-------'
        var emessage = userError(error)
        reserveDOIStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        bfPostCurationProgressDOI.style.display = 'none'
      } else {
        currentDOI.value = res
        bfPostCurationProgressDOI.style.display = 'none'
      }
    })
  }
}


function showPublishingStatus(callback){
  reviewDatasetInfo.innerHTML = "Please wait..."
  if (callback == 'noClear'){
    var nothing
  } else {
    publishDatasetStatus.innerHTML = ""
  }
  bfPostCurationProgressPublish.style.display = 'block'
  bfSubmitReviewDatasetBtn.disabled = true
  bfRefreshPublishingDatasetStatusBtn.disabled = true
  bfWithdrawReviewDatasetBtn.disabled = true
  var selectedBfAccount = bfAccountList.options[bfAccountList.selectedIndex].text
  var selectedBfDataset = bfDatasetListPostCurationPublish.options[bfDatasetListPostCurationPublish.selectedIndex].text
  if (selectedBfDataset === 'Select dataset'){
    reviewDatasetInfo.innerHTML = ''
    bfPostCurationProgressPublish.style.display = 'none'
    bfSubmitReviewDatasetBtn.disabled = false
    bfRefreshPublishingDatasetStatusBtn.disabled = false
    bfWithdrawReviewDatasetBtn.disabled = false
  } else {
    client.invoke("api_bf_get_publishing_status", selectedBfAccount, selectedBfDataset,
    (error, res) => {
      if(error) {
        log.error(error)
        console.error(error)
        reviewDatasetInfo.innerHTML = ''
        var emessage = userError(error)
        publishDatasetStatus.innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        bfPostCurationProgressPublish.style.display = 'none'
        bfSubmitReviewDatasetBtn.disabled = false
        bfRefreshPublishingDatasetStatusBtn.disabled = false
        bfWithdrawReviewDatasetBtn.disabled = false
      } else {
        reviewDatasetInfo.innerHTML = publishStatusOutputConversion(res)
        bfPostCurationProgressPublish.style.display = 'none'
        bfSubmitReviewDatasetBtn.disabled = false
        bfRefreshPublishingDatasetStatusBtn.disabled = false
        bfWithdrawReviewDatasetBtn.disabled = false

        if (callback === submitReviewDatasetCheck || callback === withdrawDatasetCheck){
          callback(res)
        }

      }
    })
  }
}


function publishStatusOutputConversion(res){
  var reviewStatus = res[0]
  var publishStatus = res[1]

  var outputMessage = ""
  if (reviewStatus === 'draft' || reviewStatus === 'cancelled'){
    outputMessage += 'Dataset is not under review currently'
  } else if (reviewStatus === 'requested'){
    outputMessage += 'Dataset is currently under review by your Publishing Team'
  } else if (reviewStatus === 'rejected'){
    outputMessage += 'Dataset has been rejected by your Publishing Team and may require revision'
  } else if (reviewStatus === 'accepted'){
    outputMessage += 'Dataset has been accepted for publication by your Publishing Team'
  }

  // outputMessage += '<br><br>'
  // if (publishStatus === 'NOT_PUBLISHED'){
  //   outputMessage += 'Dataset has not been published yet'
  // } else if (publishStatus === 'PUBLISH_IN_PROGRESS'){
  //   outputMessage += 'Dataset is being published. Publishing times can vary based on the size of your dataset. Your dataset will remain locked until publishing has completed.'
  // } else if (publishStatus === 'PUBLISH_FAILED'){
  //   outputMessage += 'Dataset failed to publish. Your Publishing team is made aware and will try again.'
  // } else if (publishStatus === 'PUBLISHED'){
  //   outputMessage += 'Dataset has been published'
  // }

  return outputMessage

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
  var contentDataset = fs.readdirSync(pathDatasetVal)
  var listPathFilesinDataset = []
  for (var i = 0; i<contentDataset.length; i++) {
    var contentName = contentDataset[i]
    var contentPath = path.join(pathDatasetVal, contentName)
    if (fs.lstatSync(contentPath).isDirectory()){
      var filesInFolder = fs.readdirSync(contentPath)
      var listPathFilesinFolder = []
      for (var j = 0; j<filesInFolder.length; j++) {
        var fileNameInFolder = filesInFolder[j]
        listPathFilesinFolder.push(path.join(contentPath, fileNameInFolder))
      }
      jsonvar[contentName] = listPathFilesinFolder
    }
    else{
      listPathFilesinDataset.push(contentPath)
    }
  }
  jsonvar['main'] = listPathFilesinDataset
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

const allowedMedataFiles = ['submission.xlsx', 'submission.csv', 'submission.json',
  'dataset_description.xlsx', 'dataset_description.csv', 'dataset_description.json',
  'subjects.xlsx', 'subjects.csv', 'subjects.json',
  'samples.xlsx', 'samples.csv', 'samples.json',
  'README.txt', 'CHANGES.txt']

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

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var backFolder = []
var forwardFolder =[]

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"]
var highLevelFolderToolTip = {
  "code": "code: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  "derivative": "derivative: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  "docs": "docs: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  "source": "source: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  "primary": "primary: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  "protocol": "protocol: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>."
}

var datasetStructureJSONObj = {
  "folders":{},
  "files":{},
  "type":""
}

listItems(datasetStructureJSONObj, '#items')
getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)

var sodaJSONObj = {
  "bf-account-selected": {
        "account-name": "",
    },
    "bf-dataset-selected": {
        "dataset-name": "",
    },
    "dataset-structure": {"folders": {}, "files": {}},
    "metadata-files": {},
    "generate-dataset": {
        "destination": "",
        "path": "",
        "dataset-name": "",
        "if-existing": "",
        "generate-option": ""
    }
}


/// back button
organizeDSbackButton.addEventListener("click", function() {
  // var currentPath = organizeDSglobalPath.value.trim()
  // if (currentPath !== "/") {
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = getGlobalPath(organizeDSglobalPath)
    if (filtered.length === 1) {
      organizeDSglobalPath.value = filtered[0] + "/"
    } else {
      organizeDSglobalPath.value = filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = datasetStructureJSONObj;
    for (var item of filtered.slice(1,filtered.length-1)) {
      myPath = myPath["folders"][item]
    }
    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // reconstruct div with new elements
    listItems(myPath, '#items')
    getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
  }
})

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if(slashCount !== 1) {
    var newFolderName = "New Folder"
    // show prompt for name
    bootbox.prompt({
      title: "Add new folder...",
      message: "Enter a name below:",
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

            /// update datasetStructureJSONObj
            var currentPath = organizeDSglobalPath.value
            var jsonPathArray = currentPath.split("/")
            var filtered = jsonPathArray.slice(1).filter(function (el) {
              return el != "";
            });

            var myPath = getRecursivePath(filtered, datasetStructureJSONObj)
            // update Json object with new folder created
            var renamedNewFolder = newFolderName
            myPath["folders"][renamedNewFolder] = {"folders": {}, "files": {}, "type":"virtual"}

            listItems(myPath,'#items')
            getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
            hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
            hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
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
        jsonObject["folders"][element] = {"type": "local", "folders": {}, "files": {}, "action":["new"]}
        populateJSONObjFolder(jsonObject["folders"][element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject["files"][element] = {"path": addedElement, "description": "", "additional-metadata":"", "type": "local", "action":["new"]}
        }
    });
}


function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    var mouseX = ev.pageX - 200;
    var mouseY = ev.pageY;
    fullNameValue.style.display = "block";
    fullNameValue.innerHTML = text
    $('.hoverFullName').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
  }
}

/// hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText
    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// // If the document is clicked somewhere
// document.addEventListener('onmouseover', function(e){
//   if (e.target.classList.value !== "myFile") {
//     hideFullPath()
//   } else {
//     hoverForPath(e)
//   }
// });

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
function showDetailsFile() {
  $('.div-display-details.file').toggleClass('show');
  // $(".div-display-details.folders").hide()
}

function showBFAddAccountBootbox() {
  bootbox.confirm({
    title: "Adding Blackfynn account<br><span style='font-size:12px'>Please enter your Blackfynn API key and name below:</span>",
    message: "<form><div class='form-group row'><label for='bootbox-key-name' class='col-sm-3 col-form-label'> Key name:</label><div class='col-sm-9'><input type='text' id='bootbox-key-name' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-key' class='col-sm-3 col-form-label'> API Key:</label><div class='col-sm-9'><input id='bootbox-api-key' type='text' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-secret' class='col-sm-3 col-form-label'> API Secret:</label><div class='col-sm-9'><input id='bootbox-api-secret'  class='form-control' type='password' /></div></div></form>",
    buttons: {
        cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
            label: '<i class="fa fa-check"></i> Add'
        }
    },
    centerVertical: true,
    callback: function (result) {
        console.log('This was logged in the callback: ' + result);
    }
});
}
//   var bootboxHtml = $('#js-exampleDiv').html().replace('js-exampleForm', 'js-bootboxForm');
//   bootboxHtml.title = "Adding new Blackfynn account";
//   bootbox.confirm(bootboxHtml, function(result) {
//     console.log($('#bootbox-api-key', '.js-bootboxForm').val());
//     console.log($('#bootbox-api-secret', '.js-bootboxForm').val());
//     console.log($('#bootbox-key-name', '.js-bootboxForm').val());
//   });
// }

// function showDetailsFolder() {
//   $('.div-display-details.folders').toggleClass('show');
//   $(".div-display-details.file").hide()
// }

/// import progress
// importProgress.addEventListener("click", function() {
//   ipcRenderer.send('open-file-organization-dialog')
// });
//
// ipcRenderer.on('selected-file-organization', (event,filePath) => {
//   organizeDSglobalPath.value = "/"
//   if (filePath !== undefined) {
//     var progressData = fs.readFileSync(filePath[0])
//     var content = JSON.parse(progressData.toString())
//     var contentKeys = Object.keys(content["folders"])
//     if (checkSubArrayBool(highLevelFolders, contentKeys)) {
//       datasetStructureJSONObj = content
//     } else {
//       bootbox.alert({
//         message: "<p>Please import a valid file organization!</p>",
//         centerVertical: true
//       })
//       return
//     }
//     var bootboxDialog = bootbox.dialog({message: '<p><i class="fa fa-spin fa-spinner"></i>Importing file organization...</p>'})
//     bootboxDialog.init(function(){
//       listItems(datasetStructureJSONObj, '#items')
//       getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
//       hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
//       hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
//       bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully loaded!");
//     })
//   }
// })
//
// // save progress
// saveProgress.addEventListener("click", function() {
//   ipcRenderer.send('save-file-saveorganization-dialog');
// })
// ipcRenderer.on('selected-fileorganization', (event, filePath) => {
//   if (filePath.length > 0){
//     if (filePath !== undefined){
//       fs.writeFileSync(filePath, JSON.stringify(datasetStructureJSONObj))
//       bootbox.alert({
//         message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully saved file organization.",
//         centerVertical: true
//       })
//     }
//   }
// })
//
// /// reset progress
// resetProgress.addEventListener("click", function() {
//   bootbox.confirm({
//     title: "Reset progress",
//     message: "<p>Are you sure you want to clear the current file organization?</p>",
//     centerVertical: true,
//     callback: function(r) {
//       if (r!==null) {
//         organizeDSglobalPath.value = "/"
//         datasetStructureJSONObj = {
//           "type": "virtual",
//           "folders": {
//             "code": {"type": "virtual", "folders": {}, "files": {}},
//             "derivative": {"type": "virtual", "folders": {}, "files": {}},
//             "primary": {"type": "virtual", "folders": {}, "files": {}},
//             "source": {"type": "virtual", "folders": {}, "files": {}},
//             "docs": {"type": "virtual", "folders": {}, "files": {}},
//             "protocols": {"type": "virtual", "folders": {}, "files": {}}
//           },
//           "files": {}
//         }
//         listItems(datasetStructureJSONObj, '#items')
//         getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
//         hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
//         hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
//       }
//     }
//   })
// })


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

function changeStepOrganize(step) {
    if (step.id==="button-organize-prev") {
      document.getElementById("div-step-1-organize").style.display = "block";
      document.getElementById("div-step-2-organize").style.display = "none";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders"
      organizeNextStepBtn.style.display = "block"
      organizePrevStepBtn.style.display = "none"
    } else {
      document.getElementById("div-step-1-organize").style.display = "none";
      document.getElementById("div-step-2-organize").style.display = "block";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Generate dataset"
      organizePrevStepBtn.style.display = "block"
      organizeNextStepBtn.style.display = "none"
    }
}

var newDSName;
function generateDataset(button) {
  document.getElementById("para-organize-datasets-success").style.display = "none"
  document.getElementById("para-organize-datasets-error").style.display = "none"
  if (button.id==="btn-generate-locally") {
    $("#btn-generate-BF").removeClass("active");
    $(button).toggleClass("active");
    bootbox.prompt({
      title: 'Generate dataset locally',
      message: 'Enter a name for the dataset:',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Confirm and Choose location',
              className: 'btn-success'
          }
      },
      centerVertical: true,
      callback: function (r) {
        if(r !== null && r.trim() !== ""){
          newDSName = r.trim()
          ipcRenderer.send('open-file-dialog-newdataset')
          }
        }
      })
    } else {
        $("#btn-generate-locally").removeClass("active");
        $(button).toggleClass("active");
    }
}

ipcRenderer.on('selected-new-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-organize-datasets-loading").style.display = "block"
      document.getElementById("para-organize-datasets-loading").innerHTML = "<span>Please wait...</span>"
      client.invoke("api_generate_dataset_locally", "create new", filepath[0], newDSName, datasetStructureJSONObj, (error, res) => {
        document.getElementById("para-organize-datasets-loading").style.display = "none"
        if(error) {
          log.error(error)
          console.error(error)
          document.getElementById("para-organize-datasets-success").style.display = "none"
          document.getElementById("para-organize-datasets-error").style.display = "block"
          document.getElementById("para-organize-datasets-error").innerHTML = "<span> " + error + "</span>";
        } else {
          document.getElementById("para-organize-datasets-error").style.display = "none"
          document.getElementById("para-organize-datasets-success").style.display = "block"
          document.getElementById("para-organize-datasets-success").innerHTML = "<span>Generated successfully!</span>";
        }
    })
  }
}
})


//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function() {
   ipcRenderer.send('open-files-organize-datasets-dialog')
 })
 ipcRenderer.on('selected-files-organize-datasets', (event, path) => {
   var filtered = getGlobalPath(organizeDSglobalPath)
   var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
   addFilesfunction(path, myPath, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
 })

organizeDSaddFolders.addEventListener("click", function() {
  ipcRenderer.send('open-folders-organize-datasets-dialog')
})
ipcRenderer.on('selected-folders-organize-datasets', (event, path) => {
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  addFoldersfunction(path, myPath)
})

function addFoldersfunction(folderArray, currentLocation) {

  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount === 1) {
    bootbox.alert({
      message: "Other non-SPARC folders cannot be added to this dataset level!",
      centerVertical: true
    })
  } else {

    // check for duplicates/folders with the same name
    for (var i=0; i<folderArray.length;i++) {
      var baseName = path.basename(folderArray[i])
      var duplicate = false;
      for (var objKey in currentLocation["folders"]) {
        if (baseName === objKey) {
          duplicate = true
          break
        }
      }
      if (duplicate) {
        bootbox.alert({
          message: 'Duplicate folder name: ' + baseName,
          centerVertical: true
        })
      } else {
        currentLocation["folders"][baseName] = {"type": "local", "folders": {}, "files": {}, "action": ["new"]}
        populateJSONObjFolder(currentLocation["folders"][baseName], folderArray[i])
        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+baseName+'</div></div>'

        $('#items').html(appendString)

        listItems(currentLocation, '#items')
        getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
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
  var currentPath = organizeDSglobalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered, datasetStructureJSONObj)
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
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
          break
        } else {
            if (!["dataset_description.xlsx", "submission.xlsx", "samples.xlsx", "subjects.xlsx", "README.txt"].includes(itemName)) {
              bootbox.alert({
                message: "Invalid file(s). Only SPARC metadata files are allowed in the high-level dataset folder.<br> <ul><li>dataset_description (.xslx/.csv/.json)</li><li>submission (.xslx/.csv/.json)</li><li>subjects (.xslx/.csv/.json)</li><li>samples (.xslx/.csv/.json)</li><li>CHANGES.txt</li><li>README.txt</li></ul>",
                centerVertical: true
              })
            } else {
              myPath["files"][itemName] = {"path": itemPath, "description": "","additional-metadata": "", "type": "local", "action":["new"]}
              var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
              $(appendString).appendTo(ev.target);
              listItems(myPath, '#items')
              getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
              hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
              hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
            }
        }
      } else {
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate file name: " + itemName,
            centerVertical: true
          })
          break
        } else {
          myPath["files"][itemName] = {"path": itemPath, "description":"","additional-metadata":"", "type": "local", "action":["new"]}
          var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);
          listItems(myPath, '#items')
          getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
          hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
          hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
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
          var currentPath = organizeDSglobalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.slice(1).filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered, datasetStructureJSONObj)
          var folderJsonObject = {"folders": {}, "files": {}, "type":"local", "action":["new"]};
          populateJSONObjFolder(folderJsonObject, itemPath)
          myPath["folders"][itemName] = folderJsonObject
          var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+itemName+'</div></div>'
          $(appendString).appendTo(ev.target);
          listItems(myPath, '#items')
          getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
          hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
          hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
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
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////


//// helper functions for hiding/showing context menus
function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    var mouseX;
    if (ev.pageX <= 200) {
      mouseX = ev.pageX + 10;
    } else {
      mouseX = ev.pageX - 210;
    }
    var mouseY = ev.pageY - 15;
    if (category === "folder") {
      menuFolder.style.display = "block";
      $('.menu.reg-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else if (category === "high-level-folder") {
      menuHighLevelFolders.style.display = "block";
      $('.menu.high-level-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else {
        menuFile.style.display = "block";
        $('.menu.file').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
      }
}

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li").unbind().click(function(){
    if ($(this).attr('id') === "folder-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "folder-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      }
     // Hide it AFTER the action was triggered
     hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
     hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
     hideFullName()
 });

 /// options for high-level folders
 $(".menu.high-level-folder li").unbind().click(function(){
   if ($(this).attr('id') === "folder-rename") {
     var itemDivElements = document.getElementById("items").children
      renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
     } else if ($(this).attr('id') === "folder-delete") {
       delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
     } else if ($(this).attr('id') === "tooltip-folders") {
       showTooltips(event)
     }
    // Hide it AFTER the action was triggered
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
    hideFullName()

});
/// hide both menus after an option is clicked
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  hideFullName()
}

//////// options for files
function fileContextMenu(event) {
  if ($(".div-display-details.file").hasClass('show')) {
    $(".div-display-details.file").removeClass('show')
  }
  $(".menu.file li").unbind().click(function(){
    if ($(this).attr('id') === "file-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "file-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      } else if ($(this).attr('id') === "file-description") {
        manageDesc(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
 });
 hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
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
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      } else {
        showmenu(event, "folder")
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      }
    } else if (event.target.classList[0] === "myFile") {
      showmenu(event, "file")
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      // otherwise, do not show any menu
    } else {
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      // hideFullPath()
      hideFullName()
    }
});

$(document).bind("click", function (event) {
  if (event.target.classList[0] !== "myFol" &&
      event.target.classList[0] !== "myFile") {
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
        // hideFullPath()
        hideFullName()
      }
})

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  /// sort the files in objects
  if (object.hasOwnProperty("files")) {
    Object.keys(object["files"]).sort().forEach(function(key) {
      orderedFiles[key] = object["files"][key]
    });
  }
  if (object.hasOwnProperty("folders")) {
    Object.keys(object["folders"]).sort().forEach(function(key) {
      orderedFolders[key] = object["folders"][key]
    });
  }
  const orderedObject = {
    "folders": orderedFolders,
    "files": orderedFiles,
    "type": ""
  }
  return orderedObject
}

function listItems(jsonObj, uiItem) {
    var appendString = ''
    var sortedObj = sortObjByKeys(jsonObj)
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
      var filtered = jsonPathArray.slice(1).filter(function (el) {
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



function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1)
  return newString
}

var fileNameForEdit;
///// Option to manage description for files
function manageDesc(ev) {
  var fileName = ev.parentElement.innerText
  /// get current location of files in JSON object
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  //// load existing metadata/description
  loadDetailsContextMenu(fileName, myPath, 'textarea-file-description', 'textarea-file-metadata', 'para-local-path-file')
  showDetailsFile()
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  fileNameForEdit = fileName
}

function addDetailsForFile(ev) {
  /// first confirm with users
  bootbox.confirm({
     title: "Adding additional metadata for files",
     message: "If you check any checkboxes above, metadata will be modified for all files in the folder. Would you like to continue?",
     centerVertical: true,
     button: {
       ok: {
         label: 'Yes',
         className: 'btn-primary'
       }
     },
     callback: function(r) {
       if (r!==null) {
         var fileName = fileNameForEdit;
         var filtered = getGlobalPath(organizeDSglobalPath);
         var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
         triggerManageDetailsPrompts(ev, fileName, myPath, 'textarea-file-description', 'textarea-file-metadata')
         /// list Items again with new updated JSON structure
         listItems(myPath, '#items')
         getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj);
         // find checkboxes here and uncheck them
         for (var ele of $($(ev).siblings().find('input:checkbox'))) {
           document.getElementById(ele.id).checked = false
         }
         // close the display
         showDetailsFile();
       }
     }
   })
}

//// Select to choose a local dataset
// document.getElementById("location-new-dataset").addEventListener("click", function() {
//   document.getElementById("location-new-dataset").placeholder = "Browse here"
//   ipcRenderer.send('open-file-dialog-newdataset-curate');
// })
//
// ipcRenderer.on('selected-new-datasetCurate', (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null){
//       document.getElementById("location-new-dataset").placeholder = filepath[0];
//       document.getElementById("div-confirm-location-new-dataset").style.display = "flex";
//     }
//   }
// })

// document.getElementById('inputNewNameDataset').addEventListener('keydown', function() {
//   // document.getElementById('para-new-name-dataset-message').innerHTML = ""
// })

$("#inputNewNameDataset").keyup(function() {
  var newName = $("#inputNewNameDataset").val().trim();
  if (newName === "") {
    document.getElementById('div-confirm-inputNewNameDataset').style.display = "none";
    document.getElementById('button-generate').disabled = true;
    $('#button-generate').css({"background":"#cccccc", "color":"#696969"})
  } else {
    if (check_forbidden_characters_bf(newName)) {
      document.getElementById('div-confirm-inputNewNameDataset').style.display = "none";
      document.getElementById('button-generate').disabled = true;
      $('#button-generate').css({"background":"#cccccc", "color":"#696969"})
      document.getElementById('para-new-name-dataset-message').innerHTML = "Error: A Blackfynn dataset name cannot contain any of the following characters: \/:*?'<>."
    } else {
      document.getElementById('div-confirm-inputNewNameDataset').style.display = "flex";
      $('#div-confirm-inputNewNameDataset').show()
      document.getElementById('para-new-name-dataset-message').innerHTML = "";
      document.getElementById('button-generate').disabled = false;
      $('#button-generate').css({"background":"var(--color-light-green)", "color":"#fff"})
    }
  }
});

//// Select to choose a local dataset
document.getElementById("input-destination-generate-dataset-locally").addEventListener("click", function() {
  document.getElementById("input-destination-generate-dataset-locally").placeholder = "Browse here";
  ipcRenderer.send('open-file-dialog-local-destination-curate');
})

ipcRenderer.on('selected-local-destination-datasetCurate', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("input-destination-generate-dataset-locally").placeholder = filepath[0];
      document.getElementById('div-confirm-destination-locally').style.display = "flex";
      $("#div-confirm-destination-locally button").show()
    }
  } else {
    $("#Question-generate-dataset-generate-div").removeClass('show');
    $("#Question-generate-dataset-generate-div").removeClass('test2');
    document.getElementById("div-confirm-destination-locally").style.display = "none";
    $("#div-confirm-destination-locally button").hide()
  }
})

// remove all empty keys from JSON object before passing it to the backend
function finalScanningSODAJsonObject() {

  deleteEmptyKeysFromObject(sodaJSONObj["bf-dataset-selected"]);
  deleteEmptyKeysFromObject(sodaJSONObj["bf-account-selected"]);
  deleteEmptyKeysFromObject(sodaJSONObj["generate-dataset"]);
  deleteEmptyKeysFromObject(sodaJSONObj);
}

document.getElementById("button-generate-comeback").addEventListener('click', function() {
  document.getElementById('generate-dataset-progress-tab').style.display = "none";
  document.getElementById('prevBtn').style.display = "inline";
  $('#generate-dataset-tab').addClass('tab-active');
})

/// MAIN CURATE NEW ///

const progressBarNewCurate = document.getElementById('progress-bar-new-curate');

document.getElementById('button-generate').addEventListener('click', function() {

  $($($(this).parent()[0]).parents()[0]).removeClass('tab-active');
  document.getElementById('prevBtn').style.display = "none";
  document.getElementById('div-generate-comeback').style.display = "none"
  document.getElementById('generate-dataset-progress-tab').style.display = "flex";

  // updateJSON structure after Generate dataset tab
  updateJSONStructureGenerate();
  // scanning JSON object for any empty key-values before passing it to Python
  finalScanningSODAJsonObject();

  //  from here you can modify
  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait..."
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = ""

  progressBarNewCurate.value = 0;

  console.log(sodaJSONObj)

  client.invoke("api_check_empty_files_folders", sodaJSONObj,
     (error, res) => {
     if (error) {
       console.error(error)
     } else {
        document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
        log.info('Continue with curate')
        console.log(res)
        var message = ""
        error_files = res[0]
        error_folders = res[1]
        if (error_files.length>0){
          var error_message_files = backfend_to_frontend_error_message(error_files)
          message += "\n" + error_message_files
        }

        if (error_folders.length>0){
          var error_message_folders = backfend_to_frontend_error_message(error_folders)
          message += "\n" + error_message_folders
        }

        if (message){
          message += "\n" + "Would you like to continue?"
          ipcRenderer.send('warning-empty-files-folders-generate', message)
        } else {
          initiate_generate()
        }
      }
    })
})

ipcRenderer.on('warning-empty-files-folders-generate-selection', (event, index) => {
  if (index === 0) {
    console.log("Continue")
    initiate_generate()
  } else {
    console.log("Stop")
    document.getElementById('div-generate-comeback').style.display = "flex"
  }
})

function initiate_generate() {
  console.log(sodaJSONObj)
  // Initiate curation by calling Python funtion
  document.getElementById("para-new-curate-progress-bar-status").innerHTML = "Preparing files ..."
  client.invoke("api_main_curate_function", sodaJSONObj,
     (error, res) => {
     if (error) {
       document.getElementById("para-please-wait-new-curate").innerHTML = ""
       var emessage = userError(error)
       document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "<span style='color: red;'> " + emessage + sadCan + "</span>"
       document.getElementById("para-new-curate-progress-bar-status").innerHTML = ""
       document.getElementById("para-please-wait-new-curate").innerHTML = "";
       document.getElementById('div-new-curate-progress').style.display = "none";
       progressBarNewCurate.value = 0;
       log.error(error)
       console.error(error)
     } else {
       document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
       log.info('Completed curate function')
       console.log('Completed curate function')
       console.log(res)
     }
     document.getElementById('div-generate-comeback').style.display = "flex"
  })
}

function backfend_to_frontend_error_message(error_array) {
  var error_message = "" 
  for (var i = 0; i < error_array.length;i++){
    item = error_array[i]
    error_message += item + "\n"
  }
  return error_message
}


var forbidden_characters_bf = '\/:*?"<>';

function check_forbidden_characters_bf(my_string) {
  // Args:
  // my_string: string with characters (string)
  // Returns:
  // False: no forbidden character
  // True: presence of forbidden character(s)
  var check = false;
  for (var i = 0; i < forbidden_characters_bf.length;i++) {
      if(my_string.indexOf(forbidden_characters_bf[i]) > -1){
          return true
          break
      }
  }
  return check
}
