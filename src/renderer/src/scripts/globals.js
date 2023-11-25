import Swal from 'sweetalert2'
import 'bootstrap-select'
import DragSort from '@yaireo/dragsort'


import api from './others/api/api'
import {clientError, userErrorMessage} from './others/http-error-handler/error-handler'
import client from './client'
// import { window.clearValidationResults } from './validator/validate'
// // Purpose: Will become preload.js in the future. For now it is a place to put global variables/functions that are defined in javascript files
// //          needed by the renderer process in order to run.





// // Contributors table for the dataset description editing page
const currentConTable = document.getElementById('table-current-contributors')

// // function to show dataset or account Confirm buttons
const showHideDropdownButtons = (category, action) => {
  if (category === 'dataset') {
    if (action === 'show') {
      // btn under Step 6
      $($('#button-confirm-bf-dataset').parents()[0]).css('display', 'flex')
      $('#button-confirm-bf-dataset').show()
      // btn under Step 1
      $($('#button-confirm-bf-dataset-getting-started').parents()[0]).css('display', 'flex')
      $('#button-confirm-bf-dataset-getting-started').show()
    } else {
      // btn under Step 6
      $($('#button-confirm-bf-dataset').parents()[0]).css('display', 'none')
      $('#button-confirm-bf-dataset').hide()
      // btn under Step 1
      $($('#button-confirm-bf-dataset-getting-started').parents()[0]).css('display', 'none')
      $('#button-confirm-bf-dataset-getting-started').hide()
    }
  } else if (category === 'account') {
    if (action === 'show') {
      // btn under Step 6
      $('#div-bf-account-btns').css('display', 'flex')
      $('#div-bf-account-btns button').show()
      // btn under Step 1
      $('#div-bf-account-btns-getting-started').css('display', 'flex')
      $('#div-bf-account-btns-getting-started button').show()
    } else {
      // btn under Step 6
      $('#div-bf-account-btns').css('display', 'none')
      $('#div-bf-account-btns button').hide()
      // btn under Step 1
      $('#div-bf-account-btns-getting-started').css('display', 'none')
      $('#div-bf-account-btns-getting-started button').hide()
    }
  } else if (category === 'organization') {
  }
}

// Function to clear the confirm options in the curate feature
const confirm_click_account_function = () => {
  let temp = $('.bf-account-span')
    .html()
    .replace(/^\s+|\s+$/g, '')
  if (temp == 'None' || temp == '') {
    $('#div-create_empty_dataset-account-btns').css('display', 'none')
    $('#div-bf-account-btns-getting-started').css('display', 'none')
    $('#div-bf-account-btns-getting-started button').hide()
  } else {
    $('#div-create_empty_dataset-account-btns').css('display', 'flex')
    $('#div-bf-account-btns-getting-started').css('display', 'flex')
    $('#div-bf-account-btns-getting-started button').show()
  }
}

/// helper function to refresh live search dropdowns per dataset permission on change event
const initializeBootstrapSelect = (dropdown, action) => {
  if (action === 'disabled') {
    $(dropdown).attr('disabled', true)
    $('.dropdown.bootstrap-select button').addClass('disabled')
    $('.dropdown.bootstrap-select').addClass('disabled')
    $(dropdown).selectpicker('refresh')
  } else if (action === 'show') {
    $(dropdown).selectpicker()
    $(dropdown).selectpicker('refresh')
    $(dropdown).attr('disabled', false)
    $('.dropdown.bootstrap-select button').removeClass('disabled')
    $('.dropdown.bootstrap-select').removeClass('disabled')
  }
}

const updateDatasetList = (bfaccount) => {
  var filteredDatasets = []

  $('#div-filter-datasets-progress-2').css('display', 'none')

  window.removeOptions(window.curateDatasetDropdown)
  window.addOption(window.curateDatasetDropdown, 'Search here...', 'Select dataset')

  initializeBootstrapSelect('#curatebfdatasetlist', 'disabled')

  $('#bf-dataset-select-header').css('display', 'none')
  $('#curatebfdatasetlist').selectpicker('hide')
  $('#curatebfdatasetlist').selectpicker('refresh')
  $('.selectpicker').selectpicker('hide')
  $('.selectpicker').selectpicker('refresh')
  $('#bf-dataset-select-div').hide()

  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(() => {
    var myPermission = $(window.datasetPermissionDiv).find('#select-permission-list-2').val()

    if (!myPermission) {
      myPermission = 'All'
    }

    if (myPermission.toLowerCase() === 'all') {
      for (var i = 0; i < window.datasetList.length; i++) {
        filteredDatasets.push(window.datasetList[i].name)
      }
    } else {
      for (var i = 0; i < window.datasetList.length; i++) {
        if (window.datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(window.datasetList[i].name)
        }
      }
    }

    filteredDatasets.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase())
    })

    // The window.removeOptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
    $('#curatebfdatasetlist').find('option:not(:first)').remove()

    for (const myitem in filteredDatasets) {
      var myitemselect = filteredDatasets[myitem]
      var option = document.createElement('option')
      option.textContent = myitemselect
      option.value = myitemselect
      window.curateDatasetDropdown.appendChild(option)
    }

    initializeBootstrapSelect('#curatebfdatasetlist', 'show')

    $('#div-filter-datasets-progress-2').css('display', 'none')
    //$("#bf-dataset-select-header").css("display", "block")
    $('#curatebfdatasetlist').selectpicker('show')
    $('#curatebfdatasetlist').selectpicker('refresh')
    $('.selectpicker').selectpicker('show')
    $('.selectpicker').selectpicker('refresh')
    $('#bf-dataset-select-div').show()

    if (document.getElementById('div-permission-list-2')) {
      document.getElementById('para-filter-datasets-status-2').innerHTML =
        filteredDatasets.length +
        ' dataset(s) where you have ' +
        myPermission.toLowerCase() +
        ' permissions were loaded successfully below.'
    }
  }, 100)
}

