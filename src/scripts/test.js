const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(
    `guided-${highLevelFolderName}-subjects-aside`
  );
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically
  subjects = subjects.sort((a, b) => {
    const subjectNameA = a.subjectName.toLowerCase();
    const subjectNameB = b.subjectName.toLowerCase();
    if (subjectNameA < subjectNameB) return -1;
    if (subjectNameA > subjectNameB) return 1;
    return 0;
  });
  console.log(subjects);

  //Create the HTML for the subjects
  const sampleItems = subjects
    .map((sample) => {
      return `
          <a 
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            data-path-suffix="${
              subject.poolName ? subject.poolName + "/" : ""
            }${subject.subjectName}/${subject.subjectName}"
          >${subject.subjectName}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = sampleItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      const samplePageData = generateHighLevelFolderSubFolderPageData(
        "sample",
        "primary",
        pathSuffix
      );
      updateFolderStructureUI(samplePageData);
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};
