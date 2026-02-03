import { useState, useCallback } from "react";
import { Text, Stack, Group, Paper, Tooltip, ActionIcon, Radio, Box } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";

export const contentOptionsMap = {
  subjects: {
    label: "Did your research involve human or animal subjects?",
    dropDownDescription:
      "Select yes if you gathered data directly from living organisms such as human participants, laboratory animals, or other biological subjects. Examples include medical patients, experimental animals, behavioral study participants, etc.",
    ml: 0,
  },
  samples: {
    label: "Did you collect physical samples from your subjects?",
    dropDownDescription:
      "Select yes if you physically removed material from a subject to create a sample that exists independently of the subject. Examples include tissue biopsies, blood draws, urine samples, swabs, or any specimen that can be stored, processed, or analyzed separately from the subject.",
    requiresAnswer: ["subjects"],
    ml: 10,
  },
  derivedSamples: {
    label: "Did you derive samples from samples collected from subjects?",
    dropDownDescription:
      "Select yes if you created additional samples from samples that were collected directly from subjects. Examples include tissue sections, cell cultures, extracted RNA or protein, or other samples created from the originally collected material.",
    requiresAnswer: ["subjects", "samples"],
    ml: 20,
  },
  subjectSites: {
    label: "Did you collect data from specific locations within your subjects?",
    dropDownDescription:
      "Select yes if you collected data from distinct anatomical locations within a subject without creating a physical sample, and those locations require separate metadata. Examples include recordings from different brain regions, measurements from multiple organs, or sensors placed on different body locations of the same subject.",
    requiresAnswer: ["subjects"],
    ml: 10,
  },
  sampleSites: {
    label: "Did you collect data from specific locations within your samples?",
    dropDownDescription:
      "Select yes if you collected data from distinct spatial locations within the same sample without creating new samples, and those locations require separate metadata. Examples include imaging different regions of a tissue section, measurements from multiple areas of a single specimen, or recordings from defined locations within a prepared sample.",
    requiresAnswer: ["subjects", "samples"],
    ml: 20,
  },

  performances: {
    label: "Did you collect data from subjects across multiple sessions or time points?",
    dropDownDescription:
      "Select yes if you performed procedures on the same subjects at different times or under different conditions. Examples include: follow-up measurements, varied stimulation parameters, different behavioral tests, sequential imaging sessions, or any case where you need to track which protocol or time point generated specific data.",
    requiresAnswer: ["subjects"],
    ml: 10,
  },
  Code: {
    label: "Does your dataset include any code?",
    dropDownDescription:
      "Select yes if your dataset contains computational tools, scripts, or analysis pipelines that were used to generate or analyze your data. This includes custom code, analysis scripts, and simulation software relevant to understanding your results.",
    ml: 0,
  },
  Protocol: {
    label:
      "Does your dataset include any protocols describing experimental or computational procedures?",
    dropDownDescription:
      "Select yes if your dataset contains protocol files that describe the methods and procedures used during data collection or analysis.",
    ml: 0,
  },
  Docs: {
    label: "Does your dataset include any documentation files?",
    dropDownDescription:
      "Select yes if your dataset includes files that describe, explain, or organize the data — such as README files, data dictionaries, summaries of experimental methods, or overviews of data organization. " +
      "These materials help others interpret and use the dataset effectively.",
    ml: 0,
  },
};

const DatasetContentSelector = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  const deSelectedEntities = useGlobalStore((state) => state.deSelectedEntities);
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEntitySelection = useCallback((key, answer) => {
    const { selectedEntities, deSelectedEntities } = useGlobalStore.getState();

    if (answer === "yes") {
      // If yes is selected, add to selectedEntities and remove from deSelectedEntities
      useGlobalStore.setState({
        selectedEntities: selectedEntities.includes(key)
          ? selectedEntities
          : [...selectedEntities, key],
        deSelectedEntities: deSelectedEntities.filter((id) => id !== key),
      });
    } else if (answer === "no") {
      // If no is selected, add to deSelectedEntities and remove from selectedEntities
      useGlobalStore.setState({
        deSelectedEntities: deSelectedEntities.includes(key)
          ? deSelectedEntities
          : [...deSelectedEntities, key],
        selectedEntities: selectedEntities.filter((id) => id !== key),
      });
    }
  }, []);

  const visibleQuestions = Object.entries(contentOptionsMap).filter(([key, option]) => {
    // Check requiresAnswer dependencies (need "yes" answers)
    if (option.requiresAnswer && option.requiresAnswer.length > 0) {
      for (const dependency of option.requiresAnswer) {
        if (!selectedEntities.includes(dependency)) {
          return false; // Hide if dependency doesn't have a "yes" answer
        }
      }
    }

    // Check requiresSelection dependencies (need any answer)
    if (option.requiresSelection && option.requiresSelection.length > 0) {
      // ALL dependencies need to be answered (either yes or no)
      for (const dependency of option.requiresSelection) {
        if (!selectedEntities.includes(dependency) && !deSelectedEntities.includes(dependency)) {
          return false; // Hide if any dependency hasn't been answered
        }
      }
    }

    return true; // Show the question if all dependencies are satisfied or it has no dependencies
  });

  return (
    <GuidedModePage pageHeader="Dataset content">
      <GuidedModeSection>
        <Text>
          Answer the following questions about your dataset in the previous step to help SODA choose
          the best workflow for organizing your data.
        </Text>
      </GuidedModeSection>
      <GuidedModeSection withBorder>
        <Stack gap="md">
          {visibleQuestions.map(([key, option]) => {
            let radioValue;
            if (selectedEntities.includes(key)) {
              radioValue = "yes";
            } else if (deSelectedEntities.includes(key)) {
              radioValue = "no";
            } else {
              radioValue = null;
            }

            // Get the right labels based on the option
            let yesLabel = "Yes";
            let noLabel = "No";

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "6px 10px",
                  borderRadius: "6px",
                }}
              >
                <Group position="apart" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group align="center" spacing="xs">
                      <Text size="md" fw={600}>
                        {option.label}
                      </Text>
                      {option.dropDownDescription && (
                        <Tooltip
                          label={expanded[key] ? "Hide details" : "Show details"}
                          zIndex={2999}
                        >
                          <ActionIcon
                            size="sm"
                            variant="transparent"
                            onClick={() => toggleExpanded(key)}
                          >
                            {expanded[key] ? (
                              <IconChevronUp size={16} />
                            ) : (
                              <IconChevronDown size={16} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                    {option.description && (
                      <Text c="dimmed" mt={2}>
                        {option.description}
                      </Text>
                    )}
                  </div>
                </Group>

                {expanded[key] && option.dropDownDescription && (
                  <Box mb="md">
                    <SodaGreenPaper mt="sm" mb="sm">
                      <Text fw={500}>{option.dropDownDescription}</Text>
                    </SodaGreenPaper>
                  </Box>
                )}

                <Radio.Group
                  value={radioValue}
                  onChange={(value) => handleEntitySelection(key, value)}
                  mt={expanded[key] ? 0 : "sm"}
                  name={`radio-group-${key}`}
                >
                  <Group spacing="md">
                    <Radio value="yes" label={yesLabel} />
                    <Radio value="no" label={noLabel} />
                  </Group>
                </Radio.Group>
              </div>
            );
          })}
        </Stack>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default DatasetContentSelector;
