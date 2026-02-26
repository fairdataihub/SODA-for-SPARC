const PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED = [
  "guided-dataset-generation-tab",
  "guided-dataset-dissemination-tab",
  "guided-select-starting-point-tab",
];

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
  // Prevent unskipping pages that should always be skipped
  if (PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(pageId)) {
    return;
  }

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

export const guidedResetSkippedPages = (curationMode) => {
  // Skip pages that should always be skipped
  for (const page of PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED) {
    guidedSkipPage(page);
  }

  // Reset (unskip) all regular guided pages (excluding pages that should always be skipped)
  const pagesToUnskip = Array.from(document.querySelectorAll(".guided--page"))
    .map((page) => page.id)
    .filter((pageID) => !PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(pageID));

  for (const pageID of pagesToUnskip) {
    guidedUnSkipPage(pageID);
  }

  // Handle FFM vs GM mode page skipping
  if (curationMode === "ffm") {
    // In FFM mode, skip all pages that don't have "ffm" in their class
    const allPages = Array.from(document.querySelectorAll(".guided--page"));
    for (const page of allPages) {
      if (
        !page.classList.contains("ffm") ||
        PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(page.id)
      ) {
        guidedSkipPage(page.id);
      } else {
        console.log(`FFM mode: Keeping page ${page.id} (has 'ffm' class)`);
      }
    }
  }

  if (curationMode === "gm") {
    // In GM mode, skip all pages that don't have "gm" in their class
    const allPages = Array.from(document.querySelectorAll(".guided--page"));
    for (const page of allPages) {
      if (!page.classList.contains("gm") || PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(page.id)) {
        guidedSkipPage(page.id);
      } else {
        console.log(`GM mode: Keeping page ${page.id} (has 'gm' class)`);
      }
    }
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
    // Keep searching through subsequent parent containers until we find a non-skipped page
    let nextParentContainer = parentContainer.nextElementSibling;
    while (nextParentContainer) {
      const nextPages = getNonSkippedGuidedModePages(nextParentContainer);
      if (nextPages.length > 0) {
        return nextPages[0];
      }
      nextParentContainer = nextParentContainer.nextElementSibling;
    }
    console.log(
      `getNextPageNotSkipped: No non-skipped pages available in any subsequent parent container from ${currentPageID}`
    );
    return undefined;
  }
};

export const getPrevPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);
  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != 0) {
    return document.getElementById(siblingPages[currentPageIndex - 1]);
  } else {
    // Keep searching through previous parent containers until we find a non-skipped page
    let prevParentContainer = parentContainer.previousElementSibling;
    while (prevParentContainer) {
      const prevPages = getNonSkippedGuidedModePages(prevParentContainer);
      if (prevPages.length > 0) {
        return prevPages[prevPages.length - 1];
      }
      prevParentContainer = prevParentContainer.previousElementSibling;
    }
    console.log(
      `getPrevPageNotSkipped: No non-skipped pages available in any previous parent container from ${currentPageID}`
    );
    return undefined;
  }
};

export const pageIsSkipped = (pageId) => {
  return window.sodaJSONObj["skipped-pages"].includes(pageId);
};

export const returnUserToFirstPage = async () => {
  const firstPageID = getNonSkippedGuidedModePages(document)[0].id;
  await window.openPage(firstPageID);
};
