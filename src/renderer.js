//////////////////////////////////
// Import required modules
//////////////////////////////////
const zerorpc = require("zerorpc")
const fs = require("fs")
const path = require('path')
const {ipcRenderer} = require('electron')
const tt = require('electron-tooltip')

tt({ })


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
const selectDatasetBtn = document.getElementById('select-dataset')
let pathdataset = document.querySelector('#selected-dataset')
const tableOrganized = document.getElementById("table-organized")
var tableOrganizedcount = 0
const tableNotOrganized = document.getElementById("code_table")
var tableNotOrganizedcount = 0
let alreadyorganizedstatus = document.querySelector('#preorganized-dataset')
let organizedatasetstatus = document.querySelector('#organize-dataset')
const clearTableBtn = document.getElementById('clear-table')

// Curate dataset
const selectSaveFileOrganizationBtn = document.getElementById('select-save-file-organization')
const selectPreviewBtn = document.getElementById('preview-file-organization')
const deletePreviewBtn = document.getElementById('delete-preview-organization-status')
const selectUploadFileOrganizationBtn = document.getElementById('select-upload-file-organization')

let createnewstatus = document.querySelector('#create-newdataset')
let modifyexistingstatus = document.querySelector('#existing-dataset')
let bfdirectlystatus = document.querySelector('#cloud-dataset')
let pathnewdataset = document.querySelector('#selected-new-dataset')
let manifeststatus = document.querySelector('#generate-manifest')
let curationform = document.querySelector('#dataset_curate_form')

let existingsubmissionstatus = document.querySelector('#existing-submission')
let newsubmissionstatus = document.querySelector('#new-submission')
let pathsubmissionexisting = document.querySelector('#selected-submission')

let existingdescriptionstatus = document.querySelector('#existing-description')
let newdescriptionstatus = document.querySelector('#new-description')
let pathdescriptionexisting = document.querySelector('#selected-description')

let existingsubjectsstatus = document.querySelector('#existing-subjects')
let newsubjectsstatus = document.querySelector('#new-subjects')
let pathsubjectsexisting = document.querySelector('#selected-subjects')

let existingsamplesstatus = document.querySelector('#existing-samples')
let newsamplesstatus = document.querySelector('#new-samples')
let pathsamplesexisting = document.querySelector('#selected-samples')

var submissionstatus
var pathsubmission
var descriptionstatus
var pathdescription
var subjectsstatus
var pathsubjects
var samplesstatus
var pathsamples


const curateDatasetBtn = document.getElementById('curate-dataset')
const curateDatasetBtn2 = document.getElementById('curate-dataset2')
let progressinfo = document.querySelector('#progressinfo')


// Manage and submit
let keyname = document.querySelector('#bf-key-name')
let key = document.querySelector('#bf-key')
let secret = document.querySelector('#bf-secret')
const bfAddAccountBtn = document.getElementById('add-bf-account')
let bfaddaccountinfo = document.querySelector('#add-account-progress')

let bfaccountlist = document.querySelector('#bfaccountlist')
var myitem
let bfdatasetlist = document.querySelector('#bfdatasetlist')

const bfRefreshDatasetBtn = document.getElementById('refresh-dataset-list')
let bfnewdatasetname = document.querySelector('#bf-new-dataset-name')
const bfCreateNewDatasetBtn = document.getElementById('create-bf-new-dataset')
let bfcreatenewdatasetinfo = document.querySelector('#add-new-dataset-progress')
const bfSubmitDatasetBtn = document.getElementById('submit-dataset')
let bfsubmitdatasetinfo = document.querySelector('#progresssubmit')
let pathsubmitdataset = document.querySelector('#selected-submit-dataset')

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackcolor = '#000000'
const redcolor = '#ff1a1a'
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
  pathdataset.innerHTML = ""
  var folderChecking = checkFolderStruture(path[0])
  if (folderChecking == true) {
    pathdataset.innerHTML = path
    var jsonfolder = organizedFolderToJson(path[0])
    console.log(jsonfolder)
    jsonToTableOrganized(tableOrganized, jsonfolder)
  } else {
    pathdataset.innerHTML = "<span style='color: red;'> Error: please select a dataset with SPARC folder structure </span>"
  }
})

//Select files/folders to be added to table for organizing
const selectCodeBtn = document.getElementById('select-code')
selectCodeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-code')
})

const selectCodeDirectoryBtn = document.getElementById('select-code-directory')
selectCodeDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-code')
})

ipcRenderer.on('selected-code', (event, path) => {
    insertFileToTable(tableNotOrganized, path)
    console.log(tableNotOrganized)
})

