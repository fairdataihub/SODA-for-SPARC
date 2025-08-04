import { Text, Group, Select, Collapse, Center } from "@mantine/core";
import { useState } from "react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";
import client from "../../../scripts/client";
import Swal from "sweetalert2";
import NavigationButton from "../../buttons/Navigation";
import { isCheckboxCardChecked } from "../../../stores/slices/checkboxCardSlice";

const GenerateDatasetPennsieveTargetPage = () => {
  /*
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetOptions, setDatasetOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  */
  const isNewDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-new-pennsieve-dataset"]
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-existing-pennsieve-dataset"]
  );

  /*
  const fetchDatasets = async () => {
    if (hasLoaded || isLoading) return; // Don't fetch if already loaded or loading

    setIsLoading(true);
    try {
      // TODO: Handle pennsieve login information being removed before this page is loaded but user is supposed to resume here
      const responseObject = await client.get(`manage_datasets/fetch_user_datasets`, {
        params: {
          selected_account: window.defaultBfAccount,
          return_only_empty_datasets: false,
        },
      });

      let datasets = responseObject.data.datasets;

      // Transform the response data to match the Select component format
      const formattedOptions = datasets.map((dataset) => ({
        value: dataset.id, // Use appropriate identifier
        label: dataset.name, // Use appropriate display name
      }));

      setDatasetOptions(formattedOptions);
      setHasLoaded(true);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
      // Optionally show error message to user
      setDatasetOptions([]);
      Swal.fire({
        icon: "error",
        title: "Failed to fetch datasets",
        text: "Please try again later. If this issue persists, please use the Contact Us page to report the issue.",
        confirmButtonText: "OK",
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };
  */

  return (
    <GuidedModePage pageHeader="Pennsieve Generation Location">
      <GuidedModeSection>
        <Text mb="md">
          Select an option for how you would like SODA to generate your data on Pennsieve below.
        </Text>
        <Group align="stretch" gap="md" justify="center">
          <CheckboxCard id="generate-on-new-pennsieve-dataset" />
          <CheckboxCard id="generate-on-existing-pennsieve-dataset" />
        </Group>
      </GuidedModeSection>

      {/* Use global store state for the condition */}
      {/*
      <Collapse in={isExistingDatasetSelected}>
        <GuidedModeSection>
          <Text mb="md">
            Select an existing dataset from the dropdown below that you would like to upload your
            data to.
          </Text>
          <Select
            placeholder={isLoading ? "Loading datasets..." : "Select an existing dataset"}
            data={datasetOptions}
            value={selectedDataset}
            onChange={setSelectedDataset}
            onDropdownOpen={fetchDatasets} // Fetch when dropdown opens
            searchable={!isLoading}
            clearable={!isLoading}
            disabled={isLoading}
            maxDropdownHeight={200}
            comboboxProps={{
              withinPortal: false,
              loading: isLoading, // Shows loading spinner in dropdown
            }}
          />
        </GuidedModeSection>
      </Collapse>
      */}
      {isExistingDatasetSelected ||
        (isNewDatasetSelected && (
          <GuidedModeSection>
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
        ))}
    </GuidedModePage>
  );
};

export default GenerateDatasetPennsieveTargetPage;
