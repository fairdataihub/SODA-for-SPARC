const {ipcRenderer} = require('electron')

const selectDatasetBtn = document.getElementById('select-dataset')
selectDatasetBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-dataset')
})
ipcRenderer.on('selected-dataset', (event, path) => {
  document.getElementById('selected-dataset').value = path
})


// Metadata
const selectSubmissionBtn = document.getElementById('select-submission')
selectSubmissionBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-submission')
})
ipcRenderer.on('selected-submission', (event, path) => {
  document.getElementById('selected-submission').value = path
})

const selectDescriptionBtn = document.getElementById('select-description')
selectDescriptionBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-description')
})
ipcRenderer.on('selected-description', (event, path) => {
  document.getElementById('selected-description').value = path
})


const selectSubjectsBtn = document.getElementById('select-subjects')
selectSubjectsBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-subjects')
})
ipcRenderer.on('selected-subjects', (event, path) => {
  document.getElementById('selected-subjects').value = path
})

const selectSamplesBtn = document.getElementById('select-samples')
selectSamplesBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-samples')
})
ipcRenderer.on('selected-samples', (event, path) => {
  document.getElementById('selected-samples').value = path
})

const selectnewDatasetBtn = document.getElementById('select-new-dataset')
selectnewDatasetBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-newdataset')
})
ipcRenderer.on('selected-new-dataset', (event, path) => {
  document.getElementById('selected-new-dataset').value = path
})

const selectDatasetSubmitBtn = document.getElementById('select-submit-dataset')
selectDatasetSubmitBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-submit-dataset')
})
ipcRenderer.on('selected-submit-dataset', (event, path) => {
  document.getElementById('selected-submit-dataset').value = path
})