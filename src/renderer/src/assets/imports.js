import addDatasetAndOrganizationCardComponents from "../assets/component-utils/addDatasetAndOrganizationCards";

const loadSections = async () => {
  const links = document.querySelectorAll('link[rel="import"]');
  let contentIndex = document.querySelector("#content");
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

  // Check to see if the links have been added to the DOM
  // If not, try again in 100ms
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
  addDatasetAndOrganizationCardComponents();
  window.htmlPagesAdded = true;

  // Return a promise that resolves once all operations are completed
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.htmlPagesAdded) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};

// Call loadSections and wait for it to finish
await loadSections();
