import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useGlobalStore from "../../../stores/globalStore";
import {
  setAwardNumber,
  setMilestones,
  setMilestoneBeingAddedName,
  setMilestoneBeingAddedDate,
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
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

import DropdownSelect from "../../common/DropdownSelect";
import NavigationButton from "../../buttons/Navigation";

const SubmissionMetadataForm = () => {
  const fundingConsortiumDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-nih-funding-consortium"]?.selectedValue
  );
  const awardNumber = useGlobalStore((state) => state.awardNumber);

  // Milestones and their completion date states (for the SPARC funding consortium)
  const milestones = useGlobalStore((state) => state.milestones || []);
  const milestoneBeingAddedName = useGlobalStore((state) => state.milestoneBeingAddedName);
  const milestoneBeingAddedDate = useGlobalStore((state) => state.milestoneBeingAddedDate);

  // Function to add a milestone with its completion date
  const handleAddMilestone = () => {
    if (milestoneBeingAddedName.trim()) {
      const newMilestone = {
        name: milestoneBeingAddedName.trim(),
        date: milestoneBeingAddedDate,
      };
      setMilestones([...milestones, newMilestone]);
      setMilestoneBeingAddedName("");
      setMilestoneBeingAddedDate(null);
    }
  };

  // Function to remove a milestone
  const handleRemoveMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
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
          Submissions not funded by the NIH do not require funding information.
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
            <div>
              <Text size="md" fw={500} mb={3}>
                Milestone(s) Accomplished
              </Text>
              <Text size="xs" mb={5}>
                Enter the milestone(s) associated with this submission along with their completion
                dates.
              </Text>
              <Stack gap="md" mb="md">
                <Group gap="xs" align="flex-end">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500} mb={3}>
                      Milestone
                    </Text>
                    <TextInput
                      placeholder="Enter the name of the milestone"
                      value={milestoneBeingAddedName}
                      onChange={(event) => setMilestoneBeingAddedName(event.currentTarget.value)}
                      onKeyPress={(event) => {
                        if (event.key === "Enter") {
                          handleAddMilestone();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={3}>
                      Completion Date
                    </Text>
                    <DatePickerInput
                      value={milestoneBeingAddedDate}
                      onChange={setMilestoneBeingAddedDate}
                      placeholder="MM/DD/YYYY"
                      valueFormat="MM/DD/YYYY"
                      icon={<IconCalendar size={16} />}
                      clearable
                      style={{ width: "150px" }}
                    />
                  </div>
                  <Button onClick={handleAddMilestone} variant="default">
                    Add
                  </Button>
                </Group>
              </Stack>
              {milestones.length > 0 && (
                <Stack gap="xs" mb="md">
                  {milestones.map((milestone, index) => (
                    <Group
                      key={index}
                      justify="space-between"
                      p="sm"
                      style={{ border: "1px solid #e0e0e0", borderRadius: "4px" }}
                    >
                      <div>
                        <Text fw={500}>{milestone.name}</Text>
                        {milestone.date && (
                          <Text size="sm" c="dimmed">
                            {new Date(milestone.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </Text>
                        )}
                      </div>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => handleRemoveMilestone(index)}
                      >
                        Delete Milestone
                      </Button>
                    </Group>
                  ))}
                </Stack>
              )}
            </div>
          </>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
