const {ipcRenderer} = require('electron')

function showAddGrant(){
  document.getElementById('div-add-new-grant').style.display ='block';
  document.getElementById('div-select-existing-grant').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}

function showSelectGrant(){
  document.getElementById('div-add-new-grant').style.display ='none';
  document.getElementById('div-select-existing-grant').style.display ='block';
  document.getElementById('para-save-award-info').innerHTML = ""
}

document.querySelector('#addGrant').addEventListener('click', () => {
    showAddGrant()
})

document.querySelector('#selectGrant').addEventListener('click', () => {
    showSelectGrant()
})

function showDSInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='block';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showContributorInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='block';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showMiscInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='block';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showOptionalInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='block';
  document.getElementById('para-save-award-info').innerHTML = ""
}

document.querySelector('#ds-dataset-info').addEventListener('click', () => {
    showDSInfo()
})
document.querySelector('#ds-contributor-info').addEventListener('click', () => {
    showContributorInfo()
})
document.querySelector('#ds-misc-info').addEventListener('click', () => {
    showMiscInfo()
})
document.querySelector('#ds-optional-info').addEventListener('click', () => {
    showOptionalInfo()
})

document.querySelector('#button-next-ds-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
})
document.querySelector('#button-next-contributor-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
})
document.querySelector('#button-next-misc-optional').addEventListener('click', () => {
    document.querySelector('#ds-optional-info').click()
})

document.querySelector('#button-prev-contributor-ds').addEventListener('click', () => {
    document.querySelector('#ds-dataset-info').click()
})
document.querySelector('#button-prev-misc-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
})
document.querySelector('#button-prev-optional-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
})