window.removeOptions = (selectbox) => {
  for (let i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
};

// Function to add options to dropdown list
window.addOption = (selectbox, text, value)  => {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}



// global variables to be modularized
window.bfAccountOptionsStatus = ''
window.myitem;

let bfAccountOptions = []
window.defaultBfAccount = undefined;
window.defaultBfDataset = "Select dataset";
window.defaultBfDatasetId = undefined;
window.reverseSwalButtons = false;
window.SODA_SPARC_API_KEY = "SODA-Pennsieve";
window.datasetList = [];
window.organizationList = [];

// TODO: Place in a location for GM and FFM for now 'Global' scope is fine but should probably be placed in a file more related to organize datasets
window.organizeDSglobalPath = "";

// TODO: Organize ds related global variable; so modularize that appropriately 
window.dataset_path = document.getElementById("input-global-path");

// GM Contributors page
const homeDirectory = await window.electron.ipcRenderer.invoke('get-app-path', 'home')
window.storedContributorsPath = window.path.join(homeDirectory, "SODA", "stored-contributors.json");







// used in renderer and guided Mode
window.createDragSort = (tagify) => {
  const onDragEnd = () => {
    tagify.updateValueByDOMTags();
  };
  new DragSort(tagify.DOM.scope, {
    selector: "." + tagify.settings.classNames.tag,
    callbacks: {
      dragEnd: onDragEnd,
    },
  });
};



window.updateOrganizationList = async (bfaccount) => {
let organizations = []

$('#div-filter-datasets-progress-2').css('display', 'none')

window.removeOptions(window.curateOrganizationDropdown)
window.addOption(window.curateOrganizationDropdown, 'Search here...', 'Select organization')

initializeBootstrapSelect('#curatebforganizationlist', 'disabled')

$('#bf-organization-select-header').css('display', 'none')
$('#curatebforganizationlist').selectpicker('hide')
$('#curatebforganizationlist').selectpicker('refresh')
$('.selectpicker').selectpicker('hide')
$('.selectpicker').selectpicker('refresh')
$('#bf-organization-select-div').hide()

await window.wait(100)

$('#curatebforganizationlist').find('option:not(:first)').remove()

// add the organization options to the dropdown
for (const myOrganization in organizations) {
  var myitemselect = organiztions[myOrganization]
  var option = document.createElement('option')
  option.textContent = myitemselect
  option.value = myitemselect
  window.curateOrganizationDropdown.appendChild(option)
}

initializeBootstrapSelect('#curatebforganizationlist', 'show')

$("#div-filter-datasets-progress-2").css("display", "none");
$("#bf-dataset-select-header").css("display", "block")
$('#curatebforganizationlist').selectpicker('show')
$('#curatebforganizationlist').selectpicker('refresh')
$('.selectpicker').selectpicker('show')
$('.selectpicker').selectpicker('refresh')
$('#bf-organization-select-div').show()
}

// per change event of current dataset span text
const confirm_click_function = () => {
  let temp = $('.bf-dataset-span').html()
  if (temp == 'None' || temp == '') {
    $($(this).parents().find('.field').find('.div-confirm-button')).css('display', 'none')
    $('#para-review-dataset-info-disseminate').text('None')
  } else {
    $($(this).parents().find('.field').find('.div-confirm-button')).css('display', 'flex')
    if ($($(this).parents().find('.field').find('.synced-progress')).length) {
      if ($($(this).parents().find('.field').find('.synced-progress')).css('display') === 'none') {
        $('.confirm-button').click()
      }
    } else {
      $('.confirm-button').click()
    }
  }
}

// RESET UI LOGIC SECTION ---------------------------------------------------------------------
window.resetSubmission = (askToReset = true) => {
  if (!askToReset) {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $('#Question-prepare-submission-1').removeClass('prev')
    $('#Question-prepare-submission-1').nextAll().removeClass('show')
    $('#Question-prepare-submission-1').nextAll().removeClass('prev')
    $('#Question-prepare-submission-1 .option-card')
      .removeClass('checked')
      .removeClass('disabled')
      .removeClass('non-selected')
    $('#Question-prepare-submission-1 .option-card .folder-input-check').prop('checked', false)
    resetSubmissionFields()
    return
  }

  Swal.fire({
    backdrop: 'rgba(0,0,0, 0.4)',
    confirmButtonText: 'I want to start over!',
    focusCancel: true,
    heightAuto: false,
    icon: 'warning',
    reverseButtons: window.reverseSwalButtons,
    showCancelButton: true,
    text: 'Are you sure you want to start over and reset your progress?',
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $('#Question-prepare-submission-1').removeClass('prev')
      $('#Question-prepare-submission-1').nextAll().removeClass('show')
      $('#Question-prepare-submission-1').nextAll().removeClass('prev')
      $('#Question-prepare-submission-1 .option-card')
        .removeClass('checked')
        .removeClass('disabled')
        .removeClass('non-selected')
      $('#Question-prepare-submission-1 .option-card .folder-input-check').prop('checked', false)
      resetSubmissionFields()
    }
  })
}

function resetSubmissionFields() {
  $('#existing-submission-file-destination').attr('placeholder', 'Browse here')

  $('#div-confirm-existing-submission-import').hide()

  if ($('#bf_dataset_load_submission').text().trim() !== 'None') {
    $($('#div-check-bf-import-submission').children()[0]).show()
    $('#div-check-bf-import-submission').css('display', 'flex')
  } else {
    $('#div-check-bf-import-submission').hide()
  }

  var inputFields = $('#Question-prepare-submission-1').nextAll().find('input')
  var textAreaFields = $('#Question-prepare-submission-1').nextAll().find('textarea')
  var selectFields = $('#Question-prepare-submission-1').nextAll().find('select')

  for (var field of inputFields) {
    $(field).val('')
  }
  for (var field of textAreaFields) {
    $(field).val('')
  }
  window.milestoneTagify1.removeAllTags()

  // Reset the funding consortium dropdown
  window.resetFundingConsortiumDropdown()

  // make accordion active again
  $('#submission-title-accordion').addClass('active')
  $('#submission-accordion').addClass('active')

  // show generate button again
  $('#button-generate-submission').show()

  for (var field of selectFields) {
    $(field).val('Select')
  }

  // reset the completion date dropdown
  const completionDateDropdown = document.getElementById('submission-completion-date')

  completionDateDropdown.innerHTML = `
    <option value="">Select a completion date</option>
    <option value="Enter my own date">Enter my own date</option>
    <option value="N/A">N/A</option>
  `
}

function resetDD(askToReset = true) {
  if (!askToReset) {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $('#Question-prepare-dd-1').removeClass('prev')
    $('#Question-prepare-dd-1').nextAll().removeClass('show')
    $('#Question-prepare-dd-1').nextAll().removeClass('prev')
    $('#Question-prepare-dd-1 .option-card')
      .removeClass('checked')
      .removeClass('disabled')
      .removeClass('non-selected')
    $('#Question-prepare-dd-1 .option-card .folder-input-check').prop('checked', false)
    resetDDFields()
    return
  }

  Swal.fire({
    backdrop: 'rgba(0,0,0, 0.4)',
    confirmButtonText: 'I want to start over!',
    focusCancel: true,
    heightAuto: false,
    icon: 'warning',
    reverseButtons: window.reverseSwalButtons,
    showCancelButton: true,
    text: 'Are you sure you want to start over and reset your progress?',
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $('#Question-prepare-dd-1').removeClass('prev')
      $('#Question-prepare-dd-1').nextAll().removeClass('show')
      $('#Question-prepare-dd-1').nextAll().removeClass('prev')
      $('#Question-prepare-dd-1 .option-card')
        .removeClass('checked')
        .removeClass('disabled')
        .removeClass('non-selected')
      $('#Question-prepare-dd-1 .option-card .folder-input-check').prop('checked', false)
      resetDDFields()
    }
  })
}

function resetDDFields() {
  // 1. empty all input, textarea, select, para-elements
  // 2. delete all rows from table Contributor
  // 3. delete all rows from table Links
  var inputFields = $('#Question-prepare-dd-2').find('input')
  var textAreaFields = $('#Question-prepare-dd-2').find('textarea')

  // var selectFields = $("#Question-prepare-dd-4-sections").find("select");

  for (var field of inputFields) {
    $(field).val('')
  }
  for (var field of textAreaFields) {
    $(field).val('')
  }

  $('#existing-dd-file-destination').attr('placeholder', 'Browse here')

  $('#div-confirm-existing-dd-import').hide()

  if ($('#bf_dataset_load_dd').text().trim() !== 'None') {
    $($('#div-check-bf-import-dd').children()[0]).show()
    $('#div-check-bf-import-dd').css('display', 'flex')
  } else {
    $('#div-check-bf-import-dd').hide()
  }

  // show generate button again
  $('#button-generate-dd').show()

  window.keywordTagify.removeAllTags()
  window.otherFundingTagify.removeAllTags()
  window.studyTechniquesTagify.removeAllTags()
  window.studyOrganSystemsTagify.removeAllTags()
  window.studyApproachesTagify.removeAllTags()

  // 3. deleting table rows
  window.globalContributorNameObject = {}
  window.currentContributorsLastNames = []
  window.contributorArray = []
  $('#contributor-table-dd tr:gt(0)').remove()
  $('#protocol-link-table-dd tr:gt(0)').remove()
  $('#other-link-table-dd tr:gt(0)').remove()

  $('#div-contributor-table-dd').css('display', 'none')
  document.getElementById('protocol-link-table-dd').style.display = 'none'
  document.getElementById('div-protocol-link-table-dd').style.display = 'none'
  document.getElementById('div-other-link-table-dd').style.display = 'none'
  document.getElementById('other-link-table-dd').style.display = 'none'

  $('#dd-accordion').find('.title').removeClass('active')
  $('#dd-accordion').find('.content').removeClass('active')

  $('#input-destination-generate-dd-locally').attr('placeholder', 'Browse here')
  $('#div-confirm-destination-dd-locally').css('display', 'none')
}

