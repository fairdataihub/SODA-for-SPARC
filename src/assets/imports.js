function docReady(fn) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// adds the apps HTML pages to the DOM
document.addEventListener("DOMContentLoaded", async function () {
  const links = document.querySelectorAll('link[rel="import"]');

  let contentIndex = document.querySelector("#content");

  // Import and add each page to the DOM
  for (let linkIdx = 0; linkIdx < links.length; linkIdx++) {
    let link = links[linkIdx];

    let doc = await fetch(link.href, {
      headers: {
        "Content-Type": "text/html",
      },
    });

    let content = await doc.text();

    var range = document.createRange();
    range.setStart(contentIndex, 0);
    contentIndex.appendChild(range.createContextualFragment(content));
  }

  // insert the script tags
  insertScript();
});

// TODO: Enhance this to call next script once one is done. Additionally, ensure it is called when the DOM is ready if not doing so already.
const insertScript = async () => {
  await ws(500)

  const preload = document.createElement("script");
  preload.src = "./preload.js";
  preload.defer = true;
  preload.type = "text/javascript";
  document.body.appendChild(preload);

  await ws(500)

  const script = document.createElement("script");
  script.src = "./scripts/others/renderer.js";
  script.defer = true;
  script.type = "text/javascript";
  document.body.appendChild(script);

  await ws(500);

  const tabEffects = document.createElement("script");
  tabEffects.src = "./scripts/others/tab-effects.js";
  tabEffects.defer = true;
  tabEffects.type = "text/javascript";
  document.body.appendChild(tabEffects);

  await ws(500);

  const disseminate = document.createElement("script");
  disseminate.src = "./scripts/disseminate/disseminate.js";
  disseminate.defer = true;
  disseminate.type = "text/javascript";
  document.body.appendChild(disseminate);

  await ws(500);

  const prePublishingReview = document.createElement("script");
  prePublishingReview.src = "./scripts/disseminate/prePublishingReview.js";
  prePublishingReview.defer = true;
  prePublishingReview.type = "text/javascript";
  document.body.appendChild(prePublishingReview);

  await ws(500);

  const manageDatasets = document.createElement("script");
  manageDatasets.src = "./scripts/manage-dataset/manage-dataset.js";
  manageDatasets.defer = true;
  manageDatasets.type = "text/javascript";
  document.body.appendChild(manageDatasets);

  await ws(500);

  const datasetDescription = document.createElement("script");
  datasetDescription.src = "./scripts/metadata-files/datasetDescription.js";
  datasetDescription.defer = true;
  datasetDescription.type = "text/javascript";
  document.body.appendChild(datasetDescription);

  await ws(500);

  const curateFunctions = document.createElement("script");
  curateFunctions.src = "./scripts/organize-dataset/curate-functions.js";
  curateFunctions.defer = true;
  curateFunctions.type = "text/javascript";
  document.body.appendChild(curateFunctions);

  await ws(500);

  const organizeDataset = document.createElement("script");
  organizeDataset.src = "./scripts/organize-dataset/organizeDS.js";
  organizeDataset.defer = true;
  organizeDataset.type = "text/javascript";
  document.body.appendChild(organizeDataset);

  await ws(500);

  const manifest = document.createElement("script");
  manifest.src = "./scripts/metadata-files/manifest.js";
  manifest.defer = true;
  manifest.type = "text/javascript";
  document.body.appendChild(manifest);

  await ws(500);

  const readmeChanges = document.createElement("script");
  readmeChanges.src = "./scripts/metadata-files/readme-changes.js";
  readmeChanges.defer = true;
  readmeChanges.type = "text/javascript";
  document.body.appendChild(readmeChanges);

  await ws(500);

  const subjectsSamples = document.createElement("script");
  subjectsSamples.src = "./scripts/metadata-files/subjects-samples.js";
  subjectsSamples.defer = true;
  subjectsSamples.type = "text/javascript";
  document.body.appendChild(subjectsSamples);

  await ws(500);

  const submission = document.createElement("script");
  submission.src = "./scripts/metadata-files/submission.js";
  submission.defer = true;
  submission.type = "text/javascript";
  document.body.appendChild(submission);
};

const ws = (ms) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
};
