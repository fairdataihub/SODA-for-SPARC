import addDatasetAndOrganizationCardComponents from "../assets/component-utils/addDatasetAndOrganizationCards";

// adds the apps HTML pages to the DOM
window.htmlSectionsAdded = false;
document.addEventListener("DOMContentLoaded", async function () {
  const links = document.querySelectorAll('link[rel="import"]');
  let contentIndex = document.querySelector("#content");

  // Array that will contain all of the sectionIDs that are to be
  // inserted into contentIndex
  let sectionIds = [];

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

  //Check to see if the links have been added to the DOM
  //If not, try again in 100ms
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

  await waitForHtmlSectionsToInsertIntoDOM();

  const waitForReactRenderedSectionsToInsertIntoDOM = async () => {
    const allSections = document.querySelectorAll("[data-component-type]");
    console.log("All sections", allSections);
    // Make sure all sections have html inserted into them
    for (const section of allSections) {
      if (!section.innerHTML) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };
  addDatasetAndOrganizationCardComponents();
  window.htmlSectionsAdded = true;
});
