const {ipcRenderer} = require('electron')

function showAddAccount(){
  document.getElementById('div-add-account').style.display ='block';
  document.getElementById('div-select-account').style.display ='block';
}

function showSelectAccount(){
  document.getElementById('div-add-account').style.display ='none';
  document.getElementById('div-select-account').style.display ='block';
}

document.querySelector('#addAccount').addEventListener('click', () => {
    showAddAccount()
})

document.querySelector('#selectAccount').addEventListener('click', () => {
    showSelectAccount()
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

document.querySelector('#addEditSubtitle').addEventListener('click', () => {
    showAddEditSubtitle()
})
document.querySelector('#addEditDescription').addEventListener('click', () => {
    showAddEditDescription()
})
document.querySelector('#addEditBanner').addEventListener('click', () => {
    showAddEditBanner()
})
document.querySelector('#addEditLicense').addEventListener('click', () => {
    showAddEditLicense()
})
//
// Manage permissions
//
function showPIOwner(){
  document.getElementById('div-bf-pi-owner').style.display ='block';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-bf-user-permission').style.display ='none';
  document.getElementById('div-bf-team-permission').style.display ='none';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}
function showShareCurationTeam(){
  document.getElementById('div-bf-pi-owner').style.display ='none';
  document.getElementById('div-bf-share-curation-team').style.display ='block';
  document.getElementById('div-bf-user-permission').style.display ='none';
  document.getElementById('div-bf-team-permission').style.display ='none';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}
function showUserPermission(){
  document.getElementById('div-bf-pi-owner').style.display ='none';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
  document.getElementById('div-bf-user-permission').style.display ='block';
  document.getElementById('div-bf-team-permission').style.display ='none';
  document.getElementById("para-dataset-permission-status-pi").innerHTML = ""
  document.getElementById("para-dataset-permission-status-curation-team").innerHTML = ""
  document.getElementById("para-dataset-permission-status").innerHTML = ""
  document.getElementById("para-dataset-permission-status-team").innerHTML = ""
}
function showTeamPermission(){
  document.getElementById('div-bf-pi-owner').style.display ='none';
  document.getElementById('div-bf-share-curation-team').style.display ='none';
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
document.querySelector('#curation-team').addEventListener('click', () => {
    showShareCurationTeam()
})
document.querySelector('#user-permission').addEventListener('click', () => {
    showUserPermission()
})
document.querySelector('#team-permission').addEventListener('click', () => {
    showTeamPermission()
})
