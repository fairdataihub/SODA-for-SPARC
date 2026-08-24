import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useGlobalStore from "../../../stores/globalStore";
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
import CheckboxCard from "../../cards/CheckboxCard";
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
  Badge,
  TagsInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  toggleCompletionDateChecked,
} from "../../../stores/slices/datasetMetadataSlice";

import DropdownSelect from "../../common/DropdownSelect";
import NavigationButton from "../../buttons/Navigation";

const SubmissionMetadataForm = () => {
  const fundingConsortiumDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-nih-funding-consortium"]?.selectedValue
  );
  const completionDateChecked = useGlobalStore((state) => state.completionDateChecked);
  const awardNumber = useGlobalStore((state) => state.awardNumber);
  const milestones = useGlobalStore((state) => state.milestones || []);
  let milestoneDate = useGlobalStore((state) => state.milestoneDate || []);
  if (!Array.isArray(milestoneDate)) {
    if (milestoneDate == null || milestoneDate == undefined) {
      milestoneDate = [];
    } else {
      milestoneDate = milestoneDate.map((date) => {
        return new Date(date);
      });
    }
  } else {
    milestoneDate = milestoneDate.map((date) => {
      return new Date(date);
    });
  }

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
      <GuidedModeSection>
        <Stack gap={0}>
          <label className="guided--form-label centered mt-md">
            Is your submission funded by the NIH?
          </label>
          <Center>
            <CheckboxCard id="submission-nih-funded-yes" />
            <CheckboxCard id="submission-nih-funded-no" />
          </Center>
        </Stack>
      </GuidedModeSection>

      <GuidedModeSection
        sectionId="guided-section-nih-funded-no-message"
        centered
        className="hidden"
      >
        <Text size="md" fw={500}>
          Continue to add contributor information.
        </Text>
        <NavigationButton
          onClick={() => {
            document.getElementById("guided-next-button").click();
          }}
          buttonCustomWidth={"215px"}
          buttonText={"Save and Continue"}
          navIcon={"right-arrow"}
          buttonSize={"md"}
        />
      </GuidedModeSection>

      <GuidedModeSection
        sectionId="guided-section-nih-funded-yes-message"
        withBorder
        className="hidden"
      >
        <TextInput
          label="Award number:"
          description="The award number issued by the funding agency. Leave blank if not applicable."
          placeholder="Enter award number"
          value={awardNumber}
          onChange={(event) => setAwardNumber(event.target.value)}
        />
        <DropdownSelect id="guided-nih-funding-consortium" />
        {fundingConsortiumDropdownState === "SPARC" && (
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
            <DatePickerInput
              type="multiple"
              value={milestoneDate}
              onChange={handleMilestoneDateChange}
              label="Milestone completion date"
              placeholder="MM/DD/YYYY"
              valueFormat="MM/DD/YYYY"
              icon={<IconCalendar size={16} />}
              clearable
              description="Enter the completion date(s) associated with the milestone(s). Leave blank if the completion date is not related to a pre-agreed milestone."
            />
          </>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
