import { useState, useEffect } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import EntityListContainer from "../../containers/EntityListContainer";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  TextInput,
  Text,
  Stack,
  Group,
  Button,
  Box,
  ActionIcon,
  Flex,
  Paper,
  Collapse,
  NumberInput,
  Checkbox,
} from "@mantine/core";
import { DatePicker, TimeInput, DateTimePicker } from "@mantine/dates";
import useGlobalStore from "../../../stores/globalStore";
import {
  addEntityToEntityList,
  removeEntityFromEntityList,
} from "../../../stores/slices/datasetEntitySelectorSlice";
import { naturalSort } from "../../shared/utils/util-functions";

const PerformanceIdManagement = () => {
  const datasetEntityObj = useGlobalStore((state) => state.datasetEntityObj);
  const [newEntityName, setNewEntityName] = useState("");
  const [protocolUrl, setProtocolUrl] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [performanceCount, setPerformanceCount] = useState(1);
  const [performanceForms, setPerformanceForms] = useState([]);

  const isPerformanceIdValid = window.evaluateStringAgainstSdsRequirements?.(
    newEntityName,
    "string-adheres-to-identifier-conventions"
  );

  const entityList = Object.keys(datasetEntityObj?.["performances"] || {});

  // Update performance forms when count changes
  useEffect(() => {
    // Initialize or update performance forms array
    const updatedForms = [...Array(performanceCount)].map((_, index) => {
      // Keep existing data if available
      const existingForm = performanceForms[index] || {};
      return {
        id: index + 1,
        startDateTime: existingForm.startDateTime || null,
        endDateTime: existingForm.endDateTime || null,
      };
    });
    setPerformanceForms(updatedForms);
  }, [performanceCount]);

  const updatePerformanceForm = (index, field, value) => {
    const updatedForms = [...performanceForms];
    updatedForms[index] = {
      ...updatedForms[index],
      [field]: value,
    };
    setPerformanceForms(updatedForms);
  };

  const handleAddEntity = () => {
    const trimmedName = newEntityName.trim();
    if (trimmedName && isPerformanceIdValid) {
      // Generate multiple performance IDs based on the count
      const successfullyAdded = [];
      const failedToAdd = [];

      performanceForms.forEach((form, index) => {
        // Format name with number only when there are multiple performances
        const formattedName =
          performanceCount > 1 ? `perf-${trimmedName}-${index + 1}` : `perf-${trimmedName}`;

        // Check for duplicates before adding
        if (entityList.includes(formattedName)) {
          failedToAdd.push(formattedName);
          return;
        }

        // Create entity data from this form's fields
        const entityData = {
          protocolUrl: protocolUrl.trim(),
          startDateTime: form.startDateTime ? form.startDateTime.toISOString() : null,
          endDateTime: form.endDateTime ? form.endDateTime.toISOString() : null,
        };

        // Add entity with additional data
        addEntityToEntityList("performances", formattedName, entityData);
        successfullyAdded.push(formattedName);
      });

      // Show appropriate messages
      if (successfullyAdded.length > 0) {
        window.electron.showToastMessage({
          type: "success",
          message: `${successfullyAdded.length} performance(s) added successfully.`,
        });
      }

      if (failedToAdd.length > 0) {
        window.electron.showToastMessage({
          type: "error",
          message: `${failedToAdd.length} performance ID(s) already existed and were not added.`,
        });
      }

      // Reset form fields
      setNewEntityName("");
      setProtocolUrl("");
      setPerformanceForms([]);
      setPerformanceCount(1);
      setIsFormVisible(false);
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      // Reset form fields when opening
      setNewEntityName("");
      setProtocolUrl("");
      setPerformanceForms([]);
      setPerformanceCount(1);
    }
  };

  return (
    <GuidedModePage pageHeader="Performance IDs">
      <GuidedModeSection>
        <Text>
          Provide information for each performance of experimental protocol in the interface below.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection>
        <Box
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f0f9ff",
            cursor: "pointer",
          }}
          p="sm"
          onClick={toggleFormVisibility}
        >
          <Flex align="center" gap="xs">
            <IconPlus size={15} color="#1c7ed6" />
            <Text fw={500} c="#1c7ed6">
              Add performances
            </Text>
          </Flex>
        </Box>

        <Collapse in={isFormVisible}>
          <Paper withBorder p="md" radius="sm">
            <Stack spacing="md">
              <TextInput
                label="Performance Type"
                description="Enter the type of procedure or measurement performed (e.g., histology, imaging, electrophysiology)"
                placeholder="Enter performance type (e.g., mri, histology, electrophysiology)"
                value={newEntityName}
                onChange={(event) => setNewEntityName(event.currentTarget.value)}
                error={
                  newEntityName && !isPerformanceIdValid
                    ? `Performance IDs can only contain letters, numbers, and hyphens.`
                    : null
                }
              />
              <NumberInput
                label="Number of Performances"
                description={`Specify how many times this procedure was performed. Will generate ${performanceCount} unique performance ID${
                  performanceCount > 1 ? "s" : ""
                }.`}
                value={performanceCount}
                onChange={setPerformanceCount}
                min={1}
                max={10}
              />

              <TextInput
                label="Protocol URL or DOI"
                description="Link to the protocol documentation that describes the methods used for this performance type."
                placeholder="Enter protocol URL or DOI (e.g., doi:10.1000/xyz123 or https://protocol.io/...)"
                value={protocolUrl}
                onChange={(event) => setProtocolUrl(event.currentTarget.value)}
              />

              {performanceForms.map((form, index) => (
                <Paper key={index} withBorder p="md" radius="sm">
                  <Text size="lg" fw={500} mb="md">
                    {newEntityName
                      ? performanceCount > 1
                        ? `perf-${newEntityName}-${index + 1}`
                        : `perf-${newEntityName}`
                      : ""}
                  </Text>
                  <Stack>
                    <Group grow align="flex-start">
                      <DateTimePicker
                        label="Start Date & Time"
                        description="Enter the date and time when the performance started."
                        placeholder="Select start date and time"
                        value={form.startDateTime}
                        onChange={(value) => updatePerformanceForm(index, "startDateTime", value)}
                        clearable
                        w={500} // Add width of 500px
                      />
                      <DateTimePicker
                        label="End Date & Time"
                        description="Enter the date and time when the performance ended."
                        placeholder="Select end date and time"
                        value={form.endDateTime}
                        onChange={(value) => updatePerformanceForm(index, "endDateTime", value)}
                        clearable
                        w={500} // Add width of 500px
                      />
                    </Group>
                  </Stack>
                </Paper>
              ))}

              <Group position="right" mt="md">
                <Button variant="outline" onClick={toggleFormVisibility}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntity}
                  disabled={!newEntityName || !isPerformanceIdValid}
                >
                  {performanceCount > 1 ? "Add Performances" : "Add Performance"}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Collapse>

        {entityList.length > 0 ? (
          <Stack gap="xs">
            {naturalSort(entityList).map((entityName) => (
              <Box
                key={entityName}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9",
                }}
                p="sm"
              >
                <Flex align="center" gap="xs">
                  <IconClipboard size={15} />
                  <Text fw={600}>{entityName}</Text>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => {
                      removeEntityFromEntityList("performances", entityName);
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Flex>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
            p="md"
          >
            <Text c="dimmed" ta="center">
              No performances have been added yet
            </Text>
          </Box>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default PerformanceIdManagement;
