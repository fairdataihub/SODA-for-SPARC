import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useGlobalStore from "../../../stores/globalStore";
import {
  IconUser,
  IconFlask,
  IconMapPin,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Box,
  Title,
  Select,
  List,
  Card,
} from "@mantine/core";

import DropdownSelect from "../../common/DropdownSelect";

const SubmissionMetadataForm = () => {
  const fundingConsortiumDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-select-sparc-funding-consortium"].selectedValue
  );
  console.log("fundingConsortiumDropdownState", fundingConsortiumDropdownState);
  return (
    <GuidedModePage pageHeader="Submission Metadata">
      <GuidedModeSection>
        <Text mb="xl">
          Follow the instructions below to import the IDs and metadata for the entities in your
          dataset using spreadsheets.
        </Text>
        <DropdownSelect id="guided-select-sparc-funding-consortium" />
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
