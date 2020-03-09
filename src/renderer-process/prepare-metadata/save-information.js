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

function removeClasses(elemSet, className) {
  elemSet.forEach(elem => {
    elem.classList.remove(className);
  });
};

document.querySelector('#ds-dataset-info').addEventListener('click', () => {
    showDSInfo();
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active');
    document.querySelector('#ds-dataset-info').classList.add('js-active')
})

document.querySelector('#ds-contributor-info').addEventListener('click', () => {
    showContributorInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active');
    document.querySelector('#ds-contributor-info').classList.add('js-active')
})
document.querySelector('#ds-misc-info').addEventListener('click', () => {
    showMiscInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active');
    document.querySelector('#ds-misc-info').classList.add('js-active')
})
document.querySelector('#ds-optional-info').addEventListener('click', () => {
    showOptionalInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active');
    document.querySelector('#ds-optional-info').classList.add('js-active')
})

///prev buttons
document.querySelector('#button-prev-contributor-ds').addEventListener('click', () => {
    document.querySelector('#ds-dataset-info').click()
})
document.querySelector('#button-prev-misc-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
})
document.querySelector('#button-prev-optional-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
})

//next buttons
document.querySelector('#button-next-ds-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
})
document.querySelector('#button-next-contributor-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
})
document.querySelector('#button-next-misc-optional').addEventListener('click', () => {
    document.querySelector('#ds-optional-info').click()
})
