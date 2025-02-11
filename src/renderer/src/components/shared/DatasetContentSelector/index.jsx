import { useState, useCallback } from "react";
import { Stack, Text, Group, Tooltip, Checkbox, Collapse, ActionIcon } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import FullWidthContainer from "../../containers/FullWidthContainer";
import useGlobalStore from "../../../stores/globalStore";
import { toggleEntitySelection } from "../../../stores/slices/datasetContentSelectorSlice";

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
    ml: 20,
  },
  sites: {
    label: "I collected data from multiple distinct physical sites on subjects or samples.",
    description:
      "For example, if you collected data from multiple brain regions, different sections of a tissue sample, or distinct parts of an organ.",
    dependsOn: ["subjects"],
    dependsOnNotSatiatedMessage: "You must indicate that you collected data from subjects first.",
    ml: 20,
  },
  "subject-sites": {
    label: "I collected data from distinct physical sites on subjects.",
    description:
      "Select this option if the sites where data was collected correspond to specific locations or regions within the subjects, such as different anatomical regions or organs.",
    dependsOn: ["subjects", "samples", "sites"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and sites first.",
    ml: 40,
  },
  "sample-sites": {
    label: "I collected data from distinct physical sites on samples.",
    description:
      "Select this option if the sites where data was collected correspond to specific regions within the samples, such as different sections of tissue or other biological materials.",
    dependsOn: ["subjects", "samples", "sites"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and sites first.",
    ml: 40,
  },
  performances: {
    label: "I collected data from multiple performances of the same protocol.",
    description:
      "Select this option if you repeated the same protocol or procedure multiple times (such as running repeated tests or experiments) and collected data from each repetition.",
    dependsOn: ["subjects"],
    dependsOnNotSatiatedMessage: "You must indicate that you collected data from subjects first.",
    ml: 20,
  },
  "performances-on-subjects": {
    label: "The protocol performances were run on the subjects.",
    description:
      "Choose this if tasks, tests, or procedures were performed directly on subjects (e.g., humans or animals) and data was collected during these sessions.",
    dependsOn: ["subjects", "samples", "performances"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and performances first.",
    ml: 40,
  },
  "performances-on-samples": {
    label: "The protocol performances were run on the samples.",
    description:
      "Choose this if tasks, tests, or procedures were performed directly on samples (e.g., tissues or blood) and data was collected during these sessions.",
    dependsOn: ["subjects", "samples", "performances"],
    dependsOnNotSatiatedMessage:
      "You must indicate that you collected data from subjects, samples, and performances first.",
    ml: 40,
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

  // State to track which option descriptions are expanded.
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

  const renderOption = (key) => {
    const option = contentOptionsMap[key];
    const isDisabled = option.dependsOn?.some((dep) => !selectedEntities.includes(dep));
    const isSelected = selectedEntities.includes(key) && !isDisabled;

    return (
      <Tooltip
        key={key}
        label={isDisabled ? option.dependsOnNotSatiatedMessage : ""}
        disabled={!isDisabled}
        zIndex={2999}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: option.ml,
            borderRadius: "4px",
            border: "1px solid #ddd",
            padding: "8px",
          }}
        >
          <Group position="apart" align="center">
            <Group position="left">
              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && handleEntitySelection(key)}
              />
              <Text fw={600} size="md" style={{ color: isDisabled ? "#aaa" : "inherit" }}>
                {option.label}
              </Text>
            </Group>
            {option.description && (
              <Tooltip label={expanded[key] ? "Hide details" : "Read more"}>
                <ActionIcon
                  onClick={() => toggleExpanded(key)}
                  aria-label={expanded[key] ? "Hide details" : "Read more"}
                >
                  {expanded[key] ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          {option.description && (
            <Collapse in={expanded[key]}>
              <Text size="sm" color="dimmed" mt="xs">
                {option.description}
              </Text>
            </Collapse>
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <FullWidthContainer>
      <Stack spacing="sm">{Object.keys(contentOptionsMap).map((key) => renderOption(key))}</Stack>
    </FullWidthContainer>
  );
};

export default DatasetContentSelector;
