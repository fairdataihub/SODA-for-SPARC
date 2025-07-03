import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useGlobalStore from "../../../stores/globalStore";
import ExternalLink from "../../buttons/ExternalLink";
import {
  setAwardNumber,
  setMilestones,
  setMilestoneDate,
} from "../../../stores/slices/datasetMetadataSlice";
import {
  IconUser,
  IconFlask,
  IconMapPin,
  IconFileSpreadsheet,
  IconAlertCircle,
  IconCheck,
  IconDownload,
  IconUpload,
  IconFileImport,
  IconX,
  IconCalendar,
} from "@tabler/icons-react";
import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Center,
  Paper,
  Box,
  Title,
  Select,
  List,
  TextInput,
  Card,
  Divider,
  Checkbox,
  TagsInput,
  Badge,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  setManualFundingAgency,
  toggleCompletionDateChecked,
} from "../../../stores/slices/datasetMetadataSlice";

import DropdownSelect from "../../common/DropdownSelect";

const SubmissionMetadataForm = () => {
  const fundingAgencyDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-funding-agency"]?.selectedValue
  );
  const fundingConsortiumDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-nih-funding-consortium"]?.selectedValue
  );
  console.log("fundingAgencyDropdownState", fundingAgencyDropdownState);
  console.log("fundingConsortiumDropdownState", fundingConsortiumDropdownState);
  const completionDateChecked = useGlobalStore((state) => state.completionDateChecked);
  const manualFudingAgency = useGlobalStore((state) => state.manualFudingAgency);
  const awardNumber = useGlobalStore((state) => state.awardNumber);
  const milestones = useGlobalStore((state) => state.milestones || []);
  const milestoneDate = useGlobalStore((state) => state.milestoneDate || null);

  // Function to handle milestone tags changes
  const handleMilestonesChange = (values) => {
    setMilestones(values);
  };

  // Function to handle milestone date change
  const handleMilestoneDateChange = (date) => {
    setMilestoneDate(date);
  };

  return (
    <GuidedModePage pageHeader="Funding And Submission Metadata">
      <GuidedModeSection>
        <Text>
          Provide details about the institutions and funding sources associated with this dataset in
          the interface below.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection withBorder>
        <DropdownSelect id="guided-funding-agency" />

        {fundingAgencyDropdownState && (
          <>
            {/* Show text input if "Other" is selected as funding agency */}
            {fundingAgencyDropdownState === "Other" && (
              <TextInput
                label="Funding agency name:"
                placeholder="Enter the name of the funding agency"
                description="Please specify the name of your funding agency."
                value={manualFudingAgency}
                onChange={(event) => setManualFundingAgency(event.target.value)}
              />
            )}
            {/* Show consortium dropdown only if agency is NIH */}
            {fundingAgencyDropdownState === "NIH" && (
              <DropdownSelect id="guided-nih-funding-consortium" />
            )}
            {/* SPARC-specific milestone UI (only if NIH/SPARC is selected) */}
            {fundingAgencyDropdownState === "NIH" && fundingConsortiumDropdownState === "SPARC" && (
              <>
                <TagsInput
                  label="Milestone(s) accomplished"
                  description="Enter the milestone(s) associated with this submission."
                  placeholder="Type and press Enter to add a milestone"
                  value={milestones}
                  onChange={handleMilestonesChange}
                  clearable
                  data={[]}
                />
                <DateInput
                  value={milestoneDate}
                  onChange={handleMilestoneDateChange}
                  label="Milestone completion date"
                  placeholder="MM/DD/YYYY"
                  valueFormat="MM/DD/YYYY"
                  icon={<IconCalendar size={16} />}
                  clearable
                  description="Enter the completion date associated with the milestone(s). Leave blank if the completion date is not related to a pre-agreed milestone."
                />
              </>
            )}

            {fundingAgencyDropdownState && (
              <TextInput
                label="Award number:"
                description="The award number issued by the funding agency. Leave blank if not applicable."
                placeholder="Enter award number"
                value={awardNumber}
                onChange={(event) => setAwardNumber(event.target.value)}
              />
            )}
          </>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