function resetSubjects(askToReset = true) {
  if (!askToReset) {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $('#Question-prepare-subjects-1').removeClass('prev')
    $('#Question-prepare-subjects-1').nextAll().removeClass('show')
    $('#Question-prepare-subjects-1').nextAll().removeClass('prev')
    $('#Question-prepare-subjects-1 .option-card')
      .removeClass('checked')
      .removeClass('disabled')
      .removeClass('non-selected')
    $('#Question-prepare-subjects-1 .option-card .folder-input-check').prop('checked', false)
    $('#Question-prepare-subjects-2').find('button').show()
    $('#div-confirm-primary-folder-import').find('button').hide()

    $('#Question-prepare-subjects-primary-import').find('input').prop('placeholder', 'Browse here')
    window.subjectsFileData = []
    window.subjectsTableData = []

    $('#existing-subjects-file-destination').attr('placeholder', 'Browse here')

    $('#div-confirm-existing-subjects-import').hide()

    // hide Strains and Species
    $('#bootbox-subject-species').css('display', 'none')
    $('#bootbox-subject-strain').css('display', 'none')

    // delete custom subjects metadata fields (if any)
    document
      .getElementById('accordian-custom-fields')
      .querySelectorAll('.div-dd-info')
      .forEach((customField) => {
        customField.remove()
      })

    // show Primary import hyperlink again
    $('#div-import-primary-folder-subjects').show()

    // delete table rows except headers
    $('#table-subjects tr:gt(0)').remove()
    $('#table-subjects').css('display', 'none')

    $('#div-import-primary-folder-subjects').show()

    // Hide Generate button
    $('#button-generate-subjects').css('display', 'none')

    $('#button-add-a-subject').show()

    $('#input-destination-generate-subjects-locally').attr('placeholder', 'Browse here')
    $('#div-confirm-destination-subjects-locally').css('display', 'none')
    return
  }

  Swal.fire({
    text: 'Are you sure you want to start over and reset your progress?',
    icon: 'warning',
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    backdrop: 'rgba(0,0,0, 0.4)',
    confirmButtonText: 'I want to start over'
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $('#Question-prepare-subjects-1').removeClass('prev')
      $('#Question-prepare-subjects-1').nextAll().removeClass('show')
      $('#Question-prepare-subjects-1').nextAll().removeClass('prev')
      $('#Question-prepare-subjects-1 .option-card')
        .removeClass('checked')
        .removeClass('disabled')
        .removeClass('non-selected')
      $('#Question-prepare-subjects-1 .option-card .folder-input-check').prop('checked', false)
      $('#Question-prepare-subjects-2').find('button').show()
      $('#div-confirm-primary-folder-import').find('button').hide()

      $('#Question-prepare-subjects-primary-import')
        .find('input')
        .prop('placeholder', 'Browse here')
      window.subjectsFileData = []
      window.subjectsTableData = []

      $('#existing-subjects-file-destination').attr('placeholder', 'Browse here')

      $('#div-confirm-existing-subjects-import').hide()

      // hide Strains and Species
      $('#bootbox-subject-species').css('display', 'none')
      $('#bootbox-subject-strain').css('display', 'none')

      // delete custom fields (if any)
      var fieldLength = $('.subjects-form-entry').length
      if (fieldLength > 18) {
        for (var field of $('.subjects-form-entry').slice(18, fieldLength)) {
          $($(field).parents()[2]).remove()
        }
      }
      // show Primary import hyperlink again
      $('#div-import-primary-folder-subjects').show()

      // delete table rows except headers
      $('#table-subjects tr:gt(0)').remove()
      $('#table-subjects').css('display', 'none')

      $('#div-import-primary-folder-subjects').show()

      // Hide Generate button
      $('#button-generate-subjects').css('display', 'none')

      $('#button-add-a-subject').show()

      $('#input-destination-generate-subjects-locally').attr('placeholder', 'Browse here')
      $('#div-confirm-destination-subjects-locally').css('display', 'none')
    }
  })
}

function resetSamples(askToReset = true) {
  if (!askToReset) {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $('#Question-prepare-samples-1').removeClass('prev')
    $('#Question-prepare-samples-1').nextAll().removeClass('show')
    $('#Question-prepare-samples-1').nextAll().removeClass('prev')
    $('#Question-prepare-samples-1 .option-card')
      .removeClass('checked')
      .removeClass('disabled')
      .removeClass('non-selected')
    $('#Question-prepare-samples-1 .option-card .folder-input-check').prop('checked', false)
    $('#Question-prepare-samples-2').find('button').show()
    $('#div-confirm-primary-folder-import-samples').find('button').hide()

    $('#Question-prepare-subjects-primary-import-samples')
      .find('input')
      .prop('placeholder', 'Browse here')
    window.samplesFileData = []
    window.samplesTableData = []

    $('#existing-samples-file-destination').attr('placeholder', 'Browse here')
    $('#div-confirm-existing-samples-import').hide()

    // hide Strains and Species
    $('#bootbox-sample-species').css('display', 'none')
    $('#bootbox-sample-strain').css('display', 'none')

    // delete custom fields (if any)
    // delete custom samples metadata fields (if any)
    document
      .getElementById('accordian-custom-fields-samples')
      .querySelectorAll('.div-dd-info')
      .forEach((customField) => {
        customField.remove()
      })
    $('#div-import-primary-folder-samples').show()
    // delete table rows except headers
    $('#table-samples tr:gt(0)').remove()
    $('#table-samples').css('display', 'none')
    // Hide Generate button
    $('#button-generate-samples').css('display', 'none')

    $('#button-add-a-sample').show()

    $('#input-destination-generate-samples-locally').attr('placeholder', 'Browse here')
    $('#div-confirm-destination-samples-locally').css('display', 'none')
    return
  }

  Swal.fire({
    text: 'Are you sure you want to start over and reset your progress?',
    icon: 'warning',
    showCancelButton: true,
    reverseButtons: window.reverseSwalButtons,
    heightAuto: false,
    backdrop: 'rgba(0,0,0, 0.4)',
    confirmButtonText: 'I want to start over'
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $('#Question-prepare-samples-1').removeClass('prev')
      $('#Question-prepare-samples-1').nextAll().removeClass('show')
      $('#Question-prepare-samples-1').nextAll().removeClass('prev')
      $('#Question-prepare-samples-1 .option-card')
        .removeClass('checked')
        .removeClass('disabled')
        .removeClass('non-selected')
      $('#Question-prepare-samples-1 .option-card .folder-input-check').prop('checked', false)
      $('#Question-prepare-samples-2').find('button').show()
      $('#div-confirm-primary-folder-import-samples').find('button').hide()

      $('#Question-prepare-subjects-primary-import-samples')
        .find('input')
        .prop('placeholder', 'Browse here')
      window.samplesFileData = []
      window.samplesTableData = []

      $('#existing-samples-file-destination').attr('placeholder', 'Browse here')
      $('#div-confirm-existing-samples-import').hide()

      // hide Strains and Species
      $('#bootbox-sample-species').css('display', 'none')
      $('#bootbox-sample-strain').css('display', 'none')

      // delete custom samples metadata fields (if any)
      document
        .getElementById('accordian-custom-fields-samples')
        .querySelectorAll('.div-dd-info')
        .forEach((customField) => {
          customField.remove()
        })
      $('#div-import-primary-folder-samples').show()
      // delete table rows except headers
      $('#table-samples tr:gt(0)').remove()
      $('#table-samples').css('display', 'none')
      // Hide Generate button
      $('#button-generate-samples').css('display', 'none')

      $('#button-add-a-sample').show()

      $('#input-destination-generate-samples-locally').attr('placeholder', 'Browse here')
      $('#div-confirm-destination-samples-locally').css('display', 'none')
    }
  })
}