//Clear table
clearTableBtn.addEventListener('click', () => {
  if (alreadyorganizedstatus.checked){
    clearTable(tableOrganized)
  } else if (organizedatasetstatus.checked) {
    clearTable(tableNotOrganized)
  }
})

//////////////////////////////////
// Operations calling to pysoda.py functions //
//////////////////////////////////

// Action when user click on Save file organization button
selectSaveFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('save-file-dialog-saveorganization')
})
ipcRenderer.on('selected-saveorganizationfile', (event, path) => {
  var jsonformat = tableToJson(tableNotOrganized)
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]
  console.log(jsonpath)
  console.log(jsondescription)
  document.getElementById("save-file-organization-status").innerHTML = "";
  // Call python to save
  if (path != null){
    client.invoke("apiSaveFileOrganization", jsonpath, jsondescription, path, (error, res) => {
        if(error) {
          console.log(error)
          var emessage = userError(error)
          document.getElementById("save-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        } else {
          console.log(res)
          document.getElementById("save-file-organization-status").innerHTML = "Saved!";
        }
    })
  }
})


// Action when user click on upload file organization button
selectUploadFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-uploadorganization')
})
ipcRenderer.on('selected-uploadorganization', (event, path) => {
  console.log(path)
  document.getElementById("upload-file-organization-status").innerHTML = "";
  var headernames = sparcFolderNames.slice()
  headernames.push("main")
  var lennames =  headernames.length
  for (var i = 0; i < lennames; i++) {
  	console.log(headernames[i])
  	headernames.push(headernames[i] + "_description")
  }
  console.log(headernames)
  client.invoke("apiUploadFileOrganization", path[0], headernames, (error, res) => {
        if(error) {
          console.log(error)
          var emessage = userError(error)
          document.getElementById("upload-file-organization-status").innerHTML = "<span style='color: red;'> " + emessage + "</span>"
        } else {
          console.log(res)
          jsonToTableWithDescription(tableNotOrganized, res)
          document.getElementById("upload-file-organization-status").innerHTML = "Uploaded!";
        }
  })
})

// Action when user click on Preview file organization button
selectPreviewBtn.addEventListener('click', () => {
  document.getElementById("preview-organization-status").innerHTML = ""
  var jsonvect = tableToJsonWithDescription(tableNotOrganized)
  var jsonpath = jsonvect[0]
  console.log(jsonpath)
  client.invoke("apiPreviewFileOrganization", jsonpath, (error, res) => {
      if(error) {
        console.log(error)
        var emessage = userError(error)
        document.getElementById("preview-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        console.log(res)
        console.log("Done")
      }
  })
})

// Action when user click on Preview file organization button
deletePreviewBtn.addEventListener('click', () => {
  // document.getElementById("delete-preview-organization-status").innerHTML = ""
  client.invoke("apiDeletePreviewFileOrganization", (error, res) => {
      if(error) {
        console.log(error)
        var emessage = userError(error)
        document.getElementById("preview-organization-status").innerHTML = "<span style='color: red;'>" + emessage +  "</span>"
      } else {
        console.log(res)
        console.log("Done")
      }
  })
})

// Action when user click on Curate Dataset
curateDatasetBtn.addEventListener('click', () => {
  progressinfo.style.color = blackcolor
  curateDatasetBtn.disabled = true
  disableform(curationform)

  if (existingsubmissionstatus.checked === true){
    submissionstatus = true
    pathsubmission = pathsubmissionexisting.value
  } else if (newsubmissionstatus.checked === true){
    submissionstatus = true
    pathsubmission = path.join(__dirname, 'file_templates', 'submission.xlsx')
  } else {
    submissionstatus = false
  }

  if (existingdescriptionstatus.checked === true){
    descriptionstatus = true
    pathdescription = pathdescriptionexisting.value
  } else if (newdescriptionstatus.checked === true){
    descriptionstatus = true
    pathdescription = path.join(__dirname, 'file_templates', 'dataset_description.xlsx')
  } else {
    descriptionstatus = false
  }

  if (existingsubjectsstatus.checked === true){
    subjectsstatus = true
    pathsubjects = pathsubjectsexisting.value
  } else if (newsubjectsstatus.checked === true){
    subjectsstatus = true
    pathsubjects = path.join(__dirname, 'file_templates', 'subjects.xlsx')
  } else {
    subjectsstatus = false
  }

  if (existingsamplesstatus.checked === true){
    samplesstatus = true
    pathsamples = pathsamplesexisting.value
  } else if (newsamplesstatus.checked === true){
    samplesstatus = true
    pathsamples = path.join(__dirname, 'file_templates', 'samples.xlsx')
  } else {
   samplesstatus = false
  }

  progressinfo.value = ''
  var completionstatus = 'Solving'

  client.invoke("apiCurateDataset", pathdataset.innerHTML, createnewstatus.checked, pathnewdataset.value,
    manifeststatus.checked, submissionstatus, pathsubmission,  descriptionstatus, pathdescription,
    subjectsstatus, pathsubjects, samplesstatus, pathsamples,
    (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      progressinfo.style.color = redcolor
      progressinfo.value = emessage
      console.log(error)
      enableform(curationform)
    } else {
      console.log('Done', res)
    }
  })

  var timerprogress = setInterval(progressfunction, 1000)
  function progressfunction(){
    client.invoke("apiCurateDatasetProgress", (error, res) => {
      if(error) {
        console.error(error)
      } else {
        completionstatus = res[1]
        var printstatus = res[2]
        if (printstatus === 'Curating') {
          progressinfo.value = res[0].split(',').join('\n')
        }
      }
    })
    console.log('Completion', completionstatus)
    if (completionstatus === 'Done'){
      clearInterval(timerprogress)
      curateDatasetBtn.disabled = false
      enableform(curationform)
    }
  }

})

