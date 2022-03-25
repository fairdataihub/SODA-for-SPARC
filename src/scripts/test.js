const renderSubjectsMetadataTables = () => {
  //get subjects from the datasetStructureJSONObj
  let subjectsToMap = Object.keys(
    datasetStructureJSONObj.folders.primary.folders
  );

  let sampleMetadataRows = subjectsToMap.sort().map((subject) => {
    let sampleRows = Array(parseInt(subject.length))
      .fill(0)
      .map((subject, index) => {
        let tableIndex = index + 1;
        return `
          <tr>
            <td class="middle aligned collapsing text-center">
              <span class="sample-table-index">${tableIndex}</span>
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

    return `
      <table class="ui celled striped table" style="margin-bottom: 25px; min-width: 900px;">
        <thead>
          <tr>
            <th
              colspan="4"
              class="text-center"
              style="
                z-index: 2;
                height: 50px;
                position: sticky !important;
                top: -10px !important;
              "
            >
              <span class="sample-table-name">
                ${subject.subjectName}
              </span>
              <button
                class="ui primary basic button small"
                style="position: absolute;
                  right: 20px;
                  top: 50%;
                  transform: translateY(-50%);"
                onclick="addSampleFolder($(this))"
              >
                <i class="fas fa-folder-plus" style="margin-right: 7px"></i
                >Add ${subject.subjectName} sample
              </button>
            </th>
          </tr>
          <tr>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Index
            </th>
            <th style="z-index: 2; position: sticky !important; top: 40px !important">
              Sample ID
            </th>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Specify data files for the sample
            </th>
            <th
              class="center aligned"
              style="z-index: 2; position: sticky !important; top: 40px !important"
            >
              Delete
            </th>
          </tr>
        </thead>
        <tbody>
          ${sampleRows}
        </tbody>
      </table>
    `;
  });
  let subjectsmetadataContainer = document.getElementById(
    "subjects-metadata-table-container"
  );
  subjectsmetadataContainer.innerHTML = sampleMetadataRows.join("\n");
};
