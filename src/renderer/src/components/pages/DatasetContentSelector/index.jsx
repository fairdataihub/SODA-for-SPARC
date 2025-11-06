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
    label: "Did you collect biological or physical samples from your subjects?",
    dropDownDescription:
      "Select yes if you obtained physical specimens such as tissue, blood, urine, or other biological materials from your human or animal subjects. This applies when you collected actual samples, not just measurements or observations.",
    requiresAnswer: ["subjects"],
    ml: 10,
  },
  sites: {
    label:
      "Did you collect data from specific anatomical locations that need to be tracked separately?",
    dropDownDescription:
      "Select yes if you gathered data from different specific locations (e.g., brain regions, tissue sections, organ areas) within your subjects or samples, AND these locations need separate metadata. Examples include: recordings from multiple brain areas, measurements from different parts of an organ, or microscopy of different regions within a tissue sample.",
    requiresAnswer: ["subjects", "samples"],
    ml: 10,
  },
  performances: {
    label: "Did you collect data from subjects across multiple sessions or time points?",
    dropDownDescription:
      "Select yes if you performed procedures on the same subjects at different times or under different conditions. Examples include: follow-up measurements, varied stimulation parameters, different behavioral tests, sequential imaging sessions, or any case where you need to track which protocol or time point generated specific data.",
    requiresAnswer: ["subjects"],
    ml: 10,
  },
  Code: {
    label: "Did you use code to generate or analyze your data?",
    dropDownDescription:
      "Select yes if your research involved computational tools, scripts, or analysis pipelines that were important for generating or analyzing your data. This includes custom code, analysis scripts, and simulation software relevant to understanding your results.",
    ml: 0,
  },

  Protocol: {
    label:
      "Does your dataset include any protocols describing experimental or computational procedures?",
    dropDownDescription:
      "Select yes if your dataset contains protocol files that describe the methods and procedures used during data collection or analysis.",
    ml: 0,
    requiresSelection: ["subjects", "Code"],
  },
  Docs: {
    label: "Does your dataset include any documentation files?",
    dropDownDescription:
      "Select yes if your dataset includes files that describe, explain, or organize the data — such as README files, data dictionaries, summaries of experimental methods, or overviews of data organization. " +
      "These materials help others interpret and use the dataset effectively.",
    ml: 0,
    requiresSelection: ["subjects", "Code"],
  },
};

const DatasetContentSelector = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  console.log("Selected Entities:", selectedEntities);
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
          Answer the following questions about your dataset to help SODA choose the best workflow
          for organizing your data.
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
                      <Text>{option.dropDownDescription}</Text>
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
