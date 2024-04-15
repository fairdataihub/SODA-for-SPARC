import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";

while (!window.htmlSectionsAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const pageIdToPageComponentMap = {
  "guided-name-subtitle-tab": <NameAndSubtitlePage />,
};

// get all elements with data attribute data-component-name="guided-mode-page"
const componentSlots = document.querySelectorAll('[data-component-type="guided-mode-page"]');
console.log(componentSlots);
componentSlots.forEach((targetDiv) => {
  const pageId = targetDiv.id;
  const pageHeader = targetDiv.getAttribute("data-page-header");
  const pageComponent = pageIdToPageComponentMap[pageId];
  const root = createRoot(targetDiv);
  root.render(<SodaComponentWrapper>{pageComponent}</SodaComponentWrapper>);
});
