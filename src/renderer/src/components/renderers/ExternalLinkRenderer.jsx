import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";

while (!window.htmlSectionsAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const componentSlots = document.querySelectorAll('[data-component-type="external-link"]');

componentSlots.forEach((div) => {
  const url = div.getAttribute("data-url");
  const buttonText = div.getAttribute("data-button-text");
  const buttonType = div.getAttribute("data-button-type");
  const root = createRoot(div);
  root.render(
    <SodaComponentWrapper>
      <ExternalLink href={url} buttonText={buttonText} buttonType={buttonType} />
    </SodaComponentWrapper>
  );
});
