import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";
import NavigationButton from "../buttons/Navigation";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";
import BioLucidaImageListSelectPage from "../pages/BioLucidaImageListSelect";
import MicroscopyImageConfirmationPage from "../pages/MicroscopyImageConfirmationPage";
import MicroscopyImageMetadataFormPage from "../pages/MicroscopyImageMetadataFormPage";
import BioLucidaLogin from "../pages/BioLucidaLogin";
import DropdownSelect from "../common/DropdownSelect";
import GenericButton from "../buttons/Generic";

// Wait for the HTML sections to be added to the DOM before rendering React components
while (!window.htmlSectionsAdded) {
  console.log("Waiting for HTML sections to load...");
  await new Promise((resolve) => setTimeout(resolve, 5));
}

// Helper function to create a React root and render the component inside SodaComponentWrapper
const renderComponent = (componentSlot, component) => {
  const root = createRoot(componentSlot);
  root.render(<SodaComponentWrapper>{component}</SodaComponentWrapper>);
};

// Define a mapping of component types to their render functions
const componentRenderActions = {
  "guided-mode-page": (componentSlot) => {
    // Map of guided mode page IDs to their corresponding React components
    const pageIdToPageComponentMap = {
      "guided-name-subtitle-tab": <NameAndSubtitlePage />,
      "guided-biolucida-image-selection-tab": <BioLucidaImageListSelectPage />,
      "guided-microscopy-image-confirmation-tab": <MicroscopyImageConfirmationPage />,
      "guided-biolucida-login-tab": <BioLucidaLogin />,
      "guided-microscopy-image-metadata-form-tab": <MicroscopyImageMetadataFormPage />,
    };
    const pageId = componentSlot.id;
    const pageComponent = pageIdToPageComponentMap[pageId];
    renderComponent(componentSlot, pageComponent);
  },
  "external-link": (componentSlot) => {
    // Extract attributes for ExternalLink component
    const url = componentSlot.getAttribute("data-url");
    const buttonText = componentSlot.getAttribute("data-button-text");
    const buttonType = componentSlot.getAttribute("data-button-type");
    renderComponent(
      componentSlot,
      <ExternalLink href={url} buttonText={buttonText} buttonType={buttonType} />
    );
  },
  "dropdown-select": (componentSlot) => {
    // Extract the ID for DropdownSelect component
    const id = componentSlot.id;
    renderComponent(componentSlot, <DropdownSelect id={id} />);
  },
  "navigation-button": (componentSlot) => {
    // Extract attributes for NavigationButton component
    const buttonId = componentSlot.getAttribute("data-button-id");
    const buttonTextNav = componentSlot.getAttribute("data-button-text");
    const navIcon = componentSlot.getAttribute("data-nav-icon");
    const buttonSize = componentSlot.getAttribute("data-button-size");
    const buttonColor = componentSlot.getAttribute("data-button-color");
    const buttonCustomWidth = componentSlot.getAttribute("data-button-custom-width");
    const buttonCustomClass = componentSlot.getAttribute("data-button-custom-class");
    renderComponent(
      componentSlot,
      <NavigationButton
        buttonId={buttonId}
        buttonText={buttonTextNav}
        navIcon={navIcon}
        buttonSize={buttonSize}
        buttonColor={buttonColor}
        buttonCustomWidth={buttonCustomWidth}
        buttonCustomClass={buttonCustomClass}
      />
    );
  },
  "generic-button": (componentSlot) => {
    // Extract attributes for GenericButton component
    const id = componentSlot.getAttribute("data-button-id");
    const variant = componentSlot.getAttribute("data-variant");
    const size = componentSlot.getAttribute("data-size");
    const color = componentSlot.getAttribute("data-color");
    const text = componentSlot.getAttribute("data-text");
    renderComponent(
      componentSlot,
      <GenericButton id={id} variant={variant} size={size} color={color} text={text} />
    );
  },
};

// Get all DOM nodes with the data attribute "data-component-type"
const componentSlots = document.querySelectorAll("[data-component-type]");
componentSlots.forEach((componentSlot) => {
  // Get the component type and corresponding render function
  const componentType = componentSlot.getAttribute("data-component-type");
  const renderAction = componentRenderActions[componentType];

  // Check if a render function is defined for the component type
  if (renderAction) {
    renderAction(componentSlot); // Render the component
  } else {
    console.error(`No render action found for component type: ${componentType}`);
  }
});
