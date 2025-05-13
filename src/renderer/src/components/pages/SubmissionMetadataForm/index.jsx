import { useEffect, useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import useGlobalStore from "../../../stores/globalStore";
import { setAwardNumber, setMilestones } from "../../../stores/slices/datasetMetadataSlice";
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
  TextInput,
  Card,
  Divider,
  TagsInput,
} from "@mantine/core";
import {
  setOtherFundingConsortium,
  setOtherFundingAgency,
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

  const otherFundingConsortium = useGlobalStore((state) => state.otherFundingConsortium);
  const otherFundingAgency = useGlobalStore((state) => state.otherFundingAgency);
  const awardNumber = useGlobalStore((state) => state.awardNumber);
  const milestones = useGlobalStore((state) => state.milestones || []);
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

  return (
    <GuidedModePage pageHeader="Submission Metadata">
      <GuidedModeSection>
        <Text mb="xl">
          Follow the instructions below to import the IDs and metadata for the entities in your
          dataset using spreadsheets.
        </Text>

        <DropdownSelect id="guided-select-funding-agency" />

        {fundingAgencyDropdownState === "NIH" ? (
          <>
            <DropdownSelect id="guided-select-sparc-funding-consortium" />

            {fundingConsortiumDropdownState === "Other" && (
              <TextInput
                label="Funding consortium name:"
                placeholder="Enter the name of the funding consortium"
                description="Please provide the full official name of your funding consortium"
                value={otherFundingConsortium}
                onChange={(event) => setOtherFundingConsortium(event.target.value)}
                required
              />
            )}
            {fundingConsortiumDropdownState === "SPARC" && (
              <Box mt="lg">
                <Text fw={500} mb="md">
                  SPARC Data Deliverables Document
                </Text>
                <Text size="sm" mb="md" color="dimmed">
                  To quickly populate your submission metadata, drop your SPARC data deliverables
                  document below. SODA will extract relevant information.
                </Text>

                <Dropzone
                  onDrop={handleDrop}
                  maxSize={3 * 1024 ** 2}
                  accept={[".xlsx", ".xls", ".csv"]}
                  mt="md"
                  mb="lg"
                  p="xl"
                >
                  <Group
                    position="center"
                    spacing="xl"
                    style={{ minHeight: 120, pointerEvents: "none" }}
                  >
                    <Dropzone.Accept>
                      <IconFileImport size={50} stroke={1.5} color="var(--mantine-color-blue-6)" />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size={50} stroke={1.5} color="var(--mantine-color-red-6)" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconFileSpreadsheet size={50} stroke={1.5} />
                    </Dropzone.Idle>

                    <Stack spacing={0} align="center">
                      <Text size="xl" inline>
                        {selectedFile
                          ? selectedFile.name
                          : "Drag your deliverables document here or click to select"}
                      </Text>
                      <Text size="sm" color="dimmed" inline mt={7}>
                        Files should be in Excel or CSV format and under 3MB
                      </Text>
                    </Stack>
                  </Group>
                </Dropzone>

                {selectedFile && (
                  <Group position="left" mt="md">
                    <IconCheck size={18} color="green" />
                    <Text size="sm">File selected: {selectedFile.name}</Text>
                    <Button variant="light" size="xs" onClick={() => setSelectedFile(null)}>
                      Remove
                    </Button>
                  </Group>
                )}

                <Divider my="lg" />
              </Box>
            )}
          </>
        ) : (
          <TextInput
            label="Funding agency name:"
            placeholder="Enter the name of the funding agency"
            description="Please provide the full official name of your funding agency"
            value={otherFundingAgency}
            onChange={(event) => setOtherFundingAgency(event.target.value)}
            required
          />
        )}

        {/* Award Number Input */}
        <TextInput
          label="Award number:"
          description="The award number issued by the funding agency."
          placeholder="Enter award number"
          value={awardNumber}
          onChange={(event) => setAwardNumber(event.target.value)}
          mt="md"
          mb="md"
        />
        {fundingConsortiumDropdownState === "SPARC" && (
          <Box mt="md">
            <TagsInput
              label="Milestone(s) accomplished"
              description="Enter the milestone(s) associated with this submission."
              placeholder="Type and press Enter to add a milestone"
              value={milestones}
              onChange={handleMilestonesChange}
              clearable
              splitChars={[",", ";", " "]}
              data={[]} // You can pre-populate with common milestones if needed
            />
          </Box>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default SubmissionMetadataForm;
