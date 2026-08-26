const PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED = [
  "guided-dataset-generation-tab",
  "guided-dataset-dissemination-tab",
  "guided-select-starting-point-tab",
  "ffm-select-starting-point-tab",
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

export const guidedSkipPageSet = (pageSetName) => {
  const pages = document.querySelectorAll(`[data-page-set~="${pageSetName}"]`);
  const curationMode = window.sodaJSONObj["curation-mode"];
  const currentModeClass = curationMode === "guided" ? "gm" : "ffm";

  // Initialize skipped-page-sets if it doesn't exist
  if (!window.sodaJSONObj["skipped-page-sets"]) {
    window.sodaJSONObj["skipped-page-sets"] = [];
  }

  // add the page set to window.sodaJSONObj array if it isn't there already
  if (!window.sodaJSONObj["skipped-page-sets"].includes(pageSetName)) {
    window.sodaJSONObj["skipped-page-sets"].push(pageSetName);
  }

  for (const page of pages) {
    if (page.classList.contains(currentModeClass)) {
      guidedSkipPage(page.id);
    }
  }
};

export const guidedUnSkipPageSet = (className) => {
  const pages = document.querySelectorAll(`[data-page-set~="${className}"]`);
  const curationMode = window.sodaJSONObj["curation-mode"];
  const currentModeClass = curationMode === "guided" ? "gm" : "ffm";

  // remove the page set from window.sodaJSONObj array if it is there
  if (window.sodaJSONObj["skipped-page-sets"]) {
    if (window.sodaJSONObj["skipped-page-sets"].includes(className)) {
      window.sodaJSONObj["skipped-page-sets"].splice(
        window.sodaJSONObj["skipped-page-sets"].indexOf(className),
        1
      );
    }
  }

  for (const page of pages) {
    if (page.classList.contains(currentModeClass)) {
      // Check if this page has a workflow and if that workflow is skipped
      const workflowAttribute = page.getAttribute("data-guided-workflow");
      if (workflowAttribute) {
        const workflows = workflowAttribute.split(" ");
        const skippedWorkflows = window.sodaJSONObj["skipped-workflows"] || [];

        // If ALL workflows are skipped, don't unskip this page
        const allWorkflowsSkipped = workflows.every((workflow) =>
          skippedWorkflows.includes(workflow)
        );
        if (allWorkflowsSkipped) {
          continue; // Skip unskipping this page
        }
      }

      guidedUnSkipPage(page.id);
    }
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

  const workflowAttr = page.getAttribute("data-guided-workflow");
  const hasNonStandardWorkflow = workflowAttr?.includes("non-standard-data-workflow");

  // Check if this page belongs to any skipped workflow
  if (workflowAttr) {
    const workflows = workflowAttr.split(" ");
    const skippedWorkflows = window.sodaJSONObj["skipped-workflows"] || [];
    const allWorkflowsSkipped = workflows.every((workflow) => skippedWorkflows.includes(workflow));
    if (allWorkflowsSkipped) {
      return; // Don't unskip because all workflows are skipped
    }
  }

  // Check if this page belongs to any skipped page set
  const pageSetAttribute = page.getAttribute("data-page-set");
  if (pageSetAttribute) {
    const pageSets = pageSetAttribute.split(" ");
    const skippedPageSets = window.sodaJSONObj["skipped-page-sets"] || [];

    // Only keep skipped if ALL of this page's page sets are in the skipped list
    const allPageSetsSkipped = pageSets.every((set) => skippedPageSets.includes(set));
    if (allPageSetsSkipped) {
      return; // Don't unskip this page because all of its page sets are skipped
    }
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
      }
    }
  }

  if (curationMode === "gm") {
    // In GM mode, skip all pages that don't have "gm" in their class
    const allPages = Array.from(document.querySelectorAll(".guided--page"));
    for (const page of allPages) {
      if (!page.classList.contains("gm") || PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(page.id)) {
        guidedSkipPage(page.id);
      }
    }
  }
};

