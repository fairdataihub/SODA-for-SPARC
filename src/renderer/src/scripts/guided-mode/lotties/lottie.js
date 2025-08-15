import {
  questionList,
  datasetMetadataIntroLottie,
  addScienceData,
  startNew,
  resumeExisting,
  dragDrop,
} from "../../../assets/lotties/lotties";
import lottie from "lottie-web";

const lottieAnimationManager = {
  animationData: {
    "guided-curation-preparation-intro-lottie": {
      animationData: questionList,
      loop: true,
      autoplay: true,
    },
    "guided-lottie-import-subjects-pools-samples-excel-file": {
      animationData: dragDrop,
      loop: true,
      autoplay: true,
    },
    "guided-lottie-import-subjects-folder-structure": {
      animationData: dragDrop,
      loop: true,
      autoplay: true,
    },
    "guided-dataset-metadata-intro-lottie": {
      animationData: datasetMetadataIntroLottie,
      loop: true,
      autoplay: true,
    },
    "guided-dataset-structure-intro-lottie": {
      animationData: addScienceData,
      loop: true,
      autoplay: true,
    },
    "guided-start-new-lottie": {
      animationData: startNew,
      loop: true,
      autoplay: true,
    },
    "guided-resume-exiting-lottie": {
      animationData: resumeExisting,
      loop: true,
      autoplay: true,
    },
  },

  animations: {},

  startAnimation: function (containerElementId) {
    const { animationData, loop, autoplay } = this.animationData[containerElementId];

    const container = document.getElementById(containerElementId);
    container.innerHTML = "";

    const anim = lottie.loadAnimation({
      container: container,
      animationData: animationData,
      renderer: "svg",
      loop: loop,
      autoplay: autoplay,
    });
    this.animations[containerElementId] = anim;
  },

  stopAnimation: function (containerElementId) {
    const runningAnimation = this.animations[containerElementId];
    if (runningAnimation) {
      runningAnimation.stop();
    }
  },
};

/**
 * @description Starts or stops all animations inside of a container
 * @param {string} containerId
 * @param {string} startOrStop
 * @returns {void}
 * @example
 * startOrStopAnimationsInContainer("container-with-lottie-containers", "start");
 * startOrStopAnimationsInContainer("container-with-lottie-containers", "stop");
 */
export const startOrStopAnimationsInContainer = (containerId, startOrStop) => {
  const container = document.getElementById(containerId);
  const animationContainers = container.getElementsByClassName("lottieAnimationContainer");
  for (const animationContainer of animationContainers) {
    const animationContainerId = animationContainer.id;

    if (startOrStop === "start") {
      lottieAnimationManager.startAnimation(animationContainerId);
    }
    if (startOrStop === "stop") {
      lottieAnimationManager.stopAnimation(animationContainerId);
    }
  }
};
