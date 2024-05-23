import addDatasetAndOrganizationCardComponents from "../assets/component-utils/addDatasetAndOrganizationCards";

// Declare variables used by js scripts to see if the:
// 1. htmlSectionsAdded: When the seperate sections in HTML files have been rendered into the DOM
// 2. baseHtmlLoaded: When the base HTML (including React components) has been rendered into the DOM
window.htmlSectionsAdded = false;
window.baseHtmlLoaded = false;

// Array that will contain all of the sectionIDs that are to be
// inserted into contentIndex
let sectionIds = [];

//Function to wait for the HTML sections to be added to the DOM (before starting js scripts / rendering React components)
const waitForHtmlSectionsToInsertIntoDOM = () => {
  return new Promise((resolve) => {
    let interval = setInterval(() => {
      let allPresentInDom = true;
      for (const sectionId of sectionIds) {
        if (!document.getElementById(sectionId)) {
          allPresentInDom = false;
          break;
        }
      }
      if (allPresentInDom) {
        clearInterval(interval);
        resolve();
      } else {
        console.log("Nothing in DOM yet, waiting 100ms");
      }
    }, 100);
  });
};

//Function to wait for the React rendered sections to be added to the DOM
const waitForReactRenderedSectionsToInsertIntoDOM = async () => {
  while (
    [...document.querySelectorAll("[data-component-type]")].some(
      (section) => section.innerHTML === ""
    )
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

};

document.addEventListener("DOMContentLoaded", async function () {
  const links = document.querySelectorAll('link[rel="import"]');
  let contentIndex = document.querySelector("#content");

  // Import and add each page to the DOM
  for (const link of links) {
    let doc = await fetch(link.href, {
      headers: {
        "Content-Type": "text/html",
      },
    });

    let content = await doc.text();
    //get the id of the first section in content
    let id = content.match(/id="(.*)"/)[1];
    sectionIds.push(id);

    //Add the HTML Section to the #content container
    contentIndex.innerHTML += content;
  }

  // Wait for the HTML sections to be added to the DOM before rendering React components
  await waitForHtmlSectionsToInsertIntoDOM();
  window.htmlSectionsAdded = true;

  // Wait for the React rendered sections to be added to the DOM
  await waitForReactRenderedSectionsToInsertIntoDOM();
  addDatasetAndOrganizationCardComponents();

  // Set the base HTML loaded flag to true since all the HTML sections have been added to the DOM
  window.baseHtmlLoaded = true;
});
