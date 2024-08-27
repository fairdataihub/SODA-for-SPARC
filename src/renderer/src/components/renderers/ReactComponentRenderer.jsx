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
import SingleColumnTable from "../tables/singleColumn";
import ProcessStatusTable from "../tables/processStatusTable";
import PennsieveAgentCheckDisplay from "../backgroundServices/PennsieveAgentCheckDisplay";
import MicrofilePlusInstallationCheckDisplay from "../backgroundServices/MicrofilePlusInstallationCheckDisplay";

// Wait for the HTML sections to be added to the DOM before rendering React components
while (!window.htmlSectionsAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

// Helper function to create a React root and render the component inside SodaComponentWrapper
const renderComponent = (componentSlot, component) => {
  const root = createRoot(componentSlot);
  root.render(<SodaComponentWrapper>{component}</SodaComponentWrapper>);
};

// Mapping of component types to their render functions
const componentTypeRenderers = {
  "guided-mode-page": (componentSlot) => {
    const pageIdToPageComponentMap = {
      "guided-name-subtitle-tab": <NameAndSubtitlePage />,
      "guided-biolucida-image-selection-tab": <BioLucidaImageListSelectPage />,
      "guided-microscopy-image-confirmation-tab": <MicroscopyImageConfirmationPage />,
      "guided-biolucida-login-tab": <BioLucidaLogin />,
      "guided-microscopy-image-metadata-form-tab": <MicroscopyImageMetadataFormPage />,
    };
    const pageComponent = pageIdToPageComponentMap[componentSlot.id];
    if (!pageComponent) {
      console.error(`No page component found for page ID: ${componentSlot.id}`);
    } else {
      renderComponent(componentSlot, pageComponent);
    }
  },
  "external-link": (componentSlot) => {
    const props = {
      href: componentSlot.getAttribute("data-url"),
      buttonText: componentSlot.getAttribute("data-button-text"),
      buttonType: componentSlot.getAttribute("data-button-type"),
    };
    renderComponent(componentSlot, <ExternalLink {...props} />);
  },
  "dropdown-select": (componentSlot) => {
    const props = {
      id: componentSlot.id,
    };
    renderComponent(componentSlot, <DropdownSelect {...props} />);
  },
  "navigation-button": (componentSlot) => {
    const props = {
      buttonId: componentSlot.getAttribute("data-button-id"),
      buttonText: componentSlot.getAttribute("data-button-text"),
      navIcon: componentSlot.getAttribute("data-nav-icon"),
      buttonSize: componentSlot.getAttribute("data-button-size"),
      buttonColor: componentSlot.getAttribute("data-button-color"),
      buttonCustomWidth: componentSlot.getAttribute("data-button-custom-width"),
      buttonCustomClass: componentSlot.getAttribute("data-button-custom-class"),
    };
    renderComponent(componentSlot, <NavigationButton {...props} />);
  },
  "generic-button": (componentSlot) => {
    const props = {
      id: componentSlot.getAttribute("data-button-id"),
      variant: componentSlot.getAttribute("data-variant"),
      size: componentSlot.getAttribute("data-size"),
      color: componentSlot.getAttribute("data-color"),
      text: componentSlot.getAttribute("data-text"),
    };
    renderComponent(componentSlot, <GenericButton {...props} />);
  },

  "pennsieve-agent-check-display": (componentSlot) => {
    const props = {};
    renderComponent(componentSlot, <PennsieveAgentCheckDisplay {...props} />);
  },
  "single-column-table": (componentSlot) => {
    const columnName = componentSlot.getAttribute("data-column-name");
    const id = componentSlot.id;

    // Create a React root and render the component
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <SingleColumnTable id={id} columnName={columnName} />
      </SodaComponentWrapper>
    );
  },
  "microfileplus-installation-check-display": (componentSlot) => {
    const props = {};
    renderComponent(componentSlot, <MicrofilePlusInstallationCheckDisplay {...props} />);
  },
  "process-status-table": (componentSlot) => {
    const tableId = componentSlot.id;
    const tableTitle = componentSlot.getAttribute("data-table-title");
    const progressText = componentSlot.getAttribute("data-progress-text");
    const props = {
      tableId,
      tableTitle,

      progressText,
    };
    renderComponent(componentSlot, <ProcessStatusTable {...props} />);
  },
};

// Query all DOM nodes with the data attribute "data-component-type" and render the appropriate component
document.querySelectorAll("[data-component-type]").forEach((componentSlot) => {
  const componentType = componentSlot.getAttribute("data-component-type");
  const renderAction = componentTypeRenderers[componentType];

  if (renderAction) {
    renderAction(componentSlot);
  } else {
    console.error(`No render function found for component type: ${componentType}`);
  }
});
