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
  setOtherFundingConsortium,
  setOtherFundingAgency,
  toggleCompletionDateChecked,
} from "../../../stores/slices/datasetMetadataSlice";
import { Dropzone } from "@mantine/dropzone";

import DropdownSelect from "../../common/DropdownSelect";

const SubmissionMetadataForm = () => {
  const fundingAgencyDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-select-funding-agency"]?.selectedValue
  );
  const fundingConsortiumDropdownState = useGlobalStore(
    (state) => state.dropDownState["guided-select-sparc-funding-consortium"]?.selectedValue
  );
  console.log("fundingAgencyDropdownState", fundingAgencyDropdownState);
  console.log("fundingConsortiumDropdownState", fundingConsortiumDropdownState);
  const completionDateChecked = useGlobalStore((state) => state.completionDateChecked);
  const showCustomConsortiumNameUI =
    fundingAgencyDropdownState !== "NIH" || fundingConsortiumDropdownState === "Other";
  console.log("showCustomConsortiumNameUI", showCustomConsortiumNameUI);

  const otherFundingConsortium = useGlobalStore((state) => state.otherFundingConsortium);
  const otherFundingAgency = useGlobalStore((state) => state.otherFundingAgency);
  const awardNumber = useGlobalStore((state) => state.awardNumber);
  const milestones = useGlobalStore((state) => state.milestones || []);
  const milestoneDate = useGlobalStore((state) => state.milestoneDate || null);

  const [selectedFile, setSelectedFile] = useState(null);

  // Function to handle file drop
  const handleDrop = (files) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      console.log("File selected:", files[0].name);
      // Here you would typically process the file, possibly extracting award number
      // and other metadata from it
    }
  };

  // Function to handle milestone tags changes
  const handleMilestonesChange = (values) => {
    setMilestones(values);
  };

  // Function to handle milestone date change
  const handleMilestoneDateChange = (date) => {
    setMilestoneDate(date);
  };

  return (
    <GuidedModePage pageHeader="Funding and Submission Metadata">
      <GuidedModeSection>
        <Text>
          Provide details about the institutions and funding sources associated with this dataset in
          the interface below.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection withBorder>
        <DropdownSelect id="guided-select-funding-agency" />

        {fundingAgencyDropdownState && (
          <>
            {/* Show text input if "Other" is selected as funding agency */}
            {fundingAgencyDropdownState === "Other" && (
              <TextInput
                label="Funding agency name:"
                placeholder="Enter the name of the funding agency"
                description="Please specify the name of your funding agency."
                value={otherFundingAgency}
                onChange={(event) => setOtherFundingAgency(event.target.value)}
                required
              />
            )}
            {/* Show consortium dropdown only if agency is NIH */}
            {fundingAgencyDropdownState === "NIH" && (
              <>
                <DropdownSelect id="guided-select-sparc-funding-consortium" />
                {/* SPARC-specific UI */}
                {fundingConsortiumDropdownState === "SPARC" && (
                  <Box mt="lg">
                    <Paper withBorder p="md" radius="md" bg="gray.0">
                      <Group position="center" mb="xs">
                        <Title order={5}>SPARC Data Deliverables Document Import</Title>

                        <Text>
                          If you have your SPARC data deliverables document, import it below.
                          Otherwise, fill out the inputs below regarding your Award Number and
                          Milestone(s) manually. You can find out more about the Data Deliverables
                          document and how to obtain it{" "}
                          <ExternalLink
                            href="https://docs.sodaforsparc.io/docs/how-to/how-to-get-your-data-deliverables-document"
                            buttonText="here"
                            buttonType="anchor"
                          />
                          .
                        </Text>
                      </Group>

                      {/* Improved centered dropzone */}
                      <Dropzone
                        onDrop={handleDrop}
                        maxSize={3 * 1024 ** 2}
                        accept={[".xlsx", ".xls", ".csv"]}
                        mt="md"
                        mb="md"
                        p="xl"
                        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                          }}
                        >
                          <Dropzone.Accept>
                            <IconFileImport
                              size={40}
                              stroke={1.5}
                              color="var(--mantine-color-blue-6)"
                            />
                          </Dropzone.Accept>
                          <Dropzone.Reject>
                            <IconX size={40} stroke={1.5} color="var(--mantine-color-red-6)" />
                          </Dropzone.Reject>
                          <Dropzone.Idle>
                            <Center>
                              <IconFileSpreadsheet size={40} stroke={1.5} />
                            </Center>
                          </Dropzone.Idle>

                          <Text size="lg" mt={10} ta="center">
                            {selectedFile
                              ? selectedFile.name
                              : "Drag deliverables document here or click here to import"}
                          </Text>
                        </Box>
                      </Dropzone>

                      {/* Centered file selected notification */}
                      {selectedFile && (
                        <Group position="center" mt="md">
                          <IconCheck size={18} color="green" />
                          <Text size="sm">File selected: {selectedFile.name}</Text>
                          <Button variant="light" size="xs" onClick={() => setSelectedFile(null)}>
                            Remove
                          </Button>
                        </Group>
                      )}
                    </Paper>
                  </Box>
                )}
              </>
            )}
            {showCustomConsortiumNameUI && (
              <TextInput
                label="Funding Consortium Name:"
                placeholder="Enter the name of the funding consortium or program"
                description="The consortium that funded the creation of this dataset. Leave blank if not applicable."
                value={otherFundingConsortium}
                onChange={(event) => setOtherFundingConsortium(event.target.value)}
              />
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
                  splitChars={[",", ";", " "]}
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
          </>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
