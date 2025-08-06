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
  setSelectedDatasetIdToUploadDataTo,
  setDatasetOptions,
  fetchDatasetsToUploadDataTo,
} from "../../../stores/slices/pennsieveDatasetSelectSlice";

const GenerateDatasetPennsieveTargetPage = () => {
  const selectedDatasetIdToUploadDataTo = useGlobalStore(
    (state) => state.selectedDatasetIdToUploadDataTo
  );
  const datasetOptions = useGlobalStore((state) => state.datasetOptions);
  const isLoadingPennsieveDatasets = useGlobalStore((state) => state.isLoadingPennsieveDatasets);

  const isNewDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-new-pennsieve-dataset"]
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-existing-pennsieve-dataset"]
  );

  useEffect(() => {
    if (isExistingDatasetSelected) {
      fetchDatasetsToUploadDataTo();
    } else {
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
            placeholder={
              isLoadingPennsieveDatasets ? "Loading datasets..." : "Select an existing dataset"
            }
            data={datasetOptions}
            value={selectedDatasetIdToUploadDataTo}
            onChange={setSelectedDatasetIdToUploadDataTo}
            searchable={!isLoadingPennsieveDatasets}
            clearable={!isLoadingPennsieveDatasets}
            disabled={isLoadingPennsieveDatasets}
            maxDropdownHeight={200}
            comboboxProps={{
              withinPortal: false,
              loading: isLoadingPennsieveDatasets,
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
