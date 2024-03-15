import ReactDom from "react-dom";

import ExternalLink from "../buttons/ExternalLink";

const divsToRenderOver = document.querySelectorAll(".react-external-link");
divsToRenderOver.forEach((div) => {
  const url = div.getAttribute("data-url");
  const buttonText = div.getAttribute("data-button-text");
  console.log("url: ", url);
  console.log("buttonText: ", buttonText);
  ReactDom.render(<ExternalLink href={url} buttonText={buttonText} />, div);
});
