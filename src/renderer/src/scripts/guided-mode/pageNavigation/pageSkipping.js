export const guidedSkipPage = (pageId) => {
  const page = document.getElementById(pageId);

  // If the page no longer exists, return
  if (!page) {
    return;
  }

  page.dataset.skipPage = "true";

  // add the page to window.sodaJSONObj array if it isn't there already
  if (!window.sodaJSONObj["skipped-pages"].includes(pageId)) {
    window.sodaJSONObj["skipped-pages"].push(pageId);
  }
};

export const guidedUnSkipPage = (pageId) => {
  const page = document.getElementById(pageId);

  // If the page no longer exists, return
  if (!page) {
    return;
  }

  page.dataset.skipPage = "false";

  // remove the page from window.sodaJSONObj array if it is there
  if (window.sodaJSONObj["skipped-pages"].includes(pageId)) {
    window.sodaJSONObj["skipped-pages"].splice(
      window.sodaJSONObj["skipped-pages"].indexOf(pageId),
      1
    );
  }
};

export const guidedResetSkippedPages = () => {
  const pagesThatShouldAlwaysBeskipped = [
    "guided-dataset-generation-tab",
    "guided-structure-folder-tab",
    "guided-dataset-dissemination-tab",
    "guided-select-starting-point-tab",
  ];
  for (const page of pagesThatShouldAlwaysBeskipped) {
    guidedSkipPage(page);
  }

  // Reset parent pages
  const parentPagesToResetSkip = Array.from(document.querySelectorAll(".guided--page"))
    .map((page) => page.id)
    .filter((pageID) => !pagesThatShouldAlwaysBeskipped.includes(pageID));

  for (const pageID of parentPagesToResetSkip) {
    guidedUnSkipPage(pageID);
  }
};

export const getNonSkippedGuidedModePages = (parentElementToGetChildrenPagesFrom) => {
  let allChildPages = Array.from(
    parentElementToGetChildrenPagesFrom.querySelectorAll(".guided--page")
  );
  const nonSkippedChildPages = allChildPages.filter((page) => {
    return page.dataset.skipPage != "true";
  });

  return nonSkippedChildPages;
};
