import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";
import NavigationButton from "../buttons/Navigation";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";
import DropdownSelect from "../common/DropdownSelect";
import DatasetTreeViewRenderer from "../shared/DatasetTreeViewRenderer";
import GenericButton from "../buttons/Generic";
import SingleColumnTable from "../tables/singleColumn";
import PennsieveAgentCheckDisplay from "../backgroundServices/PennsieveAgentCheckDisplay";
import DatasetContentSelector from "../pages/DatasetContentSelector";
import PerformanceIdManagementPage from "../pages/PerformanceIdManagement";
import GenerateDatasetLocationSelectorPage from "../pages/GenerateDatasetLocationSelector";
import GenerateDatasetPennsieveTargetPage from "../pages/GenerateDatasetPennsieveTarget";
import ResourcesManagementPage from "../pages/ResourcesManagement";
import LicenseSelectPage from "../pages/LicenseSelect";
import ModalitySelectionPage from "../pages/ModalitySelection";
import EntityMetadataPage from "../pages/EntityMetadataPage";
import SpreadsheetImportDatasetEntityAdditionPage from "../pages/SpreadsheetImportDatasetEntityAdditionPage";
import DatasetEntityFileMapper from "../pages/DatasetEntityFileMapper";
import EntityDataSelectorPage from "../pages/EntityDataSelector";
import DataImporter from "../shared/DataImporter";
import SubmissionMetadataForm from "../pages/SubmissionMetadataForm";
import Icon from "../shared/Icon";
import SodaTextInput from "../common/SodaTextInput";
import ProgressStepper from "../common/ProgressStepper";
import ManifestFilePreviewSection from "../shared/ManifestFilePreviewSection";
import DropDownNote from "../utils/ui/DropDownNote";
import SidebarLinks from "../common/SidebarLinks";
import HomePageCards from "../buttons/HomePageCards";
import GuidedModeProgressCards from "../guided/GuidedModeProgressCards";
import { CardButton } from "../buttons/CardButton";
import CheckboxCard from "../buttons/CheckboxCard";
import { Divider } from "@mantine/core";

