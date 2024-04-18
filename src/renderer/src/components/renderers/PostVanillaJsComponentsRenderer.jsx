import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import useGlobalStore from "../../stores/globalStore";
import DropdownSelect from "../common/DropdownSelect";

// Wait for the HTML sections to be added to the DOM before rendering React components
while (!window.baseHtmlLoaded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const componentRenderActions = {
  "dropdown-select": (componentSlot) => {
    const id = componentSlot.id;

    // Create a React root and render the component
    const root = createRoot(componentSlot);
    root.render(
      <SodaComponentWrapper>
        <DropdownSelect id={id} />
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
  }
});