// // // // // // // // // //
// Action when user click on Curate Dataset #2
// // // // // // // // // //

curateDatasetBtn2.addEventListener('click', () => {

  // Disable curate button to prevent multiple clicks
  progressinfo.style.color = blackcolor
  curateDatasetBtn.disabled = true
  disableform(curationform)

  // Convert table content into json file for transferring to Python
  if (alreadyorganizedstatus.checked) {
    console.log(alreadyorganizedstatus.checked)
    console.log(pathdataset.innerHTML)
    if (fs.existsSync(pathdataset.innerHTML)) {
      var jsonvect = tableToJsonWithDescription(tableOrganized)
      console.log(jsonvect[0])
    } else {
      progressinfo.style.color = redcolor
      progressinfo.value = 'Error: Select a valid dataset folder'
      console.error('Error')
      return
    }
  } else if (organizedatasetstatus.checked) {
    var jsonvect = tableToJsonWithDescription(tableNotOrganized)   
    console.log(jsonvect[0])
  } else {
  	progressinfo.style.color = redcolor
  	progressinfo.value = 'Error: Please select an option under "Organize dataset" '
  	return
  }
  var jsonpath = jsonvect[0]
  var jsondescription = jsonvect[1]

  // Get info of requested metadata
  var metadatafiles = []
  if (existingsubmissionstatus.checked === true){
    submissionstatus = true
    pathsubmission = pathsubmissionexisting.value
    metadatafiles.push(pathsubmission)
  } else if (newsubmissionstatus.checked === true){
    submissionstatus = true
    pathsubmission = path.join(__dirname, 'file_templates', 'submission.xlsx')
    metadatafiles.push(pathsubmission)
  } else {
    submissionstatus = false
  }

  if (existingdescriptionstatus.checked === true){
    descriptionstatus = true
    pathdescription = pathdescriptionexisting.value
    metadatafiles.push(pathdescription)
  } else if (newdescriptionstatus.checked === true){
    descriptionstatus = true
    pathdescription = path.join(__dirname, 'file_templates', 'dataset_description.xlsx')
    metadatafiles.push(pathdescription)
  } else {
    descriptionstatus = false
  }

  if (existingsubjectsstatus.checked === true){
    subjectsstatus = true
    pathsubjects = pathsubjectsexisting.value
    metadatafiles.push(pathsubjects)
  } else if (newsubjectsstatus.checked === true){
    subjectsstatus = true
    pathsubjects = path.join(__dirname, 'file_templates', 'subjects.xlsx')
    metadatafiles.push(pathsubjects)
  } else {
    subjectsstatus = false
  }

  if (existingsamplesstatus.checked === true){
    samplesstatus = true
    pathsamples = pathsamplesexisting.value
    metadatafiles.push(pathsamples)
  } else if (newsamplesstatus.checked === true){
    samplesstatus = true
    pathsamples = path.join(__dirname, 'file_templates', 'samples.xlsx')
    metadatafiles.push(pathsamples)
  } else {
   samplesstatus = false
  }

  //jsonvar['metadata'] = metadatafiles

  // Initiate curation by calling python
  progressinfo.value = ''
  var completionstatus = 'Solving'
  console.log(pathdataset.innherHTML)
  var pathdatasetvalue = String(pathdataset.innerHTML)
  console.log(pathdatasetvalue)
  
  client.invoke("apiCurateDataset2", pathdatasetvalue, createnewstatus.checked, pathnewdataset.value,
    manifeststatus.checked, submissionstatus, pathsubmission,  descriptionstatus, pathdescription,
    subjectsstatus, pathsubjects, samplesstatus, pathsamples, jsonpath, jsondescription, modifyexistingstatus.checked, 
    bfdirectlystatus.checked, alreadyorganizedstatus.checked, organizedatasetstatus.checked,
    (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      progressinfo.style.color = redcolor
      progressinfo.value = emessage
      console.log(error)
      enableform(curationform)
    } else {
      console.log('Done', res)
    }
  })

  var timerprogress = setInterval(progressfunction, 1000)
  function progressfunction(){
    client.invoke("apiCurateDatasetProgress", (error, res) => {
      if(error) {
        console.error(error)
      } else {
        completionstatus = res[1]
        var printstatus = res[2]
        if (printstatus === 'Curating') {
          progressinfo.value = res[0].split(',').join('\n')
        }
      }
    })
    console.log('Completion', completionstatus)
    if (completionstatus === 'Done'){
      clearInterval(timerprogress)
      curateDatasetBtn.disabled = false
      enableform(curationform)
    }
  }


})



