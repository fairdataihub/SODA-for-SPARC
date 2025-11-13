import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Progress,
  Box,
  Tooltip,
  Checkbox,
  ActionIcon,
  Center,
} from "@mantine/core";
import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../cards/CheckboxCard";
import NavigationButton from "../../buttons/Navigation";
import ModalitySelector from "../../ModalitySelector";

import {
  toggleModalitySelection,
  modalityIsSelected,
} from "../../../stores/slices/modalitiesSlice";

const ModalitySelectionPage = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleYesClick = () => {
    setSelectedOption("yes");
  };

  const handleNoClick = () => {
    setSelectedOption("no");
  };

  return (
    <GuidedModePage pageHeader="Dataset modalities">
      <GuidedModeSection>
        <Text>
          The SPARC Dataset Structure requires that if your dataset includes data collected through
          multiple modalities such as imaging, recordings, or behavioral data, the manifest file
          must indicate which modality was used for the data that was collected.
        </Text>
        <label className="guided--form-label centered">
          Does your dataset include data collected from multiple modalities?
        </label>

        <Center>
          <CheckboxCard id="modality-selection-yes" clickAction={handleYesClick} />
          <CheckboxCard id="modality-selection-no" clickAction={handleNoClick} />
        </Center>
      </GuidedModeSection>
      {/* Section that appears when user selects "Yes" */}

      {selectedOption === "yes" && (
        <GuidedModeSection sectionId="dataset-selection">
          <Text>Select all modalities used to acquire data in this dataset.</Text>

          <ModalitySelector />
        </GuidedModeSection>
      )}

      {/* New section that appears when user selects "No" */}
      {selectedOption === "no" && (
        <GuidedModeSection sectionId="no-modalities">
          <Center mt="xl">
            <NavigationButton
              onClick={() => {
                // Pass the button click to the real next button
                document.getElementById("guided-next-button").click();
              }}
              buttonCustomWidth={"215px"}
              buttonText={"Save and Continue"}
              navIcon={"right-arrow"}
              buttonSize={"md"}
            ></NavigationButton>
          </Center>
        </GuidedModeSection>
      )}
    </GuidedModePage>
  );
};

export default ModalitySelectionPage;
