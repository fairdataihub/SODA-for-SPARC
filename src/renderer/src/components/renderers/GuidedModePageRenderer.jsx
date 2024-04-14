import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const pageIdToPageComponentMap = {
  "guided-name-subtitle-tab": <NameAndSubtitlePage />,
};

const guidedModePageDivs = document.querySelectorAll(".react-rendered-guided-mode-page");
guidedModePageDivs.forEach((targetDiv) => {
  const pageId = targetDiv.id;
  const pageHeader = targetDiv.getAttribute("data-page-header");
  const pageComponent = pageIdToPageComponentMap[pageId];
  const root = createRoot(targetDiv);
  root.render(<SodaComponentWrapper>{pageComponent}</SodaComponentWrapper>);
});
