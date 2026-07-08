import { useState, useCallback } from "react";
import { Text, Stack, Group, Paper, Tooltip, ActionIcon, Radio, Box, Image } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";
import {
  addEntityToSelectedEntities,
  removeEntityFromSelectedEntities,
} from "../../../stores/slices/datasetContentSelectorSlice";

export const contentOptionsMap = {
  subjects: {
    label: "Did your research involve human or animal subjects?",
    dropDownDescription:
      "Select yes if you gathered data directly from living organisms such as human participants, laboratory animals, or other biological subjects. Examples include medical patients, experimental animals, behavioral study participants, etc. Your subject will have metadata and in many cases, data files.",
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
    label: "Did you derive further samples from your physical samples (e.g., RNA, plasma)?",
    dropDownDescription:
      "Examples of a derived sample include the following: tissue sections, cell cultures, extracted RNA or protein. View the decision tree below if you are unsure about whether to answer yes or no to this question.",
    requiresAnswer: ["subjects", "samples"],
    imgSrc: "/img/derivedsamplesv5.png",
    alt: "A decision tree depicting how to determine if your dataset has derived samples.",
    ml: 20,
  },
  subjectSites: {
    label:
      "Did you collect data from multiple distinct locations within each subject (e.g., different brain regions, electrode placements)?",
    dropDownDescription:
      "Examples include collecting data from multiple electrodes placed on a subject, or gathering readings from the left eye and right eye of a subject. For each location you will later provide location specific metadata and data files. View the decision tree below if you are unsure about whether to answer yes or no to this question.",
    requiresAnswer: ["subjects"],
    imgSrc: "/img/subjectsitesv5.png",
    alt: "A decision tree depicting how to determine if your dataset has site data taken from subjects.",

    ml: 10,
  },
  sampleSites: {
    label:
      "Did you collect data from multiple distinct locations within each sample (e.g., different regions of a tissue section)?",
    dropDownDescription:
      "Examples include collecting imaging data from different locations of a tissue section. For each location you will later provide location specific metadata and data files. View the decision tree below if you are unsure about whether to answer yes or no to this question.",
    requiresAnswer: ["subjects", "samples"],
    imgSrc: "/img/samplesitesv5.png",
    alt: "A decision tree depicting how to determine if your dataset has site data taken from samples.",
    ml: 20,
  },

  performances: {
    label:
      "Did you collect data from subjects or samples across multiple sessions or timepoints using the same experimental protocol (e.g., sequential imaging sessions, varied stimulation parameters)?",
    dropDownDescription:
      "Examples include collecting data from: follow-up measurements, varied stimulation parameters, different behavioral tests, sequential imaging sessions, or any case where you need to track which protocol or time point generated specific data. View the decision tree below if you are unsure about whether to answer yes or no to this question.",
    requiresAnswer: ["subjects"],
    imgSrc: "/img/performancesv5.png",
    alt: "A decision tree depicting how to determine if your dataset has data collcted during performances. ",
    ml: 10,
  },
  Code: {
    label: "Does your data include any code?",
    dropDownDescription:
      "Select yes if your data contains computational tools, scripts, or analysis pipelines that were used to generate or analyze your data. This includes custom code, analysis scripts, and simulation software relevant to understanding your results.",

    ml: 0,
  },
  Protocol: {
    label:
      "Does your data include protocol files describing experimental or computational procedures?",
    dropDownDescription:
      "Select Yes if your dataset contains documents that describe how experiments were conducted, how samples were processed, or how data was analyzed (e.g., SOPs, methods documents, workflows, or Protocols.io exports).",
    ml: 0,
  },
  Docs: {
    label:
      "Did you include any documentation files (e.g., README, data dictionary, PDF award file)?",
    dropDownDescription:
      "Select yes if your data includes files that describe, explain, or organize the data — such as README files, data dictionaries, summaries of experimental methods, or overviews of data organization. " +
      "These materials help others interpret and use the data effectively.",
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
    if (answer === "yes") {
      // If yes is selected, add to selectedEntities and remove from deSelectedEntities
      addEntityToSelectedEntities(key);
    } else if (answer === "no") {
      // If no is selected, add to deSelectedEntities and remove from selectedEntities
      removeEntityFromSelectedEntities(key);
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
          Answer the following questions about the data you imported in the previous step to help
          SODA choose the best workflow for organizing your data.
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
                    <Group align="center" spacing="xs" wrap="nowrap">
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
                      {option.imgSrc && <Image src={option.imgSrc} alt={option.alt}></Image>}
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
