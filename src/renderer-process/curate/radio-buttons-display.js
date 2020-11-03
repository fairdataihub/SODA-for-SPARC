function showModifyExisting(){
  document.getElementById('div-create-new').style.display ='none';
  document.getElementById('div-create-cloud').style.display ='none';
  document.getElementById('div-curate-button').style.display ='block';
  document.getElementById('div-curate-progress-bar-error-status').style.display ='block';
  document.getElementById('div-curate-progress-bar-status').style.display ='block';
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-curate-progress-bar-status").innerHTML = ""
  document.getElementById("div-curate-meter-progress").style.display ='none';
  document.getElementById("progress-bar-curate").value = 0;
}

function showCreateNew(){
  document.getElementById('div-create-new').style.display ='block';
  document.getElementById('div-create-cloud').style.display ='none';
  document.getElementById('div-curate-button').style.display ='block';
  document.getElementById('div-curate-progress-bar-error-status').style.display ='block';
  document.getElementById('div-curate-progress-bar-status').style.display ='block';
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-curate-progress-bar-status").innerHTML = ""
  document.getElementById("div-curate-meter-progress").style.display ='block';
  document.getElementById("progress-bar-curate").value = 0;
}

function showCreateCloud(){
  document.getElementById('div-create-new').style.display ='none';
  document.getElementById('div-create-cloud').style.display ='block';
  document.getElementById('div-curate-button').style.display ='block';
  document.getElementById('div-curate-progress-bar-error-status').style.display ='block';
  document.getElementById('div-curate-progress-bar-status').style.display ='block';
  // document.getElementById('div-progress-print').style.display ='none';
  document.getElementById("para-curate-progress-bar-error-status").innerHTML = ""
  document.getElementById("para-curate-progress-bar-status").innerHTML = ""
  document.getElementById("div-curate-meter-progress").style.display ='block';
  document.getElementById("progress-bar-curate").value = 0;
}

document.querySelector('#existing-dataset').addEventListener('click', () => {
    showModifyExisting()
})
document.querySelector('#create-newdataset').addEventListener('click', () => {
    showCreateNew()
})
document.querySelector('#cloud-dataset').addEventListener('click', () => {
    showCreateCloud()
})

function showValidateCurrentDS() {
  document.getElementById('div-validate-current-ds').style.display = "block"
  document.getElementById('div-validate-local-ds').style.display = "none"
}

function showValidateLocalDS() {
  document.getElementById('div-validate-local-ds').style.display = "block"
  document.getElementById('div-validate-current-ds').style.display = "none"
}

document.querySelector('#validatorCurrent').addEventListener('click', () => {
    showValidateCurrentDS()
})
document.querySelector('#validatorLocal').addEventListener('click', () => {
    showValidateLocalDS()
})
//
function showPreorganizedDataset(){
  document.getElementById('div-pre-organized-dataset').style.display ='block';
  document.getElementById('div-organize-dataset').style.display ='none';
  document.getElementById('para-save-file-organization-status').innerHTML = '';
  document.getElementById('div-save-table').style.display ='block';
  document.getElementById('div-smart-organize').style.display ='none';
  document.getElementById('div-clear-table').style.display ='block';
  document.getElementById('div-existing-dataset').style.display ='block';
}

function showOrganizeDataset(){
  document.getElementById('div-pre-organized-dataset').style.display ='none';
  document.getElementById('div-organize-dataset').style.display ='block';
  document.getElementById('para-save-file-organization-status').innerHTML = '';
  document.getElementById('div-save-table').style.display ='block';
  document.getElementById('div-smart-organize').style.display ='none';
  document.getElementById('div-clear-table').style.display ='block';
  document.getElementById('div-existing-dataset').style.display ='none';
}
//
document.querySelector('#preorganized-dataset').addEventListener('click', () => {
    showPreorganizedDataset()
})
document.querySelector('#organize-dataset').addEventListener('click', () => {
    showOrganizeDataset()
})