// Wait for the HTML sections to be added to the DOM before rendering React components
while (!window.htmlSectionsAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

// Helper function to create a React root and render the component inside SodaComponentWrapper
export const renderComponent = (componentSlot, component) => {
  const root = createRoot(componentSlot);
  root.render(<SodaComponentWrapper>{component}</SodaComponentWrapper>);
};

// Mapping of component types to their render functions
const componentTypeRenderers = {
  "home-page-cards": (componentSlot) => {
    renderComponent(componentSlot, <HomePageCards />);
  },
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
  "guided-mode-progress-cards": (componentSlot) => {
    renderComponent(componentSlot, <GuidedModeProgressCards />);
  },
  "external-link": (componentSlot) => {
    const props = {
      href: componentSlot.getAttribute("data-href"),
      buttonText: componentSlot.getAttribute("data-button-text"),
      buttonType: componentSlot.getAttribute("data-button-type"),
    };
    renderComponent(componentSlot, <ExternalLink {...props} />);
  },
  "dynamic-link": (componentSlot) => {
    const props = {
      id: componentSlot.id,
      buttonText: componentSlot.getAttribute("data-button-text"),
      buttonType: componentSlot.getAttribute("data-button-type"),
    };
    renderComponent(componentSlot, <DynamicLink {...props} />);
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
      buttonColor: componentSlot.getAttribute("data-button-color") || "black",
      buttonCustomWidth: componentSlot.getAttribute("data-button-custom-width"),
      buttonCustomClass: componentSlot.getAttribute("data-button-custom-class"),
    };
    renderComponent(componentSlot, <NavigationButton {...props} />);
  },
  "card-button": (componentSlot) => {
    const props = {
      id: componentSlot.id,
    };
    renderComponent(componentSlot, <CardButton {...props} />);
  },
  "checkbox-card": (componentSlot) => {
    const props = {
      id: componentSlot.getAttribute("data-button-id") || componentSlot.id,
    };
    renderComponent(componentSlot, <CheckboxCard {...props} />);
  },
  "progress-stepper": (componentSlot) => {
    const props = {
      id: componentSlot.getAttribute("data-stepper-id"),
    };
    renderComponent(componentSlot, <ProgressStepper {...props} />);
  },
  "sidebar-links": (componentSlot) => {
    renderComponent(componentSlot, <SidebarLinks />);
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
    renderComponent(componentSlot, <SingleColumnTable id={id} columnName={columnName} />);
  },
  "dataset-tree-view-renderer": (componentSlot) => {
    const props = {
      fileExplorerId: componentSlot.getAttribute("data-file-explorer-id"),
      hideSearchBar: true,
      entityType: null,
    };
    renderComponent(componentSlot, <DatasetTreeViewRenderer {...props} />);
  },

  "data-importer": (componentSlot) => {
    const props = {
      relativeFolderPathToImportDataInto: componentSlot.getAttribute(
        "data-relative-folder-path-to-import-data-into"
      ),
    };
    renderComponent(componentSlot, <DataImporter {...props} />);
  },
  "performance-id-management-page": (componentSlot) => {
    const props = {
      pageName: componentSlot.getAttribute("data-page-name"),
      entityTypeStringSingular: componentSlot.getAttribute("data-entity-type-string-singular"),
      entityTypeStringPlural: componentSlot.getAttribute("data-entity-type-string-plural"),
      entityTypePrefix: componentSlot.getAttribute("data-entity-type-prefix"),
    };
    renderComponent(componentSlot, <PerformanceIdManagementPage {...props} />);
  },
  "resources-management-page": (componentSlot) => {
    renderComponent(componentSlot, <ResourcesManagementPage />);
  },

  "entity-metadata-page": (componentSlot) => {
    const props = {
      entityType: componentSlot.getAttribute("data-entity-type"),
    };
    renderComponent(componentSlot, <EntityMetadataPage {...props} />);
  },
  "soda-text-input": (componentSlot) => {
    const props = {
      id: componentSlot.id,
      label: componentSlot.getAttribute("data-label"),
      placeholder: componentSlot.getAttribute("data-placeholder") || "",
      textArea: componentSlot.getAttribute("data-text-area") === "true",
      description: componentSlot.getAttribute("data-description") || "",
      maxLength: componentSlot.getAttribute("data-max-length") || false,
    };
    renderComponent(componentSlot, <SodaTextInput {...props} />);
  },
  "entity-spreadsheet-import-page": (componentSlot) => {
    renderComponent(componentSlot, <SpreadsheetImportDatasetEntityAdditionPage />);
  },
  "entity-file-mapping-page": (componentSlot) => {
    const props = {
      entityType: componentSlot.getAttribute("data-entity-type"),
    };
    renderComponent(componentSlot, <DatasetEntityFileMapper {...props} />);
  },

  "data-categorization-page": (componentSlot) => {
    const props = {
      pageName: componentSlot.getAttribute("data-page-name"),
      entityTypeStringSingular: componentSlot.getAttribute("data-entity-type-string-singular"),
      entityTypeStringPlural: componentSlot.getAttribute("data-entity-type-string-plural"),
      showProgress: componentSlot.getAttribute("data-show-progress") || false,
    };
    renderComponent(componentSlot, <EntityDataSelectorPage {...props} />);
  },
  "modality-selection-page": (componentSlot) => {
    renderComponent(componentSlot, <ModalitySelectionPage />);
  },
  "submission-metadata-form": (componentSlot) => {
    renderComponent(componentSlot, <SubmissionMetadataForm />);
  },
  "dataset-content-selector": (componentSlot) => {
    renderComponent(componentSlot, <DatasetContentSelector />);
  },
  "generate-dataset-location-selector-page": (componentSlot) => {
    renderComponent(componentSlot, <GenerateDatasetLocationSelectorPage />);
  },
  "pennsieve-generate-target-page": (componentSlot) => {
    renderComponent(componentSlot, <GenerateDatasetPennsieveTargetPage />);
  },
  "license-select-page": (componentSlot) => {
    renderComponent(componentSlot, <LicenseSelectPage />);
  },
  divider: (componentSlot) => {
    renderComponent(componentSlot, <Divider my="xl" />);
  },
  icon: (componentSlot) => {
    const iconType = componentSlot.getAttribute("data-icon-type");
    renderComponent(componentSlot, <Icon iconType={iconType} />);
  },
  "manifest-file-preview-section": (componentSlot) => {
    const props = {
      id: componentSlot.id,
    };
    renderComponent(componentSlot, <ManifestFilePreviewSection {...props} />);
  },
  "dropdown-note-renderer": (componentSlot) => {
    const props = {
      id: componentSlot.id,
    };
    renderComponent(componentSlot, <DropDownNote {...props} />);
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
