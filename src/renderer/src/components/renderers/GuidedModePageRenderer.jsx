import ReactDom from "react-dom";
import SodaComponentWrapper from "../utils/SodaComponentWrapper";
import NameAndSubtitlePage from "../pages/NameAndSubtitle";
import BioLucidaImageListSelectPage from "../pages/BioLucidaImageListSelect";
import MicroscopyImageConfirmationPage from "../pages/MicroscopyImageConfirmationPage";
import MicroscopyImageMetadataFormPage from "../pages/MicroscopyImageMetadataFormPage";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const pageIdToPageComponentMap = {
  "guided-name-subtitle-tab": <NameAndSubtitlePage />,
  "guided-biolucida-image-selection-tab": <BioLucidaImageListSelectPage />,
  "guided-microscopy-image-confirmation-tab": <MicroscopyImageConfirmationPage />,
  "guided-microscopy-image-metadata-form-tab": <MicroscopyImageMetadataFormPage />,
  "Do not use this renderer (for now maybe)": <div />,
};

const divs = document.querySelectorAll(".react-rendered-guided-mode-page");

divs.forEach((targetDiv) => {
  const pageId = targetDiv.id;
  // console log page id 10 times
  for (let i = 0; i < 10; i++) {
    console.log(pageId);
  }
  const pageComponent = pageIdToPageComponentMap[pageId];

  ReactDom.render(<SodaComponentWrapper>{pageComponent}</SodaComponentWrapper>, targetDiv);
});
