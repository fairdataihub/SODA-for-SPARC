// Milestone
function edit_milestone(no){
	document.getElementById("edit-milestone-button"+no).style.display="none"
	document.getElementById("save-milestone-button"+no).style.display="inline"

  document.getElementById("name-row-milestone"+no).contentEditable=true
  document.getElementById("name-row-date"+no).contentEditable=true
}

function save_milestone(no){
	var milestone_val=document.getElementById("name-row-milestone"+no).value
  var milestone_date=document.getElementById("name-row-date"+no).value

	document.getElementById("name-row-milestone"+no).innerHTML=milestone_val
  document.getElementById("name-row-date"+no).innerHTML=milestone_date

	document.getElementById("edit-milestone-button"+no).style.display="inline"
	document.getElementById("save-milestone-button"+no).style.display="none"
}

function delete_milestone(no){
 document.getElementById("row-milestone"+no+"").outerHTML="";
}
