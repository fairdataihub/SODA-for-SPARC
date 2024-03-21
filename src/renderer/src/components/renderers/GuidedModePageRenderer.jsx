import ReactDom from "react-dom";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const pageIdToPageComponentMap = {
  "guided-name-subtitle-tab": <NameAndSubtitlePage />,
};

const divs = document.querySelectorAll(".react-rendered-guided-mode-page");
divs.forEach((targetDiv) => {
  const pageId = targetDiv.id;
  const pageHeader = targetDiv.getAttribute("data-page-header");
  const pageComponent = pageIdToPageComponentMap[pageId];
  console.log("pageHeader: ", pageHeader);
  console.log("pageId: ", pageId);
  ReactDom.render(<SodaComponentWrapper>{pageComponent}</SodaComponentWrapper>, targetDiv);
});
