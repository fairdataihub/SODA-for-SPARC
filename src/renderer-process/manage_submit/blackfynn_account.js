const {ipcRenderer} = require('electron')

function showAddAccount(){
  document.getElementById('div-add-account').style.display ='block';
  document.getElementById('div-select-account').style.display ='none';
  document.getElementById('para-add-account-status').innerHTML = ""
}

function showSelectAccount(){
  document.getElementById('div-add-account').style.display ='none';
  document.getElementById('div-select-account').style.display ='block';
  document.getElementById('para-add-account-status').innerHTML = ""
}

document.querySelector('#addAccount').addEventListener('click', () => {
  showAddAccount()
})

document.querySelector('#selectAccount').addEventListener('click', () => {
  showSelectAccount()
})

//Blackfynn manage datasets
function showCreateDataset(){
  document.getElementById('div-create-dataset').style.display ='block';
  document.getElementById('div-rename-dataset').style.display ='none';
  document.getElementById('para-add-new-dataset-status').innerHTML = ""
}

function showRenameDataset(){
  document.getElementById('div-create-dataset').style.display ='none';
  document.getElementById('div-rename-dataset').style.display ='block';
  document.getElementById('para-rename-dataset-status').innerHTML = ""
}

document.querySelector('#createDataset').addEventListener('click', () => {
  showCreateDataset()
})

document.querySelector('#renameDataset').addEventListener('click', () => {
  showRenameDataset()
})

//
// Blackfynn Metadata
//

function showAddEditSubtitle(){
  document.getElementById('div-add-edit-subtitle').style.display ='block';
  document.getElementById('div-add-edit-description').style.display ='none';
  document.getElementById('div-add-edit-banner').style.display ='none';
  document.getElementById('div-add-edit-license').style.display ='none';
}
function showAddEditDescription(){
  document.getElementById('div-add-edit-subtitle').style.display ='none';
  document.getElementById('div-add-edit-description').style.display ='block';
  document.getElementById('div-add-edit-banner').style.display ='none';
  document.getElementById('div-add-edit-license').style.display ='none';
}
function showAddEditBanner(){
  document.getElementById('div-add-edit-subtitle').style.display ='none';
  document.getElementById('div-add-edit-description').style.display ='none';
  document.getElementById('div-add-edit-banner').style.display ='block';
  document.getElementById('div-add-edit-license').style.display ='none';
}
function showAddEditLicense(){
  document.getElementById('div-add-edit-subtitle').style.display ='none';
  document.getElementById('div-add-edit-description').style.display ='none';
  document.getElementById('div-add-edit-banner').style.display ='none';
  document.getElementById('div-add-edit-license').style.display ='block';
}

document.querySelector('#add-edit-subtitle').addEventListener('click', () => {
    document.getElementById('para-dataset-subtitle-status').innerHTML = "";
    document.getElementById('para-dataset-description-status').innerHTML = "";
    document.getElementById('para-dataset-banner-image-status').innerHTML = "";
    document.getElementById('para-dataset-license-status').innerHTML = "";
    showAddEditSubtitle()
})
document.querySelector('#add-edit-description').addEventListener('click', () => {
    document.getElementById('para-dataset-subtitle-status').innerHTML = "";
    document.getElementById('para-dataset-description-status').innerHTML = "";
    document.getElementById('para-dataset-banner-image-status').innerHTML = "";
    document.getElementById('para-dataset-license-status').innerHTML = "";
    showAddEditDescription()
})
document.querySelector('#add-edit-banner').addEventListener('click', () => {
    document.getElementById('para-dataset-subtitle-status').innerHTML = "";
    document.getElementById('para-dataset-description-status').innerHTML = "";
    document.getElementById('para-dataset-banner-image-status').innerHTML = "";
    document.getElementById('para-dataset-license-status').innerHTML = "";
    showAddEditBanner()
})
document.querySelector('#add-edit-license').addEventListener('click', () => {
    document.getElementById('para-dataset-subtitle-status').innerHTML = "";
    document.getElementById('para-dataset-description-status').innerHTML = "";
    document.getElementById('para-dataset-banner-image-status').innerHTML = "";
    document.getElementById('para-dataset-license-status').innerHTML = "";
    showAddEditLicense()
})
//
// Manage permissions
//
function showPIOwner(){
  document.getElementById('div-bf-pi-owner').style.display ='block';
  // document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-bf-user-permission').style.display ='none';
  document.getElementById('div-bf-team-permission').style.display ='none';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}

function showUserPermission(){
  document.getElementById('div-bf-pi-owner').style.display ='none';
  // document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-bf-user-permission').style.display ='block';
  document.getElementById('div-bf-team-permission').style.display ='none';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}
function showTeamPermission(){
  document.getElementById('div-bf-pi-owner').style.display ='none';
  // document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-bf-user-permission').style.display ='none';
  document.getElementById('div-bf-team-permission').style.display ='block';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}

document.querySelector('#pi-owner').addEventListener('click', () => {
    showPIOwner()
})
// document.querySelector('#curation-team').addEventListener('click', () => {
//     showShareCurationTeam()
// })
document.querySelector('#user-permission').addEventListener('click', () => {
    showUserPermission()
})
document.querySelector('#team-permission').addEventListener('click', () => {
    showTeamPermission()
})


// Post curation tasks
function showShareConsortium(){
  document.getElementById('div-share-consortium').style.display ='block';
  document.getElementById('div-reserve-doi').style.display ='none';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-publish-dataset').style.display ='none';
  document.getElementById('para-share-consortium-status').innerHTML = ""
}

function showReserveNewDOI(){
  document.getElementById('div-share-consortium').style.display ='none';
  document.getElementById('div-reserve-doi').style.display ='block';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-publish-dataset').style.display ='none';
  document.getElementById('para-reserve-doi-status').innerHTML = ""
}

function showShareCurationTeam(){
  document.getElementById('div-bf-share-curation-team').style.display ='block';
  document.getElementById('div-share-consortium').style.display ='none';
  document.getElementById('div-reserve-doi').style.display ='none';
  document.getElementById('div-publish-dataset').style.display ='none';
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById('para-reserve-doi-status').innerHTML = ""
  document.getElementById('para-share-consortium-status').innerHTML = ""
}

function showPublishDataset(){
  document.getElementById('div-share-consortium').style.display ='none';
  document.getElementById('div-reserve-doi').style.display ='none';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-publish-dataset').style.display ='block';
  document.getElementById('para-publish-dataset-status').innerHTML = ""
}
//
// document.querySelector('#shareConsortium').addEventListener('click', () => {
//   showShareConsortium()
// })
//
// document.querySelector('#reserveDOI').addEventListener('click', () => {
//   showReserveNewDOI()
// })
//
// document.querySelector('#publishDataset').addEventListener('click', () => {
//   showPublishDataset()
// })