// // // // // // // // // //
// // // // // // // // // //


// Add bf account
bfAddAccountBtn.addEventListener('click', () => {
  bfaddaccountinfo.style.color = blackcolor
  bfAddAccountBtn.disabled = true
  bfaddaccountinfo.value = ''
  client.invoke("apiBfAddAccount", keyname.value, key.value, secret.value, (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      bfaddaccountinfo.style.color = redcolor
      bfaddaccountinfo.value = emessage
    } else {
        bfaddaccountinfo.value = res
        removeOptions(bfaccountlist)
        updateBfAccountList()
    }
    bfAddAccountBtn.disabled = false
  })
})


// Select bf account from dropdownlist and show existing dataset
bfaccountlist.addEventListener('change', () => {
  refreshBfDatasetList()
})


// Refresh list of bf dataset list (in case user create it online)
bfRefreshDatasetBtn.addEventListener('click', () => {
  refreshBfDatasetList()
  console.log("refreshed")
})

// Add new dataset folder (empty) on bf
bfCreateNewDatasetBtn.addEventListener('click', () => {
  bfcreatenewdatasetinfo.style.color = blackcolor
  bfCreateNewDatasetBtn.disabled = true
  bfcreatenewdatasetinfo.value = 'Adding'
  var selectedbfaccount = bfaccountlist.options[bfaccountlist.selectedIndex].text
  client.invoke("apiBfNewDatasetFolder", bfnewdatasetname.value, selectedbfaccount, (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      bfcreatenewdatasetinfo.style.color = redcolor
      bfcreatenewdatasetinfo.value = emessage
      bfCreateNewDatasetBtn.disabled = false
    } else {
        bfcreatenewdatasetinfo.value = 'Success: created folder' + ' ' + bfnewdatasetname.value
        refreshBfDatasetList()
        bfCreateNewDatasetBtn.disabled = false
    }
  })
})


// Submit local dataset to selected bf dataset
bfSubmitDatasetBtn.addEventListener('click', () => {
  bfsubmitdatasetinfo.style.color = blackcolor
  bfSubmitDatasetBtn.disabled = true
  bfsubmitdatasetinfo.value = 'Submitting'
  var completionstatus = 'Solving'
  var selectedbfaccount = bfaccountlist.options[bfaccountlist.selectedIndex].text
  var selectedbfdataset = bfdatasetlist.options[bfdatasetlist.selectedIndex].text
  client.invoke("apiBfSubmitDataset", selectedbfaccount, selectedbfdataset, pathsubmitdataset.value, (error, res) => {
    if(error) {
      console.log('ERROR')
      var emessage = userError(error)
      bfsubmitdatasetinfo.style.color = redcolor
      bfsubmitdatasetinfo.value = emessage
    } else {
      console.log('Done', res)
    }
  })

  var timerprogress = setInterval(progressfunction, 500)
    function progressfunction(){
      client.invoke("apiSubmitDatasetProgress", (error, res) => {
        if(error) {
          console.error(error)
        } else {
          completionstatus = res[1]
          var printstatus = res[2]
          if (printstatus === 'Uploading') {
            bfsubmitdatasetinfo.value = res[0].split(',').join('\n')
          }
        }
      })
      if (completionstatus === 'Done'){
        clearInterval(timerprogress)
        bfSubmitDatasetBtn.disabled = false
      }
    }
})


// Functions
function userError(error)
{
  var myerror = error.message
  return myerror
}

