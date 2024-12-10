import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";
import NavigationButton from "../buttons/Navigation";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";
import DropdownSelect from "../common/DropdownSelect";
import GenericButton from "../buttons/Generic";
import SingleColumnTable from "../tables/singleColumn";
import PennsieveAgentCheckDisplay from "../backgroundServices/PennsieveAgentCheckDisplay";
import DatasetEntitySelector from "../shared/manifest/DatasetEntitySelector";
import DatasetEntityManager from "../shared/manifest/DatasetEntityManager";
import DataImporter from "../shared/DataImporter";
import { Divider } from "@mantine/core";

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
      href: componentSlot.getAttribute("data-href"),
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
  "manifest-entity-selector": (componentSlot) => {
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <DatasetEntitySelector />
      </SodaComponentWrapper>
    );
  },

  "manifest-entity-manager": (componentSlot) => {
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <DatasetEntityManager />
      </SodaComponentWrapper>
    );
  },

  "data-importer": (componentSlot) => {
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <DataImporter />
      </SodaComponentWrapper>
    );
  },
  divider: (componentSlot) => {
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <Divider my="xl" />
      </SodaComponentWrapper>
    );
  },
};

// Query all DOM nodes with the data attribute "data-component-type" and render the appropriate component
document.querySelectorAll("[data-component-type]").forEach((componentSlot) => {
  const componentType = componentSlot.getAttribute("data-component-type");
  const renderFunction = componentTypeRenderers[componentType];

  if (renderFunction) {
    renderFunction(componentSlot);
  } else {
    console.error(`No render function found for component type: ${componentType}`);
  }
});
