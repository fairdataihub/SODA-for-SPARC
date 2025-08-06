import useGlobalStore from "../../../stores/globalStore";
import { Text, Group, Select, Collapse, Center } from "@mantine/core";
import { swalShowError } from "../../../scripts/utils/swal-utils";
import { useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";
import client from "../../../scripts/client";
import NavigationButton from "../../buttons/Navigation";
import { setCheckboxCardUnchecked } from "../../../stores/slices/checkboxCardSlice";
import {
  setSelectedDataset,
  setDatasetOptions,
  setIsLoading,
  setHasLoaded,
  setHasAttemptedFetch,
  fetchDatasets,
} from "../../../stores/slices/pennsieveDatasetSelectSlice";

const GenerateDatasetPennsieveTargetPage = () => {
  const selectableDatasets = useGlobalStore((state) => state.selectableDatasets);
  const selectedDataset = useGlobalStore((state) => state.selectedDataset);
  const datasetOptions = useGlobalStore((state) => state.datasetOptions);
  const isLoading = useGlobalStore((state) => state.isLoading);
  const hasLoaded = useGlobalStore((state) => state.hasLoaded);
  const hasAttemptedFetch = useGlobalStore((state) => state.hasAttemptedFetch); // 🔁 added to avoid infinite loop

  const isNewDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-new-pennsieve-dataset"]
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-existing-pennsieve-dataset"]
  );

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