function resetManifest(askToReset = true) {
  if (askToReset) {
    Swal.fire({
      backdrop: 'rgba(0,0,0, 0.4)',
      confirmButtonText: 'I want to start over!',
      focusCancel: true,
      heightAuto: false,
      icon: 'warning',
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: true,
      text: 'Are you sure you want to start over and reset your progress?',
      showClass: {
        popup: 'animate__animated animate__zoomIn animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__zoomOut animate__faster'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // 1. remove Prev and Show from all individual-question except for the first one
        // 2. empty all input, textarea, select, para-elements
        $('#Question-prepare-manifest-1').removeClass('prev')
        $('#Question-prepare-manifest-1').nextAll().removeClass('show')
        $('#Question-prepare-manifest-1').nextAll().removeClass('prev')
        $('#Question-prepare-manifest-1 .option-card')
          .removeClass('checked')
          .removeClass('disabled')
          .removeClass('non-selected')
        $('#Question-prepare-manifest-1 .option-card .folder-input-check').prop('checked', false)
        $('#input-manifest-local-folder-dataset').attr('placeholder', 'Browse here')
        $('#div-confirm-manifest-local-folder-dataset').hide()
        $('#bf_dataset_create_manifest').text('None')
        let dir1 = window.path.join(window.homeDirectory, 'SODA', 'manifest_files')
        let dir2 = window.path.join(window.homeDirectory, 'SODA', 'SODA Manifest Files')
        window.removeDir(dir1)
        window.removeDir(dir2)
      } else {
        return
      }
    })
  } else {
    // 1. remove Prev and Show from all individual-question except for the first one
    // 2. empty all input, textarea, select, para-elements
    $('#Question-prepare-manifest-1').removeClass('prev')
    $('#Question-prepare-manifest-1').nextAll().removeClass('show')
    $('#Question-prepare-manifest-1').nextAll().removeClass('prev')
    $('#Question-prepare-manifest-1 .option-card')
      .removeClass('checked')
      .removeClass('disabled')
      .removeClass('non-selected')
    $('#Question-prepare-manifest-1 .option-card .folder-input-check').prop('checked', false)
    $('#input-manifest-local-folder-dataset').attr('placeholder', 'Browse here')
    $('#div-confirm-manifest-local-folder-dataset').hide()
    $('#bf_dataset_create_manifest').text('None')
    let dir1 = window.path.join(window.homeDirectory, 'SODA', 'manifest_files')
    let dir2 = window.path.join(window.homeDirectory, 'SODA', 'SODA Manifest Files')
    window.removeDir(dir1)
    window.removeDir(dir2)

    // reset the global variables for detecting the manifest path
    window.finalManifestGenerationPath = ''
  }
}

/**
 * Resets the FFM manage-dataset, prepare-metadata, disseminate-dataset UI to their initial state.  Note: Does not reset Account, or organization information in the user details cards.
 */
window.resetFFMUI = (ev) => {
  // reset the manage dataset UI
  $('#div_add_edit_subtitle').removeClass('show')
  $('#div_add_edit_subtitle_tab').removeClass('prev')

  $('#div-rename-bf-dataset').removeClass('show')
  $('#rename_dataset_BF_account_tab').removeClass('prev')

  $('#div_make_pi_owner_permissions').removeClass('show')
  $('#pi_dataset_owner_tab').removeClass('prev')

  $('#add_edit_permissions_choice_div').removeClass('show')
  $('#add_edit_permissions_choice_div').removeClass('prev')
  $('#add_edit_permissions_choice_tab').removeClass('prev')
  $('#add_edit_team_permissions_div').removeClass('show')
  $('#add_edit_user_permissions_div').removeClass('show')
  $('#para-add-edit-dataset-permission-current').text('None')

  $('#div_add_edit_description').removeClass('show')
  $('#add_edit_description_tab').removeClass('prev')

  $('#div_add_edit_banner').removeClass('show')
  // $("#div_add_edit_banner").hide();
  $('#add_edit_banner_tab').removeClass('prev')

  $('#add_license_tab').removeClass('prev')
  $('#div_add_license').removeClass('show')
  $('#para-dataset-license-current').text('None')

  $('#add_tags_tab').removeClass('prev')
  $('#div_add_tags').removeClass('show')

  $('#view_change_dataset_status_tab').removeClass('prev')
  $('#div_view_change_dataset_status').removeClass('show')

  $('#collection_BF_account_tab').removeClass('prev')
  $('#div-collection-bf-dataset').removeClass('show')

  $('#upload_local_dataset_tab').removeClass('prev')
  $('#upload_local_dataset_div').removeClass('show')

  // reset the prepare metadata UI -- only reset if the user is not in that section of the UI
  let resetSubmissionTab = true
  let resetSubjectsTab = true
  let resetSamplesTab = true
  let resetDDTab = true
  let resetManifestTab = true
  let resetValidation = true
  let resetOrganizationTab = true
  if (ev?.parentNode?.parentNode) {
    if (ev.parentNode.parentNode.classList.contains('prepare-submission')) {
      resetSubmissionTab = false
    }
    if (ev.parentNode.parentNode.classList.contains('prepare-subjects')) {
      resetSubjectsTab = false
    }
    if (ev.parentNode.parentNode.classList.contains('prepare-samples')) {
      resetSamplesTab = false
    }
    if (ev.parentNode.parentNode.classList.contains('prepare-dataset-description')) {
      resetDDTab = false
    }
    if (ev.parentNode.parentNode.classList.contains('prepare-manifest')) {
      resetManifestTab = false
    }
    // if (ev.parentNode.parentNode.classList.contains("prepare-validation")) {
    //   resetValidation = false;
    // }
    if (ev.parentNode.parentNode.classList.contains('organize-dataset')) {
      resetOrganizationTab = false
      if (ev.parentNode.parentNode.id === 'bf-organization-curate-first-question-container') {
        $('#current-bf-dataset').text('None')
        $('#para-continue-bf-dataset-getting-started').hide()
        $('#button-confirm-bf-dataset-getting-started').css('display', 'none')
      } else if (
        ev.parentNode.parentNode.id === 'bf-organization-curate-second-question-container'
      ) {
        $('#current-bf-dataset-generate').text('None')
        // show the confirm button under the workspace selection question
        $('#btn-bf-workspace').css('display', 'flex')
        // hide the dataset options selection section
        window.transitionSubQuestionsButton(
          document.querySelector('#btn-bf-workspace'),
          'Question-generate-dataset-BF-workspace',
          'generate-dataset-tab',
          'delete',
          'individual-question generate-dataset'
        )
      }
    }
  }

  if (resetSubmissionTab) {
    window.resetSubmission(false)
  }

  if (resetDDTab) {
    resetDD(false)
  }

  if (resetSubjectsTab) {
    resetSubjects(false)
  }

  if (resetSamplesTab) {
    resetSamples(false)
  }

  if (resetManifestTab) {
    resetManifest(false)
  }

  // reset the prepare datasets sections
  // do not wipe curation progress when resetting in GM or from within Organize Datasets
  if (resetOrganizationTab) {
    // if we are going to reset the organization and are not within the organize flow, set the first dataset field value to None -- the second dataset field gets reset within window.resetCuration
    $('#current-bf-dataset').text('None')
    $('#button-confirm-bf-dataset-getting-started').css('display', 'none')
    window.resetCuration()
  }

  // validation reset
  let validationErrorsTable = document.querySelector('#validation-errors-container tbody')
  if (resetValidation) {
    // Function only resets the table and hides the validation section
    // If they have selected the first cards those will not be reset
    // $("#div-check-bf-import-validator").css("display", "flex");
    $('#validate_dataset-question-3').removeClass('show')
    $('#validate_dataset-question-3').removeClass('prev')
    $('#validate_dataset-question-4').removeClass('show')
    window.clearValidationResults(validationErrorsTable)
  }
  // reset the Disseminate Datasets sections
  $('#share_curation_team-question-1').removeClass('prev')
  $('#share_curation_team-question-2').removeClass('show')

  $('#share_sparc_consortium-question-1').removeClass('prev')
  $('#share_sparc_consortium-question-2').removeClass('show')

  $('#submit_prepublishing_review-question-1').removeClass('prev')
  $('#submit_prepublishing_review-question-2').addClass('hidden')
  $('#submit_prepublishing_review-question-3').removeClass('show')
  $('#submit_prepublishing_review-question-4').removeClass('show')
  $('#para-review-dataset-info-disseminate').text('None')
}

