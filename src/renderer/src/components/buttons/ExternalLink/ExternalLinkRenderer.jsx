import ReactDom from "react-dom";

import ExternalLink from "./index";

const divsToRenderOver = document.querySelectorAll(".react-external-link");
divsToRenderOver.forEach((div) => {
  console.log("div id: ", div.id);
  const url = div.getAttribute("data-url");
  const buttonText = div.getAttribute("data-button-text");
  ReactDom.render(<ExternalLink href={url} buttonText={buttonText} />, div);
});
