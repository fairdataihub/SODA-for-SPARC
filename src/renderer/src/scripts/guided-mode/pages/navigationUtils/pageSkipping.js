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

export const guidedSkipPageSet = (className) => {
  const pages = document.querySelectorAll(`.${className}`);
  for (const page of pages) {
    guidedSkipPage(page.id);
  }
};

export const guidedUnSkipPageSet = (className) => {
  const pages = document.querySelectorAll(`.${className}`);
  for (const page of pages) {
    guidedUnSkipPage(page.id);
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

export const getNextPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);

  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != siblingPages.length - 1) {
    return document.getElementById(siblingPages[currentPageIndex + 1]);
  } else {
    const nextParentContainer = parentContainer.nextElementSibling;
    return getNonSkippedGuidedModePages(nextParentContainer)[0];
  }
};

export const getPrevPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);
  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != 0) {
    return document.getElementById(siblingPages[currentPageIndex - 1]);
  } else {
    const prevParentContainer = parentContainer.previousElementSibling;
    const prevParentContainerPages = getNonSkippedGuidedModePages(prevParentContainer);
    return prevParentContainerPages[prevParentContainerPages.length - 1];
  }
};

export const pageIsSkipped = (pageId) => {
  return window.sodaJSONObj["skipped-pages"].includes(pageId);
};
