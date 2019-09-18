const {ipcRenderer} = require('electron')

// SPARC folder
const selectCodeBtn = document.getElementById('select-code')
selectCodeBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-file-dialog-code')
})

const selectCodeDirectoryBtn = document.getElementById('select-code-directory')
selectCodeDirectoryBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-code')
})

ipcRenderer.on('selected-code', (event, path) => {
  var table=document.getElementById("code_table");
  var i
  for (i = 0; i < path.length; i++) { 
  	var table_len=(table.rows.length)-1;
  	var row = table.insertRow(table_len).outerHTML="<tr id='row"+table_len+"'><td id='name_row"+table_len+"'>"+ path[i] +"</td><td><input type='button' id='edit_button"+table_len+"' value='Edit' class='edit' onclick='edit_row("+table_len+")'> <input type='button' id='save_button"+table_len+"' value='Save' class='save' onclick='save_row("+table_len+")'> <input type='button' value='Delete' class='delete' onclick='delete_row("+table_len+")'></td></tr>";
	}
})

const selectSaveFileOrganizationBtn = document.getElementById('select-save-file-organization')
selectSaveFileOrganizationBtn.addEventListener('click', (event) => {
  ipcRenderer.send('open-folder-dialog-saveorganization')
})
ipcRenderer.on('selected-saveorganizationfolder', (event, path) => {
  document.getElementById('selected-save-file-organization').value = path
})