export const guidedSkipWorkflow = (workflowName) => {
  const pages = document.querySelectorAll(`[data-guided-workflow~="${workflowName}"]`);
  const curationMode = window.sodaJSONObj["curation-mode"];
  const currentModeClass = curationMode === "guided" ? "gm" : "ffm";

  // Initialize skipped-workflows if it doesn't exist
  if (!window.sodaJSONObj["skipped-workflows"]) {
    window.sodaJSONObj["skipped-workflows"] = [];
  }

  // add the workflow to window.sodaJSONObj array if it isn't there already
  if (!window.sodaJSONObj["skipped-workflows"].includes(workflowName)) {
    window.sodaJSONObj["skipped-workflows"].push(workflowName);
  }

  for (const page of pages) {
    if (page.classList.contains(currentModeClass)) {
      // Check if ALL of this page's workflows are now skipped
      const workflowAttribute = page.getAttribute("data-guided-workflow");
      if (workflowAttribute) {
        const workflows = workflowAttribute.split(" ");
        const skippedWorkflows = window.sodaJSONObj["skipped-workflows"];

        // Only skip this page if ALL of its workflows are skipped
        const allWorkflowsSkipped = workflows.every((workflow) =>
          skippedWorkflows.includes(workflow)
        );
        if (!allWorkflowsSkipped) {
          continue; // Skip this page, don't call guidedSkipPage
        }
      }

      guidedSkipPage(page.id);
    }
  }
};

export const guidedUnSkipWorkflow = (workflowName) => {
  const curationMode = window.sodaJSONObj["curation-mode"];
  const currentModeClass = curationMode === "guided" ? "gm" : "ffm";

  // remove the workflow from window.sodaJSONObj array if it is there
  if (window.sodaJSONObj["skipped-workflows"]) {
    if (window.sodaJSONObj["skipped-workflows"].includes(workflowName)) {
      window.sodaJSONObj["skipped-workflows"].splice(
        window.sodaJSONObj["skipped-workflows"].indexOf(workflowName),
        1
      );
    }
  }

  // Unskip all pages that have at least one active workflow
  const allPagesWithWorkflows = document.querySelectorAll(`[data-guided-workflow]`);

  for (const page of allPagesWithWorkflows) {
    if (page.classList.contains(currentModeClass)) {
      guidedUnSkipPageByWorkflow(page.id);
    }
  }
};

export const guidedUnSkipPageByWorkflow = (pageId) => {
  // Prevent unskipping pages that should always be skipped
  if (PAGES_THAT_SHOULD_ALWAYS_BE_SKIPPED.includes(pageId)) {
    return;
  }

  const page = document.getElementById(pageId);

  // If the page no longer exists, return
  if (!page) {
    return;
  }

  // Check if this page belongs to any skipped workflow
  const workflowAttribute = page.getAttribute("data-guided-workflow");
  if (workflowAttribute) {
    const workflows = workflowAttribute.split(" ");
    const skippedWorkflows = window.sodaJSONObj["skipped-workflows"] || [];

    // Only keep skipped if ALL of this page's workflows are in the skipped list
    const allWorkflowsSkipped = workflows.every((workflow) => skippedWorkflows.includes(workflow));

    if (allWorkflowsSkipped) {
      return; // Don't unskip this page because all of its workflows are skipped
    }
  }

  // Check if this page belongs to any skipped page set
  const pageSetAttribute = page.getAttribute("data-page-set");
  if (pageSetAttribute) {
    const pageSets = pageSetAttribute.split(" ");
    const skippedPageSets = window.sodaJSONObj["skipped-page-sets"] || [];

    // Skip this page if ANY of its page sets are skipped
    const anyPageSetSkipped = pageSets.some((set) => skippedPageSets.includes(set));
    if (anyPageSetSkipped) {
      return; // Don't unskip this page because at least one of its page sets is skipped
    }
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

export const getNonSkippedGuidedModePages = (parentElementToGetChildrenPagesFrom) => {
  let allChildPages = Array.from(
    parentElementToGetChildrenPagesFrom.querySelectorAll(".guided--page")
  );

  const nonSkippedChildPages = allChildPages.filter((page) => {
    const isSkipped = page.dataset.skipPage == "true";

    return !isSkipped;
  });

  return nonSkippedChildPages;
};

export const getNextPageNotSkipped = (currentPageID) => {
  const parentContainer = document.getElementById(currentPageID).closest(".guided--parent-tab");
  const siblingPages = getNonSkippedGuidedModePages(parentContainer).map((page) => page.id);

  const currentPageIndex = siblingPages.indexOf(currentPageID);
  if (currentPageIndex != siblingPages.length - 1) {
    const nextPageId = siblingPages[currentPageIndex + 1];

    return document.getElementById(nextPageId);
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
