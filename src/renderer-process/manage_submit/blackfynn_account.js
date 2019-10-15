const {ipcRenderer} = require('electron')

function showAddAccount(){
  document.getElementById('divAddAccount').style.display ='block';
  document.getElementById('divSelectAccount').style.display ='none';
}

function showSelectAccount(){
  document.getElementById('divAddAccount').style.display ='none';
  document.getElementById('divSelectAccount').style.display ='block';
}

document.querySelector('#addAccount').addEventListener('click', () => {
    showAddAccount()
})

document.querySelector('#selectAccount').addEventListener('click', () => {
    showSelectAccount()
})
