const {SodaHeader} = require("../stories/SodaHeader")

const links = document.querySelectorAll('link[rel="import"]');

// Import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
  let template = link.import.querySelector(".task-template");
  let clone = document.importNode(template.content, true);
  //if (link.href.match('about.html')) {
  //  document.querySelector('body').appendChild(clone)
  //} else {
  document.querySelector(".content").appendChild(clone);
  //}
});


// once finished add the Storybook designed Add/edit subtitle section to the page - alternatively we can just use classes
let subtitleHeader = SodaHeader({headerText: "Manage Datasets - Add/edit subtitle", 
                                      needHelpLink: "https://docs.sodaforsparc.io/docs/manage-dataset/add-edit-subtitle" 
                                    })

document.querySelector("#add_edit_subtitle_parent-tabc").insertAdjacentElement("afterbegin", subtitleHeader);

