const {ipcRenderer} = require('electron')

function showAddGrant(){
  document.getElementById('div-add-new-grant').style.display ='block';
  document.getElementById('div-select-existing-grant').style.display ='none';
}

function showSelectGrant(){
  document.getElementById('div-add-new-grant').style.display ='none';
  document.getElementById('div-select-existing-grant').style.display ='block';
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
var domStrings = {dataset: [document.getElementById('ds-name'), document.getElementById('ds-description'),
                            document.getElementById('ds-keywords'),document.getElementById('ds-samples-no'),
                            document.getElementById('ds-subjects-no')],
                  optional: [document.getElementById("input-completeness"),document.getElementById("input-parent-ds"),
                            document.getElementById('input-completeds-title')]
                  }
//// check if all fields have been filled
function checkFields(div, fieldArray) {
  var fieldSatisfied = true
  for (let field of fieldArray) {
    if (field.value.length===0 || field.value==="Select") {
      fieldSatisfied = false
    }
  }
  if (fieldSatisfied) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  }
}

/// check if at least one contributor is added
function checkFieldsContributors() {
  var div = 'ds-contributor-info';
  var dsAwardArray = document.getElementById('ds-description-award-list')
  var award = dsAwardArray.options[dsAwardArray.selectedIndex].value
  var tableCurrentCon = document.getElementById("table-current-contributors")
  var fieldSatisfied = true
  var contactPersonExists = false
  /// check for empty award
  if (award.value==="Select") {
    fieldSatisfied = false
  }
  for (var i=0;i<tableCurrentCon.rows.length;i++) {
    if (tableCurrentCon.rows[i].cells[4].innerHTML==="Yes") {
      contactPersonExists = true
      break
    }
  }
  if (fieldSatisfied && contactPersonExists && tableCurrentCon.rows.length>1) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  }
}

/// check if other info section is all populated
function checkOtherInfoFields() {
  var div = 'ds-misc-info';
  var tableCurrentLinks = document.getElementById("table-addl-links")
  var fieldSatisfied = false;
  for (var i=1; i<tableCurrentLinks.rows.length; i++) {
    if (tableCurrentLinks.rows[i].cells[0].innerHTML==="Protocol URL or DOI*") {
      fieldSatisfied = true
    }
  }
  if (fieldSatisfied) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  } else {
    document.getElementById(div).className = 'multisteps-form__progress-btn'
  }
}
document.querySelector('#ds-dataset-info').addEventListener('click', () => {
    showDSInfo();
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-dataset-info').classList.add('js-active1')
})

document.querySelector('#ds-contributor-info').addEventListener('click', () => {
    showContributorInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-contributor-info').classList.add('js-active1')
})
document.querySelector('#ds-misc-info').addEventListener('click', () => {
    showMiscInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-misc-info').classList.add('js-active1')
})
document.querySelector('#ds-optional-info').addEventListener('click', () => {
    showOptionalInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-optional-info').classList.add('js-active1')
})

///prev buttons
document.querySelector('#button-prev-contributor-ds').addEventListener('click', () => {
    document.querySelector('#ds-dataset-info').click()
    checkFieldsContributors()
})
document.querySelector('#button-prev-misc-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
    checkOtherInfoFields()
})
document.querySelector('#button-prev-optional-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
    checkFields("ds-optional-info", domStrings.optional)
})

//next buttons
document.querySelector('#button-next-ds-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click();
    checkFields("ds-dataset-info", domStrings.dataset)
})
document.querySelector('#button-next-contributor-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click();
    checkFieldsContributors()
})
document.querySelector('#button-next-misc-optional').addEventListener('click', () => {
    document.querySelector('#ds-optional-info').click();
    checkOtherInfoFields()
})
