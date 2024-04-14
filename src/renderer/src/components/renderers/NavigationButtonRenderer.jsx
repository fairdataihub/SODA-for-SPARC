import { createRoot } from "react-dom/client";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NavigationButton from "../buttons/Navigation";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

const divsToRenderOver = document.querySelectorAll(".react-navigation-button");
divsToRenderOver.forEach((div) => {
  const buttonId = div.getAttribute("data-button-id"); // The ID of the button (Can be used to add event listeners to the button)
  const buttonText = div.getAttribute("data-button-text"); // The text to display on the button
  const navIcon = div.getAttribute("data-nav-icon"); // The icon to display on the button
  const buttonSize = div.getAttribute("data-button-size"); // The size of the button (default is "md")
  const buttonColor = div.getAttribute("data-button-color"); // The color of the button (default is soda green)
  const buttonCustomWidth = div.getAttribute("data-button-custom-width"); // The width of the button (default is "auto")
  const buttonCustomClass = div.getAttribute("data-button-custom-class"); // The custom class of the button (default is "")

  const root = createRoot(div);
  root.render(
    <SodaComponentWrapper>
      <NavigationButton
        buttonId={buttonId}
        buttonText={buttonText}
        navIcon={navIcon}
        buttonSize={buttonSize}
        buttonColor={buttonColor}
        buttonCustomWidth={buttonCustomWidth}
        buttonCustomClass={buttonCustomClass}
      />
    </SodaComponentWrapper>
  );
});

window.test = "test";
