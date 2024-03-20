import ReactDom from "react-dom";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";
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
  ReactDom.render(pageComponent, targetDiv);
});
