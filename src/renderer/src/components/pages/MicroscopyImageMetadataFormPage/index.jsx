import useGlobalStore from "../../../stores/globalStore";
import {
  designateImageAsMicroscopyImage,
  undesignateImageAsMicroscopyImage,
  setConfirmedMicroscopyImages,
} from "../../../stores/slices/microscopyImageSlice";
import { Table, Checkbox, Text, Tooltip, Button, Stack } from "@mantine/core";
import GuidedModePage from "../../containers/GuidedModePage";
import styles from "./MicroscopyImageMetadataFormPage.module.css";
import GuidedModeSection from "../../containers/GuidedModeSection";
import ExternalLink from "../../buttons/ExternalLink";
import DropDownNote from "../../utils/ui/DropDownNote";

const MicroscopyImageMetadataFormPage = () => {
  // Get the required zustand store state variables
  const { confirmedMicroscopyImages } = useGlobalStore();

  const confirmedMicroscopyImagePathPaths = confirmedMicroscopyImages.map(
    (imageObj) => imageObj["filePath"]
  );

  return (
    <GuidedModePage
      pageHeader="Microscopy Image Confirmation"
      pageDescriptionArray={[
        "SODA has identified the images below as potential microscopy images. Please check the boxes next to the images that are microscopy images. You can use the button below to select or deselect all images at once.",
        "The selected images will be converted with MicroFile+ and processed to ensure they are SDS compliant.",
      ]}
    >
      <Text>Future page here</Text>
    </GuidedModePage>
  );
};

export default MicroscopyImageMetadataFormPage;
