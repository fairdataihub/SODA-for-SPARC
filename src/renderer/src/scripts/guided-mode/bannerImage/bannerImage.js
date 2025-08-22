export const guidedSaveBannerImage = async () => {
  $("#guided-para-dataset-banner-image-status").html("Please wait...");
  //Save cropped image locally and check size
  const homeDirectory = await window.electron.ipcRenderer.invoke("get-app-path", "home");
  let imageFolder = window.path.join(homeDirectory, "SODA", "guided-banner-images");
  let imageType = "";

  if (!window.fs.existsSync(imageFolder)) {
    window.fs.mkdirSync(imageFolder, { recursive: true });
  }

  if (window.imageExtension == "png") {
    imageType = "image/png";
  } else {
    imageType = "image/jpeg";
  }
  let datasetName = window.sodaJSONObj["digital-metadata"]["name"];
  let imagePath = window.path.join(imageFolder, `${datasetName}.` + window.imageExtension);
  let croppedImageDataURI = window.myCropper.getCroppedCanvas().toDataURL(imageType);
  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
    let image_file_size = window.fs.fileSizeSync(imagePath);
    if (image_file_size < 5 * 1024 * 1024) {
      $("#guided-para-dataset-banner-image-status").html("");
      setGuidedBannerImage(imagePath);
      $("#guided-banner-image-modal").modal("hide");
      $("#guided-button-add-banner-image").text("Edit banner image");
    } else {
      //image needs to be scaled
      $("#guided-para-dataset-banner-image-status").html("");
      let scaledImagePath = await window.scaleBannerImage(imagePath);
      setGuidedBannerImage(scaledImagePath);
      $("#guided-banner-image-modal").modal("hide");
      $("#guided-button-add-banner-image").text("Edit banner image");
    }

    // hide the skip btn as it is no longer relvant
    document.querySelector("#guided--skip-banner-img-btn").style.display = "none";
  });
};

export const setGuidedBannerImage = (croppedImagePath) => {
  window.sodaJSONObj["digital-metadata"]["banner-image-path"] = croppedImagePath;
  guidedShowBannerImagePreview(croppedImagePath);
};

export const guidedShowBannerImagePreview = (imagePath, imported) => {
  const bannerImagePreviewelement = document.getElementById("guided-banner-image-preview");

  if (bannerImagePreviewelement.childElementCount > 0) {
    //remove old banner image
    bannerImagePreviewelement.removeChild(bannerImagePreviewelement.firstChild);
  }
  if (imported) {
    //if imported = true then add imagepath without cachebreaker
    let guidedbannerImageElem = document.createElement("img");

    // prepend file protocol prefix to imagePath
    // TODO: CHeck if this sjould be done in builds
    imagePath = "file://" + imagePath;

    guidedbannerImageElem.src = imagePath;
    guidedbannerImageElem.alt = "Preview of banner image";
    guidedbannerImageElem.style = "max-height: 300px";

    bannerImagePreviewelement.appendChild(guidedbannerImageElem);

    $("#guided-banner-image-preview-container").show();
    $("#guided-banner-image-preview-container").removeClass("hidden");
    $("#guided-button-add-banner-image").html("Edit banner image");
  } else {
    let date = new Date();
    let guidedbannerImageElem = document.createElement("img");

    //imagePath + cachebreakeer at the end to update image every time
    imagePath = "file://" + imagePath;
    guidedbannerImageElem.src = `${imagePath}?${date.getMilliseconds()}`;
    guidedbannerImageElem.alt = "Preview of banner image";
    guidedbannerImageElem.style = "max-height: 300px";

    bannerImagePreviewelement.appendChild(guidedbannerImageElem);

    $("#guided-banner-image-preview-container").show();
    $("#guided-banner-image-preview-container").removeClass("hidden");
    $("#guided-button-add-banner-image").html("Edit banner image");
  }
};
