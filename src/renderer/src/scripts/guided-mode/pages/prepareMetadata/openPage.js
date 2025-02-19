import { pageNeedsUpdateFromPennsieve } from "../../pennsieveUtils";
import { setPageLoadingState } from "../navigationUtils/pageLoading";
import Swal from "sweetalert2";
import Cropper from "cropperjs";
import api from "../../../others/api/api";
import { clientError, userErrorMessage } from "../../../others/http-error-handler/error-handler";
import { guidedShowOptionalRetrySwal } from "../../swals/helperSwals";
import { guidedShowBannerImagePreview } from "../../bannerImage/bannerImage";

export const openPagePrepareMetadata = async (targetPageID) => {
  if (targetPageID === "guided-banner-image-tab") {
    if (pageNeedsUpdateFromPennsieve("guided-banner-image-tab")) {
      // Show the loading page while the page's data is being fetched from Pennsieve
      setPageLoadingState(true);
      // If the fetch fails, (they don't have a banner image yet)
      const datasetName = window.sodaJSONObj["digital-metadata"]["name"];
      const datasetID = window.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      try {
        // pass in the id in case the name of the dataset has been
        // changed from the original Pennsieve dataset name
        let res = await api.getDatasetBannerImageURL(datasetID);
        if (res != "No banner image") {
          //Banner is returned as an s3 bucket url but image needs to be converted as
          //base64 to save and write to users local system
          let img_base64 = await window.getBase64(res); // encode image to base64
          let guided_img_url = res;
          let imageType = "";
          let fullBase64Image = "";
          let position = guided_img_url.search("X-Amz-Security-Token");
          if (position != -1) {
            // The image url will be before the security token
            let new_img_src = guided_img_url.substring(0, position - 1);
            let new_position = new_img_src.lastIndexOf("."); //
            if (new_position != -1) {
              window.imageExtension = new_img_src.substring(new_position + 1);
              if (window.imageExtension.toLowerCase() == "png") {
                fullBase64Image = "data:image/png;base64," + img_base64;
                imageType = "png";
              } else if (
                window.imageExtension.toLowerCase() == "jpeg" ||
                window.imageExtension.toLowerCase() == "jpg"
              ) {
                fullBase64Image = "data:image/jpg;base64," + img_base64;
                imageType = "jpg";
              } else {
                window.log.error(`An error happened: ${guided_img_url}`);
                Swal.fire({
                  icon: "error",
                  text: "An error occurred when importing the image. Please try again later.",
                  showConfirmButton: "OK",
                  backdrop: "rgba(0,0,0, 0.4)",
                  heightAuto: false,
                });
                window.logGeneralOperationsForAnalytics(
                  "Error",
                  window.ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
                  window.AnalyticsGranularity.ALL_LEVELS,
                  ["Importing Banner Image"]
                );
              }
            }
          }
          const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
          let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
          if (!window.fs.existsSync(imageFolder)) {
            //create SODA/guided-banner-images if it doesn't exist
            window.fs.mkdirSync(imageFolder, { recursive: true });
          }
          let imagePath = window.path.join(imageFolder, `${datasetName}.` + imageType);
          //store file at imagePath destination
          await window.electron.ipcRenderer.invoke("write-banner-image", img_base64, imagePath);
          //save imagePath to sodaJson
          window.sodaJSONObj["digital-metadata"]["banner-image-path"] = imagePath;
          //add image to modal and display image on main banner import page
          $("#guided-image-banner").attr("src", fullBase64Image);
          $("#guided-para-path-image").html(imagePath);
          document.getElementById("guided-div-img-container-holder").style.display = "none";
          document.getElementById("guided-div-img-container").style.display = "block";
          //set new cropper for imported image
          window.myCropper.destroy();
          window.myCropper = new Cropper(
            window.guidedBfViewImportedImage,
            window.guidedCropOptions
          );
          $("#guided-save-banner-image").css("visibility", "visible");
        }
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      } catch (error) {
        clientError(error);
        const emessage = userErrorMessage(error);
        await guidedShowOptionalRetrySwal(emessage, "guided-banner-image-tab");
        // If the user chooses not to retry re-fetching the page data, mark the page as fetched
        // so the the fetch does not occur again
        window.sodaJSONObj["pages-fetched-from-pennsieve"].push("guided-banner-image-tab");
      }
    }
    if (window.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
      //added extra param to function to prevent modification of URL
      guidedShowBannerImagePreview(
        window.sodaJSONObj["digital-metadata"]["banner-image-path"],
        true
      );
      document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
    } else {
      //reset the banner image page
      $("#guided-button-add-banner-image").html("Add banner image");
      $("#guided-banner-image-preview-container").hide();
    }
  }
};
