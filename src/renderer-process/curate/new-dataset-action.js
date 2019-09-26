function showModifyExisting(){
  document.getElementById('divCreateNew').style.display ='none';
  document.getElementById('divCreateCloud').style.display ='none';
  document.getElementById('curatebutton').style.display ='block';
  document.getElementById('progressprint').style.display ='block';
  document.getElementById('progressinfo').value ='';
}

function showCreateNew(){
  document.getElementById('divCreateNew').style.display ='block';
  document.getElementById('divCreateCloud').style.display ='none';
  document.getElementById('curatebutton').style.display ='block';
  document.getElementById('progressprint').style.display ='block';
  document.getElementById('progressinfo').value ='';
}

function showCreateCloud(){
  document.getElementById('divCreateNew').style.display ='none';
  document.getElementById('divCreateCloud').style.display ='block';
    document.getElementById('curatebutton').style.display ='none';
  document.getElementById('progressprint').style.display ='none';
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


function showSelectSubmission(){
  document.getElementById('divExistingSubmission').style.display ='block';
}

function showNewSubmission(){
  document.getElementById('divExistingSubmission').style.display ='none';
}

function showNoSubmission(){
  document.getElementById('divExistingSubmission').style.display ='none';
}

document.querySelector('#existing-submission').addEventListener('click', () => {
    showSelectSubmission()
})
document.querySelector('#new-submission').addEventListener('click', () => {
    showNewSubmission()
})
document.querySelector('#no-submission').addEventListener('click', () => {
    showNoSubmission()
})


function showSelectDescription(){
  document.getElementById('divExistingDescription').style.display ='block';
}

function showNewDescription(){
  document.getElementById('divExistingDescription').style.display ='none';
}

function showNoDescription(){
  document.getElementById('divExistingDescription').style.display ='none';
}

document.querySelector('#existing-description').addEventListener('click', () => {
    showSelectDescription()
})
document.querySelector('#new-description').addEventListener('click', () => {
    showNewDescription()
})
document.querySelector('#no-description').addEventListener('click', () => {
    showNoDescription()
})


function showSelectSubjects(){
  document.getElementById('divExistingSubjects').style.display ='block';
}

function showNewSubjects(){
  document.getElementById('divExistingSubjects').style.display ='none';
}

function showNoSubjects(){
  document.getElementById('divExistingSubjects').style.display ='none';
}

document.querySelector('#existing-subjects').addEventListener('click', () => {
    showSelectSubjects()
})
document.querySelector('#new-subjects').addEventListener('click', () => {
    showNewSubjects()
})
document.querySelector('#no-subjects').addEventListener('click', () => {
    showNoSubjects()
})


function showSelectSamples(){
  document.getElementById('divExistingSamples').style.display ='block';
}

function showNewSamples(){
  document.getElementById('divExistingSamples').style.display ='none';
}

function showNoSamples(){
  document.getElementById('divExistingSamples').style.display ='none';
}

document.querySelector('#existing-samples').addEventListener('click', () => {
    showSelectSamples()
})
document.querySelector('#new-samples').addEventListener('click', () => {
    showNewSamples()
})
document.querySelector('#no-samples').addEventListener('click', () => {
    showNoSamples()
})


function showPreorganizedDataset(){
  document.getElementById('divPreorganizedDataset').style.display ='block';
  document.getElementById('divOrganizeDataset').style.display ='none';
  document.getElementById('divClearTable').style.display ='block';
}

function showOrganizeDataset(){
  document.getElementById('divPreorganizedDataset').style.display ='none';
  document.getElementById('divOrganizeDataset').style.display ='block';
  document.getElementById('divClearTable').style.display ='block';
}

document.querySelector('#preorganized-dataset').addEventListener('click', () => {
    showPreorganizedDataset()
})
document.querySelector('#organize-dataset').addEventListener('click', () => {
    showOrganizeDataset()
})
