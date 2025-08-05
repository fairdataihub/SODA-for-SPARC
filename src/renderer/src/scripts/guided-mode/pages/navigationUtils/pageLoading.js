export const setPageLoadingState = (boolLoadingState) => {
  const pageParentContainers = document.querySelectorAll(".guided--parent-tab");

  if (boolLoadingState === true) {
    // Add the loading div if it does not exist
    if (!document.getElementById("guided-loading-div")) {
      const loadingDivHtml = `
        <div class="guided--main-tab" id="guided-loading-div">
          <div class="guided--loading-div">
            <div class="lds-roller">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            Fetching data from Pennsieve...
          </div>
        </div>
      `;
      // Add the loading div as the last child of the guided-body div
      document.getElementById("guided-body").insertAdjacentHTML("beforeend", loadingDivHtml);
    }

    // Hide the page parent containers
    // Note: this class is added so we can easily show and hide the page parent containers without effecting the hidden status on the parent pages
    pageParentContainers.forEach((container) => {
      container.classList.add("temporary-hide");
    });
  }
  if (boolLoadingState === false) {
    // Remove the loading div from the dom if it exists
    const loadingDiv = document.getElementById("guided-loading-div");
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // Show the page parent containers
    // Note: this class is added so we can easily show and hide the page parent containers without effecting the hidden status on the parent pages
    pageParentContainers.forEach((container) => {
      container.classList.remove("temporary-hide");
    });
  }
};

export const guidedSetNavLoadingState = (loadingState) => {
  //depending on the boolean loading state will determine whether or not
  //to disable the primary and sub buttons along with the nav menu
  const mainBackButton = document.getElementById("guided-back-button");
  const mainContinueButton = document.getElementById("guided-next-button");
  const saveAndExitButton = document.getElementById("guided-button-save-and-exit");

  const navItems = document.querySelectorAll(".guided--nav-bar-section-page");

  if (loadingState === true) {
    mainBackButton.disabled = true;
    mainContinueButton.disabled = true;
    saveAndExitButton.disabled = true;
    mainBackButton.classList.add("loading");
    mainContinueButton.classList.add("loading");

    navItems.forEach((nav) => {
      nav.classList.add("disabled-nav");
    });
  }

  if (loadingState === false) {
    mainBackButton.disabled = false;
    mainContinueButton.disabled = false;
    mainBackButton.classList.remove("loading");
    mainContinueButton.classList.remove("loading");
    saveAndExitButton.disabled = false;

    navItems.forEach((nav) => {
      nav.classList.remove("disabled-nav");
    });
    // Hide the lading div if the loading div was showing
    setPageLoadingState(false);
  }
};
