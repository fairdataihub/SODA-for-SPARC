import useGlobalStore from "../../../stores/globalStore";
import { Text, Group, Select, Collapse, Center, Loader, Stack } from "@mantine/core";
import { swalShowError } from "../../../scripts/utils/swal-utils";
import { useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../buttons/CheckboxCard";
import client from "../../../scripts/client";
import NavigationButton from "../../buttons/Navigation";
import { setCheckboxCardUnchecked } from "../../../stores/slices/checkboxCardSlice";
import {
  setSelectedDatasetToUploadDataTo,
  setAvailableDatasetsToUploadDataTo,
  fetchDatasetsToUploadDataTo,
} from "../../../stores/slices/pennsieveDatasetSelectSlice";

const GenerateDatasetPennsieveTargetPage = () => {
  const selectedDatasetIdToUploadDataTo = useGlobalStore(
    (state) => state.selectedDatasetIdToUploadDataTo
  );
  const selectedDatasetNameToUploadDataTo = useGlobalStore(
    (state) => state.selectedDatasetNameToUploadDataTo
  );
  const availableDatasetsToUploadDataTo = useGlobalStore(
    (state) => state.availableDatasetsToUploadDataTo
  );
  const isLoadingPennsieveDatasets = useGlobalStore((state) => state.isLoadingPennsieveDatasets);

  const isNewDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-new-pennsieve-dataset"]
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) => !!state.checkboxes["generate-on-existing-pennsieve-dataset"]
  );

  console.log("isNewDatasetSelected:", isNewDatasetSelected);
  console.log("isExistingDatasetSelected:", isExistingDatasetSelected);

  // Use exported setter to set both id and name
  const handleSelectDataset = (id) => {
    const dataset = availableDatasetsToUploadDataTo.find((d) => d.value === id);
    setSelectedDatasetToUploadDataTo(id, dataset ? dataset.label : null);
  };

  useEffect(() => {
    if (isExistingDatasetSelected) {
      fetchDatasetsToUploadDataTo();
    } else {
      setAvailableDatasetsToUploadDataTo([]);
    }
  }, [isExistingDatasetSelected]);

  return (
    <GuidedModePage pageHeader="Pennsieve Generation Location">
      <GuidedModeSection>
        <Text mb="md">
          Select an option for how you would like SODA to generate your data on Pennsieve.
        </Text>
        <Group align="stretch" gap="md" justify="center">
          <CheckboxCard id="generate-on-new-pennsieve-dataset" />
          <CheckboxCard id="generate-on-existing-pennsieve-dataset" />
        </Group>
      </GuidedModeSection>

      <Collapse in={isExistingDatasetSelected}>
        <GuidedModeSection>
          {isLoadingPennsieveDatasets ? (
            <Stack align="center" mt="md">
              <Loader size="md" />
              <Text size="md" align="center" fw={500}>
                Retrieving empty datasets from Pennsieve...
              </Text>
            </Stack>
          ) : (
            <>
              <Text mt="md" align="center" fw={500} size="lg">
                Select an existing dataset to upload data to:
              </Text>
              <Select
                placeholder={"Select a dataset"}
                data={availableDatasetsToUploadDataTo}
                value={selectedDatasetIdToUploadDataTo}
                onChange={handleSelectDataset}
                maxDropdownHeight={200}
                comboboxProps={{
                  withinPortal: false,
                }}
              />
            </>
          )}
        </GuidedModeSection>
      </Collapse>

      {((isExistingDatasetSelected &&
        selectedDatasetIdToUploadDataTo &&
        selectedDatasetNameToUploadDataTo) ||
        isNewDatasetSelected) && (
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
