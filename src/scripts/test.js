const specifySample = (event, poolNameInput) => {
  if (event.which == 13) {
    try {
      const poolName = poolNameInput.val().trim();
      console.log(poolName);
      const poolNameElement = `
        <div class="space-between" style="width: 250px;">
          <span class="pool-id">${poolName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer;"
            onclick="openPoolRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const poolSubjectSelectElement = `
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      `;
      const poolIdCellToAddNameTo = poolNameInput.parent();

      if (poolName.length > 0) {
        if (!subSamInputIsValid(poolName)) {
          //show alert message below pool name input if input is invalid and abort function
          generateAlertMessage(poolNameInput);
          return;
        }
        removeAlertMessageIfExists(poolNameInput);
        if (poolNameInput.attr("data-prev-name")) {
          const poolFolderToRename = poolNameInput.attr("data-prev-name");
          sodaJSONObj.renamePool(poolFolderToRename, poolName);
        } else {
          const poolSubjectsDropdownCell = poolNameInput.parent().next();

          //Add the new pool to sodaJSONObj
          sodaJSONObj.addPool(poolName);

          //Add the select2 base element
          poolSubjectsDropdownCell.html(poolSubjectSelectElement);

          //Get the newly created select2 element
          const newPoolSubjectsSelectElement = document.querySelector(
            `select[name="${poolName}-subjects-selection-dropdown"]`
          );

          //create a select2 dropdown for the pool subjects
          $(newPoolSubjectsSelectElement).select2({
            placeholder: "Select subjects",
            tags: true,
            width: "100%",
            closeOnSelect: false,
          });

          $(`select[name="${poolName}-subjects-selection-dropdown"]`).val(null);
          $(`select[name="${poolName}-subjects-selection-dropdown"]`).trigger(
            "change"
          );
          const updatePoolDropdown = (poolDropDown, poolName) => {
            poolDropDown.empty().trigger("change");
            //add subjects in pool to dropdown and set as selected
            const poolsSubjects = sodaJSONObj.getPoolSubjects(poolName);
            for (const subject of poolsSubjects) {
              var newOption = new Option(subject, subject, true, true);
              poolDropDown.append(newOption).trigger("change");
            }

            //add subject options not in pool to dropdown and set as unselected
            const subjectsNotInPools = sodaJSONObj.getAllSubjects();
            for (const subject of subjectsNotInPools) {
              var newOption = new Option(subject, subject, false, false);
              poolDropDown.append(newOption).trigger("change");
            }
          };
          $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
            updatePoolDropdown($(e.currentTarget), poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
            const subjectToRemove = e.params.data.id;
            sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
            const selectedSubject = e.params.data.id;
            sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
          });
        }
        poolIdCellToAddNameTo.html(poolNameElement);
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};
