import ReactDom from "react-dom";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import ExternalLink from "../buttons/ExternalLink";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}




const divsToRenderOver = document.querySelectorAll(".react-external-link");
divsToRenderOver.forEach((div) => {
  const url = div.getAttribute("data-url");
  const buttonText = div.getAttribute("data-button-text");
  const buttonType = div.getAttribute("data-button-type");
  console.log("div id: ", div.id);
  console.log("url: ", url);
  console.log("buttonText: ", buttonText);
  console.log("buttonType: ", buttonType);
  ReactDom.render(
    <SodaComponentWrapper>
      <ExternalLink href={url} buttonText={buttonText} buttonType={buttonType} />
    </SodaComponentWrapper>,
    div
  );
});
