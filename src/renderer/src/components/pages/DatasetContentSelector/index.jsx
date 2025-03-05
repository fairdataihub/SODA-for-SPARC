import { useState, useCallback } from "react";
import {
  Text,
  Grid,
  Stack,
  Group,
  Button,
  Paper,
  Progress,
  Box,
  Tooltip,
  Checkbox,
  ActionIcon,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import { toggleEntitySelection } from "../../../stores/slices/datasetContentSelectorSlice";
import { IconSearch } from "@tabler/icons-react";
import SodaGreenPaper from "../../utils/ui/SodaGreenPaper";

const contentOptionsMap = {
  subjects: {
    label: "I collected data from subjects",
    description: "Subjects are humans, animals, or other biological specimens.",
    ml: 0,
  },
  samples: {
    label: "I collected samples from my subjects",
    description:
      "Samples are biological or physical specimens like tissue or blood taken from subjects",
    dependsOn: ["subjects"],
    dependsOnNotSatiatedMessage: "You must indicate that you collected data from subjects first.",
    ml: 10,
  },
  sites: {
    label: "I collected data from multiple distinct physical sites.",
    description:
      "Select this option if you collected data from multiple brain regions, different sections of a tissue sample, or distinct parts of an organ.",
    dependsOn: ["subjects"],
    dependsOnNotSatiatedMessage: "You must indicate that you collected data from subjects first.",
    ml: 10,
  },
  "subject-sites": {
    label: "I collected data from distinct physical sites on subjects.",
    description:
      "Select this option if the sites where data was collected correspond to specific locations or regions within the subjects, such as different anatomical regions or organs.",
    dependsOn: ["subjects", "samples", "sites"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and sites first.",
    ml: 20,
  },
  "sample-sites": {
    label: "I collected data from distinct physical sites on samples.",
    description:
      "Select this option if the sites where data was collected correspond to specific regions within the samples, such as different sections of tissue or other biological materials.",
    dependsOn: ["subjects", "samples", "sites"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and sites first.",
    ml: 20,
  },
  performances: {
    label: "I collected data from multiple performances of the same protocol.",
    description:
      "Select this option if you repeated the same protocol or procedure multiple times (such as running repeated tests or experiments) and collected data from each repetition.",
    dependsOn: ["subjects"],
    dependsOnNotSatiatedMessage: "You must indicate that you collected data from subjects first.",
    ml: 10,
  },
  "subject-performances": {
    label: "The protocol performances were run on the subjects.",
    description:
      "Select this if tasks, tests, or procedures were performed directly on subjects (e.g., humans or animals) and data was collected during these sessions.",
    dependsOn: ["subjects", "samples", "performances"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and performances first.",
    ml: 20,
  },
  "sample-performances": {
    label: "The protocol performances were run on the samples.",
    description:
      "Select this if tasks, tests, or procedures were performed directly on samples (e.g., tissues or blood) and data was collected during these sessions.",
    dependsOn: ["subjects", "samples", "performances"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and performances first.",
    ml: 20,
  },
  code: {
    label: "I used code to generate or analyze the collected data",
    description:
      "Code includes scripts, computational models, analysis pipelines, or other software used to generate, process, or analyze the data.",
    ml: 0,
  },
};

const DatasetContentSelector = () => {
  const selectedEntities = useGlobalStore((state) => state.selectedEntities);
  console.log("selectedEntities", selectedEntities);
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEntitySelection = useCallback(
    (value) => {
      const isSelected = selectedEntities.includes(value);

      if (isSelected) {
        Object.entries(contentOptionsMap).forEach(([key, option]) => {
          if (option.dependsOn?.includes(value) && selectedEntities.includes(key)) {
            toggleEntitySelection(key);
          }
        });
      }

      toggleEntitySelection(value);
    },
    [selectedEntities]
  );
  return (
    <GuidedModePage pageHeader="Dataset content">
      <GuidedModeSection>
        <Text>
          Check the boxes that apply to the data collected during your study in order to help SODA
          determine the optimal workflow to organize your dataset.
        </Text>
      </GuidedModeSection>
      <Paper shadow="sm" radius="md" p="sm" withBorder mb="md">
        <Stack spacing="xs">
          {Object.entries(contentOptionsMap).map(([key, option]) => {
            const isDisabled = option.dependsOn?.some((dep) => !selectedEntities.includes(dep));
            const isSelected = selectedEntities.includes(key) && !isDisabled;

            return (
              <Tooltip
                key={key}
                label={
                  isDisabled
                    ? option.dependsOnNotSatiatedMessage || "This option is disabled"
                    : null
                }
                disabled={!isDisabled}
                zIndex={2999}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    transition: "background 0.2s",
                    cursor: isDisabled ? "not-allowed" : null,
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  <Group position="apart" align="center" ml={option.ml}>
                    <Group>
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleEntitySelection(key)}
                      />
                      <Text size="md" fw={600}>
                        {option.label}
                      </Text>
                    </Group>
                    {option.description && (
                      <Tooltip
                        disabled={isDisabled}
                        label={expanded[key] ? "Hide description" : "Show description"}
                        zIndex={2999}
                      >
                        <ActionIcon
                          size="sm"
                          variant="transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(key);
                          }}
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
                    <SodaGreenPaper mt="sm" ml="sm">
                      <Text>{option.description}</Text>
                    </SodaGreenPaper>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </Stack>
      </Paper>
    </GuidedModePage>
  );
};

export default DatasetContentSelector;
