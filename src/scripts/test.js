case "guided-derivative-samples-organization-page": {
    renderSamplesHighLevelFolderAsideItems("derivative");
    guidedUpdateFolderStructure("derivative", "samples");
    $("#guided-file-explorer-elements").appendTo(
      $("#guided-derivative-samples-file-explorer-container")
    );

    //Hide the file explorer and show the intro
    document
      .getElementById("guided-file-explorer-elements")
      .classList.add("hidden");
    document
      .getElementById("guided-derivative-samples-file-explorer-intro")
      .classList.remove("hidden");

    //Load the black arrow lottie animation
    const derivativeSamplesFileExplorerBlackArrowLottieContainer =
      document.getElementById(
        "derivative-samples-file-explorer-black-arrow-lottie-container"
      );
    derivativeSamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
    lottie.loadAnimation({
      container: derivativeSamplesFileExplorerBlackArrowLottieContainer,
      animationData: blackArrow,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
  }

  case "guided-derivative-subjects-organization-page": {
    renderSubjectsHighLevelFolderAsideItems("derivative");
    guidedUpdateFolderStructure("derivative", "subjects");
    $("#guided-file-explorer-elements").appendTo(
      $("#guided-derivative-subjects-file-explorer-container")
    );
    //Hide the file explorer and show the intro
    document
      .getElementById("guided-file-explorer-elements")
      .classList.add("hidden");
    document
      .getElementById("guided-derivative-subjects-file-explorer-intro")
      .classList.remove("hidden");

    //Load the black arrow lottie animation
    const derivativeSubjectsFileExplorerBlackArrowLottieContainer =
      document.getElementById(
        "derivative-subjects-file-explorer-black-arrow-lottie-container"
      );
    derivativeSubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
    lottie.loadAnimation({
      container: derivativeSubjectsFileExplorerBlackArrowLottieContainer,
      animationData: blackArrow,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
  }