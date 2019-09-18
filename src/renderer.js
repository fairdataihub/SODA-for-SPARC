const zerorpc = require("zerorpc")
const fs = require("fs")
const path = require('path')

// Connect to python server
let client = new zerorpc.Client()

client.connect("tcp://127.0.0.1:4242")

client.invoke("echo", "server ready", (error, res) => {
  if(error || res !== 'server ready') {
    console.error(error)
  } else {
    console.log("server is ready")
  }
})

// Inputs from user interface //
const saveFileOrganizationBtn = document.getElementById('save-file-organization')
const table=document.getElementById("code_table")
let pathsavefileorganization = document.querySelector('#selected-save-file-organization')

let pathdataset = document.querySelector('#selected-dataset')
let createnewstatus = document.querySelector('#create-newdataset')
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
let progressinfo = document.querySelector('#progressinfo')
 
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

const blackcolor = '#000000'
const redcolor = '#ff1a1a'
// Operations calling to pysoda.py functions //

// Add existing bf account(s) to dropdown list
updateBfAccountList()


// Action when user click on Save file organization button
// pathsavefileorganization
// curateDatasetBtn.addEventListener('click', () => {
//   client.invoke("apiSaveFileOrganization", table, pathsavefileorganization.value, (error, res) => {
//       if(error) {
//         console.log('ERROR')
//       } else {
//         console.log('Done')
//       }
//   })   
// })

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

  client.invoke("apiCurateDataset", pathdataset.value, createnewstatus.checked, pathnewdataset.value, 
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
