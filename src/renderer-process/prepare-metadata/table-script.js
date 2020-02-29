// Milestone
function edit_milestone(no){
	document.getElementById("edit-milestone-button"+no).style.display="none"
	document.getElementById("save-milestone-button"+no).style.display="inline"

	milestone = document.getElementById("name-row-milestone"+no)
	date = document.getElementById("name-row-date"+no)
	milestoneData = milestone.innerHTML
	dateData = date.innerHTML

	// document.getElementById("myDate").defaultValue = dateData
	milestone.innerHTML="<input type='text' class='form-container-input' id='milestone_edit"+no+"' value='"+milestoneData+"'>"
	date.innerHTML="<input type='text' onfocus=\"(this.type='date')\" onblur=\"(this.type='text')\" class='form-container-input' id='milestone_date_edit"+no+"' value='"+dateData+"'>"
}


function save_milestone(no){
	var milestone_val=document.getElementById("milestone_edit"+no).value
  var milestone_date=document.getElementById("milestone_date_edit"+no).value

	document.getElementById("name-row-milestone"+no).innerHTML=milestone_val
  document.getElementById("name-row-date"+no).innerHTML=milestone_date

	document.getElementById("edit-milestone-button"+no).style.display="inline"
	document.getElementById("save-milestone-button"+no).style.display="none"
}

function delete_milestone(no){
 document.getElementById("row-milestone"+no+"").outerHTML="";
}
