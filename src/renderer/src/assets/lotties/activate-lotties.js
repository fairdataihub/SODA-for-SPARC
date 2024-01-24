import lottie from "lottie-web";
import { contact_lottie } from "./contact-us-lotties";
import { heartLottie } from "./overview-lotties";
import { existingDataset, modifyDataset } from "./lotties";
import { docu_lottie } from "./documentation-lotties";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

let contact_lottie_container = document.getElementById("contact-us-lottie");
let contact_lottie_animation = lottie.loadAnimation({
  container: contact_lottie_container,
  animationData: contact_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});

let madeWithLoveContainer = document.getElementById("made-with-love-lottie");
let contactHeartLottie = lottie.loadAnimation({
  container: madeWithLoveContainer,
  animationData: heartLottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

let contact_us_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = mutation.target.getAttribute(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      contact_lottie_animation.play();
      contactHeartLottie.play();
    } else {
      //stop lottie to preserve memory
      contact_lottie_animation.stop();
      contactHeartLottie.stop();
    }
  });
});

let contact_section = document.getElementById("contact-us-section");
contact_us_lottie_observer.observe(contact_section, {
  attributes: true,
  attributeFilter: ["class"],
});

// overview page lotties
let existingDatasetLottieContainer = document.getElementById("existing-dataset-lottie");
existingDatasetLottieContainer.innerHTML = "";
let existingDatasetLottie = lottie.loadAnimation({
  container: existingDatasetLottieContainer,
  animationData: existingDataset,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

let modifyDatasetLottieContainer = document.getElementById("edit-dataset-component-lottie");
modifyDatasetLottieContainer.innerHTML = "";
let editDatasetLottie = lottie.loadAnimation({
  container: modifyDatasetLottieContainer,
  animationData: modifyDataset,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

// A mutation observer (watches the classes of the given element)
// On changes this will do some work with the lotties
let sectionObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = $(mutation.target).prop(mutation.attributeName);

    if (attributeValue.includes("is-shown") == true) {
      //add lotties
      existingDatasetLottie.play();
      editDatasetLottie.play();
      // heart_container.play();
    } else {
      existingDatasetLottie.stop();
      editDatasetLottie.stop();
      // heart_container.stop();
    }
  });
});

let doc_lottie = document.getElementById("documentation-lottie");
let documentation_lottie = lottie.loadAnimation({
  container: doc_lottie,
  animationData: docu_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});

let documentation_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      documentation_lottie.play();
    } else {
      // stop lottie to preserve memory
      documentation_lottie.stop();
    }
  });
});

let guidedModeSection = document.getElementById("guided_mode-section");

sectionObserver.observe(guidedModeSection, {
  attributes: true,
  attributeFilter: ["class"],
});
