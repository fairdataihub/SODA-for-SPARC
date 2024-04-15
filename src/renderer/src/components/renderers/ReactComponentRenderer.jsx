import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";
import NavigationButton from "../buttons/Navigation";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";

// Wait for the HTML sections to be added to the DOM before rendering React components
while (!window.htmlSectionsAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const componentRenderActions = {
  "guided-mode-page": (componentSlot) => {
    // Map of guided mode page ids to their corresponding React components
    const pageIdToPageComponentMap = {
      "guided-name-subtitle-tab": <NameAndSubtitlePage />,
    };
    const pageId = componentSlot.id;
    const pageComponent = pageIdToPageComponentMap[pageId];

    // Create a React root and render the component
    const root = createRoot(componentSlot);
    root.render(<SodaComponentWrapper>{pageComponent}</SodaComponentWrapper>);
  },
  "external-link": (componentSlot) => {
    const url = componentSlot.getAttribute("data-url");
    const buttonText = componentSlot.getAttribute("data-button-text");
    const buttonType = componentSlot.getAttribute("data-button-type");

    // Create a React root and render the component
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <ExternalLink href={url} buttonText={buttonText} buttonType={buttonType} />
      </SodaComponentWrapper>
    );
  },
  "navigation-button": (componentSlot) => {
    const buttonId = componentSlot.getAttribute("data-button-id");
    const buttonTextNav = componentSlot.getAttribute("data-button-text");
    const navIcon = componentSlot.getAttribute("data-nav-icon");
    const buttonSize = componentSlot.getAttribute("data-button-size");
    const buttonColor = componentSlot.getAttribute("data-button-color");
    const buttonCustomWidth = componentSlot.getAttribute("data-button-custom-width");
    const buttonCustomClass = componentSlot.getAttribute("data-button-custom-class");

    // Create a React root and render the component
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <NavigationButton
          buttonId={buttonId}
          buttonText={buttonTextNav}
          navIcon={navIcon}
          buttonSize={buttonSize}
          buttonColor={buttonColor}
          buttonCustomWidth={buttonCustomWidth}
          buttonCustomClass={buttonCustomClass}
        />
      </SodaComponentWrapper>
    );
  },
};

// Get all DOM nodes with the data attribute "data-component-type"
const componentSlots = document.querySelectorAll("[data-component-type]");
componentSlots.forEach((componentSlot) => {
  const componentType = componentSlot.getAttribute("data-component-type");
  const renderAction = componentRenderActions[componentType];
  if (renderAction) {
    renderAction(componentSlot);
  } else {
    console.error("Unknown component type:", componentType);
  }
});