function updateBfAccountList(){
  client.invoke("apiBfAccountList", (error, res) => {
  if(error) {
    console.error(error)
  } else {
    for (myitem in res){
      var myitemselect = res[myitem]
      var option = document.createElement("option")
      option.textContent = myitemselect
      option.value = myitemselect
      bfaccountlist.appendChild(option)
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

function refreshBfDatasetList(){
  removeOptions(bfdatasetlist)
  var accountselected = bfaccountlist.options[bfaccountlist.selectedIndex].text
  if (accountselected === "Select"){
    var optionselect = document.createElement("option")
    optionselect.textContent = 'Select dataset'
    bfdatasetlist.appendChild(optionselect)
  } else {
    client.invoke("apiBfDatasetAccount", bfaccountlist.options[bfaccountlist.selectedIndex].text, (error, res) => {
      if(error) {
        console.error(error)
      } else {
        for (myitem in res){
          var myitemselect = res[myitem]
          var option = document.createElement("option")
          option.textContent = myitemselect
          option.value = myitemselect
          bfdatasetlist.appendChild(option)
        }
      }
    })
  }
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
  console.log(folders)
  console.log(sparcFolderNames)
  if (folders.length != sparcFolderNames.length)
        return false
  var foldersorted = folders.sort()
  var sparcFolderSorted = sparcFolderNames.sort()
  for (var i = 0; i < foldersorted.length; i++) {
    if (foldersorted[i] != sparcFolderSorted[i]) {
      return false
    }
  }
  return true
}

function organizedFolderToJson(pathdatasetval){
  var jsonvar = {}
  var mainfolderfiles = []
  var files = fs.readdirSync(pathdatasetval)
  for (var i = 0; i<files.length; i++) {
    var filename = files[i]
    var filepath = path.join(pathdatasetval, filename)
    if (fs.lstatSync(filepath).isDirectory()){
      var filesinfolder = fs.readdirSync(filepath)
      var folderfiles = []
      for (var j = 0; j<filesinfolder.length; j++) {
        var filenameinfolder = filesinfolder[j]
        folderfiles.push(path.join(filepath, filenameinfolder))
      }
      jsonvar[filename] = folderfiles
    } else {
      mainfolderfiles.push(filepath)
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
      tableOrganizedcount = tableOrganizedcount + 1
      var rownum = rowcount + i + 1
      var table_len = tableOrganizedcount
      var row = table.insertRow(rownum).outerHTML="<tr id='row-org"+table_len+"'><td id='name_row_org"+table_len+"'>"+ pathlist[i] +"</td> <td id='description_row_org"+table_len+"'>"+ "" +"</td> <td><input type='button' id='edit_button_org"+table_len+"' value='Edit' class='edit' onclick='edit_row_org("+table_len+")'> <input type='button' id='save_button_org"+table_len+"' value='Save' class='save' onclick='save_row_org("+table_len+")'></td></tr>";
    }
  }
  console.log("table after")
  console.log(table)
  return table
}


// Not organized
function insertFileToTable(table, path){
  var i
  let SPARCfolder = document.querySelector('#SPARCfolderlist').value
  var rowcount = document.getElementById(SPARCfolder).rowIndex
  console.log(SPARCfolder)
  console.log(rowcount)
  for (i = 0; i < path.length; i++) {
    tableNotOrganizedcount = tableNotOrganizedcount + 1
    var table_len=tableNotOrganizedcount
    var rownum = rowcount + i + 1
    var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ path[i] +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
  }
  console.log("table after")
  console.log(table)
  return table
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
  console.log(jsonvar)

  return [jsonvar, jsonvardescription]
}


function jsonToTable(table, jsonvar){
  var keyvect = Object.keys(jsonvar)
  for (var j = 0; j < keyvect.length; j++) {
    let SPARCfolder = keyvect[j]
    var SPARCfolderid = SPARCfolder
    var rowcount = document.getElementById(SPARCfolderid).rowIndex
    var pathlist = jsonvar[SPARCfolder]
    for (var i = 0; i < pathlist.length; i++){
      var rownum = rowcount + i + 1
      tableNotOrganizedcount = tableNotOrganizedcount + 1
      var table_len = tableNotOrganizedcount
      var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ pathlist[i] +"</td><td id='description_row"+table_len+"'>"+ "" +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
    }
  }
  console.log("table after")
  console.log(table)
  return table
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
	      tableNotOrganizedcount = tableNotOrganizedcount + 1
	      var table_len = tableNotOrganizedcount
	      var row = table.insertRow(rownum).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ pathlist[i] +"</td><td id='description_row"+table_len+"'>"+ descriptionlist[i] +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
       }
    }
  }
  console.log("table after")
  console.log(table)
  return table
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
