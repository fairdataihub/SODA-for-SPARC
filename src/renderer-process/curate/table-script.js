// Organized
function edit_row_org(no){
	document.getElementById("edit_button_org"+no).style.display="none"
	document.getElementById("save_button_org"+no).style.display="inline"

	var description=document.getElementById("description_row_org"+no)
	var description_data=description.innerHTML

	description.innerHTML="<input type='text' id='description_text_org"+no+"' value='"+description_data+"'>"

}

function save_row_org(no){
	var description_val=document.getElementById("description_text_org"+no).value

	document.getElementById("description_row_org"+no).innerHTML=description_val

	document.getElementById("edit_button_org"+no).style.display="inline"
	document.getElementById("save_button_org"+no).style.display="none"
}

function delete_row_org(no){
 document.getElementById("row-org"+no+"").outerHTML="";
}

// Not Organized
function edit_row(no){
	document.getElementById("edit_button"+no).style.display="none"
	document.getElementById("save_button"+no).style.display="inline"

	var description=document.getElementById("description_row"+no)
	var description_data=description.innerHTML

	description.innerHTML="<input type='text' id='description_text"+no+"' value='"+description_data+"'>"

}

function save_row(no){
	var description_val=document.getElementById("description_text"+no).value

	document.getElementById("description_row"+no).innerHTML=description_val

	document.getElementById("edit_button"+no).style.display="inline"
	document.getElementById("save_button"+no).style.display="none"
}

function delete_row(no){
 document.getElementById("row"+no+"").outerHTML="";
}

function dragEnter(event) {
  console.log(event)
    event.target.style.color = 'black';
}

function dragLeave(event) {
  console.log(event)
    event.target.style.color = 'inherit';
}

function dragDone(event) {
  console.log(event)
    event.target.style.color = 'inherit';
}
