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

function delete_row_metadata(no){
 document.getElementById("row_metadata"+no+"").outerHTML="";
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
    // event.target.style.color = 'black';
	event.target.style.backgroundColor = 'lightblue';
}

function dragLeave(event) {
    // event.target.style.color = 'inherit';
	event.target.style.backgroundColor = '';
}

function dragDone(event) {
    // event.target.style.color = 'inherit';
	event.target.style.backgroundColor = '';
}

document.getElementById("code_table").addEventListener("click", (event) => {
	rowDisplay(event)
});

document.getElementById("table-organized").addEventListener("click", (event) => {
	rowDisplay(event)
});

function rowDisplay(e) {
	if (e.target.className === "table-header" || e.target.className === "table-header openfolder") {
		if (e.target.className === "table-header"){
			e.target.className = "table-header openfolder"
		} else {
			e.target.className = "table-header"
		}
	    e.preventDefault();
	    var row = e.target.parentNode;
	    while ((row = nextTr(row)) && !/\bparent\b/.test(row.className)){
	        toggleIt(row)
	    }
	}
}

function nextTr(row) {
    while ((row = row.nextSibling) && row.nodeType != 1);
    return row;
}

function toggleIt(item){
     if (/\bopen\b/.test(item.className))
         item.className = item.className.replace(/\bopen\b/," ");
     else
         item.className += " open";
}
