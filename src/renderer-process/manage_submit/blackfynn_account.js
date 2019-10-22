const {ipcRenderer} = require('electron')

function showAddAccount(){
  document.getElementById('div-add-account').style.display ='block';
  document.getElementById('div-select-account').style.display ='none';
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