const addBfAccount = async (ev, verifyingOrganization = False) => {
  var resolveMessage = "";
  let footerMessage = "No existing accounts to load. Please add an account.";
  if (bfAccountOptionsStatus === "") {
    if (Object.keys(bfAccountOptions).length === 1) {
      footerMessage = "No existing accounts to load. Please add an account.";
    } else {
      footerMessage = "";
    }
  } else {
    footerMessage = bfAccountOptionsStatus;
  }
  var bfacct;
  let bfAccountSwal = false;
  if (bfAccountSwal === null) {
    if (bfacct !== "Select") {
      Swal.fire({
        allowEscapeKey: false,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        title: "Loading your account details...",
        didOpen: () => {
          Swal.showLoading();
        },
      });
      $("#Question-getting-started-BF-account")
        .nextAll()
        .removeClass("show")
        .removeClass("prev")
        .removeClass("test2");
      $("#Question-generate-dataset-BF-account")
        .nextAll()
        .removeClass("show")
        .removeClass("prev")
        .removeClass("test2");
      $("#current-bf-account").text("");
      $("#current-bf-account-generate").text("");
      $("#create_empty_dataset_BF_account_span").text("");
      $(".bf-account-span").text("");
      $("#current-bf-dataset").text("None");
      $("#current-bf-dataset-generate").text("None");
      $(".bf-dataset-span").html("None");
      window.defaultBfDataset = "Select dataset";
      document.getElementById("ds-description").innerHTML = "";
      window.refreshDatasetList();
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset-getting-started").hide();

      $("#para-account-detail-curate").html("");
      $("#current-bf-dataset").text("None");
      $(".bf-dataset-span").html("None");
      showHideDropdownButtons("dataset", "hide");

      try {
        let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
          params: {
            selected_account: bfacct,
          },
        });
        let user_email = bf_account_details_req.data.email;
        $("#current-bf-account").text(user_email);
        $("#current-bf-account-generate").text(user_email);
        $("#create_empty_dataset_BF_account_span").text(user_email);
        $(".bf-account-span").text(user_email);
        window.updateBfAccountList();
        //change icons in getting started page (guided mode)
        const gettingStartedPennsieveBtn = document.getElementById(
          "getting-started-pennsieve-account"
        );
        gettingStartedPennsieveBtn.children[0].style.display = "none";
        gettingStartedPennsieveBtn.children[1].style.display = "flex";

        try {
          let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
            params: {
              selected_account: bfacct,
            },
          });

          window.datasetList = [];
          window.datasetList = responseObject.data.datasets;
          window.clearDatasetDropdowns();
          window.refreshDatasetList();
        } catch (error) {
          clientError(error);
          document.getElementById(
            "para-filter-datasets-status-2"
          ).innerHTML = `<span style='color: red'>${userErrorMessage(error)}</span>`;
          return;
        }
      } catch (error) {
        clientError(error);
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          icon: "error",
          html: userErrorMessage(error),
          footer:
            "<a href='https://docs.pennsieve.io/docs/configuring-the-client-credentials'>Why do I have this issue?</a>",
        });
        showHideDropdownButtons("account", "hide");
      }
    } else {
      Swal.showValidationMessage("Please select an account!");
    }
  } else if (bfAccountSwal === false) {
    let titleText = `<h3 style="text-align:center">Connect your Pennsieve account using your email and password</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`;
    if (verifyingOrganization) {
      titleText = `<h3 style="text-align:center">Grant SODA access to your current workspace</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`;
    }

    let footerText = `<a target="_blank" href="https://docs.sodaforsparc.io/docs/how-to/how-to-get-a-pennsieve-account" style="text-decoration: none;">I don't have a Pennsieve account</a>`;
    if (verifyingOrganization) {
      footerText = "";
    }
    let confirmButtonTextValue = "Connect to Pennsieve";
    if (verifyingOrganization) {
      confirmButtonTextValue = "Grant Access";
    }

    let result = await Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: confirmButtonTextValue,
      showCloseButton: false,
      focusConfirm: false,
      heightAuto: false,
      reverseButtons: window.reverseSwalButtons,
      showCancelButton: true,
      title: titleText,
      html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
          <input type="password" id="ps_password" class="swal2-input" placeholder="Password">`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },

      footer: footerText,

      didOpen: () => {
        $(".swal-popover").popover();
        let div_footer = document.getElementsByClassName("swal2-footer")[0];
        document.getElementsByClassName("swal2-popup")[0].style.width = "43rem";
        div_footer.style.flexDirection = "column";
        div_footer.style.alignItems = "center";
        if (!verifyingOrganization) {
          let swal_actions = document.getElementsByClassName("swal2-actions")[0];
          let api_button = document.createElement("button");
          let api_arrow = document.createElement("i");
          let helpText = document.createElement("p");
          helpText.innerText = "Recommended only if you sign in to Pennsieve with your ORCID iD.";
          helpText.classList.add("tip-content");
          // set margin to auto
          helpText.style.margin = "auto";

          api_button.innerText = "Connect with API key instead";
          // set length to 270
          api_arrow.classList.add("fas");
          api_arrow.classList.add("fa-arrow-right");
          api_arrow.style.marginLeft = "10px";
          api_button.type = "button";
          api_button.style.border = "";
          api_button.id = "api_connect_btn";
          api_button.classList.add("transition-btn");
          api_button.classList.add("api_key-btn");
          api_button.classList.add("back");
          api_button.style.display = "inline";
          api_button.appendChild(api_arrow);
          swal_actions.parentElement.insertBefore(api_button, div_footer);
          swal_actions.parentElement.insertBefore(helpText, div_footer);
          api_button.addEventListener("click", (e) => window.showBFAddAccountSweetalert(e));
        } else {
          // hide the cancel button
          let cancel_button = document.getElementsByClassName("swal2-cancel")[0];
          cancel_button.style.display = "none";
        }
      },
      preConfirm: async () => {
        Swal.resetValidationMessage();
        Swal.showLoading();
        const login = Swal.getPopup().querySelector("#ps_login").value;
        const password = Swal.getPopup().querySelector("#ps_password").value;
        if (!login || !password) {
          Swal.hideLoading();
          Swal.showValidationMessage(`Please enter email and password`);
          return;
        } else {
          let key_name = SODA_SPARC_API_KEY;
          let response = await get_api_key(login, password, key_name);
          if (response[0] == "failed") {
            let error_message = response[1];
            if (response[1]["message"] === "exceptions must derive from BaseException") {
              error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">It seems that you do not have access to your desired workspace on Pennsieve. See our <a target="_blank" href="https://docs.sodaforsparc.io/docs/next/how-to/how-to-get-a-pennsieve-account">[dedicated help page]</a> to learn how to get access</div>`;
            }
            if (response[1]["message"] === "Error: Username or password was incorrect.") {
              error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">Error: Username or password was incorrect</div>`;
            }
            Swal.hideLoading();
            Swal.showValidationMessage(error_message);
            document.getElementById("swal2-validation-message").style.flexDirection = "column";
          } else if (response["success"] == "success") {
            return {
              key: response["key"],
              secret: response["secret"],
              name: response["name"],
            };
          }
        }
      },
    });

    if (result.isConfirmed) {
      let titleText = "Adding account...";
      if (verifyingOrganization) {
        titleText = "Loading workspace details...";
      }
      Swal.fire({
        allowEscapeKey: false,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        showConfirmButton: false,
        title: titleText,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      let key_name = result.value.name;
      let apiKey = result.value.key;
      let apiSecret = result.value.secret;

      // lowercase the key_name the user provided
      // this is to prevent an issue caused by the pennsiev agent
      // wherein it fails to validate an account if it is not lowercase
      key_name = key_name.toLowerCase();
      //needs to be replaced
      try {
        await client.put(`/manage_datasets/account/username`, {
          keyname: key_name,
          key: apiKey,
          secret: apiSecret,
        });

        // set the user's email to be the window.defaultBfDataset value
        bfAccountOptions[key_name] = key_name;
        window.defaultBfAccount = key_name;
        window.defaultBfDataset = "Select dataset";

        try {
          let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
            params: {
              selected_account: window.defaultBfAccount,
            },
          });
          // reset the dataset field values
          $("#current-bf-dataset").text("None");
          $("#current-bf-dataset-generate").text("None");
          $(".bf-dataset-span").html("None");
          $("#para-continue-bf-dataset-getting-started").text("");

          // set the workspace field values to the user's current workspace
          let org = bf_account_details_req.data.organization;
          $(".bf-organization-span").text(org);

          showHideDropdownButtons("account", "show");
          confirm_click_account_function();
          window.updateBfAccountList();

          // If the clicked button has the data attribute "reset-guided-mode-page" and the value is "true"
          // then reset the guided mode page
          if (ev?.getAttribute("data-reset-guided-mode-page") == "true") {
            // Get the current page that the user is on in the guided mode
            const currentPage = window.CURRENT_PAGE.id;
            if (currentPage) {
              await window.openPage(currentPage);
            }
          }
        } catch (error) {
          clientError(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: "Something went wrong!",
            footer:
              '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
          });
          showHideDropdownButtons("account", "hide");
          confirm_click_account_function();
        }

        window.datasetList = [];
        window.defaultBfDataset = null;
        window.clearDatasetDropdowns();

        let titleText = "Successfully added! <br/>Loading your account details...";
        if (verifyingOrganization) {
          titleText = "Workspace details loaded!";
        }
        Swal.fire({
          allowEscapeKey: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "success",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          title: titleText,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      } catch (error) {
        clientError(error);
        Swal.showValidationMessage(userErrorMessage(error));
        Swal.close();
      }
    }
  }
};

