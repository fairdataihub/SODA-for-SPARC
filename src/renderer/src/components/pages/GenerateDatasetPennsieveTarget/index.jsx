import React from "react";
import { useEffect } from "react";
import {
  Text,
  Group,
  Select,
  Collapse,
  Center,
  Loader,
  Stack,
  Button,
  TextInput,
  Textarea,
} from "@mantine/core";
import DropDownNote from "../../utils/ui/DropDownNote";

import useGlobalStore from "../../../stores/globalStore";

import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import CheckboxCard from "../../cards/CheckboxCard";

import {
  setSelectedDatasetToUploadDataTo,
  setAvailableDatasetsToUploadDataTo,
  fetchDatasetsToUploadDataTo,
} from "../../../stores/slices/pennsieveDatasetSelectSlice";

import { setCheckboxCardUnchecked } from "../../../stores/slices/checkboxCardSlice";
import {
  setGuidedDatasetName,
  setFreeFormDatasetName,
  setGuidedDatasetSubtitle,
} from "../../../stores/slices/guidedModeSlice";

const GenerateDatasetPennsieveTargetPage = ({ curationMode }) => {
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
  const datasetFetchErrorMessage = useGlobalStore((state) => state.datasetFetchErrorMessage);
  const guestUser = useGlobalStore((state) => state.isGuest);
  const isNewDatasetSelected = useGlobalStore(
    (state) =>
      state.cardData[
        `${curationMode}-generate-on-new-pennsieve-dataset${guestUser ? "-guest" : ""}`
      ]?.checked ?? false
  );
  const isExistingDatasetSelected = useGlobalStore(
    (state) =>
      state.cardData[`${curationMode}-generate-on-existing-pennsieve-dataset`]?.checked ?? false
  );

  // derive dataset name from the same store used on NameAndSubtitlePage
  const newDatasetName = useGlobalStore((state) => state.guidedDatasetName);
  const freeFormDatasetName = useGlobalStore((state) => state.freeFormDatasetName);

  // when ffm new-dataset is selected, keep the "selectedDataset" values
  // in sync so downstream logic still works with the normal upload flow.
  useEffect(() => {
    if (isNewDatasetSelected) {
      setSelectedDatasetToUploadDataTo(null, newDatasetName || null, null);
    }
  }, [newDatasetName, isNewDatasetSelected]);

  // clear values when user unchecks the new-dataset card
  useEffect(() => {
    if (!isNewDatasetSelected) {
      setGuidedDatasetName("");
      setSelectedDatasetToUploadDataTo(null, null, null);
    }
  }, [isNewDatasetSelected]);

  useEffect(() => {
    if (guestUser) {
      setCheckboxCardUnchecked(`${curationMode}-generate-on-new-pennsieve-dataset`);
    }
  });

  const handleSelectDataset = (id) => {
    const dataset = availableDatasetsToUploadDataTo.find((d) => d.value === id);
    setSelectedDatasetToUploadDataTo(
      id,
      dataset ? dataset.label : null,
      dataset ? dataset.intId : null
    );
  };

  useEffect(() => {
    if (isExistingDatasetSelected) {
      fetchDatasetsToUploadDataTo(curationMode === "gm");
    } else {
      setAvailableDatasetsToUploadDataTo([]);
    }
  }, [isExistingDatasetSelected, curationMode]);

  const renderDatasetSection = () => {
    if (isLoadingPennsieveDatasets) {
      return (
        <Stack align="center" mt="md">
          <Loader size="md" color="primary" type="bars" />
          <Text size="md" align="center" fw={500}>
            Retrieving {curationMode === "gm" ? "empty" : "existing"} datasets from Pennsieve...
          </Text>
        </Stack>
      );
    }

    if (datasetFetchErrorMessage) {
      return (
        <Stack mt="md">
          <Text size="md" align="center" fw={500} c="red">
            {datasetFetchErrorMessage}
          </Text>
          <Button onClick={() => fetchDatasetsToUploadDataTo(curationMode === "gm")} w="230px">
            Retry dataset retrieval
          </Button>
        </Stack>
      );
    }

    if (availableDatasetsToUploadDataTo.length > 0) {
      return (
        <React.Fragment>
          <Text mt="md" align="center" fw={500} size="lg">
            Select your Pennsieve dataset:
          </Text>
          <Select
            placeholder="Select a dataset"
            data={availableDatasetsToUploadDataTo}
            value={selectedDatasetIdToUploadDataTo}
            onChange={handleSelectDataset}
            maxDropdownHeight={200}
            comboboxProps={{ withinPortal: false }}
          />
          <DropDownNote id="user-retrieved-datasets-but-missing-desired-dataset" />
        </React.Fragment>
      );
    }

    if (guestUser) {
      return (
        <Stack mt="md" align="center">
          <Text size="md" align="left" fw={500}>
            Please contact the collaborator who shared the dataset to confirm you are in the correct
            workspace and have Editor or Manager permissions. For more information on uploading as a
            workspace guest, see the documentation{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.sodaforsparc.io/docs/miscellaneous/how-to/how-to-upload-as-pennsieve-guest"
            >
              here.
            </a>
            If you think you should have access to a shared Pennsieve dataset, contact the SODA team
            for help{" "}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.sodaforsparc.io/docs/miscellaneous/common-errors/sending-log-files-to-soda-team"
            >
              here.
            </a>
          </Text>
          <Button onClick={() => fetchDatasetsToUploadDataTo(curationMode === "gm")} w="230px">
            Retry dataset retrieval
          </Button>
          <DropDownNote id="user-doesnt-have-any-empty-datasets" />
        </Stack>
      );
    }

    return (
      <Stack mt="md" align="center">
        <Text size="md" align="center" fw={500}>
          No empty datasets were found that you have permission to upload to.
        </Text>
        <Button onClick={() => fetchDatasetsToUploadDataTo(curationMode === "gm")} w="230px">
          Retry dataset retrieval
        </Button>
        <DropDownNote id="user-doesnt-have-any-empty-datasets" />
      </Stack>
    );
  };

  return (
    <GuidedModePage pageHeader="Pennsieve Dataset">
      <GuidedModeSection>
        <Text align="center">
          Select where on Pennsieve you would like SODA to generate your dataset.
        </Text>

        <Group align="stretch" gap="md" justify="center">
          <CheckboxCard
            id={
              guestUser
                ? `${curationMode}-generate-on-new-pennsieve-dataset-guest`
                : `${curationMode}-generate-on-new-pennsieve-dataset`
            }
          />
          <CheckboxCard id={`${curationMode}-generate-on-existing-pennsieve-dataset`} />
        </Group>
      </GuidedModeSection>

      <Collapse in={isExistingDatasetSelected}>
        <GuidedModeSection>{renderDatasetSection()}</GuidedModeSection>
      </Collapse>
      <Collapse in={curationMode === "ffm" && isNewDatasetSelected}>
        <GuidedModeSection>
          <Center>
            <TextInput
              mt="md"
              label="Dataset Name:"
              required
              description="Enter a unique and informative name for your dataset."
              placeholder="Enter dataset name"
              value={freeFormDatasetName}
              onChange={(event) => setFreeFormDatasetName(event.target.value)}
              style={{ width: "600px", maxWidth: "100%" }}
            />
          </Center>
        </GuidedModeSection>
      </Collapse>
    </GuidedModePage>
  );
};

export default GenerateDatasetPennsieveTargetPage;
