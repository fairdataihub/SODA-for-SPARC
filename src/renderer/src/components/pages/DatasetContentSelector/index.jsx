import { useState, useCallback } from "react";
import { Text, Stack, Group, Paper, Tooltip, ActionIcon, Radio } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
const contentOptionsMap = {
  subjects: {
    label: "Did your research involve human or animal subjects?",
    description:
      "Select this option if you gathered data directly from living organisms such as human participants, laboratory animals, or other biological subjects. Examples include medical patients, experimental animals, behavioral study participants, etc.",
    ml: 0,
  },
  samples: {
    label: "Did you collect biological or physical samples from your subjects?",
    description:
      "Select this option if you obtained physical specimens such as tissue, blood, urine, or other biological materials from your human or animal subjects. This applies when you collected actual samples, not just measurements or observations.",
    dependsOn: ["subjects"],
    ml: 10,
  },
  sites: {
    label:
      "Did you collect data from specific anatomical locations that need to be tracked separately?",
    description:
      "Select this option if you gathered data from different specific locations (e.g., brain regions, tissue sections, organ areas) within your subjects or samples, AND these locations need separate metadata. Examples include: recordings from multiple brain areas, measurements from different parts of an organ, or microscopy of different regions within a tissue sample.",
    dependsOn: ["subjects"],
    ml: 10,
  },

  performances: {
    label: "Did you collect data from subjects across multiple sessions or time points?",
    description:
      "Select this option if you performed procedures on the same subjects at different times or under different conditions. Examples include: follow-up measurements, varied stimulation parameters, different behavioral tests, sequential imaging sessions, or any case where you need to track which protocol or time point generated specific data.",
    dependsOn: ["subjects"],
    ml: 10,
  },
  code: {
    label: "Did you use software code to generate or analyze your data?",
    description:
      "Select this option if your research involved computational tools, scripts, or analysis pipelines that were important for generating or analyzing your data. This includes custom code, analysis scripts, and simulation software relevant to understanding your results.",
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
    if (
      option.dependsOn?.includes("subjects") &&
      (deSelectedEntities.includes("subjects") || !selectedEntities.includes("subjects"))
    ) {
      return false;
    }
    return true;
  });

  return (
    <GuidedModePage pageHeader="Dataset content">
      <GuidedModeSection>
        <Text>
          Answer the following questions about the data collected during your study to help SODA
          determine the optimal workflow to organize your dataset.
        </Text>
      </GuidedModeSection>
      <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
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
                <Group position="apart" align="center">
                  <Text size="md" fw={600}>
                    {option.label}
                  </Text>

                  {option.description && (
                    <Tooltip
                      label={expanded[key] ? "Hide description" : "Show description"}
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

                {expanded[key] && (
                  <SodaGreenPaper mt="sm" mb="sm">
                    <Text>{option.description}</Text>
                  </SodaGreenPaper>
                )}

                <Radio.Group
                  value={radioValue}
                  onChange={(value) => handleEntitySelection(key, value)}
                  mt={expanded[key] ? 0 : "sm"}
                  name={`radio-group-${key}`}
                >
                  <Group spacing="md">
                    <Radio value="yes" label="Yes" />
                    <Radio value="no" label="No" />
                  </Group>
                </Radio.Group>
              </div>
            );
          })}
        </Stack>
      </Paper>
    </GuidedModePage>
  );
};

export default DatasetContentSelector;
