import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const divsToRenderOver = document.querySelectorAll(".react-external-link");
divsToRenderOver.forEach((div) => {
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
