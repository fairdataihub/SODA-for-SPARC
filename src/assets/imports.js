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

const insertScript = () => {

  const preload = document.createElement("script");
  preload.src = "./preload.js";
  preload.defer = true;
  preload.type = "text/javascript";
  document.body.appendChild(preload);

  const script = document.createElement("script");
  script.src = "./scripts/others/renderer.js";
  script.defer = true;
  script.type = "text/javascript";
  document.body.appendChild(script);

  const tabEffects = document.createElement("script");
  tabEffects.src = "./scripts/others/tab-effects.js";
  tabEffects.defer = true;
  tabEffects.type = "text/javascript";
  document.body.appendChild(tabEffects);
};
