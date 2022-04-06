const openCopySampleMetadataPopup = async (clickedSampleCopyMetadataButton) => {
  const copyFromSampleMetadataID = clickedSampleCopyMetadataButton
    .closest("tr")
    .find(".sample-metadata-id")
    .text();

  const initialCopyFromMetadata = `
          <div class="field text-left">
            <div class="ui radio checkbox">
              <input type="radio" name="copy-from" value="${copyFromSampleMetadataID}" checked="checked">
              <label>${copyFromSampleMetadataID}</label>
            </div>
          </div>
        `;
  const subjectsArray = guidedGetSubjects();

  let samplesArray = [];
  //Add all subjects in sodaJSONObj to samplesArray
  for (let subject of subjectsArray) {
    let subjectsSamples = guidedGetSubjectSamples(subject);
    samplesArray = samplesArray.concat(subjectsSamples);
  }

  const copyFromMetadata = samplesArray
    .filter((sample) => sample !== copyFromSampleMetadataID)
    .map((sample) => {
      return `
            <div class="field text-left">
              <div class="ui radio checkbox">
                <input type="radio" name="copy-from" value="${sample}">
                <label>${sample}</label>
              </div>
            </div>`;
    })
    .join("\n");

  const copyToMetadata = subjectsArray
    .map((subject) => {
      //get the samples of the subject being mapped over
      let subjectSamples = getSubjectSamples(subject);
      //create a checkbox for each of the samples
      let subjectSamplesCheckboxes = subjectSamples
        .map((sample) => {
          return `
            <div class="field text-left">
              <div class="ui checkbox">
              <input type="checkbox" name="copy-to" value="${sample}">
              <label>${sample}</label>
              </div>
            </div>
          `;
        })
        .join("\n");
      return `
        <label class="guided--form-label med">${subject}</label>
        ${subjectSamplesCheckboxes}
      `;
    })
    .join("\n");

  const copyMetadataElement = `
        <div class="space-between">
          <div class="ui form">
            <div class="grouped fields">
              <label class="guided--form-label text-left">Which sample would you like to copy metadata from?</label>
              ${initialCopyFromMetadata}
              ${copyFromMetadata}
            </div>
          </div>
          <div class="ui form">
            <div class="grouped fields">
              <label class="guided--form-label text-left">Which samples would you like to copy metadata to?</label>
              ${copyToMetadata}
            </div>
          </div>
        </div>
        `;
  swal
    .fire({
      width: 950,
      html: copyMetadataElement,
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      confirmButtonText: "Copy",
      focusCancel: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        const selectedCopyFromSample = $(
          "input[name='copy-from']:checked"
        ).val();
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSamples = [];
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSamples.push($(this).val());
        });

        let copyFromSampleData = [];
        //Add the data from the selected copy fro sample to cpoyFromSampleData array
        for (var i = 1; i < samplesTableData.length; i++) {
          if (samplesTableData[i][1] === selectedCopyFromSample) {
            //copy all elements from matching array except the first one
            copyFromSampleData = samplesTableData[i].slice(2);
          }
        }
        for (sample of selectedCopyToSamples) {
          let copyToSubjectHasMetadata = false;
          samplesTableData.forEach((sampleData, index) => {
            if (sampleData[1] === sample) {
              copyToSubjectHasmetadata = true;
              sampleData = [sampleData[0]];
              sampleData = sampleData.concat(copyFromSampleData);
              samplesTableData[index] = sampleData;
            }
          });
          if (!copyToSubjectHasMetadata) {
            newsampleData = [subject].concat(copyFromSampleData);
            samplesTableData.push(newsampleData);
          }
        }
      }
    });
};