var dropdownEventID = ''
window.openDropdownPrompt = async (ev, dropdown, show_timer = true) => {
  // if users edit current account
  if (dropdown === "bf") {
    await addBfAccount(ev, false);
  } else if (dropdown === "dataset") {
    dropdownEventID = ev?.id ?? "";

    // check the value of Current Organization
    // TODO: Test heavily
    let currentOrganization = $(".bf-organization-span:first").text();

    if (currentOrganization === "None") {
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "info",
        text: "Please select an organization first",
      });

      return;
    }

    $(".svg-change-current-account.dataset").css("display", "none");
    $("#div-permission-list-2").css("display", "none");
    $(".ui.active.green.inline.loader.small:not(.organization-loader)").css("display", "block");
    let currentLicenseText = currentDatasetLicense.innerText;
    let currentPermissionsText = window.currentAddEditDatasetPermission.innerText;

    setTimeout(async function () {
      // disable the Continue btn first
      $("#nextBtn").prop("disabled", true);
      var bfDataset = "";

      // if users edit Current dataset
      window.datasetPermissionDiv.style.display = "none";
      $(window.datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .find("option")
        .empty()
        .append('<option value="Select dataset">Search here...</option>')
        .val("Select dataset");

      $(window.datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "block");

      $("#bf-dataset-select-header").css("display", "none");

      $(window.datasetPermissionDiv).find("#para-filter-datasets-status-2").text("");
      $("#para-continue-bf-dataset-getting-started").text("");

      $(window.datasetPermissionDiv).find("#select-permission-list-2").val("All").trigger("change");
      $(window.datasetPermissionDiv).find("#curatebfdatasetlist").val("Select dataset").trigger("change");

      initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

      try {
        var accountPresent = await window.check_api_key();
      } catch (error) {
        console.error(error);
        $(".ui.active.green.inline.loader.small").css("display", "none");
        $(".svg-change-current-account.dataset").css("display", "block");
        accountPresent = false;
      }

      if (accountPresent === false) {
        //If there is no API key pair, warning will pop up allowing user to sign in
        await Swal.fire({
          icon: "warning",
          text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Yes",
          showCancelButton: true,
          reverseButtons: window.reverseSwalButtons,
          cancelButtonText: "I'll do it later",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            await window.openDropdownPrompt(this, "bf");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          } else {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          }
        });
        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not connected their Pennsieve account with SODA",
          1
        );
      } else {
        //account is signed in but no datasets have been fetched or created
        //invoke dataset request to ensure no datasets have been created
        if (window.datasetList.length === 0) {
          let responseObject;
          try {
            responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
              params: {
                selected_account: window.defaultBfDataset,
              },
            });
          } catch (error) {
            const emessage = userErrorMessage(error);
            await swalShowError("Failed to fetch datasets from Pennsieve", emessage);
            // Reset the dataset select UI
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
            return;
          }

          let result = responseObject.data.datasets;
          window.datasetList = [];
          window.datasetList = result;
          window.refreshDatasetList();
        }
      }

      //after request check length again
      //if 0 then no datasets have been created
      if (window.datasetList.length === 0) {
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Create new dataset",
          focusCancel: false,
          focusConfirm: true,
          showCloseButton: true,
          showCancelButton: true,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          title: "<h3 style='margin-bottom:20px !important'>No dataset found</h3>",
          html: "It appears that your don't have any datasets on Pennsieve with owner or manage permission.<br><br>Please create one to get started.",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          didOpen: () => {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          },
        }).then((result) => {
          if (result.isConfirmed) {
            $("#create_new_bf_dataset_btn").click();
          }
        });
        window.electron.ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not created any datasets",
          1
        );
      }

      //datasets do exist so display popup with dataset options
      //else datasets have been created
      if (window.datasetList.length > 0) {
        await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Confirm",
          focusCancel: true,
          focusConfirm: false,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          html: window.datasetPermissionDiv,
          reverseButtons: window.reverseSwalButtons,
          showCloseButton: true,
          showCancelButton: true,
          title: "<h3 style='margin-bottom:20px !important'>Select your dataset</h3>",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          willOpen: () => {
            $("#curatebfdatasetlist").selectpicker("hide");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#bf-dataset-select-div").hide();
          },
          didOpen: () => {
            $("#div-permission-list-2").css("display", "block");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            window.datasetPermissionDiv.style.display = "block";
            $("#curatebfdatasetlist").attr("disabled", false);
            $(window.datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#curatebfdatasetlist").selectpicker("show");
            $("#bf-dataset-select-div").show();
            $("#bf-organization-select-div").hide();

            bfDataset = $("#curatebfdatasetlist").val();
            let sweet_al = document.getElementsByClassName("swal2-html-container")[0];
            let sweet_alrt = document.getElementsByClassName("swal2-actions")[0];
            sweet_alrt.style.marginTop = "1rem";

            let tip_container = document.createElement("div");
            let tip_content = document.createElement("p");
            tip_content.innerText =
              "Only datasets where you have owner or manager permissions will be shown in the list";
            tip_content.classList.add("tip-content");
            tip_content.style.textAlign = "left";
            tip_container.style.marginTop = "1rem";
            tip_container.appendChild(tip_content);
            sweet_al.appendChild(tip_container);
          },
          preConfirm: () => {
            bfDataset = $("#curatebfdatasetlist").val();
            if (!bfDataset) {
              Swal.showValidationMessage("Please select a dataset!");

              $(window.datasetPermissionDiv)
                .find("#div-filter-datasets-progress-2")
                .css("display", "none");
              $("#curatebfdatasetlist").selectpicker("show");
              $("#curatebfdatasetlist").selectpicker("refresh");
              $("#bf-dataset-select-div").show();

              return undefined;
            } else {
              if (bfDataset === "Select dataset") {
                Swal.showValidationMessage("Please select a dataset!");

                $(window.datasetPermissionDiv)
                  .find("#div-filter-datasets-progress-2")
                  .css("display", "none");
                $("#curatebfdatasetlist").selectpicker("show");
                $("#curatebfdatasetlist").selectpicker("refresh");
                $("#bf-dataset-select-div").show();

                return undefined;
              } else {
                $("#license-lottie-div").css("display", "none");
                $("#license-assigned").css("display", "none");
                return bfDataset;
              }
            }
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            Swal.fire({
              allowEscapeKey: false,
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              showConfirmButton: false,
              timerProgressBar: false,
              title: "Loading your dataset details...",
              didOpen: () => {
                Swal.showLoading();
              },
            });

            // Ensure the dataset is not locked except for when the user is on the disseminate page (to allow for the dataset to be unsubmitted)
            // Ensure the dataset is not locked before proceeding
            const datasetIsLocked = await api.isDatasetLocked(window.defaultBfDataset, bfDataset);
            if (datasetIsLocked) {
              // Show the locked swal and return
              await Swal.fire({
                icon: "info",
                title: `${bfDataset} is locked from editing`,
                html: `
                  This dataset is currently being reviewed by the SPARC curation team, therefore, has been set to read-only mode. No changes can be made to this dataset until the review is complete.
                  <br />
                  <br />
                  If you would like to make changes to this dataset, please reach out to the SPARC curation team at <a href="mailto:curation@sparc.science" target="_blank">curation@sparc.science.</a>
                `,
                width: 600,
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
                confirmButtonText: "Ok",
                focusConfirm: true,
                allowOutsideClick: false,
              });
              // $("#submit_prepublishing_review-question-2").hide();
              $("#unshare-dataset-with-curation-team-message").addClass("hidden");
              // $("#begin-prepublishing-btn").addClass("hidden");
              return;
            }

            if (dropdownEventID === "dd-select-pennsieve-dataset") {
              $("#ds-name").val(bfDataset);
              $("#ds-description").val = $("#bf-dataset-subtitle").val;
              $("body").removeClass("waiting");
              $(".svg-change-current-account.dataset").css("display", "block");
              dropdownEventID = "";
              return;
            }
            $("#current-bf-dataset").text(bfDataset);
            $("#current-bf-dataset-generate").text(bfDataset);
            $(".bf-dataset-span").html(bfDataset);
            confirm_click_function();
            // $("#button-refresh-publishing-status").removeClass("hidden");
            $("#button-refresh-publishing-status").addClass("fa-spin");
            $("#para-review-dataset-info-disseminate").text("None");

            window.defaultBfDataset = bfDataset;
            // document.getElementById("ds-description").innerHTML = "";
            window.refreshDatasetList();
            $("#dataset-loaded-message").hide();

            showHideDropdownButtons("dataset", "show");
            // document.getElementById("div-rename-bf-dataset").children[0].style.display =
            //   "flex !important";

            // show the confirm button underneath the dataset select dropdown if one exists
            let btn = document.querySelector(".btn-confirm-ds-selection");
            btn.style.visibility = "visible";
            btn.style.display = "flex";

            // checkPrevDivForConfirmButton("dataset");
          } else if (result.isDismissed) {
            currentDatasetLicense.innerText = currentLicenseText;
            window.currentAddEditDatasetPermission.innerText = currentPermissionsText;
          }
        });

        if ($("#current-bf-dataset-generate").text() === "None") {
          showHideDropdownButtons("dataset", "hide");
        } else {
          showHideDropdownButtons("dataset", "show");
        }

        //currently changing it but not visually in the UI
        $("#bf_list_users_pi").val("Select PI");

        let oldDatasetButtonSelected = document.getElementById("oldDatasetDescription-selection");
        let newDatasetButtonSelected = document.getElementById("newDatasetDescription-selection");

        if (newDatasetButtonSelected.classList.contains("checked")) {
          document.getElementById("Question-prepare-dd-2").classList.add("show");

          document.getElementById("dd-select-pennsieve-dataset").style.display = "block";
          document.getElementById("ds-name").value = bfDataset;
        } else {
          // document.getElementById("Question-prepare-dd-4").classList.add("show");
          let onMyCompButton = document.getElementById("Question-prepare-dd-4-new");
          document.getElementById("dd-select-pennsieve-dataset").style.display = "none";
          let onPennsieveButton =
            onMyCompButton.parentElement.parentElement.children[1].children[0];
          if (onMyCompButton.classList.contains("checked")) {
            document.getElementById("Question-prepare-dd-3").classList.add("show");
          } else {
            // document.getElementById("Question-prepare-dd-5").classList.add("show");
          }
        }

        // update the gloabl dataset id
        for (const item of window.datasetList) {
          let { name, id } = item;
          if (name === bfDataset) {
            window.defaultBfDatasetId = id;
          }
        }

        let PI_users = document.getElementById("bf_list_users_pi");
        PI_users.value = "Select PI";
        $("#bf_list_users_pi").selectpicker("refresh");

        // log a map of datasetId to dataset name to analytics
        // this will be used to help us track private datasets which are not trackable using a datasetId alone
        window.electron.ipcRenderer.send(
          "track-event",
          "Dataset ID to Dataset Name Map",
          window.defaultBfDatasetId,
          window.defaultBfDataset
        );

        // document.getElementById("ds-description").innerHTML = "";
        window.refreshDatasetList();
        $("#dataset-loaded-message").hide();

        showHideDropdownButtons("dataset", "show");
        Swal.close();
        // checkPrevDivForConfirmButton("dataset");
      }

      // hide "Confirm" button if Current dataset set to None
      if ($("#current-bf-dataset-generate").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }

      // hide "Confirm" button if Current dataset under Getting started set to None
      if ($("#current-bf-dataset").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }
      $("body").removeClass("waiting");
      $(".svg-change-current-account.dataset").css("display", "block");
      $(".ui.active.green.inline.loader.small").css("display", "none");
      window.electron.ipcRenderer.send("track-event", "Success", "Selecting dataset", window.defaultBfDatasetId, 1);
    }, 10);
  } else if (dropdown === "organization") {
    // TODO: Change these classes to organization classes
    $(".svg-change-current-account.organization").css("display", "none");
    $("#div-permission-list-2").css("display", "none");
    $(".ui.active.green.inline.loader.small.organization-loader").css("display", "block");

    // hacky: wait for animations
    await window.wait(10);

    // disable the Continue btn first
    $("#nextBtn").prop("disabled", true);

    // disable the dropdown until the list of organizations is loaded - which happens elsewhere
    initializeBootstrapSelect("#curatebforganizationlist", "disabled");

    // check if there is an account
    let accountPresent = false;
    try {
      accountPresent = await window.check_api_key();
    } catch (error) {
      clientError(error);
      $(".ui.active.green.inline.loader.small").css("display", "none");
      $(".svg-change-current-account.dataset").css("display", "block");
      $("#div-permission-list-2").css("display", "block");
      initializeBootstrapSelect("#curatebforganizationlist", "show");
    }

    // if no account as them to connect one
    if (!accountPresent) {
      //If there is no API key pair, warning will pop up allowing user to sign in
      const { value: result } = await Swal.fire({
        icon: "warning",
        text: "It seems that you have not connected your Pennsieve account with SODA. We highly recommend you do that since most of the features of SODA are connected to Pennsieve. Would you like to do it now?",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "Yes",
        showCancelButton: true,
        reverseButtons: window.reverseSwalButtons,
        cancelButtonText: "I'll do it later",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      if (result.isConfirmed) {
        await window.openDropdownPrompt(this, "bf");
        $(".ui.active.green.inline.loader.small").css("display", "none");
        $(".svg-change-current-account.dataset").css("display", "block");
      } else {
        $(".ui.active.green.inline.loader.small").css("display", "none");
        $(".svg-change-current-account.dataset").css("display", "block");
        $("#div-permission-list-2").css("display", "block");

        await Swal.fire({
          icon: "warning",
          text: "You cannot select your workspace until you connect your account with Pennsieve.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Ok",
          showCancelButton: false,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        });
        initializeBootstrapSelect("#curatebforganizationlist", "show");
        return;
      }

      window.electron.ipcRenderer.send(
        "track-event",
        "Error",
        "Selecting dataset",
        "User has not connected their Pennsieve account with SODA",
        1
      );
    }

    // get the list of the user's available organizations
    //account is signed in but no datasets have been fetched or created
    //invoke dataset request to ensure no datasets have been created
    if (window.organizationList.length === 0) {
      let responseObject;
      try {
        responseObject = await client.get(`user/organizations`, {
          params: {
            selected_account: window.defaultBfDataset,
          },
        });
      } catch (error) {
        clientError(error);
        initializeBootstrapSelect("#curatebforganizationlist", "show");
        return;
      }

      let orgs = responseObject.data.organizations;
      window.organizationList = [];
      window.organizationNameToIdMapping = {};

      // deconstruct the names to the organization list
      for (const org in orgs) {
        window.organizationList.push(orgs[org]["organization"]["name"]);
        window.organizationNameToIdMapping[orgs[org]["organization"]["name"]] =
          orgs[org]["organization"]["id"];
      }

      window.refreshOrganizationList();
    }

    //datasets do exist so display popup with dataset options
    //else datasets have been created
    if (window.organizationList.length > 0) {
      const { value: result } = await Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        confirmButtonText: "Confirm",
        focusCancel: true,
        focusConfirm: false,
        heightAuto: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        html: window.datasetPermissionDiv,
        reverseButtons: window.reverseSwalButtons,
        showCloseButton: true,
        showCancelButton: true,
        title: "<h3 style='margin-bottom:20px !important'>Select your workspace</h3>",
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
        },
        willOpen: () => {
          $("#curatebforganizationlist").selectpicker("hide");
          $("#curatebforganizationlist").selectpicker("refresh");
          // $("#bf-organization-select-header").show();
          // TODO: How to make this unnecessary?
          // $("#bf-dataset-select-div").hide();
          // $("#bf-dataset-select-header").hide();
        },
        didOpen: () => {
          $("#div-permission-list-2").css("display", "block");
          $(".ui.active.green.inline.loader.small").css("display", "none");
          window.datasetPermissionDiv.style.display = "block";
          $("#curatebforganizationlist").attr("disabled", false);
          $(window.datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
          $("#curatebforganizationlist").selectpicker("refresh");
          $("#curatebforganizationlist").selectpicker("show");
          $("#bf-organization-select-div").show();
          $("#bf-dataset-select-div").hide();
          $("#bf-dataset-select-header").hide();

          window.bfOrganization = $("#curatebforganizationlist").val();
          let sweet_al = document.getElementsByClassName("swal2-html-container")[0];
          let sweet_alrt = document.getElementsByClassName("swal2-actions")[0];
          sweet_alrt.style.marginTop = "1rem";

          let tip_container = document.createElement("div");
          let tip_content = document.createElement("p");
          tip_content.innerText =
            "Only datasets where you have owner or manager permissions will be shown in the list";
          tip_content.classList.add("tip-content");
          tip_content.style.textAlign = "left";
          tip_container.style.marginTop = "1rem";
          tip_container.appendChild(tip_content);
          sweet_al.appendChild(tip_container);
        },
        preConfirm: () => {
          window.bfOrganization = $("#curatebforganizationlist").val();
          if (!window.bfOrganization) {
            Swal.showValidationMessage("Please select an organization!");

            $(window.datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
            $("#curatebforganizationlist").selectpicker("show");
            $("#curatebforganizationlist").selectpicker("refresh");
            $("#bf-organization-select-div").show();

            return undefined;
          }

          if (window.bfOrganization === "Select organization") {
            Swal.showValidationMessage("Please select an organization!");

            $(window.datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
            $("#curatebforganizationlist").selectpicker("show");
            $("#curatebforganizationlist").selectpicker("refresh");
            $("#bf-organization-select-div").show();

            return undefined;
          }

          $("#license-lottie-div").css("display", "none");
          $("#license-assigned").css("display", "none");
          return window.bfOrganization;
        },
      });

      if (!result) {
        $(".svg-change-current-account.organization").css("display", "block");
        $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
        $("#license-lottie-div").css("display", "block");
        $("#license-assigned").css("display", "block");
        window.currentDatasetLicense.innerText = window.currentDatasetLicense.innerText;
        initializeBootstrapSelect("#curatebforganizationlist", "show");
        return;
      }

      if (dropdownEventID === "dd-select-pennsieve-organization") {
        $("#ds-name").val(window.bfOrganization);
        $("#ds-description").val = $("#bf-dataset-subtitle").val;
        $("body").removeClass("waiting");
        $(".svg-change-current-account.dataset").css("display", "block");
        dropdownEventID = "";
        return;
      }

      window.refreshOrganizationList();
      $("#dataset-loaded-message").hide();

      showHideDropdownButtons("organization", "show");
      document.getElementById("div-rename-bf-dataset").children[0].style.display = "flex";

      // rejoin test organiztion
      const { value: res } = await Swal.fire({
        allowOutsideClick: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        confirmButtonText: "Switch Organization",
        showCloseButton: false,
        focusConfirm: false,
        heightAuto: false,
        reverseButtons: window.reverseSwalButtons,
        showCancelButton: true,
        title: `<h3 style="text-align:center">To switch your organization please provide your email and password</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`,
        html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
          <input type="password" id="ps_password" class="swal2-input" placeholder="Password">
          <p class="tip-content"> If you are using ORCID to sign in to Pennsieve view the official SODA docs <a href="https://docs.sodaforsparc.io/docs/how-to/how-to-use-workspaces" target="_blank">here</a> to learn how to change your workspace in SODA. </p>`,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        didOpen: () => {
          $(".swal-popover").popover();
          let div_footer = document.getElementsByClassName("swal2-footer")[0];
          document.getElementsByClassName("swal2-popup")[0].style.width = "43rem";
          div_footer.style.flexDirection = "column";
          div_footer.style.alignItems = "center";
        },
        preConfirm: async () => {
          const login = Swal.getPopup().querySelector("#ps_login").value;
          const password = Swal.getPopup().querySelector("#ps_password").value;

          // show a loading spinner in place of the confirm button HERE
          // $(".ui.active.green.inline.loader.small.organization-loader").css("display", "block");
          Swal.showLoading();

          if (!login) {
            Swal.showValidationMessage("Please enter your email!");
            Swal.hideLoading();
            return undefined;
          }

          if (!password) {
            Swal.showValidationMessage("Please enter your password!");
            Swal.hideLoading();
            return undefined;
          }

          try {
            let organizationId = window.organizationNameToIdMapping[window.bfOrganization];
            await api.setPreferredOrganization(login, password, organizationId, "soda-pennsieve");
          } catch (err) {
            clientError(err);
            await Swal.fire({
              backdrop: "rgba(0,0,0, 0.4)",
              heightAuto: false,
              icon: "error",
              title: "Could Not Switch Organizations",
              text: "Please try again shortly.",
            });
            Swal.hideLoading();
            // reset the UI to pre-org switch state
            $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
            $(".svg-change-current-account.organization").css("display", "block");
            return undefined;
          }

          // set the new organization information in the appropriate fields
          $("#current-bf-organization").text(window.bfOrganization);
          $("#current-bf-organization-generate").text(window.bfOrganization);
          $(".bf-organization-span").html(window.bfOrganization);
          // set the permissions content to an empty string
          await window.loadDefaultAccount();

          // confirm_click_function();

          return true;
        },
      });

      if (!res) {
        $(".svg-change-current-account.organization").css("display", "block");
        $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
        $("#license-lottie-div").css("display", "block");
        $("#license-assigned").css("display", "block");
        initializeBootstrapSelect("#curatebforganizationlist", "show");
        return;
      }

      // reset the selected dataset to None
      $(".bf-dataset-span").html("None");
      // reset the current owner span in the manage dataset make pi owner of a dataset tab
      $(".current-permissions").html("None");

      // If the button that triggered the organization has the class
      // guided-change-workspace (from guided mode), handle changes based on the ev id
      // otherwise, reset the FFM UI based on the ev class
      ev.classList.contains("guided-change-workspace")
        ? window.handleGuidedModeOrgSwitch(ev)
        : window.resetFFMUI(ev);

      // reset the dataset list
      window.datasetList = [];
      window.defaultBfDataset = null;
      window.clearDatasetDropdowns();

      // checkPrevDivForConfirmButton("dataset");
    }
    $("#button-refresh-publishing-status").addClass("hidden");

    // TODO: MIght need to hide if clicked twice / do similar logic as above
    // for organization span in those locations instead of a dataset span
    //; since the logic is there for a reason.
    initializeBootstrapSelect("#curatebforganizationlist", "show");
    showHideDropdownButtons("organization", "show");

    $("body").removeClass("waiting");
    $(".svg-change-current-account.organization").css("display", "block");
    $(".ui.active.green.inline.loader.small.organization-loader").css("display", "none");
  }
};

const get_api_key = (login, password, key_name) => {
  return new Promise(async (resolve) => {
    try {
      let bf_get_pennsieve_secret_key = await client.post(
        `/manage_datasets/pennsieve_api_key_secret`,
        {
          username: login,
          password: password,
          api_key: key_name,
        }
      );
      let res = bf_get_pennsieve_secret_key.data;
      resolve(res);
    } catch (error) {
      clientError(error);
      resolve(["failed", userErrorMessage(error)]);
    }
  });
};

export {
  currentConTable,
  showHideDropdownButtons,
  confirm_click_account_function,
  initializeBootstrapSelect,
  updateDatasetList,
  bfAccountOptions,
  get_api_key
}