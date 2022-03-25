const renderSubjectsMetadataTable = () => {
  //get subjects from the datasetStructureJSONObj
  let subjectsToMap = Object.keys(
    datasetStructureJSONObj.folders.primary.folders
  );

  let subjectMetadataRows = subjectsToMap
    .sort()
    .map((subject) => {
      return `
        <tr>
            <td class="middle aligned collapsing text-center">
                <span class="sample-table-index">tableIndex</span>
            </td>
            <td class="middle aligned sample-id-cell">
                <input
                class="guided--input"
                type="text"
                name="guided-sample-id"
                placeholder="Enter sample ID and press enter"
                onkeyup="createSampleFolder(event, $(this))"
                />
            </td>
            <td
                class="middle aligned collapsing text-center"
                style="min-width: 130px"
            >
              <button
              type="button"
              class="btn btn-primary btn-sm"
              style="
                      background-color: var(--color-light-green) !important;
                      "
              onclick="openSampleFolder($(this))"
              >
              Add files
              </button>
            </td>
            <td class="middle aligned collapsing text-center">
                <i
                class="far fa-trash-alt"
                style="color: red; cursor: pointer"
                onclick="deleteSampleFolder($(this))"
                ></i>
            </td>
        </tr>
     `;
    })
    .join("\n");
  let subjectsMetadataContainer = document.getElementById(
    "subjects-metadata-table-container"
  );
  subjectsMetadataContainer.innerHTML = subjectMetadataRows.join("\n");
};
