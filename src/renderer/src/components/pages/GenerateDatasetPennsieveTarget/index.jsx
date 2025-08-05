import { Text, Group, Select, Collapse, Center } from "@mantine/core";
import { swalShowError } from "../../../scripts/utils/swal-utils";
import { useEffect, useState } from "react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";
import client from "../../../scripts/client";
import NavigationButton from "../../buttons/Navigation";
import { setCheckboxCardUnchecked } from "../../../stores/slices/checkboxCardSlice";

const GenerateDatasetPennsieveTargetPage = () => {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetOptions, setDatasetOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false); // 🔁 added to avoid infinite loop

  const isNewDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-new-pennsieve-dataset"]
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-existing-pennsieve-dataset"]
  );

  async function fetchDatasets() {
    if (hasLoaded || isLoading || hasAttemptedFetch) return;

    setIsLoading(true);
    setHasAttemptedFetch(true);

    try {
      console.log("🚀 Fetching empty datasets from Pennsieve...");

      const response = await client.get("manage_datasets/fetch_user_dataets", {
        params: { return_only_empty_datasets: "true" },
      });

      const datasets = response?.data?.datasets;
      if (!datasets || !Array.isArray(datasets)) {
        console.warn("⚠️ No datasets found or response structure invalid:", datasets);
      }

      const formattedOptions = (datasets || []).map((dataset) => ({
        value: dataset.id,
        label: dataset.name,
      }));

      setDatasetOptions(formattedOptions);
      setHasLoaded(true);
    } catch (error) {
      console.error("❌ Failed to fetch datasets:", error?.response || error?.message || error);
      setDatasetOptions([]);
      swalShowError(
        "Failed to fetch datasets",
        "Please try again later. If this issue persists, please use the Contact Us page to report the issue."
      );
      setCheckboxCardUnchecked("generate-on-existing-pennsieve-dataset");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isExistingDatasetSelected) {
      fetchDatasets();
    } else {
      setHasLoaded(false);
      setHasAttemptedFetch(false); // ✅ reset so fetch can be retried if checkbox is toggled
      setDatasetOptions([]);
    }
  }, [isExistingDatasetSelected]);

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
            searchable={!isLoading}
            clearable={!isLoading}
            disabled={isLoading}
            maxDropdownHeight={200}
            comboboxProps={{
              withinPortal: false,
              loading: isLoading,
            }}
          />
        </GuidedModeSection>
      </Collapse>

      {(isExistingDatasetSelected || isNewDatasetSelected) && (
        <GuidedModeSection>
          <Center mt="xl">
            <NavigationButton
              onClick={() => document.getElementById("guided-next-button")?.click()}
              buttonCustomWidth="215px"
              buttonText="Save and Continue"
              navIcon="right-arrow"
              buttonSize="md"
            />
          </Center>
        </GuidedModeSection>
      )}
    </GuidedModePage>
  );
};

export default GenerateDatasetPennsieveTargetPage;
