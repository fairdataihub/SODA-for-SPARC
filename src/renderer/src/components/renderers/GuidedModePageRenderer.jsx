import ReactDom from "react-dom";

import GuidedModePageContainer from "../containers/GuidedModePageContainer";

const divs = document.querySelectorAll(".react-rendered-guided-mode-page");
divs.forEach((targetDiv) => {
  const pageHeader = targetDiv.id;
  const pageId = targetDiv.getAttribute("data-page-id");
  console.log("pageHeader: ", pageHeader);
  console.log("pageId: ", pageId);
  ReactDom.render(<GuidedModePageContainer pageId={pageId} pageHeader={pageHeader} />, targetDiv);
});
