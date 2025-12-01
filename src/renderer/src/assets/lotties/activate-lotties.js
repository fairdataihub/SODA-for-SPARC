import lottie from "lottie-web";
import { contact_lottie } from "./contact-us-lotties";
import { heartLottie } from "./overview-lotties";
import { existingDataset, modifyDataset, successValidatedFiles, partyLottie } from "./lotties";
import { docu_lottie } from "./documentation-lotties";

while (!window.baseHtmlLoaded) {
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

let madeWithLoveContainerAbout = document.getElementById("made-with-love-lottie-about");
let contactHeartLottieAbout = lottie.loadAnimation({
  container: madeWithLoveContainerAbout,
  animationData: heartLottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

let contact_us_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = mutation.target.getAttribute(mutation.attributeName);
    if (attributeValue.includes("is-shown")) {
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

let about_us_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = mutation.target.getAttribute(mutation.attributeName);
    if (attributeValue.includes("is-shown")) {
      //play lottie
      contactHeartLottieAbout.play();
    } else {
      //stop lottie to preserve memory
      contactHeartLottieAbout.stop();
    }
  });
});

let about_section = document.getElementById("about-us-section");
about_us_lottie_observer.observe(about_section, {
  attributes: true,
  attributeFilter: ["class"],
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
    if (attributeValue.includes("is-shown")) {
      //play lottie
      documentation_lottie.play();
    } else {
      // stop lottie to preserve memory
      documentation_lottie.stop();
    }
  });
});

let successValidatedFilesContainer = document.getElementById("success-validated-files-lottie");
let successValidatedFiles_lottie = lottie.loadAnimation({
  container: successValidatedFilesContainer,
  animationData: successValidatedFiles /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
let successValidatedFiles_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown")) {
      //play lottie
      successValidatedFiles_lottie.play();
    } else {
      // stop lottie to preserve memory
      successValidatedFiles_lottie.stop();
    }
  });
});
let successValidatedFilesSewction = document.getElementById("div-validate-dataset-success");
successValidatedFiles_lottie_observer.observe(successValidatedFilesSewction, {
  attributes: true,
  attributeFilter: ["class"],
});

let successValidatedFilesContainerGuided = document.getElementById(
  "guided--success-validated-files-lottie"
);
let successValidatedFiles_lottieGuided = lottie.loadAnimation({
  container: successValidatedFilesContainerGuided,
  animationData: successValidatedFiles /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
let successValidatedFiles_lottie_observerGuided = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown")) {
      //play lottie
      successValidatedFiles_lottieGuided.play();
    } else {
      // stop lottie to preserve memory
      successValidatedFiles_lottieGuided.stop();
    }
  });
});

let successValidatedFilesSectionGuided = document.getElementById(
  "guided--div-validate-dataset-success"
);
successValidatedFiles_lottie_observerGuided.observe(successValidatedFilesSectionGuided, {
  attributes: true,
  attributeFilter: ["class"],
});

let partyLottieContainer = document.getElementById("party-lottie");
let partyLottieAnimation = lottie.loadAnimation({
  container: partyLottieContainer,
  animationData: partyLottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

let partyLottieObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    let attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown")) {
      //play lottie
      partyLottieAnimation.play();
    } else {
      // stop lottie to preserve memory
      partyLottieAnimation.stop();
    }
  });
});
let partyLottieSection = document.getElementById("party-lottie-section");
partyLottieObserver.observe(partyLottieSection, {
  attributes: true,
  attributeFilter: ["class"],
});
