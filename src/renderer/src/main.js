import "./assets/imports";
while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 500000));
}
import "./assets/demo-btns";
import "./assets/nav";
import "./scripts/client";
import "./scripts/globals";
import "./scripts/guided-mode/guided-curate-dataset";
import "./scripts/others/renderer";
import "./scripts/metadata-files/submission";
import "./scripts/manage-dataset/manage-dataset";
import "./scripts/organize-dataset/organizeDS";
import "./scripts/organize-dataset/curate-functions";
import "./scripts/metadata-files/manifest";
import "./scripts/others/contributor-storage";
import "./scripts/metadata-files/subjects-samples";
import "./scripts/others/tab-effects";
import "./scripts/disseminate/disseminate";
import "./scripts/disseminate/prePublishingReview";
import "./scripts/others/pennsieveDatasetImporter";
import "./scripts/others/progressContainer";
import "./scripts/validator/validate";
import "./scripts/metadata-files/datasetDescription";
import "./scripts/metadata-files/readme-changes";
import "./scripts/organize-dataset/validation-functions";
import "./scripts/collections/collections";
import "./scripts/metadata-files/downloadTemplates";
import "./scripts/advanced-features/advanced_features";
import "./scripts/sds-templates/sds_templates";

// Application Lotties
import "./assets/lotties/activate-lotties";

// Application CSS
import "@mantine/core/styles.css";
import "cropperjs/dist/cropper.css";
import "fomantic-ui/dist/semantic.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/css/animations.css";
import "./assets/css/buttons.css";
import "./assets/css/containers.css";
import "./assets/css/demo.css";
import "./assets/css/doc_contact_pages.css";
import "./assets/css/file_views.css";
import "./assets/css/folder_files.css";
import "./assets/css/fontStyling.css";
import "./assets/css/global.css";
import "./assets/css/guided.css";
import "./assets/css/helperClasses.css";
import "./assets/css/individualtab.css";
import "./assets/css/main_tabs.css";
import "./assets/css/main.css";
import "./assets/css/nativize.css";
import "./assets/css/nav.css";
import "./assets/css/overview_page.css";
import "./assets/css/section.css";
import "./assets/css/splashScreen.css";
import "./assets/css/spur.css";
import "./assets/css/variables.css";
import "notyf/notyf.min.css"; // for React, Vue and Svelte
import "jstree/dist/themes/default/style.css";
import "@yaireo/tagify/dist/tagify.css";
import "@tarekraafat/autocomplete.js/dist/css/autoComplete.css";
import "@tarekraafat/autocomplete.js/dist/css/autoComplete.01.css";
import "@tarekraafat/autocomplete.js/dist/css/autoComplete.02.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";

import "select2/dist/css/select2.min.css";
import "intro.js/minified/introjs.min.css";
