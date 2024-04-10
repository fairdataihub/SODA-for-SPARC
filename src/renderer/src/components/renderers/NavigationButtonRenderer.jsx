import ReactDom from "react-dom";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NavigationButton from "../buttons/Navigation";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const divsToRenderOver = document.querySelectorAll(".react-navigation-button");
divsToRenderOver.forEach((div) => {
  const buttonId = div.getAttribute("data-button-id");
  const buttonText = div.getAttribute("data-button-text");
  const navIcon = div.getAttribute("data-nav-icon");
  const buttonSize = div.getAttribute("data-button-size");

  ReactDom.render(
    <SodaComponentWrapper>
      <NavigationButton
        buttonId={buttonId}
        buttonText={buttonText}
        navIcon={navIcon}
        buttonSize={buttonSize}
      />
    </SodaComponentWrapper>,
    div
  );
});
